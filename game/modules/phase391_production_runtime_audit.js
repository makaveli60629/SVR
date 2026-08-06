/* PHASE-391-PRODUCTION-RUNTIME-AUDIT-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-391-PRODUCTION-RUNTIME-AUDIT-LOCK';
const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(window.SVR_PLATFORM || params.get('platform') || document.body?.dataset?.platform || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : /Android/i.test(ua) ? 'android' : 'desktop')).toLowerCase();
const ACTIVE = platform !== 'android';
const state = {
  build: BUILD,
  platform,
  active: ACTIVE,
  installed: false,
  rendererReady: false,
  originalTableReady: false,
  singleTableAuthority: false,
  duplicateTablesRemoved: 0,
  legacyFeltOverlaysRemoved: 0,
  recessedSurfaceReady: false,
  cardRootReady: false,
  cardMeshes: 0,
  visibleCardMeshes: 0,
  ericReady: false,
  ericUpright: false,
  ericGrounded: false,
  fixedFrontSpawnReady: false,
  pokerActionsReady: false,
  camera3LightingReady: false,
  rendererPixelRatio: null,
  lastError: null,
  checkedAt: null
};
let scene = null;
let renderer = null;
let table = null;
let timer = 0;
const TABLE_NAME_RX = /(PHASE(?:155|157|158|159|200|326|358|363|373|379|380).*TABLE|ACTUAL_UPLOADED_TABLE|PROCEDURAL_TABLE_AUTHORITY)/i;
const FELT_OVERLAY_RX = /(PHASE388_OFFICIAL_SITE_LOGO_FELT|PHASE386_PROFESSIONAL_SVR_FELT|PHASE384_PROFESSIONAL_SVR_FELT|PHASE167_.*FELT)/i;

function walk(root, visitor, limit = 22000) {
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
function inside(object, root) {
  for (let current = object; current; current = current.parent) if (current === root) return true;
  return false;
}
function findTable() {
  return window.SVR_TABLE_AUTHORITY
    || window.SVR_PHASE380_ORIGINAL_TABLE
    || scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')
    || table
    || null;
}
function cleanupDuplicates() {
  table = findTable() || table;
  if (!scene || !table) return;
  const duplicateTables = [];
  const oldFelts = [];
  walk(scene, (object) => {
    if (!object?.isObject3D || object === table || inside(object, table)) return;
    const name = String(object.name || '');
    if (FELT_OVERLAY_RX.test(name)) oldFelts.push(object);
    else if (TABLE_NAME_RX.test(name) && object.children?.length) duplicateTables.push(object);
  });
  for (const object of duplicateTables) {
    object.visible = false;
    object.removeFromParent?.();
  }
  for (const object of oldFelts) {
    object.visible = false;
    object.removeFromParent?.();
  }
  state.duplicateTablesRemoved += duplicateTables.length;
  state.legacyFeltOverlaysRemoved += oldFelts.length;
}
function cards() {
  const root = scene?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT');
  const meshes = [];
  if (root) walk(root, (object) => {
    if (object?.isMesh && /^PHASE341_(?:HOLE|COMMUNITY|BURN)_/i.test(String(object.name || ''))) meshes.push(object);
  }, 4000);
  return { root, meshes };
}
function applyPerformanceBudget() {
  if (!renderer) return;
  const cap = platform === 'quest' ? 1.35 : platform === 'camera3' ? 1.5 : 1.75;
  const target = Math.min(window.devicePixelRatio || 1, cap);
  try { renderer.setPixelRatio(target); } catch {}
  if (renderer.shadowMap) renderer.shadowMap.enabled = false;
  state.rendererPixelRatio = +target.toFixed(2);
}
function refreshState() {
  scene = window.__SVR_SCENE__ || scene;
  renderer = window.__SVR_RENDERER__ || renderer;
  table = findTable() || table;
  cleanupDuplicates();
  applyPerformanceBudget();
  const cardState = cards();
  const ericState = window.SVR_PHASE391_ERIC_QA?.() || window.SVR_PHASE391_ERIC_STATE || {};
  const phase390 = window.SVR_PHASE390_QA?.() || window.SVR_PHASE390_STATE || {};
  const surfaceCards = window.SVR_PHASE390_SURFACE_CARDS_QA?.() || window.SVR_PHASE390_SURFACE_CARDS_STATE || {};
  const frontSpawn = window.SVR_PHASE390_FRONT_SPAWN_QA?.() || {};
  state.rendererReady = Boolean(renderer && scene && window.__SVR_CAMERA__);
  state.originalTableReady = Boolean(table?.isObject3D && /PHASE380_ORIGINAL_UPLOADED_TABLE/.test(String(table.name || '')));
  const visibleAuthorities = [];
  if (scene) walk(scene, (object) => {
    if (!object?.isObject3D || !object.visible || !TABLE_NAME_RX.test(String(object.name || ''))) return;
    if (object === table || !inside(object, table)) visibleAuthorities.push(object);
  });
  state.singleTableAuthority = state.originalTableReady && visibleAuthorities.filter((object) => object !== table).length === 0;
  state.recessedSurfaceReady = Boolean(window.SVR_PHASE390_PLAY_SURFACE?.parent && phase390.recessInches >= 6 && phase390.recessInches <= 7);
  state.cardRootReady = Boolean(cardState.root && surfaceCards.cardRootReady !== false);
  state.cardMeshes = cardState.meshes.length;
  state.visibleCardMeshes = cardState.meshes.filter((object) => object.visible).length;
  state.ericReady = Boolean(ericState.loaded && ericState.visible);
  state.ericUpright = Boolean(ericState.upright && Number(ericState.anatomicalUpDot || 0) > 0.985);
  state.ericGrounded = Boolean(ericState.grounded);
  state.fixedFrontSpawnReady = platform !== 'quest' || Boolean(frontSpawn.installed && typeof window.SVR_PHASE390_DIRECT_FRONT_SEAT === 'function');
  state.pokerActionsReady = typeof window.SVR_POKER_ACTION === 'function' && typeof window.SVR_POKER_NEXT_HAND === 'function';
  state.camera3LightingReady = platform !== 'camera3' || Boolean(scene?.getObjectByName?.('PHASE389_CAMERA3_PRODUCTION_LIGHTING'));
  state.installed = true;
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE391_PRODUCTION_STATE = { ...state };
  return state;
}
function sweep(reason = 'interval') {
  if (!ACTIVE) return false;
  try {
    window.SVR_PHASE380_ORIGINAL_TABLE_REASSERT?.(`phase391-${reason}`);
    window.SVR_PHASE390_SWEEP?.(`phase391-${reason}`);
    window.SVR_PHASE390_SURFACE_CARDS_SWEEP?.(`phase391-${reason}`);
    window.SVR_PHASE391_ERIC_SWEEP?.(`phase391-${reason}`);
    refreshState();
    return true;
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    return false;
  }
}
function qa() {
  refreshState();
  const pass = Boolean(
    state.rendererReady
    && state.originalTableReady
    && state.singleTableAuthority
    && state.recessedSurfaceReady
    && state.cardRootReady
    && state.cardMeshes >= 17
    && state.ericReady
    && state.ericUpright
    && state.ericGrounded
    && state.fixedFrontSpawnReady
    && state.pokerActionsReady
    && state.camera3LightingReady
    && !state.lastError
  );
  return { ...state, pass, checkedAt: new Date().toISOString() };
}
window.SVR_PHASE391_PRODUCTION_SWEEP = sweep;
window.SVR_PHASE391_PRODUCTION_QA = qa;
if (ACTIVE) {
  for (const delay of [0, 250, 700, 1400, 2800, 5000, 8000]) setTimeout(() => sweep(`bounded-${delay}`), delay);
  timer = window.setInterval(() => sweep('interval'), 1800);
}
