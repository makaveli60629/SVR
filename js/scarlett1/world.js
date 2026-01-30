// /js/scarlett1/world.js — SCARLETT1 WORLD (PERMANENT SAFE BASE)
// This file MUST export async function init(ctx)

export async function init(ctx) {
  const { THREE, scene, camera, log } = ctx;
  log('[world] init starting');

  /* --------------------
     LIGHTING (BRIGHT)
  -------------------- */
  scene.background = new THREE.Color(0x0b0b12);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.4);
  hemi.position.set(0, 50, 0);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(10, 20, 10);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x88aaff, 1.2, 100);
  fillLight.position.set(0, 10, 0);
  scene.add(fillLight);

  /* --------------------
     FLOOR (OPEN PIT)
  -------------------- */
  const floorGeo = new THREE.CircleGeometry(40, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x111118,
    roughness: 0.85,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  scene.add(floor);

  /* --------------------
     PIT WALL (NO CAP / NO DISK)
  -------------------- */
  const pitGeo = new THREE.CylinderGeometry(
    18,   // top radius
    18,   // bottom radius
    8,    // depth
    64,
    1,
    true  // OPEN ENDED (NO DISK)
  );

  const pitMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a10,
    roughness: 0.9,
    side: THREE.BackSide
  });

  const pit = new THREE.Mesh(pitGeo, pitMat);
  pit.position.y = -4;
  scene.add(pit);

  /* --------------------
     TABLE (SMALLER)
  -------------------- */
  const tableGeo = new THREE.CylinderGeometry(3.2, 3.2, 0.3, 48);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x3a1f0f,
    roughness: 0.6
  });

  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, 1.1, 0);
  scene.add(table);

  /* --------------------
     WALLS (CLOSER, NOT HUGE)
  -------------------- */
  const wallGeo = new THREE.CylinderGeometry(22, 22, 10, 64, 1, true);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x12121a,
    roughness: 0.8,
    side: THREE.BackSide
  });

  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = 4;
  scene.add(walls);

  /* --------------------
     CAMERA SPAWN (STABLE)
  -------------------- */
  camera.position.set(0, 1.6, 8);
  camera.lookAt(0, 1.3, 0);

  log('[world] geometry + lights ready');

  /* --------------------
     UPDATE LOOP (REQUIRED)
  -------------------- */
  function update(dt) {
    // keep empty for now (prevents freeze)
  }

  /* --------------------
     RETURN CONTRACT
  -------------------- */
  return {
    updates: [update],
    interactables: []
  };
}
