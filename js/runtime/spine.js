import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { XRControllerModelFactory } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRHandModelFactory.js";
import { Input } from "./input.js";

export const Spine = {
  async start(){
    const hudStatus = document.getElementById("status");
    const hudLog = document.getElementById("log");

    const log = (m) => {
      try{
        hudLog.textContent += String(m) + "\n";
        hudLog.parentElement.scrollTop = hudLog.parentElement.scrollHeight;
      }catch(e){}
      console.log(m);
    };
    const setStatus = (t) => { try{ hudStatus.textContent = t; }catch(e){} };

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local-floor");
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05020c);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 900);

    // Player rig
    const rig = new THREE.Group();
    rig.add(camera);
    scene.add(rig);

    // XR controllers + grips + hands
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);
    scene.add(controller1, controller2);

    const grip1 = renderer.xr.getControllerGrip(0);
    const grip2 = renderer.xr.getControllerGrip(1);
    scene.add(grip1, grip2);

    // Controller models (Touch)
    const cmf = new XRControllerModelFactory();
    grip1.add(cmf.createControllerModel(grip1));
    grip2.add(cmf.createControllerModel(grip2));

    // Hand tracking models
    const hand1 = renderer.xr.getHand(0);
    const hand2 = renderer.xr.getHand(1);
    scene.add(hand1, hand2);

    const hmf = new XRHandModelFactory();
    hand1.add(hmf.createHandModel(hand1, "mesh"));
    hand2.add(hmf.createHandModel(hand2, "mesh"));

    function wireXR(ctrl){
      ctrl.userData.handedness = "unknown";
      ctrl.userData.gamepad = null;

      ctrl.addEventListener("connected", (e)=>{
        const src = e?.data; // XRInputSource
        ctrl.userData.handedness = src?.handedness || "unknown";
        ctrl.userData.gamepad = src?.gamepad || null;
        log(`✅ controller connected: ${ctrl.userData.handedness}`);
      });

      ctrl.addEventListener("disconnected", ()=>{
        log(`⚠️ controller disconnected: ${ctrl.userData.handedness}`);
        ctrl.userData.handedness = "unknown";
        ctrl.userData.gamepad = null;
      });
    }
    wireXR(controller1);
    wireXR(controller2);

    const ctx = {
      THREE, scene, camera, rig, renderer,
      controller1, controller2, grip1, grip2, hand1, hand2,

      teleportSurfaces: [],
      walkSurfaces: [],
      updates: [],
      log,

      bounds: null,

      spawnPos: new THREE.Vector3(0, 1.75, -42),
      spawnLook: new THREE.Vector3(0, 1.55, 0),
    };

    const applySpawn = ()=>{
      rig.position.copy(ctx.spawnPos);
      rig.lookAt(ctx.spawnLook);
      log("✅ spawn applied");
    };

    // expose buttons for index.html handlers
    window.__SVR_RESET_SPAWN = applySpawn;
    window.__SVR_ENTER_VR = async ()=>{
      log("▶ Enter VR pressed");
      try{
        if (!window.isSecureContext) throw new Error("WebXR requires HTTPS");
        if (!navigator.xr) throw new Error("navigator.xr missing");
        const ok = await navigator.xr.isSessionSupported("immersive-vr");
        if (!ok) throw new Error("immersive-vr not supported");

        const session = await navigator.xr.requestSession("immersive-vr", {
          optionalFeatures: ["local-floor","bounded-floor","hand-tracking","layers","dom-overlay"],
          domOverlay: { root: document.body }
        });

        await renderer.xr.setSession(session);
        applySpawn();
        setStatus("VR ✅");
        log("✅ entered VR");
      }catch(e){
        log("❌ Enter VR failed: " + (e?.message || e));
        setStatus("ready ✅ (VR failed)");
      }
    };

    window.addEventListener("resize", ()=>{
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Input
    Input.init(ctx);
    ctx.updates.push((dt)=> Input.update(dt));
    log("✅ input loaded");

    // World (THIS IS THE FIXED PATH)
    setStatus("loading world…");
    log("--- loading scarlett1/world.js ---");
    try{
      // spine.js is /SVR/js/runtime/spine.js
      // world.js will be /SVR/scarlett1/world.js
      const mod = await import("../../scarlett1/world.js?v=" + Date.now());
      await mod.init(ctx);
      log("✅ world loaded");
    }catch(e){
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
        try{ fn(dt); }catch(e){ log("❌ update error: " + (e?.message || e)); }
      }

      renderer.render(scene, camera);
    });
  }
};
