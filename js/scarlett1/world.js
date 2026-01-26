import * as THREE from 'three';
import { initVideoFeed } from './modules/videoFeed.js';

export function createWorld(scene) {
  // 1) Atmosphere
  scene.fog = new THREE.FogExp2(0x000000, 0.10);

  // 2) Lighting rig (safe + cinematic)
  const spotLight = new THREE.SpotLight(0x00ff00, 15, 20, Math.PI / 4, 0.5);
  spotLight.position.set(0, 8, 0);
  scene.add(spotLight);
  scene.add(new THREE.AmbientLight(0x0a0a20, 0.8));
  const safetySun = new THREE.DirectionalLight(0xffffff, 1.4);
  safetySun.position.set(5, 10, 5);
  scene.add(safetySun);

  const worldGroup = new THREE.Group();

  // 3) Sunken pit + high ground
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(4.5, 30, 64),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9, emissive: 0x001000, emissiveIntensity: 0.6 })
  );
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 1.6;
  worldGroup.add(floor);

  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 64),
    new THREE.MeshStandardMaterial({ color: 0x020202, emissive: 0x000600, emissiveIntensity: 0.5, roughness: 1.0 })
  );
  pitFloor.rotation.x = -Math.PI/2;
  pitFloor.position.y = 0.0;
  worldGroup.add(pitFloor);

  // Neon rim lip
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(4.5, 0.04, 16, 120),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  rim.rotation.x = Math.PI/2;
  rim.position.y = 1.61;
  worldGroup.add(rim);

  // 4) Jumbotrons (2 screens + live canvas feed)
  function createJumbotron(x, z, ry, id) {
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4.5),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x00ff00,
        emissiveIntensity: 0.25,
        side: THREE.DoubleSide
      })
    );
    screen.position.set(x, 5.5, z);
    screen.rotation.y = ry;
    scene.add(screen);
    initVideoFeed(screen, id);
    return screen;
  }

  const j1 = createJumbotron(0, -12, 0, "main");
  const j2 = createJumbotron(12, 0, -Math.PI/2, "side");

  // Global updater updates both screens
  window.updateJumbotron = (title, status) => {
    window.__jumbotronUpdate?.("main", title, status);
    window.__jumbotronUpdate?.("side", title, status);
  };
  window.updateJumbotron("Scarlett Empire", "Lobby Active");

  // 5) Center table (pit pedestal)
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 0.3, 40),
    new THREE.MeshStandardMaterial({ color: 0x004400, roughness: 0.8, emissive: 0x001100, emissiveIntensity: 0.8 })
  );
  table.position.set(0, 0.95, 0);
  worldGroup.add(table);
  scene.userData.table = table;

  // Skybox (inside-visible)
  const sky = new THREE.Mesh(
    new THREE.BoxGeometry(160, 160, 160),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide })
  );
  scene.add(sky);

  scene.add(worldGroup);

  // Helpers (kept for safety while we build)
  scene.add(new THREE.GridHelper(80, 80, 0x00ff00, 0x111111));
  scene.add(new THREE.AxesHelper(3));
}

export function updateWorld(dt, playerGroup, camera) {
  // reserved
}
