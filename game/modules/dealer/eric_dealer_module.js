import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const MODEL_URL = new URL('../../assets/models/eric/eric.fbx', import.meta.url).href;
const IDLE_URL = new URL('../../assets/models/anims/eric_idle.fbx', import.meta.url).href;
const BASE_URL = new URL('../../assets/models/eric/rp_eric_rigged_001_dif.jpg', import.meta.url).href;
const NORMAL_URL = new URL('../../assets/models/eric/rp_eric_rigged_001_norm.jpg', import.meta.url).href;
const GLOSS_URL = new URL('../../assets/models/eric/rp_eric_rigged_001_gloss.jpg', import.meta.url).href;

const DEFAULTS = Object.freeze({
  scale: 0.0055,
  y: 0.00268026492655681,
  z: 0.71,
  x: -0.10,
  shoulderX: 0.55,
  shoulderZ: -0.48,
  elbowX: 0.36,
  wristZ: -0.45,
  speed: 1.35,
});

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function smooth(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
function pulse01(p) {
  if (p < 0.40) return smooth(p / 0.40);
  if (p < 0.57) return 1;
  return 1 - smooth((p - 0.57) / 0.43);
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
    this.propGroup = new THREE.Group();
    this.propGroup.name = 'SVR_EricDealerProps';
    scene.add(this.propGroup);

    this.params = { ...DEFAULTS, ...options };
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
    this.deckProp = null;
    this.dealCardProp = null;
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
      this.createCardProps();

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
      this.updateProps(0, 0);
      this.dispatchEvent(new CustomEvent('loaded', { detail: this.getRigReport() }));
      return this;
    } catch (error) {
      this.loadError = String(error?.message || error);
      this.dispatchEvent(new CustomEvent('loaderror', { detail: { error: this.loadError } }));
      throw error;
    }
  }

  createCardProps() {
    while (this.propGroup.children.length) this.propGroup.remove(this.propGroup.children[0]);
    const edge = new THREE.MeshPhysicalMaterial({ color: 0xf7f3ed, roughness: 0.42, metalness: 0 });
    const back = new THREE.MeshPhysicalMaterial({ color: 0x32114a, roughness: 0.34, metalness: 0.02, clearcoat: 0.16 });
    this.deckProp = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.018, 0.089), [edge, edge, edge, edge, edge, back]);
    this.deckProp.name = 'Eric_LeftHand_Deck';
    this.deckProp.castShadow = true;
    this.propGroup.add(this.deckProp);

    this.dealCardProp = new THREE.Mesh(new THREE.BoxGeometry(0.063, 0.0022, 0.088), [edge, edge, edge, edge, edge, back]);
    this.dealCardProp.name = 'Eric_RightHand_DealCard';
    this.dealCardProp.castShadow = true;
    this.dealCardProp.visible = false;
    this.propGroup.add(this.dealCardProp);
  }

  applyTransform() {
    this.group.position.set(this.params.x, this.params.y, this.params.z);
    this.group.scale.setScalar(this.params.scale);
    this.group.rotation.set(0, Math.PI, 0);
    this.group.updateMatrixWorld(true);
  }
  setParams(next = {}) { Object.assign(this.params, next); this.applyTransform(); }
  resetVisible() {
    this.setParams(DEFAULTS);
    this.setMode('idle');
    if (this.loaded) this.groundToFloor(0);
    return { ...this.params };
  }
  setDebugMaterial(enabled) {
    this.debugMaterial = Boolean(enabled);
    if (!this.model) return this.debugMaterial;
    this.model.traverse((obj) => {
      if (!obj.isMesh) return;
      if (this.debugMaterial) obj.material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
      else {
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
    return box.isEmpty() ? null : box;
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
    this.lastDealSerial = -1;
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

  applyReadyPose() {
    const leftArm = this.getBone('leftarm');
    const leftForeArm = this.getBone('leftforearm');
    const leftHand = this.getBone('lefthand');
    const rightArm = this.getBone('rightarm');
    const rightForeArm = this.getBone('rightforearm');
    const rightHand = this.getBone('righthand');
    this.applyDelta(leftArm, 0.30, 0.05, 0.34);
    this.applyDelta(leftForeArm, 0.56, 0.02, -0.10);
    this.applyDelta(leftHand, 0.06, 0, 0.14);
    this.applyDelta(rightArm, 0.27, -0.05, -0.31);
    this.applyDelta(rightForeArm, 0.50, -0.02, 0.10);
    this.applyDelta(rightHand, 0.05, 0, -0.12);
  }

  getHandWorldPosition(side = 'right') {
    const bone = this.getBone(side === 'left' ? 'lefthand' : 'righthand');
    if (!bone) return null;
    bone.updateWorldMatrix(true, false);
    return bone.getWorldPosition(new THREE.Vector3());
  }

  getDealOrigin() {
    const hand = this.getHandWorldPosition('right');
    if (!hand) return new THREE.Vector3(this.params.x, 0.78, this.params.z - 0.12);
    const towardTable = new THREE.Vector3(0, hand.y - 0.025, 0).sub(hand).normalize().multiplyScalar(0.055);
    return hand.clone().add(towardTable);
  }

  updateProps(reach = 0, p = 0) {
    if (!this.deckProp || !this.dealCardProp) return;
    const left = this.getHandWorldPosition('left');
    const right = this.getHandWorldPosition('right');
    if (left) {
      this.deckProp.position.copy(left).add(new THREE.Vector3(0, 0.018, -0.018));
      this.deckProp.rotation.set(0.04, Math.PI * 0.02, -0.08);
      this.deckProp.visible = true;
    }
    if (right) {
      this.dealCardProp.position.copy(right).add(new THREE.Vector3(0, 0.012, -0.025));
      this.dealCardProp.rotation.set(0.02, 0, 0.04);
      this.dealCardProp.visible = this.mode !== 'idle' && reach > 0.08 && p < 0.50;
    } else this.dealCardProp.visible = false;
  }

  update(dt, elapsed) {
    if (!this.loaded || this.paused) return;
    if (this.mixer) this.mixer.update(dt);
    this.applyReadyPose();

    if (this.mode === 'idle') {
      this.updateProps(0, 0);
      return;
    }

    const duration = Math.max(0.35, this.params.speed);
    const t = this.mode === 'deal-once' ? Math.max(0, elapsed - this.onceStart) : elapsed;
    const serial = Math.floor(t / duration);
    if (this.mode === 'deal-once' && serial > 0) {
      this.mode = 'idle';
      this.updateProps(0, 0);
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

    this.applyDelta(rightArm, this.params.shoulderX * 0.62 * reach, 0.16 * sweep * reach, this.params.shoulderZ * 0.58 * reach);
    this.applyDelta(rightForeArm, this.params.elbowX * 0.80 * reach, -0.12 * sweep * reach, 0.20 * reach);
    this.applyDelta(rightHand, 0.18 * reach, 0.14 * sweep * reach, this.params.wristZ * 0.72 * reach);
    this.applyDelta(spine2, 0.02 * reach, -0.045 * sweep * reach, 0);
    this.applyDelta(head, 0.012 * reach, -0.055 * sweep * reach, 0);
    this.updateProps(reach, p);

    if (p >= 0.48 && p <= 0.57 && serial !== this.lastDealSerial) {
      this.lastDealSerial = serial;
      const origin = this.getDealOrigin();
      this.dispatchEvent(new CustomEvent('deal', { detail: { seatIndex, serial, origin: origin.toArray() } }));
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
      readyPose: true,
      deckProp: Boolean(this.deckProp),
      dealCardProp: Boolean(this.dealCardProp),
      dealOrigin: this.getDealOrigin().toArray(),
      debugMaterial: this.debugMaterial,
      loadError: this.loadError,
      feetY: this.getFeetY(),
      lastGround: this.lastGround,
    };
  }
}
