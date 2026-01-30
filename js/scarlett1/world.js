/**
 * Scarlett1 World — V3 FULL LOBBY + OPEN PIT (NO CAP DISK)
 * - Ring floor (hole cut out)
 * - Pit is open (no cap)
 * - Pedestal centered in pit
 * - 4 jumbotrons
 * - Bots walking
 */

export async function init({ THREE, scene, camera, log }) {
  log("[world] init V3 full lobby open pit (no cap)");

  // -----------------
  // SCENE BASICS
  // -----------------
  scene.background = new THREE.Color(0x050508);

  // -----------------
  // LIGHTING (BRIGHT + EVEN)
  // -----------------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x333344, 1.25);
  hemi.position.set(0, 20, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.4);
  dir.position.set(6, 10, 6);
  scene.add(dir);

  const fill = new THREE.PointLight(0x9b7cff, 1.1, 80);
  fill.position.set(0, 6, 0);
  scene.add(fill);

  const glow = new THREE.PointLight(0x5b9dff, 0.9, 60);
  glow.position.set(0, 2.5, 0);
  scene.add(glow);

  // -----------------
  // DIMENSIONS
  // -----------------
  const roomRadius = 14;     // lobby radius
  const roomHeight = 6;
  const pitRadius = 6.0;     // pit hole radius
  const pitDepth = 4.0;      // how deep the hole goes
  const pitFloorY = -pitDepth;

  // -----------------
  // FLOOR (RING — HOLE CUT OUT)
  //  This is the key "NO CAP DISK" fix.
  // -----------------
  const ringGeo = new THREE.RingGeometry(pitRadius, roomRadius, 96, 1);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x111116,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0;
  scene.add(ring);

  // -----------------
  // PIT WALL (OPEN CYLINDER, NO CAPS)
  // -----------------
  const pitWallGeo = new THREE.CylinderGeometry(
    pitRadius,
    pitRadius,
    pitDepth,
    96,
    1,
    true // openEnded => no top/bottom caps
  );
  const pitWallMat = new THREE.MeshStandardMaterial({
    color: 0x090912,
    roughness: 0.95,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const pitWall = new THREE.Mesh(pitWallGeo, pitWallMat);
  pitWall.position.y = pitFloorY / 2;
  pitWall.rotation.y = Math.PI;
  scene.add(pitWall);

  // -----------------
  // PIT FLOOR (BOTTOM)
  // -----------------
  const pitBottomGeo = new THREE.CircleGeometry(pitRadius - 0.05, 96);
  const pitBottomMat = new THREE.MeshStandardMaterial({
    color: 0x07070d,
    roughness: 0.98,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const pitBottom = new THREE.Mesh(pitBottomGeo, pitBottomMat);
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = pitFloorY;
  scene.add(pitBottom);

  // -----------------
  // NEON RAIL (AT RIM OF PIT)
  // -----------------
  const railGeo = new THREE.TorusGeometry(pitRadius + 0.12, 0.05, 12, 128);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x6a3dff,
    emissive: 0x6a3dff,
    emissiveIntensity: 1.6,
    roughness: 0.4,
    metalness: 0.4,
  });
  const rail = new THREE.Mesh(railGeo, railMat);
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 0.03;
  scene.add(rail);

  // -----------------
  // WALLS (CYLINDER ROOM)
  // -----------------
  const wallGeo = new THREE.CylinderGeometry(roomRadius, roomRadius, roomHeight, 96, 1, true);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = roomHeight / 2;
  walls.rotation.y = Math.PI;
  scene.add(walls);

  // -----------------
  // PEDESTAL (CENTERED IN PIT)
  // -----------------
  const pedestalRadius = 2.2;
  const pedestalHeight = 1.6;
  const pedestalTopY = pitFloorY + pedestalHeight; // top height inside pit

  const pedestalGeo = new THREE.CylinderGeometry(pedestalRadius, pedestalRadius, pedestalHeight, 64);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x15151d,
    roughness: 0.85,
    metalness: 0.2,
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, pitFloorY + pedestalHeight / 2, 0);
  scene.add(pedestal);

  // -----------------
  // TABLE TOP (SIMPLE PLACEHOLDER)
  // -----------------
  const tableGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.18, 64);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x0c0c12,
    roughness: 0.6,
    metalness: 0.15,
    emissive: 0x120a25,
    emissiveIntensity: 0.35,
  });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, pedestalTopY + 0.12, 0);
  scene.add(table);

  // -----------------
  // 4 JUMBOTRONS (N/E/S/W)
  // -----------------
  const jumboW = 4.2, jumboH = 2.2;
  const jumboGeo = new THREE.PlaneGeometry(jumboW, jumboH);
  const jumboMat = new THREE.MeshStandardMaterial({
    color: 0x101018,
    emissive: 0x3a7bff,
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  const jumbotrons = [];
  const r = roomRadius - 0.35;
  const y = 3.6;

  function addJumbo(x, z, ry) {
    const m = new THREE.Mesh(jumboGeo, jumboMat.clone());
    m.position.set(x, y, z);
    m.rotation.y = ry;
    scene.add(m);
    jumbotrons.push(m);
  }

  addJumbo(0, -r, 0);
  addJumbo(0, r, Math.PI);
  addJumbo(-r, 0, Math.PI / 2);
  addJumbo(r, 0, -Math.PI / 2);

  // -----------------
  // BOTS (SIMPLE WALKERS)
  // -----------------
  const bots = [];
  const botCount = 6;
  const botRadius = 0.18;

  const botGeo = new THREE.CapsuleGeometry(botRadius, 0.55, 6, 12);
  const botMat = new THREE.MeshStandardMaterial({
    color: 0x8b8bb0,
    roughness: 0.7,
    metalness: 0.15,
    emissive: 0x15152a,
    emissiveIntensity: 0.25,
  });

  for (let i = 0; i < botCount; i++) {
    const b = new THREE.Mesh(botGeo, botMat.clone());
    const a = (i / botCount) * Math.PI * 2;
    b.position.set(Math.cos(a) * (pitRadius + 3.8), 0.9, Math.sin(a) * (pitRadius + 3.8));
    b.userData = { a, speed: 0.35 + (i % 3) * 0.08 };
    scene.add(b);
    bots.push(b);
  }

  // -----------------
  // SAFE SPAWN
  // -----------------
  camera.position.set(0, 1.6, 10);
  camera.lookAt(0, 1.35, 0);

  log("[world] lobby+pit ready ✅");

  // -----------------
  // UPDATE LOOP
  // -----------------
  function update(dt) {
    const t = performance.now() * 0.001;

    // bots walk around the pit rim area
    for (const b of bots) {
      const s = b.userData.speed;
      const a = b.userData.a + t * s;
      const rr = pitRadius + 4.1;
      b.position.x = Math.cos(a) * rr;
      b.position.z = Math.sin(a) * rr;
      b.position.y = 0.9;
      b.rotation.y = -a + Math.PI / 2;
    }

    // jumbotrons subtle pulse
    const pulse = 0.45 + 0.25 * Math.sin(t * 1.2);
    for (const j of jumbotrons) {
      j.material.emissiveIntensity = 0.45 + pulse;
    }
  }

  return {
    updates: [update],
    interactables: [],
  };
}
