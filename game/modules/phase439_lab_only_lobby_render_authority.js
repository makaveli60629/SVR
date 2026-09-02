/* PHASE-439-LAB-ONLY-LOBBY-RENDER-AUTHORITY */
import * as THREE from 'three';

export const BUILD = 'PHASE-439-LAB-ONLY-LOBBY-RENDER-AUTHORITY';

const APPROVED_ROOT_NAMES = new Set([
  'PHASE438_APPROVED_LAB_TABLE_MODULE_ROOT',
  'PHASE438_APPROVED_LAB_TABLE_GLB',
  'PHASE438_APPROVED_TABLE_PRESENTATION',
  'PHASE438_APPROVED_TABLE_BRANDING',
  'PHASE438_APPROVED_DEALER_CHARACTER_ROOT',
  'PHASE438_APPROVED_DEALER_CHARACTER_MODEL',
  'PHASE438_APPROVED_DEALER_PROP_ROOT',
  'PHASE438_APPROVED_DEALER_TABLE_LIGHT_RIG'
]);

const LEGACY_TABLE_ROOT = /^(?:PHASE380_ORIGINAL_UPLOADED_TABLE|PHASE200_INTENDED_LOBBY_POKER_TABLE|PHASE200_TABLE_|PHASE159_(?:ACTUAL_UPLOADED_TABLE|FBX_TABLE)|PHASE158_ACTUAL_FBX_TABLE|PHASE157_ACTUAL_FBX_TABLE|PHASE379_PROCEDURAL_TABLE|PHASE358_QUEST_(?:UPLOADED_ASSET_CONTAINER|TABLE_FALLBACK)|PHASE326_ANDROID_TABLE_FALLBACK|PHASE155_(?:ENHANCED_REAL_TABLE_FALLBACK|RESTORED_ASSET_TABLE)|PHASE373_VISIBLE_TABLE_GLB_AUTHORITY)/i;
const LEGACY_SURFACE = /(?:PHASE390_RECESSED_BRANDED_PLAYING_SURFACE|PHASE393_VISIBLE_RECESSED_INNER_FELT|PHASE421_FINAL_POLISHED_PLAYING_SURFACE|PHASE422_TRUE_INNER_PLAYING_SURFACE|PHASE38(?:4|6|8)_.*FELT|OFFICIAL_SITE_LOGO_FELT)/i;
const LEGACY_DEALER = /(?:PHASE368_CARD_DEALER_ROOT|PHASE381_APPROVED_CARD_DEALER_RIG|PHASE388_AUTHORITATIVE_DEALER_MODEL|PHASE391_AUTHORITATIVE_ERIC_DEALER|approvedDealer|eric[_ -]?(?:dealer|avatar|rig)|external[_ -]?skeleton|debug[_ -]?skeleton)/i;
const LEGACY_TABLE_LIGHTING = /^(?:PHASE333_TABLE_LIGHTING_ROOT|PHASE386_PROFESSIONAL_TABLE_LIGHTING_RIG|PHASE389_CAMERA3_PRODUCTION_LIGHTING|PHASE422_TABLE_LIGHTING)$/i;

const state = {
  build: BUILD,
  installed: false,
  sweeps: 0,
  detachedLegacyRoots: 0,
  detachedTableRoots: 0,
  detachedSurfaceRoots: 0,
  detachedDealerRoots: 0,
  detachedLightingRoots: 0,
  approvedTableVisible: false,
  approvedEricVisible: false,
  blackFeltVisible: false,
  passLineVisible: false,
  hiddenTopCoverCount: 0,
  liveLegacyTableRoots: 0,
  liveLegacyDealerRoots: 0,
  ericFeetY: null,
  lastError: null,
  checkedAt: null
};

let scene = null;
let renderer = null;
let vault = null;
let timer = 0;
let installPromise = null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function runtime() {
  return window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE || null;
}

function isApproved(object) {
  for (let current = object; current; current = current.parent) {
    if (APPROVED_ROOT_NAMES.has(String(current.name || ''))) return true;
    if (current.userData?.svrPhase439Approved === true) return true;
  }
  return false;
}

function effectiveVisible(object) {
  for (let current = object; current; current = current.parent) {
    if (current.visible === false) return false;
  }
  return Boolean(object?.parent);
}

function ensureVault() {
  if (vault) return vault;
  vault = scene?.getObjectByName?.('PHASE438_HIDDEN_LOGICAL_LEGACY_AUTHORITIES') || null;
  if (!vault) {
    vault = new THREE.Group();
    vault.name = 'PHASE439_HIDDEN_LEGACY_VISUAL_VAULT';
    scene?.add?.(vault);
  }
  vault.visible = false;
  vault.userData = { ...(vault.userData || {}), phase439NonRenderingVault: true, build: BUILD };
  return vault;
}

function legacyKind(object) {
  if (!object || isApproved(object) || object === vault) return null;
  const name = String(object.name || '');
  if (LEGACY_TABLE_ROOT.test(name)) return 'table';
  if (LEGACY_SURFACE.test(name) || object.userData?.svrPhase421FinalFelt || object.userData?.svrPhase390BrandedSurface || object.userData?.svrPhase422InnerSurface) return 'surface';
  if (LEGACY_DEALER.test(`${name} ${object.userData?.sourceAsset || ''}`)) return 'dealer';
  if (LEGACY_TABLE_LIGHTING.test(name)) return 'lighting';
  return null;
}

function collectLegacyRoots() {
  const candidates = [];
  scene?.traverse?.((object) => {
    const kind = legacyKind(object);
    if (kind) candidates.push({ object, kind });
  });
  const set = new Set(candidates.map((entry) => entry.object));
  return candidates.filter(({ object }) => {
    for (let parent = object.parent; parent; parent = parent.parent) {
      if (set.has(parent)) return false;
    }
    return true;
  });
}

function moveToVault(object) {
  const hidden = ensureVault();
  if (!object || object === hidden || isApproved(object)) return false;
  if (object.parent !== hidden) {
    try {
      hidden.attach(object);
    } catch {
      object.removeFromParent?.();
      hidden.add(object);
    }
  }
  object.visible = false;
  hidden.visible = false;
  return true;
}

function detachLegacyVisuals() {
  const roots = collectLegacyRoots();
  let tables = 0;
  let surfaces = 0;
  let dealers = 0;
  let lighting = 0;
  for (const { object, kind } of roots) {
    if (!moveToVault(object)) continue;
    if (kind === 'table') tables += 1;
    else if (kind === 'surface') surfaces += 1;
    else if (kind === 'dealer') dealers += 1;
    else if (kind === 'lighting') lighting += 1;
  }
  state.detachedLegacyRoots += tables + surfaces + dealers + lighting;
  state.detachedTableRoots += tables;
  state.detachedSurfaceRoots += surfaces;
  state.detachedDealerRoots += dealers;
  state.detachedLightingRoots += lighting;
  return { tables, surfaces, dealers, lighting };
}

function reassertApprovedVisuals(reason = 'manual') {
  const master = runtime();
  if (!master?.table || !master?.dealer) return false;
  const table = master.table;
  const dealer = master.dealer;

  table.group.visible = true;
  table.table.visible = true;
  table.presentationGroup.visible = false;
  table.brandingGroup.visible = true;
  table.toggleGuides?.(false);
  table.applyHiddenCovers?.();
  for (const mesh of table.hiddenCoverRecords || []) mesh.visible = false;
  for (const rec of table.nativeFeltRecords || []) {
    rec.mesh.visible = true;
    const materials = Array.isArray(rec.mesh.material) ? rec.mesh.material : [rec.mesh.material];
    materials.filter(Boolean).forEach((material) => { material.visible = true; material.needsUpdate = true; });
  }
  for (const rec of table.handRestRecords || []) rec.mesh.visible = true;
  if (table.brandingMesh) {
    table.brandingMesh.visible = true;
    table.brandingMesh.material.visible = true;
    if (table.brandingMesh.material.map) table.brandingMesh.material.map.needsUpdate = true;
    table.brandingMesh.material.needsUpdate = true;
  }

  dealer.group.visible = true;
  dealer.propGroup.visible = true;
  dealer.model && (dealer.model.visible = true);
  const feet = dealer.getFeetY?.();
  if (Number.isFinite(feet) && Math.abs(feet) > 0.012) dealer.groundToFloor?.(0);

  state.approvedTableVisible = effectiveVisible(table.group) && effectiveVisible(table.table);
  state.approvedEricVisible = effectiveVisible(dealer.group) && Boolean(dealer.loaded);
  state.blackFeltVisible = (table.nativeFeltRecords || []).some((rec) => effectiveVisible(rec.mesh));
  state.passLineVisible = Boolean(table.brandingMesh && effectiveVisible(table.brandingMesh));
  state.hiddenTopCoverCount = (table.hiddenCoverRecords || []).filter((mesh) => mesh.visible === false).length;
  state.ericFeetY = Number.isFinite(dealer.getFeetY?.()) ? +dealer.getFeetY().toFixed(5) : null;
  state.lastReason = reason;
  return true;
}

function countLiveLegacy() {
  let tables = 0;
  let dealers = 0;
  scene?.traverse?.((object) => {
    if (isApproved(object) || !effectiveVisible(object)) return;
    const kind = legacyKind(object);
    if (kind === 'table' || kind === 'surface') tables += 1;
    if (kind === 'dealer') dealers += 1;
  });
  state.liveLegacyTableRoots = tables;
  state.liveLegacyDealerRoots = dealers;
}

function sweep(reason = 'manual') {
  try {
    scene = window.__SVR_SCENE__ || scene;
    renderer = window.__SVR_RENDERER__ || renderer;
    if (!scene || !runtime()) return false;
    ensureVault().visible = false;
    detachLegacyVisuals();
    reassertApprovedVisuals(reason);
    ensureVault().visible = false;
    countLiveLegacy();
    state.sweeps += 1;
    state.installed = true;
    state.lastError = null;
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE439_LAB_ONLY_STATE = { ...state, reason };
    return qa();
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE439_LAB_ONLY_STATE = { ...state, reason };
    return false;
  }
}

function qa() {
  const pass = Boolean(
    state.installed
    && state.approvedTableVisible
    && state.approvedEricVisible
    && state.blackFeltVisible
    && state.passLineVisible
    && state.hiddenTopCoverCount >= 1
    && state.liveLegacyTableRoots === 0
    && state.liveLegacyDealerRoots === 0
    && !state.lastError
  );
  return { ...state, singleVisibleTableAuthority: state.liveLegacyTableRoots === 0, singleVisibleEricAuthority: state.liveLegacyDealerRoots === 0, pass, checkedAt: new Date().toISOString() };
}

async function install() {
  if (installPromise) return installPromise;
  installPromise = (async () => {
    const started = performance.now();
    while (performance.now() - started < 30000) {
      scene = window.__SVR_SCENE__ || scene;
      renderer = window.__SVR_RENDERER__ || renderer;
      if (scene && renderer && runtime()?.table?.table && runtime()?.dealer?.loaded) break;
      await wait(100);
    }
    if (!scene || !runtime()?.table?.table || !runtime()?.dealer?.loaded) throw new Error('PHASE439_APPROVED_LAB_MASTER_NOT_READY');

    runtime().table.group.userData.svrPhase439Approved = true;
    runtime().dealer.group.userData.svrPhase439Approved = true;
    runtime().dealer.propGroup.userData.svrPhase439Approved = true;

    runtime().table.setParams?.(runtime().tablePreset || {});
    await wait(80);
    sweep('install');

    for (const delay of [120, 350, 800, 1600, 3200, 5600, 7600]) setTimeout(() => sweep(`settle-${delay}`), delay);
    if (!timer) timer = window.setInterval(() => sweep('guard'), 450);
    renderer.xr?.addEventListener?.('sessionstart', () => setTimeout(() => {
      runtime()?.table?.setParams?.(runtime()?.tablePreset || {});
      runtime()?.dealer?.groundToFloor?.(0);
      sweep('xr-sessionstart');
    }, 100));

    window.dispatchEvent(new CustomEvent('svr:phase439-lab-only-ready', { detail: qa() }));
    return qa();
  })().catch((error) => {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE439_LAB_ONLY_STATE = { ...state };
    return false;
  });
  return installPromise;
}

window.SVR_PHASE439_SWEEP = sweep;
window.SVR_PHASE439_QA = qa;
window.SVR_PHASE439_INSTALL = install;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void install(); }, { once: true });
else void install();

addEventListener('beforeunload', () => { if (timer) clearInterval(timer); }, { once: true });
