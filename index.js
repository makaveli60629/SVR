// SVR/index.js
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

import { initWorld } from './js/scarlett1/world.js';

const $ = (id)=>document.getElementById(id);
const logEl = $('log');
const statusEl = $('status');

const Bus = {
  log: (msg)=>{
    const t = new Date().toISOString().split('T')[1].replace('Z','');
    logEl.textContent += `\n[${t}] ${msg}`;
    logEl.scrollTop = logEl.scrollHeight;
    console.log(msg);
  },
  emit: (type, detail={})=>{
    window.dispatchEvent(new CustomEvent(type, { detail }));
  }
};

// ---------------- THREE core ----------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.05, 500);
camera.position.set(0, 1.65, 0);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Player rig (move this, not the camera)
const rig = new THREE.Group();
rig.add(camera);
scene.add(rig);

// World outputs
let worldUpdate = null;
let teleportSurfaces = [];
let walkSurfaces = [];
let getSpawnPose = null; // function from world: returns {pos, yaw}
let snapToGround = null; // function from world: snaps rig to ground given xz

// ---------------- HANDS (mesh profile) ----------------
const handFactory = new XRHandModelFactory();
const hands = [ renderer.xr.getHand(0), renderer.xr.getHand(1) ];
const skinBase = new THREE.Color('#8d5524');

function applySkin(model){
  model.traverse((o)=>{
    if (!o.isMesh) return;
    const old = o.material;
    const mat = new THREE.MeshStandardMaterial({
      color: skinBase,
      roughness: 0.72,
      metalness: 0.0
    });
    if (old?.map) mat.map = old.map;
    o.material = mat;
    o.material.needsUpdate = true;
  });
}

hands.forEach((hand, i)=>{
  scene.add(hand);
  const model = handFactory.createHandModel(hand, 'mesh');
  hand.add(model);

  hand.addEventListener('connected', ()=>{
    applySkin(model);
    Bus.log(`hand ${i} connected (mesh)`);
  });
  hand.addEventListener('disconnected', ()=>{
    Bus.log(`hand ${i} disconnected`);
  });
});

// ---------------- Pinch detection ----------------
const pinchState = { left:false, right:false };
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const mid = new THREE.Vector3();

function jointPos(hand, name, out){
  const j = hand.joints?.[name];
  if (!j) return false;
  j.getWorldPosition(out);
  return true;
}

function updatePinch(){
  hands.forEach((hand)=>{
    const h = hand.handedness || 'unknown';
    const key = (h==='left')?'left':'right';
    if (!jointPos(hand,'thumb-tip',v1) || !jointPos(hand,'index-finger-tip',v2)) return;
    const d = v1.distanceTo(v2);
    const pinching = d < 0.026;
    mid.copy(v1).add(v2).multiplyScalar(0.5);

    if (pinching && !pinchState[key]){
      pinchState[key] = true;
      Bus.emit('pinchstart', { handedness:key, position: mid.clone() });
    } else if (!pinching && pinchState[key]){
      pinchState[key] = false;
      Bus.emit('pinchend', { handedness:key, position: mid.clone() });
    } else if (pinching){
      Bus.emit('pinchmove', { handedness:key, position: mid.clone() });
    }
  });
}

// ---------------- Controllers: thumbsticks (Quest-safe) ----------------
const move = { x:0, y:0 };
let turnX = 0;
let lastSnapTime = 0;

function deadzone(v, dz=0.14){
  if (Math.abs(v) < dz) return 0;
  return Math.sign(v) * (Math.abs(v)-dz)/(1-dz);
}

function readAxes(){
  const session = renderer.xr.getSession();
  if (!session) return;
  for (const src of session.inputSources){
    const gp = src.gamepad;
    if (!gp || !gp.axes) continue;

    if (src.handedness === 'left'){
      move.x = deadzone(gp.axes[0] || 0);
      move.y = deadzone(-(gp.axes[1] || 0));
    } else if (src.handedness === 'right'){
      turnX = deadzone(gp.axes[2] || 0);
    }
  }
}

function applyLocomotion(dt){
  // move in rig yaw space
  const yaw = rig.rotation.y;
  const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  const speed = 2.0;
  rig.position.addScaledVector(f, move.y * speed * dt);
  rig.position.addScaledVector(r, move.x * speed * dt);

  // snap-turn
  const now = performance.now();
  if (Math.abs(turnX) > 0.72 && now - lastSnapTime > 240){
    rig.rotation.y += (turnX > 0 ? -1 : 1) * (Math.PI/6);
    lastSnapTime = now;
  }

  // Only snap to ground if we have the helper
  snapToGround?.(rig);
}

// ---------------- Teleport: single stable aim (prefers right controller/hand) ----------------
const controllerL = renderer.xr.getController(0);
const controllerR = renderer.xr.getController(1);
scene.add(controllerL); scene.add(controllerR);

function getAim(){
  // Prefer right controller (Touch), then right hand, then left controller, then left hand, then camera
  const rHand = hands.find(h=>h.handedness==='right') || hands[1];
  const lHand = hands.find(h=>h.handedness==='left') || hands[0];

  // In practice, controllerR pose is stable if connected
  const okPose = (o)=>{
    if (!o) return false;
    const p = new THREE.Vector3();
    o.getWorldPosition(p);
    return p.lengthSq() > 0.000001;
  };
  if (okPose(controllerR)) return controllerR;
  if (okPose(rHand)) return rHand;
  if (okPose(controllerL)) return controllerL;
  if (okPose(lHand)) return lHand;
  return camera;
}

function teleportTo(point){
  rig.position.set(point.x, rig.position.y, point.z);
  snapToGround?.(rig);
}

// Let world provide teleport surfaces and raycast method by using a shared function
let teleportPick = null; // fn(aimObj)->Vector3|null

controllerR.addEventListener('selectstart', ()=>{
  const aim = getAim();
  const p = teleportPick?.(aim);
  if (p) teleportTo(p);
});
controllerL.addEventListener('selectstart', ()=>{
  const aim = getAim();
  const p = teleportPick?.(aim);
  if (p) teleportTo(p);
});

// Also allow pinch teleport (right hand pinchstart)
window.addEventListener('pinchstart', (e)=>{
  if (e.detail?.handedness !== 'right') return;
  const aim = getAim();
  const p = teleportPick?.(aim);
  if (p) teleportTo(p);
});

// ---------------- boot world ----------------
async function boot(){
  try{
    statusEl.textContent = 'booting…';
    Bus.log('booting…');

    const ctx = { THREE, scene, camera, renderer, rig, Bus };
    const res = await initWorld(ctx);

    walkSurfaces = res?.walkSurfaces || [];
    teleportSurfaces = res?.teleportSurfaces || [];
    worldUpdate = ctx.worldUpdate || null;
    getSpawnPose = ctx.getSpawnPose || null;
    snapToGround = ctx.snapToGround || null;
    teleportPick = ctx.teleportPick || null;

    // Spawn on spawn pad immediately
    doSpawn();

    statusEl.textContent = 'ready ✅';
    statusEl.style.background = 'rgba(0,150,0,.55)';
    Bus.log('ready ✅');
  }catch(e){
    statusEl.textContent = 'boot failed ✖';
    statusEl.style.background = 'rgba(150,0,0,.55)';
    Bus.log(`boot failed: ${e?.message || e}`);
  }
}

function doSpawn(){
  const pose = getSpawnPose?.();
  if (pose?.pos){
    rig.position.copy(pose.pos);
    rig.rotation.y = pose.yaw || 0;
  } else {
    rig.position.set(0,0,10);
    rig.rotation.y = Math.PI;
  }
  // Ensure we are on ground (prevents halfway between floors)
  snapToGround?.(rig);
  Bus.log('spawn -> pad');
}

boot();

// Ensure re-apply spawn when entering VR (Quest sometimes resets tracking origin)
renderer.xr.addEventListener('sessionstart', ()=>{
  Bus.log('XR session start');
  setTimeout(()=>doSpawn(), 120);
});
renderer.xr.addEventListener('sessionend', ()=> Bus.log('XR session end'));

// ---------------- HUD buttons ----------------
$('enterVr')?.addEventListener('click', async ()=>{
  try{
    if (renderer.xr.isPresenting) return;
    if (!navigator.xr) throw new Error('WebXR not available');
    const s = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor','bounded-floor','hand-tracking','layers']
    });
    await renderer.xr.setSession(s);
  }catch(e){
    Bus.log(`Enter VR failed: ${e?.message || e}`);
  }
});

$('resetSpawn')?.addEventListener('click', ()=> doSpawn());
$('hardReload')?.addEventListener('click', ()=> location.reload());

$('nukeCache')?.addEventListener('click', async ()=>{
  try{
    if ('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
    }
    if ('caches' in window){
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
    }
    Bus.log('NUKE DONE ✅');
  }catch(e){
    Bus.log(`NUKE FAIL: ${e?.message || e}`);
  }
});

$('probePaths')?.addEventListener('click', async ()=>{
  const paths = ['./index.js','./js/scarlett1/world.js'];
  for (const p of paths){
    try{
      const r = await fetch(p, { cache:'no-store' });
      Bus.log(`probe ${p} status=${r.status}`);
    }catch(e){
      Bus.log(`probe ${p} FAIL`);
    }
  }
});

// Avatar buttons are kept for your existing manager if present in your repo build.
// If you want, wire these to your actual avatar module.
$('avMale')?.addEventListener('click', ()=> window.spawnAvatar?.('male'));
$('avFemale')?.addEventListener('click', ()=> window.spawnAvatar?.('female'));
$('avNinja')?.addEventListener('click', ()=> window.spawnAvatar?.('ninja'));
$('avCombat')?.addEventListener('click', ()=> window.spawnAvatar?.('combat'));
$('avClear')?.addEventListener('click', ()=> window.clearAvatar?.());

// ---------------- animation loop (dt clamp to reduce VR nausea) ----------------
let lastT = performance.now();
renderer.setAnimationLoop(()=>{
  const now = performance.now();
  const dt = Math.min((now - lastT)/1000, 0.02); // clamp tighter than before
  lastT = now;

  readAxes();
  applyLocomotion(dt);
  updatePinch();
  worldUpdate?.(dt);

  renderer.render(scene, camera);
});
