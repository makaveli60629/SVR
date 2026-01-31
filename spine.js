/**
 * SPINE — V3 XR INPUT: controllers + hands + teleport + 3D menu
 * - Controller ray + trigger teleport
 * - Hand tracking (if available) + pinch teleport
 * - Simple 3D menu panel in-world (Reset/Hide/Show)
 */

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { XRControllerModelFactory } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRHandModelFactory.js";

const $ = (id) => document.getElementById(id);

export const Spine = {
  async start() {
    const log = (m) => {
      console.log(m);
      try {
        const box = $("log");
        if (box) box.textContent += (box.textContent ? "\n" : "") + m;
      } catch {}
    };

    // --- core
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 250);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    log("[spine] renderer created ✅");

    // --- rig (move this for teleport)
    const rig = new THREE.Group();
    rig.name = "playerRig";
    rig.add(camera);
    scene.add(rig);

    // allow world to use this camera parent
    camera.position.set(0, 1.6, 0);

    // --- resize
    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    // --- load world
    const worldMod = await import("./js/scarlett1/world.js");
    const world = await worldMod.init({ THREE, scene, camera, renderer, log });

    log("[spine] world module loaded ✅ (/js/scarlett1/world.js)");

    const teleportSurfaces = (world && world.teleportSurfaces) ? world.teleportSurfaces : [];
    log(`[input] teleport surfaces: ${teleportSurfaces.length}`);

    // ---------------------------------------------------------
    // TELEPORT SYSTEM
    // ---------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const tempMat = new THREE.Matrix4();
    const tempPos = new THREE.Vector3();
    const tempDir = new THREE.Vector3();

    // marker
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.25, 32),
      new THREE.MeshBasicMaterial({ color: 0x7a45ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.visible = false;
    scene.add(marker);

    let lastHit = null;

    function castTeleport(fromObj) {
      if (!fromObj) return null;

      tempMat.identity().extractRotation(fromObj.matrixWorld);
      tempPos.setFromMatrixPosition(fromObj.matrixWorld);
      tempDir.set(0, 0, -1).applyMatrix4(tempMat).normalize();

      raycaster.set(tempPos, tempDir);
      raycaster.far = 40;

      const hits = raycaster.intersectObjects(teleportSurfaces, true);
      if (!hits.length) return null;

      const h = hits[0];
      marker.position.copy(h.point);
      marker.visible = true;

      lastHit = h;
      return h;
    }

    function doTeleport() {
      if (!lastHit) return;

      // teleport by moving the RIG (not the camera)
      // keep player at floor level
      rig.position.x = lastHit.point.x;
      rig.position.z = lastHit.point.z;

      // You can tune this if your floor is not y=0
      rig.position.y = 0;

      marker.visible = false;
      lastHit = null;
    }

    // ---------------------------------------------------------
    // CONTROLLERS (ray + trigger teleport)
    // ---------------------------------------------------------
    const controllerModelFactory = new XRControllerModelFactory();

    function makeController(i) {
      const c = renderer.xr.getController(i);
      c.userData.isSelecting = false;

      // ray line
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2bd6ff }));
      line.name = "ray";
      line.scale.z = 20;
      c.add(line);

      c.addEventListener("selectstart", () => {
        c.userData.isSelecting = true;
      });

      c.addEventListener("selectend", () => {
        c.userData.isSelecting = false;
        // teleport on release if we had a target
        doTeleport();
      });

      scene.add(c);

      // grip model
      const grip = renderer.xr.getControllerGrip(i);
      grip.add(controllerModelFactory.createControllerModel(grip));
      scene.add(grip);

      return c;
    }

    const controller0 = makeController(0);
    const controller1 = makeController(1);

    // ---------------------------------------------------------
    // HANDS (pinch teleport)
    // ---------------------------------------------------------
    const handModelFactory = new XRHandModelFactory();
    const hands = [];

    function makeHand(i) {
      const hand = renderer.xr.getHand(i);
      hand.add(handModelFactory.createHandModel(hand, "mesh"));
      hand.userData.isPinching = false;

      // three.js fires pinch events on hands
      hand.addEventListener("pinchstart", () => {
        hand.userData.isPinching = true;
      });
      hand.addEventListener("pinchend", () => {
        hand.userData.isPinching = false;
        doTeleport();
      });

      scene.add(hand);
      return hand;
    }

    hands.push(makeHand(0));
    hands.push(makeHand(1));

    // ---------------------------------------------------------
    // 3D MENU (hand/controller poke later; for now: ray teleport + reset)
    // ---------------------------------------------------------
    const menu = new THREE.Group();
    menu.position.set(0, 1.45, 9.2); // in front of spawn
    scene.add(menu);

    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x0b0b12,
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x1b0f33,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
      })
    );
    panel.lookAt(0, 1.45, 0);
    menu.add(panel);

    // Quick “reset spawn” by holding both triggers or double pinch, etc.
    // For now: expose a global and log it.
    window.SCARLETT_RESET_SPAWN = () => {
      if (window.SCARLETT_SPAWN_SAFE) window.SCARLETT_SPAWN_SAFE();
      else if (window.SCARLETT_SPAWN) window.SCARLETT_SPAWN(0, 0, 11.5, Math.PI);
      log("[input] reset spawn ✅");
    };

    // ---------------------------------------------------------
    // XR capability checks + logging
    // ---------------------------------------------------------
    renderer.xr.addEventListener("sessionstart", () => {
      const s = renderer.xr.getSession();
      const inputs = s ? s.inputSources : [];
      let hasHands = false;
      let hasControllers = false;

      for (const src of inputs) {
        if (src.hand) hasHands = true;
        if (src.gamepad) hasControllers = true;
      }

      log(`[xr] sessionstart ✅ hands=${hasHands} controllers=${hasControllers}`);
      // Always snap to safe spawn on VR enter
      window.SCARLETT_RESET_SPAWN();
    });

    renderer.xr.addEventListener("sessionend", () => {
      log("[xr] sessionend ✅");
      marker.visible = false;
      lastHit = null;
    });

    // ---------------------------------------------------------
    // LOOP
    // ---------------------------------------------------------
    const updates = (world && world.updates) ? world.updates : [];
    let lastT = performance.now();

    renderer.setAnimationLoop(() => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      // controller rays aim teleport
      if (controller0) castTeleport(controller0);
      if (controller1) castTeleport(controller1);

      // hands: use hand itself as origin for ray
      // (when pinching, keep marker live; teleport on pinch end)
      for (const h of hands) {
        if (!h) continue;
        // only show hand-aim marker while pinching, to reduce noise
        if (h.userData.isPinching) castTeleport(h);
      }

      for (const fn of updates) fn(dt);

      renderer.render(scene, camera);
    });

    log("[spine] started ✅");
  },
};
