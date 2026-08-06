/* PHASE-387-QUEST-DIRECT-SEAT-RECOVERY-LOCK */
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const BUILD = 'PHASE-387-QUEST-DIRECT-SEAT-RECOVERY-LOCK';

const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(window.SVR_PLATFORM || params.get('platform') || (/Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : 'desktop')).toLowerCase();
const ACTIVE = platform === 'quest' || params.get('direct') === '1' || params.get('questfix') === '1';
const FRONT_GAP = 0.48;
const LOCK_FLAGS = [
  'SVR_MOVEMENT_ENABLED',
  'SVR_LOCOMOTION_ENABLED',
  'SVR_TABLE_TRAVEL_ENABLED',
  'SVR_TELEPORT_ENABLED',
  'SVR_HAND_TELEPORT_ENABLED',
  'SVR_WATCH_TELEPORT_ENABLED',
  'SVR_GRIP_TELEPORT_ENABLED',
  'SVR_POINTER_ENABLED',
  'SVR_HAND_RAY_ENABLED',
  'SVR_SNAP_TURN_ENABLED',
  'SVR_STICK_MOVE_ENABLED'
];
const TELEPORT_RX = /(teleport|landing|reticle|marker|arc|raycast|ray[_ -]?line)/i;
const KEEP_RX = /(table|card|poker|logo|button|action|avatar|dealer|eric|moon|mars|earth|star|watch|controller|hand)/i;
const APPROVED_ERIC_NAME = 'PHASE381_APPROVED_CARD_DEALER_RIG';

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  cacheRecoveryEntry: params.get('clean') === '1' || params.get('direct') === '1',
  sceneReady: false,
  tableReady: false,
  seated: false,
  directSeatApplications: 0,
  anchorCorrections: 0,
  lobbyMovesBlocked: 0,
  lockedFlags: false,
  teleportVisualsHidden: 0,
  ericLoaded: false,
  ericFallbackLoaded: false,
  ericVisible: false,
  ericMeshes: 0,
  ericHeight: null,
  ericTexturedMaterials: 0,
  duplicateEricsHidden: 0,
  skeletonHelpersHidden: 0,
  lightingReassertions: 0,
  overlaySweeps: 0,
  lastReason: null,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let scene = null;
let camera = null;
let renderer = null;
let table = null;
let eric = null;
let ericPromise = null;
let timer = 0;
let frameHandle = 0;
let lastCorrection = 0;
let lastEricAlign = 0;
let xrListenerInstalled = false;
let anchor = null;
const patchedApis = new Set();
const textureCache = new Map();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

function walk(root, visitor, limit = 28000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { visitor(object); } catch {}
    for (const child of object.children || []) if (child && child !== object && !seen.has(child)) stack.push(child);
  }
  return seen.size;
}

function isInside(object, root) {
  let current = object;
  while (current) {
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}

function bounds(object) {
  object?.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(object, true);
  return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
}

function validBounds(value) {
  return Boolean(value && !value.box.isEmpty() && value.size.x > 0.05 && value.size.y > 0.05 && value.size.z > 0.05);
}

function meshCount(root) {
  let count = 0;
  walk(root, (object) => { if (object?.isMesh) count += 1; }, 9000);
  return count;
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

function candidateTable() {
  const candidates = [
    window.SVR_TABLE_AUTHORITY,
    window.SVR_PHASE380_ORIGINAL_TABLE,
    scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY'),
    scene?.getObjectByName?.('PHASE373_VISIBLE_TABLE_GLB_AUTHORITY'),
    table
  ];
  for (const object of candidates) {
    if (!object?.isObject3D) continue;
    try {
      const value = bounds(object);
      if (validBounds(value) && value.size.x > 1.2 && value.size.z > 0.65) return object;
    } catch {}
  }
  return null;
}

function directOriginalMethods(value = rig()) {
  return value?.userData?.svrPhase373OriginalMethods || {};
}

function setRigPoseDirect(x, y, z, target = null) {
  const value = rig();
  if (!value) return false;
  const originals = directOriginalMethods(value);
  let moved = false;
  try {
    if (typeof originals.setPlayerPose === 'function') {
      originals.setPlayerPose.call(value, x, y, z);
      moved = true;
    } else if (typeof originals.positionSet === 'function' && value.position) {
      originals.positionSet.call(value.position, x, y, z);
      moved = true;
    } else if (value.position) {
      value.position.x = x;
      value.position.y = y;
      value.position.z = z;
      moved = true;
    } else if (typeof value.setPlayerPose === 'function') {
      value.setPlayerPose(x, y, z);
      moved = true;
    }
  } catch (error) {
    state.lastError = `RIG_MOVE:${error?.message || error}`;
  }
  if (moved && target) {
    const dx = target.x - x;
    const dz = target.z - z;
    if (value.rotation) value.rotation.y = Math.atan2(-dx, -dz);
    else if (!renderer?.xr?.isPresenting) camera?.lookAt?.(target);
  }
  return moved;
}

function computeAnchor() {
  table = candidateTable() || table;
  if (!table) return null;
  const info = bounds(table);
  if (!validBounds(info)) return null;
  return {
    x: info.center.x,
    z: info.box.max.z + FRONT_GAP,
    target: new THREE.Vector3(info.center.x, info.box.max.y + 0.05, info.center.z - info.size.z * 0.08),
    desiredEyeY: info.box.max.y + 0.53,
    tableTopY: info.box.max.y,
    tableCenter: info.center.clone()
  };
}

function alreadySeated() {
  return Boolean(
    window.SVR_PHASE361_STATE?.seated
    || document.body.classList.contains('svr361-seated')
    || document.body.dataset.svrSeated === 'true'
  );
}

function forceSeatedState() {
  if (!alreadySeated()) {
    try { window.SVR_PHASE361_PLAY_GAME?.(); } catch {}
  }
  if (window.SVR_PHASE361_STATE) {
    window.SVR_PHASE361_STATE.seated = true;
    window.SVR_PHASE361_STATE.mode = 'seated';
  }
  document.body.classList.add('svr361-seated', 'svr387-direct-seated');
  document.body.dataset.svrSeated = 'true';
  state.seated = true;
  if (!window.SVR_PHASE381_STATE?.seated) {
    try { window.SVR_PHASE381_SEAT_LOCK?.('phase387-direct-seat'); } catch {}
  }
}

function lockMovement() {
  for (const key of LOCK_FLAGS) window[key] = false;
  window.SVR_TABLE_MOVEMENT_LOCKED = true;
  window.SVR_PHASE361_TABLE_LOCKED = true;
  window.SVR_PHASE381_SEATED_LOCK = true;
  window.SVR_PHASE386_FRONT_TABLE_LOCK = true;
  window.SVR_PHASE387_DIRECT_TABLE_LOCK = true;
  state.lockedFlags = true;
}

function hideTeleportVisuals() {
  if (!scene) return 0;
  let hidden = 0;
  walk(scene, (object) => {
    const label = String(object?.name || '');
    if (!TELEPORT_RX.test(label) || KEEP_RX.test(label)) return;
    object.visible = false;
    object.userData = { ...(object.userData || {}), svrPhase387TeleportHidden: true };
    hidden += 1;
  });
  state.teleportVisualsHidden = Math.max(state.teleportVisualsHidden, hidden);
  return hidden;
}

function placeAtTable(reason = 'manual') {
  anchor = computeAnchor();
  if (!anchor) return false;
  forceSeatedState();
  const value = rig();
  const head = activeCamera();
  head?.getWorldPosition?.(tmp);
  const currentY = Number(value?.position?.y || 0);
  const correction = Number.isFinite(tmp.y) && tmp.y > 0.15 ? anchor.desiredEyeY - tmp.y : 0;
  const y = THREE.MathUtils.clamp(currentY + correction, -1.05, 0.45);
  const moved = setRigPoseDirect(anchor.x, y, anchor.z, anchor.target);
  if (moved) {
    state.directSeatApplications += 1;
    state.lastReason = reason;
  }
  lockMovement();
  hideTeleportVisuals();
  return moved;
}

function correctAnchor(time = performance.now()) {
  if (!anchor || time - lastCorrection < 140) return false;
  lastCorrection = time;
  const value = rig();
  if (!value?.position) return false;
  const horizontal = Math.hypot(value.position.x - anchor.x, value.position.z - anchor.z);
  const head = activeCamera();
  head?.getWorldPosition?.(tmp);
  const verticalError = Number.isFinite(tmp.y) ? Math.abs(tmp.y - anchor.desiredEyeY) : 0;
  if (horizontal <= 0.055 && verticalError <= 0.13) return false;
  if (placeAtTable('continuous-anchor-correction')) {
    state.anchorCorrections += 1;
    return true;
  }
  return false;
}

function patchLobbyApi(name) {
  if (patchedApis.has(name) || typeof window[name] !== 'function') return false;
  window[name] = () => {
    state.lobbyMovesBlocked += 1;
    return placeAtTable(`blocked-${name}`);
  };
  patchedApis.add(name);
  return true;
}

function patchLobbyApis() {
  patchLobbyApi('SVR_PHASE361_LOBBY_SPAWN');
  patchLobbyApi('SVR_PHASE373_STABLE_LOBBY');
  patchLobbyApi('SVR_PHASE364_LOBBY_SPAWN');
}

function scheduleSeatBurst(reason) {
  for (const delay of [0, 80, 220, 480, 850, 1400, 2400, 4200]) {
    window.setTimeout(() => placeAtTable(`${reason}-${delay}`), delay);
  }
}

function installXrListener() {
  if (xrListenerInstalled || !renderer?.xr) return;
  xrListenerInstalled = true;
  renderer.xr.addEventListener('sessionstart', () => scheduleSeatBurst('xr-session-start'));
  renderer.xr.addEventListener('sessionend', () => scheduleSeatBurst('xr-session-end-recovery'));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleSeatBurst('visibility-return');
  });
}

function patternTexture(kind) {
  if (textureCache.has(kind)) return textureCache.get(kind);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 384;
  const ctx = canvas.getContext('2d');
  const colors = {
    skin: ['#b7795d', '#754534'], hair: ['#2a170f', '#080504'], shirt: ['#eef3f7', '#aeb9c5'],
    suit: ['#252c3a', '#070a11'], pants: ['#151b26', '#05070b'], shoes: ['#1a1718', '#020202']
  }[kind] || ['#252c3a', '#070a11'];
  const gradient = ctx.createLinearGradient(0, 0, 384, 384);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 384, 384);
  ctx.globalAlpha = kind === 'skin' ? 0.08 : 0.17;
  ctx.strokeStyle = kind === 'skin' ? '#ffe0c4' : '#b2d2e6';
  ctx.lineWidth = kind === 'skin' ? 1 : 2;
  const step = kind === 'skin' ? 34 : 15;
  for (let x = -384; x < 768; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 384, 384);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'skin' ? 1 : 3, kind === 'skin' ? 1 : 3);
  texture.needsUpdate = true;
  textureCache.set(kind, texture);
  return texture;
}

function materialKind(label, yRatio) {
  const value = String(label || '').toLowerCase();
  if (/hair|brow|lash|beard/.test(value)) return 'hair';
  if (/shoe|boot|sole|foot/.test(value)) return 'shoes';
  if (/pant|trouser|jean|leg/.test(value)) return 'pants';
  if (/shirt|collar|cuff|tie/.test(value)) return 'shirt';
  if (/skin|face|head|hand|arm|neck|ear|nose|lip/.test(value)) return 'skin';
  if (yRatio > 0.78) return 'skin';
  if (yRatio < 0.34) return 'pants';
  return 'suit';
}

function textureEric(root) {
  if (root.userData?.svrPhase387Textured) {
    let meshes = 0;
    walk(root, (object) => {
      object.visible = true;
      if (object.isMesh) {
        meshes += 1;
        object.frustumCulled = false;
      }
    }, 9000);
    state.ericMeshes = meshes;
    return meshes;
  }
  const whole = bounds(root);
  if (!validBounds(whole)) return 0;
  let changed = 0;
  let meshes = 0;
  walk(root, (object) => {
    object.visible = true;
    if (!object.isMesh || !object.material) return;
    meshes += 1;
    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = true;
    const center = bounds(object).center;
    const yRatio = whole.size.y > 0.001 ? (center.y - whole.box.min.y) / whole.size.y : 0.5;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    const next = list.map((source) => {
      const material = source?.clone?.() || new THREE.MeshStandardMaterial();
      const kind = materialKind(`${object.name || ''} ${source?.name || ''}`, yRatio);
      if (!material.map?.image) material.map = patternTexture(kind);
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.map.needsUpdate = true;
      material.color?.setHex?.(0xffffff);
      material.side = THREE.DoubleSide;
      material.transparent = false;
      material.opacity = 1;
      material.depthTest = true;
      material.depthWrite = true;
      if ('roughness' in material) material.roughness = kind === 'skin' ? 0.72 : kind === 'shoes' ? 0.30 : 0.56;
      if ('metalness' in material) material.metalness = kind === 'shoes' ? 0.12 : 0.03;
      material.needsUpdate = true;
      changed += 1;
      return material;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
  }, 9000);
  root.userData = { ...(root.userData || {}), svrPhase387Textured: true };
  state.ericMeshes = meshes;
  state.ericTexturedMaterials = Math.max(state.ericTexturedMaterials, changed);
  return meshes;
}

function findApprovedEric() {
  let found = window.SVR_PHASE386_ERIC_AUTHORITY;
  if (found?.isObject3D && meshCount(found) > 0) return found;
  found = null;
  walk(scene, (object) => {
    if (found || !object?.isObject3D) return;
    const approved = object.userData?.svrPhase381Approved
      || object.userData?.svrPhase386Approved
      || object.userData?.svrApprovedDealerRig
      || object.name === APPROVED_ERIC_NAME;
    if (approved && meshCount(object) > 0) found = object;
  }, 18000);
  return found;
}

function normalizeFallbackEric(object) {
  object.position.set(0, 0, 0);
  object.scale.setScalar(1);
  const rotations = [[0,0,0],[-Math.PI/2,0,0],[Math.PI/2,0,0],[0,0,Math.PI/2],[0,0,-Math.PI/2],[0,Math.PI,0]];
  let best = null;
  for (const rotation of rotations) {
    object.rotation.set(...rotation);
    const value = bounds(object);
    const score = value.size.y / Math.max(value.size.x, value.size.z, 0.001);
    if (!best || score > best.score) best = { score, rotation: object.rotation.clone() };
  }
  if (best) object.rotation.copy(best.rotation);
  let value = bounds(object);
  object.scale.multiplyScalar(1.78 / Math.max(value.size.y, 0.001));
  value = bounds(object);
  object.position.x -= value.center.x;
  object.position.z -= value.center.z;
  object.position.y -= value.box.min.y;
  object.name = APPROVED_ERIC_NAME;
  object.userData = {
    ...(object.userData || {}),
    svrApprovedDealerRig: true,
    svrPhase381Approved: true,
    svrPhase386Approved: true,
    svrPhase387Approved: true,
    sourceAsset: 'game/assets/models/eric/eric.fbx',
    build: BUILD
  };
}

async function loadEricFallback() {
  if (ericPromise) return ericPromise;
  ericPromise = (async () => {
    try {
      const object = await new FBXLoader().loadAsync(new URL('../assets/models/eric/eric.fbx', import.meta.url).href);
      normalizeFallbackEric(object);
      scene.add(object);
      state.ericFallbackLoaded = true;
      return object;
    } catch (error) {
      state.lastError = `ERIC_LOAD:${error?.message || error}`;
      return null;
    }
  })();
  return ericPromise;
}

function alignEric() {
  if (!eric || !table) return false;
  const tableInfo = bounds(table);
  if (!validBounds(tableInfo)) return false;
  const ericInfo = bounds(eric);
  if (validBounds(ericInfo) && Math.abs(ericInfo.size.y - 1.78) > 0.18) {
    eric.scale.multiplyScalar(1.78 / Math.max(ericInfo.size.y, 0.001));
  }
  eric.position.set(tableInfo.center.x, 0, tableInfo.box.min.z - 0.46);
  eric.rotation.y = Math.PI;
  eric.visible = true;
  let parent = eric.parent;
  while (parent) {
    parent.visible = true;
    parent = parent.parent;
  }
  const final = bounds(eric);
  state.ericVisible = true;
  state.ericHeight = validBounds(final) ? Number(final.size.y.toFixed(3)) : null;
  return true;
}

function hideEricDuplicates() {
  if (!scene || !eric) return 0;
  let hidden = 0;
  let skeletons = 0;
  walk(scene, (object) => {
    if (!object?.isObject3D || object === eric || isInside(object, eric)) return;
    const approvedRoot = object.name === APPROVED_ERIC_NAME
      || object.userData?.svrPhase381Approved
      || object.userData?.svrApprovedDealerRig;
    const skeleton = object.isSkeletonHelper || /(external[_ -]?skeleton|debug[_ -]?skeleton|PHASE368_CARD_DEALER_ROOT)/i.test(String(object.name || ''));
    if (approvedRoot) {
      object.visible = false;
      hidden += 1;
    } else if (skeleton) {
      object.visible = false;
      skeletons += 1;
    }
  }, 18000);
  state.duplicateEricsHidden = Math.max(state.duplicateEricsHidden, hidden);
  state.skeletonHelpersHidden = Math.max(state.skeletonHelpersHidden, skeletons);
  return hidden;
}

async function ensureEric() {
  eric = findApprovedEric() || eric;
  if (!eric || meshCount(eric) <= 0) eric = await loadEricFallback();
  if (!eric) return false;
  const meshes = textureEric(eric);
  if (meshes <= 0) return false;
  state.ericLoaded = true;
  window.SVR_PHASE386_ERIC_AUTHORITY = eric;
  window.SVR_PHASE387_ERIC_AUTHORITY = eric;
  alignEric();
  hideEricDuplicates();
  return true;
}

function hideBootUi() {
  document.documentElement.classList.add('quest-direct');
  document.body.classList.add('boot-released', 'svr387-direct-entry');
  for (const selector of ['#safeStage', '#startRuntimeBtn']) {
    document.querySelectorAll(selector).forEach((element) => element.style.setProperty('display', 'none', 'important'));
  }
}

async function sweep(reason = 'interval') {
  scene = window.__SVR_SCENE__ || scene;
  camera = window.__SVR_CAMERA__ || camera;
  renderer = window.__SVR_RENDERER__ || renderer;
  state.sceneReady = Boolean(scene && camera && renderer && rig());
  hideBootUi();
  if (!state.sceneReady) return false;
  if (!state.tableReady) {
    window.SVR_PHASE380_ORIGINAL_TABLE_REASSERT?.(`phase387-${reason}`);
    window.SVR_PHASE386_QUEST_SWEEP?.(`phase387-${reason}`);
  }
  table = candidateTable() || table;
  state.tableReady = Boolean(table);
  patchLobbyApis();
  installXrListener();
  if (table) {
    placeAtTable(`phase387-${reason}`);
    await ensureEric();
  }
  lockMovement();
  hideTeleportVisuals();
  window.SVR_PHASE386_LIGHTING_SWEEP?.();
  state.lightingReassertions += 1;
  window.SVR_PHASE386_OVERLAY_SWEEP?.();
  state.overlaySweeps += 1;
  window.SVR_PHASE386_PRESERVE_PLANETS?.();
  return Boolean(table && eric && state.ericVisible);
}

function frame(time = 0) {
  if (!ACTIVE || !state.installed) return;
  hideBootUi();
  lockMovement();
  correctAnchor(time);
  if (eric) {
    eric.visible = true;
    if (time - lastEricAlign > 600) {
      lastEricAlign = time;
      alignEric();
    }
  }
  frameHandle = requestAnimationFrame(frame);
}

function qa() {
  const info = table?.isObject3D ? bounds(table) : null;
  const head = activeCamera();
  head?.getWorldPosition?.(tmp2);
  const movementFlags = Object.fromEntries(LOCK_FLAGS.map((key) => [key, window[key]]));
  state.checkedAt = new Date().toISOString();
  return {
    ...state,
    tableBounds: info && validBounds(info) ? {
      x: Number(info.size.x.toFixed(3)),
      y: Number(info.size.y.toFixed(3)),
      z: Number(info.size.z.toFixed(3))
    } : null,
    anchor: anchor ? { x: Number(anchor.x.toFixed(3)), z: Number(anchor.z.toFixed(3)), eyeY: Number(anchor.desiredEyeY.toFixed(3)) } : null,
    head: { x: Number(tmp2.x.toFixed(3)), y: Number(tmp2.y.toFixed(3)), z: Number(tmp2.z.toFixed(3)) },
    movementFlags,
    pass: !ACTIVE || Boolean(
      state.sceneReady
      && state.tableReady
      && state.seated
      && state.directSeatApplications > 0
      && state.lockedFlags
      && state.ericLoaded
      && state.ericVisible
      && state.ericMeshes > 0
      && Object.values(movementFlags).every((value) => value === false)
    )
  };
}

function install() {
  if (!ACTIVE || state.installed) return;
  state.installed = true;
  state.installedAt = new Date().toISOString();
  hideBootUi();
  timer = window.setInterval(() => sweep('interval').catch((error) => {
    state.lastError = String(error?.message || error);
  }), 720);
  frameHandle = requestAnimationFrame(frame);
  for (const delay of [0, 80, 220, 500, 900, 1600, 2800, 5000, 8000]) {
    window.setTimeout(() => sweep(`boot-${delay}`).catch((error) => {
      state.lastError = String(error?.message || error);
    }), delay);
  }
  window.addEventListener('svr:phase361-ready', () => scheduleSeatBurst('phase361-ready'));
  window.addEventListener('svr:phase373-ready', () => scheduleSeatBurst('phase373-ready'));
  window.addEventListener('svr:phase381-core-ready', () => scheduleSeatBurst('phase381-ready'));
  window.addEventListener('svr:phase386-core-ready', () => scheduleSeatBurst('phase386-ready'));
  window.addEventListener('beforeunload', () => {
    clearInterval(timer);
    cancelAnimationFrame(frameHandle);
  }, { once: true });
}

install();
window.SVR_PHASE387_SWEEP = sweep;
window.SVR_PHASE387_DIRECT_SEAT = placeAtTable;
window.SVR_PHASE387_ENSURE_ERIC = ensureEric;
window.SVR_PHASE387_QA = qa;
window.SVR_PHASE387_STATE = state;
