import * as THREE from 'three';

export const BUILD = 'PHASE-364-DEVICE-XR-GEOMETRY-SPAWN-LOCK';

const query = new URLSearchParams(location.search);
const ua = navigator.userAgent || '';
const platform = String(window.SVR_PLATFORM || query.get('platform') || document.body?.dataset?.platform || (
  /Quest|Oculus|Meta Quest/i.test(ua) ? 'quest' : /Android/i.test(ua) ? 'android' : 'desktop'
)).toLowerCase();
const QUEST = platform === 'quest';
const ANDROID = platform === 'android';
const ACTIVE = QUEST || ANDROID;
const FLOOR_Y = 0;
const TABLE = Object.freeze({ length: 2.74, height: 0.80, depth: 1.46, centerX: 0, centerZ: 0.75 });
const TABLE_READY_GAP = 0.90;
const SEAT_GAP = 0.48;

const state = {
  build: BUILD,
  platform,
  active: ACTIVE,
  tableAdjusted: false,
  tableBefore: null,
  tableAfter: null,
  floorAuthority: null,
  lobbySpawn: null,
  seatAnchor: null,
  spawnMode: 'table-ready-standing',
  spawnApplications: 0,
  spawnSkips: 0,
  insideTableRecoveries: 0,
  bounceCorrectionsBlocked: 0,
  seatApplications: 0,
  xrSupported: null,
  xrPresenting: false,
  xrEntryAttempts: 0,
  xrEntrySuccesses: 0,
  xrEntryFailures: 0,
  xrUnexpectedEnds: 0,
  lastXrError: null,
  enterVrButtonReady: false,
  defaultVrButtonsRemoved: 0,
  quarantinedEricRoots: 0,
  alignedNpcRoots: 0,
  physicalQuestAcceptancePending: QUEST,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = THREE.MathUtils.clamp;
const tmp = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
let scene = null;
let camera = null;
let renderer = null;
let table = null;
let floor = null;
let xrButton = null;
let xrMessage = null;
let interval = 0;
let lastSeated = false;
let lastJoinAt = 0;
let lastAndroidSeatAt = 0;
let spawnTimer = 0;
let safetyTimer = 0;
let activeSession = null;
let authorityValue = window.SVR_TABLE_AUTHORITY;

function walk(root, visitor, limit = 12000) {
  const stack = root ? [root] : [];
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

function find(name) {
  let result = null;
  walk(scene, (object) => {
    if (!result && object?.name === name) result = object;
  }, 7000);
  return result;
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

function vector(value) {
  return { x: +value.x.toFixed(3), y: +value.y.toFixed(3), z: +value.z.toFixed(3) };
}

function candidate() {
  const direct = [
    window.SVR_TABLE_AUTHORITY,
    window.SVR_PHASE363_TABLE_STATE?.object,
    window.SVR_PHASE358_TABLE_STATE?.object,
    table
  ];
  for (const object of direct) {
    if (!object?.isObject3D) continue;
    try {
      const b = bounds(object);
      if (!b.box.isEmpty() && b.size.x > 1 && b.size.z > 0.7) return object;
    } catch {}
  }
  for (const name of [
    'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED',
    'PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER',
    'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER'
  ]) {
    const object = find(name);
    if (!object?.isObject3D) continue;
    try {
      const b = bounds(object);
      if (!b.box.isEmpty() && b.size.x > 1 && b.size.z > 0.7) return object;
    } catch {}
  }
  return null;
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

function alignTable() {
  table = candidate();
  if (!table) return false;
  let b = bounds(table);
  state.tableBefore = {
    size: vector(b.size),
    center: vector(b.center),
    minY: +b.box.min.y.toFixed(3),
    maxY: +b.box.max.y.toFixed(3)
  };
  if (b.size.z > b.size.x * 1.12) {
    table.rotation.y += Math.PI / 2;
    b = bounds(table);
  }
  table.scale.set(
    table.scale.x * clamp(TABLE.length / Math.max(b.size.x, 0.001), 0.35, 2.2),
    table.scale.y * clamp(TABLE.height / Math.max(b.size.y, 0.001), 0.35, 2.2),
    table.scale.z * clamp(TABLE.depth / Math.max(b.size.z, 0.001), 0.35, 2.2)
  );
  b = bounds(table);
  worldDelta(table, new THREE.Vector3(
    TABLE.centerX - b.center.x,
    FLOOR_Y - b.box.min.y,
    TABLE.centerZ - b.center.z
  ));
  b = bounds(table);
  if (window.SVR_TABLE_AUTHORITY !== table) window.SVR_TABLE_AUTHORITY = table;
  window.SVR_TABLE_TOP_Y = b.box.max.y;
  window.SVR_TABLE_FLOOR_Y = FLOOR_Y;
  window.SVR_TABLE_RESTING_POINT_STATE = {
    ...(window.SVR_TABLE_RESTING_POINT_STATE || {}),
    build: BUILD,
    restY: b.box.max.y,
    floorY: FLOOR_Y,
    deviceGeometryAuthority: true
  };
  state.tableAdjusted = true;
  state.tableAfter = {
    size: vector(b.size),
    center: vector(b.center),
    minY: +b.box.min.y.toFixed(3),
    maxY: +b.box.max.y.toFixed(3)
  };
  return true;
}

function trapAuthority() {
  if (!ACTIVE) return;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'SVR_TABLE_AUTHORITY');
    if (descriptor?.configurable === false) return;
    authorityValue = descriptor?.get ? descriptor.get.call(window) : authorityValue;
    Object.defineProperty(window, 'SVR_TABLE_AUTHORITY', {
      configurable: true,
      enumerable: true,
      get: () => authorityValue,
      set(value) {
        const changed = value !== authorityValue;
        authorityValue = value;
        if (!changed) return;
        queueMicrotask(() => {
          scene = window.__SVR_SCENE__ || scene;
          if (scene && value?.isObject3D) alignTable();
        });
      }
    });
  } catch (error) {
    state.lastError = String(error?.message || error);
  }
}

function ensureFloor() {
  if (!scene) return null;
  floor = floor || find('PHASE364_DEVICE_FLOOR_AUTHORITY');
  if (!floor) {
    floor = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 48),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
        side: THREE.DoubleSide
      })
    );
    floor.name = 'PHASE364_DEVICE_FLOOR_AUTHORITY';
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.userData.teleportSurface = true;
    scene.add(floor);
  }
  floor.visible = true;
  state.floorAuthority = floor.name;
  window.SVR_DEVICE_FLOOR_AUTHORITY = floor;
  return floor;
}

function info() {
  const object = candidate();
  if (!object) return null;
  const b = bounds(object);
  return { ...b, topY: b.box.max.y, frontZ: b.box.max.z };
}

function rig() {
  return window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || window.SVR_PLAYER_RIG || null;
}

function xrCamera() {
  const value = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  return value?.cameras?.[0] || value || camera;
}

function head() {
  const value = xrCamera();
  return value?.getWorldPosition?.(new THREE.Vector3()) || new THREE.Vector3();
}

function pose() {
  const value = rig()?.getPlayerPose?.();
  return value || rig()?.position || {
    x: camera?.position?.x || 0,
    y: 0,
    z: camera?.position?.z || 0
  };
}

function setPose(x, y, z) {
  const value = rig();
  if (value?.setPlayerPose) {
    try {
      value.setPlayerPose(x, y, z);
      return true;
    } catch {}
  }
  if (value?.position) {
    value.position.set(x, y, z);
    return true;
  }
  if (!renderer?.xr?.isPresenting && camera?.position) {
    camera.position.set(x, y + 1.62, z);
    return true;
  }
  return false;
}

function face(x, z, target) {
  const value = rig();
  if (!value?.rotation || !target) return false;
  const dx = target.x - x;
  const dz = target.z - z;
  value.rotation.y = Math.atan2(-dx, -dz);
  return true;
}

function anchors() {
  const value = info();
  if (!value) return null;
  const lobby = {
    x: value.center.x,
    y: 0,
    z: value.frontZ + TABLE_READY_GAP,
    target: new THREE.Vector3(value.center.x, value.topY + 0.08, value.center.z)
  };
  const seat = {
    x: value.center.x,
    z: value.frontZ + SEAT_GAP,
    eyeY: value.topY + 0.56,
    target: new THREE.Vector3(value.center.x, value.topY + 0.04, value.center.z - value.size.z * 0.08)
  };
  state.lobbySpawn = { x: +lobby.x.toFixed(3), y: 0, z: +lobby.z.toFixed(3) };
  state.seatAnchor = {
    x: +seat.x.toFixed(3),
    z: +seat.z.toFixed(3),
    targetEyeY: +seat.eyeY.toFixed(3)
  };
  return { value, lobby, seat };
}

function headInsideTable(value = info(), position = head()) {
  if (!value) return false;
  const margin = 0.18;
  return position.x > value.box.min.x - margin &&
    position.x < value.box.max.x + margin &&
    position.z > value.box.min.z - margin &&
    position.z < value.box.max.z + margin &&
    position.y < value.topY + 1.25;
}

function lobbySpawn(force = false, reason = 'manual') {
  if (!QUEST) return false;
  const a = anchors();
  if (!a) return false;
  const current = head();
  const distance = Math.hypot(current.x - a.lobby.x, current.z - a.lobby.z);
  const inside = headInsideTable(a.value, current);
  if (!force && !inside && distance < 0.34) {
    state.spawnSkips += 1;
    return true;
  }
  if (force && !inside && distance < 0.34) {
    state.bounceCorrectionsBlocked += 1;
    return true;
  }
  const ok = setPose(a.lobby.x, 0, a.lobby.z);
  face(a.lobby.x, a.lobby.z, a.lobby.target);
  if (inside) state.insideTableRecoveries += 1;
  state.spawnApplications += ok ? 1 : 0;
  state.lastSpawnReason = reason;
  window.SVR_PHASE364_MODE = 'table-ready-standing';
  return ok;
}

function scheduleStableSpawn(reason = 'xr-session-start') {
  clearTimeout(spawnTimer);
  clearTimeout(safetyTimer);
  spawnTimer = window.setTimeout(() => lobbySpawn(true, reason), 320);
  safetyTimer = window.setTimeout(() => {
    const a = anchors();
    if (!a) return;
    const current = head();
    const distance = Math.hypot(current.x - a.lobby.x, current.z - a.lobby.z);
    if (headInsideTable(a.value, current) || distance > 1.4) lobbySpawn(true, `${reason}-safety`);
    else state.bounceCorrectionsBlocked += 1;
  }, 1250);
}

function questSeat(force = false) {
  if (!QUEST) return false;
  const a = anchors();
  if (!a) return false;
  const current = head();
  const currentPose = pose();
  if (!force && Math.hypot(current.x - a.seat.x, current.z - a.seat.z) < 0.09 && Math.abs(current.y - a.seat.eyeY) < 0.12) return true;
  const y = clamp(Number(currentPose.y || 0) + (a.seat.eyeY - current.y), -0.62, 0.28);
  const ok = setPose(a.seat.x, y, a.seat.z);
  face(a.seat.x, a.seat.z, a.seat.target);
  state.seatApplications += ok ? 1 : 0;
  window.SVR_PHASE364_MODE = 'seated';
  return ok;
}

function androidSeat(force = false) {
  if (!ANDROID || !camera) return false;
  const a = anchors();
  if (!a || !(window.SVR_PHASE363_STATE?.joined || document.body.classList.contains('svr363-seated'))) return false;
  const now = performance.now();
  if (!force && now - lastAndroidSeatAt < 850) return true;
  const target = new THREE.Vector3(a.seat.x, a.value.topY + 0.55, a.seat.z + 0.02);
  if (!force && head().distanceTo(target) < 0.08) return true;
  camera.position.copy(target);
  camera.lookAt(a.seat.target);
  camera.updateProjectionMatrix?.();
  lastAndroidSeatAt = now;
  state.seatApplications += 1;
  return true;
}

function sanitizeNpcs() {
  const tableInfo = info();
  if (!tableInfo) return { quarantined: 0, aligned: 0 };
  const roots = [];
  walk(scene, (object) => {
    if (!/(eric|claudia|carla|bot[_ -]?avatar|npc[_ -]?player|seated[_ -]?player|dealer[_ -]?avatar)/i.test(String(object?.name || ''))) return;
    let root = object;
    while (root.parent && root.parent !== scene && /(eric|claudia|carla|bot[_ -]?avatar|npc[_ -]?player|seated[_ -]?player|dealer[_ -]?avatar)/i.test(String(root.parent.name || ''))) root = root.parent;
    if (!roots.includes(root)) roots.push(root);
  }, 8000);
  let quarantined = 0;
  let aligned = 0;
  for (const root of roots) {
    const name = String(root.name || '');
    // Dealer Eric remains hidden until an approved textured, upright rig passes headset acceptance.
    if (/eric/i.test(name)) {
      root.visible = false;
      root.userData.svrPhase364Quarantined = true;
      quarantined += 1;
      continue;
    }
    const b = bounds(root);
    const horizontal = Math.max(b.size.x, b.size.z, 0.001);
    if (b.size.y < horizontal * 0.58 || b.size.y > 3.1 || horizontal > 3.2 || b.box.min.y > tableInfo.topY + 0.55) {
      root.visible = false;
      continue;
    }
    root.getWorldPosition(tmp);
    const dx = tableInfo.center.x - tmp.x;
    const dz = tableInfo.center.z - tmp.z;
    root.rotation.y = Math.atan2(-dx, -dz);
    const grounded = bounds(root);
    if (grounded.box.min.y > 0.04) worldDelta(root, new THREE.Vector3(0, -grounded.box.min.y, 0));
    root.userData.svrPhase364FacesTable = true;
    aligned += 1;
  }
  state.quarantinedEricRoots = Math.max(state.quarantinedEricRoots, quarantined);
  state.alignedNpcRoots = Math.max(state.alignedNpcRoots, aligned);
  return { quarantined, aligned };
}

function removeOldVrButtons() {
  let count = 0;
  document.querySelectorAll('.svr-vr-button,#VRButton,button[style*="ENTER VR"],button[style*="EXIT VR"]').forEach((element) => {
    if (element !== xrButton) {
      element.remove();
      count += 1;
    }
  });
  state.defaultVrButtonsRemoved += count;
  return count;
}

function message(text, error = false) {
  if (!xrMessage) return;
  xrMessage.textContent = text;
  xrMessage.style.color = error ? '#ffb3c3' : '#d8faff';
}

function bindSession(session) {
  if (!session || activeSession === session) return;
  activeSession = session;
  state.xrPresenting = true;
  state.xrEntrySuccesses += 1;
  xrButton.hidden = true;
  message('Quest VR active. Starting beside the table.');
  scheduleStableSpawn('xr-session-start');
  session.addEventListener('end', () => {
    state.xrPresenting = false;
    state.xrUnexpectedEnds += 1;
    activeSession = null;
    clearTimeout(spawnTimer);
    clearTimeout(safetyTimer);
    xrButton.hidden = false;
    xrButton.disabled = false;
    xrButton.textContent = 'ENTER VR';
    message('VR session ended. Press ENTER VR to retry.', true);
  }, { once: true });
}

async function enterVr() {
  if (!QUEST || !navigator.xr?.requestSession) return Boolean(renderer?.xr?.isPresenting);
  if (renderer?.xr?.isPresenting) return true;
  state.xrEntryAttempts += 1;
  xrButton.disabled = true;
  xrButton.textContent = 'ENTERING VR…';
  message('Opening Quest VR at the poker table…');
  try {
    renderer.xr.setReferenceSpaceType?.('local-floor');
    const session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
    });
    await renderer.xr.setSession(session);
    bindSession(session);
    return true;
  } catch (error) {
    state.xrEntryFailures += 1;
    state.lastXrError = String(error?.message || error);
    xrButton.disabled = false;
    xrButton.hidden = false;
    xrButton.textContent = 'ENTER VR';
    message(`VR entry failed: ${state.lastXrError}`, true);
    return false;
  }
}

async function ensureVrUi() {
  if (!QUEST || xrButton) return xrButton;
  removeOldVrButtons();
  const style = document.createElement('style');
  style.id = 'svr364XrStyle';
  style.textContent = '#svr364Xr{position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);z-index:2147483646;display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid #7ffcff;border-radius:16px;background:rgba(2,8,18,.9);font-family:system-ui}#svr364EnterVr{padding:12px 18px;border:1px solid #ffd98a;border-radius:12px;background:#09131d;color:#fff;font-weight:900}#svr364XrMessage{max-width:290px;font-size:11px;color:#d8faff}body.svr364-xr-active #svr364Xr{display:none!important}';
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'svr364Xr';
  root.innerHTML = '<button id="svr364EnterVr">ENTER VR</button><span id="svr364XrMessage">Quest ready. You will start beside the poker table.</span>';
  document.body.appendChild(root);
  xrButton = root.querySelector('#svr364EnterVr');
  xrMessage = root.querySelector('#svr364XrMessage');
  xrButton.addEventListener('click', enterVr);
  try {
    state.xrSupported = Boolean(await navigator.xr?.isSessionSupported?.('immersive-vr'));
  } catch {
    state.xrSupported = false;
  }
  xrButton.disabled = !state.xrSupported;
  if (!state.xrSupported) message('Open this route in the Meta Quest Browser.', true);
  state.enterVrButtonReady = true;
  return xrButton;
}

function capturePlayButton() {
  if (!QUEST) return;
  document.addEventListener('click', (event) => {
    if (!event.target?.closest?.('#svr361QuestSeatButton')) return;
    const now = performance.now();
    if (now - lastJoinAt < 650) return;
    lastJoinAt = now;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (window.SVR_PHASE361_STATE?.seated) {
      window.SVR_PHASE361_LEAVE_TABLE?.();
      window.setTimeout(() => lobbySpawn(false, 'leave-table'), 120);
    } else {
      window.SVR_PHASE361_PLAY_GAME?.();
      window.setTimeout(() => questSeat(true), 120);
    }
  }, true);
}

function qa() {
  const value = info();
  const measured = value ? {
    size: vector(value.size),
    center: vector(value.center),
    minY: +value.box.min.y.toFixed(3),
    maxY: +value.box.max.y.toFixed(3)
  } : null;
  const tablePass = Boolean(measured &&
    Math.abs(measured.size.x - TABLE.length) <= 0.09 &&
    Math.abs(measured.size.y - TABLE.height) <= 0.09 &&
    Math.abs(measured.size.z - TABLE.depth) <= 0.09 &&
    Math.abs(measured.minY) <= 0.03);
  const a = anchors();
  const spawnGap = a ? +(a.lobby.z - a.value.frontZ).toFixed(3) : null;
  const seatGap = a ? +(a.seat.z - a.value.frontZ).toFixed(3) : null;
  const result = {
    ...state,
    measuredTable: measured,
    tableTarget: TABLE,
    floorY: FLOOR_Y,
    spawnGap,
    seatGap,
    tableReadyFacing: Boolean(a && a.lobby.z > a.value.frontZ && spawnGap >= 0.72 && spawnGap <= 1.08),
    phase361Seated: Boolean(window.SVR_PHASE361_STATE?.seated),
    androidJoined: Boolean(window.SVR_PHASE363_STATE?.joined),
    tablePass,
    pass: Boolean(ACTIVE && tablePass && state.floorAuthority && (!QUEST || state.enterVrButtonReady) && !state.lastError),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE364_QA_STATE = result;
  return result;
}

async function install() {
  if (!ACTIVE) return;
  state.installedAt = new Date().toISOString();
  const started = performance.now();
  while (performance.now() - started < 24000) {
    scene = window.__SVR_SCENE__ || scene;
    camera = window.__SVR_CAMERA__ || camera;
    renderer = window.__SVR_RENDERER__ || renderer;
    if (QUEST && renderer && !xrButton) await ensureVrUi();
    table = candidate();
    if (scene && camera && renderer && table) break;
    await wait(100);
  }
  if (!scene || !camera || !renderer || !table) {
    state.lastError = 'DEVICE_RUNTIME_OR_TABLE_NOT_READY';
    window.SVR_PHASE364_STATE = { ...state };
    return;
  }
  alignTable();
  ensureFloor();
  if (QUEST) {
    capturePlayButton();
    await ensureVrUi();
    lobbySpawn(false, 'pre-xr-table-ready');
    renderer.xr.addEventListener('sessionstart', () => {
      const session = renderer.xr.getSession?.();
      if (session) bindSession(session);
    });
    window.requestIdleCallback?.(() => sanitizeNpcs(), { timeout: 1800 }) || window.setTimeout(() => sanitizeNpcs(), 900);
  } else {
    sanitizeNpcs();
  }
  window.SVR_PHASE364_ENTER_VR = enterVr;
  window.SVR_PHASE364_LOBBY_SPAWN = () => lobbySpawn(false, 'manual-table-ready');
  window.SVR_PHASE364_SEAT = () => questSeat(true);
  window.SVR_PHASE364_ANDROID_SEAT = () => androidSeat(true);
  window.SVR_PHASE364_ALIGN_TABLE = alignTable;
  window.SVR_PHASE364_SANITIZE_NPCS = sanitizeNpcs;
  window.SVR_PHASE364_QA = qa;
  interval = window.setInterval(() => {
    state.xrPresenting = Boolean(renderer?.xr?.isPresenting);
    document.body.classList.toggle('svr364-xr-active', state.xrPresenting);
    if (QUEST) {
      removeOldVrButtons();
      const seated = Boolean(window.SVR_PHASE361_STATE?.seated);
      if (seated && !lastSeated) window.setTimeout(() => questSeat(true), 80);
      if (!seated && lastSeated) window.setTimeout(() => lobbySpawn(false, 'leave-seat'), 120);
      lastSeated = seated;
      if (state.xrPresenting && headInsideTable()) lobbySpawn(true, 'inside-table-recovery');
    }
    if (ANDROID) androidSeat(false);
    state.checkedAt = new Date().toISOString();
    window.SVR_PHASE364_STATE = { ...state };
  }, 750);
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
    clearTimeout(spawnTimer);
    clearTimeout(safetyTimer);
  }, { once: true });
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE364_STATE = { ...state };
  window.dispatchEvent(new CustomEvent('svr:phase364-ready', { detail: qa() }));
}

trapAuthority();
install().catch((error) => {
  state.lastError = String(error?.stack || error?.message || error);
  window.SVR_PHASE364_STATE = { ...state };
});
