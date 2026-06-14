import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-222-MOON-SKY-ANCHOR-FIX-LOCK";
const SKY_POS = new THREE.Vector3(-8, 24, -38);

function isUpdate31HardLocked(){
  return window.SVR_CURRENT_UPDATE === "3.1" || String(window.SVR_CURRENT_BUILD || "").startsWith("UPDATE-3.1") || window.SVR_UPDATE31?.active;
}

function stamp(){
  if (isUpdate31HardLocked()){
    window.SVR_PHASE222 = Object.assign(window.SVR_PHASE222 || {}, { active:true, bypassedByUpdate31:true, oldMoonCreationDisabled:true });
    return;
  }
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE222 = {
    build: LABEL,
    active: true,
    moonSkyOnly: true,
    floorDomeRemoved: true,
    preservesMars: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function makeMoonTexture(){
  const c = document.createElement("canvas");
  c.width = 1536; c.height = 768;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#d6d8da"); g.addColorStop(.32,"#a8adb3"); g.addColorStop(.55,"#59606a"); g.addColorStop(.72,"#c2c4c6"); g.addColorStop(1,"#666b73");
  ctx.fillStyle = g; ctx.fillRect(0,0,c.width,c.height);
  function mare(x,y,rx,ry,rot,a){ ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2); ctx.fillStyle=`rgba(28,32,39,${a})`; ctx.fill(); ctx.restore(); }
  [[780,310,270,128,-.16,.36],[1070,355,210,95,.08,.33],[430,445,230,115,.10,.27],[1135,215,150,68,.04,.30],[620,175,150,72,-.38,.20]].forEach(v=>mare(...v));
  function crater(x,y,r,a){
    const rg = ctx.createRadialGradient(x-r*.22,y-r*.24,r*.05,x,y,r);
    rg.addColorStop(0,`rgba(250,252,255,${.25*a})`);
    rg.addColorStop(.45,`rgba(120,124,132,${.12*a})`);
    rg.addColorStop(.66,`rgba(16,18,24,${.38*a})`);
    rg.addColorStop(.84,`rgba(230,234,238,${.22*a})`);
    rg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  [[160,405,64,1.2],[278,500,42,1],[520,455,56,1],[680,522,34,.9],[1122,386,88,1.15],[1325,430,50,1],[1250,575,38,.95],[380,120,33,.9],[890,165,60,1],[1048,190,40,1]].forEach(v=>crater(...v));
  for(let i=0;i<420;i++){ const x=Math.random()*c.width,y=Math.random()*c.height,r=2+Math.pow(Math.random(),2.2)*28; crater(x,y,r,.25+Math.random()*.48); }
  ctx.fillStyle="rgba(255,255,255,.075)"; for(let i=0;i<800;i++) ctx.fillRect(Math.random()*c.width,Math.random()*c.height,1,1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function purgeFloorMoons(scene){
  const remove = [];
  scene.traverse(o=>{
    const n = String(o.name || "");
    if (/MOON/i.test(n) && !/PHASE222_SKY_ANCHORED_CRATER_MOON|PHASE222_MOON_HALO/i.test(n)) remove.push(o);
  });
  remove.forEach(o=>o.parent?.remove(o));
}

function createMoon(scene){
  let moon = scene.getObjectByName("PHASE222_SKY_ANCHORED_CRATER_MOON");
  if (!moon){
    moon = new THREE.Mesh(new THREE.SphereGeometry(5.1,96,64), new THREE.MeshStandardMaterial({
      map: makeMoonTexture(), roughness:.9, metalness:0, emissive:0x20283a, emissiveIntensity:.31
    }));
    moon.name = "PHASE222_SKY_ANCHORED_CRATER_MOON";
    scene.add(moon);
  }
  moon.position.copy(SKY_POS);
  moon.visible = true;
  return moon;
}

function install(){
  stamp();
  if (isUpdate31HardLocked()) return true;
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  purgeFloorMoons(scene);
  createMoon(scene);
  window.SVR_PHASE222_MOON_SKY_ANCHOR_INSTALLED = true;
  return true;
}

stamp();
let tries = 0;
const timer = setInterval(()=>{ tries++; if (install() || tries > 120) clearInterval(timer); }, 200);
[350,900,1800,3500,7000,12000].forEach(ms=>setTimeout(install,ms));
