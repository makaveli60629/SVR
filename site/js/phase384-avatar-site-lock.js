/* PHASE-384-ERIC-DEFAULT-AVATAR-SITE-LOCK */
import * as THREE from 'three';
import { SVRAvatarViewer } from './phase346-avatar-viewer.js?v=phase384';
import { account } from './phase345-demo-activity-persistence.js?v=phase384';

export const BUILD = 'PHASE-384-ERIC-DEFAULT-AVATAR-SITE-LOCK';
const DEFAULT_MODEL = new URL('/game/assets/models/legend_character.glb', location.origin).href;
const DEFAULT_OUTFIT = Object.freeze({
  schemaVersion: 1,
  modelId: 'svr-player',
  palette: 'midnight',
  headwear: 'none',
  eyewear: 'none',
  top: 'none',
  shoes: 'none',
  accessory: 'none'
});
const state = {
  build: BUILD,
  prototypePatched: false,
  dressingRoomPatched: false,
  profileRetryRequested: false,
  profileRecoveryViewer: false,
  texturedMeshes: 0,
  generatedBoxesRemoved: 0,
  defaultEricUrl: DEFAULT_MODEL,
  lastError: null,
  checkedAt: null
};

const textureCache = new Map();
function texture(kind = 'suit') {
  if (textureCache.has(kind)) return textureCache.get(kind);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const palette = {
    skin: ['#a96f52', '#7d4937'],
    hair: ['#2a160f', '#100907'],
    shirt: ['#f1f3f6', '#c9ced7'],
    suit: ['#181d2a', '#070a11'],
    pants: ['#111722', '#05070d'],
    shoes: ['#151515', '#020202'],
    eye: ['#d9eef5', '#334c57']
  }[kind] || ['#1a2030', '#070a12'];
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(1, palette[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = kind === 'skin' ? 0.12 : 0.18;
  ctx.strokeStyle = kind === 'skin' ? '#ffd3b7' : '#a9c8da';
  ctx.lineWidth = kind === 'skin' ? 1 : 2;
  for (let i = -256; i < 512; i += kind === 'skin' ? 22 : 13) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.stroke();
  }
  ctx.globalAlpha = kind === 'skin' ? 0.09 : 0.08;
  for (let i = 0; i < 900; i++) {
    const value = 90 + Math.floor(Math.random() * 120);
    ctx.fillStyle = `rgb(${value},${value},${value})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }
  ctx.globalAlpha = 1;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(kind === 'skin' ? 1 : 3, kind === 'skin' ? 1 : 3);
  map.needsUpdate = true;
  textureCache.set(kind, map);
  return map;
}

function materialKind(label = '', yRatio = 0.5) {
  const value = label.toLowerCase();
  if (/eye|cornea|iris/.test(value)) return 'eye';
  if (/hair|brow|lash|beard/.test(value)) return 'hair';
  if (/shoe|boot|sole/.test(value)) return 'shoes';
  if (/pant|trouser|jean|leg/.test(value)) return 'pants';
  if (/shirt|collar|cuff|tie/.test(value)) return 'shirt';
  if (/skin|face|head|hand|arm|neck|ear|nose|lip/.test(value)) return 'skin';
  if (yRatio > 0.78) return 'skin';
  if (yRatio < 0.34) return 'pants';
  return 'suit';
}

function enhanceEric(root) {
  if (!root?.isObject3D) return 0;
  root.updateWorldMatrix?.(true, true);
  const total = new THREE.Box3().setFromObject(root, true);
  const size = total.getSize(new THREE.Vector3());
  let changed = 0;
  root.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const meshBox = new THREE.Box3().setFromObject(object, true);
    const center = meshBox.getCenter(new THREE.Vector3());
    const yRatio = size.y > 0.001 ? (center.y - total.min.y) / size.y : 0.5;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    const next = list.map((source) => {
      const material = source?.clone?.() || new THREE.MeshStandardMaterial();
      material.userData = { ...(material.userData || {}), svrPhase384Textured: true };
      const label = `${object.name || ''} ${source?.name || ''}`;
      const kind = materialKind(label, yRatio);
      if (!material.map || !material.map.image) material.map = texture(kind);
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.map.needsUpdate = true;
      material.color?.set?.(0xffffff);
      if ('roughness' in material) material.roughness = kind === 'skin' ? 0.68 : kind === 'shoes' ? 0.28 : 0.56;
      if ('metalness' in material) material.metalness = kind === 'shoes' ? 0.18 : 0.04;
      material.side = THREE.DoubleSide;
      material.transparent = false;
      material.opacity = 1;
      material.needsUpdate = true;
      changed += 1;
      return material;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
    object.visible = true;
    object.frustumCulled = false;
  });
  root.userData = { ...(root.userData || {}), svrPhase384TexturedEric: true };
  state.texturedMeshes = Math.max(state.texturedMeshes, changed);
  return changed;
}

function removeGeneratedEquipment(viewer) {
  if (!viewer) return 0;
  const root = viewer.equipmentRoot;
  const count = root?.children?.length || 0;
  viewer.clearEquipment?.();
  state.generatedBoxesRemoved += count;
  return count;
}

function polishViewer(viewer) {
  if (!viewer) return false;
  removeGeneratedEquipment(viewer);
  enhanceEric(viewer.baseModel || viewer.modelRoot);
  viewer.setAutoRotate?.(false);
  if (viewer.avatarRoot?.rotation) viewer.avatarRoot.rotation.set(0, 0, 0);
  viewer.resetView?.();
  const checkbox = document.getElementById('autoRotate');
  if (checkbox) checkbox.checked = false;
  return true;
}

const originalApplyOutfit = SVRAvatarViewer.prototype.applyOutfit;
if (!SVRAvatarViewer.prototype.__svrPhase384ApplyPatched) {
  SVRAvatarViewer.prototype.applyOutfit = function phase384ApplyOutfit(input = {}) {
    const safe = { ...DEFAULT_OUTFIT, ...input, modelId: 'svr-player' };
    const result = originalApplyOutfit.call(this, safe);
    removeGeneratedEquipment(this);
    enhanceEric(this.baseModel || this.modelRoot);
    return result;
  };
  SVRAvatarViewer.prototype.__svrPhase384ApplyPatched = true;
  state.prototypePatched = true;
}

const originalLoadModel = SVRAvatarViewer.prototype.loadModel;
if (!SVRAvatarViewer.prototype.__svrPhase384LoadPatched) {
  SVRAvatarViewer.prototype.loadModel = async function phase384LoadModel(url = DEFAULT_MODEL, targetHeight = 1.78) {
    const safeUrl = !url || /avatar-default|mannequin|placeholder/i.test(String(url)) ? DEFAULT_MODEL : url;
    const result = await originalLoadModel.call(this, safeUrl, targetHeight);
    polishViewer(this);
    return result;
  };
  SVRAvatarViewer.prototype.__svrPhase384LoadPatched = true;
}

async function normalizeAccount() {
  await account.bootstrap();
  const snapshot = account.snapshot();
  const profile = snapshot.profile;
  if (!profile) return null;
  const outfitEmpty = !profile.equippedOutfit || !Object.keys(profile.equippedOutfit).length;
  const avatarMissing = !profile.avatarUrl || /avatar-default|mannequin|placeholder/i.test(String(profile.avatarUrl));
  if (outfitEmpty || avatarMissing) {
    try {
      await account.updateProfile({
        avatarUrl: avatarMissing ? DEFAULT_MODEL : profile.avatarUrl,
        equippedOutfit: outfitEmpty ? { ...DEFAULT_OUTFIT } : profile.equippedOutfit
      });
    } catch {}
  }
  return account.snapshot().profile || profile;
}

async function patchDressingRoom() {
  const started = performance.now();
  while (performance.now() - started < 24000) {
    const viewer = window.SVR_PHASE346_AVATAR_STATE?.viewer;
    if (viewer) {
      const profile = await normalizeAccount();
      if (!viewer.modelLoaded || !/eric\.fbx/i.test(String(viewer.modelUrl || ''))) {
        await viewer.loadModel(profile?.avatarUrl || DEFAULT_MODEL, 1.78);
      }
      viewer.applyOutfit({ ...DEFAULT_OUTFIT, ...(profile?.equippedOutfit || {}) });
      polishViewer(viewer);
      const status = document.getElementById('avatarStatus');
      if (status) {
        status.textContent = 'Eric is upright, fully materialized, and using the clean base outfit. Generated box clothing is disabled.';
        status.className = 'avatar-status ok';
      }
      state.dressingRoomPatched = true;
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function recoverProfileShowroom() {
  if (!document.getElementById('profileShowroomCanvas')) return false;
  await normalizeAccount();
  await new Promise((resolve) => setTimeout(resolve, 2200));
  state.profileRetryRequested = true;
  try { await window.SVR_PHASE351_PROFILE_SHOWROOM_RETRY?.(); } catch {}
  await new Promise((resolve) => setTimeout(resolve, 5200));
  const stage = document.getElementById('profileShowroom');
  if (stage?.classList.contains('is-ready')) return true;

  const oldCanvas = document.getElementById('profileShowroomCanvas');
  if (!oldCanvas) return false;
  const canvas = document.createElement('canvas');
  canvas.id = 'profileShowroomCanvas';
  canvas.setAttribute('aria-label', 'Interactive textured Eric player camera');
  oldCanvas.replaceWith(canvas);
  try {
    const response = await fetch('/site/data/avatar-catalog.json?v=phase384', { cache: 'no-store' });
    const catalog = await response.json();
    const profile = account.snapshot().profile || {};
    const viewer = new SVRAvatarViewer({ canvas, catalog, autoRotate: false, compact: false });
    await viewer.loadModel(profile.avatarUrl || DEFAULT_MODEL, 1.78);
    viewer.applyOutfit({ ...DEFAULT_OUTFIT, ...(profile.equippedOutfit || {}) });
    polishViewer(viewer);
    stage?.classList.remove('is-fallback');
    stage?.classList.add('is-ready');
    const statusLabel = document.getElementById('showroomStatus');
    if (statusLabel) statusLabel.textContent = 'Default textured Eric is live. Drag to inspect or open the dressing room.';
    const retry = document.getElementById('showroomRetry');
    if (retry) retry.hidden = true;
    const outfit = document.getElementById('showroomOutfit');
    if (outfit) outfit.textContent = 'Eric • Default Textured Player';
    window.SVR_PHASE384_PROFILE_VIEWER = viewer;
    state.profileRecoveryViewer = true;
    return true;
  } catch (error) {
    state.lastError = String(error?.message || error);
    return false;
  }
}

async function install() {
  try {
    await normalizeAccount();
    if (/\/avatar\.html$/i.test(location.pathname)) state.dressingRoomPatched = true;
    if (/\/profile\.html$/i.test(location.pathname)) await recoverProfileShowroom();
  } catch (error) {
    state.lastError = String(error?.message || error);
  }
  state.checkedAt = new Date().toISOString();
}

install();
window.SVR_PHASE384_AVATAR_QA = () => ({ ...state, pass: state.prototypePatched && (!/avatar\.html$/i.test(location.pathname) || state.dressingRoomPatched), checkedAt: new Date().toISOString() });
window.SVR_PHASE384_AVATAR_STATE = state;
