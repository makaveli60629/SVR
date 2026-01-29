import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js';

/**
 * SAFE MODULAR SPINE (SCARLETT1)
 * - Core renderer/camera
 * - Diagnostics HUD
 * - Safe module runner: each module can fail without black-screening the whole app
 */

const BUILD = 'SCARLETT1_SAFE_MODULAR_SPINE_V1';

function $(id){ return document.getElementById(id); }

function makeLogger(){
  const logEl = $('log');
  const lines = [];
  const t0 = performance.now();
  const log = (msg)=>{
    const t = ((performance.now()-t0)/1000).toFixed(3);
    const line = `[${t}] ${msg}`;
    lines.push(line);
    if (lines.length>220) lines.shift();
    logEl.textContent = lines.join('\n');
  };
  const dump = ()=> lines.join('\n');
  return { log, dump };
}

function attachUI({ renderer, resetFn, logger, audioCtl }){
  $('btnEnterVR').onclick = ()=>{
    // Use three's VRButton for broad support
    const btn = VRButton.createButton(renderer);
    btn.style.position = 'fixed';
    btn.style.left = '10px';
    btn.style.bottom = '10px';
    btn.style.zIndex = 20;
    document.body.appendChild(btn);
    logger.log('[ui] VRButton injected');
  };
  $('btnReset').onclick = ()=> resetFn();
  $('btnCopy').onclick = async ()=>{
    try{ await navigator.clipboard.writeText(logger.dump()); logger.log('[ui] report copied ✅'); }
    catch(e){ logger.log('[ui] copy failed: '+(e?.message||e)); }
  };
  $('btnHide').onclick = ()=>{
    const hud = $('hud');
    hud.style.display = (hud.style.display==='none') ? 'block' : 'none';
  };

  $('btnMusicOn').onclick = ()=> audioCtl.on();
  $('btnMusicOff').onclick = ()=> audioCtl.off();
}

function makeAudio(logger){
  const audio = new Audio();
  audio.loop = true;
  audio.volume = 0.65;
  // Safe default stream (user can swap later)
  audio.src = 'https://icecast.radiofrance.fr/fip-hifi.aac';
  const on = async ()=>{
    try{ await audio.play(); logger.log('[audio] on ✅'); }
    catch(e){ logger.log('[audio] play blocked (tap screen then try again)'); }
  };
  const off = ()=>{ audio.pause(); logger.log('[audio] off'); };
  return { on, off, audio };
}

async function safeImport(path, logger){
  try{
    const m = await import(path);
    logger.log(`[mod] loaded: ${path}`);
    return { ok:true, m };
  }catch(e){
    logger.log(`[mod] FAIL: ${path} :: ${(e && e.message) ? e.message : e}`);
    return { ok:false, err:e };
  }
}

async function runModules(ctx, logger){
  // List modules here (easy to add/remove). Each exports init(ctx)-> {updates?:fn[], interactables?:obj[]}
  const list = [
    './world.js',
    './modules/storePad.js',
    './modules/musicHint.js',
    './modules/pokerHoverDemo.js'
  ];

  const state = { updates:[], interactables:[], hooks:{} };

  for (const p of list){
    const r = await safeImport(p, logger);
    if (!r.ok) continue;
    if (typeof r.m.init === 'function'){
      try{
        const out = await r.m.init(ctx);
        if (out?.updates) state.updates.push(...out.updates);
        if (out?.interactables) state.interactables.push(...out.interactables);
        if (out?.hooks) Object.assign(state.hooks, out.hooks);
        logger.log(`[mod] init ok: ${p}`);
      }catch(e){
        logger.log(`[mod] init FAIL: ${p} :: ${(e && e.message) ? e.message : e}`);
      }
    }else{
      logger.log(`[mod] no init(): ${p}`);
    }
  }
  return state;
}

function makeRayClick({ camera, scene, logger, interactables, hooks }){
  const ray = new THREE.Raycaster();
  const pt = new THREE.Vector2(0,0); // center tap
  const onTap = ()=>{
    try{
      ray.setFromCamera(pt, camera);
      const hits = ray.intersectObjects(interactables, true);
      if (!hits.length) return;
      const obj = hits[0].object;
      const name = obj.name || obj.parent?.name || 'object';
      logger.log(`[tap] hit: ${name}`);
      // module hook by name
      if (name === 'STORE_PAD' && hooks?.onStorePad) hooks.onStorePad();
    }catch(e){
      logger.log('[tap] error: '+(e?.message||e));
    }
  };
  window.addEventListener('pointerdown', onTap, { passive:true });
}

export async function boot(){
  const { log } = makeLogger();
  log('=== SCARLETT SAFE MODULAR SPINE ===');
  log('build='+BUILD);
  log('href='+location.href);
  log('secureContext='+(window.isSecureContext));
  log('ua='+navigator.userAgent);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Scene & camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000006);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 600);
  camera.position.set(0, 1.6, 14);

  const audioCtl = makeAudio({ log });

  const resetFn = async ()=>{
    try{
      // Clear scene safely (preserve camera)
      while(scene.children.length) scene.remove(scene.children[0]);
      log('[reset] scene cleared');
      // Re-run modules
      const ctx = { THREE, scene, camera, renderer, log, audioCtl };
      const state = await runModules(ctx, { log });
      makeRayClick({ camera, scene, logger:{log}, interactables: state.interactables, hooks: state.hooks });
      active.updates = state.updates;
      log('[reset] ready ✅');
    }catch(e){
      log('[reset] FAIL: '+(e?.message||e));
    }
  };

  attachUI({ renderer, resetFn, logger:{log, dump:()=>document.getElementById('log').textContent}, audioCtl });

  // Initial boot
  const ctx = { THREE, scene, camera, renderer, log, audioCtl };
  const active = { updates:[] };
  const state = await runModules(ctx, { log });
  makeRayClick({ camera, scene, logger:{log}, interactables: state.interactables, hooks: state.hooks });
  active.updates = state.updates;

  // Render loop
  let last = performance.now();
  renderer.setAnimationLoop(()=>{
    const now = performance.now();
    const dt = Math.min(0.05, (now-last)/1000);
    last = now;
    for (const u of active.updates) { try{ u(dt); }catch{} }
    renderer.render(scene, camera);
  });

  // Resize
  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  log('[boot] renderer mounted ✅');
  log('[boot] ready ✅');
}
