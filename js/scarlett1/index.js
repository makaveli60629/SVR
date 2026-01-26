// js/scarlett1/index.js — ULTIMATE SAFE-MODE SPINE
// PERMANENT_UPDATE_NEXT
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { createWorld } from './world.js';
import { initHands } from './modules/handPinch.js';

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  // Safety: force visible background so we know renderer is alive
  scene.background = new THREE.Color(0x050505);

  playerGroup = new THREE.Group();
  playerGroup.position.set(0, 1.6, 5); // spawn offset to avoid clipping
  scene.add(playerGroup);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
  playerGroup.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setClearColor(0x111111); // if you see dark grey, engine is working
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Add VRButton and wire your HUD button to it
  const vrBtn = VRButton.createButton(renderer);
  vrBtn.style.position = 'absolute';
  vrBtn.style.left = '10px';
  vrBtn.style.bottom = '10px';
  vrBtn.style.zIndex = '1100';
  document.body.appendChild(vrBtn);

  const enterBtn = document.getElementById('entervr');
  if (enterBtn) enterBtn.addEventListener('click', () => vrBtn.click());

  createWorld(scene);
  initHands(renderer, scene);

  window.addEventListener('resize', onResize);
  onResize();

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
