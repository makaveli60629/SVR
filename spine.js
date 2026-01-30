/**
 * spine.js — PERMANENT ROOT SPINE
 * Only edit /js/scarlett1/*
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
    xrSpawn: { pos: new THREE.Vector3(0,0,0), yaw: 0 },
  };

  function nowISO(){ return new Date().toISOString(); }

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

  function setXRSpawn(posVec3, yawRad = 0){
    if (posVec3?.isVector3) S.xrSpawn.pos.copy(posVec3);
    S.xrSpawn.yaw = yawRad || 0;
    // Apply immediately if already running
    if (S.rig) {
      S.rig.position.copy(S.xrSpawn.pos);
      S.rig.rotation.set(0, S.xrSpawn.yaw, 0);
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

    const controller1 = S.renderer.xr.getController(0);
    const controller2 = S.renderer.xr.getController(1);
    S.scene.add(controller1);
    S.scene.add(controller2);

    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,-1),
    ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0xffffff });

    const ray1 = new THREE.Line(rayGeo, rayMat); ray1.scale.z = 4; controller1.add(ray1);
    const ray2 = new THREE.Line(rayGeo, rayMat); ray2.scale.z = 4; controller2.add(ray2);

    const grip1 = S.renderer.xr.getControllerGrip(0);
    grip1.add(controllerModelFactory.createControllerModel(grip1));
    S.scene.add(grip1);

    const grip2 = S.renderer.xr.getControllerGrip(1);
    grip2.add(controllerModelFactory.createControllerModel(grip2));
    S.scene.add(grip2);

    const hand1 = S.renderer.xr.getHand(0);
    hand1.add(handModelFactory.createHandModel(hand1, 'mesh'));
    S.scene.add(hand1);

    const hand2 = S.renderer.xr.getHand(1);
    hand2.add(handModelFactory.createHandModel(hand2, 'mesh'));
    S.scene.add(hand2);

    S.diag?.log?.('[xr] controllers + hands mounted ✅');
  }

  async function start({ diag } = {}) {
    S.diag = diag;

    disposeRendererIfAny();

    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);

    // Rig so XR movement happens by moving rig, not camera
    S.rig = new THREE.Group();
    S.scene.add(S.rig);
    S.rig.add(S.camera);

    // Default spawn (non-XR camera can still be moved by world.js)
    S.camera.position.set(0, 1.6, 14);
    S.camera.lookAt(0, 1.4, 0);

    S.renderer = new THREE.WebGLRenderer({ antialias: true });
    S.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    S.renderer.setSize(window.innerWidth, window.innerHeight);
    S.renderer.xr.enabled = true;

    document.body.appendChild(S.renderer.domElement);
    window.__SCARLETT_RENDERER__ = S.renderer;

    S.clock = new THREE.Clock();
    window.addEventListener('resize', resize);

    // Apply stored XR spawn
    setXRSpawn(S.xrSpawn.pos, S.xrSpawn.yaw);

    try { mountXRHandsAndControllers(); }
    catch (e) { S.diag?.warn?.('[xr] mount failed: ' + (e?.message || e)); }

    const log = (m) => (S.diag?.log?.(m) ?? console.log(m));

    log('[spine] init world…');

    const worldResult = await initWorld({
      THREE,
      scene: S.scene,
      camera: S.camera,
      rig: S.rig,
      renderer: S.renderer,
      setXRSpawn,
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

    log('[spine] started ✅');
  }

  async function enterVR() {
    if (!S.renderer) throw new Error('Renderer not ready');
    if (S.xrButtonEl?.tagName === 'BUTTON') S.xrButtonEl.click();
  }

  function resetSpawn() {
    // Non-XR spawn
    S.camera.position.set(0, 1.6, 14);
    S.camera.lookAt(0, 1.4, 0);
    S.diag?.log?.('[spine] reset spawn');
  }

  function getReport() {
    return [
      'Scarlett Diagnostics Report',
      'build=SCARLETT_SPINE_PERMANENT',
      'time=' + nowISO(),
      'href=' + location.href,
      'ua=' + navigator.userAgent,
      'secureContext=' + (window.isSecureContext ? 'true' : 'false'),
      'xrSupported=' + ('xr' in navigator ? 'true' : 'false'),
      'renderer=' + (S.renderer ? 'ready' : 'none'),
      'worldUpdates=' + (S.worldUpdates?.length || 0),
      'worldInteractables=' + (S.worldInteractables?.length || 0),
    ].join('\n');
  }

  return { start, enterVR, resetSpawn, getReport };
})();
