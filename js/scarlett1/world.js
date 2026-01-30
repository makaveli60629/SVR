/**
 * Scarlett1 World — V2 LOBBY + PIT + SCREENS + BOTS
 * Safe, bright, stable (no external assets required)
 */
export async function init({ THREE, scene, camera, log }) {
  log('[world] init V2 lobby+pit');

  scene.background = new THREE.Color(0x050508);

  // -----------------
  // LIGHTING (BRIGHT + EVEN)
  // -----------------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.25);
  hemi.position.set(0, 20, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.6);
  dir.position.set(6, 12, 6);
  dir.castShadow = false;
  scene.add(dir);

  const fill = new THREE.PointLight(0x9b7cff, 1.2, 80);
  fill.position.set(0, 6, 0);
  scene.add(fill);

  const rim = new THREE.PointLight(0x00ffd5, 0.35, 60);
  rim.position.set(-6, 2.2, -6);
  scene.add(rim);

  // -----------------
  // FLOOR (circular)
  // -----------------
  const floorGeo = new THREE.CircleGeometry(14, 72);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x12121a,
    roughness: 0.9,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // -----------------
  // WALLS (cylinder room)
  // -----------------
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a24,
    roughness: 0.92,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const wallRadius = 12;
  const wallHeight = 5.5;
  const wallGeo = new THREE.CylinderGeometry(wallRadius, wallRadius, wallHeight, 96, 1, true);
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = wallHeight / 2;
  walls.rotation.y = Math.PI;
  scene.add(walls);

  // -----------------
  // PIT (a "hole" cylinder + inner walls)
  // -----------------
  const pitRadius = 5.6;
  const pitDepth = 3.6;

  // Dark inner cylinder (open top)
  const pitInnerGeo = new THREE.CylinderGeometry(pitRadius, pitRadius, pitDepth, 96, 1, true);
  const pitInnerMat = new THREE.MeshStandardMaterial({
    color: 0x05050a,
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0x000000),
  });
  const pitInner = new THREE.Mesh(pitInnerGeo, pitInnerMat);
  pitInner.position.y = -pitDepth / 2 + 0.02;
  pitInner.rotation.y = Math.PI;
  scene.add(pitInner);

  // Pit rim ring
  const rimGeo = new THREE.RingGeometry(pitRadius + 0.12, pitRadius + 0.65, 96);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b36,
    roughness: 0.65,
    metalness: 0.25,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0x1a0044),
    emissiveIntensity: 0.15,
  });
  const rimRing = new THREE.Mesh(rimGeo, rimMat);
  rimRing.rotation.x = -Math.PI / 2;
  rimRing.position.y = 0.01;
  scene.add(rimRing);

  // Pit "bottom" (dark disc)
  const pitBottomGeo = new THREE.CircleGeometry(pitRadius - 0.1, 72);
  const pitBottomMat = new THREE.MeshStandardMaterial({
    color: 0x07070d,
    roughness: 1.0,
    metalness: 0.0,
  });
  const pitBottom = new THREE.Mesh(pitBottomGeo, pitBottomMat);
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = -pitDepth + 0.01;
  scene.add(pitBottom);

  // -----------------
  // PEDESTAL (center platform sunk into pit)
  // -----------------
  const pedestalRadius = 2.2;
  const pedestalHeight = 0.9;

  const pedestalGeo = new THREE.CylinderGeometry(pedestalRadius, pedestalRadius, pedestalHeight, 64);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x1b1b24,
    roughness: 0.55,
    metalness: 0.35,
    emissive: new THREE.Color(0x15003a),
    emissiveIntensity: 0.18,
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  // sink it so it sits down in the pit
  pedestal.position.y = -1.6; // your requested "deeper" look baseline
  scene.add(pedestal);

  // Table placeholder
  const tableGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.18, 64);
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x2a2a36, roughness: 0.6, metalness: 0.2 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, pedestal.position.y + pedestalHeight/2 + 0.16, 0);
  scene.add(table);

  // Neon rail in pit
  const railGeo = new THREE.TorusGeometry(pitRadius - 0.25, 0.03, 10, 96);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x4c2cff,
    roughness: 0.2,
    metalness: 0.6,
    emissive: new THREE.Color(0x5a3bff),
    emissiveIntensity: 0.8
  });
  const rail = new THREE.Mesh(railGeo, railMat);
  rail.rotation.x = Math.PI/2;
  rail.position.y = 0.06;
  scene.add(rail);

  // -----------------
  // JUMBOTRONS (4 big screens)
  // -----------------
  const screenW = 3.2;
  const screenH = 1.8;

  const screenGeo = new THREE.PlaneGeometry(screenW, screenH);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x101018,
    emissive: new THREE.Color(0x202050),
    emissiveIntensity: 0.9,
    roughness: 0.55,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const screenDistance = wallRadius - 0.6;
  const screenY = 3.1;

  const screens = [];
  for (let i=0;i<4;i++){
    const a = (i * Math.PI/2) + Math.PI/4;
    const s = new THREE.Mesh(screenGeo, screenMat.clone());
    s.position.set(Math.cos(a)*screenDistance, screenY, Math.sin(a)*screenDistance);
    s.lookAt(0, screenY, 0);
    scene.add(s);
    screens.push(s);

    // frame
    const frameGeo = new THREE.BoxGeometry(screenW+0.22, screenH+0.18, 0.08);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b2b38, roughness: 0.7, metalness: 0.25 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.copy(s.position);
    frame.quaternion.copy(s.quaternion);
    frame.translateZ(-0.06);
    scene.add(frame);
  }

  // -----------------
  // SIMPLE BOTS (orbit walkers)
  // -----------------
  const bots = [];
  const botCount = 6;
  const botGeo = new THREE.CapsuleGeometry(0.18, 0.55, 8, 16);
  for (let i=0;i<botCount;i++){
    const mat = new THREE.MeshStandardMaterial({
      color: 0x9b7cff,
      roughness: 0.45,
      metalness: 0.15,
      emissive: new THREE.Color(0x22004c),
      emissiveIntensity: 0.2
    });
    const bot = new THREE.Mesh(botGeo, mat);
    bot.position.y = 0.9;
    bot.userData.t = (i/botCount) * Math.PI*2;
    bot.userData.r = 8.2;
    scene.add(bot);
    bots.push(bot);
  }

  // -----------------
  // SAFE SPAWN
  // -----------------
  camera.position.set(0, 1.6, 9);
  camera.lookAt(0, 1.4, 0);

  log('[world] lobby+pit ready ✅');

  // -----------------
  // UPDATE LOOP
  // -----------------
  let pulse = 0;
  function update(dt) {
    // bot orbit
    for (const b of bots){
      b.userData.t += dt * 0.35;
      const t = b.userData.t;
      const r = b.userData.r;
      b.position.x = Math.cos(t) * r;
      b.position.z = Math.sin(t) * r;
      b.lookAt(Math.cos(t+0.2)*r, b.position.y, Math.sin(t+0.2)*r);
    }

    // subtle neon pulse
    pulse += dt;
    const ei = 0.65 + Math.sin(pulse*1.6)*0.25;
    rail.material.emissiveIntensity = ei;
    for (const s of screens){
      s.material.emissiveIntensity = 0.75 + Math.sin(pulse*1.1)*0.15;
    }
  }

  return {
    updates: [update],
    interactables: [],
  };
}
