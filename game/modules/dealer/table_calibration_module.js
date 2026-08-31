import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TABLE_URL = new URL('../../assets/models/table.glb', import.meta.url).href;
const LOGO_URL = new URL('../../../logo.png', import.meta.url).href;
const STORAGE_KEY = 'svrDealerLabTablePresetPhase434';
const DEFAULTS = Object.freeze({ tableY: 0.62, feltDrop: 0.014, innerMargin: 0.125, collisionDrop: 0.02, cardLift: 0.0006 });
const CARD_THICKNESS = 0.0025;
const BETTING_LINE = Object.freeze({ radiusX: 0.88, radiusZ: 0.39 });
const BRANDING_LIFT = 0.0028;

function disposeObject(obj) {
  obj.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose?.());
    else child.material?.dispose?.();
  });
}

function makeFeltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#073d2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 26000; i++) {
    const v = 45 + Math.floor(Math.random() * 85);
    ctx.fillStyle = `rgba(${16 + v / 8},${58 + v / 2.25},${38 + v / 3.3},${0.02 + Math.random() * 0.045})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.8, 2.3);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function makeNativeFeltMaterial(texture) {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    color: 0x0a5a40,
    roughness: 0.96,
    metalness: 0,
    sheen: 0.28,
    sheenColor: new THREE.Color(0x46a982),
    clearcoat: 0.01,
    clearcoatRoughness: 0.94,
    side: THREE.DoubleSide
  });
}

function makeLeatherMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x08080b,
    roughness: 0.32,
    metalness: 0.025,
    clearcoat: 0.36,
    clearcoatRoughness: 0.28,
    sheen: 0.12,
    sheenColor: new THREE.Color(0x542d70),
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
  const w = 320, h = 144;
  roundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 34);
  ctx.fillStyle = 'rgba(5,3,10,.76)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(178,112,255,.96)';
  ctx.stroke();

  ctx.save();
  ctx.translate(cx - 104, cy);
  ctx.strokeStyle = '#e2caff';
  ctx.lineWidth = 5;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(0, i * 7, 32 - Math.abs(i) * 4, 12, i * 0.18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px Arial, sans-serif';
  ctx.fillText(label, cx - 55, cy - 4);
  ctx.fillStyle = '#d7b7ff';
  ctx.font = '800 22px Arial, sans-serif';
  ctx.fillText(subtitle, cx - 55, cy + 36);
}

function makeBrandingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const drawBase = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(1024, 512);
    ctx.scale(1, 0.54);
    ctx.beginPath();
    ctx.arc(0, 0, 720, 0, Math.PI * 2);
    ctx.restore();
    ctx.lineWidth = 15;
    ctx.strokeStyle = 'rgba(255,255,255,.96)';
    ctx.stroke();

    ctx.save();
    ctx.translate(1024, 512);
    ctx.scale(1, 0.54);
    ctx.beginPath();
    ctx.arc(0, 0, 696, 0, Math.PI * 2);
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(156,92,255,.72)';
    ctx.stroke();

    drawSponsorBadge(ctx, 385, 512, 'REIKI', 'SPONSOR');
    drawSponsorBadge(ctx, 1663, 512, 'SPONSOR', 'RESERVED');
    texture.needsUpdate = true;
  };

  drawBase();
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    drawBase();
    const maxW = 610, maxH = 380;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.drawImage(image, 1024 - w / 2, 512 - h / 2, w, h);
    ctx.restore();
    texture.needsUpdate = true;
  };
  image.onerror = () => {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 120px Arial, sans-serif';
    ctx.fillText('SVR POKER', 1024, 545);
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
    this.hiddenCoverRecords = [];
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
    this.hiddenCoverRecords = [];

    this.table.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.frustumCulled = false;

      const materialName = String(obj.material?.name || '');
      const name = `${obj.name} ${materialName}`.toLowerCase();

      // The broad top protector is NOT the hand rest. It was the source of the Quest flicker.
      if (obj.name === 'Object001' || materialName === '14 - Default' || /top.?cover|protective.?cover|protector/.test(name)) {
        obj.visible = false;
        obj.userData.svrHiddenTopCover = true;
        this.hiddenCoverRecords.push(obj);
        return;
      }

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

      // Preserve only the true padded/carbon outer rail as the hand rest authority.
      if (/03 - default|rail|leather|pad|cushion|hand.?rest/.test(name)) {
        obj.visible = true;
        obj.userData.svrHandRest = true;
        obj.material = makeLeatherMaterial();
        this.handRestRecords.push({
          mesh: obj,
          baseY: obj.position.y,
          baseScaleX: obj.scale.x,
          baseScaleY: obj.scale.y,
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
        hiddenTopCoverCount: this.hiddenCoverRecords.length,
        visualFeltMode: this.nativeFeltRecords.length ? 'native-polotno-single-surface' : 'fallback-generated'
      }
    }));
    return this;
  }

  setParams(next = {}) {
    Object.assign(this.params, next);
    this.apply();
  }

  apply() {
    if (this.table) {
      this.table.position.y = this.params.tableY - 0.79;
      this.applyHiddenCovers();
      this.applyNativeFeltAdjustment();
      this.applyHandRestAdjustment();
    }
    this.rebuildPresentation();
    this.rebuildBranding();
    this.rebuildGuides();
  }

  applyHiddenCovers() {
    for (const mesh of this.hiddenCoverRecords) mesh.visible = false;
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
    for (const rec of this.handRestRecords) {
      rec.mesh.position.y = rec.baseY;
      rec.mesh.scale.set(rec.baseScaleX, rec.baseScaleY, rec.baseScaleZ);
      rec.mesh.visible = true;
    }
  }

  clearGroup(group) {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      disposeObject(child);
    }
  }

  rebuildPresentation() {
    this.clearGroup(this.presentationGroup);
    if (this.nativeFeltRecords.length) {
      this.presentationGroup.visible = false;
      return;
    }
    const feltY = this.params.tableY - this.params.feltDrop;
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
      alphaTest: 0.02,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    const branding = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 0.96), material);
    branding.name = 'SVR_FeltBranding_PassLine_Sponsors_XR_Clear';
    branding.rotation.x = -Math.PI / 2;
    branding.position.set(0, this.getVisualFeltY() + BRANDING_LIFT, -0.015);
    branding.renderOrder = 25;
    branding.frustumCulled = false;
    this.brandingGroup.add(branding);
    this.brandingMesh = branding;
    this.brandingGroup.visible = this.presentationVisible;
  }

  rebuildGuides() {
    this.clearGroup(this.guideGroup);
    const feltY = this.getVisualFeltY();
    const cardY = this.getSurfaceY();
    const margin = this.params.innerMargin;

    const felt = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: 0x1bcf86, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }));
    felt.name = 'TargetFeltSurface';
    felt.rotation.x = -Math.PI / 2;
    felt.scale.set(Math.max(0.75, 1.23 - margin), Math.max(0.42, 0.64 - margin * 0.5), 1);
    felt.position.y = feltY + 0.0045;
    this.guideGroup.add(felt);

    const rail = new THREE.Mesh(new THREE.RingGeometry(0.77, 0.91, 64), new THREE.MeshBasicMaterial({ color: 0x78eaff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
    rail.name = 'RailInnerWallGuide';
    rail.rotation.x = -Math.PI / 2;
    rail.scale.set(1.52, 0.78, 1);
    rail.position.y = this.params.tableY + 0.012;
    this.guideGroup.add(rail);

    const collision = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0xffcf70, wireframe: true, transparent: true, opacity: 0.32, depthWrite: false }));
    collision.name = 'PhysicsCollisionSurface';
    collision.rotation.x = -Math.PI / 2;
    collision.scale.set(Math.max(0.72, 1.21 - margin), Math.max(0.40, 0.62 - margin * 0.5), 1);
    collision.position.y = feltY + 0.0035;
    this.guideGroup.add(collision);

    const cardPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.42), new THREE.MeshBasicMaterial({ color: 0x55c8ff, wireframe: true, transparent: true, opacity: 0.48, depthWrite: false, side: THREE.DoubleSide }));
    cardPlane.name = 'CardLandingPlane';
    cardPlane.rotation.x = -Math.PI / 2;
    cardPlane.position.set(0, cardY + 0.002, -0.10);
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
    const lift = Math.max(0, Math.min(0.004, Number(this.params.cardLift || 0)));
    return this.getVisualFeltY() + Number(cardThickness || CARD_THICKNESS) / 2 + lift;
  }

  getBettingLine() {
    return { ...BETTING_LINE, centerX: 0, centerZ: -0.015, y: this.getVisualFeltY() + BRANDING_LIFT };
  }

  getDiagnostics() {
    return {
      nativeFeltCount: this.nativeFeltRecords.length,
      handRestCount: this.handRestRecords.length,
      hiddenTopCoverCount: this.hiddenCoverRecords.length,
      visualFeltMode: this.nativeFeltRecords.length ? 'native-polotno-single-surface' : 'fallback-generated',
      visualFeltY: +this.getVisualFeltY().toFixed(5),
      cardLandingY: +this.getSurfaceY().toFixed(5),
      brandingLift: BRANDING_LIFT,
      bettingLine: this.getBettingLine(),
      branding: 'SVR-center + sponsor-left + sponsor-right'
    };
  }

  getPreset() {
    const p = { ...this.params };
    const diagnostics = this.getDiagnostics();
    return {
      version: 5,
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
        hiddenTopCoverCount: diagnostics.hiddenTopCoverCount,
        brandingLift: diagnostics.brandingLift,
        bettingLine: diagnostics.bettingLine,
        branding: diagnostics.branding
      }
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
    this.params = { ...DEFAULTS };
    localStorage.removeItem(STORAGE_KEY);
    this.apply();
  }
}
