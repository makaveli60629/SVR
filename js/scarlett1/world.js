/**
 * SVR/js/scarlett1/world.js
 * SCARLETT1 FULL WORLD (NO BARE THREE IMPORTS)
 * Uses ctx.THREE only (safe on GitHub Pages).
 *
 * Features:
 * - Textured lobby floor ring + pit cylinder walls
 * - Pedestal + table + chairs centered
 * - 8-step stairs into pit + bottom plate
 * - Curved rail on pit rim + stair handrail on correct side
 * - Store front + balcony platform + rails + signage + jumbotrons + doors
 * - Populates ctx.walkSurfaces + ctx.teleportSurfaces for movement/teleport
 * - Initializes runtime Input (../runtime/input.js) so sticks + teleport can work
 */

import { Input } from "../runtime/input.js";

export async function init(ctx) {
  const { THREE, scene, rig, camera, renderer, Bus } = ctx;
  const log = ctx.log || ((m) => console.log(m));

  // ------------------------------------------------------------
  // Clean world (safe)
  // ------------------------------------------------------------
  const WORLD = new THREE.Group();
  WORLD.name = "SCARLETT1_WORLD";
  scene.add(WORLD);

  // Surfaces for movement / teleport
  ctx.walkSurfaces = ctx.walkSurfaces || [];
  ctx.teleportSurfaces = ctx.teleportSurfaces || [];

  // Helpers
  const addWalk = (obj) => {
    ctx.walkSurfaces.push(obj);
    ctx.teleportSurfaces.push(obj);
  };

  const makeCanvasTexture = (drawFn, size = 512) => {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    drawFn(g, size);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  };

  // ------------------------------------------------------------
  // Parameters (tuned for your pit + lobby)
  // ------------------------------------------------------------
  const outerR = 70;
  const pitR = 10.0;
  const pitDepth = 7.5;          // visual depth
  const pitFloorY = 0;           // pit floor baseline
  const lobbyY = pitFloorY + pitDepth; // lobby ring height

  // Stairs
  const stairSteps = 8;
  const stairRiseTotal = lobbyY - pitFloorY; // from pit floor up to lobby
  const stairRise = stairRiseTotal / stairSteps;
  const stairRun = 1.25;         // depth per step
  const stairWidth = 3.2;
  const stairAngle = Math.PI * 0.5; // entrance direction (front)

  // Store
  const storeAngle = 0;           // facing +Z (you can rotate later)
  const storeRadius = outerR - 10;
  const storeW = 18;
  const storeH = 7;
  const storeD = 7;

  // Doors & jumbotrons
  const doorCount = 4;
  const doorRadius = outerR - 6;

  // ------------------------------------------------------------
  // Lighting (bright + neon vibe)
  // ------------------------------------------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  const sun = new THREE.DirectionalLight(0xffffff, 0.85);
  sun.position.set(10, 20, 12);
  WORLD.add(sun);

  const top = new THREE.PointLight(0xffffff, 1.4, 260);
  top.position.set(0, lobbyY + 16, 0);
  WORLD.add(top);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = new THREE.PointLight(0x8a2be2, 1.0, 80);
    p.position.set(Math.cos(a) * (outerR - 18), lobbyY + 8, Math.sin(a) * (outerR - 18));
    WORLD.add(p);
  }

  // ------------------------------------------------------------
  // Textures
  // ------------------------------------------------------------
  const carpetTex = makeCanvasTexture((g, s) => {
    g.fillStyle = "#3a2b66";
    g.fillRect(0, 0, s, s);
    g.globalAlpha = 0.9;
    g.strokeStyle = "#7a5cff";
    g.lineWidth = s * 0.018;
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.arc(s * 0.5, s * 0.5, s * (0.12 + i * 0.07), 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    // subtle speckle
    for (let i = 0; i < 4500; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const v = 30 + Math.random() * 60;
      g.fillStyle = `rgba(${v},${v},${v},0.06)`;
      g.fillRect(x, y, 1, 1);
    }
  });
  carpetTex.repeat.set(6, 6);

  const pitWallTex = makeCanvasTexture((g, s) => {
    g.fillStyle = "#15121f";
    g.fillRect(0, 0, s, s);
    // brick-like bands
    for (let y = 0; y < s; y += 42) {
      g.fillStyle = "rgba(255,255,255,0.05)";
      g.fillRect(0, y, s, 2);
      for (let x = 0; x < s; x += 110) {
        g.fillStyle = "rgba(255,255,255,0.04)";
        g.fillRect(x + (y / 42) % 2 * 24, y + 6, 2, 30);
      }
    }
    // neon grime
    g.globalAlpha = 0.25;
    g.fillStyle = "#5b3cff";
    g.fillRect(0, s * 0.85, s, s * 0.02);
    g.globalAlpha = 1;
  });
  pitWallTex.repeat.set(8, 2);

  const metalTex = makeCanvasTexture((g, s) => {
    g.fillStyle = "#24242b";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`;
      g.lineWidth = 1 + Math.random() * 2;
      g.beginPath();
      g.moveTo(Math.random() * s, 0);
      g.lineTo(Math.random() * s, s);
      g.stroke();
    }
  });
  metalTex.repeat.set(2, 2);

  // ------------------------------------------------------------
  // Lobby ring floor (walkable)
  // ------------------------------------------------------------
  const lobbyFloor = new THREE.Mesh(
    new THREE.RingGeometry(pitR + 0.25, outerR, 96, 2),
    new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.95, metalness: 0.0 })
  );
  lobbyFloor.rotation.x = -Math.PI / 2;
  lobbyFloor.position.y = lobbyY;
  lobbyFloor.receiveShadow = false;
  WORLD.add(lobbyFloor);
  addWalk(lobbyFloor);

  // ------------------------------------------------------------
  // Pit floor (walkable) – fixes “walking on air”
  // ------------------------------------------------------------
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(pitR - 0.2, 64),
    new THREE.MeshStandardMaterial({ color: 0x14121a, roughness: 0.95, metalness: 0.0 })
  );
  pitFloor.rotation.x = -Math.PI / 2;
  pitFloor.position.y = pitFloorY;
  WORLD.add(pitFloor);
  addWalk(pitFloor);

  // ------------------------------------------------------------
  // Pit walls (visual)
  // ------------------------------------------------------------
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR, pitR, pitDepth, 96, 1, true),
    new THREE.MeshStandardMaterial({
      map: pitWallTex,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.05,
    })
  );
  pitWall.position.y = pitFloorY + pitDepth / 2;
  WORLD.add(pitWall);

  // ------------------------------------------------------------
  // Rim trim (NOT blocking stairs)
  //   - we cut a gap where the stairs enter
  // ------------------------------------------------------------
  const trimY = lobbyY + 0.06;
  const trimR1 = pitR + 0.03;
  const trimR2 = pitR + 0.18;

  const trim = new THREE.Group();
  trim.name = "pit_rim_trim";
  WORLD.add(trim);

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x2e1b48,
    roughness: 0.3,
    metalness: 0.6,
    emissive: new THREE.Color(0x2a0070),
    emissiveIntensity: 0.55,
  });

  // Create rim segments except a gap around the stair entrance
  const gapHalf = 0.22; // radians (~25 degrees each side)
  const segs = 24;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    const mid = (a0 + a1) / 2;

    // skip segment if near stair entrance angle
    const d = angleDiff(mid, stairAngle);
    if (Math.abs(d) < gapHalf) continue;

    const geom = new THREE.RingGeometry(trimR1, trimR2, 16, 1, a0, a1 - a0);
    const m = new THREE.Mesh(geom, trimMat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = trimY;
    trim.add(m);
  }

  // ------------------------------------------------------------
  // Pit rail (curved + nice posts)
  // ------------------------------------------------------------
  const rail = new THREE.Group();
  rail.name = "pit_rail";
  WORLD.add(rail);

  const railR = pitR + 0.36;
  const railTopY = lobbyY + 1.08;
  const postMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.55, metalness: 0.9 });
  const barMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    roughness: 0.25,
    metalness: 0.8,
    emissive: new THREE.Color(0x0088aa),
    emissiveIntensity: 0.75,
  });

  // Posts
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;

    // keep rail gap at stairs too
    if (Math.abs(angleDiff(a, stairAngle)) < gapHalf) continue;

    const x = Math.cos(a) * railR;
    const z = Math.sin(a) * railR;

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.05, 12), postMat);
    post.position.set(x, lobbyY + 0.55, z);
    rail.add(post);
  }

  // Curved top rail line (tube)
  {
    const pts = [];
    const n = 220;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      if (Math.abs(angleDiff(a, stairAngle)) < gapHalf) continue;
      pts.push(new THREE.Vector3(Math.cos(a) * railR, railTopY, Math.sin(a) * railR));
    }
    // close it nicely
    if (pts.length > 6) pts.push(pts[0].clone());

    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 500, 0.04, 10, true),
      barMat
    );
    rail.add(tube);
  }

  // ------------------------------------------------------------
  // Stairs into pit (8 steps) + bottom plate
  // ------------------------------------------------------------
  const stairs = new THREE.Group();
  stairs.name = "pit_stairs";
  WORLD.add(stairs);

  const stairMat = new THREE.MeshStandardMaterial({ color: 0x241e31, roughness: 0.95, metalness: 0.1 });
  const stairEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x7a5cff,
    roughness: 0.25,
    metalness: 0.5,
    emissive: new THREE.Color(0x3b21ff),
    emissiveIntensity: 0.5,
  });

  // Place stairs so top step sits at lobby rim, then descend into pit
  // Steps run inward towards pit center along "stairAngle"
  const dir = new THREE.Vector3(Math.cos(stairAngle), 0, Math.sin(stairAngle));
  const right = new THREE.Vector3(-dir.z, 0, dir.x);

  const topAnchor = dir.clone().multiplyScalar(pitR + 0.35); // near rim gap
  topAnchor.y = lobbyY;

  // Build steps
  for (let i = 0; i < stairSteps; i++) {
    const stepYTop = lobbyY - i * stairRise;
    const stepYBottom = stepYTop - stairRise;

    const runIn = i * stairRun;
    const centerPos = new THREE.Vector3()
      .copy(topAnchor)
      .add(dir.clone().multiplyScalar(-runIn - stairRun * 0.5));
    centerPos.y = (stepYTop + stepYBottom) * 0.5;

    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stairWidth, stairRise * 0.98, stairRun * 0.98),
      stairMat
    );
    step.position.copy(centerPos);

    // subtle edge strip
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(stairWidth, 0.03, 0.08),
      stairEdgeMat
    );
    edge.position.copy(centerPos);
    edge.position.y = stepYTop - 0.02;
    edge.position.add(dir.clone().multiplyScalar(+stairRun * 0.44)); // front lip

    stairs.add(step);
    stairs.add(edge);

    // Walkable surface (top face) — use a thin plane to avoid ray misses
    const tread = new THREE.Mesh(
      new THREE.PlaneGeometry(stairWidth, stairRun),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    tread.rotation.x = -Math.PI / 2;
    tread.position.set(centerPos.x, stepYTop + 0.01, centerPos.z);
    stairs.add(tread);
    addWalk(tread);
  }

  // Bottom plate attached to last step (touching pit floor)
  {
    const lastRun = stairSteps * stairRun;
    const plateCenter = new THREE.Vector3()
      .copy(topAnchor)
      .add(dir.clone().multiplyScalar(-lastRun - 1.4));
    plateCenter.y = pitFloorY + 0.06;

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(stairWidth + 0.6, 0.12, 3.0),
      new THREE.MeshStandardMaterial({ color: 0x121019, roughness: 0.95 })
    );
    plate.position.copy(plateCenter);
    stairs.add(plate);

    const plateWalk = new THREE.Mesh(
      new THREE.PlaneGeometry(stairWidth + 0.6, 3.0),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    plateWalk.rotation.x = -Math.PI / 2;
    plateWalk.position.set(plateCenter.x, pitFloorY + 0.12, plateCenter.z);
    stairs.add(plateWalk);
    addWalk(plateWalk);
  }

  // Stair handrail (RIGHT side of stairs as you go DOWN)
  {
    const handrail = new THREE.Group();
    handrail.name = "stair_handrail";
    WORLD.add(handrail);

    // "Right side" while descending = +right vector relative to dir
    const sideOffset = right.clone().multiplyScalar(+stairWidth * 0.52);

    // Posts + top rail
    const pts = [];
    for (let i = 0; i <= stairSteps; i++) {
      const y = lobbyY - i * stairRise + 1.0;
      const runIn = i * stairRun + 0.1;
      const p = new THREE.Vector3()
        .copy(topAnchor)
        .add(dir.clone().multiplyScalar(-runIn))
        .add(sideOffset);
      p.y = y;
      pts.push(p);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.0, 10), postMat);
      post.position.set(p.x, y - 0.5, p.z);
      handrail.add(post);
    }

    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 220, 0.035, 10, false),
      barMat
    );
    handrail.add(tube);
  }

  // ------------------------------------------------------------
  // Center pedestal + table + chairs (dead center)
  // ------------------------------------------------------------
  const center = new THREE.Group();
  center.name = "center_table";
  WORLD.add(center);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.65, 1.15, 40),
    new THREE.MeshStandardMaterial({ color: 0x1a1622, roughness: 0.9 })
  );
  pedestal.position.set(0, pitFloorY + 0.58, 0);
  center.add(pedestal);

  const pedestalTop = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 0.15, 40),
    new THREE.MeshStandardMaterial({
      color: 0x2a2240,
      roughness: 0.25,
      metalness: 0.4,
      emissive: new THREE.Color(0x18004a),
      emissiveIntensity: 0.6,
    })
  );
  pedestalTop.position.set(0, pitFloorY + 1.2, 0);
  center.add(pedestalTop);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.7, 0.18, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0e0c14,
      roughness: 0.5,
      metalness: 0.15,
      emissive: new THREE.Color(0x001018),
      emissiveIntensity: 0.4,
    })
  );
  table.position.set(0, pitFloorY + 1.38, 0);
  center.add(table);

  // Chairs (6)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const cx = Math.cos(a) * 3.1;
    const cz = Math.sin(a) * 3.1;

    const chair = new THREE.Group();
    chair.position.set(cx, pitFloorY + 0.35, cz);
    chair.rotation.y = a + Math.PI;

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.12, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x181522, roughness: 0.95 })
    );
    seat.position.y = 0.42;
    chair.add(seat);

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.7, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x181522, roughness: 0.95 })
    );
    back.position.set(0, 0.78, -0.27);
    chair.add(back);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.1, 0.45, 10),
      postMat
    );
    stem.position.y = 0.22;
    chair.add(stem);

    center.add(chair);
  }

  // ------------------------------------------------------------
  // Outer lobby walls (solid feel — clamp movement inside)
  // NOTE: No physics engine; we clamp rig position to prevent walking through.
  // ------------------------------------------------------------
  const wallH = 10;
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR, outerR, wallH, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0b0a12, roughness: 0.95, side: THREE.DoubleSide })
  );
  wall.position.y = lobbyY + wallH / 2;
  WORLD.add(wall);

  // Ceiling (sealed)
  const ceiling = new THREE.Mesh(
    new THREE.CircleGeometry(outerR, 96),
    new THREE.MeshStandardMaterial({ color: 0x070611, roughness: 1.0 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = lobbyY + wallH;
  WORLD.add(ceiling);

  // ------------------------------------------------------------
  // Doors + Jumbotrons + Neon signs
  // ------------------------------------------------------------
  const doors = new THREE.Group();
  doors.name = "doors_and_screens";
  WORLD.add(doors);

  for (let i = 0; i < doorCount; i++) {
    const a = (i / doorCount) * Math.PI * 2;
    const pos = new THREE.Vector3(Math.cos(a) * doorRadius, lobbyY + 0.01, Math.sin(a) * doorRadius);
    const face = Math.atan2(-pos.x, -pos.z);

    // Door frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 6.5, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x14121b, roughness: 0.95 })
    );
    frame.position.set(pos.x, lobbyY + 3.25, pos.z);
    frame.rotation.y = face;
    doors.add(frame);

    // Door panel
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 5.0, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0x0c0b10,
        roughness: 0.6,
        metalness: 0.2,
        emissive: new THREE.Color(0x12002c),
        emissiveIntensity: 0.5,
      })
    );
    panel.position.set(pos.x, lobbyY + 2.6, pos.z + 0.2);
    panel.rotation.y = face;
    doors.add(panel);

    // Jumbotron above
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 4.2),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a0f,
        roughness: 0.3,
        metalness: 0.3,
        emissive: new THREE.Color(0x00222a),
        emissiveIntensity: 0.9,
      })
    );
    screen.position.set(pos.x, lobbyY + 8.2, pos.z - 0.25);
    screen.rotation.y = face;
    doors.add(screen);

    // Neon sign above door (cursive-ish look placeholder)
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 0.55, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0x22001a,
        emissive: new THREE.Color(i % 2 ? 0xff2bd6 : 0x00d7ff),
        emissiveIntensity: 1.0,
        roughness: 0.2,
        metalness: 0.4,
      })
    );
    sign.position.set(pos.x, lobbyY + 6.2, pos.z - 0.2);
    sign.rotation.y = face;
    doors.add(sign);
  }

  // ------------------------------------------------------------
  // Store + balcony (placeholders but nice)
  // ------------------------------------------------------------
  const store = new THREE.Group();
  store.name = "store";
  WORLD.add(store);

  {
    const a = storeAngle;
    const sx = Math.cos(a) * storeRadius;
    const sz = Math.sin(a) * storeRadius;
    const face = Math.atan2(-sx, -sz);

    // Store room block
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(storeW, storeH, storeD),
      new THREE.MeshStandardMaterial({ color: 0x0e0c14, roughness: 0.95 })
    );
    room.position.set(sx, lobbyY + storeH / 2, sz);
    room.rotation.y = face;
    store.add(room);

    // Bright underglow
    const under = new THREE.PointLight(0x00ffff, 1.6, 28);
    under.position.set(sx, lobbyY + 1.2, sz);
    store.add(under);

    // Store sign
    const storeSign = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.2, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0x120016,
        emissive: new THREE.Color(0xff2bd6),
        emissiveIntensity: 1.2,
        roughness: 0.3,
        metalness: 0.5,
      })
    );
    storeSign.position.set(sx, lobbyY + 6.1, sz - 3.8);
    storeSign.rotation.y = face;
    store.add(storeSign);

    // Balcony platform above store
    const balcony = new THREE.Mesh(
      new THREE.BoxGeometry(storeW + 4, 0.35, storeD + 4),
      new THREE.MeshStandardMaterial({ color: 0x14121b, roughness: 0.95 })
    );
    balcony.position.set(sx, lobbyY + storeH + 0.9, sz);
    balcony.rotation.y = face;
    store.add(balcony);

    // Balcony rails (simple)
    const railMat2 = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: new THREE.Color(0x00a0aa),
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.8,
    });

    const railTop = new THREE.Mesh(
      new THREE.BoxGeometry(storeW + 4, 0.12, 0.12),
      railMat2
    );
    railTop.position.set(sx, lobbyY + storeH + 1.9, sz - (storeD / 2 + 2));
    railTop.rotation.y = face;
    store.add(railTop);

    for (let i = -6; i <= 6; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.05, 10), postMat);
      // distribute across front edge
      const localX = (i / 6) * (storeW / 2 + 1.4);
      const px = sx + Math.cos(face) * localX + Math.sin(face) * 0.0;
      const pz = sz + Math.sin(face) * localX + Math.cos(face) * 0.0 - (storeD / 2 + 2) * Math.cos(0) * 1;
      // simpler: approximate by rotating point around store
      const rot = new THREE.Vector3(localX, 0, -(storeD / 2 + 2));
      rot.applyAxisAngle(new THREE.Vector3(0, 1, 0), face);
      post.position.set(sx + rot.x, lobbyY + storeH + 1.35, sz + rot.z);
      store.add(post);
    }
  }

  // ------------------------------------------------------------
  // Spawn / Rig placement (spawn on lobby floor, looking toward center)
  // ------------------------------------------------------------
  const spawnPos = new THREE.Vector3(0, lobbyY + 1.7, outerR - 18);
  rig.position.copy(spawnPos);

  // face center
  const lookTarget = new THREE.Vector3(0, lobbyY + 1.7, 0);
  const dirToCenter = lookTarget.clone().sub(spawnPos);
  const yaw = Math.atan2(dirToCenter.x, dirToCenter.z);
  rig.rotation.set(0, yaw, 0);

  // ------------------------------------------------------------
  // Movement clamp (prevents walking through walls / out of bounds)
  // - clamps rig XZ between pit interior and outer wall
  // ------------------------------------------------------------
  ctx.__clampRig = () => {
    const p = rig.position;
    const r = Math.sqrt(p.x * p.x + p.z * p.z);

    // prevent leaving outer boundary
    const maxR = outerR - 2.0;
    if (r > maxR) {
      const k = maxR / (r || 1);
      p.x *= k;
      p.z *= k;
    }

    // prevent crossing pit rim unless you are in the stair gap
    // (simple rule: if you're near rim radius and not in gap angle, push out)
    const rimR = pitR + 0.15;
    const nearRim = r < rimR;
    if (nearRim && p.y > pitFloorY + 1.0) {
      const ang = Math.atan2(p.z, p.x);
      const d = Math.abs(angleDiff(ang, stairAngle));
      if (d > gapHalf) {
        // push to rim radius
        const k = rimR / (r || 1);
        p.x *= k;
        p.z *= k;
      }
    }
  };

  // ------------------------------------------------------------
  // Input initialization (VERY IMPORTANT)
  // - This makes your feet ring + lasers follow you (when the input is correct)
  // ------------------------------------------------------------
  try {
    ctx.Input = Input;
    Input.init(ctx);

    // Patch Input.update to include clamp after movement
    const baseUpdate = Input.update.bind(Input);
    Input.update = (dt) => {
      baseUpdate(dt);
      ctx.__clampRig?.();
    };

    log("✅ world init OK (FULL pit + stairs + rails + store + doors).");
  } catch (e) {
    log(`⚠️ Input init failed: ${e?.message || e}`);
  }

  // ------------------------------------------------------------
  // Done
  // ------------------------------------------------------------
  log("✅ world loaded");
}

// ------------------------------------------------------------
// small math helper
// ------------------------------------------------------------
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
      }
