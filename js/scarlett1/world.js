// SCARLETT ONE — World Builder (SVR/js/scarlett1/world.js)
// RULES: Hands-only. No controllers. Safe-load textures from assets/textures/.

import * as THREE from 'three';
import { OculusHandModel } from 'three/addons/objects/OculusHandModel.js';

let hand1, hand2;
let canTurn = true;

const textureRoot = 'assets/textures/';

// ---------- SAFE TEXTURE MATERIAL ----------
function safeMat(fileName, fallbackColor = 0x202020, repeat = 4) {
  const mat = new THREE.MeshStandardMaterial({
    color: fallbackColor,
    roughness: 0.35,
    metalness: 0.12
  });

  const loader = new THREE.TextureLoader();
  loader.load(
    textureRoot + fileName,
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      mat.map = tex;
      mat.needsUpdate = true;
      console.log('[tex] loaded:', fileName);
    },
    undefined,
    () => console.warn('[tex] missing (fallback used):', fileName)
  );

  return mat;
}

export function createWorld(scene, camera, renderer, playerGroup) {
  // Always-visible environment
  scene.background = new THREE.Color(0x070a14);
  scene.fog = new THREE.Fog(0x070a14, 6, 140);

  // --- Lighting (anti-black screen) ---
  scene.add(new THREE.AmbientLight(0xffffff, 1.05));

  const sun = new THREE.DirectionalLight(0x00ffff, 1.35);
  sun.position.set(6, 12, 6);
  scene.add(sun);

  const mag = new THREE.PointLight(0xff00ff, 0.85, 30, 2);
  mag.position.set(-4, 3, -4);
  scene.add(mag);

  // --- Floor (textured if exists, otherwise visible fallback) ---
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    safeMat('floor.jpg', 0x151515, 6)
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // --- Grid (debug + depth) ---
  const grid = new THREE.GridHelper(120, 120, 0x00ff88, 0x112233);
  grid.position.y = 0.01;
  scene.add(grid);

  // --- “Lobby markers” (visible landmarks) ---
  addLandmarks(scene);

  // --- Hands (hands-only, mounted to rig) ---
  hand1 = renderer.xr.getHand(0);
  hand1.add(new OculusHandModel(hand1));
  playerGroup.add(hand1);

  hand2 = renderer.xr.getHand(1);
  hand2.add(new OculusHandModel(hand2));
  playerGroup.add(hand2);

  // Camera start
  camera.position.set(0, 1.6, 2);
  camera.lookAt(0, 1.4, -3);

  console.log('[world] initialized. textures from:', textureRoot);
}

function addLandmarks(scene) {
  // Rainbow cubes for guaranteed depth
  const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const cubeMat = new THREE.MeshNormalMaterial();

  for (let i = -2; i <= 2; i += 2) {
    const c = new THREE.Mesh(cubeGeo, cubeMat);
    c.position.set(i, 1.5, -3);
    scene.add(c);
  }

  // Monolith ring (big shapes so the world feels “real” immediately)
  const monoMat = safeMat('wall.jpg', 0x222244, 2);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6.5, 0.6), monoMat);
    const ang = (i / 6) * Math.PI * 2;
    const r = 18;
    m.position.set(Math.cos(ang) * r, 3.25, Math.sin(ang) * r);
    m.lookAt(0, 3.25, 0);
    scene.add(m);
  }
}

export function updateWorld(delta, playerGroup) {
  // Locomotion is only active when hand tracking is visible
  if (!hand1 || !hand1.visible) return;

  const moveSpeed = 3.0;
  const h = hand1.position;

  // Forward/back (push/pull hand)
  if (h.z < -0.15) {
    playerGroup.translateZ(-moveSpeed * delta);
  } else if (h.z > 0.15) {
    playerGroup.translateZ(moveSpeed * delta);
  }

  // Snap turn (hand left/right)
  if (canTurn) {
    if (h.x > 0.15) {
      playerGroup.rotation.y -= Math.PI / 4;
      canTurn = false;
      setTimeout(() => (canTurn = true), 450);
    } else if (h.x < -0.15) {
      playerGroup.rotation.y += Math.PI / 4;
      canTurn = false;
      setTimeout(() => (canTurn = true), 450);
    }
  }
}
