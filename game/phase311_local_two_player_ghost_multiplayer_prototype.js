import * as THREE from "three";

const LABEL = "PHASE-311-LOCAL-TWO-PLAYER-GHOST-MULTIPLAYER-PROTOTYPE";
const ROOT_NAME = "PHASE311_LOCAL_TWO_PLAYER_GHOST_ROOT";
let installed = false;
let root = null;
let localPill = null;
let ghostPill = null;
let lastBroadcast = 0;
const state = {
  build: LABEL,
  active: true,
  mode: "local-ghost-prototype",
  realNetworkConnected: false,
  cost: "free-local-only",
  players: {
    admin: { id:"admin-local", label:"ADMIN / OCULUS", x:0, y:1.3, z:0, device:"local camera" },
    androidGhost: { id:"android-ghost", label:"ANDROID GHOST", x:2, y:1.3, z:2, device:"simulated second player" }
  },
  siteTouched: false,
  publicRootTouched: false
};
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function labelTexture(text, sub){
  const c=document.createElement("canvas"); c.width=640; c.height=220;
  const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(3,4,10,.88)"; ctx.fillRect(0,0,640,220);
  ctx.strokeStyle="#7ffcff"; ctx.lineWidth=8; ctx.strokeRect(14,14,612,192);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 44px system-ui,Arial"; ctx.fillText(text,320,80);
  ctx.fillStyle="#ffd98a"; ctx.font="800 26px system-ui,Arial"; ctx.fillText(sub,320,145);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makePill(name, color, label, sub){
  const g=new THREE.Group(); g.name=name;
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.74,8,24),new THREE.MeshStandardMaterial({color,roughness:.44,metalness:.18,emissive:color,emissiveIntensity:.18}));
  body.name=`${name}_BODY`; body.position.set(0,.72,0); g.add(body);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.32,.44,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.name=`${name}_RING`; ring.rotation.x=-Math.PI/2; ring.position.set(0,.04,0); g.add(ring);
  const tag=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.46),new THREE.MeshBasicMaterial({map:labelTexture(label,sub),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  tag.name=`${name}_LABEL`; tag.position.set(0,1.52,0); tag.renderOrder=380; g.add(tag);
  return g;
}
function ensureRoot(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  root = scene.getObjectByName(ROOT_NAME);
  if(!root){ root=new THREE.Group(); root.name=ROOT_NAME; scene.add(root); }
  if(!localPill){ localPill=makePill("PHASE311_ADMIN_OCULUS_PILL",0x7ffcff,"ADMIN / OCULUS","live local camera"); root.add(localPill); }
  if(!ghostPill){ ghostPill=makePill("PHASE311_ANDROID_GHOST_PILL",0xffd98a,"ANDROID GHOST","simulated second player"); root.add(ghostPill); }
  return true;
}
function cameraPos(){
  const camera=window.__SVR_CAMERA__;
  if(!camera) return new THREE.Vector3(0,1.5,3);
  const v=new THREE.Vector3(); camera.getWorldPosition(v); return v;
}
function updateLabels(){
  const camera=window.__SVR_CAMERA__;
  if(!camera || !root) return;
  root.traverse(o=>{ if(o.isMesh && /_LABEL$/.test(o.name)) o.lookAt(camera.position); });
}
function tick(){
  if(!ensureRoot()) return;
  const now=performance.now();
  const cam=cameraPos();
  const admin={ x:cam.x, y:1.3, z:cam.z, device:"local camera" };
  const t=now*.00035;
  const ghost={ x:Math.cos(t)*4.2, y:1.3, z:-1.8+Math.sin(t)*3.1, device:"simulated Android" };
  localPill.position.set(admin.x,0,admin.z);
  ghostPill.position.set(ghost.x,0,ghost.z);
  state.players.admin = { ...state.players.admin, ...admin };
  state.players.androidGhost = { ...state.players.androidGhost, ...ghost };
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE311_LOCAL_TWO_PLAYER_GHOST_STATE = JSON.parse(JSON.stringify(state));
  window.SVR_LOCAL_GHOST_MULTIPLAYER_STATE = window.SVR_PHASE311_LOCAL_TWO_PLAYER_GHOST_STATE;
  updateLabels();
  if(now-lastBroadcast>1000){
    lastBroadcast=now;
    try{ window.dispatchEvent(new CustomEvent("svr-local-ghost-multiplayer-frame",{detail:window.SVR_PHASE311_LOCAL_TWO_PLAYER_GHOST_STATE})); }catch{}
  }
}
function install(){
  if(installed) return true;
  installed = true;
  window.SVR_PHASE311_SET_GHOST_POSITION = (x,z)=>{
    state.players.androidGhost.x=Number(x||0); state.players.androidGhost.z=Number(z||0);
    if(ghostPill) ghostPill.position.set(state.players.androidGhost.x,0,state.players.androidGhost.z);
    return window.SVR_PHASE311_LOCAL_TWO_PLAYER_GHOST_STATE;
  };
  window.SVR_PHASE311_LOCAL_TWO_PLAYER_GHOST_MULTIPLAYER_PROTOTYPE={
    build:LABEL,
    active:true,
    realNetworkConnected:false,
    freeLocalPrototype:true,
    players:["admin-local","android-ghost"],
    emits:"svr-local-ghost-multiplayer-frame",
    nextServerStep:"replace ghost transport with WebSocket presence server",
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  status("Local two-player ghost prototype armed");
  return true;
}
install();
setInterval(()=>{install(); tick();},250);
[500,1200,2500,5000].forEach(d=>setTimeout(tick,d));
