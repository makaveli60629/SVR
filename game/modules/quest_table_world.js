import * as THREE from 'three';

// The Quest entry needs world coordinates, not the old two-storey lobby.
// The fitted room is constructed once by the table-room module after loading.
export function createQuestTableWorld(scene) {
  scene.background = new THREE.Color(0x090a10);
  scene.fog = null;
  scene.userData._tickWorld = null;
  const seats = [
    { x: 0, z: -1.85, label: 'North Seat' },
    { x: -2.55, z: -.45, label: 'Left Front' },
    { x: -2.55, z: 1.75, label: 'Left Back' },
    { x: 0, z: 3.25, label: 'Open South Seat' },
    { x: 2.55, z: -.45, label: 'Right Front' },
    { x: 2.55, z: 1.75, label: 'Right Back' }
  ];
  window.SVR_QUEST_WORLD_STATE = { build: 'phase459', tableOnly: true, legacyLobbyConstructed: false };
  return {
    roomClamp: (x, z) => ({ x: THREE.MathUtils.clamp(x, -4, 4), z: THREE.MathUtils.clamp(z, -2.5, 4) }),
    seats, tableCenter: new THREE.Vector3(0, 0, .75), joinRadius: 3.9,
    previewOrbitRadius: 4, sceneTargets: {}
  };
}
