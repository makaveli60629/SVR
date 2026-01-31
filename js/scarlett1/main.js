import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { VRButton } from "https://unpkg.com/three@0.158.0/examples/jsm/webxr/VRButton.js";

import { hudSetTop, hudLog } from "./modules/diagnostics.js";
import { buildLobby } from "./modules/lobbyEnvironment.js";
import { buildPitTable } from "./modules/futuristicTable.js";
import { buildJumbotron } from "./modules/jumbotron.js";
import { spawnDemoBots, tickBots } from "./modules/bots.js";
import { createLocomotion } from "./modules/locomotion.js";

window.THREE = THREE;

const btnEnter = document.getElementById("btnEnter");

hudSetTop("World boot…");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 8, 70);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Visible "proof-of-render" cube (so we KNOW the scene is alive)
const bootCube = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 0.18, 0.18),
  new THREE.MeshBasicMaterial({ color: 0x00e5ff })
);
bootCube.position.set(0, 0, -0.75);
camera.add(bootCube);

// Player rig
const rig = new THREE.Group();
rig.position.set(0, 0, 3.2);
scene.add(rig);

rig.add(camera);
camera.position.set(0, 1.6, 0);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.22));
const key = new THREE.DirectionalLight(0xffffff, 0.95);
key.position.set(6, 10, 4);
scene.add(key);

// Floor
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(40, 72),
  new THREE.MeshStandardMaterial({ color: 0x07090c, roughness: 0.95, metalness: 0.0 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// WebXR button (safe)
try {
  document.body.appendChild(VRButton.createButton(renderer));
  hudLog("XR button added ✅");
} catch (e) {
  hudLog("XR button unavailable (flat ok)");
}

// Lobby builds immediately
buildLobby(THREE, scene);

// Locomotion
const locomotion = createLocomotion(THREE, renderer, rig, camera);

// Poker Pit spawn on button press
let pit = null;
let bots = [];

btnEnter?.addEventListener("click", () => {
  if (pit) return;
  hudLog("Entering Poker Pit…");

  pit = new THREE.Group();
  scene.add(pit);

  const { tableGroup, seatAnchors } = buildPitTable(THREE);
  pit.add(tableGroup);

  const jumbo = buildJumbotron(THREE);
  jumbo.position.set(0, 3.2, -8);
  pit.add(jumbo);

  bots = spawnDemoBots(THREE, pit, seatAnchors);

  hudSetTop("Poker Pit ready ✅");
});

// Resize
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

hudSetTop("World ready ✅ (cyan cube proves render)");
hudLog("Press 'Enter Poker Pit' to spawn table + seats + jumbotron + bots.");

// Render loop
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  locomotion.update(dt);
  if (bots.length) tickBots(dt, bots);
  renderer.render(scene, camera);
});
