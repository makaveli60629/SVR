/**
 * Scarlett1 World — V4 FULL LOBBY (COLOR) + OPEN PIT + STAIRS + RAIL + STORE PAD
 * - Fix VR spawn: create/use a rig and spawn OUTSIDE pit by default
 * - Procedural checker floor texture
 * - Open pit (no cap disk)
 * - Stairs down into pit
 * - Neon rails + accents
 * - Simple store kiosk pad
 * - Bots walking
 */

export async function init({ THREE, scene, camera, log, renderer }) {
  log("[world] init V4 lobby+pit+stairs+store");

  // -----------------
  // DIMENSIONS
  // -----------------
  const roomRadius = 18;
  const roomHeight = 7;

  const pitRadius = 6.0;
  const pitDepth = 4.0;   // change later when table exists
  const pitFloorY = -pitDepth;

  const entranceAngle = Math.PI / 2; // where stairs are

  // -----------------
  // SCENE BASICS
  // -----------------
  scene.background = new THREE.Color(0x04040a);
  scene.fog = new THREE.Fog(0x04040a, 18, 55);

  // -----------------
  // LIGHTING (BRIGHT + COLOR)
  // -----------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a55, 1.1);
  hemi.position.set(0, 22, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.35);
  dir.position.set(8, 12, 7);
  scene.add(dir);

  // neon-ish fills
  const magenta = new THREE.PointLight(0xff3cff, 1.0, 60);
  magenta.position.set(-6, 4, -6);
  scene.add(magenta);

  const cyan = new THREE.PointLight(0x2bd6ff, 1.0, 60);
  cyan.position.set(6, 4, 6);
  scene.add(cyan);

  const pitGlow = new THREE.PointLight(0x7a45ff, 1.2, 45);
  pitGlow.position.set(0, 1.6, 0);
  scene.add(pitGlow);

  // -----------------
  // PLAYER RIG (VR SPAWN FIX)
  // In WebXR, the headset drives camera transforms.
  // We move a parent "rig" group so VR starts OUTSIDE the pit.
  // -----------------
  let rig = camera.parent;
  if (!rig) {
    rig = new THREE.Group();
    rig.name = "playerRig";
    scene.add(rig);
    rig.add(camera);
  }

  function setSpawn(x, y, z, yaw = 0) {
    rig.position.set(x, y, z);
    rig.rotation.set(0, yaw, 0);
  }

  // Expose so your "Reset Spawn" button (or console) can call it.
  window.SCARLETT_SPAWN = setSpawn;

  // Default spawn: OUTSIDE pit, looking toward center
  setSpawn(0, 0, 11.5, Math.PI);

  // -----------------
  // PROCEDURAL CHECKER TEXTURE (NO ASSET REQUIRED)
  // -----------------
  function makeCheckerTexture(size = 512, cells = 16) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");

    const cell = size / cells;
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const on = (x + y) % 2 === 0;
        ctx.fillStyle = on ? "#11111a" : "#0a0a12";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    // subtle diagonal stripes overlay
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#7a45ff";
    ctx.lineWidth = 2;
    for (let i = -size; i < size * 2; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.2, 2.2);
    tex.anisotropy = 4;
    return tex;
  }

  const checker = makeCheckerTexture(512, 16);

  // -----------------
  // FLOOR (RING — HOLE CUT OUT)  ✅ no cap disk
  // -----------------
  const ringGeo = new THREE.RingGeometry(pitRadius, roomRadius, 128, 1);
  const ringMat = new THREE.MeshStandardMaterial({
    map: checker,
    color: 0xffffff,
    roughness: 0.92,
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
  const pitWallGeo = new THREE.CylinderGeometry(pitRadius, pitRadius, pitDepth, 128, 1, true);
  const pitWallMat = new THREE.MeshStandardMaterial({
    color: 0x070712,
    roughness: 0.98,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const pitWall = new THREE.Mesh(pitWallGeo, pitWallMat);
  pitWall.position.y = pitFloorY / 2;
  pitWall.rotation.y = Math.PI;
  scene.add(pitWall);

  // PIT BOTTOM
  const pitBottomGeo = new THREE.CircleGeometry(pitRadius - 0.05, 128);
  const pitBottomMat = new THREE.MeshStandardMaterial({
    color: 0x05050c,
    roughness: 0.98,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const pitBottom = new THREE.Mesh(pitBottomGeo, pitBottomMat);
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = pitFloorY;
  scene.add(pitBottom);

  // -----------------
  // NEON RAILS (pit rim + room rim)
  // -----------------
  function neonTorus(radius, y, color, intensity = 1.7, tube = 0.05) {
    const geo = new THREE.TorusGeometry(radius, tube, 12, 160);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.45,
      metalness: 0.35,
    });
    const t = new THREE.Mesh(geo, mat);
    t.rotation.x = Math.PI / 2;
    t.position.y = y;
    scene.add(t);
    return t;
  }

  const pitRail = neonTorus(pitRadius + 0.12, 0.035, 0x6a3dff, 1.9, 0.055);
  const roomRail = neonTorus(roomRadius - 0.55, 0.08, 0x2bd6ff, 1.2, 0.04);

  // -----------------
  // WALLS (CYLINDER ROOM)
  // -----------------
  const wallGeo = new THREE.CylinderGeometry(roomRadius, roomRadius, roomHeight, 128, 1, true);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x141421,
    roughness: 0.92,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = roomHeight / 2;
  walls.rotation.y = Math.PI;
  scene.add(walls);

  // -----------------
  // STAIRS INTO PIT (from rim down to pit floor)
  // -----------------
  const stairGroup = new THREE.Group();
  stairGroup.name = "pitStairs";
  scene.add(stairGroup);

  const steps = 14;
  const stepH = pitDepth / steps;
  const stepD = 0.55;
  const stepW = 2.2;

  const stepGeo = new THREE.BoxGeometry(stepW, stepH * 0.95, stepD);
  const stepMat = new THREE.MeshStandardMaterial({
    color: 0x10101a,
    roughness: 0.9,
    metalness: 0.08,
    emissive: 0x1c0f3a,
    emissiveIntensity: 0.18,
  });

  // Place staircase at entranceAngle, starting near rim, descending inward
  for (let i = 0; i < steps; i++) {
    const s = new THREE.Mesh(stepGeo, stepMat);
    const t = i / (steps - 1);

    const y = 0 - (t * pitDepth) + stepH * 0.5;        // down into pit
    const r = pitRadius - 0.6 - t * 2.0;               // slightly inward as it descends
    const x = Math.cos(entranceAngle) * r;
    const z = Math.sin(entranceAngle) * r;

    s.position.set(x, y, z);
    s.rotation.y = -entranceAngle + Math.PI / 2;
    stairGroup.add(s);

    // tiny neon edge on every 2nd step
    if (i % 2 === 0) {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(stepW, 0.02, 0.02),
        new THREE.MeshStandardMaterial({
          color: 0x6a3dff,
          emissive: 0x6a3dff,
          emissiveIntensity: 2.2,
          roughness: 0.4,
          metalness: 0.2,
        })
      );
      edge.position.set(x, y + stepH * 0.48, z - (Math.cos(entranceAngle) * 0.01));
      edge.rotation.y = -entranceAngle + Math.PI / 2;
      stairGroup.add(edge);
    }
  }

  // -----------------
  // CENTER PEDESTAL (table placeholder; you can swap later)
  // -----------------
  const pedestalRadius = 2.2;
  const pedestalHeight = 1.6;
  const pedestalTopY = pitFloorY + pedestalHeight;

  const pedestalGeo = new THREE.CylinderGeometry(pedestalRadius, pedestalRadius, pedestalHeight, 96);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x14141c,
    roughness: 0.85,
    metalness: 0.2,
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, pitFloorY + pedestalHeight / 2, 0);
  scene.add(pedestal);

  // table placeholder top
  const tableGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.18, 96);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x0c0c12,
    roughness: 0.65,
    metalness: 0.15,
    emissive: 0x120a25,
    emissiveIntensity: 0.35,
  });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, pedestalTopY + 0.12, 0);
  scene.add(table);

  // -----------------
  // SIMPLE STORE PAD (expand later)
  // -----------------
  const store = new THREE.Group();
  store.name = "storePad";
  scene.add(store);

  const storeAngle = entranceAngle + Math.PI; // opposite side
  const storeR = pitRadius + 4.7;
  const storeX = Math.cos(storeAngle) * storeR;
  const storeZ = Math.sin(storeAngle) * storeR;

  const padGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.18, 64);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x0e0e18,
    roughness: 0.6,
    metalness: 0.25,
    emissive: 0x2bd6ff,
    emissiveIntensity: 0.65,
  });
  const storePad = new THREE.Mesh(padGeo, padMat);
  storePad.position.set(storeX, 0.09, storeZ);
  store.add(storePad);

  // sign
  const signGeo = new THREE.PlaneGeometry(2.2, 0.9);
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x101018,
    emissive: 0xff3cff,
    emissiveIntensity: 0.95,
    roughness: 0.35,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(storeX, 1.6, storeZ);
  sign.lookAt(0, 1.5, 0);
  store.add(sign);

  // -----------------
  // 4 JUMBOTRONS (N/E/S/W)
  // -----------------
  const jumboW = 5.2, jumboH = 2.7;
  const jumboGeo = new THREE.PlaneGeometry(jumboW, jumboH);
  const baseJumboMat = new THREE.MeshStandardMaterial({
    color: 0x0f0f18,
    emissive: 0x3a7bff,
    emissiveIntensity: 0.85,
    roughness: 0.3,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  const jumbotrons = [];
  const jr = roomRadius - 0.45;
  const jy = 4.2;

  function addJumbo(x, z, ry) {
    const m = new THREE.Mesh(jumboGeo, baseJumboMat.clone());
    m.position.set(x, jy, z);
    m.rotation.y = ry;
    scene.add(m);
    jumbotrons.push(m);
  }

  addJumbo(0, -jr, 0);
  addJumbo(0, jr, Math.PI);
  addJumbo(-jr, 0, Math.PI / 2);
  addJumbo(jr, 0, -Math.PI / 2);

  // -----------------
  // BOTS (simple walkers)
  // -----------------
  const bots = [];
  const botCount = 8;
  const botGeo = new THREE.CapsuleGeometry(0.18, 0.55, 6, 12);

  for (let i = 0; i < botCount; i++) {
    const botMat = new THREE.MeshStandardMaterial({
      color: 0x9a9ad0,
      roughness: 0.7,
      metalness: 0.15,
      emissive: i % 2 ? 0x2bd6ff : 0xff3cff,
      emissiveIntensity: 0.18,
    });
    const b = new THREE.Mesh(botGeo, botMat);
    const a = (i / botCount) * Math.PI * 2;
    b.position.set(Math.cos(a) * (pitRadius + 4.4), 0.9, Math.sin(a) * (pitRadius + 4.4));
    b.userData = { a, speed: 0.28 + (i % 4) * 0.06 };
    scene.add(b);
    bots.push(b);
  }

  log("[world] ready ✅");

  // -----------------
  // UPDATE LOOP
  // -----------------
  function update(dt) {
    const t = performance.now() * 0.001;

    // bots walk around pit rim
    for (const b of bots) {
      const s = b.userData.speed;
      const a = b.userData.a + t * s;
      const rr = pitRadius + 4.5;
      b.position.x = Math.cos(a) * rr;
      b.position.z = Math.sin(a) * rr;
      b.position.y = 0.9;
      b.rotation.y = -a + Math.PI / 2;
    }

    // neon pulse
    pitRail.material.emissiveIntensity = 1.6 + 0.5 * Math.sin(t * 1.4);
    roomRail.material.emissiveIntensity = 0.9 + 0.25 * Math.sin(t * 1.1);

    // jumbotrons pulse
    const pulse = 0.6 + 0.4 * Math.sin(t * 1.2);
    for (const j of jumbotrons) j.material.emissiveIntensity = 0.6 + pulse;
  }

  return {
    updates: [update],
    interactables: [],
  };
      }
