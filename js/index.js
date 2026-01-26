// js/scarlett1/index.js — GRAND LOBBY SPINE (Hands-only + Locomotion + Avatars + Jumbotron Feed)
// PERMANENT_UPDATE_NEXT
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

import { createWorld, updateWorld } from './world.js';
import { initHands } from './modules/handPinch.js';
import { initLocomotion } from './modules/locomotion.js';
import { initDealer } from './modules/dealer.js';
import { initChips } from './modules/chips.js';
import { initDiagnostics } from './modules/diagnostics.js';
import { Bus } from './modules/bus.js';
import { initAvatars } from './modules/avatarManager.js';
import { initRadio } from './modules/radio.js';
import { spawnFloatingCard, updateCardHUD } from './modules/cardHUD.js';
import { initBots, updateBots } from './modules/bots.js';

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();
  scene.background = new THREE.Color(0x050505);

  playerGroup = new THREE.Group();
  playerGroup.position.set(0, 1.6, 8); // fixed 1.6m height spawn
  scene.add(playerGroup);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000);
  playerGroup.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x111111);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  const vrBtn = VRButton.createButton(renderer);
  vrBtn.style.position = 'absolute';
  vrBtn.style.left = '10px';
  vrBtn.style.bottom = '10px';
  vrBtn.style.zIndex = '1100';
  document.body.appendChild(vrBtn);
  document.getElementById('entervr')?.addEventListener('click', () => vrBtn.click());

  Bus.init();
  Bus.log('GRAND LOBBY: INITIALIZING…');

  window.teleportHome = () => { playerGroup.position.set(0, 1.6, 8); playerGroup.rotation.set(0,0,0); };
  window.resetSpawn = () => window.teleportHome();
  window.hideHud = () => {
    const hud = document.getElementById('hud');
    const term = document.getElementById('term');
    const controls = document.getElementById('controls');
    const vis = hud && hud.style.display !== 'none';
    if (hud) hud.style.display = vis ? 'none' : 'block';
    if (term) term.style.display = vis ? 'none' : 'block';
    if (controls) controls.style.display = vis ? 'none' : 'flex';
    // NOTE: pads stay visible so movement always works on mobile
  };

  // Boot modules
  createWorld(scene);                // includes jumbotrons + video feed
  initHands(renderer, scene);        // hands-only visuals
  initLocomotion({ playerGroup, camera, Bus });
  initDealer({ scene, Bus });
  initChips({ scene, Bus });
  initAvatars({ scene, Bus });       // avatar spawn buttons
  initBots({ scene, Bus });          // NPCs walking + seated players
  initDiagnostics({ Bus });
  initRadio();

  window.addEventListener('resize', onResize);
  onResize();

  Bus.log('SPINE SYNC: SUCCESSFUL.');
  Bus.log('MOVE/ TURN: bottom pads (mobile) or WASD (desktop).');
  Bus.log('AVATARS: use buttons (Male/Female/Ninja/Combat).');
  Bus.log('JUMBOTRON: update via button (STATUS).');

  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    window.__locomotionUpdate?.(dt);
    updateBots(dt);
    updateWorld(dt, playerGroup, camera);

    const p = playerGroup.position;
    const pos = document.getElementById('pos');
    if (pos) pos.textContent = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;

    renderer.render(scene, camera);
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
