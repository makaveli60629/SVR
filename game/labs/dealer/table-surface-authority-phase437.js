import * as THREE from 'three';

const BUILD = 'DEALER-LAB-V2.5-BLACK-FELT-TABLE-SHAPE-PASSLINE-LOCK';
const LOGO_URL = new URL('../../../logo.png', import.meta.url).href;
const CANVAS_W = 2048;
const CANVAS_H = 1024;
const LINE_INSET_X = 78;
const LINE_INSET_Y = 70;
const LINE_RADIUS = 330;
let attached = false;
let lastMetrics = null;
let feltTexture = null;
let feltMaterial = null;
let leatherMaterial = null;
let brandingTexture = null;

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

function makeBlackFeltTexture() {
  if (feltTexture) return feltTexture;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 32000; i++) {
    const lum = 12 + Math.floor(Math.random() * 26);
    const purple = Math.random() < 0.16;
    ctx.fillStyle = purple
      ? `rgba(${lum + 7},${lum + 1},${lum + 13},${0.025 + Math.random() * 0.05})`
      : `rgba(${lum},${lum},${lum + 2},${0.02 + Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }
  feltTexture = new THREE.CanvasTexture(canvas);
  feltTexture.wrapS = feltTexture.wrapT = THREE.RepeatWrapping;
  feltTexture.repeat.set(4.4, 2.7);
  feltTexture.colorSpace = THREE.SRGBColorSpace;
  feltTexture.anisotropy = 16;
  feltTexture.minFilter = THREE.LinearMipmapLinearFilter;
  feltTexture.magFilter = THREE.LinearFilter;
  return feltTexture;
}

function getBlackFeltMaterial() {
  if (feltMaterial) return feltMaterial;
  feltMaterial = new THREE.MeshPhysicalMaterial({
    map: makeBlackFeltTexture(),
    color: 0xffffff,
    roughness: 0.985,
    metalness: 0,
    sheen: 0.18,
    sheenColor: new THREE.Color(0x5e3b78),
    clearcoat: 0.004,
    clearcoatRoughness: 0.98,
    side: THREE.DoubleSide
  });
  return feltMaterial;
}

function getEdgeLeatherMaterial() {
  if (leatherMaterial) return leatherMaterial;
  leatherMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x07070a,
    roughness: 0.31,
    metalness: 0.025,
    clearcoat: 0.38,
    clearcoatRoughness: 0.27,
    sheen: 0.10,
    sheenColor: new THREE.Color(0x4b2b62),
    side: THREE.DoubleSide
  });
  return leatherMaterial;
}

function drawSponsorBadge(ctx, cx, cy, label, subtitle) {
  const w = 286;
  const h = 126;
  roundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 30);
  ctx.fillStyle = 'rgba(3,3,7,.80)';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(177,104,255,.95)';
  ctx.stroke();

  ctx.save();
  ctx.translate(cx - 92, cy);
  ctx.strokeStyle = '#e5d3ff';
  ctx.lineWidth = 4;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(0, i * 6, 27 - Math.abs(i) * 3.5, 10, i * 0.16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px Arial, sans-serif';
  ctx.fillText(label, cx - 48, cy - 4);
  ctx.fillStyle = '#cfa8ff';
  ctx.font = '800 19px Arial, sans-serif';
  ctx.fillText(subtitle, cx - 48, cy + 31);
}

function makeBrandingTexture() {
  if (brandingTexture) return brandingTexture;
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  brandingTexture = new THREE.CanvasTexture(canvas);
  brandingTexture.colorSpace = THREE.SRGBColorSpace;
  brandingTexture.anisotropy = 16;
  brandingTexture.minFilter = THREE.LinearMipmapLinearFilter;
  brandingTexture.magFilter = THREE.LinearFilter;

  function drawBase() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const x = LINE_INSET_X;
    const y = LINE_INSET_Y;
    const w = CANVAS_W - LINE_INSET_X * 2;
    const h = CANVAS_H - LINE_INSET_Y * 2;

    ctx.save();
    ctx.shadowColor = 'rgba(157,82,255,.42)';
    ctx.shadowBlur = 18;
    roundedRect(ctx, x, y, w, h, LINE_RADIUS);
    ctx.lineWidth = 17;
    ctx.strokeStyle = 'rgba(255,255,255,.97)';
    ctx.stroke();
    ctx.restore();

    roundedRect(ctx, x + 17, y + 17, w - 34, h - 34, Math.max(40, LINE_RADIUS - 17));
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(156,92,255,.72)';
    ctx.stroke();

    drawSponsorBadge(ctx, 354, 512, 'REIKI', 'SPONSOR');
    drawSponsorBadge(ctx, 1694, 512, 'SPONSOR', 'RESERVED');
    brandingTexture.needsUpdate = true;
  }

  drawBase();
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    drawBase();
    const maxW = 790;
    const maxH = 520;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1.45);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.save();
    ctx.globalAlpha = 0.99;
    ctx.drawImage(image, CANVAS_W / 2 - w / 2, CANVAS_H / 2 - h / 2, w, h);
    ctx.restore();
    brandingTexture.needsUpdate = true;
  };
  image.onerror = () => {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 138px Arial, sans-serif';
    ctx.fillText('SVR POKER', CANVAS_W / 2, CANVAS_H / 2 + 45);
    brandingTexture.needsUpdate = true;
  };
  image.src = LOGO_URL;
  return brandingTexture;
}

function roundedRectContains(position, line) {
  const x = Number(position?.x || 0) - line.centerX;
  const z = Number(position?.z || 0) - line.centerZ;
  const halfW = Math.max(0.001, line.halfWidth);
  const halfD = Math.max(0.001, line.halfDepth);
  const r = Math.max(0.001, Math.min(line.cornerRadius, halfW, halfD));
  const qx = Math.abs(x) - (halfW - r);
  const qz = Math.abs(z) - (halfD - r);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
  return outside <= 0;
}

function computeMetrics(table) {
  const box = new THREE.Box3();
  for (const rec of table.nativeFeltRecords || []) box.expandByObject(rec.mesh);
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const planeWidth = size.x * 0.985;
  const planeDepth = size.z * 0.955;
  const halfWidth = planeWidth * 0.5 * (1 - (LINE_INSET_X * 2 / CANVAS_W));
  const halfDepth = planeDepth * 0.5 * (1 - (LINE_INSET_Y * 2 / CANVAS_H));
  const cornerRadius = planeDepth * (LINE_RADIUS / CANVAS_H);
  return {
    planeWidth,
    planeDepth,
    centerX: center.x,
    centerZ: center.z,
    halfWidth,
    halfDepth,
    cornerRadius,
    y: table.getVisualFeltY() + 0.0032
  };
}

function applyAuthority(runtime) {
  const table = runtime?.table;
  if (!table?.table || !table.nativeFeltRecords?.length || !table.brandingMesh) return false;

  for (const rec of table.nativeFeltRecords) {
    rec.mesh.visible = true;
    rec.mesh.material = getBlackFeltMaterial();
  }
  for (const mesh of table.hiddenCoverRecords || []) mesh.visible = false;
  for (const rec of table.handRestRecords || []) {
    rec.mesh.visible = true;
    rec.mesh.material = getEdgeLeatherMaterial();
  }

  const metrics = computeMetrics(table);
  if (!metrics) return false;
  lastMetrics = metrics;

  table.brandingMesh.geometry?.dispose?.();
  table.brandingMesh.geometry = new THREE.PlaneGeometry(metrics.planeWidth, metrics.planeDepth);
  table.brandingMesh.position.set(metrics.centerX, metrics.y, metrics.centerZ);
  table.brandingMesh.renderOrder = 30;
  table.brandingMesh.frustumCulled = false;
  table.brandingMesh.material.map = makeBrandingTexture();
  table.brandingMesh.material.transparent = true;
  table.brandingMesh.material.alphaTest = 0.025;
  table.brandingMesh.material.depthTest = true;
  table.brandingMesh.material.depthWrite = false;
  table.brandingMesh.material.toneMapped = false;
  table.brandingMesh.material.polygonOffset = true;
  table.brandingMesh.material.polygonOffsetFactor = -4;
  table.brandingMesh.material.polygonOffsetUnits = -4;
  table.brandingMesh.material.needsUpdate = true;

  table.getBettingLine = () => ({
    shape: 'rounded-rect-table-fit',
    halfWidth: metrics.halfWidth,
    halfDepth: metrics.halfDepth,
    cornerRadius: metrics.cornerRadius,
    centerX: metrics.centerX,
    centerZ: metrics.centerZ,
    y: metrics.y
  });

  if (runtime.interaction) {
    runtime.interaction.isPastLine = (position) => roundedRectContains(position, table.getBettingLine());
  }

  window.SVR_TABLE_SURFACE_PHASE437 = Object.freeze({
    BUILD,
    felt: 'black-native-polotno',
    passLine: 'rounded-rect-table-fit',
    logo: 'center-expanded',
    handRest: 'outer-edge-only',
    metrics: { ...metrics }
  });
  return true;
}

function installReassert(runtime) {
  const table = runtime.table;
  if (table.userData?.phase437Wrapped) return;
  table.userData = table.userData || {};
  table.userData.phase437Wrapped = true;

  const originalSetParams = table.setParams.bind(table);
  table.setParams = (next = {}) => {
    const result = originalSetParams(next);
    setTimeout(() => applyAuthority(runtime), 0);
    return result;
  };

  const originalReset = table.reset.bind(table);
  table.reset = () => {
    const result = originalReset();
    setTimeout(() => applyAuthority(runtime), 0);
    return result;
  };
}

function attach() {
  const runtime = window.SVR_DEALER_LAB;
  if (!runtime?.table || !runtime?.renderer) return false;
  if (!applyAuthority(runtime)) return false;
  if (!attached) {
    attached = true;
    installReassert(runtime);
    runtime.renderer.xr.addEventListener('sessionstart', () => setTimeout(() => applyAuthority(runtime), 80));
    runtime.table.addEventListener?.('loaded', () => setTimeout(() => applyAuthority(runtime), 0));
  }
  return true;
}

let attempts = 0;
const timer = setInterval(() => {
  attempts += 1;
  if (attach() || attempts > 120) clearInterval(timer);
}, 100);

window.SVR_TABLE_SURFACE_PHASE437_STATUS = () => ({ build: BUILD, attached, metrics: lastMetrics });
