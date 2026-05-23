import * as THREE from "three";

const PHASE = "PHASE-142-TELEPORT-CRITICAL-QUEST-CONTROLLER-WATCH-MOON-MARS-LOCK";

function makeMoonTexture(){
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(100, 82, 10, 128, 128, 142);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(.55, '#cfd5dd');
  g.addColorStop(1, '#8f99aa');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,256,256);
  for (let i=0;i<38;i++){
    const x = 25 + Math.random()*205;
    const y = 20 + Math.random()*210;
    const r = 3 + Math.random()*14;
    ctx.fillStyle = `rgba(70,75,86,${0.10 + Math.random()*0.18})`;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  tex.generateMipmaps = false;
  return tex;
}

function install(){
  const scene = window.SVR_CORE_SCENE;
  if (!scene) return false;
  if (scene.getObjectByName('SVR_PHASE142_STATIC_PLANETS')) return true;
  const group = new THREE.Group();
  group.name = 'SVR_PHASE142_STATIC_PLANETS';
  group.userData.svrNoWorldShift = true;
  scene.add(group);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(7.5, 24, 14),
    new THREE.MeshBasicMaterial({ map: makeMoonTexture(), fog:false, toneMapped:false })
  );
  moon.name = 'SVR_PHASE142_STATIC_MOON_HIGH';
  moon.position.set(-44, 54, -96);
  moon.userData.svrNoWorldShift = true;
  group.add(moon);

  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(4.4, 20, 12),
    new THREE.MeshBasicMaterial({ color:0xd87145, fog:false, toneMapped:false })
  );
  mars.name = 'SVR_PHASE142_STATIC_MARS_EAST_HIGH';
  mars.position.set(82, 42, -34);
  mars.userData.svrNoWorldShift = true;
  group.add(mars);

  window.SVR_PHASE142_STATIC_PLANETS = {
    phase: PHASE,
    mode: 'static-no-animation-no-skybox',
    moon: 'high north-west static sphere',
    mars: 'east high static sphere',
    reason: 'restore Moon/Mars without orbit sky freeze risk'
  };
  return true;
}

function wait(attempt=0){
  if (install()) return;
  if (attempt < 80) setTimeout(()=>wait(attempt+1), 100);
}

wait();
