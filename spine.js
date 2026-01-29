/**
 * spine.js — PERMANENT ROOT SPINE
 * Root owns:
 *  - renderer
 *  - XR button
 *  - single animation loop
 *
 * Scarlett1 contract:
 *   /js/scarlett1/world.js exports async function init(ctx)
 *   returns { updates:[fn(dt)], interactables:[...] }
 *
 * ONLY EDIT /js/scarlett1/* from now on.
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { XRButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRButton.js';

// ✅ Root spine lives in /, so this is correct:
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
    handsMounted: false,
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

  function animate() {
    const dt = S.clock.getDelta();
    for (let i = 0; i < S.worldUpdates.length; i++) {
      try { S.worldUpdates[i](dt); } catch {}
    }
    S.renderer.render(S.scene, S.camera);
  }

  // ✅ Mount XR hands/controllers ONLY after session starts
  async function mountXRHandsAndControllersOnce() {
    if (S.handsMounted) return;
    S.handsMounted = true;

    try {
      const { XRControllerModelFactory } = await import(
        'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js'
      );
      const { XRHandModelFactory } = await import(
        'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRHandModelFactory.js'
      );

      const controllerModelFactory = new XRControllerModelFactory();
      const handModelFactory = new XRHandModelFactory();

      const c1 = S.renderer.xr.getController(0);
      const c2 = S.renderer.xr.getController(1);
      S.scene.add(c1);
      S.scene.add(c2);

      const rayGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0,0,0),
        new THREE.Vector3(0,0,-1),
      ]);
      const rayMat = new THREE.LineBasicMaterial({ color: 0xffffff });

      const r1 = new THREE.Line(rayGeo, rayMat); r1.scale.z = 4; c1.add(r1);
      const r2 = new THREE.Line(rayGeo, rayMat); r2.scale.z = 4; c2.add(r2);

      const g1 = S.renderer.xr.getControllerGrip(0);
      g1.add(controllerModelFactory.createControllerModel(g1));
      S.scene.add(g1);

      const g2 = S.renderer.xr.getControllerGrip(1);
      g2.add(controllerModelFactory.createControllerModel(g2));
      S.scene.add(g2);

      const h1 = S.renderer.xr.getHand(0);
      h1.add(handModelFactory.createHandModel(h1, 'mesh'));
      S.scene.add(h1);

      const h2 = S.renderer.xr.getHand(1);
      h2.add(handModelFactory.createHandModel(h2, 'mesh'));
      S.scene.add(h2);

      S.diag?.log?.('[xr] controllers + hands mounted ✅');
    } catch (e) {
      S.diag?.warn?.('[xr] mount failed: ' + (e?.message || e));
    }
  }

  async function start({ diag } = {}) {
    S.diag = diag;

    assertSingleInstance();
    disposeRendererIfAny();

    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);

    S.rig = new THREE.Group();
    S.scene.add(S.rig);
    S.rig.add(S.camera);

    S.renderer = new THREE.WebGLRenderer({ antialias: true });
    S.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    S.renderer.setSize(window.innerWidth, window.innerHeight);
    S.renderer.xr.enabled = true;

    document.body.appendChild(S.renderer.domElement);
    window.__SCARLETT_RENDERER__ = S.renderer;

    S.clock = new THREE.Clock();
    window.addEventListener('resize', resize);

    // ✅ WORLD INIT FIRST (so you see lobby + joystick on Android immediately)
    const log = (m) => S.diag?.log?.(m) || console.log(m);
    const worldResult = await initWorld({ THREE, scene: S.scene, camera: S.camera, log });

    S.worldUpdates = Array.isArray(worldResult?.updates) ? worldResult.updates : [];
    S.worldInteractables = Array.isArray(worldResult?.interactables) ? worldResult.interactables : [];

    // ✅ SINGLE LOOP ONLY
    S.renderer.setAnimationLoop(animate);

    // ✅ XR Button
    if (!S.xrButtonEl) {
      S.xrButtonEl = XRButton.createButton(S.renderer);
      S.xrButtonEl.style.position = 'absolute';
      S.xrButtonEl.style.left = '12px';
      S.xrButtonEl.style.bottom = '12px';
      S.xrButtonEl.style.zIndex = '40';
      document.body.appendChild(S.xrButtonEl);
    }

    // ✅ When XR actually starts, then mount hands/controllers
    S.renderer.xr.addEventListener('sessionstart', () => {
      S.diag?.log?.('[xr] sessionstart');
      mountXRHandsAndControllersOnce();
    });

    S.diag?.log?.('[spine] started ✅');
  }

  async function enterVR() {
    if (!S.renderer) throw new Error('Renderer not ready');
    if (S.xrButtonEl?.tagName === 'BUTTON') S.xrButtonEl.click();
  }

  function resetSpawn() {
    S.camera.position.set(0, 1.6, 14);
    S.camera.lookAt(0, 1.4, 0);
    S.diag?.log?.('[spine] reset spawn');
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
      'spineLock=' + (window.__SCARLETT_SPINE_LOCK__ ? 'true' : 'false'),
      'renderer=' + (S.renderer ? 'ready' : 'none'),
      'worldUpdates=' + (S.worldUpdates?.length || 0),
      'worldInteractables=' + (S.worldInteractables?.length || 0),
    ].join('\n');
  }

  return { start, enterVR, resetSpawn, getReport };
})();
