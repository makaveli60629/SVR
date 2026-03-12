/**
 * SVR Poker — core.js
 * Initializes the Three.js renderer, scene, camera, and lights
 * Three.js r170
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170/examples/jsm/controls/OrbitControls.js';

export function initCore(canvas) {
  // ── Renderer ──────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled      = true;
  renderer.shadowMap.type         = THREE.PCFSoftShadowMap;
  renderer.toneMapping            = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure    = 1.1;

  // ── Scene ─────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070709);
  scene.fog        = new THREE.FogExp2(0x070709, 0.018);

  // ── Camera ────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 3.5, 6.5);
  camera.lookAt(0, 0.8, 0);

  // ── Controls ──────────────────────────────────────────────────────────
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.8, 0);
  controls.enableDamping  = true;
  controls.dampingFactor  = 0.06;
  controls.minDistance    = 3;
  controls.maxDistance    = 14;
  controls.maxPolarAngle  = Math.PI / 2.1;

  // ── Lighting ──────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x6644aa, 0.8));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(5, 10, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xb95aff, 1.8, 20);
  fillLight.position.set(-4, 3, -2);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0x5dd8ff, 1.2, 15);
  rimLight.position.set(4, 2, -4);
  scene.add(rimLight);

  // ── Resize handler ────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera, controls, fillLight, rimLight };
}
