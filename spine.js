/**
 * spine.js — PERMANENT ROOT SPINE
 * Rule: Root spine is permanent. Only edit /js/scarlett1/* from now on.
 * World contract:
 *   /js/scarlett1/world.js exports async function init(ctx)
 *   returns { updates:[fn(dt)], interactables:[...] }
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { XRButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRButton.js';
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
  };

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

    // Run Scarlett1 per-frame updates (neon pulse etc)
    for (let i = 0; i < S.worldUpdates.length; i++) {
      try { S.worldUpdates[i](dt); } catch (e) { /* keep render loop alive */ }
    }

    S.renderer.render(S.scene, S.camera);
  }

  async function start({ diag } = {}) {
    S.diag = diag;

    assertSingleInstance();
    disposeRendererIfAny();

    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);

    // Camera rig (optional, but nice for future locomotion)
    S.rig = new THREE.Group();
    S.rig.position.set(0, 0, 0);
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

    // ✅ WORLD INIT (your exact contract)
    const log = (m) => S.diag?.log?.(m) || console.log(m);
    const worldResult = await initWorld({ THREE, scene: S.scene, camera: S.camera, log });

    S.worldUpdates = Array.isArray(worldResult?.updates) ? worldResult.updates : [];
    S.worldInteractables = Array.isArray(worldResult?.interactables) ? worldResult.interactables : [];

    // ✅ SINGLE LOOP ONLY (prevents blinking)
    S.renderer.setAnimationLoop(animate);

    // XR Button once
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
    // Your world sets camera position inside init(), so reset calls init again would be bad.
    // Keep reset minimal: just reset camera transform.
    S.camera.position.set(0, 1.6, 14);
    S.camera.lookAt(0, 1.4, 0);
    S.diag?.log?.('[spine] reset spawn');
  }

  function getReport() {
    return [
      'Scarlett Diagnostics Report',
      'build=SCARLETT_SPINE_PERMANENT_S1_WORLD_INIT',
      'href=' + location.href,
      'ua=' + navigator.userAgent,
      'spineLock=' + (window.__SCARLETT_SPINE_LOCK__ ? 'true' : 'false'),
      'renderer=' + (S.renderer ? 'ready' : 'none'),
      'worldUpdates=' + (S.worldUpdates?.length || 0),
      'worldInteractables=' + (S.worldInteractables?.length || 0),
    ].join('\\n');
  }

  return { start, enterVR, resetSpawn, getReport };
})();
