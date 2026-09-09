/* PHASE-446-QUEST-LAB-TABLE-SEAT-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-446-QUEST-LAB-TABLE-SEAT-LOCK';
const query = new URLSearchParams(location.search);
const ACTIVE = query.get('platform') === 'quest' || query.get('questfix') === '1' || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const KEEP = /PHASE438_APPROVED_|PHASE441_TABLE_SAFE_DECALS|PHASE441_PASS_LINE|PHASE441_CENTER_SVR_LOGO|PHASE441_SPONSOR_/i;
const TABLE_CLUTTER = /(?:LEGACY|DUPLICATE|EXTRA|FLOATING).*(?:TABLE|TOP|SURFACE|FELT|COVER|OVERLAY)|TABLE.*(?:TOP|TOPPER|COVER).*LEGACY|PROTECTIVE.*(?:TOP|COVER)|TABLETOP|PLAYING.*SURFACE.*(?:LEGACY|DUPLICATE)|HOLOGRAM.*(?:TABLE|SURFACE)|TABLE.*OVERLAY/i;
const FACE_CLUTTER = /BLACK|DARK|SQUARE|OVERLAY|HUD|SCREEN|PANEL|GUIDE|TARGET|RETICLE|RAY|ARC|TELEPORT|WATCH.*FACE/i;
const TELEPORT_VISUAL = /TELEPORT|TARGET.?RING|POINTER|RETICLE|PARTICLE.*ARC|ARC.*PARTICLE|LASER/i;
const state = { build: BUILD, active: ACTIVE, installed: false, tabletopRootsHidden: 0, faceObjectsHidden: 0, teleportObjectsHidden: 0, seated: false, seatApplications: 0, lastError: null, checkedAt: null };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const tableBox = new THREE.Box3(), objectBox = new THREE.Box3(), size = new THREE.Vector3(), center = new THREE.Vector3(), head = new THREE.Vector3(), world = new THREE.Vector3();
let scene, renderer, camera, runtime, seatPose, timer = 0, seatY = -0.42;
const TARGET_EYE_ABOVE_TABLE = 0.66;
const PLAYER_RAIL_GAP = 0.16;
const QUEST_TABLE_SCALE_TRIM = 0.96;
const GAMEPLAY_VISUAL = /CARD|CHIP|POT|HAND|BUTTON|CONTROL|INTERACTION|DEAL|PLAYER|ERIC/i;
const FLOATING_LINE = /PHASE441_TABLE_SAFE_DECALS|PASS.?LINE|WHITE.?LINE|BLINK|FLASH|FLOATING.*LINE|GUIDE.?LINE/i;

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
function alignTableAndSeat() {
  const table = runtime?.table?.table;
  const dealer = runtime?.dealer?.group;
  if (!table || !dealer) return null;
  if (!table.userData.svrPhase452TurnedForEric) {
    table.rotation.y += Math.PI;
    table.scale.multiplyScalar(QUEST_TABLE_SCALE_TRIM);
    table.userData.svrPhase452TurnedForEric = true;
    table.userData.svrPhase452ScaleTrim = QUEST_TABLE_SCALE_TRIM;
    table.updateWorldMatrix?.(true, true);
    seatPose = null;
  }
  const info = bounds(); if (!info) return null;
  const dealerPosition = dealer.getWorldPosition(new THREE.Vector3());
  const toDealer = dealerPosition.sub(info.center); toDealer.y = 0;
  if (toDealer.lengthSq() < 0.0001) toDealer.set(0, 0, 1);
  toDealer.normalize();
  const playerSide = toDealer.multiplyScalar(-1);
  const projectedHalfExtent = Math.abs(playerSide.x) * info.size.x * .5 + Math.abs(playerSide.z) * info.size.z * .5;
  const position = info.center.clone().addScaledVector(playerSide, projectedHalfExtent + PLAYER_RAIL_GAP);
  position.y = 0;
  return { position, yaw: Math.atan2(info.center.x - position.x, info.center.z - position.z) };
}
function clearFloatingTableLines() {
  const info = bounds(); if (!info || !scene) return;
  const decalRoot = scene.getObjectByName?.('PHASE441_TABLE_SAFE_DECALS');
  if (decalRoot) {
    decalRoot.visible = false;
    decalRoot.userData = { ...(decalRoot.userData || {}), svrPhase452Removed: true };
  }
  scene.traverse(object => {
    if (!object?.isMesh || !visible(object) || GAMEPLAY_VISUAL.test(String(object.name || ''))) return;
    const label = String(object.name || '') + ' ' + String(object.material?.name || '');
    if (!FLOATING_LINE.test(label)) return;
    try { objectBox.setFromObject(object, true); } catch { return; }
    if (objectBox.isEmpty()) return;
    const objectSize = objectBox.getSize(new THREE.Vector3());
    const objectCenter = objectBox.getCenter(new THREE.Vector3());
    const overTable = objectCenter.x >= info.box.min.x - .1 && objectCenter.x <= info.box.max.x + .1 && objectCenter.z >= info.box.min.z - .1 && objectCenter.z <= info.box.max.z + .1;
    const nearSurface = objectBox.min.y >= info.box.min.y && objectBox.max.y <= info.box.max.y + 1.2;
    if (overTable && nearSurface && objectSize.y <= .12) hide(object, 'svrPhase452FloatingLineRemoved');
  });
}
function computeSeat() { return alignTableAndSeat(); }
function seat(reason = 'guard') {
  const rig = window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG;
  seatPose ||= computeSeat(); if (!rig?.setPlayerPose || !seatPose) return false;
  const info = bounds();
  if (renderer?.xr?.isPresenting && info && camera) {
    const xr = renderer.xr.getCamera(camera), eye = xr?.cameras?.[0] || xr || camera;
    eye?.getWorldPosition?.(head);
    const currentGap = head.y - info.box.max.y;
    if (Number.isFinite(currentGap)) seatY = THREE.MathUtils.clamp(seatY + THREE.MathUtils.clamp(TARGET_EYE_ABOVE_TABLE - currentGap, -.10, .10) * .35, -.62, .12);
  }
  rig.setPlayerPose(seatPose.position.x, seatY, seatPose.position.z); rig.setPlayerYaw?.(seatPose.yaw);
  state.seated = true; state.seatY = Number(seatY.toFixed(3)); state.targetEyeAboveTable = TARGET_EYE_ABOVE_TABLE; state.seatApplications++; state.lastSeatReason = reason; return true;
}
function qa() {
  return { ...state, teleportInputBlockedAtMainLoop: true, approvedTableVisible: Boolean(runtime?.table?.table && visible(runtime.table.table)), approvedEricVisible: Boolean(runtime?.dealer?.group && visible(runtime.dealer.group)), tableTurnedForEric: Boolean(runtime?.table?.table?.userData?.svrPhase452TurnedForEric), playerRailGap: PLAYER_RAIL_GAP, tableScaleTrim: QUEST_TABLE_SCALE_TRIM, floatingLineVisible: Boolean(scene?.getObjectByName?.('PHASE441_TABLE_SAFE_DECALS')?.visible), pass: Boolean(state.installed && state.seated && window.SVR_TELEPORT_DISABLED && !state.lastError), checkedAt: new Date().toISOString() };
}
function sweep(reason = 'guard') {
  try {
    scene = window.__SVR_SCENE__ || scene; renderer = window.__SVR_RENDERER__ || renderer; camera = window.__SVR_CAMERA__ || camera;
    runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE || runtime;
    if (!scene || !runtime?.table?.table || !runtime?.dealer?.loaded) return false;
    disableTeleport(); alignTableAndSeat(); clearTableArea(); clearFloatingTableLines(); clearFace(); seat(reason);
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
