import * as THREE from "three";

const LABEL = "PHASE-303-SCORPION-BUYIN-JOIN-FLOW-LOCK";
const ROOT_NAME = "PHASE303_SCORPION_BUYIN_JOIN_ROOT";
const ROUTE_TARGET = { x:12, y:0, z:-11.4 };
let selected = null;
let installed = false;
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function buyinNumber(text){
  if(!text || /free/i.test(text)) return 0;
  const n = Number(String(text).replace(/[^0-9]/g,""));
  return Number.isFinite(n) ? n : 0;
}
function textureFor(table){
  const c=document.createElement("canvas"); c.width=900; c.height=420;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#05040b"; ctx.fillRect(0,0,900,420);
  ctx.strokeStyle="#ff5b8c"; ctx.lineWidth=10; ctx.strokeRect(24,24,852,372);
  ctx.fillStyle="rgba(255,91,140,.13)"; ctx.fillRect(56,58,788,70);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#ffffff"; ctx.font="900 48px system-ui,Arial"; ctx.fillText("CONFIRM TABLE",450,92);
  ctx.fillStyle="#ffd98a"; ctx.font="900 42px system-ui,Arial"; ctx.fillText(table?.title || "SCORPION TABLE",450,172);
  ctx.fillStyle="#e8f4ff"; ctx.font="700 28px system-ui,Arial";
  ctx.fillText(`${table?.mode || "Practice"} • ${table?.seats || "open"}`,450,232);
  ctx.fillText(`Buy-in: ${table?.buyin || "free view"}`,450,282);
  ctx.fillStyle="#7ffcff"; ctx.font="900 25px system-ui,Arial";
  ctx.fillText("J JOIN / S SPECTATE / ESC CANCEL",450,344);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function clearPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return;
  const old=scene.getObjectByName(ROOT_NAME); if(old) old.parent?.remove(old);
}
function showPanel(table){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  clearPanel();
  const root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(12,0,-9.72); scene.add(root);
  const mat=new THREE.MeshBasicMaterial({map:textureFor(table),transparent:true,side:THREE.DoubleSide,depthWrite:false});
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.5),mat); panel.name="PHASE303_SCORPION_BUYIN_CONFIRM_PANEL"; panel.position.set(0,2.35,0); panel.renderOrder=260; root.add(panel);
  const glow=new THREE.Mesh(new THREE.RingGeometry(.58,.82,80),new THREE.MeshBasicMaterial({color:0xff5b8c,transparent:true,opacity:.52,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  glow.name="PHASE303_JOIN_CONFIRM_RING"; glow.rotation.x=-Math.PI/2; glow.position.set(0,.08,.92); root.add(glow);
  return true;
}
function emitJoin(action){
  if(!selected) return null;
  const payload={
    build:LABEL,
    action,
    tableKey:selected.key,
    title:selected.title,
    mode:selected.mode,
    buyin:selected.buyin,
    buyinChips:buyinNumber(selected.buyin),
    routeTarget:ROUTE_TARGET,
    target:"private-room",
    createdAt:new Date().toISOString()
  };
  window.SVR_PHASE303_LAST_SCORPION_JOIN_FLOW=payload;
  try{ window.dispatchEvent(new CustomEvent("svr-scorpion-table-join",{detail:payload})); }catch{}
  if(action==="join"){
    try{ window.dispatchEvent(new CustomEvent("svr-portal-selected",{detail:{key:"scorpion",label:selected.title,target:"private-room",source:"phase303-buyin-join"}})); }catch{}
  }
  status(`${selected.title} ${action === "join" ? "join confirmed" : "spectate selected"}`);
  clearPanel();
  return payload;
}
function onTable(event){
  selected = event.detail || null;
  if(selected){ showPanel(selected); status(`${selected.title} selected • confirm join`); }
}
function installKeys(){
  if(window.__SVR_PHASE303_KEYS__) return;
  window.__SVR_PHASE303_KEYS__=true;
  window.addEventListener("keydown",e=>{
    if(!selected) return;
    if(e.code==="KeyJ") emitJoin("join");
    if(e.code==="KeyS") emitJoin("spectate");
    if(e.code==="Escape"){ status("Scorpion table selection cancelled"); selected=null; clearPanel(); }
  });
}
function install(){
  if(installed) return true;
  installed = true;
  window.addEventListener("svr-scorpion-table-selected", onTable);
  installKeys();
  window.SVR_PHASE303_SCORPION_BUYIN_JOIN_FLOW_LOCK={
    build:LABEL,
    active:true,
    actions:"J Join / S Spectate / Escape Cancel",
    route:"private-room",
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
setInterval(install,3000);
