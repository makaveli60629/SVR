import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { XRButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRButton.js';
import { XRControllerModelFactory } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRHandModelFactory.js';
import { init as initWorld } from './js/scarlett1/world.js';

export const Spine = (() => {
  const S = {
    diag:null,
    scene:null,
    camera:null,
    rig:null,
    renderer:null,
    clock:null,
    xrButtonEl:null,

    controller0:null, controller1:null,
    xrSpawn: { pos:new THREE.Vector3(0,0,14.5), yaw: Math.PI },

    forceSpawnT: 0,
    worldUpdates: [],
    teleportSurfaces: [],
  };

  const isXR=()=>!!(S.renderer && S.renderer.xr && S.renderer.xr.isPresenting);

  function assertSingleInstance(){
    if (window.__SCARLETT_SPINE_LOCK__) throw new Error('Duplicate spine init blocked');
    window.__SCARLETT_SPINE_LOCK__ = true;
  }

  function resize(){
    if(!S.renderer || !S.camera) return;
    S.camera.aspect = window.innerWidth / window.innerHeight;
    S.camera.updateProjectionMatrix();
    S.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function setXRSpawn(pos, yaw=0){
    S.xrSpawn.pos.copy(pos);
    S.xrSpawn.yaw = yaw;
    S.diag?.log?.(`[spawn] set (${pos.x.toFixed(2)},${pos.y.toFixed(2)},${pos.z.toFixed(2)}) yaw=${yaw.toFixed(2)}`);
  }

  function applySpawn(){
    // Move RIG (not camera)
    S.rig.position.set(S.xrSpawn.pos.x, 0, S.xrSpawn.pos.z);
    S.rig.rotation.set(0, S.xrSpawn.yaw, 0);
  }

  function mountXR(){
    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    S.controller0 = S.renderer.xr.getController(0);
    S.controller1 = S.renderer.xr.getController(1);
    S.scene.add(S.controller0);
    S.scene.add(S.controller1);

    const g0 = S.renderer.xr.getControllerGrip(0);
    g0.add(controllerModelFactory.createControllerModel(g0));
    S.scene.add(g0);

    const g1 = S.renderer.xr.getControllerGrip(1);
    g1.add(controllerModelFactory.createControllerModel(g1));
    S.scene.add(g1);

    const h0 = S.renderer.xr.getHand(0);
    h0.add(handModelFactory.createHandModel(h0, 'mesh'));
    S.scene.add(h0);

    const h1 = S.renderer.xr.getHand(1);
    h1.add(handModelFactory.createHandModel(h1, 'mesh'));
    S.scene.add(h1);

    S.diag?.log?.('[xr] hands+controllers mounted ✅');
  }

  function animate(){
    const dt = S.clock.getDelta();

    // Force spawn repeatedly right after XR starts
    if (isXR() && S.forceSpawnT > 0){
      applySpawn();
      S.forceSpawnT -= dt;
    }

    for (const fn of S.worldUpdates){
      try{ fn(dt); }catch{}
    }

    S.renderer.render(S.scene, S.camera);
  }

  async function start({ diag } = {}){
    S.diag = diag;

    assertSingleInstance();

    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 900);

    S.rig = new THREE.Group();
    S.scene.add(S.rig);
    S.rig.add(S.camera);

    S.renderer = new THREE.WebGLRenderer({ antialias:true });
    S.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    S.renderer.setSize(window.innerWidth, window.innerHeight);
    S.renderer.xr.enabled = true;
    document.body.appendChild(S.renderer.domElement);
    window.__SCARLETT_RENDERER__ = S.renderer;

    S.clock = new THREE.Clock();
    window.addEventListener('resize', resize);

    try{ mountXR(); }catch(e){ S.diag?.warn?.('[xr] mount failed: ' + (e?.message||e)); }

    // WORLD INIT
    const world = await initWorld({
      THREE,
      scene: S.scene,
      camera: S.camera,
      rig: S.rig,
      renderer: S.renderer,
      setXRSpawn: (pos,yaw)=>setXRSpawn(pos,yaw),
      log: (m)=>S.diag?.log?.(m) || console.log(m)
    });

    S.worldUpdates = Array.isArray(world?.updates) ? world.updates : [];
    S.teleportSurfaces = Array.isArray(world?.teleportSurfaces) ? world.teleportSurfaces : [];

    // XR EVENTS
    S.renderer.xr.addEventListener('sessionstart', ()=>{
      S.diag?.log?.('[xr] sessionstart ✅');

      // If world gave us a spawn globally, use it.
      const g = window.__SCARLETT_SPAWN__;
      if (g?.pos) setXRSpawn(g.pos, g.yaw||0);

      // Force spawn for 2 seconds to defeat XR origin overrides
      S.forceSpawnT = 2.0;

      // Log before/after quickly
      S.diag?.log?.(`[rig] before ${S.rig.position.x.toFixed(2)},${S.rig.position.z.toFixed(2)}`);
      applySpawn();
      S.diag?.log?.(`[rig] after  ${S.rig.position.x.toFixed(2)},${S.rig.position.z.toFixed(2)}`);
    });

    S.renderer.xr.addEventListener('sessionend', ()=>{
      S.diag?.log?.('[xr] sessionend ✅');
      S.forceSpawnT = 0;
    });

    S.renderer.setAnimationLoop(animate);

    if (!S.xrButtonEl){
      S.xrButtonEl = XRButton.createButton(S.renderer);
      S.xrButtonEl.style.position='absolute';
      S.xrButtonEl.style.left='12px';
      S.xrButtonEl.style.bottom='12px';
      S.xrButtonEl.style.zIndex='40';
      document.body.appendChild(S.xrButtonEl);
    }

    // Global API for buttons
    window.SCARLETT = {
      enterVR: async ()=> { if (S.xrButtonEl?.tagName==='BUTTON') S.xrButtonEl.click(); },
      resetSpawn: ()=> { S.forceSpawnT = 1.2; applySpawn(); },
      getReport: ()=> [
        'Scarlett Diagnostics Report',
        'build=SPAWN_FORCE_2S',
        'time=' + new Date().toISOString(),
        'href=' + location.href,
        'xr=' + (isXR() ? 'true' : 'false'),
        'spawn=' + `${S.xrSpawn.pos.x.toFixed(2)},${S.xrSpawn.pos.z.toFixed(2)}`,
        'rig=' + `${S.rig.position.x.toFixed(2)},${S.rig.position.z.toFixed(2)}`
      ].join('\n')
    };

    S.diag?.log?.('[spine] started ✅');
  }

  return { start };
})();
