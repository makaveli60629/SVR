/**
 * spine.js — PERMANENT ROOT SPINE (XR RIG + TELEPORT)
 * - Creates a player rig (moves in XR)
 * - Teleport works with controllers (select) and hands (pinch)
 * - Calls world init contract and consumes world.teleportSurfaces
 *
 * IMPORTANT:
 *  - In XR: NEVER move camera position to teleport/spawn; move rig instead.
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
    teleportSurfaces: [],
    // XR input
    controller1: null,
    controller2: null,
    grip1: null,
    grip2: null,
    hand1: null,
    hand2: null,
    // Teleport
    raycaster: null,
    marker: null,
    lastHit: null,
    xrSpawn: { pos: new THREE.Vector3(0, 0, 14), yaw: Math.PI },
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

  const isXR = () => !!(S.renderer && S.renderer.xr && S.renderer.xr.isPresenting);

  // ---------- TELEPORT CORE ----------
  function ensureTeleport() {
    S.raycaster = new THREE.Raycaster();
    S.raycaster.far = 60;

    S.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.26, 32),
      new THREE.MeshBasicMaterial({ color: 0x7a45ff, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    S.marker.rotation.x = -Math.PI / 2;
    S.marker.visible = false;
    S.scene.add(S.marker);
  }

  function teleportSetSpawn(posVec3, yaw=0) {
    S.xrSpawn.pos.copy(posVec3);
    S.xrSpawn.yaw = yaw;
    S.diag?.log?.(`[spawn] setXRSpawn -> (${posVec3.x.toFixed(2)}, ${posVec3.y.toFixed(2)}, ${posVec3.z.toFixed(2)}) yaw=${yaw.toFixed(2)}`);
  }

  function teleportApplySpawn() {
    // Move rig to spawn. Keep y = 0 baseline (your world floor is 0)
    S.rig.position.set(S.xrSpawn.pos.x, 0, S.xrSpawn.pos.z);
    S.rig.rotation.set(0, S.xrSpawn.yaw, 0);
    S.diag?.log?.('[spawn] applied (rig moved) ✅');
  }

  function castTeleport(fromObj) {
    if (!fromObj || !S.teleportSurfaces?.length) {
      S.marker.visible = false;
      S.lastHit = null;
      return null;
    }

    const m = new THREE.Matrix4().extractRotation(fromObj.matrixWorld);
    const origin = new THREE.Vector3().setFromMatrixPosition(fromObj.matrixWorld);
    const dir = new THREE.Vector3(0,0,-1).applyMatrix4(m).normalize();

    S.raycaster.set(origin, dir);

    const hits = S.raycaster.intersectObjects(S.teleportSurfaces, true);
    if (!hits.length) {
      S.marker.visible = false;
      S.lastHit = null;
      return null;
    }

    const h = hits[0];
    S.lastHit = h;
    S.marker.position.copy(h.point);
    S.marker.position.y += 0.02;
    S.marker.visible = true;
    return h;
  }

  function doTeleport() {
    if (!S.lastHit) return;

    // TELEPORT BY MOVING RIG, NOT CAMERA
    S.rig.position.x = S.lastHit.point.x;
    S.rig.position.z = S.lastHit.point.z;
    S.rig.position.y = 0;

    S.marker.visible = false;
    S.lastHit = null;

    S.diag?.log?.('[teleport] jump ✅');
  }

  // ---------- XR INPUT ----------
  function mountXRHandsAndControllers() {
    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    const rayGeo = new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1) ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0x2bd6ff });

    // Controllers
    S.controller1 = S.renderer.xr.getController(0);
    S.controller2 = S.renderer.xr.getController(1);

    for (const c of [S.controller1, S.controller2]) {
      const line = new THREE.Line(rayGeo, rayMat);
      line.scale.z = 30;
      c.add(line);

      c.addEventListener('selectstart', () => { c.userData.selecting = true; });
      c.addEventListener('selectend', () => { c.userData.selecting = false; doTeleport(); });

      S.scene.add(c);
    }

    S.grip1 = S.renderer.xr.getControllerGrip(0);
    S.grip1.add(controllerModelFactory.createControllerModel(S.grip1));
    S.scene.add(S.grip1);

    S.grip2 = S.renderer.xr.getControllerGrip(1);
    S.grip2.add(controllerModelFactory.createControllerModel(S.grip2));
    S.scene.add(S.grip2);

    // Hands
    S.hand1 = S.renderer.xr.getHand(0);
    S.hand1.add(handModelFactory.createHandModel(S.hand1, 'mesh'));
    S.hand1.userData.pinching = false;
    S.hand1.addEventListener('pinchstart', () => { S.hand1.userData.pinching = true; });
    S.hand1.addEventListener('pinchend', () => { S.hand1.userData.pinching = false; doTeleport(); });
    S.scene.add(S.hand1);

    S.hand2 = S.renderer.xr.getHand(1);
    S.hand2.add(handModelFactory.createHandModel(S.hand2, 'mesh'));
    S.hand2.userData.pinching = false;
    S.hand2.addEventListener('pinchstart', () => { S.hand2.userData.pinching = true; });
    S.hand2.addEventListener('pinchend', () => { S.hand2.userData.pinching = false; doTeleport(); });
    S.scene.add(S.hand2);

    S.diag?.log?.('[xr] controllers + hands mounted ✅');
  }

  function animate() {
    const dt = S.clock.getDelta();

    // World updates
    for (let i = 0; i < S.worldUpdates.length; i++) {
      try { S.worldUpdates[i](dt); } catch {}
    }

    // Teleport aiming
    if (isXR()) {
      // Controller aiming always
      castTeleport(S.controller1);
      castTeleport(S.controller2);

      // Hands aim only while pinching (less noisy)
      if (S.hand1?.userData?.pinching) castTeleport(S.hand1);
      if (S.hand2?.userData?.pinching) castTeleport(S.hand2);
    }

    S.renderer.render(S.scene, S.camera);
  }

  async function start({ diag } = {}) {
    S.diag = diag;

    assertSingleInstance();
    disposeRendererIfAny();

    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);

    // Rig wrapper (XR locomotion moves this)
    S.rig = new THREE.Group();
    S.rig.name = 'playerRig';
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

    ensureTeleport();

    try { mountXRHandsAndControllers(); }
    catch (e) { S.diag?.warn?.('[xr] mount failed: ' + (e?.message || e)); }

    // Provide world a way to set XR spawn safely
    const setXRSpawn = (posVec3, yaw=0) => teleportSetSpawn(posVec3, yaw);

    const log = (m) => S.diag?.log?.(m) || console.log(m);

    // WORLD INIT (we pass rig/renderer/setXRSpawn so world can cooperate with XR)
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

    // Accept explicit teleportSurfaces OR auto-collect by userData.teleportable
    if (Array.isArray(worldResult?.teleportSurfaces) && worldResult.teleportSurfaces.length) {
      S.teleportSurfaces = worldResult.teleportSurfaces;
    } else {
      const list = [];
      S.scene.traverse((o) => { if (o?.userData?.teleportable) list.push(o); });
      S.teleportSurfaces = list;
    }

    S.diag?.log?.(`[teleport] surfaces=${S.teleportSurfaces.length}`);

    // XR session events: snap spawn OUTSIDE pit when VR begins
    S.renderer.xr.addEventListener('sessionstart', () => {
      const sess = S.renderer.xr.getSession();
      let hasHands = false, hasControllers = false;

      if (sess?.inputSources) {
        for (const src of sess.inputSources) {
          if (src.hand) hasHands = true;
          if (src.gamepad) hasControllers = true;
        }
      }
      S.diag?.log?.(`[xr] sessionstart ✅ hands=${hasHands} controllers=${hasControllers}`);

      teleportApplySpawn(); // ✅ spawn rig safely
    });

    S.renderer.xr.addEventListener('sessionend', () => {
      S.marker.visible = false;
      S.lastHit = null;
      S.diag?.log?.('[xr] sessionend ✅');
    });

    // SINGLE LOOP ONLY
    S.renderer.setAnimationLoop(animate);

    // XR button (once)
    if (!S.xrButtonEl) {
      S.xrButtonEl = XRButton.createButton(S.renderer);
      S.xrButtonEl.style.position = 'absolute';
      S.xrButtonEl.style.left = '12px';
      S.xrButtonEl.style.bottom = '12px';
      S.xrButtonEl.style.zIndex = '40';
      document.body.appendChild(S.xrButtonEl);
    }

    // Expose helpers
    window.SCARLETT = {
      enterVR: async ()=> { if (S.xrButtonEl?.tagName === 'BUTTON') S.xrButtonEl.click(); },
      resetSpawn: ()=> teleportApplySpawn(),
      setXRSpawn: (x,y,z,yaw=0)=> teleportSetSpawn(new THREE.Vector3(x,y,z), yaw),
      getReport: ()=> getReport(),
    };

    S.diag?.log?.('[spine] started ✅');
  }

  function resetSpawn() {
    // Desktop/mobile camera reset only; XR uses rig spawn
    S.camera.position.set(0, 1.6, 14);
    S.camera.lookAt(0, 1.4, 0);
    S.diag?.log?.('[spine] reset spawn');
  }

  function getReport() {
    return [
      'Scarlett Diagnostics Report',
      'build=SCARLETT_SPINE_XR_RIG_TELEPORT_V3',
      'time=' + nowISO(),
      'href=' + location.href,
      'ua=' + navigator.userAgent,
      'secureContext=' + (window.isSecureContext ? 'true' : 'false'),
      'xrSupported=' + ('xr' in navigator ? 'true' : 'false'),
      'spineLock=' + (window.__SCARLETT_SPINE_LOCK__ ? 'true' : 'false'),
      'renderer=' + (S.renderer ? 'ready' : 'none'),
      'worldUpdates=' + (S.worldUpdates?.length || 0),
      'teleportSurfaces=' + (S.teleportSurfaces?.length || 0),
    ].join('\n');
  }

  return { start, resetSpawn, getReport };
})();
