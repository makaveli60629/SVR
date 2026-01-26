import * as THREE from 'three';
import { Locomotion } from './modules/locomotion.js';

export function createWorld(scene, camera, renderer, playerGroup) {
  scene.background = new THREE.Color(0x020205);

  const hemi = new THREE.HemisphereLight(0x99ffcc, 0x001010, 0.85);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(4, 6, 2);
  scene.add(dir);

  // Poker table
  const table = new THREE.Group();
  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 0.2, 32),
    new THREE.MeshStandardMaterial({ color: 0x004400 })
  );
  felt.position.y = 0.0;

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(2, 0.12, 16, 100),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 0.12;

  table.add(felt, rail);
  table.position.set(0, 0.82, -3);
  scene.add(table);

  // floor grid
  scene.add(new THREE.GridHelper(40, 40, 0x00ff00, 0x111111));

  // movement (debug safe)
  Locomotion.init();
}

export function updateWorld(dt, playerGroup, camera) {
  Locomotion.update(dt, playerGroup);
}
