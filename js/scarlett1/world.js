import * as THREE from 'three';
import { initAssetStore } from './modules/assetStore.js';

let assetStore;

export function createWorld(scene, camera, renderer, playerGroup) {
  // Make it NEVER black
  scene.background = new THREE.Color(0x020205);

  const hemi = new THREE.HemisphereLight(0x99ffcc, 0x001010, 0.8);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(4, 6, 2);
  scene.add(dir);

  // Poker Table Geometry
  const tableGeo = new THREE.CylinderGeometry(2, 2, 0.2, 32);
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x004400 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, 0.9, -3); 
  scene.add(table);

  // Floor Grid
  const grid = new THREE.GridHelper(20, 20, 0x00ff00, 0x111111);
  scene.add(grid);

  // Asset Store (module) — includes pointer + optional hand-pinch selection
  assetStore = initAssetStore(scene, camera, renderer);
}

export function updateWorld(delta, playerGroup) {
  const cam = playerGroup.children.find(o => o.isCamera) || null;
  if (assetStore && cam) assetStore.update(delta, cam);
}
