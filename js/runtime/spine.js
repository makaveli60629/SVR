import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { Input } from "./input.js";

export const Spine = {
  async start(){
    const hudStatus = document.getElementById("status");
    const hudLog = document.getElementById("log");

    const log = (m) => {
      hudLog.textContent += String(m) + "\n";
      hudLog.scrollTop = hudLog.scrollHeight;
      console.log(m);
    };
    const setStatus = (t) => (hudStatus.textContent = t);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local-floor");
    document.body.appendChild(renderer.domElement);

    // Scene + rig + camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 900);
    const rig = new THREE.Group();
    rig.add(camera);
    scene.add(rig);

    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);
    scene.add(controller1, controller2);

    const ctx = {
      THREE, scene, camera, rig, renderer,
      controller1, controller2,
      teleportSurfaces: [],
      walkSurfaces: [],
      updates: [],
      log,
      spawnPos: new THREE.Vector3(0, 1.75, -42),
      spawnLook: new THREE.Vector3(0, 1.55, 0),
      spawnYaw: 0, // ✅ forced yaw
    };

    const applySpawn = ()=>{
      rig.position.copy(ctx.spawnPos);
      rig.rotation.set(0, ctx.spawnYaw, 0);
      // lookAt after yaw so it’s consistent
      rig.lookAt(ctx.spawnLook);
      log("✅ spawn applied");
    };

    window.addEventListener("resize", ()=>{
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.getElementById("btnReload").onclick = ()=> location.reload(true);
    document.getElementById("btnSpawn").onclick = ()=> applySpawn();

    document.getElementById("btnVR").onclick = async ()=>{
      log("▶ Enter VR pressed");
      try{
        if (!window.isSecureContext) throw new Error("WebXR requires HTTPS.");
        if (!navigator.xr) throw new Error("navigator.xr missing.");
        const ok = await navigator.xr.isSessionSupported("immersive-vr");
        if (!ok) throw new Error("immersive-vr not supported.");

        const session = await navigator.xr.requestSession("immersive-vr", {
          optionalFeatures: ["local-floor","bounded-floor","hand-tracking","layers","dom-overlay"],
          domOverlay: { root: document.body }
        });

        await renderer.xr.setSession(session);

        // ✅ spawn AFTER session starts
        applySpawn();

        setStatus("VR ✅");
        log("✅ entered VR");
      } catch(e){
        log("❌ Enter VR failed: " + (e?.message || e));
        setStatus("ready ✅ (VR failed)");
      }
    };

    // Input
    Input.init(ctx);
    ctx.updates.push((dt)=> Input.update(dt));
    log("✅ input loaded");

    // World
    setStatus("loading world…");
    log("--- loading scarlett1/world.js ---");
    try{
      const mod = await import("../scarlett1/world.js");
      await mod.init(ctx);
      log("✅ world loaded");
    } catch(e){
      log("❌ world failed: " + (e?.message || e));
      if (e?.stack) log(e.stack);
    }

    applySpawn();
    setStatus("ready ✅");

    let last = performance.now();
    renderer.setAnimationLoop(()=>{
      const now = performance.now();
      const dt = Math.min(0.05, (now-last)/1000);
      last = now;

      for (const fn of ctx.updates){
        try{ fn(dt); } catch(e){ log("❌ update error: " + (e?.message || e)); }
      }

      renderer.render(scene, camera);
    });
  }
};
