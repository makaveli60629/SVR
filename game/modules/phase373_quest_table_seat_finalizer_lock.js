import * as THREE from 'three';

export const BUILD = 'PHASE-373-QUEST-TABLE-SEAT-FINALIZER-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const ACTIVE = String(window.SVR_PLATFORM || params.get('platform') || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : 'desktop')).toLowerCase() === 'quest';
const SEAT_GAP = 0.62;
const TABLE_CENTER_X = 0;
const TABLE_CENTER_Z = 0.75;
const DRIFT_TRIGGER = 0.08;

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  tableGroundCorrections: 0,
  tableHorizontalCorrections: 0,
  seatedHorizontalCorrections: 0,
  stableLobbyFinalizations: 0,
  stableSeatFinalizations: 0,
  coreReadyFinalizations: 0,
  largestSeatDrift: 0,
  currentSeatDrift: 0,
  tableMinY: null,
  tableCenterX: null,
  tableCenterZ: null,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let scene = null;
let camera = null;
let renderer = null;
let frameHandle = 0;
let tableTimer = 0;
let originalStableLobby = null;
let originalStableSeat = null;
const tmp = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const seated = () => Boolean(window.SVR_PHASE361_STATE?.seated || document.body.classList.contains('svr361-seated'));

function rig() {
  return window.SVR_TELEPORT_RIG_REF
    || window.SVR_TELEPORT_RIG
    || window.SVR_PLAYER_RIG
    || window.__SVR_PLAYER_RIG
    || null;
}

function activeCamera() {
  const value = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  return value?.cameras?.[0] || value || camera;
}

function table() {
  return window.SVR_TABLE_AUTHORITY || null;
}

function bounds(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return {
    box,
    size: box.getSize(new THREE.Vector3()),
    center: box.getCenter(new THREE.Vector3())
  };
}

function worldDelta(object, delta) {
  if (!object?.isObject3D) return false;
  if (!object.parent) {
    object.position.add(delta);
    object.updateWorldMatrix?.(true, true);
    return true;
  }
  object.parent.updateWorldMatrix?.(true, false);
  object.parent.getWorldQuaternion(tmpQ).invert();
  object.parent.getWorldScale(tmpScale);
  tmp.copy(delta).applyQuaternion(tmpQ);
  tmp.x /= Math.abs(tmpScale.x) > 1e-6 ? tmpScale.x : 1;
  tmp.y /= Math.abs(tmpScale.y) > 1e-6 ? tmpScale.y : 1;
  tmp.z /= Math.abs(tmpScale.z) > 1e-6 ? tmpScale.z : 1;
  object.position.add(tmp);
  object.updateWorldMatrix?.(true, true);
  return true;
}

function groundAndCenterTable(reason = 'table-finalizer') {
  const authority = table();
  if (!authority?.isObject3D) return false;
  let value = bounds(authority);
  if (value.box.isEmpty()) return false;
  const dx = TABLE_CENTER_X - value.center.x;
  const dz = TABLE_CENTER_Z - value.center.z;
  if (Math.abs(dx) > 0.015 || Math.abs(dz) > 0.015) {
    worldDelta(authority, new THREE.Vector3(dx, 0, dz));
    state.tableHorizontalCorrections += 1;
    value = bounds(authority);
  }
  if (Math.abs(value.box.min.y) > 0.015) {
    worldDelta(authority, new THREE.Vector3(0, -value.box.min.y, 0));
    state.tableGroundCorrections += 1;
    value = bounds(authority);
  }
  authority.visible = true;
  authority.traverse?.((object) => {
    object.visible = true;
    if (!object.isMesh) return;
    object.frustumCulled = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material?.isMaterial) continue;
      material.opacity = 1;
      material.colorWrite = true;
      material.depthTest = true;
      material.needsUpdate = true;
    }
  });
  state.tableMinY = +value.box.min.y.toFixed(4);
  state.tableCenterX = +value.center.x.toFixed(4);
  state.tableCenterZ = +value.center.z.toFixed(4);
  state.lastTableReason = reason;
  window.SVR_PHASE373_FINALIZER_STATE = { ...state };
  return Math.abs(value.box.min.y) <= 0.02
    && Math.abs(value.center.x - TABLE_CENTER_X) <= 0.03
    && Math.abs(value.center.z - TABLE_CENTER_Z) <= 0.03;
}

function scheduleTableFinalization(reason, delays = [0, 80, 220, 500, 1000]) {
  for (const delay of delays) {
    window.setTimeout(() => groundAndCenterTable(`${reason}:${delay}`), delay);
  }
}

function desiredSeat() {
  const authority = table();
  if (!authority?.isObject3D) return null;
  const value = bounds(authority);
  if (value.box.isEmpty()) return null;
  const phase373 = window.SVR_PHASE373_QA?.();
  if (phase373?.stableAnchor?.mode === 'seated') {
    return {
      x: Number(phase373.stableAnchor.x),
      z: Number(phase373.stableAnchor.z)
    };
  }
  return {
    x: value.center.x,
    z: value.box.max.z + SEAT_GAP
  };
}

function correctSeatedDrift() {
  if (!seated()) {
    state.currentSeatDrift = 0;
    return false;
  }
  const playerRig = rig();
  const head = activeCamera();
  const target = desiredSeat();
  if (!playerRig?.isObject3D || !head?.isObject3D || !target) return false;
  head.getWorldPosition(tmp);
  const dx = target.x - tmp.x;
  const dz = target.z - tmp.z;
  const distance = Math.hypot(dx, dz);
  state.currentSeatDrift = +distance.toFixed(4);
  state.largestSeatDrift = Math.max(state.largestSeatDrift, state.currentSeatDrift);
  if (distance <= DRIFT_TRIGGER) return true;
  worldDelta(playerRig, new THREE.Vector3(dx, 0, dz));
  state.seatedHorizontalCorrections += 1;
  head.getWorldPosition(tmp);
  state.currentSeatDrift = +Math.hypot(target.x - tmp.x, target.z - tmp.z).toFixed(4);
  window.SVR_PHASE373_FINALIZER_STATE = { ...state };
  return state.currentSeatDrift <= 0.03;
}

function scheduleSeatFinalization(reason) {
  for (const delay of [0, 80, 200, 450, 900]) {
    window.setTimeout(() => {
      groundAndCenterTable(`${reason}:table:${delay}`);
      correctSeatedDrift();
    }, delay);
  }
}

function wrapPublicPlacementApis() {
  if (!originalStableLobby && typeof window.SVR_PHASE373_STABLE_LOBBY === 'function') {
    originalStableLobby = window.SVR_PHASE373_STABLE_LOBBY;
    window.SVR_PHASE373_STABLE_LOBBY = (...args) => {
      const result = originalStableLobby(...args);
      state.stableLobbyFinalizations += 1;
      scheduleTableFinalization('stable-lobby');
      return result;
    };
  }
  if (!originalStableSeat && typeof window.SVR_PHASE373_STABLE_SEAT === 'function') {
    originalStableSeat = window.SVR_PHASE373_STABLE_SEAT;
    window.SVR_PHASE373_STABLE_SEAT = (...args) => {
      const result = originalStableSeat(...args);
      state.stableSeatFinalizations += 1;
      scheduleSeatFinalization('stable-seat');
      return result;
    };
  }
}

function qa() {
  const authority = table();
  const value = authority?.isObject3D ? bounds(authority) : null;
  const target = desiredSeat();
  const head = activeCamera();
  let seatDrift = 0;
  if (seated() && target && head?.isObject3D) {
    head.getWorldPosition(tmp);
    seatDrift = Math.hypot(target.x - tmp.x, target.z - tmp.z);
  }
  const result = {
    ...state,
    seated: seated(),
    tableReady: Boolean(authority?.isObject3D && value && !value.box.isEmpty()),
    tableMinY: value ? +value.box.min.y.toFixed(4) : null,
    tableCenterX: value ? +value.center.x.toFixed(4) : null,
    tableCenterZ: value ? +value.center.z.toFixed(4) : null,
    seatDrift: +seatDrift.toFixed(4),
    publicLobbyWrapped: Boolean(originalStableLobby),
    publicSeatWrapped: Boolean(originalStableSeat),
    pass: Boolean(
      ACTIVE
      && state.installed
      && authority?.isObject3D
      && value
      && Math.abs(value.box.min.y) <= 0.02
      && Math.abs(value.center.x - TABLE_CENTER_X) <= 0.03
      && Math.abs(value.center.z - TABLE_CENTER_Z) <= 0.03
      && (!seated() || seatDrift <= DRIFT_TRIGGER)
      && Boolean(originalStableLobby)
      && Boolean(originalStableSeat)
      && !state.lastError
    ),
    checkedAt: new Date().toISOString()
  };
  state.checkedAt = result.checkedAt;
  window.SVR_PHASE373_FINALIZER_STATE = { ...state };
  return result;
}

function frame() {
  if (!ACTIVE || !state.installed) return;
  if (seated()) correctSeatedDrift();
  frameHandle = requestAnimationFrame(frame);
}

async function install() {
  if (!ACTIVE || state.installed) return;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    scene = window.__SVR_SCENE__ || scene;
    camera = window.__SVR_CAMERA__ || camera;
    renderer = window.__SVR_RENDERER__ || renderer;
    if (scene && camera && renderer && rig()?.isObject3D && table()?.isObject3D
      && typeof window.SVR_PHASE373_QA === 'function'
      && typeof window.SVR_PHASE373_STABLE_LOBBY === 'function'
      && typeof window.SVR_PHASE373_STABLE_SEAT === 'function') break;
    await wait(100);
  }
  if (!scene || !camera || !renderer || !rig()?.isObject3D || !table()?.isObject3D) {
    state.lastError = 'QUEST_FINALIZER_RUNTIME_NOT_READY';
    window.SVR_PHASE373_FINALIZER_STATE = { ...state };
    return;
  }
  state.installed = true;
  state.installedAt = new Date().toISOString();
  window.SVR_PHASE373_FINALIZE_TABLE = groundAndCenterTable;
  window.SVR_PHASE373_FINALIZE_SEAT = correctSeatedDrift;
  window.SVR_PHASE373_FINALIZER_QA = qa;
  wrapPublicPlacementApis();
  scheduleTableFinalization('startup', [0, 120, 360, 900, 1800]);
  window.addEventListener('svr:phase373-core-ready', () => {
    state.coreReadyFinalizations += 1;
    scheduleTableFinalization('core-ready');
  });
  window.addEventListener('svr:phase373-postflight-ready', () => scheduleTableFinalization('postflight-ready'));
  window.addEventListener('svr:phase361-table-joined', () => scheduleSeatFinalization('phase361-table-joined'));
  window.addEventListener('svr:phase361-table-left', () => scheduleTableFinalization('phase361-table-left'));
  tableTimer = window.setInterval(() => {
    wrapPublicPlacementApis();
    groundAndCenterTable('interval');
  }, 1000);
  frameHandle = requestAnimationFrame(frame);
  groundAndCenterTable('install');
  correctSeatedDrift();
  window.SVR_PHASE373_FINALIZER_STATE = { ...state };
  window.dispatchEvent(new CustomEvent('svr:phase373-finalizer-ready', { detail: qa() }));
}

if (ACTIVE) {
  try {
    await install();
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    window.SVR_PHASE373_FINALIZER_STATE = { ...state };
  }
}

window.addEventListener('beforeunload', () => {
  clearInterval(tableTimer);
  cancelAnimationFrame(frameHandle);
}, { once: true });