import * as THREE from 'three';

export const BUILD = 'PHASE-373-QUEST-NPC-TELEPORT-POSTFLIGHT-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const ACTIVE = String(window.SVR_PLATFORM || params.get('platform') || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : 'desktop')).toLowerCase() === 'quest';
const TELEPORT_FLAGS = [
  'SVR_TELEPORT_ENABLED',
  'SVR_HAND_TELEPORT_ENABLED',
  'SVR_WATCH_TELEPORT_ENABLED',
  'SVR_GRIP_TELEPORT_ENABLED',
  'SVR_POINTER_ENABLED',
  'SVR_HAND_RAY_ENABLED',
  'SVR_LOCOMOTION_ENABLED',
  'SVR_TABLE_TRAVEL_ENABLED'
];

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  standingRestores: 0,
  seatedLocks: 0,
  explicitNpcRoots: 0,
  inferredHumanoidRoots: 0,
  npcRootsRepaired: 0,
  npcMeshesTextured: 0,
  npcRootsUpright: 0,
  npcRootsGrounded: 0,
  npcRootsFacingTable: 0,
  lastRestoreReason: null,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let scene = null;
let table = null;
let floor = null;
let timer = 0;
let npcTimer = 0;
const baselineFlags = new Map();
let baselineFloorTeleport = true;
const repairedRoots = new WeakSet();
const textureCache = { skin: null, eric: null, bot: null };
const tmp = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();

const seated = () => Boolean(window.SVR_PHASE361_STATE?.seated || document.body.classList.contains('svr361-seated'));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function walk(root, visitor, limit = 18000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { visitor(object); } catch {}
    for (const child of object.children || []) {
      if (child && child !== object && !seen.has(child)) stack.push(child);
    }
  }
  return seen.size;
}

function worldRoot() {
  return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
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
  if (!object?.parent) {
    object?.position?.add(delta);
    return;
  }
  object.parent.updateWorldMatrix?.(true, false);
  object.parent.getWorldQuaternion(tmpQ).invert();
  object.parent.getWorldScale(tmpScale);
  tmp.copy(delta).applyQuaternion(tmpQ);
  tmp.x /= Math.abs(tmpScale.x) > 1e-6 ? tmpScale.x : 1;
  tmp.y /= Math.abs(tmpScale.y) > 1e-6 ? tmpScale.y : 1;
  tmp.z /= Math.abs(tmpScale.z) > 1e-6 ? tmpScale.z : 1;
  object.position.add(tmp);
}

function captureBaseline() {
  for (const key of TELEPORT_FLAGS) {
    if (!baselineFlags.has(key)) baselineFlags.set(key, typeof window[key] === 'boolean' ? window[key] : true);
  }
  floor = window.SVR_DEVICE_FLOOR_AUTHORITY || floor;
  if (floor?.userData && typeof floor.userData.teleportSurface === 'boolean') {
    baselineFloorTeleport = floor.userData.teleportSurface;
  }
}

function lockSeatedTeleport() {
  for (const key of TELEPORT_FLAGS) window[key] = false;
  floor = window.SVR_DEVICE_FLOOR_AUTHORITY || floor;
  if (floor?.userData) floor.userData.teleportSurface = false;
  state.seatedLocks += 1;
}

function restoreStandingTeleport(reason = 'standing') {
  if (seated()) return false;
  captureBaseline();
  for (const key of TELEPORT_FLAGS) {
    const value = baselineFlags.get(key);
    window[key] = typeof value === 'boolean' ? value : true;
  }
  floor = window.SVR_DEVICE_FLOOR_AUTHORITY || floor;
  if (floor?.userData) floor.userData.teleportSurface = baselineFloorTeleport;
  state.standingRestores += 1;
  state.lastRestoreReason = reason;
  return true;
}

function scheduleStandingRestore(reason = 'leave-table') {
  for (const delay of [0, 180, 480, 900, 1600]) {
    window.setTimeout(() => restoreStandingTeleport(`${reason}:${delay}`), delay);
  }
}

function makeTexture(base, accent, label = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = base;
  context.fillRect(0, 0, 128, 128);
  context.globalAlpha = 0.32;
  context.strokeStyle = accent;
  context.lineWidth = 4;
  for (let offset = -128; offset < 256; offset += 18) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset + 128, 128);
    context.stroke();
  }
  context.globalAlpha = 1;
  if (label) {
    context.fillStyle = 'rgba(0,0,0,.54)';
    context.fillRect(0, 88, 128, 40);
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.font = '900 20px Arial, sans-serif';
    context.fillText(label, 64, 115);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function textures() {
  if (!textureCache.skin) textureCache.skin = makeTexture('#b97861', '#efbca4');
  if (!textureCache.eric) textureCache.eric = makeTexture('#24133a', '#b884ff', 'ERIC');
  if (!textureCache.bot) textureCache.bot = makeTexture('#082b37', '#7ffcff', 'SVR');
  return textureCache;
}

function explicitNpcName(object) {
  const name = String(object?.name || '');
  return /(eric|claudia|carla|npc|bot[_ -]?(avatar|player)?|seated[_ -]?player|player[_ -]?avatar|table[_ -]?avatar|phase356.*avatar|phase361.*npc)/i.test(name)
    && !/(table|watch|button|panel|dealer[_ -]?deck|phase368_card_dealer)/i.test(name);
}

function userDataNpc(object) {
  const data = object?.userData || {};
  return Boolean(
    data.svrPhase361Textured
    || data.svrPhase361FacesTable
    || data.svrPhase356Avatar
    || data.svrNpc
    || data.playerId
    || data.botId
  );
}

function humanLike(value) {
  if (!value || value.box.isEmpty()) return false;
  const maxHorizontal = Math.max(value.size.x, value.size.z);
  return value.size.y >= 0.35 && value.size.y <= 3.2 && maxHorizontal <= 2.4;
}

function ascendHumanoidRoot(object) {
  const root = worldRoot();
  let selected = object;
  let current = object?.parent;
  while (current && current !== root && current !== scene && !isAncestorOf(current, table)) {
    let value = null;
    try { value = bounds(current); } catch {}
    if (!humanLike(value)) break;
    selected = current;
    current = current.parent;
  }
  return selected;
}

function collectNpcRoots() {
  const root = worldRoot();
  const explicit = [];
  const inferred = [];
  walk(root, (object) => {
    if (!object?.isObject3D || object === table || isAncestorOf(object, table) || isAncestorOf(table, object)) return;
    if (explicitNpcName(object) || userDataNpc(object)) {
      const candidate = ascendHumanoidRoot(object);
      if (candidate && !explicit.includes(candidate)) explicit.push(candidate);
      return;
    }
    if (object.isSkinnedMesh || object.skeleton?.bones?.length) {
      const candidate = ascendHumanoidRoot(object);
      let value = null;
      try { value = bounds(candidate); } catch {}
      if (candidate && humanLike(value) && !inferred.includes(candidate)) inferred.push(candidate);
    }
  }, 18000);
  const combined = [...explicit];
  for (const candidate of inferred) {
    if (!combined.some((rootCandidate) => rootCandidate === candidate || isAncestorOf(rootCandidate, candidate) || isAncestorOf(candidate, rootCandidate))) {
      combined.push(candidate);
    }
  }
  state.explicitNpcRoots = explicit.length;
  state.inferredHumanoidRoots = inferred.length;
  return combined;
}

function applyTexture(root) {
  const available = textures();
  const rootName = String(root.name || '');
  const eric = /eric/i.test(rootName);
  let count = 0;
  walk(root, (object) => {
    if (!object?.isMesh || !object.material) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const label = `${object.name || ''} ${source.map((material) => material?.name || '').join(' ')}`.toLowerCase();
    const skinLike = /(head|face|skin|hand|arm|neck)/.test(label);
    const next = source.map((material) => {
      if (!material?.isMaterial) return material;
      const clone = material.userData?.svrPhase373Postflight ? material : material.clone();
      clone.userData = { ...(clone.userData || {}), svrPhase373Postflight: true };
      clone.visible = true;
      clone.opacity = 1;
      clone.colorWrite = true;
      clone.depthWrite = true;
      clone.side = THREE.DoubleSide;
      if (clone.map) {
        clone.map.colorSpace = THREE.SRGBColorSpace;
      } else {
        clone.map = skinLike ? available.skin : (eric ? available.eric : available.bot);
      }
      clone.color?.setHex?.(0xffffff);
      if ('roughness' in clone) clone.roughness = Math.max(0.55, Number(clone.roughness || 0.72));
      if ('metalness' in clone) clone.metalness = Math.min(0.16, Number(clone.metalness || 0.04));
      clone.needsUpdate = true;
      count += 1;
      return clone;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
    object.visible = true;
    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;
  }, 5000);
  return count;
}

function upright(root) {
  if (root.userData?.svrPhase373PostflightUpright) return true;
  const original = root.rotation.clone();
  const options = [
    original.clone(),
    original.clone().set(original.x + Math.PI / 2, original.y, original.z),
    original.clone().set(original.x - Math.PI / 2, original.y, original.z),
    original.clone().set(original.x, original.y, original.z + Math.PI / 2),
    original.clone().set(original.x, original.y, original.z - Math.PI / 2)
  ];
  let best = null;
  for (const rotation of options) {
    root.rotation.copy(rotation);
    let value = null;
    try { value = bounds(root); } catch {}
    if (!humanLike(value)) continue;
    const horizontal = Math.max(value.size.x, value.size.z, 0.001);
    const score = value.size.y / horizontal;
    if (!best || score > best.score) best = { rotation: rotation.clone(), score };
  }
  root.rotation.copy(best?.rotation || original);
  root.userData = { ...(root.userData || {}), svrPhase373PostflightUpright: true };
  return Boolean(best);
}

function ground(root) {
  let value = null;
  try { value = bounds(root); } catch {}
  if (!value || value.box.isEmpty()) return false;
  if (Math.abs(value.box.min.y) > 0.035) worldDelta(root, new THREE.Vector3(0, -value.box.min.y, 0));
  return true;
}

function faceTable(root) {
  if (!table?.isObject3D || !root?.parent) return false;
  const tableInfo = bounds(table);
  root.getWorldPosition(tmp);
  const parent = root.parent;
  const rootLocal = parent.worldToLocal(tmp.clone());
  const targetLocal = parent.worldToLocal(new THREE.Vector3(tableInfo.center.x, tmp.y, tableInfo.center.z));
  root.rotation.y = Math.atan2(-(targetLocal.x - rootLocal.x), -(targetLocal.z - rootLocal.z));
  root.userData = { ...(root.userData || {}), svrPhase373PostflightFacesTable: true };
  return true;
}

function repairNpcs() {
  scene = window.__SVR_SCENE__ || scene;
  table = window.SVR_TABLE_AUTHORITY || table;
  if (!scene || !table?.isObject3D) return { roots: 0, repaired: 0 };
  const roots = collectNpcRoots();
  let repaired = 0;
  let meshes = 0;
  let uprightCount = 0;
  let groundedCount = 0;
  let facingCount = 0;
  for (const root of roots) {
    if (!root?.isObject3D || root === table || isAncestorOf(root, table)) continue;
    root.visible = true;
    walk(root, (object) => { object.visible = true; }, 5000);
    meshes += applyTexture(root);
    if (upright(root)) uprightCount += 1;
    if (ground(root)) groundedCount += 1;
    if (faceTable(root)) facingCount += 1;
    repairedRoots.add(root);
    repaired += 1;
  }
  state.npcRootsRepaired = repaired;
  state.npcMeshesTextured = Math.max(state.npcMeshesTextured, meshes);
  state.npcRootsUpright = Math.max(state.npcRootsUpright, uprightCount);
  state.npcRootsGrounded = Math.max(state.npcRootsGrounded, groundedCount);
  state.npcRootsFacingTable = Math.max(state.npcRootsFacingTable, facingCount);
  return { roots: roots.length, repaired, meshes, upright: uprightCount, grounded: groundedCount, facing: facingCount };
}

function qa() {
  const teleportFlags = TELEPORT_FLAGS.reduce((output, key) => ({ ...output, [key]: window[key] }), {});
  const isSeated = seated();
  const allLocked = Object.values(teleportFlags).every((value) => value === false);
  const standingRestored = TELEPORT_FLAGS.every((key) => window[key] === baselineFlags.get(key));
  const result = {
    ...state,
    seated: isSeated,
    teleportFlags,
    standingRestored,
    npcRepairApiReady: typeof window.SVR_PHASE373_POSTFLIGHT_REPAIR_NPCS === 'function',
    npcValidation: state.npcRootsRepaired > 0 ? 'runtime-humanoids-repaired' : 'no-humanoid-roots-in-current-scene',
    pass: Boolean(ACTIVE && state.installed && !state.lastError && (isSeated ? allLocked : standingRestored)),
    checkedAt: new Date().toISOString()
  };
  state.checkedAt = result.checkedAt;
  window.SVR_PHASE373_POSTFLIGHT_STATE = { ...state };
  return result;
}

async function install() {
  if (!ACTIVE || state.installed) return;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    scene = window.__SVR_SCENE__ || scene;
    table = window.SVR_TABLE_AUTHORITY || table;
    if (scene && table?.isObject3D && typeof window.SVR_PHASE373_QA === 'function') break;
    await wait(120);
  }
  if (!scene || !table?.isObject3D) {
    state.lastError = 'QUEST_SCENE_OR_TABLE_NOT_READY';
    window.SVR_PHASE373_POSTFLIGHT_STATE = { ...state };
    return;
  }
  captureBaseline();
  window.SVR_PHASE373_POSTFLIGHT_RESTORE_TELEPORT = scheduleStandingRestore;
  window.SVR_PHASE373_POSTFLIGHT_REPAIR_NPCS = repairNpcs;
  window.SVR_PHASE373_POSTFLIGHT_QA = qa;
  window.addEventListener('svr:phase361-table-joined', () => lockSeatedTeleport());
  window.addEventListener('svr:phase361-table-left', () => scheduleStandingRestore('phase361-table-left'));
  state.installed = true;
  state.installedAt = new Date().toISOString();
  repairNpcs();
  timer = window.setInterval(() => {
    if (seated()) lockSeatedTeleport();
    else restoreStandingTeleport('standing-interval');
  }, 180);
  npcTimer = window.setInterval(repairNpcs, 1800);
  window.addEventListener('beforeunload', () => {
    clearInterval(timer);
    clearInterval(npcTimer);
  }, { once: true });
  window.SVR_PHASE373_POSTFLIGHT_STATE = { ...state };
  window.dispatchEvent(new CustomEvent('svr:phase373-postflight-ready', { detail: qa() }));
}

if (ACTIVE) install().catch((error) => {
  state.lastError = String(error?.stack || error?.message || error);
  window.SVR_PHASE373_POSTFLIGHT_STATE = { ...state };
});