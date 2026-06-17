import * as THREE from "three";

const LABEL = "PHASE-306-SCORPION-ACTION-HUD-LOCK";
const ROOT_NAME = "PHASE306_SCORPION_ACTION_HUD_ROOT";
const ACTIONS = [
  { key:"fold", label:"FOLD", code:"KeyF", color:0xff5b8c },
  { key:"check_call", label:"CHECK / CALL", code:"KeyC", color:0x7ffcff },
  { key:"raise", label:"RAISE", code:"KeyR", color:0xffd98a },
  { key:"all_in", label:"ALL-IN", code:"KeyA", color:0xffffff },
  { key:"next_hand", label:"NEXT HAND", code:"KeyH", color:0x8dffb4 }
];
let installed = false;
let activeSession = null;
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function makeTexture(session){
  const c=document.createElement("canvas"); c.width=1100; c.height=430;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#04050b"; ctx.fillRect(0,0,1100,430);
  ctx.strokeStyle="#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(24,24,1052,382);
  ctx.fillStyle="rgba(255,217,138,.12)"; ctx.fillRect(54,54,992,76);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 48px system-ui,Arial"; ctx.fillText("SCORPION PLAYER ACTIONS",550,92);
  ctx.fillStyle="#ffd98a"; ctx.font="800 32px system-ui,Arial"; ctx.fillText(session?.title || "Scorpion Table",550,166);
  ctx.fillStyle="#e8f4ff"; ctx.font="700 25px system-ui,Arial"; ctx.fillText("F Fold • C Check/Call • R Raise • A All-In • H Next Hand",550,232);
  ctx.fillStyle="#7ffcff"; ctx.font="700 24px system-ui,Arial"; ctx.fillText("Play-money demo controls • no real-money wager",550,286);
  ctx.fillStyle="#ffffff"; ctx.font="800 22px system-ui,Arial"; ctx.fillText("Pointer/touch pads are armed for later watch + VR ray routing",550,342);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function clearHud(){
  const scene=window.__SVR_SCENE__; if(!scene) return;
  const old=scene.getObjectByName(ROOT_NAME); if(old) old.parent?.remove(old);
}
function emitAction(action, source="keyboard"){
  const payload={
    build:LABEL,
    action:action.key,
    label:action.label,
    source,
    tableKey:activeSession?.tableKey || "scorpion-main",
    title:activeSession?.title || "Scorpion Table",
    seatId:activeSession?.seatId || "SOUTH_PLAYER",
    playMoneyOnly:true,
    createdAt:new Date().toISOString()
  };
  window.SVR_PHASE306_LAST_SCORPION_ACTION = payload;
  try{ window.dispatchEvent(new CustomEvent("svr-scorpion-player-action",{detail:payload})); }catch{}
  try{ window.dispatchEvent(new CustomEvent("svr-poker-player-action",{detail:payload})); }catch{}
  status(`${payload.title}: ${action.label}`);
  showHud(activeSession);
  return payload;
}
function showHud(session){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  clearHud();
  const root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(12,0,-7.62); scene.add(root);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(4.25,1.66),new THREE.MeshBasicMaterial({map:makeTexture(session),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE306_SCORPION_ACTION_PANEL"; panel.position.set(0,2.54,0); panel.renderOrder=290; root.add(panel);
  ACTIONS.forEach((a,i)=>{
    const x=-1.72+i*.86;
    const pad=new THREE.Mesh(new THREE.RingGeometry(.22,.34,48),new THREE.MeshBasicMaterial({color:a.color,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
    pad.name=`PHASE306_ACTION_PAD_${a.key.toUpperCase()}`; pad.rotation.x=-Math.PI/2; pad.position.set(x,.08,1.08);
    pad.userData.phase306Action=true; pad.userData.actionKey=a.key; root.add(pad);
  });
  return true;
}
function installPointer(scene,camera){
  if(window.__SVR_PHASE306_POINTER__) return;
  window.__SVR_PHASE306_POINTER__=true;
  const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
  window.addEventListener("pointerdown",e=>{
    if(!activeSession) return;
    const renderer=window.__SVR_RENDERER__, canvas=renderer?.domElement||document.querySelector("canvas");
    if(!canvas||!camera) return;
    const r=canvas.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(pointer,camera);
    const hit=ray.intersectObjects(scene.children,true).find(h=>h.object?.userData?.phase306Action)?.object;
    const action=ACTIONS.find(a=>a.key===hit?.userData?.actionKey);
    if(action) emitAction(action,"pointer");
  },{passive:true});
}
function installKeys(){
  if(window.__SVR_PHASE306_KEYS__) return;
  window.__SVR_PHASE306_KEYS__=true;
  window.addEventListener("keydown",e=>{
    if(!activeSession) return;
    const action=ACTIONS.find(a=>a.code===e.code);
    if(action) emitAction(action,"keyboard");
  });
}
function activate(detail){
  activeSession = detail || window.SVR_PLAYER_SCORPION_TABLE_SESSION || { title:"Scorpion Table", tableKey:"scorpion-main", seatId:"SOUTH_PLAYER" };
  showHud(activeSession);
  status("Scorpion action HUD armed");
  return activeSession;
}
function install(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  const camera=window.__SVR_CAMERA__||scene.userData?._camera||null;
  if(!installed){
    installed=true;
    window.addEventListener("svr-scorpion-seat-snap-complete", e=>activate(e.detail));
    window.addEventListener("svr-scorpion-seat-reserved", e=>activate(e.detail));
    installKeys();
  }
  installPointer(scene,camera);
  window.SVR_PHASE306_SCORPION_ACTION_HUD_LOCK={
    build:LABEL,
    active:true,
    actions:ACTIONS.map(a=>a.key),
    listensFor:"svr-scorpion-seat-snap-complete",
    emits:"svr-scorpion-player-action / svr-poker-player-action",
    phase307Chained:true,
    playMoneyOnly:true,
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
setInterval(()=>{install(); if(activeSession) showHud(activeSession);},5000);
import("./phase307_scorpion_action_state_feedback_lock.js?v=phase307-action-state").catch(e=>{window.SVR_PHASE307_IMPORT_ERROR=String(e?.message||e);});
