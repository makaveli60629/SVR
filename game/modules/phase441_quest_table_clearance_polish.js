/* PHASE-441-QUEST-TABLE-CLEARANCE-POLISH */
import * as THREE from 'three';

export const BUILD = 'PHASE-443-TABLE-LOGO-CHIP-SHELF-POLISH';
const TABLE_SCALE_FACTOR = 1.06;
const CHIP_SHELF_INSET_METERS = 0.09525;
const LINE_BAND = 0.018;
const INNER_ACCENT_GAP = 0.026;
const DECAL_LIFT = 0.0014;
const LOGO_URL = new URL('../../logo.png', import.meta.url).href;

let scene = null;
let runtime = null;
let decalGroup = null;
let timer = 0;
let installPromise = null;
let logoTexture = null;
let badgeLeftTexture = null;
let badgeRightTexture = null;
let lastSignature = '';
let lastLine = null;
const state = {
  build: BUILD,
  installed: false,
  floatingBrandingPlaneDisabled: false,
  protectiveCoversHidden: 0,
  broadOverlayMeshesHidden: 0,
  tableScaleFactor: TABLE_SCALE_FACTOR,
  chipShelfInsetMeters: CHIP_SHELF_INSET_METERS,
  chipShelfInsetInches: CHIP_SHELF_INSET_METERS / 0.0254,
  tableScaled: false,
  hipAligned: false,
  hipY: null,
  railTopY: null,
  tableShiftY: 0,
  passLineVisible: false,
  logoVisible: false,
  badgesVisible: false,
  passLine: null,
  lastError: null,
  checkedAt: null
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

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

function makeRoundedRingGeometry(halfW, halfD, radius, band) {
  const shape = new THREE.Shape();
  const r = Math.min(radius, halfW, halfD);
  shape.moveTo(-halfW + r, -halfD);
  shape.lineTo(halfW - r, -halfD);
  shape.quadraticCurveTo(halfW, -halfD, halfW, -halfD + r);
  shape.lineTo(halfW, halfD - r);
  shape.quadraticCurveTo(halfW, halfD, halfW - r, halfD);
  shape.lineTo(-halfW + r, halfD);
  shape.quadraticCurveTo(-halfW, halfD, -halfW, halfD - r);
  shape.lineTo(-halfW, -halfD + r);
  shape.quadraticCurveTo(-halfW, -halfD, -halfW + r, -halfD);

  const innerW = Math.max(0.01, halfW - band);
  const innerD = Math.max(0.01, halfD - band);
  const innerR = Math.max(0.005, r - band);
  const hole = new THREE.Path();
  hole.moveTo(-innerW + innerR, -innerD);
  hole.lineTo(-innerW, -innerD + innerR);
  hole.quadraticCurveTo(-innerW, -innerD, -innerW + innerR, -innerD);
  hole.lineTo(innerW - innerR, -innerD);
  hole.quadraticCurveTo(innerW, -innerD, innerW, -innerD + innerR);
  hole.lineTo(innerW, innerD - innerR);
  hole.quadraticCurveTo(innerW, innerD, innerW - innerR, innerD);
  hole.lineTo(-innerW + innerR, innerD);
  hole.quadraticCurveTo(-innerW, innerD, -innerW, innerD - innerR);
  hole.lineTo(-innerW, -innerD + innerR);
  shape.holes.push(hole);
  return new THREE.ShapeGeometry(shape, 48);
}

function makeBadgeTexture(title, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 224;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(4,3,8,.92)';
  ctx.strokeStyle = 'rgba(180,111,255,.98)';
  ctx.lineWidth = 9;
  const r = 42, x = 8, y = 8, w = canvas.width - 16, h = canvas.height - 16;
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px Arial, sans-serif';
  ctx.fillText(title, canvas.width / 2, 103);
  ctx.fillStyle = '#d9baff';
  ctx.font = '800 34px Arial, sans-serif';
  ctx.fillText(subtitle, canvas.width / 2, 158);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

async function getLogoTexture() {
  if (logoTexture) return logoTexture;
  try {
    logoTexture = await new THREE.TextureLoader().loadAsync(LOGO_URL);
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    logoTexture.anisotropy = 8;
    return logoTexture;
  } catch {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 384;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 148px Arial, sans-serif';
    ctx.fillText('SVR POKER', canvas.width / 2, 235);
    logoTexture = new THREE.CanvasTexture(canvas);
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    return logoTexture;
  }
}

function getFeltBox(table) {
  const box = new THREE.Box3();
  for (const rec of table?.nativeFeltRecords || []) box.expandByObject(rec.mesh);
  return box.isEmpty() ? null : box;
}

function getRailTopY(table) {
  const box = new THREE.Box3();
  for (const rec of table?.handRestRecords || []) box.expandByObject(rec.mesh);
  return box.isEmpty() ? null : box.max.y;
}

function hideApprovedFloatingCover(table) {
  let covers = 0;
  for (const mesh of table.hiddenCoverRecords || []) {
    mesh.visible = false;
    covers += 1;
  }
  state.protectiveCoversHidden = covers;

  if (table.presentationGroup) table.presentationGroup.visible = false;
  if (table.brandingMesh) {
    table.brandingMesh.visible = false;
    if (table.brandingMesh.material) table.brandingMesh.material.visible = false;
    state.floatingBrandingPlaneDisabled = true;
  }
  if (table.brandingGroup) table.brandingGroup.visible = false;

  const feltBox = getFeltBox(table);
  if (!feltBox) return;
  const feltSize = feltBox.getSize(new THREE.Vector3());
  let hidden = 0;
  table.table?.traverse?.(object => {
    if (!object?.isMesh || object.userData?.svrNativeFelt || object.userData?.svrHandRest || object.userData?.svrHiddenTopCover) return;
    const name = `${object.name || ''} ${object.material?.name || ''}`.toLowerCase();
    if (!/(cover|protector|overlay|top.?sheet|presentation)/.test(name)) return;
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    if (size.x >= feltSize.x * 0.58 && size.z >= feltSize.z * 0.58 && box.min.y > feltBox.max.y + 0.002) {
      object.visible = false;
      hidden += 1;
    }
  });
  state.broadOverlayMeshesHidden = hidden;
}

function scaleAndHipAlign(table, dealer) {
  const tableObject = table?.table;
  if (!tableObject) return;
  if (!tableObject.userData.phase441ScaleApplied) {
    tableObject.scale.multiplyScalar(TABLE_SCALE_FACTOR);
    tableObject.userData.phase441ScaleApplied = true;
    tableObject.userData.phase441ScaleFactor = TABLE_SCALE_FACTOR;
    tableObject.updateWorldMatrix(true, true);
    state.tableScaled = true;
  } else state.tableScaled = true;

  if (!tableObject.userData.phase441HipAligned) {
    let hipY = null;
    const hips = dealer?.getBone?.('hips');
    if (hips) {
      hips.updateWorldMatrix(true, false);
      hipY = hips.getWorldPosition(new THREE.Vector3()).y;
    }
    if (!Number.isFinite(hipY)) {
      const bounds = dealer?.getBounds?.();
      if (bounds) hipY = bounds.min.y + (bounds.max.y - bounds.min.y) * 0.52;
    }
    const railTop = getRailTopY(table);
    if (Number.isFinite(hipY) && Number.isFinite(railTop)) {
      const targetRailY = hipY - 0.015;
      const delta = clamp(targetRailY - railTop, -0.10, 0.12);
      tableObject.position.y += delta;
      tableObject.userData.phase441HipAligned = true;
      tableObject.userData.phase441TableShiftY = delta;
      tableObject.updateWorldMatrix(true, true);
      state.hipAligned = true;
      state.hipY = +hipY.toFixed(5);
      state.railTopY = +getRailTopY(table).toFixed(5);
      state.tableShiftY = +delta.toFixed(5);
    }
  } else {
    state.hipAligned = true;
    state.tableShiftY = +Number(tableObject.userData.phase441TableShiftY || 0).toFixed(5);
    const railTop = getRailTopY(table);
    if (Number.isFinite(railTop)) state.railTopY = +railTop.toFixed(5);
  }
}

function clearDecals() {
  if (!decalGroup) return;
  while (decalGroup.children.length) {
    const child = decalGroup.children[0];
    decalGroup.remove(child);
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.());
    else child.material?.dispose?.();
  }
}

async function rebuildDecals(table) {
  const feltBox = getFeltBox(table);
  if (!feltBox) return false;
  const size = feltBox.getSize(new THREE.Vector3());
  const center = feltBox.getCenter(new THREE.Vector3());
  const halfWidth = Math.max(0.16, size.x * 0.5 - CHIP_SHELF_INSET_METERS);
  const halfDepth = Math.max(0.12, size.z * 0.5 - CHIP_SHELF_INSET_METERS);
  const cornerRadius = Math.min(halfDepth * 0.68, halfWidth * 0.24);
  const y = feltBox.max.y + DECAL_LIFT;
  const signature = [center.x, center.z, y, halfWidth, halfDepth, cornerRadius].map(v => Number(v).toFixed(4)).join('|');
  if (signature === lastSignature && decalGroup?.children?.length) return true;
  lastSignature = signature;

  if (!decalGroup) {
    decalGroup = new THREE.Group();
    decalGroup.name = 'PHASE441_TABLE_SAFE_DECALS';
    decalGroup.userData.svrPhase440Approved = true;
    decalGroup.userData.svrPhase441Approved = true;
    scene.add(decalGroup);
    window.SVR_PHASE441_DECAL_GROUP = decalGroup;
  }
  clearDecals();

  const whiteRing = new THREE.Mesh(
    makeRoundedRingGeometry(halfWidth, halfDepth, cornerRadius, LINE_BAND),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: false, depthTest: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 })
  );
  whiteRing.name = 'PHASE441_PASS_LINE_WHITE';
  whiteRing.rotation.x = -Math.PI / 2;
  whiteRing.position.set(center.x, y, center.z);
  whiteRing.renderOrder = 42;
  decalGroup.add(whiteRing);

  const accentW = Math.max(0.05, halfWidth - INNER_ACCENT_GAP);
  const accentD = Math.max(0.05, halfDepth - INNER_ACCENT_GAP);
  const accentR = Math.max(0.02, cornerRadius - INNER_ACCENT_GAP);
  const accentRing = new THREE.Mesh(
    makeRoundedRingGeometry(accentW, accentD, accentR, 0.006),
    new THREE.MeshBasicMaterial({ color: 0x9f5cff, transparent: true, opacity: 0.88, depthTest: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7 })
  );
  accentRing.name = 'PHASE441_PASS_LINE_PURPLE_ACCENT';
  accentRing.rotation.x = -Math.PI / 2;
  accentRing.position.set(center.x, y + 0.00015, center.z);
  accentRing.renderOrder = 43;
  decalGroup.add(accentRing);

  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(size.x * 0.40, size.z * 0.35),
    new THREE.MeshBasicMaterial({ map: await getLogoTexture(), transparent: true, alphaTest: 0.025, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
  );
  logo.name = 'PHASE441_CENTER_SVR_LOGO';
  logo.rotation.x = -Math.PI / 2;
  logo.position.set(center.x, y + 0.0006, center.z);
  logo.renderOrder = 60;
  decalGroup.add(logo);

  badgeLeftTexture ||= makeBadgeTexture('REIKI', 'SPONSOR');
  badgeRightTexture ||= makeBadgeTexture('SPONSOR', 'RESERVED');
  const badgeW = size.x * 0.19;
  const badgeH = size.z * 0.14;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(badgeW, badgeH), new THREE.MeshBasicMaterial({ map: badgeLeftTexture, transparent: true, alphaTest: 0.12, depthTest: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }));
  left.name = 'PHASE441_SPONSOR_LEFT';
  left.rotation.x = -Math.PI / 2;
  left.position.set(center.x - size.x * 0.28, y + 0.0003, center.z);
  left.renderOrder = 44;
  decalGroup.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(badgeW, badgeH), new THREE.MeshBasicMaterial({ map: badgeRightTexture, transparent: true, alphaTest: 0.12, depthTest: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }));
  right.name = 'PHASE441_SPONSOR_RIGHT';
  right.rotation.x = -Math.PI / 2;
  right.position.set(center.x + size.x * 0.28, y + 0.0003, center.z);
  right.renderOrder = 44;
  decalGroup.add(right);

  lastLine = { shape: 'rounded-rect-table-inset', halfWidth, halfDepth, cornerRadius, centerX: center.x, centerZ: center.z, y };
  table.getBettingLine = () => ({ ...lastLine });
  if (runtime?.interaction) runtime.interaction.isPastLine = position => roundedRectContains(position, lastLine);
  state.passLine = { ...lastLine };
  state.passLineVisible = true;
  state.logoVisible = true;
  state.badgesVisible = true;
  return true;
}

async function sweep(reason = 'manual') {
  try {
    runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE || runtime;
    scene = window.__SVR_SCENE__ || runtime?.scene || scene;
    if (!runtime?.table?.table || !runtime?.dealer?.loaded || !scene) return false;
    window.SVR_PHASE441_ACTIVE = true;
    hideApprovedFloatingCover(runtime.table);
    scaleAndHipAlign(runtime.table, runtime.dealer);
    hideApprovedFloatingCover(runtime.table);
    await rebuildDecals(runtime.table);
    state.installed = true;
    state.lastError = null;
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE441_STATE = { ...state, reason };
    return qa();
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE441_STATE = { ...state, reason };
    return false;
  }
}

function qa() {
  const pass = Boolean(
    state.installed
    && state.floatingBrandingPlaneDisabled
    && state.protectiveCoversHidden >= 1
    && state.tableScaled
    && state.hipAligned
    && state.passLineVisible
    && state.logoVisible
    && decalGroup?.parent
    && !state.lastError
  );
  return { ...state, decalChildren: decalGroup?.children?.length || 0, pass, checkedAt: new Date().toISOString() };
}

async function install() {
  if (installPromise) return installPromise;
  installPromise = (async () => {
    const started = performance.now();
    while (performance.now() - started < 30000) {
      runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE || null;
      scene = window.__SVR_SCENE__ || runtime?.scene || null;
      if (runtime?.table?.table && runtime?.dealer?.loaded && scene) break;
      await wait(80);
    }
    if (!runtime?.table?.table || !runtime?.dealer?.loaded || !scene) throw new Error('PHASE441_LAB_MASTER_NOT_READY');
    window.SVR_PHASE441_ACTIVE = true;
    await sweep('install');
    for (const delay of [80, 220, 500, 1000, 2200, 4200]) setTimeout(() => { void sweep(`settle-${delay}`); }, delay);
    if (!timer) timer = window.setInterval(() => { void sweep('guard'); }, 700);
    runtime.renderer?.xr?.addEventListener?.('sessionstart', () => setTimeout(() => { void sweep('xr-sessionstart'); }, 120));
    window.dispatchEvent(new CustomEvent('svr:phase441-table-clearance-ready', { detail: qa() }));
    return qa();
  })().catch(error => {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE441_STATE = { ...state };
    return false;
  });
  return installPromise;
}

window.SVR_PHASE441_SWEEP = sweep;
window.SVR_PHASE441_QA = qa;
window.SVR_PHASE441_INSTALL = install;
window.SVR_PHASE441_READY_PROMISE = install();
addEventListener('beforeunload', () => { if (timer) clearInterval(timer); }, { once: true });
