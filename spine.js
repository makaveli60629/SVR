/**
 * spine.js — PERMANENT ROOT SPINE (XR RIG + GAMEPAD MOVE + TELEPORT)
 * Fixes:
 *  - ALWAYS moves the RIG in XR (spawn/teleport/locomotion)
 *  - Smooth move (left stick) + snap turn (right stick) on Quest controllers
 *  - Teleport (trigger select) with marker
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

    controller1: null,
    controller2: null,
    grip1: null,
    grip2: null,
    hand1: null,
    hand2: null,

    raycaster: null,
    marker: null,
    lastHit: null,

    xrSpawn: { pos: new THREE.Vector3(0, 0, 14), yaw: Math.PI },
    xrSpawnApplied: false,

    // locomotion tuning
    moveSpeed: 2.6,          // meters/sec
    snapTurnDeg: 30,         // degrees per snap
    snapCooldown: 0.22,
    snapT: 0,
  };

  const isXR = () => !!(S.renderer && S.renderer.xr && S.renderer.xr.isPresenting);

  function assertSingleInstance() {
    if (window.__SCARLETT_SPINE_LOCK__) throw new Error('Duplicate spine init blocked (blink prevention)');
    window.__SCARLETT_SPINE_LOCK__ = true;
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

  function resize() {
    if (!S.renderer || !S.camera) return;
    S.camera.aspect = window.innerWidth / window.innerHeight;
    S.camera.updateProjectionMatrix();
    S.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function ensureTeleport() {
    S.raycaster = new THREE.Raycaster();
    S.raycaster.far = 80;

    S.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.20, 0.30, 40),
      new THREE.MeshBasicMaterial({ color: 0x7a45ff, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    S.marker.rotation.x = -Math.PI / 2;
    S.marker.visible = false;
    S.scene.add(S.marker);
  }

  function setXRSpawn(posVec3, yaw = 0) {
    S.xrSpawn.pos.copy(posVec3);
    S.xrSpawn.yaw = yaw;
    S.diag?.log?.(`[spawn] set -> (${posVec3.x.toFixed(2)},${posVec3.y.toFixed(2)},${posVec3.z.toFixed(2)}) yaw=${yaw.toFixed(2)}`);
  }

  function applyXRSpawn() {
    // IMPORTANT: move RIG, not camera
    S.rig.position.set(S.xrSpawn.pos.x, 0, S.xrSpawn.pos.z);
    S.rig.rotation.set(0, S.xrSpawn.yaw, 0);
    S.xrSpawnApplied = true;
    S.diag?.log?.('[spawn] applied (rig moved) ✅');
  }

  function castTeleport(fromObj) {
    if (!fromObj || !S.teleportSurfaces?.length) { S.marker.visible = false; S.lastHit = null; return null; }

    const rot = new THREE.Matrix4().extractRotation(fromObj.matrixWorld);
    const origin = new THREE.Vector3().setFromMatrixPosition(fromObj.matrixWorld);
    const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(rot).normalize();
    S.raycaster.set(origin, dir);

    const hits = S.raycaster.intersectObjects(S.teleportSurfaces, true);
    if (!hits.length) { S.marker.visible = false; S.lastHit = null; return null; }

    const h = hits[0];
    S.lastHit = h;
    S.marker.position.copy(h.point);
    S.marker.position.y += 0.02;
    S.marker.visible = true;
    return h;
  }

  function doTeleport() {
    if (!S.lastHit) return;
    // move rig
    S.rig.position.x = S.lastHit.point.x;
    S.rig.position.z = S.lastHit.point.z;
    S.rig.position.y = 0;
    S.marker.visible = false;
    S.lastHit = null;
    S.diag?.log?.('[teleport] jump ✅');
  }

  function mountXRHandsAndControllers() {
    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    const rayGeo = new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1) ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0x2bd6ff });

    S.controller1 = S.renderer.xr.getController(0);
    S.controller2 = S.renderer.xr.getController(1);

    for (const c of [S.controller1, S.controller2]) {
      const line = new THREE.Line(rayGeo, rayMat);
      line.scale.z = 40;
      c.add(line);

      // trigger selects -> teleport
      c.addEventListener('selectstart', () => { c.userData.selecting = true; });
      c.addEventListener('selectend',   () => { c.userData.selecting = false; doTeleport(); });

      S.scene.add(c);
    }

    S.grip1 = S.renderer.xr.getControllerGrip(0);
    S.grip1.add(controllerModelFactory.createControllerModel(S.grip1));
    S.scene.add(S.grip1);

    S.grip2 = S.renderer.xr.getControllerGrip(1);
    S.grip2.add(controllerModelFactory.createControllerModel(S.grip2));
    S.scene.add(S.grip2);

    // Hands (visual only; pinch events are inconsistent across devices)
    S.hand1 = S.renderer.xr.getHand(0);
    S.hand1.add(handModelFactory.createHandModel(S.hand1, 'mesh'));
    S.scene.add(S.hand1);

    S.hand2 = S.renderer.xr.getHand(1);
    S.hand2.add(handModelFactory.createHandModel(S.hand2, 'mesh'));
    S.scene.add(S.hand2);

    S.diag?.log?.('[xr] controllers + hands mounted ✅');
  }

  function gamepadLocomotion(dt) {
    // Read thumbsticks from controller gamepads (Quest)
    // Typical mapping:
    //  left: axes[2], axes[3] OR axes[0], axes[1] depending on browser
    //  right: axes[2], axes[3] etc. We'll try both patterns robustly.

    const dead = 0.16;

    function readPad(ctrl) {
      const src = ctrl?.inputSource;
      const gp = src?.gamepad;
      if (!gp || !gp.axes) return null;
      return gp;
    }

    const gp1 = readPad(S.controller1);
    const gp2 = readPad(S.controller2);

    const gp = gp1 || gp2;
    if (!gp) return;

    // pick move axes: prefer 0/1 for left stick if present
    const ax0 = gp.axes[0] ?? 0;
    const ax1 = gp.axes[1] ?? 0;
    const ax2 = gp.axes[2] ?? 0;
    const ax3 = gp.axes[3] ?? 0;

    // heuristic: if 0/1 are near 0 but 2/3 are active, use 2/3
    const use23 = (Math.abs(ax0) + Math.abs(ax1) < 0.08) && (Math.abs(ax2) + Math.abs(ax3) > 0.08);

    const moveX = use23 ? ax2 : ax0;
    const moveY = use23 ? ax3 : ax1;

    // try to get turn from the "other" pair
    const turnX = use23 ? ax0 : ax2;

    const mx = Math.abs(moveX) > dead ? moveX : 0;
    const my = Math.abs(moveY) > dead ? moveY : 0;

    // Move in the direction the HEADSET faces (camera world direction), but only on XZ
    if (mx || my) {
      const fwd = new THREE.Vector3();
      S.camera.getWorldDirection(fwd);
      fwd.y = 0; fwd.normalize();

      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0,1,0)).normalize();

      const step = new THREE.Vector3()
        .addScaledVector(right, mx)
        .addScaledVector(fwd, -my);

      if (step.lengthSq() > 0) {
        step.normalize().multiplyScalar(S.moveSpeed * dt);
        S.rig.position.add(step);
        S.rig.position.y = 0;
      }
    }

    // Snap turn (right stick X) — cooldown
    S.snapT -= dt;
    const tx = Math.abs(turnX) > 0.65 ? turnX : 0;
    if (tx && S.snapT <= 0) {
      const dir = tx > 0 ? -1 : 1;
      const rad = THREE.MathUtils.degToRad(S.snapTurnDeg) * dir;
      S.rig.rotation.y += rad;
      S.snapT = S.snapCooldown;
      S.diag?.log?.('[move] snap turn');
    }
  }

  function animate() {
    const dt = S.clock.getDelta();

    // If XR started and spawn not applied, force it once
    if (isXR() && !S.xrSpawnApplied) applyXRSpawn();

    // World updates
    for (let i = 0; i < S.worldUpdates.length; i++) {
      try { S.worldUpdates[i](dt); } catch {}
    }

    if (isXR()) {
      // aiming marker
      castTeleport(S.controller1);
      castTeleport(S.controller2);

      // controller locomotion
      gamepadLocomotion(dt);
    }

    S.renderer.render(S.scene, S.camera);
  }

  async function start({ diag } = {}) {
    S.diag = diag;

    assertSingleInstance();
    disposeRendererIfAny();

    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 800);

    // player rig (XR locomotion uses this)
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

    const log = (m) => S.diag?.log?.(m) || console.log(m);

    const worldResult = await initWorld({
      THREE,
      scene: S.scene,
      camera: S.camera,
      rig: S.rig,
      renderer: S.renderer,
      setXRSpawn: (pos, yaw=0)=> setXRSpawn(pos, yaw),
      log
    });

    S.worldUpdates = Array.isArray(worldResult?.updates) ? worldResult.updates : [];

    if (Array.isArray(worldResult?.teleportSurfaces) && worldResult.teleportSurfaces.length) {
      S.teleportSurfaces = worldResult.teleportSurfaces;
    } else {
      const list = [];
      S.scene.traverse((o) => { if (o?.userData?.teleportable) list.push(o); });
      S.teleportSurfaces = list;
    }

    S.diag?.log?.(`[teleport] surfaces=${S.teleportSurfaces.length}`);

    // XR session hooks
    S.renderer.xr.addEventListener('sessionstart', () => {
      S.xrSpawnApplied = false; // re-apply once XR begins
      S.diag?.log?.('[xr] sessionstart ✅');
      applyXRSpawn();
      // apply again shortly (Quest sometimes updates origin a frame later)
      setTimeout(()=> { if (isXR()) applyXRSpawn(); }, 250);
    });

    S.renderer.xr.addEventListener('sessionend', () => {
      S.marker.visible = false;
      S.lastHit = null;
      S.xrSpawnApplied = false;
      S.diag?.log?.('[xr] sessionend ✅');
    });

    S.renderer.setAnimationLoop(animate);

    if (!S.xrButtonEl) {
      S.xrButtonEl = XRButton.createButton(S.renderer);
      S.xrButtonEl.style.position = 'absolute';
      S.xrButtonEl.style.left = '12px';
      S.xrButtonEl.style.bottom = '12px';
      S.xrButtonEl.style.zIndex = '40';
      document.body.appendChild(S.xrButtonEl);
    }

    // debug helpers
    window.SCARLETT = {
      enterVR: async ()=> { if (S.xrButtonEl?.tagName === 'BUTTON') S.xrButtonEl.click(); },
      resetSpawn: ()=> applyXRSpawn(),
      getReport: ()=> [
        'Scarlett Diagnostics Report',
        'build=SCARLETT_SPINE_VR_MOVE_TELEPORT_BRIGHT',
        'time=' + new Date().toISOString(),
        'href=' + location.href,
        'ua=' + navigator.userAgent,
        'xr=' + (isXR() ? 'true' : 'false'),
        'teleportSurfaces=' + (S.teleportSurfaces?.length || 0),
      ].join('\n')
    };

    S.diag?.log?.('[spine] started ✅');
  }

  return { start };
})();
