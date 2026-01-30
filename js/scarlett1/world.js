/**
 * Scarlett1 World — PERMANENT DEMO WORLD
 * Owns ONLY scene content (no renderer, no XR, no loop)
 */

export async function init({ THREE, scene, camera, log }) {

  log('[world] init');

  /* ------------------------------
   * SAFE SPAWN (no table clipping)
   * ------------------------------ */
  camera.position.set(0, 1.6, 6);
  camera.lookAt(0, 1.4, 0);

  /* ------------------------------
   * LIGHTING (Quest-friendly)
   * ------------------------------ */
  scene.background = new THREE.Color(0x0b0b14);

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(6, 10, 4);
  scene.add(key);

  const fill = new THREE.PointLight(0x8844ff, 1.2, 30);
  fill.position.set(0, 6, 0);
  scene.add(fill);

  /* ------------------------------
   * FLOOR
   * ------------------------------ */
  const floorGeo = new THREE.CircleGeometry(10, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x121218,
    roughness: 0.8,
    metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  /* ------------------------------
   * WALLS (ROOM SCALE — NOT FAR)
   * ------------------------------ */
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22,
    side: THREE.BackSide
  });
  const room = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 6, 64, 1, true),
    wallMat
  );
  room.position.y = 3;
  scene.add(room);

  /* ------------------------------
   * POKER TABLE (SMALLER)
   * ------------------------------ */
  const tableGroup = new THREE.Group();

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.2, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0e5a3a,
      roughness: 0.4
    })
  );
  tableTop.position.y = 1;
  tableGroup.add(tableTop);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.6, 1, 32),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  pedestal.position.y = 0.5;
  tableGroup.add(pedestal);

  scene.add(tableGroup);

  /* ------------------------------
   * SEATS (BOT PLACEHOLDERS)
   * ------------------------------ */
  const bots = [];
  const seatRadius = 2.4;

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;

    const bot = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.25, 0.6, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x4444ff })
    );

    bot.position.set(
      Math.cos(a) * seatRadius,
      0.8,
      Math.sin(a) * seatRadius
    );

    bot.lookAt(0, 1, 0);
    scene.add(bot);
    bots.push(bot);
  }

  /* ------------------------------
   * STORE PAD
   * ------------------------------ */
  const store = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffaa00 })
  );
  store.position.set(-4, 0.05, 0);
  scene.add(store);

  /* ------------------------------
   * BALCONY RING (VISUAL ONLY)
   * ------------------------------ */
  const balcony = new THREE.Mesh(
    new THREE.TorusGeometry(6, 0.05, 16, 100),
    new THREE.MeshStandardMaterial({ color: 0x8844ff })
  );
  balcony.rotation.x = Math.PI / 2;
  balcony.position.y = 3.2;
  scene.add(balcony);

  log('[world] lobby ready');

  return {
    updates: [
      (dt) => {
        balcony.rotation.z += dt * 0.1;
      }
    ],
    interactables: []
  };
}
