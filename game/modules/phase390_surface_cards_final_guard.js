/* PHASE-390-SURFACE-CARDS-FINAL-GUARD-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-390-SURFACE-CARDS-FINAL-GUARD-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(window.SVR_PLATFORM || params.get('platform') || document.body?.dataset?.platform || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : /Android/i.test(ua) ? 'android' : 'desktop')).toLowerCase();
const ACTIVE = platform === 'quest' || platform === 'camera3' || params.get('direct') === '1' || params.get('questfix') === '1';
const state = { build: BUILD, active: ACTIVE, installed: false, surfaceReady: false, surfaceTopY: null, legacyOverlaysHidden: 0, cardRootReady: false, cardMeshes: 0, visibleCards: 0, rebuilds: 0, alignmentDelta: null, lastRebuildReason: null, lastError: null, checkedAt: null };
let scene = null;
let surface = null;
let lastRebuild = -Infinity;
let initialRebuildDone = false;
let raf = 0;
let lastSweep = 0;
const box = new THREE.Box3();
const point = new THREE.Vector3();

function walk(root, visitor, limit = 12000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { visitor(object); } catch {}
    for (const child of object.children || []) if (child && child !== object && !seen.has(child)) stack.push(child);
  }
  return seen.size;
}
function findSurface() {
  return window.SVR_PHASE390_PLAY_SURFACE
    || scene?.getObjectByName?.('PHASE390_RECESSED_BRANDED_PLAYING_SURFACE')
    || surface
    || null;
}
function surfaceTop() {
  surface = findSurface();
  if (!surface?.parent) return null;
  surface.updateWorldMatrix?.(true, true);
  box.setFromObject(surface, true);
  if (box.isEmpty()) return null;
  return box.max.y;
}
function normalizeSurfaceMaterial() {
  surface = findSurface();
  if (!surface?.isMesh) return false;
  const source = Array.isArray(surface.material) ? surface.material : [surface.material];
  const materials = source.map((material) => {
    if (!material) return material;
    material.visible = true;
    material.opacity = 1;
    material.transparent = false;
    material.colorWrite = true;
    material.depthWrite = true;
    material.depthTest = true;
    material.side = THREE.DoubleSide;
    material.color?.setHex?.(0xffffff);
    material.emissive?.setHex?.(0x08020d);
    if ('emissiveIntensity' in material) material.emissiveIntensity = 0.10;
    if ('roughness' in material) material.roughness = 0.94;
    if ('metalness' in material) material.metalness = 0;
    if (material.map) {
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.map.needsUpdate = true;
    }
    material.needsUpdate = true;
    return material;
  });
  surface.material = Array.isArray(surface.material) ? materials : materials[0];
  surface.visible = true;
  surface.frustumCulled = false;
  surface.renderOrder = 120;
  state.surfaceReady = true;
  return true;
}
function hideLegacyOverlays() {
  if (!scene) return 0;
  let count = 0;
  walk(scene, (object) => {
    if (!object?.isObject3D || object === surface) return;
    if (/PHASE388_OFFICIAL_SITE_LOGO_FELT|PHASE386_PROFESSIONAL_SVR_FELT|PHASE384_PROFESSIONAL_SVR_FELT/i.test(String(object.name || ''))) {
      object.visible = false;
      object.removeFromParent?.();
      count += 1;
    }
  });
  state.legacyOverlaysHidden += count;
  return count;
}
function cardSnapshot() {
  const root = scene?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT');
  const cards = [];
  if (root) walk(root, (object) => {
    if (object?.isMesh && /^PHASE341_(?:HOLE|COMMUNITY|BURN)_/i.test(String(object.name || ''))) cards.push(object);
  }, 3000);
  return { root, cards };
}
function normalizeCards() {
  const snapshot = cardSnapshot();
  if (snapshot.root) snapshot.root.visible = true;
  let visible = 0;
  for (const card of snapshot.cards) {
    card.frustumCulled = false;
    card.renderOrder = 9400;
    if (card.visible) visible += 1;
    const materials = Array.isArray(card.material) ? card.material : [card.material];
    for (const material of materials) {
      if (!material) continue;
      material.depthTest = true;
      material.depthWrite = false;
      material.transparent = true;
      material.polygonOffset = true;
      material.polygonOffsetFactor = -2;
      material.polygonOffsetUnits = -2;
      material.needsUpdate = true;
    }
  }
  state.cardRootReady = Boolean(snapshot.root);
  state.cardMeshes = snapshot.cards.length;
  state.visibleCards = visible;
  return snapshot;
}
async function rebuild(reason) {
  if (performance.now() - lastRebuild < 1200 || typeof window.SVR_PHASE341_REBUILD !== 'function') return false;
  lastRebuild = performance.now();
  try {
    await window.SVR_PHASE341_REBUILD();
    state.rebuilds += 1;
    state.lastRebuildReason = reason;
    normalizeSurfaceMaterial();
    normalizeCards();
    return true;
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    return false;
  }
}
function alignmentDelta(cards, top) {
  const visibleCards = cards.filter((card) => card.visible);
  if (!visibleCards.length) return null;
  const heights = [];
  for (const card of visibleCards) {
    card.getWorldPosition(point);
    heights.push(point.y);
  }
  heights.sort((a, b) => a - b);
  return heights[Math.floor(heights.length / 2)] - top;
}
async function sweep(reason = 'interval') {
  if (!ACTIVE) return false;
  scene = window.__SVR_SCENE__ || scene;
  surface = findSurface();
  const top = surfaceTop();
  if (!scene || top == null) return false;
  state.surfaceTopY = +top.toFixed(4);
  normalizeSurfaceMaterial();
  hideLegacyOverlays();
  let snapshot = normalizeCards();
  if (!initialRebuildDone || !snapshot.root || snapshot.cards.length < 17) {
    initialRebuildDone = await rebuild(!initialRebuildDone ? 'phase390-recessed-surface-authority' : 'missing-card-root') || initialRebuildDone;
    snapshot = normalizeCards();
  }
  const delta = alignmentDelta(snapshot.cards, top);
  state.alignmentDelta = delta == null ? null : +delta.toFixed(4);
  if (delta != null && (delta < 0.001 || delta > 0.035)) {
    await rebuild('card-height-realign');
    snapshot = normalizeCards();
    const corrected = alignmentDelta(snapshot.cards, top);
    state.alignmentDelta = corrected == null ? null : +corrected.toFixed(4);
  }
  state.installed = true;
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE390_SURFACE_CARDS_STATE = { ...state };
  return true;
}
function frame(now = 0) {
  if (!ACTIVE) return;
  if (now - lastSweep > 450) {
    lastSweep = now;
    void sweep('frame');
  }
  raf = requestAnimationFrame(frame);
}
function qa() {
  const cardAlignmentPass = state.visibleCards === 0 || (state.alignmentDelta != null && state.alignmentDelta >= 0.001 && state.alignmentDelta <= 0.035);
  const result = { ...state, pass: Boolean(state.installed && state.surfaceReady && state.cardRootReady && state.cardMeshes >= 17 && cardAlignmentPass && !state.lastError), checkedAt: new Date().toISOString() };
  window.SVR_PHASE390_SURFACE_CARDS_STATE = result;
  return result;
}
window.SVR_PHASE390_SURFACE_CARDS_SWEEP = sweep;
window.SVR_PHASE390_SURFACE_CARDS_QA = qa;
window.addEventListener('svr:phase390-core-ready', () => { void sweep('core-ready'); });
window.addEventListener('svr:poker-state', () => { void sweep('poker-state'); });
if (ACTIVE) {
  for (const delay of [0, 120, 350, 800, 1500, 2800, 5000]) setTimeout(() => { void sweep(`bounded-${delay}`); }, delay);
  raf = requestAnimationFrame(frame);
}
