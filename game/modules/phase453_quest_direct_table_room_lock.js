/* PHASE-453-QUEST-DIRECT-TABLE-ROOM-LOCK */
import * as THREE from 'three';

export const BUILD = 'PHASE-453-QUEST-DIRECT-TABLE-ROOM-LOCK';
const query = new URLSearchParams(location.search);
const ACTIVE = query.get('platform') === 'quest' || query.get('questfix') === '1' || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const LOBBY_ROOT = /LOBBY|STOREFRONT|PORTAL|ATRIUM|GIVEAWAY|MOON|MARS|SKYLINE|BUILDING|BALCONY|LOUNGE|HUB/i;
const KEEP = /PHASE438_APPROVED_|PHASE453_DIRECT_TABLE_ROOM|PHASE441_TABLE_SAFE_DECALS|PHASE341_|PHASE336_|PHASE337_|PHASE338_|PHASE390_|PHASE406_|PLAYER|CARD|CHIP|POT|HAND|DEAL|ERIC/i;
const state = { build: BUILD, active: ACTIVE, installed: false, lobbyRootsHidden: 0, roomReady: false, tableReady: false, ericReady: false, teleportDisabled: false, lastError: null, checkedAt: null };
let scene, renderer, runtime, room, timer = 0;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function approved(object) {
  for (let current = object; current; current = current.parent) {
    if (KEEP.test(String(current.name || '')) || current.userData?.svrPhase439Approved || current.userData?.svrPhase440Approved) return true;
  }
  return false;
}
function material(color, roughness = .78, metalness = .04) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, side: THREE.DoubleSide });
}
function panel(name, geometry, mat, position) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.copy(position);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  room.add(mesh);
  return mesh;
}
function tableCenter() {
  const table = runtime?.table?.table;
  if (!table) return new THREE.Vector3(0, 0, .75);
  table.updateWorldMatrix?.(true, true);
  return new THREE.Box3().setFromObject(table, true).getCenter(new THREE.Vector3());
}
function buildRoom() {
  if (!scene || room?.parent) return room;
  const center = tableCenter();
  room = new THREE.Group();
  room.name = 'PHASE453_DIRECT_TABLE_ROOM';
  room.userData = { svrPhase453DirectTableRoom: true, build: BUILD };
  const width = 8.5, depth = 7.0, height = 3.4, wall = .12;
  const floor = material(0x090a10, .86, .06);
  const walls = material(0x11101a, .82, .03);
  const accent = material(0x35105a, .55, .18);
  panel('PHASE453_TABLE_ROOM_FLOOR', new THREE.BoxGeometry(width, .08, depth), floor, new THREE.Vector3(center.x, -.04, center.z));
  panel('PHASE453_TABLE_ROOM_BACK_WALL', new THREE.BoxGeometry(width, height, wall), walls, new THREE.Vector3(center.x, height * .5, center.z - depth * .5));
  panel('PHASE453_TABLE_ROOM_FRONT_WALL', new THREE.BoxGeometry(width, height, wall), walls, new THREE.Vector3(center.x, height * .5, center.z + depth * .5));
  panel('PHASE453_TABLE_ROOM_LEFT_WALL', new THREE.BoxGeometry(wall, height, depth), walls, new THREE.Vector3(center.x - width * .5, height * .5, center.z));
  panel('PHASE453_TABLE_ROOM_RIGHT_WALL', new THREE.BoxGeometry(wall, height, depth), walls, new THREE.Vector3(center.x + width * .5, height * .5, center.z));
  panel('PHASE453_TABLE_ROOM_BACK_ACCENT', new THREE.BoxGeometry(3.8, .08, .035), accent, new THREE.Vector3(center.x, 2.35, center.z - depth * .5 + .07));
  const hemi = new THREE.HemisphereLight(0xdde7ff, 0x08050c, .78);
  hemi.name = 'PHASE453_TABLE_ROOM_AMBIENT';
  const fill = new THREE.PointLight(0xb989ff, .72, 9, 2);
  fill.name = 'PHASE453_TABLE_ROOM_FILL';
  fill.position.set(center.x, 2.65, center.z + .4);
  room.add(hemi, fill);
  scene.add(room);
  state.roomReady = true;
  return room;
}
function hideLobby() {
  if (!scene) return 0;
  let hidden = 0;
  for (const object of [...scene.children]) {
    if (!object || object === room || approved(object)) continue;
    const name = String(object.name || '');
    if (name === 'PHASE200_ORDERED_GRAND_LOBBY_ROOT' || LOBBY_ROOT.test(name)) {
      object.visible = false;
      object.userData = { ...(object.userData || {}), svrPhase453LobbyDisabled: true, build: BUILD };
      hidden++;
    }
  }
  document.querySelectorAll('[id*="portal" i],[class*="portal" i],[data-action*="portal" i],[id*="lobby" i],[class*="lobby" i]').forEach(element => {
    element.hidden = true;
    element.setAttribute('aria-hidden', 'true');
    element.style.display = 'none';
    element.style.pointerEvents = 'none';
  });
  state.lobbyRootsHidden = Math.max(state.lobbyRootsHidden, hidden);
  return hidden;
}
function disableTravel() {
  for (const key of ['SVR_TELEPORT_ENABLED','SVR_HAND_TELEPORT_ENABLED','SVR_WATCH_TELEPORT_ENABLED','SVR_GRIP_TELEPORT_ENABLED','SVR_TABLE_TRAVEL_ENABLED','SVR_MOVEMENT_ENABLED','SVR_LOCOMOTION_ENABLED']) {
    try { window[key] = false; } catch {}
  }
  window.SVR_TELEPORT_DISABLED = true;
  window.SVR_ALL_TELEPORT_DISABLED = true;
  state.teleportDisabled = true;
}
function sweep(reason = 'guard') {
  try {
    scene = window.__SVR_SCENE__ || scene;
    renderer = window.__SVR_RENDERER__ || renderer;
    runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE || runtime;
    if (!scene || !runtime?.table?.table || !runtime?.dealer?.loaded) return false;
    buildRoom();
    hideLobby();
    disableTravel();
    window.SVR_PHASE446_SWEEP?.('phase453-' + reason);
    runtime.table.group.visible = true;
    runtime.table.table.visible = true;
    runtime.dealer.group.visible = true;
    if (runtime.dealer.model) runtime.dealer.model.visible = true;
    state.tableReady = true;
    state.ericReady = true;
    state.installed = true;
    state.lastError = null;
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE453_STATE = { ...state, reason };
    return qa();
  } catch (error) {
    state.lastError = String(error?.stack || error?.message || error);
    state.checkedAt = new Date().toISOString();
    return false;
  }
}
function qa() {
  const grandLobby = scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT');
  return { ...state, grandLobbyVisible: Boolean(grandLobby?.visible), directTableRoom: Boolean(room?.parent && room.visible), pass: Boolean(state.installed && state.roomReady && state.tableReady && state.ericReady && state.teleportDisabled && grandLobby?.visible !== true && !state.lastError), checkedAt: new Date().toISOString() };
}
async function install() {
  if (!ACTIVE) return false;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    scene = window.__SVR_SCENE__;
    renderer = window.__SVR_RENDERER__;
    runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE;
    if (scene && renderer && runtime?.table?.table && runtime?.dealer?.loaded) break;
    await wait(80);
  }
  sweep('install');
  renderer?.xr?.addEventListener?.('sessionstart', () => setTimeout(() => sweep('xr-sessionstart'), 180));
  for (const delay of [100, 350, 800, 1600, 3200, 6000]) setTimeout(() => sweep('settle-' + delay), delay);
  if (!timer) timer = window.setInterval(() => sweep('guard'), 500);
  return qa();
}

window.SVR_PHASE453_SWEEP = sweep;
window.SVR_PHASE453_QA = qa;
window.SVR_PHASE453_READY_PROMISE = install();
addEventListener('beforeunload', () => { if (timer) clearInterval(timer); }, { once: true });
