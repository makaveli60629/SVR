/**
 * spine.js — PERMANENT ROOT SPINE (SPAWN PAD LOCK + MOVE + TELEPORT)
 * Fixes:
 *  - Force XR spawn to Spawn Pad (not pit center)
 *  - Robust Quest gamepad axes (prefer left-hand controller)
 *  - Teleport marker + trigger teleport
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

    controllerL: null,
    controllerR: null,
    gripL: null,
    gripR: null,
    handL: null,
    handR: null,

    raycaster: null,
    marker: null,
    lastHit: null,

    // spawn
    xrSpawn: { pos: new THREE.Vector3(0, 0, 14), yaw: Math.PI },
    spawnAppliedOnce: false,

    // locomotion
    moveSpeed: 2.8,
    snapTurnDeg: 30,
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
      new THREE.RingGeometry(0.22, 0.34, 44),
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
    // ALWAYS move RIG, never camera
    S.rig.position.set(S.xrSpawn.pos.x, 0, S.xrSpawn.pos.z);
    S.rig.rotation.set(0, S.xrSpawn.yaw, 0);
    S.spawnAppliedOnce = true;
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

  function doTeleportOrClick() {
    if (!S.lastHit) return;

    // MENU CLICK PRIORITY (if world provided handler)
    try {
      const clicked = window.__SCARLETT_WORLD_CLICK_PANEL__?.(S.lastHit);
      if (clicked) {
        S.marker.visible = false;
        S.lastHit = null;
        return;
      }
    } catch {}

    // TELEPORT
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

    // We’ll treat index 0/1 as L/R *after* checking handedness at runtime.
    const c0 = S.renderer.xr.getController(0);
    const c1 = S.renderer.xr.getController(1);

    for (const c of [c0, c1]) {
      const line = new THREE.Line(rayGeo, rayMat);
      line.scale.z = 40;
      c.add(line);

      c.addEventListener('selectstart', () => { c.userData.selecting = true; });
      c.addEventListener('selectend',   () => { c.userData.selecting = false; doTeleportOrClick(); });

      S.scene.add(c);
    }

    // Controller grips + models
    const g0 = S.renderer.xr.getControllerGrip(0);
    g0.add(controllerModelFactory.createControllerModel(g0));
    S.scene.add(g0);

    const g1 = S.renderer.xr.getControllerGrip(1);
    g1.add(controllerModelFactory.createControllerModel(g1));
    S.scene.add(g1);

    // Hands
    const h0 = S.renderer.xr.getHand(0);
    h0.add(handModelFactory.createHandModel(h0, 'mesh'));
    S.scene.add(h0);

    const h1 = S.renderer.xr.getHand(1);
    h1.add(handModelFactory.createHandModel(h1, 'mesh'));
    S.scene.add(h1);

    // Assign L/R heuristically each frame (some browsers report handedness late)
    S.controllerL = c0; S.controllerR = c1;
    S.gripL = g0; S.gripR = g1;
    S.handL = h0; S.handR = h1;

    S.diag?.log?.('[xr] controllers + hands mounted ✅');
  }

  function getGamepad(ctrl) {
    const src = ctrl?.inputSource;
    const gp = src?.gamepad;
    if (!gp || !gp.axes) return null;
    return gp;
  }

  function pickMoveGamepad() {
    // Prefer left-hand controller if we can detect it
    const gpL = getGamepad(S.controllerL);
    const gpR = getGamepad(S.controllerR);
    return gpL || gpR;
  }

  function gamepadLocomotion(dt) {
    const gp = pickMoveGamepad();
    if (!gp) return;

    const dead = 0.16;

    const ax0 = gp.axes[0] ?? 0;
    const ax1 = gp.axes[1] ?? 0;
    const ax2 = gp.axes[2] ?? 0;
    const ax3 = gp.axes[3] ?? 0;

    // Choose which pair behaves like the move stick
    const use23 = (Math.abs(ax0)+Math.abs(ax1) < 0.10) && (Math.abs(ax2)+Math.abs(ax3) > 0.10);
    const moveX = use23 ? ax2 : ax0;
    const moveY = use23 ? ax3 : ax1;

    // Turn from the other X axis
    const turnX = use23 ? ax0 : ax2;

    const mx = Math.abs(moveX) > dead ? moveX : 0;
    const my = Math.abs(moveY) > dead ? moveY : 0;

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

    // Snap turn
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

    // If XR session is live and spawn hasn’t been forced yet, force it.
    if (isXR() && !S.spawnAppliedOnce) applyXRSpawn();

    for (let i = 0; i < S.worldUpdates.length; i++) {
      try { S.worldUpdates[i](dt); } catch {}
    }

    if (isXR()) {
      castTeleport(S.controllerL);
      castTeleport(S.controllerR);
      gamepadLocomotion(dt);
    }

    S.renderer.render(S.scene, S.camera);
  }

  async function start({ diag } = {}) {
    S.diag = diag;

    assertSingleInstance();
    disposeRendererIfAny();

    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 900);

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

    // Teleport surfaces are REQUIRED for teleport to work
    if (Array.isArray(worldResult?.teleportSurfaces) && worldResult.teleportSurfaces.length) {
      S.teleportSurfaces = worldResult.teleportSurfaces;
    } else {
      const list = [];
      S.scene.traverse((o)=>{ if (o?.userData?.teleportable) list.push(o); });
      S.teleportSurfaces = list;
    }
    S.diag?.log?.(`[teleport] surfaces=${S.teleportSurfaces.length}`);

    // XR session hooks — force spawn to pad every time XR starts
    S.renderer.xr.addEventListener('sessionstart', () => {
      S.spawnAppliedOnce = false;
      S.diag?.log?.('[xr] sessionstart ✅');

      // Immediately apply spawn, then again after a short delay (Quest sometimes updates origin after first frame)
      applyXRSpawn();
      setTimeout(()=> { if (isXR()) applyXRSpawn(); }, 250);
      setTimeout(()=> { if (isXR()) applyXRSpawn(); }, 900);
    });

    S.renderer.xr.addEventListener('sessionend', () => {
      S.marker.visible = false;
      S.lastHit = null;
      S.spawnAppliedOnce = false;
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

    // quick debug
    window.SCARLETT = {
      enterVR: async ()=> { if (S.xrButtonEl?.tagName === 'BUTTON') S.xrButtonEl.click(); },
      resetSpawn: ()=> applyXRSpawn(),
      getReport: ()=> [
        'Scarlett Diagnostics Report',
        'build=SCARLETT_SPAWNPAD_LOCK_V1',
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
