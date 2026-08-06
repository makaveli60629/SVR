/* PHASE-390-FRONT-SPAWN-FINAL-GUARD-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-390-FRONT-SPAWN-FINAL-GUARD-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const ACTIVE = params.get('platform') === 'quest'
  || params.get('direct') === '1'
  || params.get('questfix') === '1'
  || /Quest|Oculus|Meta Quest/i.test(ua);
const state = { build: BUILD, active: ACTIVE, installed: false, applications: 0, corrections: 0, lastDistance: null, lastReason: null, lastError: null, checkedAt: null };
const world = new THREE.Vector3();
const current = new THREE.Vector3();
const target = new THREE.Vector3();
const look = new THREE.Vector3();
const forward = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
let renderer = null;
let camera = null;
let table = null;
let lastApply = 0;
let raf = 0;

function rig() {
  return window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || window.SVR_PLAYER_RIG || window.__SVR_PLAYER_RIG || null;
}
function activeCamera() {
  const value = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  return value?.cameras?.[0] || value || camera;
}
function bounds(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
}
function findTable() {
  return window.SVR_TABLE_AUTHORITY
    || window.SVR_PHASE380_ORIGINAL_TABLE
    || window.__SVR_SCENE__?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')
    || table
    || null;
}
function fixedFrontPose() {
  table = findTable();
  if (!table) return null;
  const info = bounds(table);
  if (info.box.isEmpty()) return null;
  table.getWorldQuaternion(quaternion);
  forward.set(0, 0, 1).applyQuaternion(quaternion).setY(0);
  if (forward.lengthSq() < 0.001) forward.set(0, 0, 1);
  forward.normalize();
  const surface = window.SVR_PHASE390_PLAY_SURFACE;
  const surfaceInfo = surface?.parent ? bounds(surface) : null;
  const center = surfaceInfo?.center || info.center;
  const topY = surfaceInfo?.box.max.y ?? info.box.max.y - 0.165;
  const half = Math.abs(forward.x) > Math.abs(forward.z) ? info.size.x / 2 : info.size.z / 2;
  target.copy(center).addScaledVector(forward, half + 0.50);
  target.y = topY + 0.66;
  look.copy(center);
  look.y = topY + 0.08;
  return { head: target.clone(), look: look.clone() };
}
function move(reason = 'manual') {
  if (!ACTIVE) return false;
  renderer = window.__SVR_RENDERER__ || renderer;
  camera = window.__SVR_CAMERA__ || camera;
  const playerRig = rig();
  const view = activeCamera();
  const pose = fixedFrontPose();
  if (!playerRig?.position || !view || !pose) return false;
  view.getWorldPosition(current);
  playerRig.getWorldPosition(world);
  const desiredRigWorld = world.add(pose.head).sub(current);
  const local = playerRig.parent ? playerRig.parent.worldToLocal(desiredRigWorld.clone()) : desiredRigWorld;
  playerRig.position.set(local.x, local.y, local.z);
  view.getWorldQuaternion(quaternion);
  cameraForward.set(0, 0, -1).applyQuaternion(quaternion).setY(0);
  if (cameraForward.lengthSq() > 0.001) {
    cameraForward.normalize();
    view.getWorldPosition(current);
    forward.set(pose.look.x - current.x, 0, pose.look.z - current.z).normalize();
    const delta = Math.atan2(forward.x, forward.z) - Math.atan2(cameraForward.x, cameraForward.z);
    playerRig.rotation.y += Math.atan2(Math.sin(delta), Math.cos(delta));
  }
  state.applications += 1;
  state.lastReason = reason;
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE390_FRONT_SEAT = { head: pose.head, look: pose.look, reason, fixedTableFront: true };
  return true;
}
function installApi() {
  if (!ACTIVE) return;
  const api = (reason = 'api') => move(reason);
  api.__phase390Final = true;
  window.SVR_PHASE390_DIRECT_FRONT_SEAT = api;
  window.SVR_PHASE388_DIRECT_SEAT = api;
  state.installed = true;
}
function frame(now = 0) {
  if (!ACTIVE) return;
  installApi();
  const pose = fixedFrontPose();
  const view = activeCamera();
  if (pose && view) {
    view.getWorldPosition(current);
    const distance = Math.hypot(current.x - pose.head.x, current.z - pose.head.z);
    state.lastDistance = +distance.toFixed(3);
    if ((state.applications < 12 || distance > 0.08) && now - lastApply > 180) {
      lastApply = now;
      if (move(distance > 0.08 ? 'final-guard-correction' : 'bounded-front-spawn')) state.corrections += distance > 0.08 ? 1 : 0;
    }
  }
  raf = requestAnimationFrame(frame);
}
function qa() {
  return { ...state, pass: Boolean(state.installed && state.applications > 0 && (state.lastDistance == null || state.lastDistance <= 0.10) && !state.lastError), checkedAt: new Date().toISOString() };
}
window.SVR_PHASE390_FRONT_SPAWN_QA = qa;
if (ACTIVE) {
  installApi();
  for (const delay of [0, 80, 180, 360, 700, 1200, 2200, 3800]) setTimeout(() => move(`final-bounded-${delay}`), delay);
  raf = requestAnimationFrame(frame);
}
