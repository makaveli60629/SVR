// js/scarlett1/index.js — PERMANENT SPINE (FULL MODULE PACK)
// PERMANENT_UPDATE_NEXT
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

import { createWorld, updateWorld } from './world.js';

import { Bus } from './modules/bus.js';
import { initHands } from './modules/handPinch.js';
import { initStore } from './modules/assetStore.js';
import { initDealer } from './modules/dealer.js';
import { initPhysics } from './modules/physics.js';
import { initChips } from './modules/chips.js';
import { initBridge } from './modules/bridge.js';
import { initCoach } from './modules/coach.js';
import { initNetwork } from './modules/network.js';
import { initAudio } from './modules/audio.js';
import { initUI } from './modules/ui.js';
import { initDiagnostics } from './modules/diagnostics.js';

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

  // Enter VR (Quest-safe)
  const vrBtn = VRButton.createButton(renderer);
  vrBtn.style.position = 'absolute';
  vrBtn.style.left = '10px';
  vrBtn.style.bottom = '10px';
  vrBtn.style.zIndex = '1100';
  document.body.appendChild(vrBtn);

  const enterBtn = document.getElementById('entervr');
  if (enterBtn) enterBtn.addEventListener('click', () => vrBtn.click());

  // HUD helpers
  window.hideHud = () => {
    const hud = document.getElementById('diag-hud');
    const term = document.getElementById('term-log');
    const vis = hud && hud.style.display !== 'none';
    if (hud) hud.style.display = vis ? 'none' : 'block';
    if (term) term.style.display = vis ? 'none' : 'block';
  };
  window.teleportHome = () => playerGroup.position.set(0, 1.6, 0);
  window.resetSpawn = () => playerGroup.position.set(0, 1.6, 0);

  // Boot world first
  createWorld(scene, camera, renderer, playerGroup);

  // Boot ALL modules (plug-and-play)
  Bus.init();
  initDiagnostics({ Bus });
  initUI({ Bus });
  initAudio({ Bus });
  initHands(renderer, scene);
  initPhysics({ Bus, scene });
  initDealer({ Bus, scene });
  initChips({ Bus, scene });
  initStore({ Bus, scene });
  initCoach({ Bus });
  initNetwork({ Bus });
  initBridge({ Bus });

  // UI status
  const st = document.getElementById('st-val');
  if (st) { st.textContent = 'ACTIVE'; st.style.color = '#0f0'; }
  Bus.log('SPINE SYNC: SUCCESSFUL.');
  Bus.log('MODULES LOADED: WORLD, HANDS, STORE, DEALER, PHYSICS, CHIPS, BRIDGE, COACH, NET, AUDIO, UI, DIAG.');

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
  const dt = clock.getDelta();
  updateWorld(dt, playerGroup, camera);

  // HUD XYZ
  const pos = playerGroup.position;
  const el = document.getElementById('pos-val');
  if (el) el.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;

  renderer.render(scene, camera);
}
