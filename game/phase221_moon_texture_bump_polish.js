import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-221-MOON-TEXTURE-BUMP-POLISH-LOCK";

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE221 = {
    build: LABEL,
    active: true,
    uploadedMoonTextureReference: true,
    craterDiffusePolish: true,
    craterBumpPolish: true,
    keepsMarsOrbit: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function makeMoonDiffuseTexture(){
  const c = document.createElement("canvas");
  c.width = 1536;
  c.height = 768;
  const ctx = c.getContext("2d");
  const base = ctx.createLinearGradient(0,0,c.width,c.height);
  base.addColorStop(0,"#cfd1d2");
  base.addColorStop(.36,"#9da1a4");
  base.addColorStop(.54,"#60666f");
  base.addColorStop(.74,"#b8bbbd");
  base.addColorStop(1,"#62666c");
  ctx.fillStyle = base;
  ctx.fillRect(0,0,c.width,c.height);

  const maria = [
    [760,300,250,130,-.18,"rgba(40,45,52,.42)"],
    [1030,350,210,92,.10,"rgba(35,38,44,.38)"],
    [1130,214,150,70,.06,"rgba(30,33,40,.36)"],
    [430,430,220,115,.12,"rgba(78,82,88,.32)"],
    [620,178,150,75,-.38,"rgba(80,84,90,.25)"]
  ];
  maria.forEach(([x,y,rx,ry,rot,col])=>{
    ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2); ctx.fillStyle=col; ctx.fill(); ctx.restore();
  });

  function crater(x,y,r,alpha=1){
    const g = ctx.createRadialGradient(x-r*.22,y-r*.28,r*.08,x,y,r);
    g.addColorStop(0,`rgba(245,247,250,${.26*alpha})`);
    g.addColorStop(.42,`rgba(120,124,130,${.12*alpha})`);
    g.addColorStop(.66,`rgba(25,28,34,${.38*alpha})`);
    g.addColorStop(.83,`rgba(225,228,230,${.20*alpha})`);
    g.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  const seeds = [
    [160,405,64,1.2],[278,500,42,1.0],[520,455,56,1.0],[680,522,34,.9],[1122,386,88,1.15],[1325,430,50,1.0],
    [1250,575,38,.95],[380,120,33,.9],[890,165,60,1.0],[1048,190,40,1.0],[250,220,22,.8],[740,620,28,.8]
  ];
  seeds.forEach(v=>crater(...v));
  for(let i=0;i<360;i++){
    const cluster = i%3;
    const x = cluster===0 ? Math.random()*560 : cluster===1 ? 960+Math.random()*520 : Math.random()*c.width;
    const y = cluster===0 ? 95+Math.random()*560 : cluster===1 ? 70+Math.random()*575 : Math.random()*c.height;
    const r = 3 + Math.pow(Math.random(),2.2)*31;
    crater(x,y,r,.28+Math.random()*.42);
  }
  ctx.fillStyle="rgba(255,255,255,.08)";
  for(let i=0;i<900;i++) ctx.fillRect(Math.random()*c.width,Math.random()*c.height,1,1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeMoonBumpTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d");
  const base = ctx.createLinearGradient(0,0,c.width,c.height);
  base.addColorStop(0,"#b8b8b8");
  base.addColorStop(.5,"#707070");
  base.addColorStop(1,"#9a9a9a");
  ctx.fillStyle=base; ctx.fillRect(0,0,c.width,c.height);
  function bumpCrater(x,y,r){
    const g=ctx.createRadialGradient(x-r*.16,y-r*.2,r*.05,x,y,r);
    g.addColorStop(0,"rgba(255,255,255,.36)");
    g.addColorStop(.50,"rgba(124,124,124,.20)");
    g.addColorStop(.66,"rgba(20,20,20,.42)");
    g.addColorStop(.86,"rgba(245,245,245,.30)");
    g.addColorStop(1,"rgba(128,128,128,0)");
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  for(let i=0;i<520;i++){
    const x=Math.random()*c.width, y=Math.random()*c.height;
    const r=2+Math.pow(Math.random(),2.4)*25;
    bumpCrater(x,y,r);
  }
  [[112,280,50],[335,320,64],[755,260,74],[895,350,42],[600,145,48]].forEach(v=>bumpCrater(...v));
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

function applyMoonTexture(moon){
  if (!moon || moon.userData.phase221MoonTextureApplied) return;
  moon.material = new THREE.MeshStandardMaterial({
    map: makeMoonDiffuseTexture(),
    bumpMap: makeMoonBumpTexture(),
    bumpScale: 0.48,
    roughness: 0.9,
    metalness: 0,
    emissive: 0x20283a,
    emissiveIntensity: 0.30
  });
  moon.name = "PHASE221_FINAL_CRATER_TEXTURED_BUMP_MOON";
  moon.userData.phase221MoonTextureApplied = true;
  moon.renderOrder = 4;
}

function addMoonHalo(scene, moon){
  let halo = scene.getObjectByName("PHASE221_MOON_SOFT_RIM_HALO");
  if (!halo){
    halo = new THREE.Mesh(
      new THREE.SphereGeometry(5.88,64,32),
      new THREE.MeshBasicMaterial({ color:0xe5edff, transparent:true, opacity:.08, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.BackSide })
    );
    halo.name = "PHASE221_MOON_SOFT_RIM_HALO";
    scene.add(halo);
  }
  halo.position.copy(moon.position);
  halo.rotation.copy(moon.rotation);
  return halo;
}

function install(){
  stamp();
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  const moon = scene.getObjectByName("PHASE221_FINAL_CRATER_TEXTURED_BUMP_MOON") || scene.getObjectByName("PHASE215_FINAL_SINGLE_BIG_TEXTURED_MOON");
  if (!moon) return false;
  applyMoonTexture(moon);
  addMoonHalo(scene, moon);
  if (!scene.userData._phase221MoonHaloTick){
    scene.userData._phase221MoonHaloTick = true;
    const oldTick = scene.userData._tickWorld;
    scene.userData._tickWorld = (dt)=>{
      if (typeof oldTick === "function") oldTick(dt);
      const currentMoon = scene.getObjectByName("PHASE221_FINAL_CRATER_TEXTURED_BUMP_MOON") || scene.getObjectByName("PHASE215_FINAL_SINGLE_BIG_TEXTURED_MOON");
      const halo = scene.getObjectByName("PHASE221_MOON_SOFT_RIM_HALO");
      if (currentMoon && halo){
        halo.position.copy(currentMoon.position);
        halo.rotation.copy(currentMoon.rotation);
        halo.scale.setScalar(1 + Math.sin(performance.now()*.0008)*.012);
      }
    };
  }
  window.SVR_PHASE221_MOON_TEXTURE_INSTALLED = true;
  return true;
}

stamp();
let tries = 0;
const timer = setInterval(()=>{ tries++; if (install() || tries > 120) clearInterval(timer); }, 200);
[700,1500,3200,6500,12000].forEach(ms=>setTimeout(install,ms));
