import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { Input } from "./input.js";

export const Spine = {
  async start(){
    const hudStatus = document.getElementById("status");
    const hudLog = document.getElementById("log");

    const log = (m) => {
      const line = (typeof m === "string") ? m : JSON.stringify(m, null, 2);
      hudLog.textContent += line + "\n";
      hudLog.scrollTop = hudLog.scrollHeight;
      console.log(line);
    };

    const setStatus = (t) => { hudStatus.textContent = t; };

    // Catch unhandled errors and show them
    window.addEventListener("error", (e)=>{
      setStatus("❌ JS error");
      log("❌ window.error: " + (e?.message || "unknown"));
      if (e?.error?.stack) log(e.error.stack);
    });
    window.addEventListener("unhandledrejection", (e)=>{
      setStatus("❌ Promise rejection");
      log("❌ unhandledrejection: " + (e?.reason?.message || e?.reason || "unknown"));
      if (e?.reason?.stack) log(e.reason.stack);
    });

    try {
      setStatus("boot…");
      log("=== SCARLETT DIAGNOSTICS ===");
      log("href=" + location.href);
      log("ua=" + navigator.userAgent);
      log("secureContext=" + (window.isSecureContext ? "true" : "false"));

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      document.body.appendChild(renderer.domElement);

      // Scene + Camera + Rig
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 800);
      const rig = new THREE.Group();
      rig.add(camera);
      scene.add(rig);

      // Controllers
      const controller1 = renderer.xr.getController(0);
      const controller2 = renderer.xr.getController(1);
      scene.add(controller1, controller2);

      // Context shared with modules
      const ctx = {
        THREE, scene, camera, rig, renderer,
        controller1, controller2,
        teleportSurfaces: [],
        walkSurfaces: [],
        updates: [],
        log
      };

      // Resize
      window.addEventListener("resize", ()=>{
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // HARD RELOAD
      document.getElementById("btnReload").onclick = ()=> location.reload(true);

      // Reset Spawn
      document.getElementById("btnSpawn").onclick = ()=>{
        rig.position.set(0, 1.7, -26);
        rig.lookAt(0, 1.6, 0);
        log("✅ spawn reset");
      };

      // ✅ REAL ENTER VR (no VRButton needed)
      document.getElementById("btnVR").onclick = async ()=>{
        try {
          if (!window.isSecureContext) {
            log("❌ WebXR requires HTTPS / secure context.");
            return;
          }
          if (!navigator.xr) {
            log("❌ navigator.xr not available on this browser/device.");
            log("Tip: Quest → Meta/Oculus Browser. Android Chrome often has no immersive-vr.");
            return;
          }

          // Check support
          let supported = false;
          try {
            supported = await navigator.xr.isSessionSupported("immersive-vr");
          } catch(e) {
            // Some browsers throw; treat as unsupported
            supported = false;
          }
          if (!supported) {
            log("❌ immersive-vr not supported here.");
            log("Tip: This is expected on most Android phones. Use Quest Browser for VR.");
            return;
          }

          log("… requesting immersive-vr session");
          const session = await navigator.xr.requestSession("immersive-vr", {
            optionalFeatures: [
              "local-floor",
              "bounded-floor",
              "hand-tracking",
              "layers"
            ]
          });

          session.addEventListener("end", ()=> log("ℹ️ XR session ended"));
          await renderer.xr.setSession(session);

          log("✅ Entered VR session");
        } catch (e) {
          log("❌ Enter VR failed:");
          log(e?.message || String(e));
          if (e?.stack) log(e.stack);
        }
      };

      // Input init
      try {
        Input.init(ctx);
        ctx.updates.push((dt)=> Input.update(dt));
        log("✅ input loaded");
      } catch (e) {
        log("❌ input failed:");
        log(e?.message || String(e));
        if (e?.stack) log(e.stack);
      }

      // Load world (with fallback if it fails)
      setStatus("loading world…");
      log("--- loading scarlett1/world.js ---");

      try {
        const mod = await import("../scarlett1/world.js");
        const worldInit = mod?.init;
        if (typeof worldInit !== "function") throw new Error("world.js loaded but did not export init(ctx)");
        await worldInit(ctx);
        log("✅ world loaded");
      } catch (e) {
        log("❌ world failed, using fallback world:");
        log(e?.message || String(e));
        if (e?.stack) log(e.stack);
        fallbackWorld(ctx);
      }

      // Start render loop
      setStatus("ready ✅");
      let last = performance.now();
      renderer.setAnimationLoop(()=>{
        const now = performance.now();
        const dt = Math.min(0.05, (now-last)/1000);
        last = now;

        for (const fn of ctx.updates) {
          try { fn(dt); } catch (e) { log("❌ update error: " + (e?.message || e)); }
        }

        renderer.render(scene, camera);
      });

    } catch (e) {
      setStatus("❌ BOOT FAILED");
      hudLog.textContent += "\n❌ BOOT FAILED:\n" + (e?.message || String(e)) + "\n";
      if (e?.stack) hudLog.textContent += e.stack + "\n";
      console.error(e);
    }

    function fallbackWorld(ctx){
      const { THREE, scene, rig, teleportSurfaces, walkSurfaces, log } = ctx;

      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const dir = new THREE.DirectionalLight(0xffffff, 1.0);
      dir.position.set(10,18,12);
      scene.add(dir);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(30, 64),
        new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.95 })
      );
      floor.rotation.x = -Math.PI/2;
      scene.add(floor);
      teleportSurfaces.push(floor);
      walkSurfaces.push(floor);

      rig.position.set(0, 1.7, -12);
      rig.lookAt(0, 1.6, 0);

      log("✅ FALLBACK world displayed.");
    }
  }
};
