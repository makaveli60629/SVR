const LABEL = "PHASE-290-WEBSOCKET-PRESENCE-CLIENT-LOCK";
const ROOM_ID = "svr-main-lobby";
const URL_KEY = "SVR_PRESENCE_WS_URL";
let socket = null;
let connected = false;
let lastError = null;
let lastMessageAt = 0;

function clientType(){
  const ua = navigator.userAgent || "";
  if (/OculusBrowser|Quest|Meta Quest/i.test(ua)) return "quest";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}
function playerId(){
  const key = "svr_presence_player_id";
  let id = localStorage.getItem(key);
  if (!id){
    id = `svr-${Math.random().toString(36).slice(2,8)}-${Date.now().toString(36)}`;
    localStorage.setItem(key,id);
  }
  return id;
}
function endpoint(){
  const direct = String(window[URL_KEY] || "").trim();
  const params = new URLSearchParams(location.search);
  const fromQuery = String(params.get("presenceWs") || "").trim();
  return direct || fromQuery;
}
function cameraPose(){
  const cam = window.__SVR_CAMERA__ || window.__SVR_SCENE__?.userData?._camera;
  if (!cam) return null;
  return {
    x: Number(cam.position.x.toFixed(3)),
    y: Number(cam.position.y.toFixed(3)),
    z: Number(cam.position.z.toFixed(3)),
    yaw: Number((cam.rotation?.y || 0).toFixed(3))
  };
}
function state(extra = {}){
  const url = endpoint();
  const s = {
    build: LABEL,
    active: true,
    roomId: ROOM_ID,
    playerId: playerId(),
    client: clientType(),
    configured: !!url,
    connected,
    lastError,
    lastMessageAt,
    localPose: cameraPose(),
    siteTouched: false,
    ...extra,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE290_WEBSOCKET_PRESENCE_CLIENT_LOCK = s;
  window.SVR_PRESENCE_CLIENT = s;
  window.SVR_MULTIPLAYER_STATUS = { ...(window.SVR_MULTIPLAYER_STATUS || {}), presenceClient: s };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return s;
}
function publish(){
  if (!socket || !connected || socket.readyState !== WebSocket.OPEN) return state({ publishSkipped: true });
  const msg = { type:"pose", roomId:ROOM_ID, playerId:playerId(), client:clientType(), pose:cameraPose(), ts:Date.now() };
  try { socket.send(JSON.stringify(msg)); return state({ lastSentType:"pose" }); }
  catch(e){ lastError = String(e?.message || e); return state({ publishFailed:true }); }
}
function connect(){
  const url = endpoint();
  if (!url){ return state({ status:"disabled-no-endpoint" }); }
  if (!/^wss:\/\//i.test(url)){ lastError = "Presence endpoint must use wss://"; return state({ status:"invalid-endpoint" }); }
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return state({ status:"already-started" });
  try{
    socket = new WebSocket(url);
    socket.onopen = ()=>{ connected = true; lastError = null; state({ status:"connected" }); publish(); };
    socket.onclose = ()=>{ connected = false; state({ status:"closed" }); };
    socket.onerror = ()=>{ lastError = "presence socket error"; state({ status:"error" }); };
    socket.onmessage = (event)=>{ lastMessageAt = Date.now(); try { window.SVR_REMOTE_PRESENCE_STATE = JSON.parse(event.data); } catch { window.SVR_REMOTE_PRESENCE_STATE = event.data; } state({ status:"message" }); };
    return state({ status:"connecting" });
  } catch(e){ lastError = String(e?.message || e); return state({ status:"connect-failed" }); }
}
function install(){
  state({ status:endpoint()?"ready-disabled-until-connect":"disabled-no-endpoint" });
  window.SVR_CONNECT_PRESENCE = connect;
  window.SVR_PUBLISH_PRESENCE = publish;
  const status = document.getElementById("status");
  if (status) status.textContent = `Presence client ready. ${LABEL}`;
}
install();
setInterval(()=>{ state({ heartbeat:true }); publish(); }, 1500);
[500,1500,3000,6000,10000].forEach((delay)=>setTimeout(install, delay));
