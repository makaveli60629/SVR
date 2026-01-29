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
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 300);
  return { scene, camera };
}

function setupResize(camera, renderer){
  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function setupAndroidJoysticks(camera){
  // Simple touch joysticks: left = move, right = turn
  const left = document.getElementById('joyL');
  const right = document.getElementById('joyR');
  if (!left || !right) return { update:()=>{} };

  const state = {
    moveX:0, moveY:0, turnX:0,
    activeL:false, activeR:false,
    baseL:null, baseR:null
  };

  function bind(el, side){
    let pid = null;
    el.addEventListener('pointerdown', (e)=>{
      pid = e.pointerId;
      el.setPointerCapture(pid);
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * 2 - 1;
      const y = (e.clientY - rect.top) / rect.height * 2 - 1;
      if (side==='L'){ state.activeL=true; state.baseL={x,y}; }
      else { state.activeR=true; state.baseR={x,y}; }
    });
    el.addEventListener('pointermove', (e)=>{
      if (pid !== e.pointerId) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * 2 - 1;
      const y = (e.clientY - rect.top) / rect.height * 2 - 1;
      if (side==='L' && state.activeL){
        state.moveX = Math.max(-1, Math.min(1, x));
        state.moveY = Math.max(-1, Math.min(1, -y));
      }
      if (side==='R' && state.activeR){
        state.turnX = Math.max(-1, Math.min(1, x));
      }
    });
    function end(e){
      if (pid !== e.pointerId) return;
      if (side==='L'){ state.activeL=false; state.moveX=0; state.moveY=0; }
      else { state.activeR=false; state.turnX=0; }
      pid = null;
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  bind(left, 'L');
  bind(right, 'R');

  const v = new THREE.Vector3();
  return {
    update:(dt)=>{
      const speed = 2.2; // m/s
      // yaw turn
      camera.rotation.y -= state.turnX * dt * 1.6;
      // forward vector
      camera.getWorldDirection(v);
      v.y = 0; v.normalize();
      const rightV = new THREE.Vector3().crossVectors(v, new THREE.Vector3(0,1,0)).normalize();
      camera.position.addScaledVector(v, state.moveY * dt * speed);
      camera.position.addScaledVector(rightV, state.moveX * dt * speed);
    }
  };
}

async function start(){
  setStatus('(starting...)');
  diag('=== SCARLETT SAFE BOOT ===');
  diag('href='+location.href);
  diag('ua='+navigator.userAgent);

  try{
    const renderer = setupRenderer();
    const { scene, camera } = setupScene();
    setupResize(camera, renderer);

    const world = initWorld({ scene, camera, renderer, log:diag });
    const joy = setupAndroidJoysticks(camera);

    // Enter VR
    const btnVR = document.getElementById('btnVR');
    if (btnVR){
      btnVR.addEventListener('click', async ()=>{
        try{
          await renderer.xr.setSession(await navigator.xr.requestSession('immersive-vr', { optionalFeatures:['local-floor','bounded-floor','hand-tracking','layers'] }));
        }catch(e){
          diag('[xr] failed: '+e.message);
        }
      });
    }

    // Reset
    const btnReset = document.getElementById('btnReset');
    if (btnReset){
      btnReset.addEventListener('click', ()=>{
        camera.position.set(0,1.6,6);
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
