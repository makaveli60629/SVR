import * as THREE from "three";

const LABEL = "PHASE-239-ROMAN-CANOPY-PILLAR-SMOOTHING-LOCK";
const ROOT = "PHASE239_ROMAN_CANOPY_PILLAR_SMOOTHING_ROOT";
const OLD_ROOTS = ["PHASE238_ROMAN_CANOPY_LOBBY_ARCH_ROOT", "PHASE239_ROMAN_CANOPY_PILLAR_SMOOTHING_ROOT"];
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const STONE = 0xe1d7bc;
const SHADOW = 0x12131b;

function stamp(){
  window.SVR_PHASE239 = { build: LABEL, active: true, romanCanopy: true, chuppahStyle: true, smootherPillars: true, siteTouched: false, checkedAt: new Date().toISOString() };
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, { build: LABEL, phase239: true, active: true });
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
}

function ui(){
  const label = document.getElementById("svr-phase-label");
  if(label) label.textContent = "PHASE 239 ACTIVE • ROMAN CANOPY SMOOTH LOCK";
  const status = document.getElementById("status");
  if(status) status.textContent = "Phase 239 Roman canopy and smooth pillars loaded";
}

function standard(color, rough=.55, metal=.08, opacity=1){
  return new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:metal, transparent:opacity<1, opacity, side:THREE.DoubleSide });
}
function basic(color, opacity=.42){
  return new THREE.MeshBasicMaterial({ color, transparent:opacity<1, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function cyl(parent,name,r,h,x,y,z,mat,rad=40){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,rad),mat); m.name=name; m.position.set(x,y,z); parent.add(m); return m;
}
function box(parent,name,sx,sy,sz,x,y,z,mat){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat); m.name=name; m.position.set(x,y,z); parent.add(m); return m;
}
function plane(parent,name,sx,sz,x,y,z,mat){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sx,sz),mat); m.name=name; m.rotation.x=-Math.PI/2; m.position.set(x,y,z); parent.add(m); return m;
}
function torus(parent,name,r,tube,x,y,z,mat,rx=Math.PI/2){
  const m = new THREE.Mesh(new THREE.TorusGeometry(r,tube,10,52),mat); m.name=name; m.position.set(x,y,z); m.rotation.x=rx; parent.add(m); return m;
}
function arch(parent,name,a,b,y,rise,mat,thick=.035){
  const mid = new THREE.Vector3((a.x+b.x)/2, y+rise, (a.z+b.z)/2);
  const c = new THREE.CatmullRomCurve3([new THREE.Vector3(a.x,y,a.z), new THREE.Vector3((a.x+mid.x)/2,y+rise*.72,(a.z+mid.z)/2), mid, new THREE.Vector3((b.x+mid.x)/2,y+rise*.72,(b.z+mid.z)/2), new THREE.Vector3(b.x,y,b.z)]);
  const m = new THREE.Mesh(new THREE.TubeGeometry(c,36,thick,10,false),mat); m.name=name; parent.add(m); return m;
}

function pillar(parent,name,x,z,h=3.25,r=.145){
  const stone = standard(STONE,.48,.05,.97);
  const gold = standard(GOLD,.32,.35,.98);
  const cyan = basic(CYAN,.16);
  cyl(parent,`${name}_LOWER_ROUND_BASE`,r*2.0,.12,x,.06,z,gold,40);
  cyl(parent,`${name}_UPPER_STONE_BASE`,r*1.55,.16,x,.20,z,stone,40);
  cyl(parent,`${name}_SMOOTH_SHAFT`,r,h,x,.30+h/2,z,stone,48);
  torus(parent,`${name}_BASE_GOLD_RING`,r*1.16,.015,x,.39,z,gold);
  torus(parent,`${name}_CAP_GOLD_RING`,r*1.18,.015,x,.28+h,z,gold);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const flute=box(parent,`${name}_SOFT_CYAN_FLUTE_${i}`,.009,h*.82,.014,x+Math.sin(a)*(r+.012),.45+h/2,z+Math.cos(a)*(r+.012),cyan);
    flute.rotation.y=a;
  }
  cyl(parent,`${name}_ROUND_CAPITAL`,r*1.45,.12,x,.36+h,z,stone,40);
  box(parent,`${name}_SQUARE_GOLD_ABACUS`,r*3.9,.10,r*3.9,x,.47+h,z,gold);
  return {x,z,yTop:.52+h};
}

function canopy(root){
  const gold = standard(GOLD,.32,.38,.98);
  const dark = standard(SHADOW,.7,.05,.86);
  const soft = basic(GOLD,.24);
  const cyan = basic(CYAN,.28);
  const tableZ = -2.0, tableX = 0, w = 6.6, d = 5.25;
  const pts = {
    fl:{x:tableX-w/2,z:tableZ+d/2}, fr:{x:tableX+w/2,z:tableZ+d/2},
    bl:{x:tableX-w/2,z:tableZ-d/2}, br:{x:tableX+w/2,z:tableZ-d/2}
  };
  Object.entries(pts).forEach(([k,p])=>pillar(root,`PHASE239_CENTER_CHUPPAH_${k.toUpperCase()}_PILLAR`,p.x,p.z,3.10,.15));
  box(root,"PHASE239_CHUPPAH_FRONT_GOLD_BEAM",w+.55,.13,.18,tableX,3.70,pts.fl.z,gold);
  box(root,"PHASE239_CHUPPAH_BACK_GOLD_BEAM",w+.55,.13,.18,tableX,3.70,pts.bl.z,gold);
  box(root,"PHASE239_CHUPPAH_LEFT_GOLD_BEAM",.18,.13,d+.55,pts.fl.x,3.70,tableZ,gold);
  box(root,"PHASE239_CHUPPAH_RIGHT_GOLD_BEAM",.18,.13,d+.55,pts.fr.x,3.70,tableZ,gold);
  arch(root,"PHASE239_CHUPPAH_FRONT_SMOOTH_ROMAN_ARCH",pts.fl,pts.fr,2.55,1.18,gold,.04);
  arch(root,"PHASE239_CHUPPAH_BACK_SMOOTH_ROMAN_ARCH",pts.bl,pts.br,2.55,1.18,gold,.04);
  arch(root,"PHASE239_CHUPPAH_LEFT_SMOOTH_ROMAN_ARCH",pts.fl,pts.bl,2.55,1.02,gold,.035);
  arch(root,"PHASE239_CHUPPAH_RIGHT_SMOOTH_ROMAN_ARCH",pts.fr,pts.br,2.55,1.02,gold,.035);
  plane(root,"PHASE239_CHUPPAH_DARK_SOFT_CANOPY_CLOTH",w+.35,d+.35,tableX,3.84,tableZ,dark);
  plane(root,"PHASE239_CHUPPAH_WARM_UNDER_LIGHT",w-1.0,d-1.0,tableX,3.49,tableZ,soft);
  box(root,"PHASE239_CHUPPAH_FRONT_CYAN_EDGE",w+.42,.035,.04,tableX,3.47,pts.fl.z+.04,cyan);
  box(root,"PHASE239_CHUPPAH_BACK_CYAN_EDGE",w+.42,.035,.04,tableX,3.47,pts.bl.z-.04,cyan);
  box(root,"PHASE239_CHUPPAH_LEFT_CYAN_EDGE",.04,.035,d+.42,pts.fl.x-.04,3.47,tableZ,cyan);
  box(root,"PHASE239_CHUPPAH_RIGHT_CYAN_EDGE",.04,.035,d+.42,pts.fr.x+.04,3.47,tableZ,cyan);
}

function arcades(root){
  const gold = standard(GOLD,.34,.34,.94);
  const cyan = basic(CYAN,.22);
  [-11,-7,-3,1,5,9].forEach((x,i)=>{
    const a=pillar(root,`PHASE239_REAR_ARCADE_${i}_LEFT`,x-1.35,-12.45,2.45,.105);
    const b=pillar(root,`PHASE239_REAR_ARCADE_${i}_RIGHT`,x+1.35,-12.45,2.45,.105);
    arch(root,`PHASE239_REAR_ARCADE_${i}_SMOOTH_ARCH`,a,b,2.05,.78,gold,.03);
    box(root,`PHASE239_REAR_ARCADE_${i}_LOW_CYAN_RAIL`,2.45,.04,.035,x,1.12,-12.52,cyan);
  });
  [-13.75,13.75].forEach((x,side)=>[-8.8,-5.6,-2.4,.8,4.0].forEach((z,i)=>{
    const a=pillar(root,`PHASE239_${side?"RIGHT":"LEFT"}_ARCADE_${i}_A`,x,z-1.0,2.36,.10);
    const b=pillar(root,`PHASE239_${side?"RIGHT":"LEFT"}_ARCADE_${i}_B`,x,z+1.0,2.36,.10);
    arch(root,`PHASE239_${side?"RIGHT":"LEFT"}_ARCADE_${i}_SMOOTH_ARCH`,a,b,1.98,.68,gold,.028);
  }));
  [[-13.55,6.6],[13.55,6.6],[-13.55,-12.25],[13.55,-12.25]].forEach(([x,z],i)=>{
    pillar(root,`PHASE239_CORNER_ROMAN_PILLAR_${i}`,x,z,3.35,.19);
    torus(root,`PHASE239_CORNER_PILLAR_GOLD_HALO_${i}`,.36,.015,x,2.58,z,gold);
  });
  box(root,"PHASE239_CONTINUOUS_REAR_GOLD_CORNICE",27.2,.08,.08,0,3.55,-12.58,gold);
  box(root,"PHASE239_CONTINUOUS_REAR_CYAN_GLOW",27.2,.035,.04,0,3.72,-12.48,cyan);
  box(root,"PHASE239_LEFT_GOLD_CORNICE",.08,.08,17.6,-13.92,3.50,-3.0,gold);
  box(root,"PHASE239_RIGHT_GOLD_CORNICE",.08,.08,17.6,13.92,3.50,-3.0,gold);
}

function floorPlan(root){
  plane(root,"PHASE239_CANOPY_MARBLE_GLOW_OVAL",9.0,6.8,0,.08,-2.0,basic(GOLD,.16));
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.05,3.12,128), basic(GOLD,.62));
  ring.name = "PHASE239_CENTER_CANOPY_TABLE_RING"; ring.rotation.x=-Math.PI/2; ring.position.set(0,.115,-2.0); root.add(ring);
  box(root,"PHASE239_CENTER_AXIS_FRONT_BACK",.035,.025,7.0,0,.13,-2.0,basic(CYAN,.16));
  box(root,"PHASE239_CENTER_AXIS_LEFT_RIGHT",8.0,.025,.035,0,.13,-2.0,basic(CYAN,.16));
}

function build(scene){
  OLD_ROOTS.forEach(n=>{ const o=scene.getObjectByName(n); if(o) o.parent?.remove(o); });
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  floorPlan(root); canopy(root); arcades(root);
  window.SVR_PHASE239_GEOMETRY = { build: LABEL, romanChuppahCanopy:true, smoothCornerPillars:true, lobbyArcades:true, checkedAt:new Date().toISOString() };
}

function install(){
  stamp(); ui();
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  build(scene);
  return true;
}

stamp(); ui();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>220) clearInterval(timer); },160);
setTimeout(install,1200);
setTimeout(install,3600);
