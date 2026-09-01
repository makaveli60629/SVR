/* PHASE-438-LAB-MASTER-LOBBY-DEALER-AUTHORITY */
import * as THREE from 'three';
import { TableCalibrationModule } from './dealer/table_calibration_module.js?v=phase438';
import { EricDealerModule } from './dealer/eric_dealer_module.js?v=phase438';

export const BUILD = 'PHASE-438-LAB-MASTER-LOBBY-DEALER-AUTHORITY';

const TABLE_PRESET = Object.freeze({
  tableY: 0.62,
  feltDrop: 0.014,
  innerMargin: 0.125,
  collisionDrop: 0.02,
  cardLift: 0.0006
});
const DEALER_PRESET = Object.freeze({
  scale: 0.0047,
  y: 0,
  z: 0.71,
  x: -0.10,
  shoulderX: 0.55,
  shoulderZ: -0.48,
  elbowX: 0.36,
  wristZ: -0.45,
  speed: 1.35
});

const state = {
  build: BUILD,
  installed: false,
  tableReady: false,
  ericReady: false,
  blackFeltAuthority: false,
  legacyTableHidden: false,
  legacyEricHidden: false,
  animationFrames: 0,
  anchor: null,
  tableDiagnostics: null,
  dealerRig: null,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let scene = null;
let renderer = null;
let legacyTable = null;
let tableModule = null;
let dealerModule = null;
let lightRig = null;
let raf = 0;
let heartbeat = 0;
let installPromise = null;
let lastFrame = performance.now();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function measure(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return {
    box,
    size: box.getSize(new THREE.Vector3()),
    center: box.getCenter(new THREE.Vector3())
  };
}

function findLegacyTable() {
  return window.SVR_TABLE_AUTHORITY
    || window.SVR_PHASE380_ORIGINAL_TABLE
    || scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')
    || null;
}

function deriveAnchor(table) {
  const info = measure(table);
  const quaternion = new THREE.Quaternion();
  table?.getWorldQuaternion?.(quaternion);
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ');
  return {
    x: Number(info.center.x || 0),
    z: Number(info.center.z || 0.75),
    floorY: 0,
    yaw: Number(euler.y || 0),
    sourceTable: table?.name || null
  };
}

function hideLegacyTable() {
  legacyTable = findLegacyTable() || legacyTable;
  if (!legacyTable || legacyTable === tableModule?.table) return false;
  legacyTable.visible = false;
  legacyTable.traverse?.((object) => {
    if (!object?.isMesh) return;
    object.visible = false;
  });
  state.legacyTableHidden = true;
  return true;
}

function hideLegacyEric() {
  const oldEric = window.SVR_PHASE391_ERIC_AUTHORITY || window.SVR_PHASE388_ERIC_AUTHORITY || null;
  if (!oldEric || oldEric === dealerModule?.group) return false;
  oldEric.visible = false;
  oldEric.traverse?.((object) => {
    if (!object?.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials.filter(Boolean)) material.visible = false;
  });
  state.legacyEricHidden = true;
  return true;
}

function installTableLights(anchor) {
  lightRig?.removeFromParent?.();
  lightRig = new THREE.Group();
  lightRig.name = 'PHASE438_APPROVED_DEALER_TABLE_LIGHT_RIG';
  const key = new THREE.SpotLight(0xfff2df, 4.8, 10, Math.PI / 4.2, 0.48, 1.25);
  const fill = new THREE.DirectionalLight(0xb8eaff, 1.35);
  const rim = new THREE.PointLight(0x9e55ff, 2.4, 7.5, 1.65);
  key.position.set(anchor.x + 2.2, 3.4, anchor.z - 1.7);
  key.target.position.set(anchor.x, 0.62, anchor.z);
  fill.position.set(anchor.x - 2.3, 2.5, anchor.z - 0.8);
  fill.target.position.set(anchor.x, 0.78, anchor.z + 0.45);
  rim.position.set(anchor.x - 1.4, 1.7, anchor.z + 2.0);
  lightRig.add(key, key.target, fill, fill.target, rim);
  scene.add(lightRig);
}

function updateAnimation(now) {
  if (!dealerModule) return;
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  try {
    dealerModule.update(dt, now / 1000);
    state.animationFrames += 1;
  } catch (error) {
    state.lastError = String(error?.message || error);
  }
  raf = requestAnimationFrame(updateAnimation);
}

function maintainVisualAuthority(reason = 'heartbeat') {
  if (!tableModule || !dealerModule) return false;
  tableModule.applyHiddenCovers?.();
  for (const rec of tableModule.nativeFeltRecords || []) rec.mesh.visible = true;
  for (const rec of tableModule.handRestRecords || []) rec.mesh.visible = true;
  if (tableModule.brandingMesh) tableModule.brandingMesh.visible = true;
  dealerModule.group.visible = true;
  dealerModule.propGroup.visible = true;
  hideLegacyTable();
  hideLegacyEric();
  state.tableDiagnostics = tableModule.getDiagnostics?.() || null;
  state.dealerRig = dealerModule.getRigReport?.() || null;
  state.blackFeltAuthority = window.SVR_TABLE_SURFACE_PHASE437_STATUS?.()?.attached === true;
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE438_LOBBY_DEALER_STATE = { ...state, reason };
  return true;
}

async function install() {
  if (state.installed) return window.SVR_LOBBY_DEALER_MODULE || null;
  if (installPromise) return installPromise;
  installPromise = (async () => {
    const started = performance.now();
    while (performance.now() - started < 30000) {
      scene = window.__SVR_SCENE__ || scene;
      renderer = window.__SVR_RENDERER__ || renderer;
      legacyTable = findLegacyTable() || legacyTable;
      if (scene && renderer && legacyTable) break;
      await wait(100);
    }
    if (!scene || !renderer || !legacyTable) throw new Error('PHASE438_SCENE_OR_TABLE_NOT_READY');

    const anchor = deriveAnchor(legacyTable);
    state.anchor = { ...anchor };

    tableModule = new TableCalibrationModule(scene, TABLE_PRESET);
    tableModule.group.name = 'PHASE438_APPROVED_LAB_TABLE_MODULE_ROOT';
    tableModule.presentationGroup.name = 'PHASE438_APPROVED_TABLE_PRESENTATION';
    tableModule.brandingGroup.name = 'PHASE438_APPROVED_TABLE_BRANDING';
    await tableModule.load();
    tableModule.table.name = 'PHASE438_APPROVED_LAB_TABLE_GLB';
    tableModule.table.rotation.y = anchor.yaw;
    tableModule.table.position.x += anchor.x;
    tableModule.table.position.z += anchor.z;
    tableModule.setParams(TABLE_PRESET);
    tableModule.toggleGuides(false);

    dealerModule = new EricDealerModule(scene, {
      ...DEALER_PRESET,
      x: anchor.x + DEALER_PRESET.x,
      z: anchor.z + DEALER_PRESET.z
    });
    // Phase 391 removes objects whose names look like duplicate Eric roots. Rename
    // the Lab master immediately so the legacy cleanup cannot delete it while FBX loads.
    dealerModule.group.name = 'PHASE438_APPROVED_DEALER_CHARACTER_ROOT';
    dealerModule.propGroup.name = 'PHASE438_APPROVED_DEALER_PROP_ROOT';
    await dealerModule.load();
    if (dealerModule.model) dealerModule.model.name = 'PHASE438_APPROVED_DEALER_CHARACTER_MODEL';
    dealerModule.setParams({
      ...DEALER_PRESET,
      x: anchor.x + DEALER_PRESET.x,
      z: anchor.z + DEALER_PRESET.z
    });
    dealerModule.groundToFloor(anchor.floorY);
    dealerModule.setMode('idle');

    const interaction = {};
    const runtime = {
      BUILD,
      scene,
      renderer,
      camera: window.__SVR_CAMERA__ || null,
      table: tableModule,
      dealer: dealerModule,
      interaction,
      anchor: { ...anchor },
      tablePreset: { ...TABLE_PRESET },
      dealerPreset: { ...DEALER_PRESET },
      dealOnce: () => dealerModule.setMode('deal-once'),
      dealLoop: () => dealerModule.setMode('deal-loop'),
      idle: () => dealerModule.setMode('idle'),
      getState: () => qa()
    };

    // This is deliberately the same runtime contract the Dealer Lab uses. Phase 437
    // therefore remains the single black-felt / pass-line / sponsor visual authority.
    window.SVR_DEALER_LAB = runtime;
    window.SVR_LOBBY_DEALER_MODULE = runtime;
    window.SVR_APPROVED_DEALER_TABLE_MODULE = runtime;

    await import('../labs/dealer/table-surface-authority-phase437.js?v=phase438');
    await wait(180);
    installTableLights(anchor);

    hideLegacyTable();
    hideLegacyEric();
    maintainVisualAuthority('install');

    if (!raf) {
      lastFrame = performance.now();
      raf = requestAnimationFrame(updateAnimation);
    }
    if (!heartbeat) heartbeat = window.setInterval(() => maintainVisualAuthority('heartbeat'), 500);
    renderer.xr?.addEventListener?.('sessionstart', () => {
      setTimeout(() => maintainVisualAuthority('xr-sessionstart'), 120);
    });

    state.installed = true;
    state.tableReady = Boolean(tableModule.table?.parent);
    state.ericReady = Boolean(dealerModule.loaded && dealerModule.group?.parent);
    state.installedAt = new Date().toISOString();
    state.lastError = null;
    state.checkedAt = state.installedAt;
    window.dispatchEvent(new CustomEvent('svr:phase438-lab-master-ready', { detail: qa() }));
    return runtime;
  })().catch((error) => {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE438_LOBBY_DEALER_STATE = { ...state };
    throw error;
  });
  return installPromise;
}

function qa() {
  const result = {
    ...state,
    tableReady: Boolean(tableModule?.table?.parent),
    ericReady: Boolean(dealerModule?.loaded && dealerModule?.group?.parent),
    tableDiagnostics: tableModule?.getDiagnostics?.() || state.tableDiagnostics,
    dealerRig: dealerModule?.getRigReport?.() || state.dealerRig,
    surfaceAuthority: window.SVR_TABLE_SURFACE_PHASE437_STATUS?.() || null,
    pass: Boolean(
      state.installed
      && tableModule?.table?.parent
      && dealerModule?.loaded
      && dealerModule?.group?.parent
      && state.legacyTableHidden
      && !state.lastError
    ),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE438_LOBBY_DEALER_STATE = result;
  return result;
}

window.SVR_PHASE438_INSTALL = install;
window.SVR_PHASE438_SWEEP = maintainVisualAuthority;
window.SVR_PHASE438_QA = qa;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { void install(); }, { once: true });
} else {
  void install();
}

addEventListener('beforeunload', () => {
  if (heartbeat) clearInterval(heartbeat);
  if (raf) cancelAnimationFrame(raf);
}, { once: true });
