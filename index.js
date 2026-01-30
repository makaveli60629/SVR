/**
 * ScarlettVR Poker — Permanent Spine (single entry)
 * Root is stable. World lives in /js/scarlett1/world.js
 * Includes: HUD buttons + Android touch joystick.
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const logEl = $('log');
const canvas = $('xr-canvas');
const hud = $('hud');

function log(msg){
  const line = String(msg ?? '');
  logEl.textContent += `\n${line}`;
  logEl.scrollTop = logEl.scrollHeight;
  console.log(line);
}

function hardReload(){
  // Bust SW + caches without breaking normal hosting.
  try { if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())); } catch {}
  try { if (window.caches) caches.keys().then(keys => keys.forEach(k => caches.delete(k))); } catch {}
  location.reload(true);
}

function copyReport(){
  const txt = logEl.textContent;
  if (!navigator.clipboard){
    // fallback
    const ta = document.createElement('textarea');
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return;
  }
  navigator.clipboard.writeText(txt).catch(()=>{});
}

/** Simple touch joystick (left stick) */
function createTouchStick(stickEl){
  const knob = stickEl.querySelector('.knob');
  const radius = 52; // px travel
  let active = false;
  let origin = {x:0,y:0};
  let value = {x:0,y:0};

  function setKnob(x,y){
    knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }
  function setValueFromDelta(dx,dy){
    const len = Math.hypot(dx,dy);
    const clamped = Math.min(radius, len || 0);
    const nx = len ? (dx/len) : 0;
    const ny = len ? (dy/len) : 0;
    const px = nx * clamped;
    const py = ny * clamped;
    setKnob(px, py);
    value.x = px / radius;     // -1..1
    value.y = py / radius;     // -1..1
  }
  function reset(){
    value.x = 0; value.y = 0;
    setKnob(0,0);
  }

  stickEl.addEventListener('pointerdown', (e)=>{
    active = true;
    stickEl.setPointerCapture(e.pointerId);
    origin = {x: e.clientX, y: e.clientY};
    setValueFromDelta(0,0);
  });

  stickEl.addEventListener('pointermove', (e)=>{
    if(!active) return;
    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    setValueFromDelta(dx, dy);
  });

  stickEl.addEventListener('pointerup', ()=>{
    active = false;
    reset();
  });
  stickEl.addEventListener('pointercancel', ()=>{
    active = false;
    reset();
  });

  return () => ({...value});
}

async function main(){
  log('[boot] html loaded ✅');

  // Buttons (wire early so you can always debug)
  $('btn-copy').addEventListener('click', ()=>{ copyReport(); log('[ui] report copied ✅'); });
  $('btn-reload').addEventListener('click', ()=>{ log('[ui] hard reload…'); hardReload(); });
  $('btn-hide').addEventListener('click', ()=>{ hud.style.display='none'; });
  $('btn-show').addEventListener('click', ()=>{ hud.style.display='flex'; });

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.xr.enabled = true;
  log('[spine] renderer created ✅');

  // Scene + camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.05, 200);
  camera.position.set(0, 1.6, 6);

  // Load world module
  let world;
  try{
    world = await import('./js/scarlett1/world.js');
    log('[spine] world module loaded ✅ (/js/scarlett1/world.js)');
  }catch(err){
    log('[boot] world import failed ❌ ' + (err?.message || err));
    throw err;
  }

  // Init world
  const res = await world.init({ THREE, scene, camera, log });
  const updates = (res && Array.isArray(res.updates)) ? res.updates : [];
  log('[world] ready ✅');

  // Touch joystick (mobile)
  const getStick = createTouchStick(document.getElementById('stick-left'));
  log('[input] touch joystick ready ✅');

  // Movement parameters
  const moveSpeed = 2.2; // meters/sec
  const up = new THREE.Vector3(0,1,0);
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();

  function step(dt){
    // Joystick move (only non-XR or when not presenting)
    const v = getStick();
    const mx = v.x;
    const my = v.y;

    if (Math.abs(mx) > 0.01 || Math.abs(my) > 0.01){
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      fwd.normalize();
      right.crossVectors(fwd, up).normalize(); // right-handed
      move.set(0,0,0);
      move.addScaledVector(fwd, -my); // up on stick = forward
      move.addScaledVector(right, mx);
      if (move.lengthSq() > 0.0001){
        move.normalize().multiplyScalar(moveSpeed * dt);
        camera.position.add(move);
      }
    }

    for (const fn of updates) fn(dt);
    renderer.render(scene, camera);
  }

  // Animation loop
  let last = performance.now();
  renderer.setAnimationLoop(()=>{
    const now = performance.now();
    const dt = Math.min(0.05, (now - last)/1000);
    last = now;
    step(dt);
  });

  // Enter VR
  $('btn-enter-vr').addEventListener('click', async ()=>{
    try{
      if (!navigator.xr) { log('[xr] WebXR not available ❌'); return; }
      const ok = await navigator.xr.isSessionSupported('immersive-vr');
      if (!ok) { log('[xr] immersive-vr not supported ❌'); return; }
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor','bounded-floor','hand-tracking'] });
      renderer.xr.setSession(session);
      log('[xr] session started ✅');
    }catch(e){
      log('[xr] failed ❌ ' + (e?.message || e));
    }
  });

  // Reset spawn
  $('btn-reset').addEventListener('click', ()=>{
    camera.position.set(0, 1.6, 6);
    camera.lookAt(0, 1.4, 0);
    log('[ui] spawn reset ✅');
  });

  addEventListener('resize', ()=>{
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
  });

  log('[boot] JS LOADED ✅');
}

main().catch(err=>{
  log('[fatal] ' + (err?.stack || err?.message || err));
});
