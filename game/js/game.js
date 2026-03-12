/**
 * SVR Poker — game.js (Three.js scene utilities)
 * Imported as needed by game/index.html
 * Three.js r170
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170/examples/jsm/loaders/GLTFLoader.js';

/**
 * Create a simple procedural poker table mesh
 * @param {THREE.Scene} scene
 * @param {THREE.Texture|null} feltTexture
 */
export function createProceduralTable(scene, feltTexture = null) {
  const mat = new THREE.MeshStandardMaterial({
    color: feltTexture ? 0xffffff : 0x0a5c2f,
    map:   feltTexture || null,
    roughness: 0.85,
    metalness: 0.0,
  });

  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.12, 64), mat);
  top.position.set(0, 0.76, 0);
  top.receiveShadow = true;
  top.castShadow    = true;
  scene.add(top);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.12, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0x3b1e00, roughness: 0.5, metalness: 0.3 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.82, 0);
  scene.add(rim);

  return { top, rim };
}

/**
 * Load GLB model, replace with fallback if file is empty/missing
 */
export function loadModelSafe(scene, url, onSuccess, onFallback) {
  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    gltf.scene.traverse(c => {
      if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSuccess(gltf.scene);
  }, undefined, () => {
    if (onFallback) onFallback();
  });
}

/**
 * Build a starfield
 */
export function createStarfield(scene, count = 1200) {
  const geo  = new THREE.BufferGeometry();
  const pos  = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 180 + Math.random() * 60;
    pos[i]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i+1] = Math.abs(r * Math.cos(phi)) + 5;
    pos[i+2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: true }));
  scene.add(stars);
  return stars;
}

/**
 * Create the moon sphere with bump texture
 */
export function createMoon(scene) {
  const texLoader = new THREE.TextureLoader();
  const moonTex   = texLoader.load('assets/textures/moon_diffuse.png');
  const moonBump  = texLoader.load('assets/textures/moon_bump.png');
  const moon      = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 48, 48),
    new THREE.MeshStandardMaterial({ map: moonTex, bumpMap: moonBump, bumpScale: 0.3, roughness: 1.0 })
  );
  moon.position.set(12, 18, -40);
  scene.add(moon);
  return moon;
}
