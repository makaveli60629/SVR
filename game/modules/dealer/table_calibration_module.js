import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TABLE_URL = new URL('../../assets/models/table.glb', import.meta.url).href;
const STORAGE_KEY = 'svrDealerLabTablePresetV1';

function disposeObject(obj) {
  obj.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.());
    else child.material?.dispose?.();
  });
}

export class TableCalibrationModule extends EventTarget {
  constructor(scene, options = {}) {
    super();
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'SVR_TableCalibrationLab';
    scene.add(this.group);

    this.params = {
      tableY: options.tableY ?? 0.79,
      feltDrop: options.feltDrop ?? 0.055,
      innerMargin: options.innerMargin ?? 0.115,
      collisionDrop: options.collisionDrop ?? 0.062,
      cardLift: options.cardLift ?? 0.008,
    };
    this.guidesVisible = true;
    this.table = null;
    this.guideGroup = new THREE.Group();
    this.guideGroup.name = 'SVR_TableCalibrationGuides';
    this.group.add(this.guideGroup);
  }

  async load() {
    const gltf = await new GLTFLoader().loadAsync(TABLE_URL);
    this.table = gltf.scene;
    this.table.name = 'SVR_TableGLB_Lab';
    this.table.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = true;
        obj.frustumCulled = false;
      }
    });

    const box = new THREE.Box3().setFromObject(this.table);
    const size = box.getSize(new THREE.Vector3());
    const width = Math.max(size.x, size.z, 0.001);
    const targetWidth = 2.55;
    const scale = targetWidth / width;
    this.table.scale.setScalar(scale);
    const box2 = new THREE.Box3().setFromObject(this.table);
    const center = box2.getCenter(new THREE.Vector3());
    this.table.position.x -= center.x;
    this.table.position.z -= center.z;
    this.group.add(this.table);
    this.rebuildGuides();
    this.apply();
    this.dispatchEvent(new CustomEvent('loaded'));
    return this;
  }

  setParams(next = {}) {
    Object.assign(this.params, next);
    this.apply();
  }

  apply() {
    if (this.table) this.table.position.y = this.params.tableY - 0.79;
    this.rebuildGuides();
  }

  rebuildGuides() {
    while (this.guideGroup.children.length) {
      const child = this.guideGroup.children.pop();
      disposeObject(child);
    }

    const railTop = this.params.tableY;
    const feltY = railTop - this.params.feltDrop;
    const collisionY = railTop - this.params.collisionDrop;
    const cardY = collisionY + this.params.cardLift;
    const margin = this.params.innerMargin;

    const felt = new THREE.Mesh(
      new THREE.CircleGeometry(1, 64),
      new THREE.MeshBasicMaterial({ color: 0x1bcf86, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide })
    );
    felt.name = 'TargetFeltSurface';
    felt.rotation.x = -Math.PI / 2;
    felt.scale.set(Math.max(0.75, 1.23 - margin), Math.max(0.42, 0.64 - margin * 0.5), 1);
    felt.position.y = feltY;
    this.guideGroup.add(felt);

    const rail = new THREE.Mesh(
      new THREE.RingGeometry(0.77, 0.91, 64),
      new THREE.MeshBasicMaterial({ color: 0xb26cff, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false })
    );
    rail.name = 'RailInnerWallGuide';
    rail.rotation.x = -Math.PI / 2;
    rail.scale.set(1.52, 0.78, 1);
    rail.position.y = railTop + 0.002;
    this.guideGroup.add(rail);

    const collision = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      new THREE.MeshBasicMaterial({ color: 0xffcf70, wireframe: true, transparent: true, opacity: 0.42, depthWrite: false })
    );
    collision.name = 'PhysicsCollisionSurface';
    collision.rotation.x = -Math.PI / 2;
    collision.scale.set(Math.max(0.72, 1.21 - margin), Math.max(0.40, 0.62 - margin * 0.5), 1);
    collision.position.y = collisionY;
    this.guideGroup.add(collision);

    const cardPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x55c8ff, wireframe: true, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })
    );
    cardPlane.name = 'CardLandingPlane';
    cardPlane.rotation.x = -Math.PI / 2;
    cardPlane.position.set(0, cardY, -0.10);
    this.guideGroup.add(cardPlane);

    this.guideGroup.visible = this.guidesVisible;
  }

  toggleGuides() {
    this.guidesVisible = !this.guidesVisible;
    this.guideGroup.visible = this.guidesVisible;
    return this.guidesVisible;
  }

  getSurfaceY() {
    return this.params.tableY - this.params.collisionDrop + this.params.cardLift;
  }

  getPreset() {
    const p = { ...this.params };
    return {
      version: 1,
      units: 'meters',
      table: p,
      derived: {
        feltY: +(p.tableY - p.feltDrop).toFixed(4),
        collisionY: +(p.tableY - p.collisionDrop).toFixed(4),
        cardLandingY: +(p.tableY - p.collisionDrop + p.cardLift).toFixed(4),
        innerWallMarginInches: +(p.innerMargin / 0.0254).toFixed(2),
        feltDropInches: +(p.feltDrop / 0.0254).toFixed(2),
      },
    };
  }

  saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getPreset()));
  }

  loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const preset = JSON.parse(raw);
      if (preset?.table) {
        this.setParams(preset.table);
        return true;
      }
    } catch (error) {
      console.warn('[SVR Dealer Lab] Failed to load table preset', error);
    }
    return false;
  }

  reset() {
    this.params = { tableY: 0.79, feltDrop: 0.055, innerMargin: 0.115, collisionDrop: 0.062, cardLift: 0.008 };
    localStorage.removeItem(STORAGE_KEY);
    this.apply();
  }
}
