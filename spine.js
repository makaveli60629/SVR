/**
 * /spine.js — SCARLETT PERMANENT SPINE (VISIBILITY HARDENED)
 * Fixes:
 *  - Forces WebGL canvas fullscreen + behind HUD
 *  - Adds HUD toggle (hide/show)
 *  - Uses CDN Three + GLTFLoader (so avatars can load)
 *  - Loads /js/scarlett1/world.js reliably
 */

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

window.THREE = THREE;
THREE.GLTFLoader = GLTFLoader; // lets world.js detect it safely

export async function startSpine(){
  const diagEl = document.getElementById("diag");
  const hudEl  = document.getElementById("hud");

  const report = {
    build: "SPINE_VISIBILITY_HARDENED_V1",
    href: location.href,
    ua: navigator.userAgent,
    webgl: null,
    lastError: "none"
  };

  const log = (s)=>{
    console.log(s);
    if(diagEl) diagEl.textContent += `\n${s}`;
  };

  // --- CANVAS + RENDERER (FORCE FULLSCREEN) ---
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,              // allow HUD overlay / transparency
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.xr.enabled = true;

  // Force canvas into view
  const canvas = renderer.domElement;
  canvas.id = "scarlett-canvas";
  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.zIndex = "0";
  canvas.style.pointerEvents = "none"; // HUD gets touches
  canvas.style.background = "transparent";

  document.body.appendChild(canvas);

  // --- SCENE + CAMERA ---
  const scene = new THREE.Scene();
  scene.background = null; // keep transparent so CSS doesn't hide it

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.05,
    1500
  );
  camera.position.set(0, 1.7, 16);

  // XR rig (optional)
  const rig = new THREE.Group();
  rig.add(camera);
  scene.add(rig);

  // Basic lights (so you ALWAYS see something)
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(10, 18, 12);
  scene.add(sun);

  // Quick "always visible" debug axis in case world fails
  const axes = new THREE.AxesHelper(3);
  axes.position.set(0, 0.05, 0);
  scene.add(axes);

  // --- Resize handling ---
  const onResize = ()=>{
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener("resize", onResize);

  // --- Spawn controls for HUD buttons ---
  let spawnPos = new THREE.Vector3(0, 0, 16);
  let spawnYaw = 0;

  const setXRSpawn = (pos, yaw=0)=>{
    spawnPos.copy(pos);
    spawnYaw = yaw;
  };

  const resetSpawn = ()=>{
    camera.position.copy(spawnPos).add(new THREE.Vector3(0, 1.7, 0));
    camera.rotation.set(0, spawnYaw, 0);
    log("[spine] resetSpawn ✅");
  };

  const enterVR = async ()=>{
    try{
      if(!navigator.xr) return log("[spine] WebXR not available");
      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor","bounded-floor","hand-tracking","layers"]
      });
      await renderer.xr.setSession(session);
      log("[spine] Enter VR ✅");
    }catch(e){
      report.lastError = String(e?.message || e);
      log(`[spine] Enter VR failed ❌ ${report.lastError}`);
    }
  };

  const toggleHUD = (force)=>{
    if(!hudEl) return;
    const show = (force === undefined) ? (hudEl.style.display === "none") : force;
    hudEl.style.display = show ? "block" : "none";
    log(show ? "[ui] HUD shown ✅" : "[ui] HUD hidden ✅");
  };

  const getReport = ()=>{
    return JSON.stringify(report, null, 2);
  };

  // Expose to your buttons
  window.SCARLETT = {
    enterVR,
    resetSpawn,
    toggleHUD,
    getReport
  };

  // --- WebGL detect ---
  try{
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    report.webgl = gl ? "ok" : "failed";
  }catch(e){
    report.webgl = "error";
  }

  log("[boot] JS LOADED ✅ (module tag ran)");
  log("[spine] renderer created ✅");

  // --- Load world module ---
  let worldMod = null;
  try{
    worldMod = await import("./js/scarlett1/world.js");
    log("[spine] world module loaded ✅ (/js/scarlett1/world.js)");
  }catch(e){
    report.lastError = String(e?.message || e);
    log(`[spine] world import failed ❌ ${report.lastError}`);
  }

  // --- Init world ---
  let updates = [];
  try{
    if(worldMod?.init){
      const world = await worldMod.init({ THREE, scene, camera, rig, renderer, setXRSpawn, log });
      updates = world?.updates || [];
      log(`[spine] world init ✅ updates=${updates.length}`);
    }else{
      log("[spine] world.init missing ❌");
    }
  }catch(e){
    report.lastError = String(e?.message || e);
    log(`[spine] world init failed ❌ ${report.lastError}`);
  }

  // --- ANIMATION LOOP ---
  let last = performance.now();
  renderer.setAnimationLoop(()=>{
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // run world updates
    for(const fn of updates){
      try{ fn(dt); }catch(e){}
    }

    renderer.render(scene, camera);
  });

  log("[spine] animation loop ✅");
  log("[boot] spine started ✅");

  // Ensure spawn once
  resetSpawn();
}
