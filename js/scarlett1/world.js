/**
 * Scarlett1 World — V1 LOBBY BASE
 * Safe, bright, stable
 */
export async function init({ THREE, scene, camera, log }) {
  log('[world] init V1 lobby');

  // -----------------
  // SCENE BASICS
  // -----------------
  scene.background = new THREE.Color(0x050508);

  // -----------------
  // LIGHTING (BRIGHT + EVEN)
  // -----------------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  hemi.position.set(0, 20, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.5);
  dir.position.set(5, 10, 5);
  dir.castShadow = false;
  scene.add(dir);

  const fill = new THREE.PointLight(0x9b7cff, 1.0, 50);
  fill.position.set(0, 6, 0);
  scene.add(fill);

  // -----------------
  // FLOOR
  // -----------------
  const floorGeo = new THREE.CircleGeometry(12, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x111116,
    roughness: 0.85,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // -----------------
  // WALLS (ROOM SIZE)
  // -----------------
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22,
    roughness: 0.9,
    side: THREE.BackSide
  });

  const wallRadius = 10;
  const wallHeight = 4;

  const wallGeo = new THREE.CylinderGeometry(
    wallRadius,
    wallRadius,
    wallHeight,
    64,
    1,
    true
  );

  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = wallHeight / 2;
  scene.add(walls);

  // -----------------
  // SAFE SPAWN
  // -----------------
  camera.position.set(0, 1.6, 6);
  camera.lookAt(0, 1.4, 0);

  log('[world] ready');

  function update(dt) {
    // placeholder
  }

  return {
    updates: [update],
    interactables: [],
  };
}
