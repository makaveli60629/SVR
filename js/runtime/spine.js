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
      renderer.xr.setReferenceSpaceType("local-floor");
      document.body.appendChild(renderer.domElement);

      // Scene + Camera + Rig
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 900);
      const rig = new THREE.Group();
      rig.add(camera);
      scene.add(rig);

      // Controllers
      const controller1 = renderer.xr.getController(0);
      const controller2 = renderer.xr.getController(1);
      scene.add(controller1, controller2);

      // Shared ctx
      const ctx = {
        THREE, scene, camera, rig, renderer,
        controller1, controller2,
        teleportSurfaces: [],
        walkSurfaces: [],
        updates: [],
        log,
        // spawn preset (world.js can override these)
        spawnPos: new THREE.Vector3(0, 1.75, -34),
        spawnLook: new THREE.Vector3(0, 1.55, 0),
      };

      const applySpawn = ()=>{
        rig.position.copy(ctx.spawnPos);
        rig.lookAt(ctx.spawnLook);
        log("✅ spawn applied");
      };

      // Resize
      window.addEventListener("resize", ()=>{
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Buttons
      document.getElementById("btnReload").onclick = ()=> location.reload(true);
      document.getElementById("btnSpawn").onclick = ()=> applySpawn();

      // XR support detection
      const xrAvailable = !!navigator.xr;
      let vrSupported = false;
      log("navigator.xr=" + (xrAvailable ? "present ✅" : "missing ❌"));
      if (xrAvailable){
        try { vrSupported = await navigator.xr.isSessionSupported("immersive-vr"); } catch(e){ vrSupported = false; }
        log("immersive-vr supported=" + (vrSupported ? "✅" : "❌"));
      }

      // Enter VR
      document.getElementById("btnVR").onclick = async ()=>{
        log("▶ Enter VR pressed");
        try {
          if (!window.isSecureContext) throw new Error("WebXR requires HTTPS.");
          if (!navigator.xr) throw new Error("navigator.xr missing.");
          const ok = await navigator.xr.isSessionSupported("immersive-vr");
          if (!ok) throw new Error("immersive-vr not supported.");

          const session = await navigator.xr.requestSession("immersive-vr", {
            optionalFeatures: ["local-floor","bounded-floor","hand-tracking","layers","dom-overlay"],
            domOverlay: { root: document.body }
          });

          session.addEventListener("end", ()=>{
            log("ℹ️ XR session ended");
            setStatus("ready ✅");
          });

          await renderer.xr.setSession(session);

          // ✅ Critical: re-apply spawn AFTER session begins (fixes spawning over pit/origin)
          applySpawn();

          log("✅ Entered VR session");
          setStatus("VR ✅");
        } catch(e){
          log("❌ Enter VR failed: " + (e?.message || String(e)));
          if (e?.stack) log(e.stack);
          setStatus("ready ✅ (VR failed)");
        }
      };

      // Input init
      try {
        Input.init(ctx);
        ctx.updates.push((dt)=> Input.update(dt));
        log("✅ input loaded");
      } catch(e){
        log("❌ input failed: " + (e?.message || String(e)));
        if (e?.stack) log(e.stack);
      }

      // World load
      setStatus("loading world…");
      log("--- loading scarlett1/world.js ---");
      try {
        const mod = await import("../scarlett1/world.js");
        if (typeof mod?.init !== "function") throw new Error("world.js did not export init(ctx)");
        await mod.init(ctx);
        log("✅ world loaded");
      } catch(e){
        log("❌ world failed: " + (e?.message || String(e)));
        if (e?.stack) log(e.stack);
      }

      // Ensure spawn once at end of boot
      applySpawn();

      setStatus(vrSupported ? "ready ✅ (VR available)" : "ready ✅");

      // Render loop
      let last = performance.now();
      renderer.setAnimationLoop(()=>{
        const now = performance.now();
        const dt = Math.min(0.05, (now-last)/1000);
        last = now;

        for (const fn of ctx.updates){
          try { fn(dt); } catch(e){ log("❌ update error: " + (e?.message || e)); }
        }
        renderer.render(scene, camera);
      });

    } catch(e){
      setStatus("❌ BOOT FAILED");
      hudLog.textContent += "\n❌ BOOT FAILED:\n" + (e?.message || String(e)) + "\n";
      if (e?.stack) hudLog.textContent += e.stack + "\n";
      console.error(e);
    }
  }
};
