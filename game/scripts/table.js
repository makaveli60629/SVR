/**
 * SVR Poker — table.js
 * Three.js r170 — Creates the poker table geometry
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170/build/three.module.js';

export function createTable(scene, feltTexture = null) {
  const feltMat = new THREE.MeshStandardMaterial({
    color:     feltTexture ? 0xffffff : 0x0b5d0b,
    map:       feltTexture || null,
    roughness: 0.85,
    metalness: 0.0,
  });

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 0.12, 64),
    feltMat
  );
  table.position.y = 0.76;
  table.receiveShadow = true;
  table.castShadow    = true;
  scene.add(table);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.12, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0x3b1e00, roughness: 0.5, metalness: 0.3 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.82, 0);
  rim.castShadow = true;
  scene.add(rim);

  return { table, rim };
}
