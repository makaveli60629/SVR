import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { buildUndergroundGarageScene } from "./modules/underground_garage_scene.js";

const boot = document.getElementById("boot");
function log(...args){ if (boot) boot.textContent = args.map(x => typeof x === "string" ? x : JSON.stringify(x)).join(" "); }

const app = document.getElementById("app");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 240);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const runtime = buildUndergroundGarageScene({ scene, camera, renderer, log });
log("PHASE-117-UNDERGROUND-GARAGE-POKER-ROOM-LOCK\nReady. WASD move, mouse drag look. Click portals.");

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let last = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  runtime.tick?.(dt);
  renderer.render(scene, camera);
});
