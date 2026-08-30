import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const MODEL_URL = new URL('../../assets/models/eric/eric.fbx', import.meta.url).href;
const IDLE_URL = new URL('../../assets/models/anims/eric_idle.fbx', import.meta.url).href;
const BASE_URL = new URL('../../assets/models/eric/rp_eric_rigged_001_dif.jpg', import.meta.url).href;
const NORMAL_URL = new URL('../../assets/models/eric/rp_eric_rigged_001_norm.jpg', import.meta.url).href;
const GLOSS_URL = new URL('../../assets/models/eric/rp_eric_rigged_001_gloss.jpg', import.meta.url).href;

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function smooth(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
function pulse01(p) {
  if (p < 0.44) return smooth(p / 0.44);
  if (p < 0.61) return 1;
  return 1 - smooth((p - 0.61) / 0.39);
}
function canonicalBoneName(name = '') {
  return name.replace(/^.*?(?=(Hips|Spine|Neck|Head|Left|Right))/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}
async function optionalTexture(loader, url, srgb = false) {
  try {
    const texture = await loader.loadAsync(url);
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  } catch (error) {
    console.warn('[SVR Dealer Lab] Optional Eric texture unavailable', url, error);
    return null;
  }
}

export class EricDealerModule extends EventTarget {
  constructor(scene, options = {}) {
    super();
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'SVR_EricDealerLab';
    scene.add(this.group);
    this.params = {
      scale: options.scale ?? 0.0157,
      y: options.y ?? 0.3,
      z: options.z ?? 1.5,
      x: options.x ?? -0.42,
      shoulderX: options.shoulderX ?? 0.55,
      shoulderZ: options.shoulderZ ?? -0.48,
      elbowX: options.elbowX ?? 0.36,
      wristZ: options.wristZ ?? -0.45,
      speed: options.speed ?? 1.35,
    };
    this.loaded = false;
    this.loadError = null;
    this.mode = 'idle';
    this.paused = false;
    this.debugMaterial = false;
    this.model = null;
    this.mixer = null;
    this.idleAction = null;
    this.bones = new Map();
    this.meshMaterials = new Map();
    this.lastDealSerial = -1;
    this.onceStart = 0;
    this.lastGround = null;
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._textureLoader = new THREE.TextureLoader();
    this.applyTransform();
  }

  async load() {
    this.loadError = null;
    try {
      const [base, normal, gloss] = await Promise.all([
        optionalTexture(this._textureLoader, BASE_URL, true),
        optionalTexture(this._textureLoader, NORMAL_URL),
        optionalTexture(this._textureLoader, GLOSS_URL),
      ]);
      const model = await new FBXLoader().loadAsync(MODEL_URL);
      model.name = 'Eric_Dealer_Model';
      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.frustumCulled = false;
          obj.castShadow = true;
          obj.receiveShadow = true;
          const material = new THREE.MeshPhysicalMaterial({
            map: base,
            normalMap: normal,
            color: base ? 0xffffff : 0xb99a86,
            roughness: gloss ? 0.48 : 0.62,
            metalness: 0.01,
            clearcoat: 0.05,
            clearcoatRoughness: 0.7,
            side: THREE.DoubleSide,
          });
          obj.material = material;
          this.meshMaterials.set(obj.uuid, material);
        }
        if (obj.isBone) this.bones.set(canonicalBoneName(obj.name), obj);
      });
      this.model = model;
      this.group.add(model);
      this.applyTransform();

      try {
        const idleAsset = await new FBXLoader().loadAsync(IDLE_URL);
        if (idleAsset.animations?.length) {
          this.mixer = new THREE.AnimationMixer(model);
          this.idleAction = this.mixer.clipAction(idleAsset.animations[0]);
          this.idleAction.setLoop(THREE.LoopRepeat, Infinity);
          this.idleAction.play();
          this.mixer.update(0);
        }
      } catch (error) {
        console.warn('[SVR Dealer Lab] Eric idle clip unavailable; procedural motion remains active.', error);
      }

      this.loaded = true;
      this.dispatchEvent(new CustomEvent('loaded', { detail: this.getRigReport() }));
      return this;
    } catch (error) {
      this.loadError = String(error?.message || error);
      this.dispatchEvent(new CustomEvent('loaderror', { detail: { error: this.loadError } }));
      throw error;
    }
  }

  applyTransform() {
    this.group.position.set(this.params.x, this.params.y, this.params.z);
    this.group.scale.setScalar(this.params.scale);
    this.group.rotation.set(0, Math.PI, 0);
    this.group.updateMatrixWorld(true);
  }
  setParams(next = {}) { Object.assign(this.params, next); this.applyTransform(); }
  resetVisible() {
    this.setParams({ scale: 0.0157, x: -0.42, y: 0.3, z: 1.5, shoulderX: 0.55, shoulderZ: -0.48, elbowX: 0.36, wristZ: -0.45, speed: 1.35 });
    this.setMode('idle');
    if (this.loaded) this.groundToFloor(0);
    return { ...this.params };
  }
  setDebugMaterial(enabled) {
    this.debugMaterial = Boolean(enabled);
    if (!this.model) return this.debugMaterial;
    this.model.traverse((obj) => {
      if (!obj.isMesh) return;
      if (this.debugMaterial) {
        obj.material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
      } else {
        const original = this.meshMaterials.get(obj.uuid);
        if (original) obj.material = original;
      }
    });
    return this.debugMaterial;
  }
  getBounds() {
    if (!this.model) return null;
    this.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.group);
    if (box.isEmpty()) return null;
    return box;
  }
  getFeetY() {
    const box = this.getBounds();
    return box ? box.min.y : null;
  }
  groundToFloor(floorY = 0) {
    if (!this.model) return null;
    const before = this.getBounds();
    if (!before) return null;
    const delta = Number(floorY) - before.min.y;
    if (!Number.isFinite(delta)) return null;
    this.params.y += delta;
    this.applyTransform();
    const after = this.getBounds();
    this.lastGround = {
      floorY: Number(floorY),
      delta: +delta.toFixed(5),
      dealerY: +this.params.y.toFixed(5),
      feetY: after ? +after.min.y.toFixed(5) : null,
    };
    this.dispatchEvent(new CustomEvent('groundchange', { detail: { ...this.lastGround } }));
    return { ...this.lastGround };
  }
  setMode(mode) {
    this.mode = mode;
    this.paused = false;
    if (this.idleAction) this.idleAction.paused = false;
    if (mode === 'deal-once') this.onceStart = performance.now() * 0.001;
    this.dispatchEvent(new CustomEvent('modechange', { detail: { mode } }));
  }
  togglePause() {
    this.paused = !this.paused;
    if (this.idleAction) this.idleAction.paused = this.paused;
    return this.paused;
  }
  getBone(part) {
    const key = [...this.bones.keys()].find(k => k.endsWith(part.toLowerCase()));
    return key ? this.bones.get(key) : null;
  }
  applyDelta(bone, x = 0, y = 0, z = 0) {
    if (!bone) return;
    this._e.set(x, y, z, 'XYZ');
    this._q.setFromEuler(this._e);
    bone.quaternion.multiply(this._q);
  }
  update(dt, elapsed) {
    if (!this.loaded || this.paused) return;
    if (this.mixer) this.mixer.update(dt);
    if (this.mode === 'idle') return;
    const duration = Math.max(0.35, this.params.speed);
    const t = this.mode === 'deal-once' ? Math.max(0, elapsed - this.onceStart) : elapsed;
    const serial = Math.floor(t / duration);
    if (this.mode === 'deal-once' && serial > 0) {
      this.mode = 'idle';
      this.dispatchEvent(new CustomEvent('modechange', { detail: { mode: 'idle' } }));
      return;
    }
    const p = (t % duration) / duration;
    const reach = pulse01(p);
    const seatIndex = serial % 6;
    const sweep = (seatIndex - 2.5) / 2.5;
    const rightArm = this.getBone('rightarm');
    const rightForeArm = this.getBone('rightforearm');
    const rightHand = this.getBone('righthand');
    const spine2 = this.getBone('spine2');
    const head = this.getBone('head');
    this.applyDelta(rightArm, this.params.shoulderX * reach, 0.12 * sweep * reach, this.params.shoulderZ * reach);
    this.applyDelta(rightForeArm, this.params.elbowX * reach, -0.08 * sweep * reach, 0.16 * reach);
    this.applyDelta(rightHand, 0.12 * reach, 0.10 * sweep * reach, this.params.wristZ * reach);
    this.applyDelta(spine2, 0, -0.035 * sweep * reach, 0);
    this.applyDelta(head, 0.015 * reach, -0.05 * sweep * reach, 0);
    if (p >= 0.49 && p <= 0.61 && serial !== this.lastDealSerial) {
      this.lastDealSerial = serial;
      this.dispatchEvent(new CustomEvent('deal', { detail: { seatIndex, serial } }));
    }
  }
  getRigReport() {
    const wanted = ['hips','spine','spine1','spine2','neck','head','leftarm','leftforearm','lefthand','rightarm','rightforearm','righthand','leftupleg','leftleg','rightupleg','rightleg'];
    const found = {};
    for (const part of wanted) found[part] = Boolean(this.getBone(part));
    return {
      model: MODEL_URL,
      idle: IDLE_URL,
      diffuse: BASE_URL,
      normal: NORMAL_URL,
      gloss: GLOSS_URL,
      boneCount: this.bones.size,
      bones: found,
      textured: Boolean(this.meshMaterials.size),
      mixer: Boolean(this.mixer),
      debugMaterial: this.debugMaterial,
      loadError: this.loadError,
      feetY: this.getFeetY(),
      lastGround: this.lastGround,
    };
  }
}
