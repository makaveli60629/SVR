// SVR/js/scarlett1/modules/lobbyEnvironment.js
// Always renders: floor + walls + columns + signage + depth landmarks.
// Uses only safe materials (no required textures).

export function LobbyEnvironment() {
  return {
    id: 'lobbyEnvironment',
    init(ctx) {
      const { THREE, scene } = ctx;

      // Floor
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.MeshStandardMaterial({ color: 0x0d1016, roughness: 0.85, metalness: 0.05 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      scene.add(floor);

      // Grid overlay (debug depth)
      const grid = new THREE.GridHelper(60, 60, 0x00ff88, 0x112233);
      grid.position.y = 0.01;
      scene.add(grid);

      // Lobby room “shell”
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x121827, roughness: 0.9, metalness: 0.05 });
      const wallGeo = new THREE.BoxGeometry(60, 10, 1);

      const back = new THREE.Mesh(wallGeo, wallMat);
      back.position.set(0, 5, -25);
      scene.add(back);

      const front = new THREE.Mesh(wallGeo, wallMat);
      front.position.set(0, 5, 25);
      scene.add(front);

      const sideGeo = new THREE.BoxGeometry(1, 10, 60);
      const left = new THREE.Mesh(sideGeo, wallMat);
      left.position.set(-25, 5, 0);
      scene.add(left);

      const right = new THREE.Mesh(sideGeo, wallMat);
      right.position.set(25, 5, 0);
      scene.add(right);

      // Ceiling accents
      const ceil = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.MeshStandardMaterial({ color: 0x070a10, roughness: 0.8, metalness: 0.2 })
      );
      ceil.rotation.x = Math.PI / 2;
      ceil.position.y = 10;
      scene.add(ceil);

      // Columns ring (helps depth)
      const colGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 16);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x1a2236, roughness: 0.7, metalness: 0.15 });

      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = 18;
        const c = new THREE.Mesh(colGeo, colMat);
        c.position.set(Math.cos(a) * r, 4, Math.sin(a) * r);
        scene.add(c);

        // Neon band
        const band = new THREE.Mesh(
          new THREE.TorusGeometry(0.52, 0.06, 10, 24),
          new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.8 })
        );
        band.rotation.x = Math.PI / 2;
        band.position.set(c.position.x, 6.6, c.position.z);
        scene.add(band);
      }

      // “Portal” landmark (where poker room will be later)
      const portal = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.18, 18, 64),
        new THREE.MeshStandardMaterial({ color: 0x8844ff, emissive: 0x6622ff, emissiveIntensity: 1.1 })
      );
      portal.position.set(0, 2.4, -16);
      scene.add(portal);

      const portalInner = new THREE.Mesh(
        new THREE.CircleGeometry(2.05, 64),
        new THREE.MeshStandardMaterial({ color: 0x06070c, emissive: 0x220044, emissiveIntensity: 0.6, roughness: 0.9 })
      );
      portalInner.position.set(0, 2.4, -16.01);
      scene.add(portalInner);

      // Simple “jumbotron” slab
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(10, 4, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x0b1220, emissive: 0x001133, emissiveIntensity: 0.6 })
      );
      screen.position.set(0, 6.5, -24.4);
      scene.add(screen);

      ctx.log?.('[lobby] environment created');
    }
  };
}
