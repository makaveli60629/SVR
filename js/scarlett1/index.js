// js/scarlett1/index.js — PERMANENT SPINE (only additive wiring)
// PERMANENT_UPDATE_NEXT
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { createWorld, updateWorld } from './world.js';
import { initHands } from './modules/handPinch.js';
import { initStore } from './modules/assetStore.js';

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  playerGroup = new THREE.Group();
  playerGroup.position.set(0, 1.6, 0);
  scene.add(playerGroup);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  playerGroup.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Official Three.js VR entry button (Quest-safe)
  const vrBtn = VRButton.createButton(renderer);
  vrBtn.style.position = 'absolute';
  vrBtn.style.left = '10px';
  vrBtn.style.bottom = '10px';
  vrBtn.style.zIndex = '1100';
  document.body.appendChild(vrBtn);

  // Bind your big UI button to click the VRButton
  const enterBtn = document.getElementById('entervr');
  if (enterBtn) enterBtn.addEventListener('click', () => vrBtn.click());

  createWorld(scene, camera, renderer, playerGroup);

  // Hands-only visuals (safe no-op if hands unsupported)
  initHands(renderer, scene);

  // Store DOM hooks + equip callbacks
  initStore(scene);

  // Admin utilities
  window.teleportHome = () => playerGroup.position.set(0, 1.6, 0);
  window.resetSpawn = () => playerGroup.position.set(0, 1.6, 0);

  window.addEventListener('resize', onResize);
  onResize();

  renderer.setAnimationLoop(tick);
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function tick() {
  const delta = clock.getDelta();
  updateWorld(delta, playerGroup);
  renderer.render(scene, camera);

  const pos = playerGroup.position;
  const el = document.getElementById('pos-val');
  if (el) el.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
}
