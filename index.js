import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { initWorld } from './js/scarlett1/world.js';

function diag(msg){
  console.log(msg);
  const box = document.getElementById('diagLog');
  if (box) box.textContent += msg + "\n";
}
function setStatus(s){
  const st = document.getElementById('diagStatus');
  if (st) st.textContent = s;
}

function setupRenderer(){
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  return renderer;
}
function setupScene(){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000006);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 500);
  return { scene, camera };
}
function setupResize(camera, renderer){
  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Android joysticks
function setupAndroidJoysticks(camera){
  const left = document.getElementById('joyL');
  const right = document.getElementById('joyR');
  if (!left || !right) return { update:()=>{} };

  const state = { moveX:0, moveY:0, turnX:0 };
  function bind(el, side){
    let pid=null;
    el.addEventListener('pointerdown', (e)=>{
      pid=e.pointerId; el.setPointerCapture(pid);
    });
    el.addEventListener('pointermove', (e)=>{
      if (pid!==e.pointerId) return;
      const r=el.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width*2-1;
      const y=(e.clientY-r.top)/r.height*2-1;
      if (side==='L'){ state.moveX=Math.max(-1,Math.min(1,x)); state.moveY=Math.max(-1,Math.min(1,-y)); }
      else { state.turnX=Math.max(-1,Math.min(1,x)); }
    });
    const end=(e)=>{ if(pid!==e.pointerId) return; pid=null; if(side==='L'){state.moveX=0;state.moveY=0;} else {state.turnX=0;} };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }
  bind(left,'L'); bind(right,'R');

  const fwd = new THREE.Vector3();
  const rightV = new THREE.Vector3();
  const up = new THREE.Vector3(0,1,0);
  return {
    update:(dt)=>{
      const speed = 2.4;
      camera.rotation.y -= state.turnX * dt * 1.7;
      camera.getWorldDirection(fwd);
      fwd.y=0; fwd.normalize();
      rightV.crossVectors(fwd, up).normalize();
      camera.position.addScaledVector(fwd, state.moveY*dt*speed);
      camera.position.addScaledVector(rightV, state.moveX*dt*speed);
    }
  };
}

// Raycast interaction
function setupInteraction(renderer, camera, scene, getInteractables, onStorePad){
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(0,0);

  function cast(){
    const list = getInteractables();
    if (!list || !list.length) return;
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(list, true);
    if (hits && hits.length){
      const hit = hits[0].object;
      if (hit.name === 'STORE_PAD' || hit.parent?.name === 'STORE_PAD'){
        onStorePad();
        diag('[store] pad activated');
      }
    }
  }

  window.addEventListener('pointerdown', (e)=>{
    // only treat quick tap on scene canvas area as interact
    cast();
  }, { passive:true });

  // XR controller select
  const controller = renderer.xr.getController(0);
  controller.addEventListener('select', cast);
  scene.add(controller);
}

function setupMusic(){
  const a = document.getElementById('bgMusic');
  const on = document.getElementById('musicPlay');
  const off = document.getElementById('musicStop');
  if (!a || !on || !off) return;
  const DEFAULT_STREAM = "https://icecast.radiofrance.fr/fip-hifi.aac";
  a.src = DEFAULT_STREAM;
  a.volume = 0.55;
  on.addEventListener('click', async ()=>{ try{ await a.play(); diag('[music] playing'); }catch(e){ diag('[music] blocked'); }});
  off.addEventListener('click', ()=>{ a.pause(); diag('[music] stopped'); });
}

async function start(){
  setStatus('(starting...)');
  diag('=== SCARLETT FULL RESTORE (SAFE) ===');
  diag('href='+location.href);
  diag('ua='+navigator.userAgent);

  try{
    const renderer = setupRenderer();
    const { scene, camera } = setupScene();
    setupResize(camera, renderer);

    // World (never blocks boot; catch errors inside)
    let world;
    try{
      world = initWorld({ scene, camera, renderer, log:diag });
      diag('[boot] world init ok ✅');
    }catch(e){
      diag('[boot] world init FAILED: '+(e?.message||e));
      world = { updates:[], interactables:[], onStorePad:()=>{} };
    }

    const joy = setupAndroidJoysticks(camera);
    setupInteraction(renderer, camera, scene, ()=>world.interactables||[], ()=>world.onStorePad && world.onStorePad());
    setupMusic();

    // Enter VR
    const btnVR = document.getElementById('btnVR');
    if (btnVR){
      btnVR.addEventListener('click', async ()=>{
        try{
          const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures:['local-floor','bounded-floor','hand-tracking'] });
          await renderer.xr.setSession(s);
          diag('[xr] session started');
        }catch(e){
          diag('[xr] failed: '+e.message);
        }
      });
    }

    // Reset
    const btnReset = document.getElementById('btnReset');
    if (btnReset){
      btnReset.addEventListener('click', ()=>{
        camera.position.set(0,1.6,14);
        camera.rotation.set(0,0,0);
        diag('[ui] reset');
      });
    }

    setStatus('READY ✅');
    diag('[boot] ready ✅');

    let last = performance.now();
    renderer.setAnimationLoop(()=>{
      const now = performance.now();
      const dt = Math.min(0.05, (now-last)/1000);
      last = now;

      joy.update(dt);
      if (world?.updates) for (const u of world.updates) u(dt);
      renderer.render(scene, camera);
    });

  }catch(e){
    setStatus('BOOT ERROR');
    diag('[fatal] '+(e?.stack || e?.message || String(e)));
  }
}
start();
