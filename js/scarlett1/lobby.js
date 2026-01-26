import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const Lobby = {
  build(scene, Diagnostics) {
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(20,6,20),
      new THREE.MeshStandardMaterial({
        color: 0x1b2440,
        side: THREE.BackSide
      })
    );
    room.position.y = 3;
    scene.add(room);

    const padGeo = new THREE.CircleGeometry(0.6, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2a6bff });

    for (let i=0;i<4;i++) {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.rotation.x = -Math.PI/2;
      pad.position.set(-4 + i*2.7, 0.01, -3);
      scene.add(pad);
    }

    Diagnostics.log('Scarlett One lobby built');
  }
};
