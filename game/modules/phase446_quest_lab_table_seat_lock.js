/* PHASE-446-QUEST-LAB-TABLE-SEAT-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-446-QUEST-LAB-TABLE-SEAT-LOCK';
const query = new URLSearchParams(location.search);
const ACTIVE = query.get('platform') === 'quest' || query.get('questfix') === '1' || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const KEEP = /PHASE438_APPROVED_|PHASE441_TABLE_SAFE_DECALS|PHASE441_PASS_LINE|PHASE441_CENTER_SVR_LOGO|PHASE441_SPONSOR_/i;
const TABLE_CLUTTER = /CARD|DECK|BURN|CHIP|POT|TABLE.*TOP|TABLETOP|PLAYING.*SURFACE|FELT|PASS.?LINE|LOGO|SPONSOR|PANEL|OVERLAY|HOLOGRAM|LABEL|INTERACTION/i;
const FACE_CLUTTER = /BLACK|DARK|SQUARE|OVERLAY|HUD|SCREEN|PANEL|GUIDE|TARGET|RETICLE|RAY|ARC|TELEPORT|WATCH.*FACE/i;
const TELEPORT_VISUAL = /TELEPORT|TARGET.?RING|POINTER|RETICLE|PARTICLE.*ARC|ARC.*PARTICLE|LASER/i;
const state = { build: BUILD, active: ACTIVE, installed: false, tabletopRootsHidden: 0, faceObjectsHidden: 0, teleportObjectsHidden: 0, seated: false, seatApplications: 0, lastError: null, checkedAt: null };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const tableBox = new THREE.Box3(), objectBox = new THREE.Box3(), size = new THREE.Vector3(), center = new THREE.Vector3(), head = new THREE.Vector3(), world = new THREE.Vector3();
let scene, renderer, camera, runtime, seatPose, timer = 0;

function visible(object) { for (let o = object; o; o = o.parent) if (o.visible === false) return false; return Boolean(object?.parent); }
function kept(object) {
  for (let o = object; o; o = o.parent) {
    if (o === runtime?.table?.group || o === runtime?.table?.table || o === runtime?.dealer?.group || o === runtime?.dealer?.propGroup) return true;
    if (KEEP.test(String(o.name || '')) || o.userData?.svrPhase440Approved || o.userData?.svrPhase441Approved) return true;
  }
  return false;
}
function hide(object, marker) {
  if (!object || object === scene || kept(object)) return false;
  object.visible = false;
  object.userData = { ...(object.userData || {}), [marker]: true, build: BUILD };
  return true;
}
function bounds() {
  const table = runtime?.table?.table;
  if (!table) return null;
  table.updateWorldMatrix?.(true, true); tableBox.setFromObject(table, true);
  if (tableBox.isEmpty()) return null;
  return { box: tableBox.clone(), size: tableBox.getSize(size.clone()), center: tableBox.getCenter(center.clone()) };
}
function clearTableArea() {
  const info = bounds(); if (!info || !scene) return;
  const candidates = [];
  scene.traverse(object => {
    if (!object?.parent || !visible(object) || kept(object) || !TABLE_CLUTTER.test(String(object.name || ''))) return;
    try { object.updateWorldMatrix?.(true, true); objectBox.setFromObject(object, true); } catch { return; }
    if (objectBox.isEmpty()) return;
    const c = objectBox.getCenter(new THREE.Vector3());
    const over = c.x >= info.box.min.x - .18 && c.x <= info.box.max.x + .18 && c.z >= info.box.min.z - .18 && c.z <= info.box.max.z + .18;
    const nearTop = objectBox.max.y >= info.box.min.y - .05 && objectBox.min.y <= info.box.max.y + .70;
    if (over && nearTop) candidates.push(object);
  });
  const set = new Set(candidates); let hidden = 0;
  for (const object of candidates) {
    let nested = false; for (let p = object.parent; p; p = p.parent) if (set.has(p)) { nested = true; break; }
    if (!nested && hide(object, 'svrPhase446TabletopHidden')) hidden++;
  }
  state.tabletopRootsHidden = Math.max(state.tabletopRootsHidden, hidden);
}
function disableTeleport() {
  window.SVR_TELEPORT_DISABLED = true; window.SVR_TELEPORT_ENABLED = false; window.SVR_MOVEMENT_ENABLED = false; window.SVR_LOCOMOTION_ENABLED = false;
  let hidden = 0;
  scene?.traverse(object => { if (TELEPORT_VISUAL.test(String(object.name || '')) && hide(object, 'svrPhase446TeleportHidden')) hidden++; });
  document.querySelectorAll('[id*="teleport" i],[class*="teleport" i],[data-action*="teleport" i]').forEach(element => { element.hidden = true; element.style.display = 'none'; });
  state.teleportObjectsHidden = Math.max(state.teleportObjectsHidden, hidden);
}
function clearFace() {
  if (!scene || !renderer?.xr?.isPresenting) return;
  const xr = renderer.xr.getCamera(camera), eye = xr?.cameras?.[0] || xr || camera;
  eye?.getWorldPosition?.(head); let hidden = 0;
  scene.traverse(object => {
    if (!object?.isMesh || !visible(object) || kept(object) || !FACE_CLUTTER.test(String(object.name || ''))) return;
    object.getWorldPosition?.(world);
    if (world.distanceTo(head) <= 1.35 && hide(object, 'svrPhase446FaceHidden')) hidden++;
  });
  state.faceObjectsHidden = Math.max(state.faceObjectsHidden, hidden);
}
function computeSeat() {
  const info = bounds(); if (!info) return null;
  const yaw = Number(runtime?.anchor?.yaw || 0);
  const front = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).normalize();
  const halfDepth = Math.abs(front.x) > Math.abs(front.z) ? info.size.x * .5 : info.size.z * .5;
  const position = info.center.clone().addScaledVector(front, halfDepth + .43); position.y = 0;
  return { position, yaw: Math.atan2(info.center.x - position.x, info.center.z - position.z) };
}
function seat(reason = 'guard') {
  const rig = window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG;
  seatPose ||= computeSeat(); if (!rig?.setPlayerPose || !seatPose) return false;
  rig.setPlayerPose(seatPose.position.x, -0.42, seatPose.position.z); rig.setPlayerYaw?.(seatPose.yaw);
  state.seated = true; state.seatApplications++; state.lastSeatReason = reason; return true;
}
function qa() {
  return { ...state, teleportInputBlockedAtMainLoop: true, approvedTableVisible: Boolean(runtime?.table?.table && visible(runtime.table.table)), approvedEricVisible: Boolean(runtime?.dealer?.group && visible(runtime.dealer.group)), pass: Boolean(state.installed && state.seated && window.SVR_TELEPORT_DISABLED && !state.lastError), checkedAt: new Date().toISOString() };
}
function sweep(reason = 'guard') {
  try {
    scene = window.__SVR_SCENE__ || scene; renderer = window.__SVR_RENDERER__ || renderer; camera = window.__SVR_CAMERA__ || camera;
    runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE || runtime;
    if (!scene || !runtime?.table?.table || !runtime?.dealer?.loaded) return false;
    disableTeleport(); clearTableArea(); clearFace(); seat(reason);
    runtime.table.group.visible = true; runtime.table.table.visible = true; runtime.dealer.group.visible = true; if (runtime.dealer.model) runtime.dealer.model.visible = true;
    state.installed = state.seated; state.lastError = null; state.checkedAt = new Date().toISOString(); window.SVR_PHASE446_STATE = { ...state, reason }; return qa();
  } catch (error) { state.lastError = String(error?.stack || error?.message || error); state.checkedAt = new Date().toISOString(); return false; }
}
async function install() {
  if (!ACTIVE) return false;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE; scene = window.__SVR_SCENE__; renderer = window.__SVR_RENDERER__; camera = window.__SVR_CAMERA__;
    if (runtime?.table?.table && runtime?.dealer?.loaded && scene && renderer) break; await wait(80);
  }
  sweep('install'); renderer?.xr?.addEventListener?.('sessionstart', () => { seatPose = null; setTimeout(() => sweep('xr-sessionstart'), 350); });
  for (const delay of [100, 300, 700, 1500, 3000, 6000]) setTimeout(() => sweep(`settle-${delay}`), delay);
  if (!timer) timer = window.setInterval(() => sweep('guard'), 250); return qa();
}

window.SVR_PHASE446_SWEEP = sweep; window.SVR_PHASE446_QA = qa; window.SVR_PHASE446_READY_PROMISE = install();
addEventListener('beforeunload', () => { if (timer) clearInterval(timer); }, { once: true });
