import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { makeLogger } from './modules/diagnosticsMini.js';
import { bindVirtualJoysticks } from './modules/androidControls.js';
import { buildWorld } from './world.js';
import { nukeToDivotOnly } from './modules/divotOnly.js';
import { attachXRControllerLocomotion } from './xrControllerLocomotion.js';

console.log("✅ SCARLETT1 index.js loaded");
document.title = "SCARLETT1 ACTIVE";

const logEl = document.getElementById('log');
const { log, report } = makeLogger(logEl);

log("=== SCARLETT DIAGNOSTICS ===");
log("href=" + location.href);
log("secureContext=" + (window.isSecureContext ? "true":"false"));
log("ua=" + navigator.userAgent);
log("touch=" + ('ontouchstart' in window) + " maxTouchPoints=" + (navigator.maxTouchPoints||0));
log("xr=" + (!!navigator.xr));

const btnVR = document.getElementById('btnVR');
const btnReset = document.getElementById('btnReset');
const btnDivot = document.getElementById('btnDivot');
const btnCopy = document.getElementById('btnCopy');
const btnHide = document.getElementById('btnHide');
const hud = document.getElementById('hud');

btnHide?.addEventListener('click', ()=> hud.style.display = (hud.style.display==='none'?'block':'none'));
btnCopy?.addEventListener('click', async ()=>{
  try { await navigator.clipboard.writeText(report()); } catch {}
  log("[hud] report copied");
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050509);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 1000);
camera.position.set(0, 1.6, 10);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

log("[boot] renderer mounted ✅");

// rig for locomotion
const rig = new THREE.Group();
rig.name = "Rig";
rig.add(camera);
scene.add(rig);

const world = buildWorld(scene, { holeRadius: 6, outerRadius: 60, pitY: -2.0, wallDepth: 14.0 });
log("[boot] world built ✅");

// Android joysticks move rig
let moveX=0, moveY=0, turnX=0;
bindVirtualJoysticks({
  onMove:(x,y)=>{ moveX=x; moveY=y; },
  onTurn:(x,y)=>{ turnX=x; }
});
log("[android] joystick visible ✅");

let xrMove = null;
btnVR?.addEventListener('click', async ()=>{
  try{
    await renderer.xr.setSession(await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures:['local-floor','bounded-floor','hand-tracking','layers']
    }));
  }catch(e){
    log("[vr] failed: " + e.message);
  }
});

btnReset?.addEventListener('click', ()=>{
  rig.position.set(0,0,0);
  rig.rotation.set(0,0,0);
  log("[boot] reset");
});

btnDivot?.addEventListener('click', ()=>{
  nukeToDivotOnly(scene, { radius: 9.0, depth: 24.0, floorRadius: 60.0 });
  log("[world] DIVOT ONLY enabled");
});

renderer.xr.addEventListener('sessionstart', ()=>{
  xrMove = attachXRControllerLocomotion(renderer, rig, camera, (m)=>log(m));
  log("[xr] session started ✅");
});

renderer.xr.addEventListener('sessionend', ()=>{
  xrMove = null;
  log("[xr] session ended");
});

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let last = performance.now();
function animate(now){
  const dt = Math.min(0.05, (now-last)/1000);
  last = now;

  // Non-VR movement
  const speed = 2.0;
  const turnSpeed = 1.6;

  // forward/back is -moveY
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.y = 0; dir.normalize();
  const right = new THREE.Vector3().copy(dir).cross(camera.up).normalize();

  rig.position.addScaledVector(dir, -moveY * speed * dt);
  rig.position.addScaledVector(right, moveX * speed * dt);
  rig.rotation.y -= turnX * turnSpeed * dt;

  // XR controller movement
  xrMove?.update(dt);

  // World animation hooks (table hologram, etc.)
  if (world?.updates) { for (const fn of world.updates) { try { fn(dt); } catch(e){} } }

  renderer.render(scene, camera);
  renderer.setAnimationLoop(animate);
}
renderer.setAnimationLoop(animate);
log("[boot] animation loop ✅");
