/* PHASE-440-LAB-MASTER-HARD-RENDER-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-440-LAB-MASTER-HARD-RENDER-LOCK';
const APPROVED_SCALE = 0.0047;
const APPROVED_NAMES = new Set([
  'PHASE438_APPROVED_LAB_TABLE_MODULE_ROOT',
  'PHASE438_APPROVED_LAB_TABLE_GLB',
  'PHASE438_APPROVED_TABLE_PRESENTATION',
  'PHASE438_APPROVED_TABLE_BRANDING',
  'PHASE438_APPROVED_DEALER_CHARACTER_ROOT',
  'PHASE438_APPROVED_DEALER_CHARACTER_MODEL',
  'PHASE438_APPROVED_DEALER_PROP_ROOT',
  'PHASE438_APPROVED_DEALER_TABLE_LIGHT_RIG'
]);
const LEGACY_TABLE_RX = /^(?:PHASE380_ORIGINAL_UPLOADED_TABLE|PHASE200_INTENDED_LOBBY_POKER_TABLE|PHASE200_TABLE_|PHASE159_(?:ACTUAL_UPLOADED_TABLE|FBX_TABLE)|PHASE158_ACTUAL_FBX_TABLE|PHASE157_ACTUAL_FBX_TABLE|PHASE379_PROCEDURAL_TABLE|PHASE358_QUEST_(?:UPLOADED_ASSET_CONTAINER|TABLE_FALLBACK)|PHASE326_ANDROID_TABLE_FALLBACK|PHASE155_(?:ENHANCED_REAL_TABLE_FALLBACK|RESTORED_ASSET_TABLE)|PHASE373_VISIBLE_TABLE_GLB_AUTHORITY)/i;
const LEGACY_SURFACE_RX = /(?:PHASE390_RECESSED_BRANDED_PLAYING_SURFACE|PHASE393_VISIBLE_RECESSED_INNER_FELT|PHASE421_FINAL_POLISHED_PLAYING_SURFACE|PHASE422_TRUE_INNER_PLAYING_SURFACE|PHASE38(?:4|6|8)_.*FELT|OFFICIAL_SITE_LOGO_FELT)/i;
const LEGACY_DEALER_RX = /(?:PHASE368_CARD_DEALER_ROOT|PHASE381_APPROVED_CARD_DEALER_RIG|PHASE388_AUTHORITATIVE_DEALER_MODEL|PHASE391_AUTHORITATIVE_ERIC_DEALER|approvedDealer|eric[_ -]?(?:dealer|avatar|rig)|external[_ -]?skeleton|debug[_ -]?skeleton)/i;
const LEGACY_LIGHT_RX = /^(?:PHASE333_TABLE_LIGHTING_ROOT|PHASE386_PROFESSIONAL_TABLE_LIGHTING_RIG|PHASE389_CAMERA3_PRODUCTION_LIGHTING|PHASE422_TABLE_LIGHTING)$/i;
const LEGACY_PRESENTATION_RX = /^(?:PHASE341_CANONICAL_PASS_LINE_ROOT|PHASE341_CANONICAL_CENTER_LOGO_ROOT|PHASE332_PASS_LINE_ROOT|PHASE334_PROFESSIONAL_PASS_LINE_ROOT|PHASE339_ANDROID_TABLE_LOGO|PHASE388_OFFICIAL_SITE_LOGO_FELT)$/i;
const LEGACY_VAULT_RX = /^(?:PHASE438_HIDDEN_LOGICAL_LEGACY_AUTHORITIES|PHASE439_HIDDEN_LEGACY_VISUAL_VAULT)$/i;

const state = {
  build: BUILD,
  installed: false,
  sweeps: 0,
  detachedVaults: 0,
  detachedTables: 0,
  detachedSurfaces: 0,
  detachedDealers: 0,
  detachedLighting: 0,
  detachedPresentation: 0,
  visibleLegacyTables: 0,
  visibleLegacyDealers: 0,
  approvedTableVisible: false,
  approvedEricVisible: false,
  blackFeltVisible: false,
  passLineVisible: false,
  topCoversHidden: 0,
  ericFeetY: null,
  ericScale: null,
  lastError: null,
  checkedAt: null
};

let scene = null;
let renderer = null;
let timer = 0;
let installPromise = null;
const detachedRoot = new THREE.Group();
detachedRoot.name = 'PHASE440_NON_RENDERED_LEGACY_ROOT';
detachedRoot.visible = false;
detachedRoot.userData = { phase440DetachedRoot: true, build: BUILD };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function master() { return window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE || null; }
function isApproved(object) {
  for (let current = object; current; current = current.parent) {
    if (APPROVED_NAMES.has(String(current.name || '')) || current.userData?.svrPhase439Approved || current.userData?.svrPhase440Approved) return true;
  }
  return false;
}
function effectiveVisible(object) {
  if (!object?.parent) return false;
  for (let current = object; current; current = current.parent) if (current.visible === false) return false;
  return true;
}
function kind(object) {
  if (!object || isApproved(object) || object === detachedRoot) return null;
  const name = String(object.name || '');
  if (LEGACY_VAULT_RX.test(name)) return 'vault';
  if (LEGACY_PRESENTATION_RX.test(name)) return 'presentation';
  if (LEGACY_TABLE_RX.test(name)) return 'table';
  if (LEGACY_SURFACE_RX.test(name) || object.userData?.svrPhase421FinalFelt || object.userData?.svrPhase390BrandedSurface || object.userData?.svrPhase422InnerSurface) return 'surface';
  if (LEGACY_DEALER_RX.test(`${name} ${object.userData?.sourceAsset || ''}`)) return 'dealer';
  if (LEGACY_LIGHT_RX.test(name)) return 'lighting';
  return null;
}
function detach(object) {
  if (!object || object === detachedRoot || isApproved(object)) return false;
  if (object.parent !== detachedRoot) {
    object.removeFromParent?.();
    detachedRoot.add(object);
  }
  object.visible = false;
  return true;
}
function collectSceneLegacy() {
  const candidates = [];
  scene?.traverse?.((object) => {
    const value = kind(object);
    if (value) candidates.push({ object, kind: value });
  });
  const candidateSet = new Set(candidates.map((entry) => entry.object));
  return candidates.filter(({ object }) => {
    for (let parent = object.parent; parent; parent = parent.parent) if (candidateSet.has(parent)) return false;
    return true;
  });
}
function detachLegacy() {
  let vaults = 0, tables = 0, surfaces = 0, dealers = 0, lighting = 0, presentation = 0;
  for (const entry of collectSceneLegacy()) {
    if (!detach(entry.object)) continue;
    if (entry.kind === 'vault') vaults += 1;
    else if (entry.kind === 'table') tables += 1;
    else if (entry.kind === 'surface') surfaces += 1;
    else if (entry.kind === 'dealer') dealers += 1;
    else if (entry.kind === 'lighting') lighting += 1;
    else if (entry.kind === 'presentation') presentation += 1;
  }
  state.detachedVaults += vaults;
  state.detachedTables += tables;
  state.detachedSurfaces += surfaces;
  state.detachedDealers += dealers;
  state.detachedLighting += lighting;
  state.detachedPresentation += presentation;
}
function stripOldPresentation() {
  const root = scene?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT');
  if (!root) return;
  const remove = [];
  root.traverse?.((object) => {
    if (LEGACY_PRESENTATION_RX.test(String(object.name || ''))) remove.push(object);
  });
  for (const object of remove) {
    if (detach(object)) state.detachedPresentation += 1;
  }
}
function enforceLabMaster() {
  const runtime = master();
  const table = runtime?.table;
  const dealer = runtime?.dealer;
  if (!table?.table || !dealer?.loaded) return false;

  table.group.userData.svrPhase440Approved = true;
  dealer.group.userData.svrPhase440Approved = true;
  dealer.propGroup.userData.svrPhase440Approved = true;
  table.group.visible = true;
  table.table.visible = true;
  table.presentationGroup.visible = false;
  table.brandingGroup.visible = true;
  table.toggleGuides?.(false);
  table.applyHiddenCovers?.();
  for (const cover of table.hiddenCoverRecords || []) cover.visible = false;
  for (const rec of table.nativeFeltRecords || []) {
    rec.mesh.visible = true;
    const materials = Array.isArray(rec.mesh.material) ? rec.mesh.material : [rec.mesh.material];
    for (const material of materials.filter(Boolean)) {
      material.visible = true;
      material.needsUpdate = true;
    }
  }
  for (const rec of table.handRestRecords || []) rec.mesh.visible = true;
  if (table.brandingMesh) {
    table.brandingMesh.visible = true;
    table.brandingMesh.material.visible = true;
    table.brandingMesh.material.needsUpdate = true;
    if (table.brandingMesh.material.map) table.brandingMesh.material.map.needsUpdate = true;
  }

  if (Math.abs(Number(dealer.params?.scale || 0) - APPROVED_SCALE) > 0.000001) dealer.setParams?.({ scale: APPROVED_SCALE });
  dealer.group.visible = true;
  dealer.propGroup.visible = true;
  if (dealer.model) dealer.model.visible = true;
  const feetBefore = dealer.getFeetY?.();
  if (Number.isFinite(feetBefore) && Math.abs(feetBefore) > 0.004) dealer.groundToFloor?.(0);

  state.approvedTableVisible = effectiveVisible(table.group) && effectiveVisible(table.table);
  state.approvedEricVisible = effectiveVisible(dealer.group) && Boolean(dealer.loaded);
  state.blackFeltVisible = (table.nativeFeltRecords || []).some((rec) => effectiveVisible(rec.mesh));
  state.passLineVisible = Boolean(table.brandingMesh && effectiveVisible(table.brandingMesh));
  state.topCoversHidden = (table.hiddenCoverRecords || []).filter((mesh) => mesh.visible === false).length;
  state.ericFeetY = Number.isFinite(dealer.getFeetY?.()) ? +dealer.getFeetY().toFixed(5) : null;
  state.ericScale = +Number(dealer.params?.scale || 0).toFixed(6);
  return true;
}
function countVisibleLegacy() {
  let tables = 0, dealers = 0;
  scene?.traverse?.((object) => {
    if (isApproved(object) || !effectiveVisible(object)) return;
    const value = kind(object);
    if (value === 'table' || value === 'surface' || value === 'presentation') tables += 1;
    if (value === 'dealer') dealers += 1;
  });
  state.visibleLegacyTables = tables;
  state.visibleLegacyDealers = dealers;
}
function sweep(reason = 'manual') {
  try {
    scene = window.__SVR_SCENE__ || scene;
    renderer = window.__SVR_RENDERER__ || renderer;
    if (!scene || !master()) return false;
    stripOldPresentation();
    detachLegacy();
    enforceLabMaster();
    detachLegacy();
    countVisibleLegacy();
    state.sweeps += 1;
    state.installed = true;
    state.lastError = null;
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE440_STATE = { ...state, reason };
    return qa();
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE440_STATE = { ...state, reason };
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
    && state.topCoversHidden >= 1
    && state.visibleLegacyTables === 0
    && state.visibleLegacyDealers === 0
    && Math.abs(Number(state.ericFeetY || 0)) <= 0.01
    && Math.abs(Number(state.ericScale || 0) - APPROVED_SCALE) <= 0.000001
    && !state.lastError
  );
  return {
    ...state,
    oneRenderedTable: state.visibleLegacyTables === 0 && state.approvedTableVisible,
    oneRenderedEric: state.visibleLegacyDealers === 0 && state.approvedEricVisible,
    legacyVaultDetachedFromScene: detachedRoot.parent == null,
    approvedScale: APPROVED_SCALE,
    pass,
    checkedAt: new Date().toISOString()
  };
}
async function install() {
  if (installPromise) return installPromise;
  installPromise = (async () => {
    const started = performance.now();
    while (performance.now() - started < 30000) {
      scene = window.__SVR_SCENE__ || scene;
      renderer = window.__SVR_RENDERER__ || renderer;
      if (scene && renderer && master()?.table?.table && master()?.dealer?.loaded) break;
      await wait(80);
    }
    if (!scene || !master()?.table?.table || !master()?.dealer?.loaded) throw new Error('PHASE440_LAB_MASTER_NOT_READY');
    sweep('install');
    for (const delay of [80, 220, 500, 1000, 2200, 4200, 7200]) setTimeout(() => sweep(`settle-${delay}`), delay);
    if (!timer) timer = window.setInterval(() => sweep('guard'), 900);
    renderer.xr?.addEventListener?.('sessionstart', () => setTimeout(() => sweep('xr-sessionstart'), 80));
    window.dispatchEvent(new CustomEvent('svr:phase440-lab-master-hard-render-ready', { detail: qa() }));
    return qa();
  })().catch((error) => {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE440_STATE = { ...state };
    return false;
  });
  return installPromise;
}

window.SVR_PHASE440_SWEEP = sweep;
window.SVR_PHASE440_QA = qa;
window.SVR_PHASE440_INSTALL = install;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void install(); }, { once: true });
else void install();
addEventListener('beforeunload', () => { if (timer) clearInterval(timer); }, { once: true });
