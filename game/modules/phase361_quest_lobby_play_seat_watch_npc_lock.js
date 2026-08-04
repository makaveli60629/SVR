import * as THREE from 'three';

export const BUILD = 'PHASE-361-QUEST-LOBBY-PLAY-SEAT-WATCH-NPC-LOCK';

const params = new URLSearchParams(location.search);
const platform = (() => {
  const explicit = String(window.SVR_PLATFORM || params.get('platform') || '').toLowerCase();
  if (explicit) return explicit;
  return /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '') ? 'quest' : 'desktop';
})();
const ACTIVE = platform === 'quest';

const rootState = {
  build: BUILD,
  platform,
  active: ACTIVE,
  installedAt: null,
  mode: 'booting',
  seated: false,
  lobbySpawnApplied: false,
  tableFound: false,
  playerRigFound: false,
  playPanelFound: false,
  fallbackWatchCreated: false,
  existingWatchRoots: 0,
  texturedNpcRoots: 0,
  alignedNpcRoots: 0,
  seatCorrections: 0,
  teleportBlockedWhileSeated: true,
  movementBlockedWhileSeated: true,
  physicalHeadsetAcceptancePending: true,
  lastError: null,
  checkedAt: null
};

const movementKeys = [
  'SVR_MOVEMENT_ENABLED',
  'SVR_LOCOMOTION_ENABLED',
  'SVR_TABLE_TRAVEL_ENABLED',
  'SVR_TELEPORT_ENABLED',
  'SVR_HAND_TELEPORT_ENABLED',
  'SVR_WATCH_TELEPORT_ENABLED',
  'SVR_GRIP_TELEPORT_ENABLED',
  'SVR_POINTER_ENABLED',
  'SVR_HAND_RAY_ENABLED'
];

const savedFlags = new Map();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

let installed = false;
let scene = null;
let camera = null;
let renderer = null;
let actionRoot = null;
let actionButton = null;
let actionCanvas = null;
let actionTexture = null;
let htmlRoot = null;
let htmlButton = null;
let fallbackWatch = null;
let watchCanvas = null;
let watchTexture = null;
let seatAnchor = null;
let lobbyAnchor = null;
let lastHandPinch = false;
let lastControllerSelectAt = 0;
let lastNpcPassAt = 0;
let leaveArmed = false;
let frameHandle = 0;
let monitorTimer = 0;

function safeWalk(root, visitor, limit = 12000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  let count = 0;
  while (stack.length && count < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    count += 1;
    try { visitor(object); } catch {}
    const children = Array.isArray(object.children) ? object.children : [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child && child !== object && !seen.has(child)) stack.push(child);
    }
  }
  return count;
}

function worldRoot() {
  return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
}

function findTable() {
  const root = worldRoot();
  const candidates = [
    window.SVR_TABLE_AUTHORITY,
    root?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'),
    root?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT'),
    root?.getObjectByName?.('PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED')
  ];
  for (const candidate of candidates) {
    if (!candidate?.isObject3D) continue;
    try {
      candidate.updateWorldMatrix?.(true, false);
      const box = new THREE.Box3().setFromObject(candidate, true);
      const size = new THREE.Vector3();
      box.getSize(size);
      if (!box.isEmpty() && size.x > 1.5 && size.z > 0.8) return candidate;
    } catch {}
  }
  return null;
}

function tableInfo() {
  const table = findTable();
  if (!table) return null;
  table.updateWorldMatrix?.(true, false);
  const box = new THREE.Box3().setFromObject(table, true);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const surfaceY = Number(window.SVR_TABLE_RESTING_POINT_STATE?.restY)
    || Math.max(box.min.y + size.y * 0.45, box.max.y - 0.18);
  return {
    table,
    box,
    size,
    center,
    surfaceY,
    halfX: Math.max(1.2, size.x * 0.5),
    halfZ: Math.max(0.9, size.z * 0.5)
  };
}

function playerRig() {
  return window.SVR_TELEPORT_RIG_REF
    || window.SVR_TELEPORT_RIG
    || window.SVR_PLAYER_RIG
    || window.__SVR_PLAYER_RIG
    || null;
}

function xrCamera() {
  return renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
}

function setRigXZ(x, z) {
  const rig = playerRig();
  if (rig?.setPlayerPose) {
    try {
      rig.setPlayerPose(x, 0, z);
      return true;
    } catch {}
  }
  if (rig?.position) {
    try {
      rig.position.x = x;
      rig.position.z = z;
      return true;
    } catch {}
  }
  if (camera?.position && !renderer?.xr?.isPresenting) {
    camera.position.x = x;
    camera.position.z = z;
    return true;
  }
  return false;
}

function faceRigToward(target) {
  const rig = playerRig();
  const activeCamera = xrCamera();
  if (!target || !activeCamera) return false;
  activeCamera.getWorldPosition(tmp);
  const yaw = Math.atan2(target.x - tmp.x, target.z - tmp.z);
  if (rig?.rotation) {
    rig.rotation.y = yaw;
    return true;
  }
  if (!renderer?.xr?.isPresenting && camera?.lookAt) {
    camera.lookAt(target);
    return true;
  }
  return false;
}

function computeAnchors() {
  const info = tableInfo();
  if (!info) return null;
  const frontZ = info.box.max.z;
  seatAnchor = {
    x: info.center.x,
    z: frontZ + 0.62,
    target: new THREE.Vector3(info.center.x, info.surfaceY + 0.05, info.center.z - info.halfZ * 0.08),
    maxDistance: 0.08
  };
  lobbyAnchor = {
    x: info.center.x,
    z: frontZ + 4.1,
    target: new THREE.Vector3(info.center.x, info.surfaceY + 0.18, info.center.z),
    maxDistance: 0.16
  };
  return { info, seatAnchor, lobbyAnchor };
}

function saveFlags() {
  movementKeys.forEach((key) => {
    if (!savedFlags.has(key)) savedFlags.set(key, window[key]);
  });
}

function setMovementAllowed(allowed) {
  saveFlags();
  movementKeys.forEach((key) => {
    if (allowed) {
      const prior = savedFlags.get(key);
      window[key] = typeof prior === 'boolean' ? prior : true;
    } else {
      window[key] = false;
    }
  });
  window.SVR_PHASE361_TABLE_LOCKED = !allowed;
  return allowed;
}

function removeOldForcedSeatArtifacts() {
  for (const name of ['P86_POS', 'P87_SEAT_HUD', 'P87_SCORPION_TABLE_AUTHORITY_MARKERS']) {
    let object = scene?.getObjectByName?.(name);
    while (object) {
      object.parent?.remove(object);
      object = scene?.getObjectByName?.(name);
    }
  }
  window.SVR_PHASE86_SEATED_TABLE_LOCK = null;
  window.SVR_PHASE87_SCORPION_SEAT_AUTHORITY = null;
}

function applyLobbySpawn(force = false) {
  if (!ACTIVE || rootState.seated) return false;
  const anchors = computeAnchors();
  if (!anchors) return false;
  const activeCamera = xrCamera();
  if (!activeCamera) return false;
  activeCamera.getWorldPosition(tmp);
  const distance = Math.hypot(tmp.x - lobbyAnchor.x, tmp.z - lobbyAnchor.z);
  if (force || !rootState.lobbySpawnApplied || distance > 8) {
    setRigXZ(lobbyAnchor.x, lobbyAnchor.z);
    faceRigToward(lobbyAnchor.target);
    rootState.lobbySpawnApplied = true;
  }
  setMovementAllowed(true);
  rootState.mode = 'lobby';
  updateUi();
  return true;
}

function applySeatAnchor(force = false) {
  if (!rootState.seated || !seatAnchor) return false;
  const activeCamera = xrCamera();
  if (!activeCamera) return false;
  activeCamera.getWorldPosition(tmp);
  const distance = Math.hypot(tmp.x - seatAnchor.x, tmp.z - seatAnchor.z);
  if (force || distance > seatAnchor.maxDistance) {
    setRigXZ(seatAnchor.x, seatAnchor.z);
    rootState.seatCorrections += 1;
  }
  setMovementAllowed(false);
  return true;
}

function joinTable(source = 'play-game') {
  if (!ACTIVE) return false;
  const anchors = computeAnchors();
  if (!anchors) {
    rootState.lastError = 'Quest poker table was not available for seating.';
    updateUi();
    return false;
  }
  rootState.seated = true;
  rootState.mode = 'seated';
  leaveArmed = false;
  window.SVR_PHASE359_TOGGLE_CONTINUOUS?.(true);
  window.SVR_PHASE360_JOIN_TABLE?.();
  applySeatAnchor(true);
  faceRigToward(seatAnchor.target);
  updateUi();
  window.dispatchEvent(new CustomEvent('svr:phase361-table-joined', {
    detail: { build: BUILD, source, seat: { x: seatAnchor.x, z: seatAnchor.z } }
  }));
  return true;
}

function leaveTable(source = 'leave-table') {
  if (!ACTIVE) return false;
  rootState.seated = false;
  rootState.mode = 'lobby';
  leaveArmed = true;
  setMovementAllowed(true);
  window.SVR_PHASE359_TOGGLE_CONTINUOUS?.(false);
  window.SVR_PHASE360_LEAVE_TABLE?.();
  applyLobbySpawn(true);
  updateUi();
  window.dispatchEvent(new CustomEvent('svr:phase361-table-left', {
    detail: { build: BUILD, source, lobby: lobbyAnchor ? { x: lobbyAnchor.x, z: lobbyAnchor.z } : null }
  }));
  return true;
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function paintActionCanvas() {
  if (!actionCanvas || !actionTexture) return;
  const context = actionCanvas.getContext('2d');
  const seated = rootState.seated;
  context.clearRect(0, 0, actionCanvas.width, actionCanvas.height);
  roundedRect(context, 10, 10, actionCanvas.width - 20, actionCanvas.height - 20, 34);
  context.fillStyle = seated ? 'rgba(34,4,12,.92)' : 'rgba(3,12,22,.92)';
  context.fill();
  context.strokeStyle = seated ? '#ff5b7f' : '#7ffcff';
  context.lineWidth = 10;
  context.stroke();
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 66px Arial, sans-serif';
  context.fillText(seated ? 'LEAVE TABLE' : 'PLAY GAME', actionCanvas.width / 2, 92);
  context.fillStyle = seated ? '#ffb1c3' : '#ffd98a';
  context.font = '800 28px Arial, sans-serif';
  context.fillText(seated ? 'Movement locked • Look around freely' : 'Walk to the table, then select to sit', actionCanvas.width / 2, 154);
  actionTexture.needsUpdate = true;
}

function ensureActionPanel() {
  const root = worldRoot();
  const info = tableInfo();
  if (!root || !info) return null;
  if (!actionRoot) {
    actionRoot = new THREE.Group();
    actionRoot.name = 'PHASE361_QUEST_PLAY_LEAVE_PANEL_ROOT';
    actionCanvas = makeCanvas(1024, 210);
    actionTexture = new THREE.CanvasTexture(actionCanvas);
    actionTexture.colorSpace = THREE.SRGBColorSpace;
    actionButton = new THREE.Mesh(
      new THREE.PlaneGeometry(1.55, 0.32),
      new THREE.MeshBasicMaterial({
        map: actionTexture,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        toneMapped: false
      })
    );
    actionButton.name = 'PHASE361_QUEST_PLAY_LEAVE_BUTTON';
    actionButton.userData.svrPhase361Action = true;
    actionButton.renderOrder = 9361;
    actionRoot.add(actionButton);
    root.add(actionRoot);
  }
  actionRoot.position.set(info.center.x, info.surfaceY + 1.15, info.box.max.z + 0.35);
  const towardLobby = lobbyAnchor || { x: info.center.x, z: info.box.max.z + 4 };
  actionRoot.lookAt(towardLobby.x, actionRoot.position.y, towardLobby.z);
  paintActionCanvas();
  rootState.playPanelFound = true;
  return actionRoot;
}

function ensureHtmlControls() {
  if (htmlRoot) return htmlRoot;
  const style = document.createElement('style');
  style.id = 'svr361QuestSeatStyle';
  style.textContent = `
    #svr361QuestSeatRoot{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9361;display:flex;gap:10px;align-items:center;padding:10px 12px;border:1px solid rgba(127,252,255,.7);border-radius:18px;background:rgba(2,8,18,.76);backdrop-filter:blur(8px);font-family:system-ui,Arial,sans-serif;color:#fff}
    #svr361QuestSeatRoot button{min-width:180px;padding:13px 18px;border-radius:14px;border:1px solid #ffd98a;background:#08131d;color:#fff;font-weight:900;font-size:16px}
    #svr361QuestSeatStatus{font-size:12px;max-width:260px;line-height:1.25;color:#d8faff}
    body.svr361-seated #svr361QuestSeatRoot{border-color:rgba(255,91,127,.78)}
    body.svr361-seated #svr361QuestSeatRoot button{border-color:#ff5b7f;background:#24050e}
  `;
  document.head.appendChild(style);
  htmlRoot = document.createElement('div');
  htmlRoot.id = 'svr361QuestSeatRoot';
  htmlRoot.innerHTML = '<button id="svr361QuestSeatButton" type="button">PLAY GAME</button><span id="svr361QuestSeatStatus">Start in the lobby. Walk to the table, then select PLAY GAME.</span>';
  document.body.appendChild(htmlRoot);
  htmlButton = htmlRoot.querySelector('#svr361QuestSeatButton');
  htmlButton?.addEventListener('click', () => {
    if (rootState.seated) leaveTable('html-button');
    else joinTable('html-button');
  });
  return htmlRoot;
}

function paintWatch() {
  if (!watchCanvas || !watchTexture) return;
  const context = watchCanvas.getContext('2d');
  context.clearRect(0, 0, watchCanvas.width, watchCanvas.height);
  roundedRect(context, 6, 6, watchCanvas.width - 12, watchCanvas.height - 12, 22);
  context.fillStyle = 'rgba(2,5,12,.96)';
  context.fill();
  context.strokeStyle = rootState.seated ? '#ff5b7f' : '#7ffcff';
  context.lineWidth = 6;
  context.stroke();
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 42px Arial, sans-serif';
  context.fillText('SVR', watchCanvas.width / 2, 46);
  context.fillStyle = '#ffd98a';
  context.font = '900 30px Arial, sans-serif';
  context.fillText(rootState.seated ? 'LEAVE' : 'PLAY', watchCanvas.width / 2, 96);
  context.fillStyle = '#c7f9ff';
  context.font = '700 18px Arial, sans-serif';
  context.fillText(rootState.seated ? 'TABLE LOCKED' : 'LOBBY MODE', watchCanvas.width / 2, 132);
  watchTexture.needsUpdate = true;
}

function sourceForSide(side, kind) {
  const getter = kind === 'hand' ? 'getHand' : 'getController';
  for (let index = 0; index < 2; index += 1) {
    const source = renderer?.xr?.[getter]?.(index);
    if (!source) continue;
    const handedness = source.userData?.handedness
      || source.inputSource?.handedness
      || source.userData?.inputSource?.handedness;
    if (handedness === side) return source;
  }
  return renderer?.xr?.[getter]?.(side === 'left' ? 0 : 1) || null;
}

function visibleWatchRoots() {
  const matches = [];
  safeWalk(scene, (object) => {
    const name = String(object?.name || '');
    if (/(watch|wrist|forearm|predator.*device)/i.test(name) && !/watchdog/i.test(name)) {
      object.visible = true;
      matches.push(object);
    }
  }, 6000);
  rootState.existingWatchRoots = matches.length;
  return matches;
}

function ensureWatch() {
  const existing = visibleWatchRoots();
  if (existing.length) {
    if (fallbackWatch) fallbackWatch.visible = false;
    return existing[0];
  }
  const parent = sourceForSide('left', 'hand') || sourceForSide('left', 'controller') || camera;
  if (!parent) return null;
  if (!fallbackWatch) {
    fallbackWatch = new THREE.Group();
    fallbackWatch.name = 'PHASE361_QUEST_FALLBACK_FOREARM_WATCH';
    watchCanvas = makeCanvas(320, 160);
    watchTexture = new THREE.CanvasTexture(watchCanvas);
    watchTexture.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.08),
      new THREE.MeshBasicMaterial({ map: watchTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
    );
    screen.name = 'PHASE361_QUEST_WATCH_PLAY_LEAVE_SCREEN';
    screen.userData.svrPhase361Action = true;
    screen.renderOrder = 9362;
    const cuff = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.025, 0.095),
      new THREE.MeshStandardMaterial({ color: 0x07090e, roughness: 0.62, metalness: 0.22 })
    );
    cuff.position.z = 0.007;
    fallbackWatch.add(cuff, screen);
    parent.add(fallbackWatch);
    fallbackWatch.position.set(0.02, -0.055, -0.11);
    fallbackWatch.rotation.set(-0.35, Math.PI, -0.08);
    rootState.fallbackWatchCreated = true;
  } else if (fallbackWatch.parent !== parent) {
    parent.attach(fallbackWatch);
  }
  fallbackWatch.visible = true;
  paintWatch();
  return fallbackWatch;
}

function updateUi() {
  ensureHtmlControls();
  ensureActionPanel();
  ensureWatch();
  if (htmlButton) htmlButton.textContent = rootState.seated ? 'LEAVE TABLE' : 'PLAY GAME';
  const status = document.getElementById('svr361QuestSeatStatus');
  if (status) {
    status.textContent = rootState.seated
      ? 'Seated at the south/front chair. Movement and teleport are locked until LEAVE TABLE.'
      : 'Lobby mode. Walk normally, approach the table, then select PLAY GAME.';
  }
  document.body.classList.toggle('svr361-seated', rootState.seated);
  paintActionCanvas();
  paintWatch();
}

function textureCanvas(base, accent, label) {
  const canvas = makeCanvas(128, 128);
  const context = canvas.getContext('2d');
  context.fillStyle = base;
  context.fillRect(0, 0, 128, 128);
  context.globalAlpha = 0.35;
  context.strokeStyle = accent;
  context.lineWidth = 4;
  for (let offset = -128; offset < 256; offset += 18) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset + 128, 128);
    context.stroke();
  }
  context.globalAlpha = 1;
  context.fillStyle = 'rgba(0,0,0,.52)';
  context.fillRect(0, 88, 128, 40);
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.font = '900 22px Arial, sans-serif';
  context.fillText(label, 64, 115);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const npcTextures = {
  eric: null,
  bot: null,
  skin: null
};

function ensureNpcTextures() {
  if (!npcTextures.eric) npcTextures.eric = textureCanvas('#211434', '#b884ff', 'ERIC');
  if (!npcTextures.bot) npcTextures.bot = textureCanvas('#0a2632', '#7ffcff', 'SVR');
  if (!npcTextures.skin) npcTextures.skin = textureCanvas('#b97e65', '#e7b49c', '');
}

function candidateNpcRoots() {
  const root = worldRoot();
  const candidates = [];
  safeWalk(root, (object) => {
    const name = String(object?.name || '');
    if (!/(eric|claudia|carla|bot[_ -]?avatar|npc[_ -]?player|seated[_ -]?player|dealer[_ -]?avatar)/i.test(name)) return;
    let parent = object.parent;
    while (parent && parent !== root) {
      const parentName = String(parent.name || '');
      if (!/(eric|claudia|carla|bot[_ -]?avatar|npc[_ -]?player|seated[_ -]?player|dealer[_ -]?avatar)/i.test(parentName)) break;
      object = parent;
      parent = parent.parent;
    }
    if (!candidates.includes(object)) candidates.push(object);
  }, 9000);
  return candidates;
}

function applyNpcTexture(root) {
  if (!root || root.userData?.svrPhase361Textured) return false;
  ensureNpcTextures();
  const isEric = /eric/i.test(String(root.name || ''));
  let applied = 0;
  safeWalk(root, (object) => {
    if (!object?.isMesh || !object.material) return;
    const name = String(object.name || '').toLowerCase();
    const skinLike = /(head|face|skin|hand|arm)/.test(name);
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const next = source.map((material) => {
      if (!material?.isMaterial) return material;
      const clone = material.clone();
      if (!clone.map) clone.map = skinLike ? npcTextures.skin : (isEric ? npcTextures.eric : npcTextures.bot);
      clone.roughness = Number.isFinite(clone.roughness) ? Math.max(0.55, clone.roughness) : 0.72;
      clone.metalness = Number.isFinite(clone.metalness) ? Math.min(0.16, clone.metalness) : 0.04;
      clone.needsUpdate = true;
      applied += 1;
      return clone;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
    object.castShadow = false;
    object.receiveShadow = false;
  }, 2500);
  root.userData.svrPhase361Textured = applied > 0;
  return applied > 0;
}

function alignNpcToTable(root, info) {
  if (!root || !info) return false;
  root.updateWorldMatrix?.(true, false);
  root.getWorldPosition(tmp);
  const horizontal = Math.hypot(tmp.x - info.center.x, tmp.z - info.center.z);
  if (horizontal < 0.25 || horizontal > Math.max(info.size.x, info.size.z) * 2.5) return false;
  const worldTarget = new THREE.Vector3(info.center.x, tmp.y, info.center.z);
  const parent = root.parent;
  if (!parent) return false;
  parent.worldToLocal(worldTarget);
  root.lookAt(worldTarget);
  root.userData.svrPhase361FacesTable = true;
  return true;
}

function npcPass() {
  const info = tableInfo();
  if (!info) return { textured: 0, aligned: 0 };
  let textured = 0;
  let aligned = 0;
  for (const npc of candidateNpcRoots()) {
    if (applyNpcTexture(npc)) textured += 1;
    if (alignNpcToTable(npc, info)) aligned += 1;
  }
  rootState.texturedNpcRoots = Math.max(rootState.texturedNpcRoots, textured);
  rootState.alignedNpcRoots = Math.max(rootState.alignedNpcRoots, aligned);
  return { textured, aligned };
}

function controllerRayHit(controller) {
  if (!controller || !actionButton) return false;
  controller.updateWorldMatrix?.(true, false);
  controller.getWorldPosition(tmp);
  controller.getWorldQuaternion(tmpQ);
  tmp2.set(0, 0, -1).applyQuaternion(tmpQ).normalize();
  raycaster.set(tmp, tmp2);
  const targets = [actionButton];
  if (fallbackWatch) safeWalk(fallbackWatch, (object) => { if (object.isMesh) targets.push(object); }, 32);
  return raycaster.intersectObjects(targets, true).length > 0;
}

function onControllerSelect(event) {
  const now = performance.now();
  if (now - lastControllerSelectAt < 450) return;
  const controller = event?.currentTarget || event?.target;
  if (!controllerRayHit(controller)) return;
  lastControllerSelectAt = now;
  if (rootState.seated) leaveTable('controller-select');
  else joinTable('controller-select');
}

function attachControllerSelection() {
  for (let index = 0; index < 2; index += 1) {
    const controller = renderer?.xr?.getController?.(index);
    if (!controller || controller.userData?.svrPhase361SelectAttached) continue;
    controller.userData.svrPhase361SelectAttached = true;
    controller.addEventListener('selectstart', onControllerSelect);
  }
}

function handPinchAction() {
  const hand = sourceForSide('right', 'hand');
  const thumb = hand?.joints?.['thumb-tip'];
  const index = hand?.joints?.['index-finger-tip'];
  if (!thumb || !index || !actionButton) {
    lastHandPinch = false;
    return;
  }
  thumb.getWorldPosition(tmp);
  index.getWorldPosition(tmp2);
  const pinching = tmp.distanceTo(tmp2) < 0.032;
  const midpoint = tmp.add(tmp2).multiplyScalar(0.5);
  actionButton.getWorldPosition(tmp2);
  const closeEnough = midpoint.distanceTo(tmp2) < 0.28;
  if (pinching && !lastHandPinch && closeEnough) {
    if (rootState.seated) leaveTable('hand-pinch');
    else joinTable('hand-pinch');
  }
  lastHandPinch = pinching;
}

function onKey(event) {
  if (event.repeat) return;
  const key = String(event.key || '').toLowerCase();
  if (key === 'p' && !rootState.seated) joinTable('keyboard-p');
  if (key === 'l' && rootState.seated) leaveTable('keyboard-l');
}

function frame() {
  if (!ACTIVE) return;
  const delta = clock.getDelta();
  void delta;
  applySeatAnchor(false);
  attachControllerSelection();
  handPinchAction();
  const now = performance.now();
  if (now - lastNpcPassAt > 1800) {
    lastNpcPassAt = now;
    npcPass();
    ensureWatch();
  }
  frameHandle = requestAnimationFrame(frame);
}

function qa() {
  const info = tableInfo();
  const activeCamera = xrCamera();
  const current = new THREE.Vector3();
  activeCamera?.getWorldPosition(current);
  const oldSeatModulesLoaded = [
    ...(window.SVR_PHASE340_PLATFORM_STATE?.loaded || []),
    ...(window.SVR_PHASE340_PLATFORM_STATE?.deferredLoaded || [])
  ].filter((path) => /p86_seated_lock|p87_scorpion_seat_authority/.test(String(path)));
  const result = {
    ...rootState,
    tableFound: Boolean(info),
    playerRigFound: Boolean(playerRig()),
    oldForcedSeatModulesLoaded,
    lobbyAnchor: lobbyAnchor ? { x: lobbyAnchor.x, z: lobbyAnchor.z } : null,
    seatAnchor: seatAnchor ? { x: seatAnchor.x, z: seatAnchor.z } : null,
    currentPosition: activeCamera ? { x: Number(current.x.toFixed(3)), y: Number(current.y.toFixed(3)), z: Number(current.z.toFixed(3)) } : null,
    playButton: Boolean(actionButton && htmlButton),
    watchVisible: rootState.existingWatchRoots > 0 || Boolean(fallbackWatch?.visible),
    movementEnabled: movementKeys.reduce((output, key) => ({ ...output, [key]: window[key] }), {}),
    phase360Available: typeof window.SVR_PHASE360_JOIN_TABLE === 'function' && typeof window.SVR_PHASE360_LEAVE_TABLE === 'function',
    checkedAt: new Date().toISOString()
  };
  result.pass = ACTIVE
    && result.tableFound
    && result.playerRigFound
    && result.oldForcedSeatModulesLoaded.length === 0
    && result.playButton
    && result.watchVisible
    && result.phase360Available
    && rootState.teleportBlockedWhileSeated
    && rootState.movementBlockedWhileSeated;
  rootState.checkedAt = result.checkedAt;
  window.SVR_PHASE361_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || installed) return;
  scene = window.__SVR_SCENE__ || null;
  camera = window.__SVR_CAMERA__ || null;
  renderer = window.__SVR_RENDERER__ || null;
  if (!scene || !camera || !renderer || !findTable()) {
    setTimeout(install, 120);
    return;
  }
  installed = true;
  rootState.installedAt = new Date().toISOString();
  rootState.tableFound = true;
  rootState.playerRigFound = Boolean(playerRig());
  removeOldForcedSeatArtifacts();
  computeAnchors();
  ensureActionPanel();
  ensureHtmlControls();
  ensureWatch();
  npcPass();
  applyLobbySpawn(true);
  setTimeout(() => {
    window.SVR_PHASE359_TOGGLE_CONTINUOUS?.(false);
    window.SVR_PHASE360_LEAVE_TABLE?.();
    leaveArmed = true;
  }, 220);

  window.SVR_PHASE361_STATE = rootState;
  window.SVR_PHASE361_PLAY_GAME = () => joinTable('public-api');
  window.SVR_PHASE361_LEAVE_TABLE = () => leaveTable('public-api');
  window.SVR_PHASE361_LOBBY_SPAWN = () => applyLobbySpawn(true);
  window.SVR_PHASE361_RESEAT = () => {
    if (!rootState.seated) return joinTable('public-reseat');
    return applySeatAnchor(true);
  };
  window.SVR_PHASE361_NPC_ALIGN = npcPass;
  window.SVR_PHASE361_QA = qa;

  window.addEventListener('keydown', onKey);
  monitorTimer = window.setInterval(() => {
    removeOldForcedSeatArtifacts();
    updateUi();
    if (!rootState.seated && !rootState.lobbySpawnApplied) applyLobbySpawn(true);
  }, 900);
  frameHandle = requestAnimationFrame(frame);

  window.addEventListener('beforeunload', () => {
    if (frameHandle) cancelAnimationFrame(frameHandle);
    if (monitorTimer) clearInterval(monitorTimer);
    window.removeEventListener('keydown', onKey);
  }, { once: true });

  rootState.mode = 'lobby';
  updateUi();
  window.dispatchEvent(new CustomEvent('svr:phase361-ready', {
    detail: { build: BUILD, platform, seated: false }
  }));
}

if (ACTIVE) install();
