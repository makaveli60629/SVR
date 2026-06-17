import * as THREE from "three";

const LABEL = "PHASE-312-FREE-MANUAL-PRESENCE-TRANSPORT-LOCK";
const ROOT_NAME = "PHASE312_FREE_MANUAL_PRESENCE_ROOT";
let installed = false;
let pc = null;
let dc = null;
let sendTimer = null;
const state = {
  build: LABEL,
  active: true,
  transport: "manual-webrtc-datachannel",
  cost: "free-no-server",
  role: "unpaired",
  connected: false,
  realServerConnected: false,
  offerReady: false,
  answerReady: false,
  remoteFrameCount: 0,
  lastError: "none",
  siteTouched: false,
  publicRootTouched: false
};
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function enc(obj){ return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
function dec(str){ return JSON.parse(decodeURIComponent(escape(atob(String(str||"").trim())))); }
function cameraFrame(){
  const s = window.SVR_PHASE311_LOCAL_TWO_PLAYER_GHOST_STATE;
  const p = s?.players?.admin || {x:0,y:1.3,z:0};
  return { build:LABEL, type:"presence", id:state.role||"peer", x:Number(p.x||0), y:Number(p.y||1.3), z:Number(p.z||0), at:Date.now() };
}
function applyRemote(frame){
  if(!frame || frame.type!=="presence") return;
  state.remoteFrameCount += 1;
  state.lastRemote = { id:frame.id, x:frame.x, y:frame.y, z:frame.z, at:frame.at };
  window.SVR_PHASE312_REMOTE_PLAYER_FRAME = state.lastRemote;
  try{ window.SVR_PHASE311_SET_GHOST_POSITION?.(frame.x, frame.z); }catch{}
  try{ window.dispatchEvent(new CustomEvent("svr-free-presence-frame",{detail:state.lastRemote})); }catch{}
  syncState();
}
function syncState(){
  state.connected = dc?.readyState === "open";
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE312_FREE_MANUAL_PRESENCE_TRANSPORT_STATE = JSON.parse(JSON.stringify(state));
  showPanel();
}
function sendFrame(){
  try{ if(dc?.readyState==="open") dc.send(JSON.stringify(cameraFrame())); }catch(e){ state.lastError=String(e?.message||e); }
  syncState();
}
function wireChannel(ch){
  dc = ch;
  dc.onopen = ()=>{ state.connected=true; startSending(); status("Manual free presence connected"); syncState(); };
  dc.onclose = ()=>{ state.connected=false; stopSending(); syncState(); };
  dc.onerror = e=>{ state.lastError=String(e?.message||"datachannel error"); syncState(); };
  dc.onmessage = e=>{ try{ applyRemote(JSON.parse(e.data)); }catch(err){ state.lastError=String(err?.message||err); syncState(); } };
}
function makePeer(){
  const peer = new RTCPeerConnection({ iceServers:[{ urls:"stun:stun.l.google.com:19302" }] });
  peer.ondatachannel = e=>wireChannel(e.channel);
  peer.onconnectionstatechange = ()=>{ state.connectionState=peer.connectionState; syncState(); };
  return peer;
}
function waitIce(peer){
  return new Promise(resolve=>{
    if(peer.iceGatheringState === "complete") return resolve();
    const done=()=>{ peer.removeEventListener("icegatheringstatechange",check); resolve(); };
    const check=()=>{ if(peer.iceGatheringState === "complete") done(); };
    peer.addEventListener("icegatheringstatechange",check);
    setTimeout(done,3200);
  });
}
function startSending(){ stopSending(); sendTimer=setInterval(sendFrame,500); sendFrame(); }
function stopSending(){ if(sendTimer) clearInterval(sendTimer); sendTimer=null; }
async function createOffer(){
  if(typeof RTCPeerConnection === "undefined") throw new Error("RTCPeerConnection unavailable on this browser");
  state.role = "admin-offer";
  pc = makePeer();
  wireChannel(pc.createDataChannel("svr-presence"));
  await pc.setLocalDescription(await pc.createOffer());
  await waitIce(pc);
  state.offerReady=true;
  syncState();
  return enc(pc.localDescription);
}
async function acceptOffer(offerCode){
  if(typeof RTCPeerConnection === "undefined") throw new Error("RTCPeerConnection unavailable on this browser");
  state.role = "android-answer";
  pc = makePeer();
  await pc.setRemoteDescription(dec(offerCode));
  await pc.setLocalDescription(await pc.createAnswer());
  await waitIce(pc);
  state.answerReady=true;
  syncState();
  return enc(pc.localDescription);
}
async function acceptAnswer(answerCode){
  if(!pc) throw new Error("Create offer first before accepting answer");
  await pc.setRemoteDescription(dec(answerCode));
  state.answerAccepted=true;
  syncState();
  return true;
}
function disconnect(){
  stopSending();
  try{ dc?.close(); }catch{}
  try{ pc?.close(); }catch{}
  pc=null; dc=null;
  state.connected=false; state.role="unpaired"; state.lastError="none";
  syncState();
  return true;
}
function texture(){
  const c=document.createElement("canvas"); c.width=1040; c.height=430;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03040a"; ctx.fillRect(0,0,1040,430);
  ctx.strokeStyle=state.connected?"#8dffb4":"#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(24,24,992,382);
  ctx.fillStyle="rgba(127,252,255,.10)"; ctx.fillRect(54,54,932,74);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 42px system-ui,Arial"; ctx.fillText("FREE MANUAL PRESENCE TRANSPORT",520,90);
  ctx.fillStyle=state.connected?"#8dffb4":"#ffd98a"; ctx.font="900 30px system-ui,Arial"; ctx.fillText(state.connected?"CONNECTED":"MANUAL PAIRING READY",520,154);
  ctx.fillStyle="#e8f4ff"; ctx.font="700 24px system-ui,Arial"; ctx.fillText(`Role: ${state.role} • Remote frames: ${state.remoteFrameCount}`,520,214);
  ctx.fillStyle="#7ffcff"; ctx.font="700 22px system-ui,Arial"; ctx.fillText("No server fee: copy offer/answer codes between Oculus and Android",520,274);
  ctx.fillStyle="#ffffff"; ctx.font="700 20px system-ui,Arial"; ctx.fillText("Globals: CREATE_OFFER / ACCEPT_OFFER(code) / ACCEPT_ANSWER(code)",520,332);
  ctx.fillStyle="#ff8cab"; ctx.font="700 18px system-ui,Arial"; ctx.fillText(`Error: ${state.lastError}`,520,382);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function showPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  let root=scene.getObjectByName(ROOT_NAME);
  if(root) root.parent?.remove(root);
  root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(-12,0,-2.8); scene.add(root);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.85,1.6),new THREE.MeshBasicMaterial({map:texture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE312_FREE_MANUAL_PRESENCE_PANEL"; panel.position.set(0,2.45,0); panel.renderOrder=390; root.add(panel);
  return true;
}
function install(){
  if(installed) return true;
  installed=true;
  window.SVR_PHASE312_CREATE_OFFER = createOffer;
  window.SVR_PHASE312_ACCEPT_OFFER = acceptOffer;
  window.SVR_PHASE312_ACCEPT_ANSWER = acceptAnswer;
  window.SVR_PHASE312_DISCONNECT = disconnect;
  window.SVR_PHASE312_FREE_MANUAL_PRESENCE_TRANSPORT_LOCK={
    build:LABEL,
    active:true,
    realServerConnected:false,
    freeManualPairing:true,
    functions:["SVR_PHASE312_CREATE_OFFER","SVR_PHASE312_ACCEPT_OFFER","SVR_PHASE312_ACCEPT_ANSWER","SVR_PHASE312_DISCONNECT"],
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  syncState();
  return true;
}
install();
setInterval(()=>{install(); syncState();},5000);
