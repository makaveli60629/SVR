/**
 * Scarlett1 World — V3 LOBBY + TRUE PIT (NO CAP)
 * - Ring floor with center hole (pit opening)
 * - Pit cylinder open-ended (no top/bottom caps)
 * - Pit bottom visible
 * - Spawn pad outside pit
 * - Lots of light + color
 */
export async function init({ THREE, scene, camera, log }) {
  log('[world] init V3 lobby+truepit');

  scene.background = new THREE.Color(0x05060b);

  // -----------------
  // LIGHTING (BRIGHT + COLOR)
  // -----------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a44, 1.2);
  hemi.position.set(0, 30, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(8, 16, 10);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9b7cff, 0.9);
  rim.position.set(-10, 10, -12);
  scene.add(rim);

  // neon ring lights
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.PointLight(0x6f7bff, 1.1, 40);
    p.position.set(Math.cos(a) * 10, 3.8, Math.sin(a) * 10);
    scene.add(p);
  }

  // -----------------
  // DIMENSIONS
  // -----------------
  const floorOuterR = 16;
  const pitR = 5.8;
  const pitDepth = 6.5; // real depth
  const pitWallY = -pitDepth / 2;

  // -----------------
  // FLOOR: RING (HOLE IN THE MIDDLE)
  // -----------------
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(pitR + 0.02, floorOuterR, 96),
    new THREE.MeshStandardMaterial({
      color: 0x14141c,
      roughness: 0.92,
      metalness: 0.08,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = false;
  floor.userData.isFloor = true; // teleport target
  scene.add(floor);

  // add some "tile" vibe with a subtle second ring
  const trim = new THREE.Mesh(
    new THREE.RingGeometry(pitR + 0.35, pitR + 0.55, 96),
    new THREE.MeshStandardMaterial({
      color: 0x2b2b3a,
      roughness: 0.55,
      metalness: 0.35,
      emissive: new THREE.Color(0x0a0a14),
    })
  );
  trim.rotation.x = -Math.PI / 2;
  trim.position.y = 0.01;
  trim.userData.isFloor = true;
  scene.add(trim);

  // -----------------
  // OUTER WALLS (CYLINDER ROOM)
  // -----------------
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(floorOuterR, floorOuterR, 7.5, 96, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a28,
      roughness: 0.95,
      metalness: 0.02,
      side: THREE.DoubleSide,
    })
  );
  wall.position.y = 3.75;
  wall.rotation.y = Math.PI;
  scene.add(wall);

  // -----------------
  // PIT WALLS (OPEN ENDED — NO CAPS)
  // -----------------
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR, pitR, pitDepth, 96, 1, true), // openEnded=true is the last arg in older signatures,
    // but Three's signature is (rt, rb, h, radialSeg, heightSeg, openEnded)
    // We used openEnded by providing 'true' as 6th param in many builds; if your Three expects it,
    // you can switch to: new THREE.CylinderGeometry(pitR, pitR, pitDepth, 96, 1, true)
    new THREE.MeshStandardMaterial({
      color: 0x0b0b12,
      roughness: 1.0,
      metalness: 0.0,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0x04040a),
    })
  );
  pitWall.position.y = pitWallY;
  scene.add(pitWall);

  // If your Three build requires explicit openEnded:
  // Replace the geometry line above with:
  // new THREE.CylinderGeometry(pitR, pitR, pitDepth, 96, 1, true)

  // -----------------
  // PIT BOTTOM
  // -----------------
  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(pitR - 0.15, 96),
    new THREE.MeshStandardMaterial({
      color: 0x05050a,
      roughness: 0.98,
      metalness: 0.0,
      emissive: new THREE.Color(0x020207),
    })
  );
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = -pitDepth + 0.02;
  pitBottom.userData.isFloor = true; // allow teleport down later if you want
  scene.add(pitBottom);

  // -----------------
  // RAIL AROUND PIT (TOP)
  // -----------------
  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(pitR + 0.25, 0.035, 16, 128),
    new THREE.MeshStandardMaterial({
      color: 0x7a5cff,
      roughness: 0.3,
      metalness: 0.6,
      emissive: new THREE.Color(0x220a44),
      emissiveIntensity: 1.0,
    })
  );
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 1.05;
  scene.add(rail);

  // -----------------
  // SPAWN PAD OUTSIDE PIT
  // -----------------
  const spawnPad = new THREE.Mesh(
    new THREE.CircleGeometry(0.65, 48),
    new THREE.MeshStandardMaterial({
      color: 0x2bffcc,
      roughness: 0.2,
      metalness: 0.4,
      emissive: new THREE.Color(0x003b2f),
      emissiveIntensity: 1.25,
    })
  );
  spawnPad.rotation.x = -Math.PI / 2;
  spawnPad.position.set(0, 0.02, 11);
  spawnPad.userData.isFloor = true;
  scene.add(spawnPad);

  // expose spawn object so spine can use it
  window.__SCARLETT_SPAWN__ = spawnPad;

  // non-XR camera safe default
  camera.position.set(0, 1.6, 12);
  camera.lookAt(0, 1.6, 0);

  log('[world] lobby+truepit ready ✅');

  function update(dt) {
    // subtle pulse on rail emissive
    const t = performance.now() * 0.001;
    rail.material.emissiveIntensity = 0.7 + Math.sin(t * 2.0) * 0.25;
  }

  return {
    updates: [update],
    interactables: [],
  };
}
