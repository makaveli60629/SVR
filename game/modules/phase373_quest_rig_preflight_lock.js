import * as THREE from 'three';

export const BUILD = 'PHASE-373-QUEST-RIG-PREFLIGHT-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const ACTIVE = String(window.SVR_PLATFORM || params.get('platform') || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : 'desktop')).toLowerCase() === 'quest';
const MOVE_METHODS = ['teleport', 'teleportTo', 'moveTo', 'setTeleportPosition', 'setPosition', 'setPlayerPose'];

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  selectedRig: null,
  selectedSource: null,
  rejectedTableAncestors: [],
  unsafeMethodsGuarded: 0,
  fallbackCameraRig: false,
  lastError: null,
  installedAt: null
};

let scene = null;
let camera = null;
let table = null;
const guarded = new WeakSet();

const seated = () => Boolean(window.SVR_PHASE361_STATE?.seated || document.body.classList.contains('svr361-seated'));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function objectLabel(object) {
  return String(object?.name || object?.type || object?.constructor?.name || 'unnamed');
}

function isAncestorOf(ancestor, object) {
  if (!ancestor || !object) return false;
  let current = object;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

function unsafeForPlayerRig(object) {
  if (!object?.isObject3D) return true;
  if (object === scene) return true;
  if (table && (object === table || isAncestorOf(object, table))) return true;
  return false;
}

function guardUnsafeRig(object) {
  if (!object?.isObject3D || guarded.has(object)) return 0;
  guarded.add(object);
  let count = 0;
  object.userData = { ...(object.userData || {}) };
  for (const name of MOVE_METHODS) {
    const original = object[name];
    if (typeof original !== 'function' || original.svrPhase373UnsafeGuard) continue;
    const wrapped = function phase373UnsafeRigGuard(...args) {
      if (seated()) return false;
      return original.apply(this, args);
    };
    wrapped.svrPhase373UnsafeGuard = true;
    object[name] = wrapped;
    count += 1;
  }
  if (object.position && typeof object.position.set === 'function' && !object.position.set.svrPhase373UnsafeGuard) {
    const originalSet = object.position.set;
    const wrappedSet = function phase373UnsafePositionGuard(...args) {
      if (seated()) return this;
      return originalSet.apply(this, args);
    };
    wrappedSet.svrPhase373UnsafeGuard = true;
    object.position.set = wrappedSet;
    count += 1;
  }
  state.unsafeMethodsGuarded += count;
  return count;
}

function candidateList() {
  const direct = [
    ['SVR_TELEPORT_RIG_REF', window.SVR_TELEPORT_RIG_REF],
    ['SVR_TELEPORT_RIG', window.SVR_TELEPORT_RIG],
    ['SVR_PLAYER_RIG', window.SVR_PLAYER_RIG],
    ['__SVR_PLAYER_RIG', window.__SVR_PLAYER_RIG]
  ];
  const seen = new Set();
  return direct.filter(([, object]) => object?.isObject3D && !seen.has(object) && seen.add(object));
}

function nearestSafeCameraRig() {
  let current = camera?.parent || null;
  while (current && current !== scene) {
    if (!unsafeForPlayerRig(current)) return { object: current, source: 'camera-parent' };
    current = current.parent;
  }
  if (camera?.isObject3D && !unsafeForPlayerRig(camera)) return { object: camera, source: 'camera' };
  return null;
}

function createCameraRig() {
  if (!scene || !camera?.isObject3D) return null;
  const rig = new THREE.Group();
  rig.name = 'PHASE373_SAFE_QUEST_PLAYER_RIG';
  scene.add(rig);
  try {
    rig.attach(camera);
  } catch {
    rig.add(camera);
  }
  state.fallbackCameraRig = true;
  return { object: rig, source: 'created-camera-rig' };
}

function chooseSafeRig() {
  const candidates = candidateList();
  for (const [source, object] of candidates) {
    if (unsafeForPlayerRig(object)) {
      state.rejectedTableAncestors.push(`${source}:${objectLabel(object)}`);
      guardUnsafeRig(object);
      continue;
    }
    return { object, source };
  }
  return nearestSafeCameraRig() || createCameraRig();
}

function qa() {
  const selected = window.SVR_TELEPORT_RIG_REF;
  return {
    ...state,
    selectedStillSafe: Boolean(selected?.isObject3D && !unsafeForPlayerRig(selected)),
    selectedOwnsTable: Boolean(selected && table && isAncestorOf(selected, table)),
    pass: Boolean(ACTIVE && state.installed && selected?.isObject3D && !unsafeForPlayerRig(selected) && !state.lastError),
    checkedAt: new Date().toISOString()
  };
}

async function install() {
  if (!ACTIVE || state.installed) return;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    scene = window.__SVR_SCENE__ || scene;
    camera = window.__SVR_CAMERA__ || camera;
    table = window.SVR_TABLE_AUTHORITY || table;
    if (scene && camera && table?.isObject3D) break;
    await wait(100);
  }
  if (!scene || !camera || !table?.isObject3D) {
    state.lastError = 'QUEST_SCENE_CAMERA_OR_TABLE_NOT_READY';
    window.SVR_PHASE373_RIG_PREFLIGHT_STATE = { ...state };
    return;
  }
  const choice = chooseSafeRig();
  if (!choice?.object?.isObject3D || unsafeForPlayerRig(choice.object)) {
    state.lastError = 'SAFE_PLAYER_RIG_NOT_FOUND';
    window.SVR_PHASE373_RIG_PREFLIGHT_STATE = { ...state };
    return;
  }
  window.SVR_TELEPORT_RIG_REF = choice.object;
  state.selectedRig = objectLabel(choice.object);
  state.selectedSource = choice.source;
  state.installed = true;
  state.installedAt = new Date().toISOString();
  window.SVR_PHASE373_RIG_PREFLIGHT_QA = qa;
  window.SVR_PHASE373_RIG_PREFLIGHT_STATE = { ...state };
  window.dispatchEvent(new CustomEvent('svr:phase373-rig-preflight-ready', { detail: qa() }));
}

if (ACTIVE) install().catch((error) => {
  state.lastError = String(error?.stack || error?.message || error);
  window.SVR_PHASE373_RIG_PREFLIGHT_STATE = { ...state };
});