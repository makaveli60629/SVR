import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TABLE_URL = new URL('../../assets/models/table.glb', import.meta.url).href;
const LOGO_URL = new URL('../../../logo.png', import.meta.url).href;
const STORAGE_KEY = 'svrDealerLabTablePresetPhase427';
const DEFAULTS = { tableY: 0.62, feltDrop: 0.014, innerMargin: 0.125, collisionDrop: 0.02, cardLift: 0.008 };
const CARD_THICKNESS = 0.0025;
const BETTING_LINE = Object.freeze({ radiusX: 0.88, radiusZ: 0.39 });

function disposeObject(obj) {
  obj.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.());
    else child.material?.dispose?.();
  });
}

function makeFeltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#073d2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 12000; i++) {
    const v = 45 + Math.floor(Math.random() * 85);
    ctx.fillStyle = `rgba(${16 + v / 8},${58 + v / 2.25},${38 + v / 3.3},${0.025 + Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.8, 2.3);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 6;
  return texture;
}

function makeNativeFeltMaterial(texture) {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    color: 0x0a5a40,
    roughness: 0.95,
    metalness: 0,
    sheen: 0.32,
    sheenColor: new THREE.Color(0x46a982),
    clearcoat: 0.015,
    clearcoatRoughness: 0.92,
    side: THREE.DoubleSide
  });
}

function makeLeatherMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0a090d,
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.42,
    clearcoatRoughness: 0.3,
    sheen: 0.14,
    sheenColor: new THREE.Color(0x6d3f8f),
    side: THREE.DoubleSide
  });
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawSponsorBadge(ctx, cx, cy, label, subtitle) {
  const w = 176, h = 86;
  roundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 22);
  ctx.fillStyle = 'rgba(5,3,10,.72)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(178,112,255,.92)';
  ctx.stroke();

  ctx.save();
  ctx.translate(cx - 58, cy);
  ctx.strokeStyle = '#d7b7ff';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(0, i * 4, 18 - Math.abs(i) * 2.5, 7, i * 0.18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillText(label, cx - 30, cy - 3);
  ctx.fillStyle = '#d7b7ff';
  ctx.font = '700 12px Arial, sans-serif';
  ctx.fillText(subtitle, cx - 30, cy + 20);
}

function makeBrandingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const drawBase = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(1, 0.54);
    ctx.beginPath();
    ctx.arc(0, 0, 360, 0, Math.PI * 2);
    ctx.restore();
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255,255,255,.93)';
    ctx.stroke();

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(1, 0.54);
    ctx.beginPath();
    ctx.arc(0, 0, 348, 0, Math.PI * 2);
    ctx.restore();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(156,92,255,.75)';
    ctx.stroke();

    drawSponsorBadge(ctx, 192, 256, 'REIKI', 'SPONSOR');
    drawSponsorBadge(ctx, 832, 256, 'SPONSOR', 'RESERVED');
    texture.needsUpdate = true;
  };

  drawBase();
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    drawBase();
    const maxW = 310, maxH = 190;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1);
    const w = image.width * scale, h = image.height * scale;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(image, 512 - w / 2, 256 - h / 2, w, h);
    ctx.restore();
    texture.needsUpdate = true;
  };
  image.onerror = () => {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 62px Arial, sans-serif';
    ctx.fillText('SVR POKER', 512, 270);
    texture.needsUpdate = true;
  };
  image.src = LOGO_URL;
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
    this.guidesVisible = false;
    this.presentationVisible = true;
    this.table = null;
    this.nativeFeltRecords = [];
    this.handRestRecords = [];
    this.brandingMesh = null;

    this.guideGroup = new THREE.Group();
    this.guideGroup.name = 'SVR_TableCalibrationGuides';
    this.presentationGroup = new THREE.Group();
    this.presentationGroup.name = 'SVR_TablePresentationFallback';
    this.brandingGroup = new THREE.Group();
    this.brandingGroup.name = 'SVR_TableBranding';
    this.feltTexture = makeFeltTexture();
    this.brandingTexture = makeBrandingTexture();
    this.group.add(this.presentationGroup, this.brandingGroup, this.guideGroup);
  }

  async load() {
    const gltf = await new GLTFLoader().loadAsync(TABLE_URL);
    this.table = gltf.scene;
    this.table.name = 'SVR_TableGLB_Lab';
    this.nativeFeltRecords = [];
    this.handRestRecords = [];

    this.table.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.frustumCulled = false;

      const materialName = String(obj.material?.name || '');
      const name = `${obj.name} ${materialName}`.toLowerCase();

      if (/felt|cloth|fabric|polotno|canvas/.test(name)) {
        obj.visible = true;
        obj.material = makeNativeFeltMaterial(this.feltTexture);
        obj.userData.svrNativeFelt = true;
        this.nativeFeltRecords.push({
          mesh: obj,
          baseY: obj.position.y,
          baseScaleX: obj.scale.x,
          baseScaleZ: obj.scale.z
        });
        return;
      }

      if (obj.name === 'Object001' || materialName === '14 - Default' || /03 - default|rail|leather|pad|cushion|hand.?rest/.test(name)) {
        obj.visible = true;
        obj.userData.svrHandRest = true;
        obj.material = makeLeatherMaterial();
        this.handRestRecords.push({
          mesh: obj,
          baseY: obj.position.y,
          baseScaleX: obj.scale.x,
          baseScaleZ: obj.scale.z
        });
        return;
      }

      const sourceColor = obj.material?.color?.clone?.() || new THREE.Color(0x302f34);
      sourceColor.multiplyScalar(0.77);
      obj.material = new THREE.MeshPhysicalMaterial({
        color: sourceColor,
        roughness: 0.5,
        metalness: 0.16,
        clearcoat: 0.14,
        clearcoatRoughness: 0.46,
        side: THREE.DoubleSide
      });
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

    this.dispatchEvent(new CustomEvent('loaded', {
      detail: {
        nativeFeltCount: this.nativeFeltRecords.length,
        handRestCount: this.handRestRecords.length,
        visualFeltMode: this.nativeFeltRecords.length ? 'native-polotno' : 'fallback-generated'
      }
    }));
    return this;
  }

  setParams(next = {}) { Object.assign(this.params, next); this.apply(); }

  apply() {
    if (this.table) {
      this.table.position.y = this.params.tableY - 0.79;
      this.applyNativeFeltAdjustment();
      this.applyHandRestAdjustment();
    }
    this.rebuildPresentation();
    this.rebuildBranding();
    this.rebuildGuides();
  }

  applyNativeFeltAdjustment() {
    if (!this.table || !this.nativeFeltRecords.length) return;
    const tableScaleY = Math.max(Math.abs(this.table.scale.y), 0.000001);
    const worldDelta = DEFAULTS.feltDrop - this.params.feltDrop;
    const localDelta = worldDelta / tableScaleY;
    for (const rec of this.nativeFeltRecords) {
      rec.mesh.position.y = rec.baseY + localDelta;
      rec.mesh.scale.x = rec.baseScaleX;
      rec.mesh.scale.z = rec.baseScaleZ;
      rec.mesh.visible = true;
    }
  }

  applyHandRestAdjustment() {
    if (!this.table || !this.handRestRecords.length) return;
    const tableScaleY = Math.max(Math.abs(this.table.scale.y), 0.000001);
    const localLower = 0.0015 / tableScaleY;
    for (const rec of this.handRestRecords) {
      rec.mesh.position.y = rec.baseY - localLower;
      rec.mesh.scale.x = rec.baseScaleX * 0.985;
      rec.mesh.scale.z = rec.baseScaleZ * 0.985;
      rec.mesh.visible = true;
    }
  }

  clearGroup(group) {
    while (group.children.length) {
      const child = group.children.pop();
      disposeObject(child);
    }
  }

  rebuildPresentation() {
    this.clearGroup(this.presentationGroup);
    if (this.nativeFeltRecords.length) {
      this.presentationGroup.visible = false;
      return;
    }
    const feltY = this.params.tableY - this.params.feltDrop + 0.0004;
    const margin = this.params.innerMargin;
    const felt = new THREE.Mesh(new THREE.CircleGeometry(1, 96), makeNativeFeltMaterial(this.feltTexture));
    felt.name = 'SVR_FallbackFelt';
    felt.rotation.x = -Math.PI / 2;
    felt.scale.set(Math.max(0.83, 1.245 - margin), Math.max(0.46, 0.665 - margin * 0.52), 1);
    felt.position.y = feltY;
    felt.receiveShadow = true;
    this.presentationGroup.add(felt);
    this.presentationGroup.visible = this.presentationVisible;
  }

  rebuildBranding() {
    this.clearGroup(this.brandingGroup);
    const material = new THREE.MeshBasicMaterial({
      map: this.brandingTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    const branding = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 0.96), material);
    branding.name = 'SVR_FeltBranding_PassLine_Sponsors';
    branding.rotation.x = -Math.PI / 2;
    branding.position.set(0, this.getVisualFeltY() + 0.00045, -0.015);
    this.brandingGroup.add(branding);
    this.brandingMesh = branding;
  }

  rebuildGuides() {
    this.clearGroup(this.guideGroup);
    const feltY = this.getVisualFeltY();
    const cardY = this.getSurfaceY();
    const margin = this.params.innerMargin;

    const felt = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: 0x1bcf86, transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide }));
    felt.name = 'TargetFeltSurface';
    felt.rotation.x = -Math.PI / 2;
    felt.scale.set(Math.max(0.75, 1.23 - margin), Math.max(0.42, 0.64 - margin * 0.5), 1);
    felt.position.y = feltY + 0.0012;
    this.guideGroup.add(felt);

    const rail = new THREE.Mesh(new THREE.RingGeometry(0.77, 0.91, 64), new THREE.MeshBasicMaterial({ color: 0x78eaff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
    rail.name = 'RailInnerWallGuide';
    rail.rotation.x = -Math.PI / 2;
    rail.scale.set(1.52, 0.78, 1);
    rail.position.y = this.params.tableY + 0.009;
    this.guideGroup.add(rail);

    const collision = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0xffcf70, wireframe: true, transparent: true, opacity: 0.32, depthWrite: false }));
    collision.name = 'PhysicsCollisionSurface';
    collision.rotation.x = -Math.PI / 2;
    collision.scale.set(Math.max(0.72, 1.21 - margin), Math.max(0.40, 0.62 - margin * 0.5), 1);
    collision.position.y = feltY + 0.0002;
    this.guideGroup.add(collision);

    const cardPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.42), new THREE.MeshBasicMaterial({ color: 0x55c8ff, wireframe: true, transparent: true, opacity: 0.48, depthWrite: false, side: THREE.DoubleSide }));
    cardPlane.name = 'CardLandingPlane';
    cardPlane.rotation.x = -Math.PI / 2;
    cardPlane.position.set(0, cardY, -0.10);
    this.guideGroup.add(cardPlane);
    this.guideGroup.visible = this.guidesVisible;
  }

  toggleGuides(force) {
    this.guidesVisible = typeof force === 'boolean' ? force : !this.guidesVisible;
    this.guideGroup.visible = this.guidesVisible;
    return this.guidesVisible;
  }

  setPresentationVisible(visible) {
    this.presentationVisible = Boolean(visible);
    this.presentationGroup.visible = this.presentationVisible && !this.nativeFeltRecords.length;
    this.brandingGroup.visible = this.presentationVisible;
  }

  getVisualFeltY() {
    if (!this.nativeFeltRecords.length) return this.params.tableY - this.params.feltDrop;
    const box = new THREE.Box3();
    for (const rec of this.nativeFeltRecords) box.expandByObject(rec.mesh);
    return Number.isFinite(box.max.y) ? box.max.y : this.params.tableY - this.params.feltDrop;
  }

  getSurfaceY(cardThickness = CARD_THICKNESS) {
    return this.getVisualFeltY() + Math.max(0.0005, Number(cardThickness || CARD_THICKNESS) / 2 + 0.00025);
  }

  getBettingLine() {
    return { ...BETTING_LINE, centerX: 0, centerZ: -0.015, y: this.getVisualFeltY() + 0.0005 };
  }

  getDiagnostics() {
    return {
      nativeFeltCount: this.nativeFeltRecords.length,
      handRestCount: this.handRestRecords.length,
      visualFeltMode: this.nativeFeltRecords.length ? 'native-polotno' : 'fallback-generated',
      visualFeltY: +this.getVisualFeltY().toFixed(5),
      cardLandingY: +this.getSurfaceY().toFixed(5),
      bettingLine: this.getBettingLine(),
      branding: 'SVR-center + sponsor-left + sponsor-right'
    };
  }

  getPreset() {
    const p = { ...this.params };
    const diagnostics = this.getDiagnostics();
    return {
      version: 4,
      units: 'meters',
      table: p,
      derived: {
        feltY: +this.getVisualFeltY().toFixed(5),
        collisionY: +this.getVisualFeltY().toFixed(5),
        cardLandingY: +this.getSurfaceY().toFixed(5),
        innerWallMarginInches: +(p.innerMargin / 0.0254).toFixed(2),
        feltDropInches: +(p.feltDrop / 0.0254).toFixed(2),
        visualFeltMode: diagnostics.visualFeltMode,
        nativeFeltCount: diagnostics.nativeFeltCount,
        handRestCount: diagnostics.handRestCount,
        bettingLine: diagnostics.bettingLine,
        branding: diagnostics.branding
      }
    };
  }

  saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getPreset())); }
  loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const preset = JSON.parse(raw);
      if (preset?.table) { this.setParams(preset.table); return true; }
    } catch (error) {
      console.warn('[SVR Dealer Lab] Failed to load table preset', error);
    }
    return false;
  }
  reset() {
    this.params = { ...DEFAULTS };
    localStorage.removeItem(STORAGE_KEY);
    this.apply();
  }
}
