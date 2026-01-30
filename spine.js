/**
 * spine.js — PERMANENT ROOT SPINE (STABLE XR SPAWN)
 * Fixes:
 *  - Quest shaky/spawn-on-table: move RIG for spawn, NOT camera
 *  - Mount controllers/hands on XR session start (cleaner)
 *  - Keeps single animation loop
 *
 * Scarlett1 world contract:
 *   /js/scarlett1/world.js exports async function init(ctx)
 *   returns { updates:[fn(dt)], interactables:[...], spawn?: { pos:[x,y,z], yaw?:number } }
 *
 * ONLY EDIT /js/scarlett1/* from now on.
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { XRButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRButton.js';
import { XRControllerModelFactory } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRHandModelFactory.js';
import { init as initWorld } from './js/scarlett1/world.js';

export const Spine = (() => {
  const S = {
    diag: null,
    scene: null,
    camera: null,
    rig: null,
    renderer: null,
    clock: null,
    xrButtonEl: null,

    worldUpdates: [],
    worldInteractables: [],

    controllersMounted: false,
    controller1: null,
    controller2: null,
    grip1: null,
    grip2: null,
    hand1: null,
    hand2: null,

    spawn: { pos: [0, 1.6, 14], yaw: Math.PI }, // default: facing inward
  };

  function nowISO(){ return new Date().toISOString(); }

  function assertSingleInstance() {
    if (window.__SCARLETT_SPINE_LOCK__) {
      console.warn('🛑 Duplicate spine init blocked.');
      throw new Error('Duplicate spine init blocked (blink prevention)');
    }
    window.__SCARLETT_SPINE_LOCK__ = true;
  }

  function resize() {
    if (!S.renderer || !S.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    S.camera.aspect = w / h;
    S.camera.updateProjectionMatrix();
    S.renderer.setSize(w, h);
  }

  function disposeRendererIfAny() {
    if (window.__SCARLETT_RENDERER__) {
      try {
        window.__SCARLETT_RENDERER__.setAnimationLoop(null);
        window.__SCARLETT_RENDERER__.dispose();
        const oldCanvas = window.__SCARLETT_RENDERER__.domElement;
        if (oldCanvas?.parentNode) oldCanvas.parentNode.removeChild(oldCanvas);
      } catch {}
      window.__SCARLETT_RENDERER__ = null;
    }
  }

  function applySpawn(spawn = S.spawn) {
    const [x,y,z] = spawn?.pos || S.spawn.pos;
    const yaw = (typeof spawn?.yaw === 'number') ? spawn.yaw : S.spawn.yaw;

    if (S.rig) {
      S.rig.position.set(x, y, z);
      S.rig.rotation.set(0, yaw, 0);
    }

    // Keep camera local at origin (important for XR stability)
    if (S.camera) {
      S.camera.position.set(0, 0, 0);
      S.camera.rotation.set(0, 0, 0);
    }
    S.diag?.log?.(`[spine] spawn rig -> pos(${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}) yaw(${yaw.toFixed(2)})`);
  }

  function animate() {
    const dt = S.clock.getDelta();

    for (let i = 0; i < S.worldUpdates.length; i++) {
      try { S.worldUpdates[i](dt); } catch (e) {}
    }

    S.renderer.render(S.scene, S.camera);
  }

  function mountXRHandsAndControllers() {
    if (S.controllersMounted) return;

    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    S.controller1 = S.renderer.xr.getController(0);
    S.controller2 = S.renderer.xr.getController(1);
    S.scene.add(S.controller1);
    S.scene.add(S.controller2);

    // Simple rays so you SEE controllers even without interaction
    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,-1),
    ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0xffffff });

    const ray1 = new THREE.Line(rayGeo, rayMat);
    ray1.scale.z = 4;
    S.controller1.add(ray1);

    const ray2 = new THREE.Line(rayGeo, rayMat);
    ray2.scale.z = 4;
    S.controller2.add(ray2);

    S.grip1 = S.renderer.xr.getControllerGrip(0);
    S.grip1.add(controllerModelFactory.createControllerModel(S.grip1));
    S.scene.add(S.grip1);

    S.grip2 = S.renderer.xr.getControllerGrip(1);
    S.grip2.add(controllerModelFactory.createControllerModel(S.grip2));
    S.scene.add(S.grip2);

    S.hand1 = S.renderer.xr.getHand(0);
    S.hand1.add(handModelFactory.createHandModel(S.hand1, 'mesh'));
    S.scene.add(S.hand1);

    S.hand2 = S.renderer.xr.getHand(1);
    S.hand2.add(handModelFactory.createHandModel(S.hand2, 'mesh'));
    S.scene.add(S.hand2);

    S.controllersMounted = true;
    S.diag?.log?.('[xr] controllers + hands mounted ✅');
  }

  function unmountXRHandsAndControllers() {
    // keep it simple: don’t hard-dispose, just mark state
    S.controllersMounted = false;
    S.diag?.log?.('[xr] session end');
  }

  async function start({ diag } = {}) {
    S.diag = diag;

    assertSingleInstance();
    disposeRendererIfAny();

    S.scene = new THREE.Scene();

    // Camera stays at origin; rig controls world spawn
    S.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);

    S.rig = new THREE.Group();
    S.scene.add(S.rig);
    S.rig.add(S.camera);

    S.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    S.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    S.renderer.setSize(window.innerWidth, window.innerHeight);
    S.renderer.xr.enabled = true;

    // Make sure canvas is behind HUD and doesn’t steal touch weirdly
    S.renderer.domElement.style.position = 'fixed';
    S.renderer.domElement.style.left = '0';
    S.renderer.domElement.style.top = '0';
    S.renderer.domElement.style.zIndex = '0';
    S.renderer.domElement.style.width = '100%';
    S.renderer.domElement.style.height = '100%';
    S.renderer.domElement.style.touchAction = 'none';

    document.body.appendChild(S.renderer.domElement);
    window.__SCARLETT_RENDERER__ = S.renderer;

    S.clock = new THREE.Clock();
    window.addEventListener('resize', resize);

    // XR mount on session start (better stability)
    S.renderer.xr.addEventListener('sessionstart', () => {
      try { mountXRHandsAndControllers(); } catch(e){ S.diag?.warn?.('[xr] mount fail: '+(e?.message||e)); }
      applySpawn(S.spawn);
    });
    S.renderer.xr.addEventListener('sessionend', () => {
      unmountXRHandsAndControllers();
    });

    const log = (m) => S.diag?.log?.(m) || console.log(m);

    // ✅ WORLD INIT
    const worldResult = await initWorld({
      THREE,
      scene: S.scene,
      camera: S.camera,
      rig: S.rig,
      renderer: S.renderer,
      log
    });

    S.worldUpdates = Array.isArray(worldResult?.updates) ? worldResult.updates : [];
    S.worldInteractables = Array.isArray(worldResult?.interactables) ? worldResult.interactables : [];

    // World can override spawn
    if (worldResult?.spawn?.pos) {
      S.spawn = {
        pos: worldResult.spawn.pos,
        yaw: (typeof worldResult.spawn.yaw === 'number') ? worldResult.spawn.yaw : S.spawn.yaw
      };
    }

    // Apply spawn for non-XR
    applySpawn(S.spawn);

    // ✅ SINGLE LOOP ONLY
    S.renderer.setAnimationLoop(animate);

    // XR button once
    if (!S.xrButtonEl) {
      S.xrButtonEl = XRButton.createButton(S.renderer);
      S.xrButtonEl.style.position = 'absolute';
      S.xrButtonEl.style.left = '12px';
      S.xrButtonEl.style.bottom = '12px';
      S.xrButtonEl.style.zIndex = '40';
      document.body.appendChild(S.xrButtonEl);
    }

    S.diag?.log?.('[spine] started ✅');
  }

  async function enterVR() {
    if (!S.renderer) throw new Error('Renderer not ready');
    if (S.xrButtonEl?.tagName === 'BUTTON') S.xrButtonEl.click();
  }

  function resetSpawn() {
    applySpawn(S.spawn);
  }

  function getReport() {
    return [
      'Scarlett Diagnostics Report',
      'build=SCARLETT_SPINE_PERMANENT_S1_WORLD_INIT',
      'time=' + nowISO(),
      'href=' + location.href,
      'ua=' + navigator.userAgent,
      'secureContext=' + (window.isSecureContext ? 'true' : 'false'),
      'xrSupported=' + ('xr' in navigator ? 'true' : 'false'),
      'xrPresenting=' + (S.renderer?.xr?.isPresenting ? 'true' : 'false'),
      'spineLock=' + (window.__SCARLETT_SPINE_LOCK__ ? 'true' : 'false'),
      'renderer=' + (S.renderer ? 'ready' : 'none'),
      'controllersMounted=' + (S.controllersMounted ? 'true' : 'false'),
      'worldUpdates=' + (S.worldUpdates?.length || 0),
      'worldInteractables=' + (S.worldInteractables?.length || 0),
    ].join('\n');
  }

  return { start, enterVR, resetSpawn, getReport };
})();
