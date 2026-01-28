// /index.js
// SCARLETT ROOT BOOTLOADER — CANVAS MOUNT FIX

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { Spine } from "./js/scarlett1/spine.js";

const app = document.getElementById("app");

// ---- BASIC RENDERER ----
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

// 🔴 THIS WAS MISSING — THIS FIXES THE BLACK SCREEN
app.appendChild(renderer.domElement);

// ---- START SPINE ----
console.log("[root] starting spine");
const spine = new Spine(renderer);
spine.start();

// ---- RESIZE ----
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  spine.onResize?.();
});

// ---- VR BUTTON HANDOFF ----
document.addEventListener("scarlett-enter-vr", async () => {
  if (navigator.xr) {
    try {
      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor"],
      });
      renderer.xr.setSession(session);
      console.log("[xr] session started");
    } catch (e) {
      console.warn("[xr] failed", e);
    }
  }
});

// ---- MAIN LOOP ----
renderer.setAnimationLoop(() => {
  spine.tick?.();
  renderer.render(spine.scene, spine.camera);
});
