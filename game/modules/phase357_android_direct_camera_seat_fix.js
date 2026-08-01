import * as THREE from 'three';

export const BUILD = 'PHASE-357-ANDROID-DIRECT-CAMERA-SEAT-FIX';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  corrections: 0,
  lastDistance: null,
  lastTarget: null,
  lastActual: null,
  installedAt: null,
  checkedAt: null
};

const renderer = () => window.__SVR_RENDERER__ || null;
const baseCamera = () => window.__SVR_CAMERA__ || null;
const scene = () => window.__SVR_SCENE__ || null;
const worldRoot = () => scene()?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene();

function isSeated() {
  return Boolean(window.SVR_PHASE347_STATE?.seated || document.body.classList.contains('svr347-seated'));
}

function tableObject() {
  return window.SVR_TABLE_AUTHORITY
    || worldRoot()?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')
    || worldRoot()?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT')
    || worldRoot()?.getObjectByName?.('PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED')
    || worldRoot()?.getObjectByName?.('PHASE326_ANDROID_TABLE_FALLBACK')
    || null;
}

function tableMetrics() {
  const layout = window.SVR_PHASE341_TABLE_LAYOUT;
  if (layout?.center && layout?.size) {
    return {
      center: new THREE.Vector3(Number(layout.center.x || 0), Number(layout.center.y || 0), Number(layout.center.z || 0)),
      top: Number(layout.top || 0.95),
      depth: Number(layout.size.z || 1.8)
    };
  }
  const table = tableObject();
  if (!table) return null;
  table.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(table);
  if (box.isEmpty()) return null;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  return {
    center,
    top: box.max.y,
    depth: Math.max(1.18, Math.min(size.z * 0.92, 2.25))
  };
}

function cameraWorldPosition() {
  const camera = baseCamera();
  const position = new THREE.Vector3();
  camera?.updateWorldMatrix?.(true, false);
  camera?.getWorldPosition?.(position);
  return position;
}

function desiredCamera(metrics) {
  const current = cameraWorldPosition();
  const edgeOffset = THREE.MathUtils.clamp(metrics.depth * 0.17, 0.24, 0.34);
  return new THREE.Vector3(
    metrics.center.x,
    current.y,
    metrics.center.z + metrics.depth * 0.5 + edgeOffset
  );
}

function setCameraWorldXZ(target) {
  const camera = baseCamera();
  if (!camera || !target) return false;
  try {
    const local = target.clone();
    if (camera.parent?.worldToLocal) camera.parent.worldToLocal(local);
    camera.position.x = local.x;
    camera.position.z = local.z;
    camera.updateMatrixWorld?.(true);
    return true;
  } catch (error) {
    window.SVR_PHASE357_DIRECT_CAMERA_ERROR = String(error?.stack || error?.message || error);
    return false;
  }
}

function correct(reason = 'watchdog', force = false) {
  if (!ACTIVE || renderer()?.xr?.isPresenting || !isSeated()) return false;
  const metrics = tableMetrics();
  const camera = baseCamera();
  if (!metrics || !camera) return false;

  const before = cameraWorldPosition();
  const target = desiredCamera(metrics);
  const beforeDistance = Math.hypot(before.x - target.x, before.z - target.z);
  if (!force && beforeDistance <= 0.025) return true;

  const moved = setCameraWorldXZ(target);
  const after = cameraWorldPosition();
  state.lastDistance = +Math.hypot(after.x - metrics.center.x, after.z - metrics.center.z).toFixed(3);
  state.lastTarget = { x: +target.x.toFixed(3), z: +target.z.toFixed(3) };
  state.lastActual = { x: +after.x.toFixed(3), z: +after.z.toFixed(3) };
  if (moved) state.corrections += 1;
  try { camera.lookAt(metrics.center.x, metrics.top + 0.11, metrics.center.z); } catch {}
  camera.updateMatrixWorld?.(true);

  window.SVR_PHASE357_DIRECT_CAMERA_STATE = {
    ...state,
    reason,
    desiredCamera: state.lastTarget,
    actualCamera: state.lastActual,
    distance: state.lastDistance,
    correctedAt: new Date().toISOString()
  };
  return moved;
}

function qa() {
  const metrics = tableMetrics();
  const position = cameraWorldPosition();
  const distance = metrics ? Math.hypot(position.x - metrics.center.x, position.z - metrics.center.z) : null;
  const maximum = metrics ? metrics.depth * 0.5 + 0.48 : null;
  const result = {
    ...state,
    seated: isSeated(),
    xrPresenting: Boolean(renderer()?.xr?.isPresenting),
    cameraDistance: distance == null ? null : +distance.toFixed(3),
    maximumCloseSeatDistance: maximum == null ? null : +maximum.toFixed(3),
    checkedAt: new Date().toISOString()
  };
  result.pass = result.active
    && result.installed
    && (!result.seated || result.xrPresenting || result.cameraDistance == null || result.cameraDistance <= result.maximumCloseSeatDistance + 0.08);
  window.SVR_PHASE357_DIRECT_CAMERA_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || state.installed) return;
  if (!baseCamera() || !document.getElementById('svr347Root')) {
    setTimeout(install, 120);
    return;
  }
  state.installed = true;
  state.installedAt = new Date().toISOString();

  let previousSeated = isSeated();
  setInterval(() => {
    const seated = isSeated();
    if (seated) correct(seated !== previousSeated ? 'seat-transition' : 'seated-watchdog', seated !== previousSeated);
    previousSeated = seated;
    state.checkedAt = new Date().toISOString();
  }, 80);

  window.addEventListener('svr:poker-state', () => {
    if (isSeated()) setTimeout(() => correct('poker-state'), 0);
  });
  window.addEventListener('resize', () => {
    if (isSeated()) setTimeout(() => correct('resize', true), 60);
  });

  const priorRecenter = window.SVR_PHASE357_RECENTER;
  window.SVR_PHASE357_RECENTER = () => {
    priorRecenter?.();
    [0, 80, 220, 520].forEach((delay) => setTimeout(() => correct('recenter', true), delay));
    return true;
  };
  window.SVR_ANDROID_CENTER_PLAYER = window.SVR_PHASE357_RECENTER;
  window.SVR_PHASE357_DIRECT_CAMERA_CORRECT = () => correct('api', true);
  window.SVR_PHASE357_DIRECT_CAMERA_QA = qa;

  if (isSeated()) [0, 80, 220, 520].forEach((delay) => setTimeout(() => correct('install', true), delay));
}

if (ACTIVE) [0, 120, 300, 700].forEach((delay) => setTimeout(install, delay));
