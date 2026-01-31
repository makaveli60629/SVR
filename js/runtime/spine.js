import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { Input } from "./input.js";

export const Spine = {
  async start(){
    const hudStatus = document.getElementById("status");
    const hudLog = document.getElementById("log");
    const btnVR = document.getElementById("btnVR");
    const btnSpawn = document.getElementById("btnSpawn");
    const btnReload = document.getElementById("btnReload");

    const log = (m) => {
      const line = (typeof m === "string") ? m : JSON.stringify(m, null, 2);
      hudLog.textContent += line + "\n";
      hudLog.scrollTop = hudLog.scrollHeight;
      console.log(line);
    };
    const setStatus = (t) => { hudStatus.textContent = t; };

    // Show *every* error on the HUD
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

      const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 800);
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
        log
      };

      // Resize
      window.addEventListener("resize", ()=>{
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Buttons
      btnReload.onclick = ()=> location.reload(true);

      btnSpawn.onclick = ()=>{
        rig.position.set(0, 1.7, -26);
        rig.lookAt(0, 1.6, 0);
        log("✅ spawn reset");
      };

      // ✅ Detect XR support at boot (so we don’t guess)
      let xrAvailable = !!navigator.xr;
      let vrSupported = false;
      let arSupported = false;

      log("navigator.xr=" + (xrAvailable ? "present ✅" : "missing ❌"));

      if (xrAvailable) {
        try { vrSupported = await navigator.xr.isSessionSupported("immersive-vr"); }
        catch(e){ vrSupported = false; }
        try { arSupported = await navigator.xr.isSessionSupported("immersive-ar"); }
        catch(e){ arSupported = false; }

        log("immersive-vr supported=" + (vrSupported ? "✅" : "❌"));
        log("immersive-ar supported=" + (arSupported ? "✅" : "❌"));
      } else {
        log("Tip: Quest requires Meta/Oculus Browser. Most phones won’t expose navigator.xr for VR.");
      }

      // Update the Enter VR button based on support
      if (!vrSupported) {
        btnVR.disabled = true;
        btnVR.style.opacity = "0.5";
        btnVR.textContent = "VR Unsupported";
        setStatus("ready ✅ (VR unsupported on this device)");
      }

      // ✅ REAL Enter VR
      btnVR.onclick = async ()=>{
        log("▶ Enter VR pressed");
        setStatus("requesting VR…");

        try {
          if (!window.isSecureContext) throw new Error("WebXR requires HTTPS (secure context).");
          if (!navigator.xr) throw new Error("navigator.xr missing (not WebXR capable browser).");

          const ok = await navigator.xr.isSessionSupported("immersive-vr");
          if (!ok) throw new Error("immersive-vr not supported on this device/browser.");

          const session = await navigator.xr.requestSession("immersive-vr", {
            optionalFeatures: [
              "local-floor",
              "bounded-floor",
              "hand-tracking",
              "layers",
              "dom-overlay"
            ],
            domOverlay: { root: document.body }
          });

          session.addEventListener("end", ()=>{
            log("ℹ️ XR session ended");
            setStatus("ready ✅");
          });

          await renderer.xr.setSession(session);
          log("✅ Entered VR session");
          setStatus("VR ✅");
        } catch (e) {
          log("❌ Enter VR failed:");
          log(e?.message || String(e));
          if (e?.stack) log(e.stack);
          setStatus("ready ✅ (VR failed)");
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

      // Load world
      setStatus("loading world…");
      log("--- loading scarlett1/world.js ---");
      try {
        const mod = await import("../scarlett1/world.js");
        const worldInit = mod?.init;
        if (typeof worldInit !== "function") throw new Error("world.js did not export init(ctx)");
        await worldInit(ctx);
        log("✅ world loaded");
      } catch (e) {
        log("❌ world failed:");
        log(e?.message || String(e));
        if (e?.stack) log(e.stack);
      }

      // Render loop
      if (vrSupported) setStatus("ready ✅ (VR available)");
      else setStatus("ready ✅");

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
  }
};
