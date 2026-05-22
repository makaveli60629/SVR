// SVR Game/Data Phase 06 — API Bridge Lock
// Purpose: send lightweight, anonymous game events to the live AWS API.
// Safety: no SQL credentials, no Stripe keys, no passwords, no personal tracking.
// The game never connects directly to the database; it only talks to https://api.svrpoker.com.

const SVR_API_BASE = window.SVR_API_BASE || "https://api.svrpoker.com";
const SESSION_KEY = "svr_game_session_id";
const QUEUE_KEY = "svr_game_event_queue_v1";
const MAX_QUEUE = 40;

function getSessionId(){
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id){
      id = `svr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch (_err){
    return `svr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getBuildLabel(){
  const text = Array.from(document.querySelectorAll(".pill, [data-build], body"))
    .map((el)=>el?.dataset?.build || el?.textContent || "")
    .join(" ");
  const match = text.match(/PHASE-[A-Z0-9\-]+/i);
  return match ? match[0].toUpperCase() : (window.__SVR_BOOT_WRAPPER || "SVR-GAME");
}

function getRoomFromSceneKey(key){
  const map = {
    lobby: "lobby",
    seat: "poker_table",
    table: "poker_table",
    scorpion: "scorpion_room",
    reiki: "reiki_hub",
    reikiRoom: "reiki_room",
    pga: "pga_hub",
    pgaRange: "pga_range",
    vrStore: "vr_store",
    smokerLounge: "smoker_lounge",
    spaceRoom: "space_room",
    sponsor: "sponsor_wall",
    legends: "legend_hub"
  };
  return map[key] || key || "unknown";
}

function readQueue(){
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); }
  catch (_err){ return []; }
}

function writeQueue(items){
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE))); }
  catch (_err){}
}

function queueEvent(event){
  const q = readQueue();
  q.push(event);
  writeQueue(q);
}

async function postEvent(event){
  const body = JSON.stringify(event);
  try {
    const res = await fetch(`${SVR_API_BASE}/api/game/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body,
      keepalive: body.length < 60000
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err){
    console.warn("[SVR API BRIDGE] event queued:", event.eventType, err.message);
    queueEvent(event);
    return false;
  }
}

async function flushQueue(){
  const q = readQueue();
  if (!q.length) return;
  const remaining = [];
  for (const event of q.slice(-MAX_QUEUE)){
    const ok = await postEvent(event);
    if (!ok) remaining.push(event);
  }
  writeQueue(remaining);
}

const lastSent = new Map();
function track(eventType, options = {}){
  const now = Date.now();
  const room = options.room || getRoomFromSceneKey(options.sceneKey) || "game";
  const throttleKey = `${eventType}:${room}:${options.adKey || ""}`;
  const throttleMs = Number(options.throttleMs || 0);
  if (throttleMs && lastSent.has(throttleKey) && now - lastSent.get(throttleKey) < throttleMs) return;
  lastSent.set(throttleKey, now);

  const event = {
    eventType,
    room,
    build: getBuildLabel(),
    sessionId: getSessionId(),
    source: options.source || "game",
    payload: {
      path: location.pathname,
      query: location.search,
      preview: new URLSearchParams(location.search).has("preview"),
      ...options.payload
    }
  };
  postEvent(event);
}

function wireSceneButtons(){
  document.addEventListener("click", (event)=>{
    const btn = event.target?.closest?.("[data-scene]");
    if (!btn) return;
    const sceneKey = btn.dataset.scene;
    const room = getRoomFromSceneKey(sceneKey);
    track("room_route_request", { sceneKey, room, payload: { sceneKey, label: btn.textContent?.trim() || sceneKey }, throttleMs: 800 });
    if (sceneKey === "vrStore") track("store_portal_clicked", { room, payload: { sceneKey }, throttleMs: 1000 });
  }, { passive: true });
}

function wireWebXR(){
  if (!navigator.xr || navigator.xr.__svrBridgeWrapped) return;
  const originalRequestSession = navigator.xr.requestSession?.bind(navigator.xr);
  if (!originalRequestSession) return;
  navigator.xr.__svrBridgeWrapped = true;
  navigator.xr.requestSession = async function(mode, init){
    track("vr_session_requested", { room: "webxr", payload: { mode }, throttleMs: 1000 });
    const session = await originalRequestSession(mode, init);
    track("vr_session_started", { room: "webxr", payload: { mode }, throttleMs: 1000 });
    session.addEventListener("end", ()=>track("vr_session_ended", { room: "webxr", payload: { mode }, throttleMs: 1000 }), { once: true });
    return session;
  };
}

function wireVisibility(){
  document.addEventListener("visibilitychange", ()=>{
    track(document.visibilityState === "hidden" ? "game_hidden" : "game_visible", { room: "browser", throttleMs: 10000 });
  });
}

function boot(){
  window.SVR_API_BRIDGE = Object.freeze({ track, flushQueue, getSessionId });
  track("game_loaded", { room: "lobby", payload: { userAgent: navigator.userAgent.slice(0, 160) }, throttleMs: 2500 });
  wireSceneButtons();
  wireWebXR();
  wireVisibility();
  setTimeout(flushQueue, 2500);

  // Placeholder ad telemetry. This does not make the ad live or paid.
  // It tracks the sample Espresso with Cream banner placement above the Reiki-side building.
  setTimeout(()=>{
    track("ad_impression", {
      room: "lobby",
      adKey: "espresso_with_cream_placeholder",
      throttleMs: 60 * 60 * 1000,
      payload: {
        adKey: "espresso_with_cream_placeholder",
        placement: "above_reiki_building",
        label: "ESPRESSO WITH CREAM",
        liveSponsor: false,
        placeholderOnly: true
      }
    });
  }, 6000);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
