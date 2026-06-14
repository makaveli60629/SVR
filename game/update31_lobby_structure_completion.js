import * as THREE from "three";

const LABEL = "UPDATE-3.1-B-LOBBY-STRUCTURE-COMPLETION-LOCK";
const RED = 0x7e1014;
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const STONE = 0x141722;
const SKY_MOON_POS = new THREE.Vector3(-15.5, 26.5, -43);

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-B",
    lobbyStructureCompletion: true,
    floorDomeKilled: true,
    redCarpetUpstairs: true,
    romanPatio: true,
    spawnWallSealed: true,
    cityWindows: true,
    checkedAt: new Date().toISOString()
  });
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function mat(color, opacity=1){
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: opacity >= 1 });
}
function glow(color, opacity=.36){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function box(root,name,sx,sy,sz,x,y,z,material,ry=0){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  m.name=name; m.position.set(x,y,z); m.rotation.y=ry; root.add(m); return m;
}
function cyl(root,name,r,h,x,y,z,material){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,28), material);
  m.name=name; m.position.set(x,y,z); root.add(m); return m;
}
function plane(root,name,w,h,x,y,z,material,rx=-Math.PI/2,ry=0){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), material);
  m.name=name; m.position.set(x,y,z); m.rotation.x=rx; m.rotation.y=ry; root.add(m); return m;
}

function makeMoonTexture(){
  const c=document.createElement("canvas"); c.width=1024; c.height=512; const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#d7d9dc"); g.addColorStop(.36,"#a4aab1"); g.addColorStop(.56,"#59616d"); g.addColorStop(.78,"#c6c8ca"); g.addColorStop(1,"#666c75");
  ctx.fillStyle=g; ctx.fillRect(0,0,c.width,c.height);
  function mare(x,y,rx,ry,a){ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fillStyle=`rgba(25,29,36,${a})`; ctx.fill();}
  [[540,235,170,70,.34],[720,255,120,48,.30],[305,310,140,58,.24],[790,145,78,38,.25]].forEach(v=>mare(...v));
  function crater(x,y,r,a){const rg=ctx.createRadialGradient(x-r*.2,y-r*.2,r*.05,x,y,r); rg.addColorStop(0,`rgba(255,255,255,${.25*a})`); rg.addColorStop(.55,`rgba(90,95,104,${.14*a})`); rg.addColorStop(.70,`rgba(10,12,18,${.36*a})`); rg.addColorStop(.88,`rgba(235,238,242,${.20*a})`); rg.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();}
  [[115,280,45,1.1],[260,355,32,1],[390,310,42,.9],[640,345,58,1.1],[830,290,38,.9],[905,380,32,.8]].forEach(v=>crater(...v));
  for(let i=0;i<300;i++) crater(Math.random()*c.width, Math.random()*c.height, 2+Math.pow(Math.random(),2.1)*22, .24+Math.random()*.44);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}

function purgeBadFloorMoons(scene){
  const remove=[];
  scene.traverse(o=>{
    if(!o.isMesh || !o.geometry) return;
    const n=String(o.name||"");
    o.geometry.computeBoundingSphere?.();
    const r=(o.geometry.boundingSphere?.radius||0) * Math.max(o.scale.x||1,o.scale.y||1,o.scale.z||1);
    const wp=new THREE.Vector3(); o.getWorldPosition(wp);
    const looksLikeMoon = /moon/i.test(n) || (r>2.4 && r<18 && wp.y<8 && o.material && String(o.material.type||"").includes("Material"));
    const keepSky = /UPDATE31B_SKY_MOON|PHASE222_SKY_ANCHORED/i.test(n) && wp.y>10;
    if(looksLikeMoon && !keepSky) remove.push(o);
  });
  remove.forEach(o=>o.parent?.remove(o));
}

function addSkyMoon(scene, root){
  let old = scene.getObjectByName("UPDATE31B_SKY_MOON_LEFT_EYE_CANDY");
  if(old) old.parent?.remove(old);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(6.2,96,64), new THREE.MeshStandardMaterial({ map:makeMoonTexture(), roughness:.9, metalness:0, emissive:0x20283a, emissiveIntensity:.30 }));
  moon.name="UPDATE31B_SKY_MOON_LEFT_EYE_CANDY"; moon.position.copy(SKY_MOON_POS); scene.add(moon);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(6.75,64,32), glow(0xe7efff,.075));
  halo.name="UPDATE31B_SKY_MOON_HALO"; halo.position.copy(SKY_MOON_POS); scene.add(halo);
  window.SVR_UPDATE31_MOON = { x:SKY_MOON_POS.x, y:SKY_MOON_POS.y, z:SKY_MOON_POS.z, size:6.2 };
}

function addRedCarpetAndFloors(root){
  const floorMat=mat(STONE,.94), carpetMat=mat(RED,.96), trim=glow(GOLD,.38);
  box(root,"UPDATE31B_SOLID_UPSTAIRS_NORTH_FLOOR",34,.12,5.2,0,3.42,-11.4,floorMat);
  box(root,"UPDATE31B_SOLID_UPSTAIRS_LEFT_FLOOR",11,.12,4.5,-15,3.42,-8.7,floorMat);
  box(root,"UPDATE31B_SOLID_UPSTAIRS_RIGHT_FLOOR",11,.12,4.5,15,3.42,-8.7,floorMat);
  plane(root,"UPDATE31B_RED_CARPET_UPSTAIRS_NORTH",31,3.65,0,3.50,-11.4,carpetMat);
  plane(root,"UPDATE31B_RED_CARPET_UPSTAIRS_LEFT",8.4,2.9,-15,3.51,-8.7,carpetMat);
  plane(root,"UPDATE31B_RED_CARPET_UPSTAIRS_RIGHT",8.4,2.9,15,3.51,-8.7,carpetMat);
  for(let i=0;i<6;i++){
    plane(root,`UPDATE31B_RED_CARPET_STAIR_LEFT_${i+1}`,2.4,.45,-10.4,0.42+i*.45,-4.8-i*.72,carpetMat,-Math.PI/2+.42,0);
    plane(root,`UPDATE31B_RED_CARPET_STAIR_RIGHT_${i+1}`,2.4,.45,10.4,0.42+i*.45,-4.8-i*.72,carpetMat,-Math.PI/2+.42,0);
  }
  box(root,"UPDATE31B_UPSTAIRS_GOLD_FRONT_RAIL",32,.06,.08,0,3.72,-8.85,trim);
}

function addRomanPatio(root){
  const stone=mat(0x2a2b35,.94), trim=glow(GOLD,.42), red=mat(RED,.72);
  plane(root,"UPDATE31B_TABLE_PATIO_RED_CENTER_CARPET",7.2,5.8,0,.045,-2.0,red);
  const pts=[[-6,-4.9],[-3,-5.9],[3,-5.9],[6,-4.9],[-6,1.2],[6,1.2]];
  pts.forEach(([x,z],i)=>{
    cyl(root,`UPDATE31B_ROMAN_PATIO_COLUMN_${i+1}`,.18,3.1,x,1.55,z,stone);
    cyl(root,`UPDATE31B_ROMAN_PATIO_COLUMN_GLOW_${i+1}`,.205,.035,x,3.1,z,trim);
    cyl(root,`UPDATE31B_ROMAN_PATIO_BASE_${i+1}`,.30,.14,x,.07,z,stone);
  });
  box(root,"UPDATE31B_ROMAN_PATIO_BACK_ARCH_BEAM",12.8,.18,.18,0,3.1,-5.9,trim);
  box(root,"UPDATE31B_ROMAN_PATIO_FRONT_ARCH_BEAM",12.8,.18,.18,0,3.1,1.2,trim);
  plane(root,"UPDATE31B_TABLE_PATIO_GOLD_RING",8.6,8.6,0,.06,-2.4,glow(GOLD,.18));
}

function addWindowsAndCity(root){
  const glass=glow(CYAN,.14), frame=glow(GOLD,.34);
  for(let i=0;i<5;i++){
    const x=-12+i*6;
    plane(root,`UPDATE31B_CITY_WINDOW_GLASS_${i+1}`,4.7,2.2,x,5.0,-15.15,glass,0,0);
    box(root,`UPDATE31B_CITY_WINDOW_TOP_FRAME_${i+1}`,4.8,.05,.05,x,6.15,-15.1,frame);
    box(root,`UPDATE31B_CITY_WINDOW_BOTTOM_FRAME_${i+1}`,4.8,.05,.05,x,3.85,-15.1,frame);
    box(root,`UPDATE31B_CITY_WINDOW_LEFT_FRAME_${i+1}`,.05,2.35,.05,x-2.4,5.0,-15.1,frame);
    box(root,`UPDATE31B_CITY_WINDOW_RIGHT_FRAME_${i+1}`,.05,2.35,.05,x+2.4,5.0,-15.1,frame);
  }
  for(let i=0;i<28;i++){
    const h=1.2+Math.random()*3.3, x=-16+Math.random()*32, z=-18-Math.random()*4;
    box(root,`UPDATE31B_TEXTURED_CITY_TOWER_${i+1}`,.45+Math.random()*.8,h,.45,x,3.3+h/2,z,mat(0x0b1320,.86));
    box(root,`UPDATE31B_TEXTURED_CITY_TOWER_LIGHT_${i+1}`,.35,.04,.48,x,3.55+h,z,glow(i%2?CYAN:0xa77cff,.55));
  }
}

function makeLabelTexture(title, sub){
  const c=document.createElement("canvas"); c.width=1024; c.height=256; const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(5,4,10,.88)"; ctx.fillRect(0,0,c.width,c.height); ctx.strokeStyle="#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(10,10,c.width-20,c.height-20);
  ctx.fillStyle="#ffd98a"; ctx.font="900 54px system-ui,Arial"; ctx.textAlign="center"; ctx.fillText(title,c.width/2,105);
  ctx.fillStyle="#7ffcff"; ctx.font="800 30px system-ui,Arial"; ctx.fillText(sub,c.width/2,165);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function addSpawnSeal(root){
  const wall=mat(0x05060d,.96), trim=glow(GOLD,.38);
  box(root,"UPDATE31B_SPAWN_BACK_WALL_SEAL_LEFT",12,4.4,.22,-10,2.2,8.9,wall);
  box(root,"UPDATE31B_SPAWN_BACK_WALL_SEAL_RIGHT",12,4.4,.22,10,2.2,8.9,wall);
  box(root,"UPDATE31B_SPAWN_BACK_WALL_SEAL_TOP",8,1.1,.22,0,3.85,8.9,wall);
  box(root,"UPDATE31B_ARRIVAL_GATE_GOLD_HEADER",5.2,.12,.08,0,3.25,8.75,trim);
  box(root,"UPDATE31B_ARRIVAL_GATE_LEFT_POST",.14,2.8,.08,-2.6,1.75,8.75,trim);
  box(root,"UPDATE31B_ARRIVAL_GATE_RIGHT_POST",.14,2.8,.08,2.6,1.75,8.75,trim);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.1), new THREE.MeshBasicMaterial({ map:makeLabelTexture("SVR ARRIVAL", "Lobby entrance sealed"), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  sign.name="UPDATE31B_SPAWN_GATE_LABEL"; sign.position.set(0,2.25,8.72); sign.rotation.y=Math.PI; root.add(sign);
}

function install(){
  stamp();
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  purgeBadFloorMoons(scene);
  const old=scene.getObjectByName("UPDATE31B_LOBBY_STRUCTURE_COMPLETION_ROOT");
  if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name="UPDATE31B_LOBBY_STRUCTURE_COMPLETION_ROOT"; scene.add(root);
  addSkyMoon(scene, root);
  addRedCarpetAndFloors(root);
  addRomanPatio(root);
  addWindowsAndCity(root);
  addSpawnSeal(root);
  window.SVR_UPDATE31_B_INSTALLED=true;
  return true;
}

stamp();
let tries=0;
const timer=setInterval(()=>{tries++; if(install()||tries>120) clearInterval(timer);},200);
[350,900,1800,3500,7000,12000].forEach(ms=>setTimeout(install,ms));
