import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-218-SECOND-FLOOR-OVERLOOK-POLISH-LOCK";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const PURPLE = 0xa77cff;
const GREEN = 0x8dffb4;

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE218 = {
    build: LABEL,
    active: true,
    secondFloorOverlookPolish: true,
    clearWalkPath: true,
    standingMarks: true,
    keepsPhase217CityDepth: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function glow(color, opacity=.42){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}
function solid(color, opacity=1){
  return new THREE.MeshBasicMaterial({ color, transparent:opacity<1, opacity, depthWrite:opacity>=1 });
}
function addBox(root, name, sx, sy, sz, x, y, z, material, rotY=0){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  m.name = name; m.position.set(x,y,z); m.rotation.y = rotY; root.add(m); return m;
}
function addRing(root, name, x, z, color, label){
  const ring = new THREE.Mesh(new THREE.RingGeometry(.42,.56,72), glow(color,.58));
  ring.name = `${name}_STAND_RING`;
  ring.rotation.x = -Math.PI/2;
  ring.position.set(x,3.525,z);
  root.add(ring);
  const core = new THREE.Mesh(new THREE.CircleGeometry(.35,48), glow(color,.12));
  core.name = `${name}_STAND_CORE`;
  core.rotation.x = -Math.PI/2;
  core.position.set(x,3.522,z);
  root.add(core);
  const tex = makeSmallLabel(label,"LOOK OUT", color === GOLD ? "#ffd98a" : "#7ffcff");
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.05,.34), new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  sign.name = `${name}_FLOOR_LABEL`;
  sign.rotation.x = -Math.PI/2;
  sign.position.set(x,3.532,z+.66);
  root.add(sign);
}
function makeSmallLabel(a,b,color){
  const c=document.createElement("canvas"); c.width=512; c.height=180;
  const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(2,4,13,.80)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle=color; ctx.lineWidth=8; ctx.strokeRect(8,8,c.width-16,c.height-16);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#ffffff"; ctx.font="900 42px system-ui,Arial"; ctx.fillText(a,c.width/2,68);
  ctx.fillStyle=color; ctx.font="800 26px system-ui,Arial"; ctx.fillText(b,c.width/2,124);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makeArrowTexture(){
  const c=document.createElement("canvas"); c.width=640; c.height=220;
  const ctx=c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle="rgba(3,7,18,.70)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle="#7ffcff"; ctx.lineWidth=7; ctx.strokeRect(10,10,c.width-20,c.height-20);
  ctx.fillStyle="#ffd98a"; ctx.font="900 42px system-ui,Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("CITY VIEW",c.width/2,74);
  ctx.fillStyle="#7ffcff"; ctx.font="800 30px system-ui,Arial";
  ctx.fillText("clear path forward",c.width/2,130);
  ctx.beginPath();
  ctx.moveTo(c.width/2,188); ctx.lineTo(c.width/2-46,154); ctx.lineTo(c.width/2-14,154); ctx.lineTo(c.width/2-14,140); ctx.lineTo(c.width/2+14,140); ctx.lineTo(c.width/2+14,154); ctx.lineTo(c.width/2+46,154); ctx.closePath();
  ctx.fillStyle="#8dffb4"; ctx.fill();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function addBenches(root){
  const seatMat = solid(0x131725,.92);
  const trimMat = glow(GOLD,.38);
  [-8.8,8.8].forEach((x,idx)=>{
    const g = new THREE.Group();
    g.name = `PHASE218_OVERLOOK_SIDE_BENCH_${idx+1}`;
    g.position.set(x,3.52,-12.62);
    root.add(g);
    addBox(g,"BENCH_SEAT",2.1,.12,.38,0,.22,0,seatMat,0);
    addBox(g,"BENCH_BACK",2.1,.62,.10,0,.55,-.25,solid(0x0b0f1d,.88),0);
    addBox(g,"BENCH_GOLD_FRONT_TRIM",2.16,.035,.035,0,.30,.22,trimMat,0);
    addBox(g,"BENCH_LEFT_LEG",.10,.42,.10,-.82,.05,.06,solid(0x05070e),0);
    addBox(g,"BENCH_RIGHT_LEG",.10,.42,.10,.82,.05,.06,solid(0x05070e),0);
  });
}
function addPath(root){
  const pathMat = glow(GREEN,.13);
  for(let i=0;i<5;i++){
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.0,.28), pathMat.clone());
    p.name = `PHASE218_CLEAR_WALK_PATH_MARK_${i+1}`;
    p.rotation.x = -Math.PI/2;
    p.position.set(0,3.526,-5.6 - i*1.15);
    root.add(p);
  }
  const arrow = new THREE.Mesh(new THREE.PlaneGeometry(2.55,.88), new THREE.MeshBasicMaterial({map:makeArrowTexture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  arrow.name = "PHASE218_CITY_VIEW_PATH_ARROW";
  arrow.rotation.x = -Math.PI/2;
  arrow.position.set(0,3.535,-8.95);
  root.add(arrow);
}
function addGlassReflections(root){
  for(let i=0;i<7;i++){
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(.08,1.15 + (i%3)*.35), glow(i%2?CYAN:PURPLE,.12));
    streak.name = `PHASE218_OBSERVATION_GLASS_REFLECTION_${i+1}`;
    streak.rotation.z = .28;
    streak.position.set(-14.4 + i*4.8,4.9,-15.015);
    root.add(streak);
  }
}
function install(){
  stamp();
  const scene = window.__SVR_SCENE__;
  if(!scene || window.SVR_PHASE218_OVERLOOK_INSTALLED) return false;
  const old = scene.getObjectByName("PHASE218_SECOND_FLOOR_OVERLOOK_POLISH_ROOT");
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = "PHASE218_SECOND_FLOOR_OVERLOOK_POLISH_ROOT";
  scene.add(root);
  addPath(root);
  addRing(root,"PHASE218_LEFT_OVERLOOK","-3.2"*1,-10.45,CYAN,"STAND HERE");
  addRing(root,"PHASE218_RIGHT_OVERLOOK",3.2,-10.45,GOLD,"PHOTO SPOT");
  addBenches(root);
  addGlassReflections(root);
  addBox(root,"PHASE218_NON_BLOCKING_LOW_VIEW_RAIL",8.2,.045,.045,0,3.96,-10.95,glow(CYAN,.34));
  window.SVR_PHASE218_OVERLOOK_INSTALLED = true;
  return true;
}

stamp();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>100) clearInterval(timer); },200);
[800,1800,3500,7000].forEach(ms=>setTimeout(install,ms));
