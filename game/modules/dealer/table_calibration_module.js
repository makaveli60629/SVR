import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TABLE_URL = new URL('../../assets/models/table.glb', import.meta.url).href;
const STORAGE_KEY = 'svrDealerLabTablePresetPhase424';
const DEFAULTS = { tableY: 0.62, feltDrop: 0.014, innerMargin: 0.125, collisionDrop: 0.02, cardLift: 0.008 };

function disposeObject(obj) {
  obj.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.());
    else child.material?.dispose?.();
  });
}
function makeFeltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a4a35';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 9000; i++) {
    const v = 55 + Math.floor(Math.random() * 70);
    ctx.fillStyle = `rgba(${20 + v / 8},${65 + v / 2.3},${45 + v / 3.5},${0.025 + Math.random() * 0.045})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 2.2);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export class TableCalibrationModule extends EventTarget {
  constructor(scene, options = {}) {
    super();
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'SVR_TableCalibrationLab';
    scene.add(this.group);
    this.params = { ...DEFAULTS, ...options };
    this.guidesVisible = true;
    this.presentationVisible = true;
    this.table = null;
    this.guideGroup = new THREE.Group();
    this.guideGroup.name = 'SVR_TableCalibrationGuides';
    this.presentationGroup = new THREE.Group();
    this.presentationGroup.name = 'SVR_TablePresentationSurfaces';
    this.feltTexture = makeFeltTexture();
    this.group.add(this.presentationGroup);
    this.group.add(this.guideGroup);
  }

  async load() {
    const gltf = await new GLTFLoader().loadAsync(TABLE_URL);
    this.table = gltf.scene;
    this.table.name = 'SVR_TableGLB_Lab';
    this.table.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.frustumCulled = false;
      const name = `${obj.name} ${obj.material?.name || ''}`.toLowerCase();
      if (/felt|cloth|fabric/.test(name)) {
        obj.material = new THREE.MeshPhysicalMaterial({ map: this.feltTexture, color: 0x0c5b40, roughness: 0.92, metalness: 0, sheen: 0.25, sheenColor: new THREE.Color(0x2d8d68), side: THREE.DoubleSide });
      } else if (/rail|leather|pad|cushion/.test(name)) {
        obj.material = new THREE.MeshPhysicalMaterial({ color: 0x160d1f, roughness: 0.32, metalness: 0.08, clearcoat: 0.28, clearcoatRoughness: 0.32, side: THREE.DoubleSide });
      } else {
        const sourceColor = obj.material?.color?.clone?.() || new THREE.Color(0x30283a);
        sourceColor.multiplyScalar(0.82);
        obj.material = new THREE.MeshPhysicalMaterial({ color: sourceColor, roughness: 0.46, metalness: 0.18, clearcoat: 0.16, clearcoatRoughness: 0.42, side: THREE.DoubleSide });
      }
    });
    const box = new THREE.Box3().setFromObject(this.table);
    const size = box.getSize(new THREE.Vector3());
    const width = Math.max(size.x, size.z, 0.001);
    this.table.scale.setScalar(2.55 / width);
    const box2 = new THREE.Box3().setFromObject(this.table);
    const center = box2.getCenter(new THREE.Vector3());
    this.table.position.x -= center.x;
    this.table.position.z -= center.z;
    this.group.add(this.table);
    this.apply();
    this.dispatchEvent(new CustomEvent('loaded'));
    return this;
  }

  setParams(next = {}) { Object.assign(this.params, next); this.apply(); }
  apply() {
    if (this.table) this.table.position.y = this.params.tableY - 0.79;
    this.rebuildPresentation();
    this.rebuildGuides();
  }
  clearGroup(group) {
    while (group.children.length) {
      const child = group.children.pop();
      disposeObject(child);
    }
  }
  rebuildPresentation() {
    this.clearGroup(this.presentationGroup);
    const railTop = this.params.tableY;
    const feltY = railTop - this.params.feltDrop;
    const margin = this.params.innerMargin;
    const felt = new THREE.Mesh(
      new THREE.CircleGeometry(1, 96),
      new THREE.MeshPhysicalMaterial({ map: this.feltTexture, color: 0x0b5b3f, roughness: 0.94, metalness: 0, sheen: 0.34, sheenColor: new THREE.Color(0x42aa7e), side: THREE.DoubleSide })
    );
    felt.name = 'SVR_PolishedFelt';
    felt.rotation.x = -Math.PI / 2;
    felt.scale.set(Math.max(0.83, 1.245 - margin), Math.max(0.46, 0.665 - margin * 0.52), 1);
    felt.position.y = feltY;
    felt.receiveShadow = true;
    this.presentationGroup.add(felt);

    const rail = new THREE.Mesh(
      new THREE.RingGeometry(0.765, 0.935, 96),
      new THREE.MeshPhysicalMaterial({ color: 0x190d22, roughness: 0.27, metalness: 0.06, clearcoat: 0.38, clearcoatRoughness: 0.25, side: THREE.DoubleSide })
    );
    rail.name = 'SVR_PolishedRail';
    rail.rotation.x = -Math.PI / 2;
    rail.scale.set(1.53, 0.79, 1);
    rail.position.y = railTop + 0.003;
    rail.receiveShadow = true;
    this.presentationGroup.add(rail);

    const trim = new THREE.Mesh(
      new THREE.RingGeometry(0.935, 0.955, 96),
      new THREE.MeshPhysicalMaterial({ color: 0x6f4a86, roughness: 0.24, metalness: 0.58, clearcoat: 0.42, clearcoatRoughness: 0.2, side: THREE.DoubleSide })
    );
    trim.name = 'SVR_TableTrim';
    trim.rotation.x = -Math.PI / 2;
    trim.scale.set(1.53, 0.79, 1);
    trim.position.y = railTop + 0.005;
    this.presentationGroup.add(trim);
    this.presentationGroup.visible = this.presentationVisible;
  }
  rebuildGuides() {
    this.clearGroup(this.guideGroup);
    const railTop = this.params.tableY;
    const feltY = railTop - this.params.feltDrop;
    const collisionY = railTop - this.params.collisionDrop;
    const cardY = collisionY + this.params.cardLift;
    const margin = this.params.innerMargin;
    const felt = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: 0x1bcf86, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    felt.name = 'TargetFeltSurface'; felt.rotation.x = -Math.PI / 2; felt.scale.set(Math.max(0.75, 1.23 - margin), Math.max(0.42, 0.64 - margin * 0.5), 1); felt.position.y = feltY + 0.002; this.guideGroup.add(felt);
    const rail = new THREE.Mesh(new THREE.RingGeometry(0.77, 0.91, 64), new THREE.MeshBasicMaterial({ color: 0xb26cff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
    rail.name = 'RailInnerWallGuide'; rail.rotation.x = -Math.PI / 2; rail.scale.set(1.52, 0.78, 1); rail.position.y = railTop + 0.009; this.guideGroup.add(rail);
    const collision = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0xffcf70, wireframe: true, transparent: true, opacity: 0.38, depthWrite: false }));
    collision.name = 'PhysicsCollisionSurface'; collision.rotation.x = -Math.PI / 2; collision.scale.set(Math.max(0.72, 1.21 - margin), Math.max(0.40, 0.62 - margin * 0.5), 1); collision.position.y = collisionY; this.guideGroup.add(collision);
    const cardPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.42), new THREE.MeshBasicMaterial({ color: 0x55c8ff, wireframe: true, transparent: true, opacity: 0.52, depthWrite: false, side: THREE.DoubleSide }));
    cardPlane.name = 'CardLandingPlane'; cardPlane.rotation.x = -Math.PI / 2; cardPlane.position.set(0, cardY, -0.10); this.guideGroup.add(cardPlane);
    this.guideGroup.visible = this.guidesVisible;
  }
  toggleGuides(force) { this.guidesVisible = typeof force === 'boolean' ? force : !this.guidesVisible; this.guideGroup.visible = this.guidesVisible; return this.guidesVisible; }
  setPresentationVisible(visible) { this.presentationVisible = Boolean(visible); this.presentationGroup.visible = this.presentationVisible; }
  getSurfaceY() { return this.params.tableY - this.params.collisionDrop + this.params.cardLift; }
  getPreset() {
    const p = { ...this.params };
    return { version: 2, units: 'meters', table: p, derived: { feltY: +(p.tableY - p.feltDrop).toFixed(4), collisionY: +(p.tableY - p.collisionDrop).toFixed(4), cardLandingY: +(p.tableY - p.collisionDrop + p.cardLift).toFixed(4), innerWallMarginInches: +(p.innerMargin / 0.0254).toFixed(2), feltDropInches: +(p.feltDrop / 0.0254).toFixed(2) } };
  }
  saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getPreset())); }
  loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const preset = JSON.parse(raw);
      if (preset?.table) { this.setParams(preset.table); return true; }
    } catch (error) { console.warn('[SVR Dealer Lab] Failed to load table preset', error); }
    return false;
  }
  reset() { this.params = { ...DEFAULTS }; localStorage.removeItem(STORAGE_KEY); this.apply(); }
}
