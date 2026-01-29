/**
 * MODULE: world.js (SAFE)
 * Stadium deck hole + pit + double walls + rails + stairs + balcony + neon table + placeholders
 * No external imports. Uses ctx.THREE.
 */

export async function init(ctx) {
  const { THREE, scene, camera } = ctx;

  // logger compatibility (some builds use log(), others addLine())
  const log = (msg) => {
    if (typeof ctx.log === "function") ctx.log(msg);
    else if (typeof ctx.addLine === "function") ctx.addLine(msg);
    else console.log(msg);
  };

  // ---- CONFIG ----
  const holeR = 14.0;         // pit radius
  const outerR = 90.0;        // lobby radius
  const pitY = -3.2;          // pit floor Y
  const entranceAngle = Math.PI / 2; // +Z entrance
  const railY = 1.15;

  // ---- LIGHTING ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
  dirLight.position.set(10, 18, 12);
  scene.add(dirLight);

  const topLight = new THREE.PointLight(0xffffff, 1.15, 260);
  topLight.position.set(0, 26, 0);
  scene.add(topLight);

  // purple ring lights
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const p = new THREE.PointLight(0x8a2be2, 1.0, 120);
    p.position.set(Math.cos(a) * (outerR * 0.55), 7.0, Math.sin(a) * (outerR * 0.55));
    scene.add(p);
  }

  // ---- LOBBY FLOOR ----
  const lobbyFloor = new THREE.Mesh(
    new THREE.CircleGeometry(outerR, 96),
    new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.95 })
  );
  lobbyFloor.rotation.x = -Math.PI / 2;
  lobbyFloor.name = "LobbyFloor";
  scene.add(lobbyFloor);

  // ---- DECK RING (HOLE) ----
  const deckRing = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 160),
    new THREE.MeshStandardMaterial({
      color: 0x14141a,
      roughness: 0.95,
      side: THREE.DoubleSide
    })
  );
  deckRing.rotation.x = -Math.PI / 2;
  deckRing.position.y = 0.02;
  deckRing.name = "UpperDeckRing";
  scene.add(deckRing);

  // ---- PIT FLOOR + WALL ----
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(holeR, 160),
    new THREE.MeshStandardMaterial({ color: 0x07070a, roughness: 0.9, side: THREE.DoubleSide })
  );
  pitFloor.rotation.x = -Math.PI / 2;
  pitFloor.position.y = pitY;
  pitFloor.name = "PitFloor";
  scene.add(pitFloor);

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, Math.abs(pitY), 160, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b10,
      roughness: 0.9,
      side: THREE.DoubleSide
    })
  );
  pitWall.position.y = pitY / 2;
  pitWall.name = "PitWall";
  scene.add(pitWall);

  // ---- DOUBLE WALLS + CEILING ----
  const shell = new THREE.Group();
  shell.name = "LobbyShell";

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x05050b,
    roughness: 0.95,
    side: THREE.DoubleSide
  });

  const outerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR, outerR, 11.0, 200, 1, true),
    wallMat
  );
  outerWall.position.y = 5.5;
  shell.add(outerWall);

  const innerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR - 0.8, outerR - 0.8, 11.0, 200, 1, true),
    wallMat
  );
  innerWall.position.y = 5.5;
  shell.add(innerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 200),
    new THREE.MeshStandardMaterial({
      color: 0x040409,
      roughness: 1.0,
      side: THREE.DoubleSide
    })
  );
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = 11.0;
  shell.add(ceiling);

  // neon ceiling rings
  const neonMat = new THREE.MeshStandardMaterial({
    color: 0x8a2be2,
    emissive: 0x8a2be2,
    emissiveIntensity: 1.15,
    roughness: 0.55
  });

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(outerR - 2.2 - i * 1.2, 0.08, 12, 240),
      neonMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 10.3 - i * 0.75;
    shell.add(ring);
  }

  scene.add(shell);

  // ---- RAILS AROUND PIT (WITH ENTRANCE GAP) ----
  const rail = new THREE.Group();
  rail.name = "PitRail";

  const railR = holeR + 0.25;
  const posts = 72;
  const gapWidth = Math.PI / 10; // entrance gap size

  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 10);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.85 });

  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;

    // angular distance to entranceAngle
    const d = Math.abs((((a - entranceAngle) + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (d < gapWidth / 2) continue;

    const p = new THREE.Mesh(postGeo, postMat);
    p.position.set(Math.cos(a) * railR, railY * 0.55, Math.sin(a) * railR);
    rail.add(p);
  }

  const railRingTop = new THREE.Mesh(
    new THREE.TorusGeometry(railR, 0.12, 10, 200),
    new THREE.MeshStandardMaterial({ color: 0x32323d, roughness: 0.55, metalness: 0.2 })
  );
  railRingTop.rotation.x = Math.PI / 2;
  railRingTop.position.y = railY;
  rail.add(railRingTop);

  const railRingMid = new THREE.Mesh(
    new THREE.TorusGeometry(railR, 0.08, 10, 200),
    new THREE.MeshStandardMaterial({ color: 0x252532, roughness: 0.65, metalness: 0.15 })
  );
  railRingMid.rotation.x = Math.PI / 2;
  railRingMid.position.y = railY - 0.45;
  rail.add(railRingMid);

  scene.add(rail);

  // ---- STAIRS (ALIGNED TO GAP) ----
  const stairs = new THREE.Group();
  stairs.name = "Stairs";

  const steps = 14;
  const stepH = (0 - pitY) / steps;
  const stepD = 0.42;
  const stepW = 5.0;

  const stepGeo = new THREE.BoxGeometry(stepW, stepH * 0.95, stepD);
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x1e1e28, roughness: 0.95 });

  const startR = railR + 0.75;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const y = 0 - t * (0 - pitY) - stepH * 0.5;
    const r = startR - t * 3.0;

    const s = new THREE.Mesh(stepGeo, stepMat);
    s.position.set(Math.cos(entranceAngle) * r, y, Math.sin(entranceAngle) * r);
    s.rotation.y = -entranceAngle;
    stairs.add(s);
  }

  // stair side glow rails
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x8a2be2,
    emissive: 0x8a2be2,
    emissiveIntensity: 0.8,
    roughness: 0.45
  });

  const sideRailGeo = new THREE.BoxGeometry(0.08, (0 - pitY) + 0.4, 0.08);
  const railLeft = new THREE.Mesh(sideRailGeo, glowMat);
  railLeft.position.set(Math.cos(entranceAngle) * (startR - 0.6), (0 + pitY) / 2 + 0.1, Math.sin(entranceAngle) * (startR - 0.6));
  railLeft.rotation.y = -entranceAngle;
  stairs.add(railLeft);

  const railRight = new THREE.Mesh(sideRailGeo, glowMat);
  railRight.position.set(Math.cos(entranceAngle) * (startR + 0.6), (0 + pitY) / 2 + 0.1, Math.sin(entranceAngle) * (startR + 0.6));
  railRight.rotation.y = -entranceAngle;
  stairs.add(railRight);

  scene.add(stairs);

  // ---- BALCONY RING (ABOVE STORES) ----
  const balcony = new THREE.Group();
  balcony.name = "Balcony";

  const balconyY = 7.0;
  const bInner = outerR - 28.0;
  const bOuter = outerR - 22.0;

  const balconyDeck = new THREE.Mesh(
    new THREE.RingGeometry(bInner, bOuter, 180),
    new THREE.MeshStandardMaterial({ color: 0x151520, roughness: 0.9, side: THREE.DoubleSide })
  );
  balconyDeck.rotation.x = -Math.PI / 2;
  balconyDeck.position.y = balconyY;
  balcony.add(balconyDeck);

  const balconyRail = new THREE.Mesh(
    new THREE.TorusGeometry(bOuter - 0.4, 0.13, 10, 220),
    new THREE.MeshStandardMaterial({ color: 0x2d2d38, roughness: 0.6, metalness: 0.15 })
  );
  balconyRail.rotation.x = Math.PI / 2;
  balconyRail.position.y = balconyY + 1.1;
  balcony.add(balconyRail);

  scene.add(balcony);

  // ---- TABLE (BIGGER, NO SPHERE) ----
  const table = new THREE.Group();
  table.name = "NeonTable";
  table.position.y = pitY + 0.75;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(3.8, 5.2, 1.25, 96),
    new THREE.MeshStandardMaterial({
      color: 0x09090d,
      emissive: 0x3a0060,
      emissiveIntensity: 0.65,
      roughness: 0.55,
      metalness: 0.25
    })
  );
  base.position.y = 0.62;
  table.add(base);

  const tableTopMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(7.2, 7.2, 0.38, 128),
    new THREE.MeshStandardMaterial({ color: 0x060607, roughness: 0.35, metalness: 0.12 })
  );
  tableTopMesh.position.y = 1.38;
  table.add(tableTopMesh);

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(7.25, 0.22, 16, 200),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.38, metalness: 0.2 })
  );
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 1.52;
  table.add(trim);

  const neonRing = new THREE.Mesh(
    new THREE.TorusGeometry(7.35, 0.06, 10, 200),
    new THREE.MeshStandardMaterial({ color: 0x8a2be2, emissive: 0x8a2be2, emissiveIntensity: 1.1, roughness: 0.4 })
  );
  neonRing.rotation.x = Math.PI / 2;
  neonRing.position.y = 1.48;
  table.add(neonRing);

  scene.add(table);

  // ---- 8 CHAIRS (REAL SHAPE) ----
  const chairDist = 9.1;
  const seatGeo = new THREE.BoxGeometry(1.45, 0.22, 1.25);
  const backGeo = new THREE.BoxGeometry(1.45, 0.92, 0.18);
  const stemGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.1, 12);
  const footGeo = new THREE.TorusGeometry(0.55, 0.06, 10, 40);

  const chairMat = new THREE.MeshStandardMaterial({ color: 0x121218, roughness: 0.65, metalness: 0.1 });
  const chairGlow = new THREE.MeshStandardMaterial({ color: 0x7a2aff, emissive: 0x7a2aff, emissiveIntensity: 0.6, roughness: 0.4 });

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const g = new THREE.Group();

    const seat = new THREE.Mesh(seatGeo, chairMat);
    seat.position.y = 0.55;

    const back = new THREE.Mesh(backGeo, chairMat);
    back.position.set(0, 1.06, -0.55);
    back.rotation.x = -0.12;

    const stem = new THREE.Mesh(stemGeo, chairMat);
    stem.position.y = 0.0;

    const foot = new THREE.Mesh(footGeo, chairGlow);
    foot.rotation.x = Math.PI / 2;
    foot.position.y = -0.55;

    g.add(seat, back, stem, foot);
    g.position.set(Math.cos(a) * chairDist, pitY + 0.1, Math.sin(a) * chairDist);
    g.lookAt(0, pitY + 0.6, 0);
    scene.add(g);
  }

  // ---- 3 JUMBOTRONS ABOVE DOORS ----
  const jtGeo = new THREE.PlaneGeometry(8, 4);
  const jtMat = new THREE.MeshStandardMaterial({
    color: 0x220033,
    emissive: 0x6622aa,
    emissiveIntensity: 1.0
  });

  const doorAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
  for (let i = 0; i < 3; i++) {
    const t = doorAngles[i];
    const jt = new THREE.Mesh(jtGeo, jtMat);
    jt.position.set(Math.cos(t) * 30, 8.5, Math.sin(t) * 30);
    jt.lookAt(0, 7.6, 0);
    jt.name = `Jumbotron_${i + 1}`;
    scene.add(jt);
  }

  // ---- PLAYERS PLACEHOLDER (8 CAPSULES) ----
  const players = new THREE.Group();
  players.name = "Players";

  const capGeo = new THREE.CapsuleGeometry(0.22, 0.85, 6, 12);
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x2b5cff, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0xff3b7a, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x00c2ff, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x7cff4a, roughness: 0.8 }),
  ];

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const m = new THREE.Mesh(capGeo, mats[i % 4]);
    m.position.set(Math.cos(a) * 10.2, pitY + 0.45, Math.sin(a) * 10.2);
    m.lookAt(0, pitY + 0.45, 0);
    players.add(m);
  }
  scene.add(players);

  // ---- GUARD PLACEHOLDER AT ENTRANCE ----
  const guard = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.26, 0.95, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x8a2be2, emissiveIntensity: 0.25 })
  );
  guard.position.set(Math.cos(entranceAngle) * (railR + 1.2), 0.6, Math.sin(entranceAngle) * (railR + 1.2));
  guard.rotation.y = -entranceAngle + Math.PI;
  guard.name = "GUARD_PLACEHOLDER";
  scene.add(guard);

  // ---- CAMERA DEFAULT ----
  camera.position.set(0, 1.6, 22);
  camera.lookAt(0, 1.4, 0);

  log("[world] FULL world built ✅");

  // ---- ANIMATION ----
  let t = 0;
  return {
    updates: [
      (dt) => {
        t += dt;
        neonRing.material.emissiveIntensity = 0.95 + Math.sin(t * 1.4) * 0.15;
      }
    ],
    interactables: []
  };
                                    }
