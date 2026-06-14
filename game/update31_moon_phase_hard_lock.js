import * as THREE from "three";

const LABEL = "UPDATE-3.1-C-MOON-PHASE-HARD-LOCK";
const MOON_NAME = "UPDATE31C_ONLY_SKY_MOON_LEFT_EYE_CANDY";
const HALO_NAME = "UPDATE31C_ONLY_SKY_MOON_HALO";
const MOON_POS = new THREE.Vector3(-16.5, 27.5, -44);

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-C",
    moonPhaseHardLock: true,
    oneMoonOnly: true,
    phaseDriftStopped: true,
    checkedAt: new Date().toISOString()
  });
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function moonTexture(){
  const c=document.createElement("canvas"); c.width=1024; c.height=512;
  const ctx=c.getContext("2d");
  const bg=ctx.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0,"#dbdde0"); bg.addColorStop(.34,"#a6abb2"); bg.addColorStop(.56,"#56606e"); bg.addColorStop(.78,"#c4c7ca"); bg.addColorStop(1,"#656c76");
  ctx.fillStyle=bg; ctx.fillRect(0,0,c.width,c.height);
  [[540,238,180,74,.34],[725,255,130,50,.31],[300,315,150,60,.26],[795,145,84,38,.24]].forEach(([x,y,rx,ry,a])=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=`rgba(22,26,34,${a})`;ctx.fill();});
  function crater(x,y,r,a){const g=ctx.createRadialGradient(x-r*.18,y-r*.20,r*.05,x,y,r);g.addColorStop(0,`rgba(255,255,255,${.25*a})`);g.addColorStop(.54,`rgba(100,106,116,${.16*a})`);g.addColorStop(.70,`rgba(10,12,18,${.40*a})`);g.addColorStop(.88,`rgba(235,238,242,${.22*a})`);g.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  [[115,280,45,1.1],[260,355,32,1],[390,310,42,.9],[640,345,58,1.1],[830,290,38,.9],[905,380,32,.8],[610,160,40,.8]].forEach(v=>crater(...v));
  for(let i=0;i<360;i++) crater(Math.random()*c.width,Math.random()*c.height,2+Math.pow(Math.random(),2.1)*22,.22+Math.random()*.45);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}

function isMoonObject(obj){
  const n=String(obj.name||"");
  if(/moon/i.test(n)) return true;
  if(!obj.isMesh || !obj.geometry) return false;
  obj.geometry.computeBoundingSphere?.();
  const radius=(obj.geometry.boundingSphere?.radius||0)*Math.max(obj.scale.x||1,obj.scale.y||1,obj.scale.z||1);
  const pos=new THREE.Vector3(); obj.getWorldPosition(pos);
  return radius>2.2 && radius<22 && pos.y<35 && obj.material && /Material/.test(String(obj.material.type||""));
}

function purgeExtraMoons(scene){
  const remove=[];
  scene.traverse(obj=>{
    if(!obj || obj.name===MOON_NAME || obj.name===HALO_NAME) return;
    if(isMoonObject(obj)) remove.push(obj);
  });
  remove.forEach(obj=>obj.parent?.remove(obj));
  window.SVR_UPDATE31_MOON_PURGED_COUNT = (window.SVR_UPDATE31_MOON_PURGED_COUNT || 0) + remove.length;
}

function ensureMoon(scene){
  let moon=scene.getObjectByName(MOON_NAME);
  if(!moon){
    moon=new THREE.Mesh(new THREE.SphereGeometry(6.6,96,64), new THREE.MeshStandardMaterial({map:moonTexture(),roughness:.9,metalness:0,emissive:0x20283a,emissiveIntensity:.32}));
    moon.name=MOON_NAME;
    scene.add(moon);
  }
  moon.position.copy(MOON_POS);
  moon.visible=true;
  let halo=scene.getObjectByName(HALO_NAME);
  if(!halo){
    halo=new THREE.Mesh(new THREE.SphereGeometry(7.1,64,32), new THREE.MeshBasicMaterial({color:0xe7efff,transparent:true,opacity:.075,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending}));
    halo.name=HALO_NAME;
    scene.add(halo);
  }
  halo.position.copy(MOON_POS);
  halo.visible=true;
  window.SVR_UPDATE31_MOON = { x:MOON_POS.x, y:MOON_POS.y, z:MOON_POS.z, size:6.6, onlyMoon:true };
}

function install(){
  stamp();
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  purgeExtraMoons(scene);
  ensureMoon(scene);
  window.SVR_UPDATE31_C_INSTALLED = true;
  return true;
}

stamp();
let tries=0;
const timer=setInterval(()=>{tries++; install(); if(tries>240) clearInterval(timer);},250);
[500,1000,2000,4000,8000,12000,18000].forEach(ms=>setTimeout(install,ms));
