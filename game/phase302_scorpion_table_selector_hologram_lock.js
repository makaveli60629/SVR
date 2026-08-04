import * as THREE from "three";

const LABEL = "PHASE-302-SCORPION-TABLE-SELECTOR-HOLOGRAM-LOCK";
const ROOT_NAME = "PHASE302_SCORPION_TABLE_SELECTOR_ROOT";
const TABLES = [
  { key:"scorpion-main", title:"SCORPION MAIN", mode:"Practice Cash", seats:"1/6 open", buyin:"1,000 chips", x:-1.35, color:0xff5b8c },
  { key:"scorpion-vip", title:"SCORPION VIP", mode:"Private Table", seats:"code room", buyin:"5,000 chips", x:0, color:0xffd98a },
  { key:"scorpion-replay", title:"REPLAY TABLE", mode:"Spectate", seats:"highlights", buyin:"free view", x:1.35, color:0x7ffcff }
];
function makeCardTexture(table){
  const c=document.createElement("canvas"); c.width=640; c.height=360;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#05040a"; ctx.fillRect(0,0,640,360);
  ctx.strokeStyle=`#${table.color.toString(16).padStart(6,"0")}`; ctx.lineWidth=10; ctx.strokeRect(18,18,604,324);
  ctx.fillStyle="rgba(255,255,255,.06)"; ctx.fillRect(42,46,556,72);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 46px system-ui,Arial"; ctx.fillText(table.title,320,82);
  ctx.fillStyle=`#${table.color.toString(16).padStart(6,"0")}`; ctx.font="800 28px system-ui,Arial"; ctx.fillText(table.mode,320,166);
  ctx.fillStyle="#e8f4ff"; ctx.font="700 25px system-ui,Arial"; ctx.fillText(table.seats,320,222);
  ctx.fillText(table.buyin,320,272);
  ctx.fillStyle="#ffd98a"; ctx.font="900 22px system-ui,Arial"; ctx.fillText("SELECT / JOIN",320,320);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function matGlow(color, opacity){
  return new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
}
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function emitTable(table, source="selector"){
  const payload={
    build:LABEL,
    key:table.key,
    title:table.title,
    mode:table.mode,
    seats:table.seats,
    buyin:table.buyin,
    source,
    target:"private-room",
    routeKey:"scorpion",
    selectedAt:new Date().toISOString()
  };
  window.SVR_PHASE302_LAST_SCORPION_TABLE = payload;
  try{ window.dispatchEvent(new CustomEvent("svr-scorpion-table-selected",{detail:payload})); }catch{}
  try{ window.dispatchEvent(new CustomEvent("svr-portal-selected",{detail:{key:"scorpion",label:table.title,target:"private-room",source:"phase302-table-selector"}})); }catch{}
  status(`${table.title} selected • ${table.mode}`);
  return payload;
}
function addSelector(root, table){
  const g=new THREE.Group(); g.name=`PHASE302_TABLE_CARD_${table.key.toUpperCase().replace(/-/g,"_")}`; g.position.set(table.x,0,0); root.add(g);
  const card=new THREE.Mesh(new THREE.PlaneGeometry(1.22,.70), new THREE.MeshBasicMaterial({map:makeCardTexture(table),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  card.name=`${g.name}_READABLE_PANEL`; card.position.set(0,1.56,.02); card.renderOrder=220;
  card.userData.phase302TableSelector=true; card.userData.tableKey=table.key; card.userData.tableTitle=table.title; card.userData.tableTarget=table;
  g.add(card);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.43,.58,.08,64), matGlow(table.color,.36));
  base.name=`${g.name}_HOLO_BASE`; base.position.set(0,.52,0); base.userData.phase302TableSelector=true; base.userData.tableTarget=table; g.add(base);
  const beam=new THREE.Mesh(new THREE.ConeGeometry(.32,1.05,64,1,true), matGlow(table.color,.16));
  beam.name=`${g.name}_HOLO_BEAM`; beam.position.set(0,1.03,0); beam.userData.phase302TableSelector=true; beam.userData.tableTarget=table; g.add(beam);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.38,.50,72), matGlow(table.color,.55));
  ring.name=`${g.name}_SELECT_RING`; ring.rotation.x=-Math.PI/2; ring.position.set(0,.08,.78); ring.userData.phase302TableSelector=true; ring.userData.tableTarget=table; g.add(ring);
  return g;
}
function installPointer(scene,camera){
  if(window.__SVR_PHASE302_POINTER__) return;
  window.__SVR_PHASE302_POINTER__=true;
  const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
  window.addEventListener("pointerdown",e=>{
    const renderer=window.__SVR_RENDERER__, canvas=renderer?.domElement||document.querySelector("canvas");
    if(!canvas||!camera) return;
    const r=canvas.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(pointer,camera);
    const hit=ray.intersectObjects(scene.children,true).find(h=>h.object?.userData?.phase302TableSelector)?.object;
    if(hit?.userData?.tableTarget) emitTable(hit.userData.tableTarget,"pointer");
  },{passive:true});
}
function installKeys(){
  if(window.__SVR_PHASE302_KEYS__) return;
  window.__SVR_PHASE302_KEYS__=true;
  window.addEventListener("keydown",e=>{
    if(e.code==="Digit7") emitTable(TABLES[0],"keyboard");
    if(e.code==="Digit8") emitTable(TABLES[1],"keyboard");
    if(e.code==="Digit9") emitTable(TABLES[2],"keyboard");
  });
}
function apply(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  const camera=window.__SVR_CAMERA__||scene.userData?._camera||null;
  const old=scene.getObjectByName(ROOT_NAME); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(12,0,-11.15); root.rotation.y=0; scene.add(root);
  const titleTex=(()=>{const c=document.createElement("canvas"); c.width=900; c.height=220; const ctx=c.getContext("2d"); ctx.fillStyle="rgba(0,0,0,.76)"; ctx.fillRect(0,0,900,220); ctx.strokeStyle="#ff5b8c"; ctx.lineWidth=9; ctx.strokeRect(18,18,864,184); ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#fff"; ctx.font="900 54px system-ui,Arial"; ctx.fillText("SCORPION TABLE SELECTOR",450,78); ctx.fillStyle="#ffd98a"; ctx.font="800 28px system-ui,Arial"; ctx.fillText("7 Main • 8 VIP • 9 Replay",450,150); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;})();
  const title=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.92),new THREE.MeshBasicMaterial({map:titleTex,transparent:true,side:THREE.DoubleSide,depthWrite:false})); title.name="PHASE302_SCORPION_SELECTOR_TITLE"; title.position.set(0,2.45,-.04); title.renderOrder=230; root.add(title);
  TABLES.forEach(t=>addSelector(root,t));
  installPointer(scene,camera); installKeys();
  window.SVR_PHASE302_SCORPION_TABLE_SELECTOR_HOLOGRAM_LOCK={
    build:LABEL,
    active:true,
    tableCount:TABLES.length,
    keys:"7 Main / 8 VIP / 9 Replay",
    phase303Chained:true,
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
apply();
let tries=0;
const timer=setInterval(()=>{tries+=1; if(apply()||tries>120) clearInterval(timer);},250);
[600,1400,2800,5200,9000,14000].forEach(d=>setTimeout(apply,d));
import("./phase303_scorpion_buyin_join_flow_lock.js?v=phase303-buyin-join").catch(e=>{window.SVR_PHASE303_IMPORT_ERROR=String(e?.message||e);});
