/* ===============================
   SCARLETT1 MAIN BOOTSTRAP
   Quest + GitHub Pages SAFE
   =============================== */

console.log("Scarlett1 main.js booting…");

// ---------- THREE.JS (CDN SAFE) ----------
import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { VRButton } from "https://unpkg.com/three@0.158.0/examples/jsm/webxr/VRButton.js";

// expose globally so legacy modules don’t break
window.THREE = THREE;

// ---------- BASIC SAFETY ----------
window.addEventListener("error", e =>
  console.error("GLOBAL ERROR:", e.message)
);
window.addEventListener("unhandledrejection", e =>
  console.error("PROMISE ERROR:", e.reason)
);

// ---------- SCENE CORE ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.6, 3);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

// ---------- XR BUTTON (SAFE) ----------
try {
  document.body.appendChild(VRButton.createButton(renderer));
  console.log("XR enabled");
} catch (e) {
  console.warn("XR unavailable, running flat mode");
}

// ---------- LIGHTING ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 5);
scene.add(dir);

// ---------- FLOOR (FAILSAFE) ----------
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// ---------- MODULE LOADER (SAFE IMPORTS) ----------
async function loadModule(path) {
  try {
    console.log("Loading:", path);
    return await import(path);
  } catch (e) {
    console.error("MODULE FAIL:", path, e.message);
  }
}

// ---------- LOAD SCARLETT1 MODULES ----------
(async () => {

  await loadModule("./modules/diagnostics.js");
  await loadModule("./modules/lobbyEnvironment.js");
  await loadModule("./modules/futuristicTable.js");
  await loadModule("./modules/jumbotron.js");
  await loadModule("./modules/bots.js");
  await loadModule("./modules/locomotion.js");

  console.log("Scarlett1 modules loaded");

})();

// ---------- RENDER LOOP ----------
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

// ---------- RESIZE ----------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
