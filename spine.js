/**
 * spine.js — PERMANENT ROOT SPINE
 * Owns:
 *  - renderer
 *  - XR session button
 *  - single animation loop
 *
 * Scarlett1 contract:
 *   /js/scarlett1/world.js exports async function init(ctx)
 *   returns { updates:[fn(dt)], interactables:[...] }
 *
 * ROOT IS PERMANENT — Only edit /js/scarlett1/* for world.
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
    controller1: null,
    controller2: null,
    grip1: null,
    grip2: null,
    hand1: null,
    hand2: null,
    started: false,
  };

  function nowISO(){ return new Date().toISOString(); }

  function assertSingleInstance() {
    if (window.__SCARLETT_SPINE_LOCK__) {
      console.warn('🛑 Duplicate spine init blocked.');
      throw new Error('Duplicate spine init blocked (blink prevention)');
    }
    window.__SCARLETT_SPINE_LOCK__ = true;
  }

  function log(m){ S.diag?.log?.(m); }
  function warn(m){ S.diag?.warn?.(m); }
  function error(m){ S.diag?.error?.(m); }

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
      try { S.worldUpdates[i](dt); } catch (e) {}
    }
    S.renderer.render(S.scene, S.camera);
  }

  function mountXRHandsAndControllers() {
    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    S.controller1 = S.renderer.xr.getController(0);
    S.controller2 = S.renderer.xr.getController(1);
    S.scene.add(S.controller1);
    S.scene.add(S.controller2);

    // ray lines
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

    // grips with models
    S.grip1 = S.renderer.xr.getControllerGrip(0);
    S.grip1.add(controllerModelFactory.createControllerModel(S.grip1));
    S.scene.add(S.grip1);

    S.grip2 = S.renderer.xr.getControllerGrip(1);
    S.grip2.add(controllerModelFactory.createControllerModel(S.grip2));
    S.scene.add(S.grip2);

    // hands
    S.hand1 = S.renderer.xr.getHand(0);
    S.hand1.add(handModelFactory.createHandModel(S.hand1, 'mesh'));
    S.scene.add(S.hand1);

    S.hand2 = S.renderer.xr.getHand(1);
    S.hand2.add(handModelFactory.createHandModel(S.hand2, 'mesh'));
    S.scene.add(S.hand2);

    log('[xr] controllers + hands mounted ✅');
  }

  // IMPORTANT: always move the RIG in XR (not the camera)
  function setXRSpawn(pos = new THREE.Vector3(0,0,0), yaw = 0){
    if (!S.rig) return;
    S.rig.position.copy(pos);
    S.rig.rotation.set(0, yaw, 0);
  }

  async function start({ diag } = {}) {
    S.diag = diag;

    try {
      assertSingleInstance();
    } catch (e) {
      error('[spine] ' + (e?.message || String(e)));
      throw e;
    }

    disposeRendererIfAny();

    S.scene = new THREE.Scene();

    S.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.05,
      500
    );

    // RIG holds camera in XR
    S.rig = new THREE.Group();
    S.scene.add(S.rig);
    S.rig.add(S.camera);

    // default spawn (non-xr)
    S.camera.position.set(0, 1.7, 16);
    S.camera.lookAt(0, 1.35, 0);

    // renderer
    S.renderer = new THREE.WebGLRenderer({ antialias: true });
    S.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    S.renderer.setSize(window.innerWidth, window.innerHeight);
    S.renderer.xr.enabled = true;

    document.body.appendChild(S.renderer.domElement);
    window.__SCARLETT_RENDERER__ = S.renderer;

    S.clock = new THREE.Clock();
    window.addEventListener('resize', resize);

    // XR mount (safe)
    try { mountXRHandsAndControllers(); }
    catch (e) { warn('[xr] mount failed: ' + (e?.message || String(e))); }

    // XR session hooks
    S.renderer.xr.addEventListener('sessionstart', () => {
      log('[xr] sessionstart ✅');
      // keep rig stable when entering
      // (world will likely call setXRSpawn too)
      setXRSpawn(new THREE.Vector3(0,0,16), 0);
    });

    S.renderer.xr.addEventListener('sessionend', () => {
      log('[xr] sessionend ✅');
    });

    // WORLD INIT (this was missing/incorrect before)
    log('[spine] loading world…');
    let worldResult;
    try {
      worldResult = await initWorld({
        THREE,
        scene: S.scene,
        camera: S.camera,
        rig: S.rig,
        renderer: S.renderer,
        setXRSpawn,
        log: (m)=>log(m),
      });
    } catch (e) {
      error('[world] init failed: ' + (e?.message || String(e)));
      throw e;
    }

    S.worldUpdates = Array.isArray(worldResult?.updates) ? worldResult.updates : [];
    S.worldInteractables = Array.isArray(worldResult?.interactables) ? worldResult.interactables : [];

    log(`[world] updates=${S.worldUpdates.length} interactables=${S.worldInteractables.length}`);

    // animation loop
    S.renderer.setAnimationLoop(animate);

    // XR button
    if (!S.xrButtonEl) {
      S.xrButtonEl = XRButton.createButton(S.renderer);
      S.xrButtonEl.style.position = 'absolute';
      S.xrButtonEl.style.left = '12px';
      S.xrButtonEl.style.bottom = '12px';
      S.xrButtonEl.style.zIndex = '40';
      document.body.appendChild(S.xrButtonEl);
      log('[xr] XRButton mounted ✅');
    }

    S.started = true;
    log('[spine] started ✅');
  }

  async function enterVR() {
    if (!S.renderer) throw new Error('Renderer not ready');
    // XRButton creates a button element
    if (S.xrButtonEl?.tagName === 'BUTTON') S.xrButtonEl.click();
  }

  // Reset spawn safely: rig for XR, camera for non-XR
  function resetSpawn() {
    const inXR = !!(S.renderer?.xr?.isPresenting);
    if (inXR) {
      setXRSpawn(new THREE.Vector3(0,0,16), 0);
      log('[spine] reset spawn (XR rig)');
    } else {
      S.camera.position.set(0, 1.7, 16);
      S.camera.lookAt(0, 1.35, 0);
      log('[spine] reset spawn (camera)');
    }
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
      'inXR=' + (S.renderer?.xr?.isPresenting ? 'true' : 'false'),
      'worldUpdates=' + (S.worldUpdates?.length || 0),
      'worldInteractables=' + (S.worldInteractables?.length || 0),
    ].join('\n');
  }

  return { start, enterVR, resetSpawn, getReport };
})();
