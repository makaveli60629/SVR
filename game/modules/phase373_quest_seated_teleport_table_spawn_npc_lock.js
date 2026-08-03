import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const BUILD = 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(window.SVR_PLATFORM || params.get('platform') || document.body?.dataset?.platform || (
  /Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : 'desktop'
)).toLowerCase();
const ACTIVE = platform === 'quest';
const TABLE_TARGET = Object.freeze({ length: 2.74, height: 0.80, depth: 1.46, centerX: 0, centerZ: 0.75 });
const LOBBY_GAP = 0.90;
const SEAT_GAP = 0.62;
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
const RIG_MOVE_METHODS = ['teleport', 'teleportTo', 'moveTo', 'setTeleportPosition', 'setPosition', 'setPlayerPose'];
const TABLE_NAMES = [
  'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED',
  'PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT',
  'PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED',
  'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER',
  'PHASE373_VISIBLE_TABLE_GLB_AUTHORITY'
];

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  tableReady: false,
  tableName: null,
  tableSource: null,
  tableVisibleMeshes: 0,
  tableFallbackLoads: 0,
  tableFallbackFailures: 0,
  stableLobbyApplications: 0,
  stableSeatApplications: 0,
  positionCorrections: 0,
  teleportFlagsLocked: false,
  rigMethodsWrapped: 0,
  blockedRigMoves: 0,
  squeezeListenersSuspended: 0,
  teleportVisualsHidden: 0,
  npcRootsFound: 0,
  npcRootsVisible: 0,
  npcRootsTextured: 0,
  npcRootsUpright: 0,
  npcRootsGrounded: 0,
  npcRootsFacingTable: 0,
  lastMode: 'booting',
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let scene = null;
let camera = null;
let renderer = null;
let table = null;
let loaderPromise = null;
let timer = 0;
let frameHandle = 0;
let internalMove = false;
let lastSeated = false;
let lastNpcSweepAt = 0;
let stableAnchor = null;

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const savedFlags = new Map();
const savedTeleportVisibility = new Map();
const savedTeleportSurface = new Map();
const suspendedControllerListeners = new Map();
const wrappedRigMethods = new WeakMap();
const textureCache = { skin: null, eric: null, bot: null };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const seated = () => Boolean(window.SVR_PHASE361_STATE?.seated || document.body.classList.contains('svr361-seated'));

function walk(root, visitor, limit = 16000) {
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

function bounds(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return {
    box,
    size: box.getSize(new THREE.Vector3()),
    center: box.getCenter(new THREE.Vector3())
  };
}

function validTableBounds(value) {
  return Boolean(value && !value.box.isEmpty() && value.size.x > 1.3 && value.size.z > 0.7 && value.size.y > 0.18);
}

function candidateTable() {
  const root = worldRoot();
  const direct = [window.SVR_TABLE_AUTHORITY, table];
  for (const object of direct) {
    if (!object?.isObject3D) continue;
    try { if (validTableBounds(bounds(object))) return object; } catch {}
  }
  for (const name of TABLE_NAMES) {
    const object = root?.getObjectByName?.(name) || scene?.getObjectByName?.(name);
    if (!object?.isObject3D) continue;
    try { if (validTableBounds(bounds(object))) return object; } catch {}
  }
  return null;
}

function cloneVisibleMaterial(material, meshName = '') {
  if (!material?.isMaterial) return material;
  if (material.userData?.svrPhase373Visible) return material;
  const clone = material.clone();
  clone.userData = { ...(clone.userData || {}), svrPhase373Visible: true };
  clone.visible = true;
  clone.opacity = 1;
  clone.transparent = Boolean(clone.map?.image) && Boolean(material.transparent);
  clone.colorWrite = true;
  clone.depthWrite = true;
  clone.depthTest = true;
  clone.side = THREE.DoubleSide;
  if (clone.map) {
    clone.map.colorSpace = THREE.SRGBColorSpace;
    if (clone.color?.setHex) clone.color.setHex(0xffffff);
  } else if (clone.color?.setHex) {
    clone.color.setHex(/felt|cloth|baize|surface|top/i.test(meshName) ? 0x130c1f : 0x171a20);
  }
  if ('roughness' in clone) clone.roughness = /felt|cloth|baize|surface|top/i.test(meshName) ? 0.88 : 0.58;
  if ('metalness' in clone) clone.metalness = /leg|frame|metal/i.test(meshName) ? 0.28 : 0.06;
  clone.needsUpdate = true;
  return clone;
}

function forceTableVisible(object) {
  if (!object?.isObject3D) return 0;
  let current = object;
  while (current) {
    current.visible = true;
    current = current.parent;
  }
  let meshes = 0;
  walk(object, (child) => {
    child.visible = true;
    if (!child.isMesh) return;
    meshes += 1;
    const list = Array.isArray(child.material) ? child.material : [child.material];
    const next = list.map((material) => cloneVisibleMaterial(material, `${child.name || ''} ${material?.name || ''}`));
    child.material = Array.isArray(child.material) ? next : next[0];
    child.frustumCulled = false;
    child.castShadow = false;
    child.receiveShadow = true;
  }, 12000);
  state.tableVisibleMeshes = meshes;
  state.tableReady = meshes > 0;
  state.tableName = object.name || 'unnamed-table';
  return meshes;
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

function alignTable(object) {
  if (!object?.isObject3D) return false;
  forceTableVisible(object);
  let value = bounds(object);
  if (!validTableBounds(value)) return false;
  if (value.size.z > value.size.x * 1.12) {
    object.rotation.y += Math.PI / 2;
    value = bounds(object);
  }
  object.scale.set(
    object.scale.x * THREE.MathUtils.clamp(TABLE_TARGET.length / Math.max(value.size.x, 0.001), 0.35, 2.2),
    object.scale.y * THREE.MathUtils.clamp(TABLE_TARGET.height / Math.max(value.size.y, 0.001), 0.35, 2.2),
    object.scale.z * THREE.MathUtils.clamp(TABLE_TARGET.depth / Math.max(value.size.z, 0.001), 0.35, 2.2)
  );
  value = bounds(object);
  worldDelta(object, new THREE.Vector3(
    TABLE_TARGET.centerX - value.center.x,
    -value.box.min.y,
    TABLE_TARGET.centerZ - value.center.z
  ));
  forceTableVisible(object);
  table = object;
  window.SVR_TABLE_AUTHORITY = object;
  window.SVR_PHASE364_ALIGN_TABLE?.();
  state.tableReady = true;
  state.tableName = object.name || 'unnamed-table';
  return true;
}

async function loadFallbackTable() {
  if (loaderPromise) return loaderPromise;
  loaderPromise = (async () => {
    try {
      const url = new URL('../assets/models/table.glb', import.meta.url).href;
      const gltf = await new GLTFLoader().loadAsync(url);
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root?.isObject3D) throw new Error('TABLE_GLB_SCENE_MISSING');
      root.name = 'PHASE373_VISIBLE_TABLE_GLB_AUTHORITY';
      worldRoot()?.add(root);
      state.tableFallbackLoads += 1;
      state.tableSource = 'game/assets/models/table.glb';
      alignTable(root);
      window.dispatchEvent(new CustomEvent('svr:phase373-table-ready', { detail: qa() }));
      return root;
    } catch (error) {
      state.tableFallbackFailures += 1;
      state.lastError = String(error?.message || error);
      return null;
    }
  })();
  return loaderPromise;
}

async function ensureTable() {
  const existing = candidateTable();
  if (existing) {
    state.tableSource = existing.name || 'existing-authority';
    alignTable(existing);
    return existing;
  }
  return loadFallbackTable();
}

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

function headPosition(target = new THREE.Vector3()) {
  activeCamera()?.getWorldPosition?.(target);
  return target;
}

function currentPose() {
  const value = rig()?.getPlayerPose?.();
  return value || rig()?.position || { x: camera?.position?.x || 0, y: 0, z: camera?.position?.z || 0 };
}

function setRigPose(x, y, z, target = null) {
  const value = rig();
  internalMove = true;
  let ok = false;
  try {
    const original = value?.userData?.svrPhase373OriginalSetPlayerPose;
    if (typeof original === 'function') {
      original.call(value, x, y, z);
      ok = true;
    } else if (typeof value?.setPlayerPose === 'function') {
      value.setPlayerPose(x, y, z);
      ok = true;
    } else if (value?.position) {
      value.position.set(x, y, z);
      ok = true;
    } else if (!renderer?.xr?.isPresenting && camera?.position) {
      camera.position.set(x, y + 1.62, z);
      ok = true;
    }
    if (target) {
      const dx = target.x - x;
      const dz = target.z - z;
      if (value?.rotation) value.rotation.y = Math.atan2(-dx, -dz);
      else if (!renderer?.xr?.isPresenting) camera?.lookAt?.(target);
    }
  } finally {
    internalMove = false;
  }
  return ok;
}

function anchors() {
  if (!table?.isObject3D) table = candidateTable();
  if (!table) return null;
  const value = bounds(table);
  if (!validTableBounds(value)) return null;
  const topY = value.box.max.y;
  const frontZ = value.box.max.z;
  return {
    value,
    lobby: {
      x: value.center.x,
      y: 0,
      z: frontZ + LOBBY_GAP,
      target: new THREE.Vector3(value.center.x, topY + 0.10, value.center.z)
    },
    seat: {
      x: value.center.x,
      z: frontZ + SEAT_GAP,
      eyeY: topY + 0.58,
      target: new THREE.Vector3(value.center.x, topY + 0.04, value.center.z - value.size.z * 0.08)
    }
  };
}

function stableLobby(reason = 'manual') {
  const value = anchors();
  if (!value) return false;
  stableAnchor = { mode: 'lobby', ...value.lobby };
  const ok = setRigPose(value.lobby.x, 0, value.lobby.z, value.lobby.target);
  state.stableLobbyApplications += ok ? 1 : 0;
  state.lastMode = 'lobby';
  state.lastSpawnReason = reason;
  return ok;
}

function stableSeat(reason = 'manual') {
  const value = anchors();
  if (!value) return false;
  const head = headPosition(tmp);
  const pose = currentPose();
  const y = THREE.MathUtils.clamp(Number(pose.y || 0) + (value.seat.eyeY - head.y), -0.62, 0.28);
  stableAnchor = { mode: 'seated', x: value.seat.x, y, z: value.seat.z, target: value.seat.target };
  const ok = setRigPose(value.seat.x, y, value.seat.z, value.seat.target);
  state.stableSeatApplications += ok ? 1 : 0;
  state.lastMode = 'seated';
  state.lastSeatReason = reason;
  return ok;
}

function wrapRigMethods() {
  const value = rig();
  if (!value || wrappedRigMethods.has(value)) return 0;
  const wrapped = [];
  for (const name of RIG_MOVE_METHODS) {
    const original = value[name];
    if (typeof original !== 'function') continue;
    if (name === 'setPlayerPose') value.userData = { ...(value.userData || {}), svrPhase373OriginalSetPlayerPose: original };
    value[name] = function phase373RigMoveGuard(...args) {
      if (seated() && !internalMove) {
        state.blockedRigMoves += 1;
        return false;
      }
      return original.apply(this, args);
    };
    wrapped.push(name);
  }
  wrappedRigMethods.set(value, wrapped);
  state.rigMethodsWrapped = wrapped.length;
  return wrapped.length;
}

function lockTeleportFlags() {
  for (const key of TELEPORT_FLAGS) {
    if (!savedFlags.has(key)) savedFlags.set(key, window[key]);
    window[key] = false;
  }
  const floor = window.SVR_DEVICE_FLOOR_AUTHORITY;
  if (floor?.userData) {
    if (!savedTeleportSurface.has(floor)) savedTeleportSurface.set(floor, floor.userData.teleportSurface);
    floor.userData.teleportSurface = false;
  }
  state.teleportFlagsLocked = true;
}

function restoreTeleportFlags() {
  for (const key of TELEPORT_FLAGS) {
    const prior = savedFlags.get(key);
    window[key] = typeof prior === 'boolean' ? prior : true;
  }
  for (const [floor, prior] of savedTeleportSurface) {
    if (floor?.userData) floor.userData.teleportSurface = prior;
  }
  state.teleportFlagsLocked = false;
}

function teleportVisual(object) {
  const name = String(object?.name || '');
  return /(teleport|teleporter|teleportation|teleport[_ -]?arc|teleport[_ -]?ray|teleport[_ -]?marker|landing[_ -]?marker)/i.test(name)
    && !/table|portal|room/i.test(name);
}

function hideTeleportVisuals() {
  let hidden = 0;
  walk(scene, (object) => {
    if (!teleportVisual(object)) return;
    if (!savedTeleportVisibility.has(object)) savedTeleportVisibility.set(object, object.visible);
    object.visible = false;
    hidden += 1;
  }, 14000);
  state.teleportVisualsHidden = Math.max(state.teleportVisualsHidden, hidden);
  return hidden;
}

function restoreTeleportVisuals() {
  for (const [object, visible] of savedTeleportVisibility) {
    if (object) object.visible = visible;
  }
  savedTeleportVisibility.clear();
}

function controllerSources() {
  const result = [];
  for (let index = 0; index < 2; index += 1) {
    const controller = renderer?.xr?.getController?.(index);
    if (controller) result.push(controller);
  }
  return result;
}

function suspendSqueezeListeners() {
  let count = 0;
  for (const controller of controllerSources()) {
    if (suspendedControllerListeners.has(controller)) continue;
    const saved = {};
    for (const eventName of ['squeezestart', 'squeezeend']) {
      const listeners = Array.isArray(controller._listeners?.[eventName]) ? [...controller._listeners[eventName]] : [];
      saved[eventName] = listeners;
      for (const listener of listeners) controller.removeEventListener(eventName, listener);
      count += listeners.length;
    }
    suspendedControllerListeners.set(controller, saved);
  }
  state.squeezeListenersSuspended = count;
  return count;
}

function restoreSqueezeListeners() {
  for (const [controller, saved] of suspendedControllerListeners) {
    for (const [eventName, listeners] of Object.entries(saved)) {
      for (const listener of listeners) controller.addEventListener(eventName, listener);
    }
  }
  suspendedControllerListeners.clear();
  state.squeezeListenersSuspended = 0;
}

function enforceStablePosition() {
  if (!stableAnchor) return;
  const current = headPosition(tmp);
  const distance = Math.hypot(current.x - stableAnchor.x, current.z - stableAnchor.z);
  const threshold = stableAnchor.mode === 'seated' ? 0.14 : 0.34;
  if (distance <= threshold) return;
  setRigPose(stableAnchor.x, stableAnchor.y || 0, stableAnchor.z, stableAnchor.target || null);
  state.positionCorrections += 1;
}

function textureCanvas(base, accent, label) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = base;
  context.fillRect(0, 0, 128, 128);
  context.globalAlpha = 0.30;
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
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.font = '900 21px Arial, sans-serif';
    context.fillText(label, 64, 115);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function npcTextures() {
  if (!textureCache.skin) textureCache.skin = textureCanvas('#b97861', '#e7b49c', '');
  if (!textureCache.eric) textureCache.eric = textureCanvas('#24133a', '#b884ff', 'ERIC');
  if (!textureCache.bot) textureCache.bot = textureCanvas('#082b37', '#7ffcff', 'SVR');
  return textureCache;
}

function npcCandidates() {
  const root = worldRoot();
  const candidates = [];
  walk(root, (object) => {
    const name = String(object?.name || '');
    if (!/(eric|claudia|carla|bot[_ -]?avatar|npc[_ -]?player|seated[_ -]?player|dealer[_ -]?avatar)/i.test(name)) return;
    if (/PHASE368_CARD_DEALER/i.test(name)) return;
    let top = object;
    let parent = object.parent;
    while (parent && parent !== root && /(eric|claudia|carla|bot[_ -]?avatar|npc[_ -]?player|seated[_ -]?player|dealer[_ -]?avatar)/i.test(String(parent.name || ''))) {
      top = parent;
      parent = parent.parent;
    }
    if (!candidates.includes(top)) candidates.push(top);
  }, 12000);
  return candidates;
}

function textureNpc(root) {
  const textures = npcTextures();
  const isEric = /eric/i.test(String(root.name || ''));
  let applied = 0;
  walk(root, (object) => {
    if (!object.isMesh || !object.material) return;
    const meshLabel = `${object.name || ''} ${(Array.isArray(object.material) ? object.material : [object.material]).map((material) => material?.name || '').join(' ')}`.toLowerCase();
    const skinLike = /(head|face|skin|hand|arm|neck)/.test(meshLabel);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const next = materials.map((material) => {
      if (!material?.isMaterial) return material;
      if (material.userData?.svrPhase373NpcTexture) return material;
      const clone = material.clone();
      clone.userData = { ...(clone.userData || {}), svrPhase373NpcTexture: true };
      clone.visible = true;
      clone.opacity = 1;
      clone.colorWrite = true;
      clone.side = THREE.DoubleSide;
      if (clone.map) {
        clone.map.colorSpace = THREE.SRGBColorSpace;
        clone.color?.setHex?.(0xffffff);
      } else {
        clone.map = skinLike ? textures.skin : (isEric ? textures.eric : textures.bot);
        clone.color?.setHex?.(0xffffff);
      }
      if ('roughness' in clone) clone.roughness = Math.max(0.55, Number(clone.roughness || 0.72));
      if ('metalness' in clone) clone.metalness = Math.min(0.16, Number(clone.metalness || 0.04));
      clone.needsUpdate = true;
      applied += 1;
      return clone;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
    object.visible = true;
    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;
  }, 3500);
  root.userData = { ...(root.userData || {}), svrPhase373Textured: applied > 0 };
  return applied > 0;
}

function chooseUprightRotation(root) {
  if (root.userData?.svrPhase373Upright) return true;
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
    const value = bounds(root);
    const horizontal = Math.max(value.size.x, value.size.z, 0.001);
    const score = value.size.y / horizontal - Math.max(0, value.size.y - 2.8) * 4;
    if (!best || score > best.score) best = { rotation: rotation.clone(), value, score };
  }
  root.rotation.copy(best?.rotation || original);
  root.userData = { ...(root.userData || {}), svrPhase373Upright: true };
  return Boolean(best);
}

function groundNpc(root) {
  const value = bounds(root);
  if (value.box.min.y < -0.04 || value.box.min.y > 0.04) {
    worldDelta(root, new THREE.Vector3(0, -value.box.min.y, 0));
    return true;
  }
  return false;
}

function faceNpcToTable(root, tableInfo) {
  root.getWorldPosition(tmp);
  const parent = root.parent;
  if (!parent) return false;
  const rootLocal = parent.worldToLocal(tmp.clone());
  const targetLocal = parent.worldToLocal(new THREE.Vector3(tableInfo.center.x, tmp.y, tableInfo.center.z));
  const dx = targetLocal.x - rootLocal.x;
  const dz = targetLocal.z - rootLocal.z;
  root.rotation.y = Math.atan2(-dx, -dz);
  root.userData = { ...(root.userData || {}), svrPhase373FacesTable: true };
  return true;
}

function repairNpcs() {
  if (!table?.isObject3D) table = candidateTable();
  if (!table) return { quarantined: 0, aligned: 0, visible: 0, textured: 0, upright: 0, grounded: 0 };
  const tableInfo = bounds(table);
  let visible = 0;
  let textured = 0;
  let upright = 0;
  let grounded = 0;
  let aligned = 0;
  const roots = npcCandidates();
  for (const root of roots) {
    root.visible = true;
    walk(root, (object) => { object.visible = true; }, 3000);
    visible += 1;
    if (textureNpc(root)) textured += 1;
    if (chooseUprightRotation(root)) upright += 1;
    if (groundNpc(root)) grounded += 1;
    if (faceNpcToTable(root, tableInfo)) aligned += 1;
    root.userData = { ...(root.userData || {}), svrPhase364Quarantined: false, svrPhase373Recovered: true };
  }
  state.npcRootsFound = roots.length;
  state.npcRootsVisible = visible;
  state.npcRootsTextured = Math.max(state.npcRootsTextured, textured);
  state.npcRootsUpright = Math.max(state.npcRootsUpright, upright);
  state.npcRootsGrounded = Math.max(state.npcRootsGrounded, grounded);
  state.npcRootsFacingTable = Math.max(state.npcRootsFacingTable, aligned);
  return { quarantined: 0, aligned, visible, textured, upright, grounded };
}

function applySeatedLock() {
  wrapRigMethods();
  lockTeleportFlags();
  suspendSqueezeListeners();
  hideTeleportVisuals();
  if (stableAnchor?.mode !== 'seated') stableSeat('seated-lock');
  enforceStablePosition();
}

function releaseSeatedLock() {
  restoreTeleportFlags();
  restoreSqueezeListeners();
  restoreTeleportVisuals();
}

function qa() {
  const value = table?.isObject3D ? bounds(table) : null;
  const currentHead = headPosition(new THREE.Vector3());
  const tablePass = validTableBounds(value)
    && Math.abs(value.size.x - TABLE_TARGET.length) <= 0.12
    && Math.abs(value.size.y - TABLE_TARGET.height) <= 0.12
    && Math.abs(value.size.z - TABLE_TARGET.depth) <= 0.12
    && state.tableVisibleMeshes > 0;
  const result = {
    ...state,
    seated: seated(),
    tablePass,
    tableBounds: value ? {
      size: { x: +value.size.x.toFixed(3), y: +value.size.y.toFixed(3), z: +value.size.z.toFixed(3) },
      center: { x: +value.center.x.toFixed(3), y: +value.center.y.toFixed(3), z: +value.center.z.toFixed(3) },
      minY: +value.box.min.y.toFixed(3)
    } : null,
    stableAnchor: stableAnchor ? {
      mode: stableAnchor.mode,
      x: +stableAnchor.x.toFixed(3),
      y: +(stableAnchor.y || 0).toFixed(3),
      z: +stableAnchor.z.toFixed(3)
    } : null,
    currentHead: { x: +currentHead.x.toFixed(3), y: +currentHead.y.toFixed(3), z: +currentHead.z.toFixed(3) },
    teleportFlags: TELEPORT_FLAGS.reduce((output, key) => ({ ...output, [key]: window[key] }), {}),
    pass: Boolean(ACTIVE && state.installed && tablePass && state.rigMethodsWrapped > 0 && !state.lastError),
    checkedAt: new Date().toISOString()
  };
  if (result.seated) {
    result.pass = result.pass
      && result.teleportFlagsLocked
      && Object.values(result.teleportFlags).every((value) => value === false)
      && result.stableAnchor?.mode === 'seated';
  }
  state.checkedAt = result.checkedAt;
  window.SVR_PHASE373_STATE = { ...state };
  window.SVR_PHASE373_QA_STATE = result;
  return result;
}

function frame() {
  if (!ACTIVE || !state.installed) return;
  const isSeated = seated();
  if (isSeated) applySeatedLock();
  else if (lastSeated) {
    releaseSeatedLock();
    stableLobby('leave-table-stable');
  }
  if (!isSeated && stableAnchor?.mode === 'lobby') enforceStablePosition();
  if (isSeated !== lastSeated) {
    if (isSeated) window.setTimeout(() => stableSeat('join-table-stable'), 180);
    lastSeated = isSeated;
  }
  const now = performance.now();
  if (now - lastNpcSweepAt > 1800) {
    lastNpcSweepAt = now;
    forceTableVisible(table);
    repairNpcs();
  }
  frameHandle = requestAnimationFrame(frame);
}

async function install() {
  if (!ACTIVE || state.installed) return;
  const started = performance.now();
  while (performance.now() - started < 30000) {
    scene = window.__SVR_SCENE__ || scene;
    camera = window.__SVR_CAMERA__ || camera;
    renderer = window.__SVR_RENDERER__ || renderer;
    if (scene && camera && renderer && rig()) break;
    await wait(120);
  }
  if (!scene || !camera || !renderer || !rig()) {
    state.lastError = 'QUEST_RUNTIME_OR_RIG_NOT_READY';
    window.SVR_PHASE373_STATE = { ...state };
    return;
  }
  table = await ensureTable();
  if (!table) {
    state.lastError = state.lastError || 'QUEST_TABLE_NOT_READY';
    window.SVR_PHASE373_STATE = { ...state };
    return;
  }
  forceTableVisible(table);
  wrapRigMethods();
  window.SVR_PHASE364_SANITIZE_NPCS = repairNpcs;
  window.SVR_PHASE364_LOBBY_SPAWN = () => stableLobby('phase364-public-bridge');
  window.SVR_PHASE364_SEAT = () => stableSeat('phase364-public-bridge');
  window.SVR_PHASE373_STABLE_LOBBY = () => stableLobby('public-api');
  window.SVR_PHASE373_STABLE_SEAT = () => stableSeat('public-api');
  window.SVR_PHASE373_REPAIR_TABLE = async () => {
    table = await ensureTable();
    forceTableVisible(table);
    return qa();
  };
  window.SVR_PHASE373_REPAIR_NPCS = repairNpcs;
  window.SVR_PHASE373_QA = qa;
  window.addEventListener('svr:phase361-table-joined', () => window.setTimeout(() => stableSeat('phase361-joined-event'), 180));
  window.addEventListener('svr:phase361-table-left', () => window.setTimeout(() => stableLobby('phase361-left-event'), 180));
  renderer.xr?.addEventListener?.('sessionstart', () => window.setTimeout(() => stableLobby('xr-session-start'), 450));
  repairNpcs();
  stableLobby('install');
  state.installed = true;
  state.installedAt = new Date().toISOString();
  state.lastMode = 'lobby';
  timer = window.setInterval(() => {
    forceTableVisible(table);
    wrapRigMethods();
    if (seated()) applySeatedLock();
    window.SVR_PHASE373_STATE = { ...state };
  }, 500);
  frameHandle = requestAnimationFrame(frame);
  window.addEventListener('beforeunload', () => {
    clearInterval(timer);
    cancelAnimationFrame(frameHandle);
    releaseSeatedLock();
  }, { once: true });
  window.SVR_PHASE373_STATE = { ...state };
  window.dispatchEvent(new CustomEvent('svr:phase373-ready', { detail: qa() }));
}

if (ACTIVE) install().catch((error) => {
  state.lastError = String(error?.stack || error?.message || error);
  window.SVR_PHASE373_STATE = { ...state };
});