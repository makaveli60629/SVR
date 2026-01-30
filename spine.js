/**
 * /spine.js — PERMANENT SPINE (GitHub Pages Safe)
 * ✅ Uses CDN Three.js module import (NO bare specifier)
 * ✅ Loads /js/scarlett1/world.js (your no-import world)
 */

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const Spine = {
  async start({ log = console.log } = {}) {
    // ------------------------------------------------------------
    // CORE DOM
    // ------------------------------------------------------------
    const wrap = document.getElementById("canvasWrap") || document.body;

    // ------------------------------------------------------------
    // THREE CORE
    // ------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050a);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.05,
      2000
    );

    // Rig is what we move in XR (camera stays as XR "head")
    const rig = new THREE.Group();
    rig.position.set(0, 0, 0);
    rig.add(camera);
    scene.add(rig);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.xr.enabled = true;
    wrap.appendChild(renderer.domElement);

    log("[spine] renderer created ✅");

    // ------------------------------------------------------------
    // RESIZE
    // ------------------------------------------------------------
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    // ------------------------------------------------------------
    // XR SPAWN CONTROL
    // ------------------------------------------------------------
    let spawnPos = new THREE.Vector3(0, 0, 16);
    let spawnYaw = 0;

    function setXRSpawn(posVec3, yawRad = 0) {
      spawnPos.copy(posVec3);
      spawnYaw = yawRad;
      // Non-XR fallback: move camera directly
      if (!renderer.xr.isPresenting) {
        camera.position.set(spawnPos.x, 1.7, spawnPos.z);
        camera.rotation.order = "YXZ";
        camera.rotation.y = spawnYaw;
      }
    }

    function resetSpawn() {
      // XR: move rig; Non-XR: move camera
      if (renderer.xr.isPresenting) {
        rig.position.set(spawnPos.x, 0, spawnPos.z);
        rig.rotation.set(0, spawnYaw, 0);
      } else {
        camera.position.set(spawnPos.x, 1.7, spawnPos.z);
        camera.rotation.set(0, spawnYaw, 0);
      }
      log("[spine] spawn reset ✅");
    }

    // Default spawn now
    setXRSpawn(new THREE.Vector3(0, 0, 16), 0);

    // ------------------------------------------------------------
    // LOAD WORLD (NO IMPORTS INSIDE WORLD)
    // ------------------------------------------------------------
    let worldInit = null;
    try {
      const worldModule = await import("./js/scarlett1/world.js");
      worldInit = worldModule?.init;
      if (typeof worldInit !== "function") throw new Error("world.js missing export async function init(ctx)");
      log("[spine] world module loaded ✅ (/js/scarlett1/world.js)");
    } catch (e) {
      log("[spine] world import failed ❌ " + (e?.message || e));
      throw e;
    }

    const ctx = {
      THREE,
      scene,
      camera,
      rig,
      renderer,
      setXRSpawn,
      log,
    };

    let updates = [];
    try {
      const out = await worldInit(ctx);
      updates = Array.isArray(out?.updates) ? out.updates : [];
      log(`[spine] world init ✅ updates=${updates.length}`);
    } catch (e) {
      log("[spine] world init failed ❌ " + (e?.message || e));
      throw e;
    }

    // ------------------------------------------------------------
    // XR ENTER (simple)
    // ------------------------------------------------------------
    async function enterVR() {
      if (!navigator.xr) {
        log("[xr] navigator.xr not available ❌ (use Oculus Browser / Chrome XR)");
        return;
      }
      try {
        const session = await navigator.xr.requestSession("immersive-vr", {
          optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "layers"],
        });
        renderer.xr.setSession(session);
        // When session starts, apply spawn to rig
        session.addEventListener("end", () => {
          log("[xr] session ended");
          // restore non-xr spawn
          setXRSpawn(spawnPos, spawnYaw);
        });

        // Move rig at start so you don't spawn inside table
        rig.position.set(spawnPos.x, 0, spawnPos.z);
        rig.rotation.set(0, spawnYaw, 0);

        log("[xr] session started ✅");
      } catch (e) {
        log("[xr] session failed ❌ " + (e?.message || e));
      }
    }

    // ------------------------------------------------------------
    // REPORT
    // ------------------------------------------------------------
    function getReport() {
      const ua = navigator.userAgent;
      const href = location.href;
      const xr = !!navigator.xr;
      const presenting = !!renderer?.xr?.isPresenting;
      return [
        "Scarlett Diagnostics Report",
        `href=${href}`,
        `ua=${ua}`,
        `navigator.xr=${xr}`,
        `presenting=${presenting}`,
        `updates=${updates.length}`,
        `three=unpkg three@0.160.0`,
      ].join("\n");
    }

    // Expose API used by HUD buttons
    window.SCARLETT = {
      enterVR,
      resetSpawn,
      getReport,
      setXRSpawn,
    };

    // ------------------------------------------------------------
    // MAIN LOOP
    // ------------------------------------------------------------
    let last = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      for (const fn of updates) {
        try { fn(dt); } catch (e) { console.warn("update error", e); }
      }

      renderer.render(scene, camera);
    });

    // Ensure something is visible even if world is empty
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    log("[spine] animation loop ✅");
    return true;
  },
};
