// SVR/js/scarlett1/world.js
// SCARLETT ONE • SVR — World module entry
// RULE: Hands-only in VR. Always render something (no black screen).

import { ModuleHub } from './modules/moduleHub.js';
import { LobbyEnvironment } from './modules/lobbyEnvironment.js';
import { LocomotionPads } from './modules/locomotionPads.js';

export function createWorld(ctx) {
  const { THREE, scene, camera, rig, log } = ctx;

  // Always lit / always visible (anti-black)
  scene.background = new THREE.Color(0x05070b);
  scene.fog = new THREE.Fog(0x05070b, 8, 60);

  scene.add(new THREE.AmbientLight(0xffffff, 1.05));

  const sun = new THREE.DirectionalLight(0xcffbff, 1.25);
  sun.position.set(6, 12, 6);
  sun.castShadow = false;
  scene.add(sun);

  const fill = new THREE.PointLight(0x66ffcc, 0.7, 30, 2);
  fill.position.set(-4, 3, -4);
  scene.add(fill);

  // Spawn
  camera.position.set(0, 1.6, 2);
  camera.lookAt(0, 1.4, -3);

  log('[world] base scene ready');

  // Register SAFE modules (you can add more later)
  ModuleHub.register(LobbyEnvironment());
  ModuleHub.register(LocomotionPads()); // Android touch pads + desktop WASD + VR hand-forward

  // Init all modules (build lobby + controls)
  ModuleHub.start();

  log('[world] modules started ✅');
}
