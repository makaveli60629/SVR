import * as THREE from "three";

const LABEL = "UPDATE-3.1-D-QUEST-ALIGNMENT-CONTROL-OVERLAY-FIX";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const PURPLE = 0xa77cff;
const RED = 0x7e1014;
const STONE = 0x151923;
const MOON_POS = new THREE.Vector3(-16.5, 27.5, -44);
const MARS_POS = new THREE.Vector3(-7.8, 24.9, -49.4);

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-D",
    questAlignmentFix: true,
    controlsRecentered: true,
    diagnosticsHidden: true,
    upstairsFloorsRestored: true,
    magneticTargets: true,
    checkedAt: new Date().toISOString()
  });
  window.SVR_PHASE224 = {
    build: LABEL,
    active: true,
    phase: "3.1-D",
    overlayPurge: true,
    upstairsFloorAlignment: true,
    moonMarsSkyLock: true,
    targetMagnetAssist: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}

function floorY(x,z){
  const ax = Math.abs(x);
  if(ax >= 9.2 && ax <= 19.6 && z <= 9.8 && z >= -0.35) return THREE.MathUtils.clamp(((8.65-z)/8.15)*3.42,0,3.42);
  if(z <= -9.85 && z >= -16.55 && ax <= 20.0) return 3.42;
  if(ax >= 14.5 && ax <= 20.0 && z <= 7.55 && z >= -13.65) return 3.42;
  return 0;
}
function installFloorAliases(){
  window.SVR_PHASE224_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE215_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE214_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE213_FLOOR_HEIGHT = floorY;
  window.SVR_PHASE212_FLOOR_HEIGHT = floorY;
}

function mat(color, opacity=1){ return new THREE.MeshBasicMaterial({color, transparent:opacity<1, opacity, side:THREE.DoubleSide, depthWrite:opacity>=1}); }
function glow(color, opacity=.35){ return new THREE.MeshBasicMaterial({color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending}); }
function box(root,name,sx,sy,sz,x,y,z,material){ const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material); m.name=name; m.position.set(x,y,z); root.add(m); return m; }
function plane(root,name,w,h,x,y,z,material,rx=-Math.PI/2,ry=0){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), material); m.name=name; m.position.set(x,y,z); m.rotation.x=rx; m.rotation.y=ry; root.add(m); return m; }

function purgeDomOverlays(){
  ["svrDiagPanel","svrUpdate31Badge","bootFallback","log","err","status","mode"].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    if(id === "svrDiagPanel" || id === "svrUpdate31Badge") el.remove();
    else { el.style.display="none"; el.style.opacity="0"; el.style.pointerEvents="none"; el.style.visibility="hidden"; }
  });
}
function purgeViewOverlays(){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__;
  const renderer = window.__SVR_RENDERER__;
  const kill = /DIAG|DIAGNOSTIC|FACE_OVERLAY|BLACK_OVERLAY|VIEW_OVERLAY|CAMERA_PANEL|SCREEN_OVERLAY|TRANSPARENT_SQUARE|PHASE204_VISUAL|PHASE204_GUIDANCE|PHASE204_FEEDBACK|PHASE203_ACTION/i;
  if(scene){
    const remove=[];
    scene.traverse(o=>{ const n=String(o.name||""); if(kill.test(n)) remove.push(o); });
    remove.forEach(o=>o.parent?.remove(o));
  }
  const roots=[];
  if(camera) roots.push(camera);
  try{ const xr=renderer?.xr?.getCamera?.(camera); if(xr) roots.push(xr); }catch{}
  roots.forEach(root=>root.children?.slice?.().forEach(child=>{
    const n=String(child.name||"");
    const flat = child.isSprite || (child.isMesh && /Plane|Circle/.test(child.geometry?.type||"") && child.material?.transparent);
    if(flat || kill.test(n)){ child.visible=false; child.parent?.remove(child); }
  }));
}

function installFloors(scene){
  let root = scene.getObjectByName("UPDATE31D_UPSTAIRS_ALIGNMENT_FLOORS_ROOT");
  if(root) return;
  root = new THREE.Group();
  root.name = "UPDATE31D_UPSTAIRS_ALIGNMENT_FLOORS_ROOT";
  scene.add(root);
  const floorMat = mat(STONE,.97), carpetMat = mat(RED,.88), gold = glow(GOLD,.42), cyan = glow(CYAN,.26);
  box(root,"UPDATE31D_UPSTAIRS_REAR_SOLID_FLOOR",34,.12,5.55,0,3.42,-11.75,floorMat);
  box(root,"UPDATE31D_UPSTAIRS_LEFT_SOLID_FLOOR",5.1,.12,19.4,-17.0,3.42,-3.1,floorMat);
  box(root,"UPDATE31D_UPSTAIRS_RIGHT_SOLID_FLOOR",5.1,.12,19.4,17.0,3.42,-3.1,floorMat);
  plane(root,"UPDATE31D_UPSTAIRS_REAR_RED_CARPET",31.2,3.55,0,3.505,-11.75,carpetMat);
  plane(root,"UPDATE31D_UPSTAIRS_LEFT_RED_CARPET",3.8,16.8,-17.0,3.51,-3.1,carpetMat);
  plane(root,"UPDATE31D_UPSTAIRS_RIGHT_RED_CARPET",3.8,16.8,17.0,3.51,-3.1,carpetMat);
  box(root,"UPDATE31D_UPSTAIRS_FRONT_GOLD_RAIL",33,.05,.07,0,3.74,-8.85,gold);
  box(root,"UPDATE31D_UPSTAIRS_BACK_GOLD_RAIL",33,.05,.07,0,3.74,-14.72,gold);
  plane(root,"UPDATE31D_MAIN_FLOOR_SUBTLE_STONE_CLARITY",25,16,0,.025,-1.8,mat(0x1c2030,.16));
  plane(root,"UPDATE31D_MAIN_FLOOR_RED_CENTER_RUNNER",6.4,13.5,0,.035,1.0,mat(RED,.18));
  for(let i=0;i<9;i++) box(root,`UPDATE31D_UPSTAIRS_CYAN_FLOOR_EDGE_${i+1}`,.06,.035,4.6,-16+i*4,3.56,-9.0,cyan);
}

function moonTexture(){
  const c=document.createElement("canvas"); c.width=1536; c.height=768;
  const ctx=c.getContext("2d");
  const bg=ctx.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0,"#e5e7ea"); bg.addColorStop(.30,"#aeb4bd"); bg.addColorStop(.55,"#555f70"); bg.addColorStop(.78,"#c9cdd2"); bg.addColorStop(1,"#646d7a");
  ctx.fillStyle=bg; ctx.fillRect(0,0,c.width,c.height);
  [[780,310,280,118,.36],[1050,350,200,90,.32],[430,440,240,105,.26],[1140,210,150,70,.28],[620,170,145,70,.20]].forEach(([x,y,rx,ry,a])=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=`rgba(26,30,38,${a})`;ctx.fill();});
  function crater(x,y,r,a){const g=ctx.createRadialGradient(x-r*.18,y-r*.22,r*.05,x,y,r);g.addColorStop(0,`rgba(255,255,255,${.28*a})`);g.addColorStop(.52,`rgba(120,126,138,${.16*a})`);g.addColorStop(.70,`rgba(12,14,20,${.42*a})`);g.addColorStop(.88,`rgba(235,238,244,${.24*a})`);g.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  [[160,405,64,1.2],[278,500,42,1],[520,455,56,1],[680,522,34,.9],[1122,386,88,1.15],[1325,430,50,1],[1250,575,38,.95],[890,165,60,1]].forEach(v=>crater(...v));
  for(let i=0;i<520;i++) crater(Math.random()*c.width,Math.random()*c.height,2+Math.pow(Math.random(),2.3)*27,.22+Math.random()*.48);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}
function marsTexture(){
  const c=document.createElement("canvas"); c.width=768; c.height=384; const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#ff9861"); g.addColorStop(.55,"#9b301d"); g.addColorStop(1,"#431007"); ctx.fillStyle=g; ctx.fillRect(0,0,c.width,c.height);
  for(let i=0;i<80;i++){ctx.beginPath();ctx.ellipse(Math.random()*c.width,Math.random()*c.height,10+Math.random()*46,4+Math.random()*18,Math.random()*Math.PI,0,Math.PI*2);ctx.fillStyle=Math.random()>.5?"rgba(255,210,130,.15)":"rgba(35,5,3,.22)";ctx.fill();}
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function isMoonLike(o){
  const n=String(o.name||"");
  if(/UPDATE31D_ONLY_SKY_MOON|UPDATE31D_ONLY_SKY_MOON_HALO/i.test(n)) return false;
  if(/MOON/i.test(n)) return true;
  if(!o.isMesh || !o.geometry) return false;
  o.geometry.computeBoundingSphere?.();
  const r=(o.geometry.boundingSphere?.radius||0)*Math.max(o.scale.x||1,o.scale.y||1,o.scale.z||1);
  const p=new THREE.Vector3(); o.getWorldPosition(p);
  return r>2.2 && r<22 && p.y<35 && o.material;
}
function installMoonMars(scene){
  const remove=[]; scene.traverse(o=>{ if(isMoonLike(o)) remove.push(o); }); remove.forEach(o=>o.parent?.remove(o));
  let moon=scene.getObjectByName("UPDATE31D_ONLY_SKY_MOON_LEFT_EYE_CANDY");
  if(!moon){ moon=new THREE.Mesh(new THREE.SphereGeometry(6.6,96,64), new THREE.MeshStandardMaterial({map:moonTexture(),roughness:.9,metalness:0,emissive:0x20283a,emissiveIntensity:.32})); moon.name="UPDATE31D_ONLY_SKY_MOON_LEFT_EYE_CANDY"; scene.add(moon); }
  moon.position.copy(MOON_POS); moon.visible=true;
  let halo=scene.getObjectByName("UPDATE31D_ONLY_SKY_MOON_HALO");
  if(!halo){ halo=new THREE.Mesh(new THREE.SphereGeometry(7.15,64,32), new THREE.MeshBasicMaterial({color:0xe7efff,transparent:true,opacity:.07,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending})); halo.name="UPDATE31D_ONLY_SKY_MOON_HALO"; scene.add(halo); }
  halo.position.copy(MOON_POS); halo.visible=true;
  let mars=scene.getObjectByName("UPDATE31D_TEXTURED_MARS_HIGH_SKY");
  if(!mars){ mars=new THREE.Mesh(new THREE.SphereGeometry(1.25,56,36), new THREE.MeshStandardMaterial({map:marsTexture(),roughness:.85,emissive:0x300904,emissiveIntensity:.22})); mars.name="UPDATE31D_TEXTURED_MARS_HIGH_SKY"; scene.add(mars); }
  mars.position.copy(MARS_POS); mars.visible=true;
  if(!scene.userData._update31DMoonTick){
    scene.userData._update31DMoonTick=true;
    const old=scene.userData._tickWorld;
    scene.userData._tickWorld=(dt)=>{ if(typeof old==="function") old(dt); const t=performance.now()*.001; moon.rotation.y=t*.055; moon.rotation.x=Math.sin(t*.03)*.05; halo.position.copy(moon.position); halo.rotation.copy(moon.rotation); mars.rotation.y=t*.105; mars.position.set(MARS_POS.x+Math.cos(t*.045)*1.2,MARS_POS.y+Math.sin(t*.035)*.35,MARS_POS.z+Math.sin(t*.045)*.8); };
  }
}

function installMagnetTargets(scene){
  let root=scene.getObjectByName("UPDATE31D_MAGNETIC_TARGETS_ROOT");
  if(root) return;
  root=new THREE.Group(); root.name="UPDATE31D_MAGNETIC_TARGETS_ROOT"; scene.add(root);
  const targets=[
    ["PLAY_GAME",0,-2.4,GOLD],["WELLNESS_HUB",-6.4,-3.6,PURPLE],["PGA_HUB",6.4,-3.6,CYAN],["SCORPION_ROOM",12.3,-4.2,PURPLE],["STORE_PORTAL",0,4.2,CYAN],["LEGENDS",7.2,-7.0,GOLD],["SPONSOR_AREA",13.7,1.8,GOLD]
  ];
  window.SVR_UPDATE31D_MAGNETIC_TARGETS = targets.map(([name,x,z])=>({name,x,z}));
  targets.forEach(([name,x,z,color])=>{
    const y=floorY(x,z)+.035;
    const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.72,80), glow(color,.22));
    ring.name=`UPDATE31D_MAGNET_${name}`;
    ring.userData.svrMagnetTarget=true;
    ring.userData.svrMagnetName=name;
    ring.rotation.x=-Math.PI/2; ring.position.set(x,y,z); root.add(ring);
  });
}

function install(){
  stamp(); installFloorAliases(); purgeDomOverlays();
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  purgeViewOverlays(); installFloors(scene); installMoonMars(scene); installMagnetTargets(scene);
  window.SVR_UPDATE31D_INSTALLED = true;
  return true;
}

stamp(); installFloorAliases(); purgeDomOverlays();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>180) clearInterval(timer); },200);
[300,800,1600,3000,5500,9000,14000].forEach(ms=>setTimeout(install,ms));
