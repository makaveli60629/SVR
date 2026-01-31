/**
 * Scarlett1 World — V5 FULL LOBBY (FAST PACE)
 * - Open pit (NO CAP DISK)
 * - Balcony + rails + stairs
 * - 4 Jumbotrons (animated emissive)
 * - Store kiosk
 * - Bots walking ring + pit-side idlers
 *
 * Contract:
 * export async function init({ THREE, scene, camera, renderer, log })
 */
export async function init({ THREE, scene, camera, renderer, log }) {
  log("[world] init V5 full lobby");

  // -----------------
  // TUNABLES
  // -----------------
  const OUTER_R = 26;
  const WALL_H = 7.5;

  const PIT_R = 7.5;
  const PIT_DEPTH = 3.4;

  const RING_INNER_R = PIT_R + 1.5;
  const RING_OUTER_R = OUTER_R - 2.0;

  const BALCONY_Y = 3.2;
  const BALCONY_THICK = 0.35;

  const ENTRY_ANGLE = Math.PI * 0.5; // "door" / stair entry direction

  // -----------------
  // SCENE BASICS
  // -----------------
  scene.background = new THREE.Color(0x040407);

  // -----------------
  // LIGHTING (BRIGHT + EVEN)
  // -----------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222244, 1.15);
  hemi.position.set(0, 18, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(8, 16, 10);
  scene.add(dir);

  // Neon pit glow
  const pitGlow = new THREE.PointLight(0x7a45ff, 2.2, 60);
  pitGlow.position.set(0, 3.5, 0);
  scene.add(pitGlow);

  // -----------------
  // MATERIALS
  // -----------------
  const matFloor = new THREE.MeshStandardMaterial({
    color: 0x101018,
    roughness: 0.92,
    metalness: 0.06,
  });

  const matRing = new THREE.MeshStandardMaterial({
    color: 0x0d0d14,
    roughness: 0.88,
    metalness: 0.10,
  });

  const matWall = new THREE.MeshStandardMaterial({
    color: 0x161623,
    roughness: 0.92,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const matPit = new THREE.MeshStandardMaterial({
    color: 0x08080f,
    roughness: 0.95,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const matRail = new THREE.MeshStandardMaterial({
    color: 0x1a1a28,
    roughness: 0.45,
    metalness: 0.85,
  });

  const matNeon = new THREE.MeshStandardMaterial({
    color: 0x120818,
    roughness: 0.35,
    metalness: 0.25,
    emissive: 0x7a45ff,
    emissiveIntensity: 1.0,
  });

  // -----------------
  // FLOOR (outer)
  // -----------------
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(OUTER_R, 96),
    matFloor
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // -----------------
  // PIT (open hole + inner walls + bottom)
  // -----------------
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(PIT_R, PIT_R, PIT_DEPTH, 96, 1, true),
    matPit
  );
  pitWall.position.y = -PIT_DEPTH / 2;
  pitWall.rotation.y = Math.PI; // inward faces
  scene.add(pitWall);

  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(PIT_R - 0.05, 80),
    new THREE.MeshStandardMaterial({
      color: 0x07070c,
      roughness: 0.98,
      metalness: 0.02,
      emissive: 0x160a22,
      emissiveIntensity: 0.35,
    })
  );
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = -PIT_DEPTH;
  scene.add(pitBottom);

  // make pit bottom teleportable (so you can jump down if you want)
  pitBottom.userData.teleportable = true;

  // -----------------
  // RING WALKWAY AROUND PIT
  // -----------------
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(RING_INNER_R, RING_OUTER_R, 128),
    matRing
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);

  ring.userData.teleportable = true;

  // -----------------
  // WALLS (cylindrical room)
  // -----------------
  const walls = new THREE.Mesh(
    new THREE.CylinderGeometry(OUTER_R, OUTER_R, WALL_H, 128, 1, true),
    matWall
  );
  walls.position.y = WALL_H / 2;
  walls.rotation.y = Math.PI;
  scene.add(walls);

  // -----------------
  // PIT RAIL (top ring)
  // -----------------
  const pitRailR = PIT_R + 0.2;
  const pitRail = new THREE.Mesh(
    new THREE.TorusGeometry(pitRailR, 0.08, 14, 128),
    matRail
  );
  pitRail.rotation.x = Math.PI / 2;
  pitRail.position.y = 0.95;
  scene.add(pitRail);

  // Neon inner rail (glow)
  const pitNeon = new THREE.Mesh(
    new THREE.TorusGeometry(PIT_R + 0.55, 0.05, 10, 128),
    matNeon
  );
  pitNeon.rotation.x = Math.PI / 2;
  pitNeon.position.y = 0.65;
  scene.add(pitNeon);

  // -----------------
  // BALCONY (upper ring) + rails
  // -----------------
  const balcony = new THREE.Mesh(
    new THREE.RingGeometry(RING_INNER_R + 0.8, RING_OUTER_R - 0.8, 128),
    new THREE.MeshStandardMaterial({
      color: 0x0d0d13,
      roughness: 0.92,
      metalness: 0.08,
    })
  );
  balcony.rotation.x = -Math.PI / 2;
  balcony.position.y = BALCONY_Y;
  scene.add(balcony);

  // balcony rail (outer)
  const balconyOuterRail = new THREE.Mesh(
    new THREE.TorusGeometry(RING_OUTER_R - 0.7, 0.07, 12, 128),
    matRail
  );
  balconyOuterRail.rotation.x = Math.PI / 2;
  balconyOuterRail.position.y = BALCONY_Y + 1.0;
  scene.add(balconyOuterRail);

  // balcony rail (inner)
  const balconyInnerRail = new THREE.Mesh(
    new THREE.TorusGeometry(RING_INNER_R + 1.0, 0.07, 12, 128),
    matRail
  );
  balconyInnerRail.rotation.x = Math.PI / 2;
  balconyInnerRail.position.y = BALCONY_Y + 1.0;
  scene.add(balconyInnerRail);

  // balcony support posts (simple)
  {
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, BALCONY_Y, 12);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = Math.cos(a) * (RING_OUTER_R - 1.2);
      const z = Math.sin(a) * (RING_OUTER_R - 1.2);
      const post = new THREE.Mesh(postGeo, matRail);
      post.position.set(x, BALCONY_Y / 2, z);
      scene.add(post);
    }
  }

  // -----------------
  // STAIRS (entry gap + steps down into pit)
  // -----------------
  // We cut a "visual lane" using fewer rail posts and place steps.
  // This is not boolean-cut; it’s an open lane by placement.
  const stair = new THREE.Group();
  scene.add(stair);

  const steps = 14;
  const stepW = 2.6;
  const stepH = PIT_DEPTH / steps;
  const stepD = 0.55;

  const stepMat = new THREE.MeshStandardMaterial({
    color: 0x12121a,
    roughness: 0.85,
    metalness: 0.08,
  });

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const y = -t * PIT_DEPTH + stepH * 0.5;
    const r = PIT_R + 0.6 + t * 2.2;

    const x = Math.cos(ENTRY_ANGLE) * r;
    const z = Math.sin(ENTRY_ANGLE) * r;

    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, stepH, stepD),
      stepMat
    );
    step.position.set(x, y, z);
    step.lookAt(0, y, 0);
    stair.add(step);
  }

  // Side rails for stairs (small)
  {
    const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 10);
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const y = 0.8 - t * (PIT_DEPTH - 0.6);
      const r = PIT_R + 1.4 + t * 1.8;
      const x = Math.cos(ENTRY_ANGLE) * r;
      const z = Math.sin(ENTRY_ANGLE) * r;

      const left = new THREE.Mesh(railGeo, matRail);
      const right = new THREE.Mesh(railGeo, matRail);
      left.position.set(x + 0.9 * Math.cos(ENTRY_ANGLE + Math.PI / 2), y, z + 0.9 * Math.sin(ENTRY_ANGLE + Math.PI / 2));
      right.position.set(x + 0.9 * Math.cos(ENTRY_ANGLE - Math.PI / 2), y, z + 0.9 * Math.sin(ENTRY_ANGLE - Math.PI / 2));
      scene.add(left, right);
    }
  }

  // -----------------
  // JUMBOTRONS (4 corners on the wall)
  // -----------------
  const screens = [];
  const screenGeo = new THREE.PlaneGeometry(6.2, 3.2);

  function makeScreen(angle, y) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0b0b12,
      roughness: 0.55,
      metalness: 0.10,
      emissive: 0x2b1bff,
      emissiveIntensity: 1.4,
    });

    const m = new THREE.Mesh(screenGeo, mat);
    const r = OUTER_R - 0.4;
    m.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    m.lookAt(0, y, 0);
    scene.add(m);
    screens.push(m);
  }

  makeScreen(Math.PI * 0.25, 4.6);
  makeScreen(Math.PI * 0.75, 4.6);
  makeScreen(Math.PI * 1.25, 4.6);
  makeScreen(Math.PI * 1.75, 4.6);

  // small “door signs” under each screen
  {
    const signGeo = new THREE.PlaneGeometry(3.4, 0.7);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x120a1f,
      emissive: 0x7a45ff,
      emissiveIntensity: 0.9,
      roughness: 0.7,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 4; i++) {
      const a = Math.PI * (0.25 + i * 0.5);
      const sign = new THREE.Mesh(signGeo, signMat);
      const r = OUTER_R - 0.55;
      sign.position.set(Math.cos(a) * r, 2.2, Math.sin(a) * r);
      sign.lookAt(0, 2.2, 0);
      scene.add(sign);
    }
  }

  // -----------------
  // STORE (kiosk + neon)
  // -----------------
  const store = new THREE.Group();
  scene.add(store);

  const storeAngle = ENTRY_ANGLE + Math.PI * 0.5;
  const storeR = RING_OUTER_R - 3.5;
  store.position.set(Math.cos(storeAngle) * storeR, 0, Math.sin(storeAngle) * storeR);
  store.lookAt(0, 0.7, 0);

  const booth = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.6, 1.4),
    new THREE.MeshStandardMaterial({
      color: 0x0e0e16,
      roughness: 0.7,
      metalness: 0.2,
      emissive: 0x090012,
      emissiveIntensity: 0.25,
    })
  );
  booth.position.y = 0.8;
  store.add(booth);

  const boothTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.18, 1.55),
    matNeon
  );
  boothTop.position.y = 1.55;
  store.add(boothTop);

  const storeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.55),
    new THREE.MeshStandardMaterial({
      color: 0x09090f,
      emissive: 0x7a45ff,
      emissiveIntensity: 1.3,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })
  );
  storeSign.position.set(0, 2.05, 0.72);
  store.add(storeSign);

  // -----------------
  // BOTS (walking around ring)
  // -----------------
  const bots = [];
  const botCount = 10;

  const botBodyMat = new THREE.MeshStandardMaterial({
    color: 0x111118,
    roughness: 0.45,
    metalness: 0.75,
    emissive: 0x2c1a55,
    emissiveIntensity: 0.25,
  });

  const botCoreMat = new THREE.MeshStandardMaterial({
    color: 0x0b0b12,
    roughness: 0.25,
    metalness: 0.15,
    emissive: 0x7a45ff,
    emissiveIntensity: 0.9,
  });

  function makeBot() {
    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.55, 8, 12),
      botBodyMat
    );
    body.position.y = 0.75;
    g.add(body);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      botCoreMat
    );
    core.position.set(0, 0.95, 0.22);
    g.add(core);

    return g;
  }

  for (let i = 0; i < botCount; i++) {
    const b = makeBot();
    b.userData.a = (i / botCount) * Math.PI * 2;
    b.userData.r = (RING_INNER_R + RING_OUTER_R) * 0.5 + (i % 2 ? 0.6 : -0.6);
    b.userData.speed = 0.35 + (i % 3) * 0.12; // different speeds
    scene.add(b);
    bots.push(b);
  }

  // Add a few pit-side idle bots (“playing / watching” vibe)
  {
    const idleCount = 4;
    for (let i = 0; i < idleCount; i++) {
      const b = makeBot();
      const a = ENTRY_ANGLE + Math.PI + i * (Math.PI / 8);
      const r = PIT_R + 2.0;
      b.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      b.rotation.y = -a + Math.PI * 0.5;
      scene.add(b);
    }
  }

  // -----------------
  // SAFE SPAWN (IMPORTANT — OUTSIDE PIT)
  // -----------------
  function setSpawn(x, y, z, yaw = Math.PI) {
    camera.position.set(x, 1.6 + y, z);
    camera.rotation.set(0, yaw, 0);
    camera.lookAt(0, 1.4, 0);
  }

  // ALWAYS spawn on ring, not in pit
  setSpawn(0, 0, 11.5, Math.PI);

  // expose helpers for spine buttons
  window.SCARLETT_SPAWN = (x, y, z, yaw) => setSpawn(x, y, z, yaw);
  window.SCARLETT_SPAWN_SAFE = () => setSpawn(0, 0, 11.5, Math.PI);
  window.SCARLETT_SPAWN_PITRIM = () => setSpawn(0, 0, PIT_R + 2.5, Math.PI);
  window.SCARLETT_SPAWN_BALCONY = () => setSpawn(0, BALCONY_Y - 0.2, RING_OUTER_R - 4.5, Math.PI);

  // -----------------
  // UPDATE LOOP (bots + screens + neon pulse)
  // -----------------
  let t = 0;

  function update(dt) {
    t += dt;

    // screens pulse
    const pulse = 1.1 + Math.sin(t * 1.6) * 0.35;
    for (const s of screens) {
      s.material.emissiveIntensity = pulse;
    }

    // neon rail pulse
    pitNeon.material.emissiveIntensity = 0.85 + Math.sin(t * 2.1) * 0.25;

    // bots walk ring
    for (const b of bots) {
      b.userData.a += dt * b.userData.speed;
      const a = b.userData.a;
      const r = b.userData.r;

      b.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);

      // face direction of travel
      const forwardA = a + Math.PI * 0.5;
      b.rotation.y = -forwardA;

      // slight bob so they feel alive
      b.position.y = 0.02 + Math.sin(t * 6 + a * 3) * 0.03;
    }
  }

  log("[world] V5 lobby ready ✅ (pit open, balcony+rails, stairs, jumbotrons, store, bots)");

  return {
    updates: [update],
    interactables: [],
    teleportSurfaces: [ring, pitBottom, balcony], // allow teleport to balcony too
  };
      }
