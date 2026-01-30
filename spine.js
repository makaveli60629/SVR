/**
 * spine.js — PERMANENT ROOT SPINE
 * Fixes:
 *  - XR spawn offset (so you don't spawn on table center)
 *  - Stable rig-based placement in VR
 *
 * World contract:
 *   /js/scarlett1/world.js exports async function init(ctx)
 *   returns { updates:[fn(dt)], interactables:[...] }
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
    controller1: null,
    controller2: null,
    grip1: null,
    grip2: null,
    hand1: null,
    hand2: null,
    // spawn target for XR
    xrSpawnPos: new THREE.Vector3(0, 0, 16),
    xrSpawnYaw: 0,
    didXRSpawn: false,
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

    S.diag?.log?.('[xr] controllers + hands mounted ✅');
  }

  function applyXRSpawnOnce() {
    if (!S.rig || S.didXRSpawn) return;
    // Put user BACK from table center
    S.rig.position.copy(S.xrSpawnPos);
    S.rig.rotation.set(0, S.xrSpawnYaw, 0);
    S.didXRSpawn = true;
    S.diag?.log?.('[xr] spawn offset applied ✅');
  }

  async function start({ diag } = {}) {
    S.diag = diag;

    assertSingleInstance();
    disposeRendererIfAny();

    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);

    // Rig wrapper: we move THIS for XR spawn / locomotion
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

    try { mountXRHandsAndControllers(); }
    catch (e) { S.diag?.warn?.('[xr] mount failed: ' + (e?.message || e)); }

    // XR session hooks (CRITICAL: fixes center-table spawn)
    S.renderer.xr.addEventListener('sessionstart', () => {
      S.didXRSpawn = false; // allow fresh spawn each session
      // Delay one frame so XR has a pose, then offset rig
      requestAnimationFrame(() => applyXRSpawnOnce());
    });

    const log = (m) => S.diag?.log?.(m) || console.log(m);

    // Pass rig + renderer into world so it can set spawn properly
    const worldResult = await initWorld({
      THREE,
      scene: S.scene,
      camera: S.camera,
      rig: S.rig,
      renderer: S.renderer,
      setXRSpawn: (pos, yaw=0) => {
        S.xrSpawnPos.copy(pos);
        S.xrSpawnYaw = yaw;
        S.didXRSpawn = false;
        log(`[xr] spawn target set -> (${pos.x.toFixed(2)},${pos.y.toFixed(2)},${pos.z.toFixed(2)}) yaw=${yaw.toFixed(2)}`);
      },
      log
    });

    S.worldUpdates = Array.isArray(worldResult?.updates) ? worldResult.updates : [];
    S.worldInteractables = Array.isArray(worldResult?.interactables) ? worldResult.interactables : [];

    S.renderer.setAnimationLoop(animate);

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
    // Non-XR fallback view
    S.camera.position.set(0, 1.7, 16);
    S.camera.lookAt(0, 1.35, 0);

    // XR spawn target reset
    S.xrSpawnPos.set(0, 0, 16);
    S.xrSpawnYaw = 0;
    S.didXRSpawn = false;

    // If not in XR, also move rig so it matches
    if (S.rig) {
      S.rig.position.set(0, 0, 0);
      S.rig.rotation.set(0, 0, 0);
    }

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
