import * as THREE from "three";

// PHASE-128-SPAWN-TELEPORT-SKY-NORTH-LOCK
// Game-side only. Fixes desktop/browser spawn out of table, faces north,
// and adds high sky Moon north plus Mars east. Site untouched.

const PHASE = "PHASE-128-SPAWN-TELEPORT-SKY-NORTH-LOCK";
const SAFE_SPAWN = new THREE.Vector3(0, 1.6, 8.4);
const LOOK_NORTH = new THREE.Vector3(0, 1.35, -6.0);
let installed = false;

function makeHaloTexture(){
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128,128,4,128,128,120);
  g.addColorStop(0,"rgba(255,255,255,0.95)");
  g.addColorStop(0.22,"rgba(220,230,255,0.34)");
  g.addColorStop(0.62,"rgba(180,140,255,0.10)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,256,256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function makeSkyGradient(){
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 1024;
  const ctx = c.getContext("2d");
  const bg = ctx.createLinearGradient(0,0,0,c.height);
  bg.addColorStop(0,"#01020a");
  bg.addColorStop(0.35,"#050826");
  bg.addColorStop(1,"#02030a");
  ctx.fillStyle = bg; ctx.fillRect(0,0,c.width,c.height);
  for(let i=0;i<900;i++){
    const y = Math.random()*c.height*0.72;
    const a = 0.35 + Math.random()*0.55;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(Math.random()*c.width, y, Math.random()<0.08?2:1, Math.random()<0.08?2:1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function loadTexture(url){
  const tex = new THREE.TextureLoader().load(url, t=>{ t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; });
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function setBuildLabel(){
  window.SVR_CURRENT_GAME_PHASE = PHASE;
  window.SVR_BUILD_PHASE = PHASE;
  document.documentElement.dataset.svrBuild = PHASE;
  const pill = Array.from(document.querySelectorAll(".pill")).find(p => String(p.textContent||"").includes("BUILD:"));
  if (pill) pill.textContent = "BUILD: " + PHASE;
  if (!String(document.title||"").includes("Phase 128")) document.title = "ScarlettVR Poker • Phase 128 spawn teleport sky north";
}
function fixSpawn(){
  const camera = window.SVR_CORE_CAMERA;
  const renderer = window.SVR_CORE_RENDERER;
  if (!camera || renderer?.xr?.isPresenting) return;
  const nearTable = Math.hypot(camera.position.x, camera.position.z) < 6.6;
  const staleSpawn = Math.abs(camera.position.z - 4.8) < 0.8;
  if (nearTable || staleSpawn){
    camera.position.copy(SAFE_SPAWN);
    camera.lookAt(LOOK_NORTH);
    camera.updateProjectionMatrix?.();
  }
}
function installSky(){
  const scene = window.SVR_CORE_SCENE;
  if (!scene || installed) return;
  installed = true;
  const group = new THREE.Group();
  group.name = "SVR_PHASE128_HIGH_SKY_NORTH_MARS_EAST";
  group.userData.svrNoWorldShift = true;
  scene.add(group);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(950, 48, 24),
    new THREE.MeshBasicMaterial({ map: makeSkyGradient(), side: THREE.BackSide, depthWrite:false })
  );
  sky.name = "SVR_HIGH_STAR_SKY";
  sky.userData.svrNoWorldShift = true;
  group.add(sky);

  const haloTex = makeHaloTexture();
  const moonTex = loadTexture("./assets/texture/moon_diffuse.png");
  const marsTex = loadTexture("./assets/texture/mars/diffuse_1k.jpg");

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(14, 64, 48),
    new THREE.MeshStandardMaterial({ map: moonTex, color:0xf0f2f5, roughness:0.96, metalness:0 })
  );
  moon.name = "SVR_HIGH_MOON_NORTH";
  moon.position.set(0, 270, -760);
  moon.frustumCulled = false;
  group.add(moon);
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color:0xf4f7ff, transparent:true, opacity:0.24, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  moonHalo.name = "SVR_HIGH_MOON_NORTH_HALO";
  moonHalo.position.copy(moon.position);
  moonHalo.scale.set(125,125,1);
  group.add(moonHalo);

  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(8.5, 48, 36),
    new THREE.MeshStandardMaterial({ map: marsTex, color:0xd9784d, roughness:0.88, metalness:0 })
  );
  mars.name = "SVR_HIGH_MARS_EAST";
  mars.position.set(540, 245, -300);
  mars.frustumCulled = false;
  group.add(mars);
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color:0xff9b6b, transparent:true, opacity:0.18, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  marsHalo.name = "SVR_HIGH_MARS_EAST_HALO";
  marsHalo.position.copy(mars.position);
  marsHalo.scale.set(86,86,1);
  group.add(marsHalo);

  const northLight = new THREE.DirectionalLight(0xeaf2ff, 0.72);
  northLight.position.set(0, 1, -1);
  northLight.userData.svrNoWorldShift = true;
  group.add(northLight);

  window.SVR_PHASE128_SKY = { phase: PHASE, moon: "high north", mars: "east", siteTouched:false };
  const tick = ()=>{
    const t = performance.now() * 0.001;
    moon.rotation.y += 0.0009;
    mars.rotation.y += 0.0012;
    moon.position.y = 270 + Math.sin(t*0.08)*2.5;
    mars.position.y = 245 + Math.sin(t*0.07 + 1.2)*2.0;
    moonHalo.position.copy(moon.position);
    marsHalo.position.copy(mars.position);
    requestAnimationFrame(tick);
  };
  tick();
}
function loop(){
  setBuildLabel();
  fixSpawn();
  installSky();
  setTimeout(loop, 1200);
}
window.SVR_PHASE128_SPAWN_SKY_PATCH = { phase: PHASE, fixSpawn, installSky, safeSpawn:{ x:0, y:1.6, z:8.4 }, facing:"north", mars:"east", siteTouched:false };
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loop, { once:true }); else loop();
