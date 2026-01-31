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

      // Buttons
      document.getElementById("btnReload").onclick = ()=> location.reload(true);
      document.getElementById("btnSpawn").onclick = ()=>{
        rig.position.set(0, 1.7, -26);
        rig.lookAt(0, 1.6, 0);
        log("✅ spawn reset");
      };
      document.getElementById("btnVR").onclick = ()=>{
        const btn = document.querySelector("button[aria-label='Enter VR']");
        if (btn) btn.click();
        else renderer.xr.enabled = true;
      };

      // Resize
      window.addEventListener("resize", ()=>{
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

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

      let worldInit = null;
      try {
        const mod = await import("../scarlett1/world.js");
        worldInit = mod?.init;
        if (typeof worldInit !== "function") throw new Error("world.js loaded but did not export init(ctx)");
        await worldInit(ctx);
        log("✅ world loaded");
      } catch (e) {
        log("❌ world failed, loading FALLBACK world:");
        log(e?.message || String(e));
        if (e?.stack) log(e.stack);

        // Fallback minimal world so you NEVER get a black screen
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
      // Total boot failure
      const hudStatus = document.getElementById("status");
      hudStatus.textContent = "❌ BOOT FAILED";
      const hudLog = document.getElementById("log");
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

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(10, 0.12, 10, 80),
        new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.2 })
      );
      ring.rotation.x = Math.PI/2;
      ring.position.y = 0.08;
      scene.add(ring);

      rig.position.set(0, 1.7, -12);
      rig.lookAt(0, 1.6, 0);

      log("✅ FALLBACK world displayed (your real world module crashed — error above).");
    }
  }
};
