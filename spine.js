// spine.js — ROOT — PERMANENT
// This file MUST create the renderer + canvas or nothing will ever show

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const log = (m) => {
  const el = document.getElementById("diag");
  if (el) el.textContent += `\n${m}`;
  console.log(m);
};

export function startSpine() {
  log("[spine] starting…");

  // ---------- SCENE ----------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05050b);

  // ---------- CAMERA ----------
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    500
  );
  camera.position.set(0, 1.6, 4);

  // ---------- RENDERER ----------
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;

  // 🔥 FORCE CANVAS VISIBILITY
  renderer.domElement.id = "scarlett-canvas";
  renderer.domElement.style.position = "fixed";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.width = "100vw";
  renderer.domElement.style.height = "100vh";
  renderer.domElement.style.zIndex = "0";

  document.body.appendChild(renderer.domElement);
  log("[spine] renderer created ✅");

  // ---------- LIGHT (so you SEE something even if world fails) ----------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 2.0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.5);
  dir.position.set(5, 10, 5);
  scene.add(dir);

  // ---------- WORLD MODULE ----------
  import("./js/scarlett1/world.js")
    .then((mod) => {
      log("[spine] world module loaded ✅");

      if (mod.initWorld) {
        mod.initWorld({ THREE, scene, camera, renderer });
        log("[world] initWorld() called ✅");
      } else {
        log("[world][warn] initWorld not found");
      }
    })
    .catch((err) => {
      log("[world][error] " + err.message);
      console.error(err);
    });

  // ---------- RESIZE ----------
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- LOOP ----------
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });

  log("[spine] animation loop running ✅");

  // ---------- GLOBAL API ----------
  window.SCARLETT = {
    enterVR: () => renderer.xr.enabled && navigator.xr && renderer.xr.setSession,
    resetSpawn: () => camera.position.set(0, 1.6, 4),
    toggleHUD: (show) => {
      const hud = document.getElementById("hud");
      if (hud) hud.style.display = show ? "block" : "none";
    },
    getReport: () =>
      document.getElementById("diag")?.textContent || "",
  };

  log("[spine] spine started ✅");
}
