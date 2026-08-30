import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const ASSET_ROOT = new URL('../../assets/models/eric/', import.meta.url);
const MODEL_URL = new URL('eric.fbx', ASSET_ROOT).href;
const IDLE_URL = new URL('eric_idle.fbx', ASSET_ROOT).href;
const BASE_URL = new URL('eric_basecolor.png', ASSET_ROOT).href;
const NORMAL_URL = new URL('eric_normal.png', ASSET_ROOT).href;
const ROUGH_URL = new URL('eric_roughness.png', ASSET_ROOT).href;
const EMISSIVE_URL = new URL('eric_emissive.png', ASSET_ROOT).href;

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function smooth(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
function pulse01(p) {
  if (p < 0.44) return smooth(p / 0.44);
  if (p < 0.61) return 1;
  return 1 - smooth((p - 0.61) / 0.39);
}

function canonicalBoneName(name = '') {
  return name
    .replace(/^.*?(?=(Hips|Spine|Neck|Head|Left|Right))/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

export class EricDealerModule extends EventTarget {
  constructor(scene, options = {}) {
    super();
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'SVR_EricDealerLab';
    scene.add(this.group);

    this.params = {
      scale: options.scale ?? 0.0145,
      y: options.y ?? 1.34,
      z: options.z ?? -1.67,
      x: options.x ?? 0,
      shoulderX: options.shoulderX ?? -0.34,
      shoulderZ: options.shoulderZ ?? -0.48,
      elbowX: options.elbowX ?? -0.48,
      wristZ: options.wristZ ?? -0.26,
      speed: options.speed ?? 1.05,
    };

    this.loaded = false;
    this.mode = 'idle';
    this.paused = false;
    this.model = null;
    this.mixer = null;
    this.idleAction = null;
    this.bones = new Map();
    this.lastDealSerial = -1;
    this.onceStart = 0;
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._textureLoader = new THREE.TextureLoader();
    this.applyTransform();
  }

  async load() {
    const [base, normal, rough, emissive] = await Promise.all([
      this._textureLoader.loadAsync(BASE_URL),
      this._textureLoader.loadAsync(NORMAL_URL),
      this._textureLoader.loadAsync(ROUGH_URL),
      this._textureLoader.loadAsync(EMISSIVE_URL).catch(() => null),
    ]);
    base.colorSpace = THREE.SRGBColorSpace;

    const model = await new FBXLoader().loadAsync(MODEL_URL);
    model.name = 'Eric_Dealer_Model';
    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.frustumCulled = false;
        obj.castShadow = false;
        obj.receiveShadow = false;
        obj.material = new THREE.MeshStandardMaterial({
          map: base,
          normalMap: normal,
          roughnessMap: rough,
          emissiveMap: emissive,
          emissive: emissive ? new THREE.Color(0x17131f) : new THREE.Color(0x000000),
          emissiveIntensity: emissive ? 0.32 : 0,
          roughness: 0.72,
          metalness: 0.05,
          side: THREE.FrontSide,
        });
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
      }
    } catch (error) {
      console.warn('[SVR Dealer Lab] Eric idle clip unavailable; procedural motion remains active.', error);
    }

    this.loaded = true;
    this.dispatchEvent(new CustomEvent('loaded', { detail: this.getRigReport() }));
    return this;
  }

  applyTransform() {
    this.group.position.set(this.params.x, this.params.y, this.params.z);
    this.group.scale.setScalar(this.params.scale);
    this.group.rotation.set(0, Math.PI, 0);
  }

  setParams(next = {}) {
    Object.assign(this.params, next);
    this.applyTransform();
  }

  setMode(mode) {
    this.mode = mode;
    this.paused = false;
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
    return { model: MODEL_URL, idle: IDLE_URL, boneCount: this.bones.size, bones: found, textured: true, mixer: Boolean(this.mixer) };
  }
}
