import * as THREE from 'three';
import { account } from '../../site/js/phase345-demo-activity-persistence.js?v=phase349';

const BUILD = 'PHASE-349-MULTIPLAYER-PRESENCE-SEAT-RECONNECT-LOCK';
const ROOT_NAME = 'PHASE349_REMOTE_PLAYER_PRESENCE_ROOT';
const ROOM_ID = new URLSearchParams(location.search).get('room') || 'lobby-main';
const CAMERA3 = /\/game\/camera3\.html$/i.test(location.pathname)
  || new URLSearchParams(location.search).get('cam') === 'director'
  || new URLSearchParams(location.search).has('director');
const PLATFORM = (() => {
  const value = String(window.SVR_PLATFORM || '').toLowerCase();
  if (value) return value;
  const ua = navigator.userAgent || '';
  if (/Quest|Oculus|Meta Quest/i.test(ua)) return 'quest';
  if (/Android/i.test(ua) || /\/game\/android\.html$/i.test(location.pathname)) return 'android';
  return 'desktop';
})();
const ACTIVE = !CAMERA3 && ['android', 'quest', 'desktop'].includes(PLATFORM);
const CLIENT_KEY = 'svr_phase349_client_id_v1';
const DEMO_KEY = `svr_phase349_presence_${ROOM_ID}_v1`;
const CHANNEL_NAME = `svr-phase349-${ROOM_ID}-v1`;
const STALE_MS = 12000;
const HEARTBEAT_MS = PLATFORM === 'desktop' ? 2200 : 2800;
const POLL_MS = PLATFORM === 'desktop' ? 1600 : 2400;
const REMOTE_LIMIT = PLATFORM === 'desktop' ? 12 : PLATFORM === 'quest' ? 7 : 6;

let installed = false;
let root = null;
let transport = 'initializing';
let apiBase = '';
let localRecord = null;
let channel = null;
let heartbeatTimer = 0;
let pollTimer = 0;
let frame = 0;
let lastPollAt = 0;
let lastHeartbeatAt = 0;
let reconnects = 0;
let duplicateRepairs = 0;
let expiredRepairs = 0;
let seatConflicts = 0;
let lastError = null;
let lastRemoteCount = 0;
const remotes = new Map();

function scene() { return window.__SVR_SCENE__ || null; }
function camera() { return window.__SVR_CAMERA__ || null; }
function layout() { return window.SVR_PHASE341_TABLE_LAYOUT || null; }
function localAvatarRoot() { return window.SVR_PHASE348_GET_ROOT?.() || scene()?.getObjectByName?.('PHASE348_LOCAL_PLAYER_AVATAR_ROOT') || null; }
function nowIso() { return new Date().toISOString(); }
function nowMs(value) { const parsed = Date.parse(value || ''); return Number.isFinite(parsed) ? parsed : 0; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function safeJson(value, fallback = null) { try { return JSON.parse(value); } catch { return fallback; } }
function clientId() {
  let value = sessionStorage.getItem(CLIENT_KEY);
  if (!value) {
    value = crypto.randomUUID?.() || `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(CLIENT_KEY, value);
  }
  return value;
}
function profile() {
  const accountState = account.snapshot?.() || window.SVR_PLAYER_ACCOUNT_STATE || {};
  const avatar = window.SVR_PLAYER_AVATAR_PROFILE || {};
  const p = accountState.profile || {};
  return {
    playerId: p.playerId || `guest-${clientId()}`,
    displayName: String(p.displayName || 'Guest Player').slice(0, 40),
    mode: accountState.mode || 'unconfigured',
    avatar: {
      modelId: avatar.outfit?.modelId || p.equippedOutfit?.modelId || 'eric',
      palette: avatar.outfit?.palette || p.equippedOutfit?.palette || 'midnight',
      top: avatar.outfit?.top || p.equippedOutfit?.top || 'none',
      headwear: avatar.outfit?.headwear || p.equippedOutfit?.headwear || 'none'
    }
  };
}
function pose() {
  const source = localAvatarRoot() || camera();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  source?.getWorldPosition?.(position);
  source?.getWorldQuaternion?.(quaternion);
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ');
  const seated = Boolean(window.SVR_PHASE347_STATE?.seated || window.SVR_PHASE343_STATE?.seated || window.SVR_PHASE348_STATE?.seated);
  return {
    x: +position.x.toFixed(3), y: +position.y.toFixed(3), z: +position.z.toFixed(3),
    yaw: +euler.y.toFixed(4), pitch: +euler.x.toFixed(4), seated
  };
}
function record(seatId = localRecord?.seatId ?? null) {
  const p = profile();
  return {
    build: BUILD,
    roomId: ROOM_ID,
    sessionId: localRecord?.sessionId || crypto.randomUUID?.() || `presence-${Date.now()}`,
    clientId: clientId(),
    playerId: p.playerId,
    displayName: p.displayName,
    platform: PLATFORM,
    mode: p.mode,
    avatar: p.avatar,
    pose: pose(),
    seatId: Number.isInteger(seatId) ? seatId : null,
    connectedAt: localRecord?.connectedAt || nowIso(),
    heartbeatAt: nowIso(),
    expiresAt: new Date(Date.now() + STALE_MS).toISOString()
  };
}
function sanitize(input) {
  if (!input || input.roomId !== ROOM_ID || !input.playerId || !input.clientId) return null;
  return {
    roomId: ROOM_ID,
    sessionId: String(input.sessionId || ''),
    clientId: String(input.clientId || ''),
    playerId: String(input.playerId || ''),
    displayName: String(input.displayName || 'Player').slice(0, 40),
    platform: ['android', 'quest', 'desktop', 'web'].includes(input.platform) ? input.platform : 'web',
    avatar: {
      modelId: String(input.avatar?.modelId || 'eric').slice(0, 30),
      palette: String(input.avatar?.palette || 'midnight').slice(0, 30),
      top: String(input.avatar?.top || 'none').slice(0, 30),
      headwear: String(input.avatar?.headwear || 'none').slice(0, 30)
    },
    pose: {
      x: clamp(input.pose?.x, -100, 100), y: clamp(input.pose?.y, -20, 50), z: clamp(input.pose?.z, -100, 100),
      yaw: clamp(input.pose?.yaw, -Math.PI * 4, Math.PI * 4), pitch: clamp(input.pose?.pitch, -1.4, 1.4), seated: Boolean(input.pose?.seated)
    },
    seatId: Number.isInteger(input.seatId) && input.seatId >= 0 && input.seatId <= 5 ? input.seatId : null,
    connectedAt: input.connectedAt || nowIso(),
    heartbeatAt: input.heartbeatAt || nowIso(),
    expiresAt: input.expiresAt || new Date(Date.now() + STALE_MS).toISOString()
  };
}
async function loadConfig() {
  try {
    const response = await fetch('/site/config/player-api.json?v=phase349', { cache: 'no-store' });
    const config = response.ok ? await response.json() : {};
    apiBase = String(config.presenceApiBase || '').replace(/\/$/, '');
  } catch { apiBase = ''; }
  const accountState = account.snapshot?.() || {};
  transport = apiBase && accountState.mode === 'api' ? 'api-rest' : 'local-simulation';
  return transport;
}
async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method: options.method || 'GET', credentials: 'include', cache: 'no-store',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-SVR-Client': BUILD },
    body: options.body == null ? undefined : JSON.stringify(options.body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `PRESENCE_API_${response.status}`);
  return payload;
}
function readDemoMap() {
  const value = safeJson(localStorage.getItem(DEMO_KEY), {});
  return value && typeof value === 'object' ? value : {};
}
function writeDemoMap(map) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(map));
  channel?.postMessage?.({ type: 'sync', roomId: ROOM_ID, at: Date.now() });
}
function cleanDemoMap(map) {
  const output = {};
  const now = Date.now();
  const newestByPlayer = new Map();
  for (const [key, raw] of Object.entries(map || {})) {
    const item = sanitize(raw);
    if (!item || nowMs(item.expiresAt) <= now) { expiredRepairs += 1; continue; }
    const prior = newestByPlayer.get(item.playerId);
    if (!prior || nowMs(item.heartbeatAt) > nowMs(prior.heartbeatAt)) newestByPlayer.set(item.playerId, item);
  }
  for (const item of newestByPlayer.values()) output[item.sessionId || item.clientId] = item;
  return output;
}
async function join() {
  localRecord = record(null);
  if (transport === 'api-rest') {
    const result = await apiRequest('/api/presence/join', { method: 'POST', body: localRecord });
    localRecord = sanitize(result.presence || localRecord);
  } else {
    const map = cleanDemoMap(readDemoMap());
    map[localRecord.sessionId] = localRecord;
    writeDemoMap(map);
  }
  lastHeartbeatAt = Date.now();
  return localRecord;
}
async function heartbeat() {
  if (!localRecord) return join();
  localRecord = record(localRecord.seatId);
  try {
    if (transport === 'api-rest') {
      const result = await apiRequest('/api/presence/heartbeat', { method: 'POST', body: localRecord });
      localRecord = sanitize(result.presence || localRecord);
    } else {
      const map = cleanDemoMap(readDemoMap());
      map[localRecord.sessionId] = localRecord;
      writeDemoMap(map);
    }
    lastHeartbeatAt = Date.now();
    lastError = null;
  } catch (error) {
    lastError = String(error?.message || error);
    reconnects += 1;
    if (transport === 'api-rest') setTimeout(() => join().catch(() => undefined), 700);
  }
  return localRecord;
}
async function listPresence() {
  let items = [];
  try {
    if (transport === 'api-rest') {
      const result = await apiRequest(`/api/presence/room/${encodeURIComponent(ROOM_ID)}`);
      items = Array.isArray(result.presence) ? result.presence : [];
    } else {
      const cleaned = cleanDemoMap(readDemoMap());
      writeDemoMap(cleaned);
      items = Object.values(cleaned);
    }
  } catch (error) { lastError = String(error?.message || error); }
  const newest = new Map();
  for (const raw of items) {
    const item = sanitize(raw);
    if (!item || item.clientId === clientId()) continue;
    const prior = newest.get(item.playerId);
    if (!prior || nowMs(item.heartbeatAt) > nowMs(prior.heartbeatAt)) {
      if (prior) duplicateRepairs += 1;
      newest.set(item.playerId, item);
    } else duplicateRepairs += 1;
  }
  reconcile([...newest.values()].slice(0, REMOTE_LIMIT));
  lastPollAt = Date.now();
  return [...newest.values()];
}
async function claimSeat(seatId = 0) {
  seatId = Number(seatId);
  if (!Number.isInteger(seatId) || seatId < 0 || seatId > 5) throw new Error('INVALID_SEAT');
  try {
    if (transport === 'api-rest') {
      const result = await apiRequest('/api/presence/seat/claim', { method: 'POST', body: { roomId: ROOM_ID, sessionId: localRecord?.sessionId, seatId } });
      localRecord = sanitize(result.presence || { ...localRecord, seatId });
    } else {
      const map = cleanDemoMap(readDemoMap());
      const occupied = Object.values(map).some((item) => item.clientId !== clientId() && item.seatId === seatId);
      if (occupied) { seatConflicts += 1; throw new Error('SEAT_OCCUPIED'); }
      localRecord = record(seatId);
      map[localRecord.sessionId] = localRecord;
      writeDemoMap(map);
    }
    window.dispatchEvent(new CustomEvent('svr:presence-seat', { detail: { seatId, owned: true, transport } }));
    return true;
  } catch (error) { lastError = String(error?.message || error); return false; }
}
async function releaseSeat() {
  if (!localRecord || localRecord.seatId == null) return true;
  try {
    if (transport === 'api-rest') await apiRequest('/api/presence/seat/release', { method: 'POST', body: { roomId: ROOM_ID, sessionId: localRecord.sessionId } });
    localRecord = record(null);
    if (transport === 'local-simulation') {
      const map = cleanDemoMap(readDemoMap()); map[localRecord.sessionId] = localRecord; writeDemoMap(map);
    }
    window.dispatchEvent(new CustomEvent('svr:presence-seat', { detail: { seatId: null, owned: false, transport } }));
    return true;
  } catch (error) { lastError = String(error?.message || error); return false; }
}
async function leave() {
  if (!localRecord) return;
  try {
    if (transport === 'api-rest') await apiRequest('/api/presence/leave', { method: 'POST', body: { roomId: ROOM_ID, sessionId: localRecord.sessionId } });
    else { const map = readDemoMap(); delete map[localRecord.sessionId]; writeDemoMap(cleanDemoMap(map)); }
  } catch {}
  localRecord = null;
}
function ensureRoot() {
  const s = scene(); if (!s) return null;
  const roots = [];
  s.traverse((object) => { if (object.name === ROOT_NAME) roots.push(object); });
  root = roots.shift() || new THREE.Group();
  root.name = ROOT_NAME;
  if (!root.parent) s.add(root);
  for (const duplicate of roots) { duplicate.removeFromParent?.(); duplicateRepairs += 1; }
  return root;
}
function paletteColor(id) {
  const map = { midnight: 0x7ffcff, royal: 0x9a70ff, scarlet: 0xff4d79, gold: 0xffd98a, emerald: 0x66ffb2 };
  return map[id] || 0x7ffcff;
}
function nameTexture(text) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, 512, 128); context.fillStyle = 'rgba(0,0,0,.70)'; context.fillRect(8, 16, 496, 96);
  context.strokeStyle = '#7ffcff'; context.lineWidth = 4; context.strokeRect(8, 16, 496, 96);
  context.fillStyle = '#fff'; context.font = '900 44px system-ui'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(String(text || 'Player').slice(0, 24), 256, 64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function makeRemote(item) {
  const group = new THREE.Group(); group.name = `PHASE349_REMOTE_PLAYER_${item.playerId}`; group.userData.playerId = item.playerId;
  const color = paletteColor(item.avatar?.palette);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.20, .80, 5, 10), new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: .08 }));
  body.name = 'PHASE349_REMOTE_BODY'; body.position.y = .72; body.scale.z = .70; body.castShadow = false; body.receiveShadow = false;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.18, 18, 12), new THREE.MeshStandardMaterial({ color: 0xc8b09c, roughness: .78 }));
  head.name = 'PHASE349_REMOTE_HEAD'; head.position.y = 1.48; head.scale.z = .88;
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTexture(item.displayName), transparent: true, depthTest: false, depthWrite: false }));
  tag.name = 'PHASE349_REMOTE_NAME'; tag.position.y = 1.92; tag.scale.set(.95, .24, 1); tag.renderOrder = 349;
  group.add(body, head, tag); root.add(group);
  return { group, body, head, tag, targetPosition: new THREE.Vector3(), targetYaw: 0, item, lastSeen: Date.now() };
}
function targetFor(item) {
  const table = layout();
  if (item.seatId != null && table?.seats?.[item.seatId]) {
    const seat = table.seats[item.seatId];
    return { position: new THREE.Vector3(seat.x, Number(table.top || seat.y || 0), seat.z), yaw: Number(seat.yaw || 0), seated: true };
  }
  return { position: new THREE.Vector3(item.pose.x, item.pose.y, item.pose.z), yaw: item.pose.yaw, seated: item.pose.seated };
}
function reconcile(items) {
  ensureRoot();
  const keep = new Set();
  for (const item of items) {
    keep.add(item.playerId);
    let remote = remotes.get(item.playerId);
    if (!remote) { remote = makeRemote(item); remotes.set(item.playerId, remote); }
    remote.item = item; remote.lastSeen = Date.now();
    const target = targetFor(item); remote.targetPosition.copy(target.position); remote.targetYaw = target.yaw;
    remote.body.scale.y = target.seated ? .72 : 1; remote.body.position.y = target.seated ? .57 : .72;
  }
  for (const [playerId, remote] of remotes) {
    if (!keep.has(playerId) || Date.now() - remote.lastSeen > STALE_MS) {
      remote.group.removeFromParent?.(); remotes.delete(playerId); expiredRepairs += 1;
    }
  }
  lastRemoteCount = remotes.size;
}
function animate() {
  if (!installed) return;
  frame += 1;
  if (frame % (PLATFORM === 'desktop' ? 1 : 2) === 0) {
    for (const remote of remotes.values()) {
      remote.group.position.lerp(remote.targetPosition, .18);
      const delta = Math.atan2(Math.sin(remote.targetYaw - remote.group.rotation.y), Math.cos(remote.targetYaw - remote.group.rotation.y));
      remote.group.rotation.y += delta * .16;
      remote.head.rotation.y = Math.sin(performance.now() * .00045 + remote.group.position.x) * .10;
    }
  }
  requestAnimationFrame(animate);
}
function snapshot() {
  return {
    build: BUILD, active: ACTIVE, roomId: ROOM_ID, transport, transportLabel: transport === 'api-rest' ? 'authenticated API presence' : 'same-browser simulation',
    localPlayerId: localRecord?.playerId || null, localSessionId: localRecord?.sessionId || null, localSeatId: localRecord?.seatId ?? null,
    remotePlayers: remotes.size, remoteLimit: REMOTE_LIMIT, lastRemoteCount, lastHeartbeatAt, lastPollAt, reconnects, duplicateRepairs, expiredRepairs, seatConflicts, lastError,
    internetMultiplayerReady: transport === 'api-rest', pokerStateSynchronized: false, checkedAt: nowIso()
  };
}
function qa() {
  const roots = [];
  scene()?.traverse?.((object) => { if (object.name === ROOT_NAME) roots.push(object); });
  const playerIds = [...remotes.keys()];
  const result = { ...snapshot(), roots: roots.length, uniqueRemotePlayers: new Set(playerIds).size === playerIds.length, staleRemotePlayers: [...remotes.values()].filter((r) => Date.now() - r.lastSeen > STALE_MS).length };
  result.pass = ACTIVE && roots.length === 1 && result.uniqueRemotePlayers && result.staleRemotePlayers === 0 && Boolean(localRecord);
  window.SVR_PHASE349_QA_STATE = result; return result;
}
async function install() {
  if (installed || !ACTIVE) { if (CAMERA3) window.SVR_PHASE349_CAMERA3_EXCLUDED = true; return; }
  installed = true;
  await account.bootstrap().catch(() => undefined);
  await loadConfig();
  ensureRoot();
  channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  channel?.addEventListener('message', () => listPresence().catch(() => undefined));
  window.addEventListener('storage', (event) => { if (event.key === DEMO_KEY) listPresence().catch(() => undefined); });
  await join().catch((error) => { lastError = String(error?.message || error); });
  await listPresence();
  heartbeatTimer = window.setInterval(() => heartbeat(), HEARTBEAT_MS);
  pollTimer = window.setInterval(() => listPresence(), POLL_MS);
  requestAnimationFrame(animate);
  window.addEventListener('svr:account-change', async () => { await leave(); await loadConfig(); await join(); });
  window.addEventListener('pagehide', () => leave(), { once: true });
  window.addEventListener('beforeunload', () => leave(), { once: true });
  window.SVR_PHASE349_QA = qa;
  window.SVR_PHASE349_STATE = snapshot;
  window.SVR_PHASE349_CLAIM_SEAT = claimSeat;
  window.SVR_PHASE349_RELEASE_SEAT = releaseSeat;
  window.SVR_PHASE349_REFRESH = listPresence;
  window.SVR_PHASE349_LEAVE = leave;
  window.SVR_PHASE349_TRANSPORT = () => transport;
  window.dispatchEvent(new CustomEvent('svr:phase349-ready', { detail: snapshot() }));
}

install().catch((error) => { lastError = String(error?.message || error); window.SVR_PHASE349_ERROR = lastError; });
