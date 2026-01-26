import * as THREE from 'three';
import { Locomotion } from './modules/locomotion.js';

export function createWorld(scene, camera, renderer, playerGroup) {
  scene.background = new THREE.Color(0x020205);

  const hemi = new THREE.HemisphereLight(0x99ffcc, 0x001010, 0.8);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(4, 6, 2);
  scene.add(dir);

  const tableGeo = new THREE.CylinderGeometry(2, 2, 0.2, 32);
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x004400 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, 0.9, -3);
  scene.add(table);

  scene.add(new THREE.GridHelper(40, 40, 0x00ff00, 0x111111));

  Locomotion.init();
}

export function updateWorld(delta, playerGroup) {
  Locomotion.update(delta, playerGroup);
}
