/**
 * Scarlett1 World — V2 LOBBY + PIT + TABLE
 * Visible, bright, impossible to miss
 */

export async function init({ THREE, scene, camera, log }) {
  log('[world] init V2 lobby + pit');

  /* --------------------
   * SCENE
   * -------------------- */
  scene.background = new THREE.Color(0x030308);

  /* --------------------
   * LIGHTING (VERY BRIGHT)
   * -------------------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(6, 10, 4);
  scene.add(key);

  const rim = new THREE.PointLight(0x7f6bff, 2.0, 40);
  rim.position.set(0, 6, 0);
  scene.add(rim);

  /* --------------------
   * FLOOR
   * -------------------- */
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({
      color: 0x111118,
      roughness: 0.85,
      metalness: 0.1
    })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  /* --------------------
   * PIT (HOLE)
   * -------------------- */
  const pit = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 3, 64, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x050508,
      roughness: 1.0,
      side: THREE.DoubleSide
    })
  );
  pit.position.y = -1.5;
  scene.add(pit);

  /* --------------------
   * PEDESTAL
   * -------------------- */
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.4, 1.2, 48),
    new THREE.MeshStandardMaterial({
      color: 0x222233,
      metalness: 0.3,
      roughness: 0.6
    })
  );
  pedestal.position.y = -0.9;
  scene.add(pedestal);

  /* --------------------
   * TABLE
   * -------------------- */
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.0, 0.3, 48),
    new THREE.MeshStandardMaterial({
      color: 0x1b3a2b,
      roughness: 0.4
    })
  );
  table.position.y = -0.25;
  scene.add(table);

  /* --------------------
   * WALLS (PULLED IN)
   * -------------------- */
  const walls = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 4, 64, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a22,
      roughness: 0.9,
      side: THREE.BackSide
    })
  );
  walls.position.y = 2;
  scene.add(walls);

  /* --------------------
   * JUMBOTRONS (4)
   * -------------------- */
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x222244,
    emissive: 0x4444ff,
    emissiveIntensity: 1.2
  });

  for (let i = 0; i < 4; i++) {
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 1.5),
      screenMat
    );
    const a = (i / 4) * Math.PI * 2;
    screen.position.set(
      Math.cos(a) * 8,
      2.4,
      Math.sin(a) * 8
    );
    screen.lookAt(0, 2.2, 0);
    scene.add(screen);
  }

  /* --------------------
   * BOT PLACEHOLDERS
   * -------------------- */
  const botMat = new THREE.MeshStandardMaterial({ color: 0x8844ff });
  for (let i = 0; i < 6; i++) {
    const bot = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.25, 0.9, 4, 8),
      botMat
    );
    const a = (i / 6) * Math.PI * 2;
    bot.position.set(
      Math.cos(a) * 3,
      0.45,
      Math.sin(a) * 3
    );
    scene.add(bot);
  }

  /* --------------------
   * SAFE SPAWN (NOT ON TABLE)
   * -------------------- */
  camera.position.set(0, 1.6, 7);
  camera.lookAt(0, 1.3, 0);

  log('[world] V2 lobby constructed');

  function update() {
    // future animation hooks
  }

  return {
    updates: [update],
    interactables: []
  };
}
