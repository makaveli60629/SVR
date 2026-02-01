export const PitFull = {
  build(ctx, opt = {}) {
    const { THREE, scene } = ctx;

    // Ensure arrays exist (used by Input)
    ctx.walkSurfaces = ctx.walkSurfaces || [];
    ctx.teleportSurfaces = ctx.teleportSurfaces || [];

    const R = opt.radius ?? 6.2;
    const pitDepth = opt.depth ?? 3.4;        // how deep the pit is
    const floorY = opt.floorY ?? -pitDepth;   // pit floor Y
    const deckY = opt.deckY ?? 0;             // top deck Y
    const stairCount = opt.stairCount ?? 8;   // 7–8 feels good

    const group = new THREE.Group();
    group.name = "pit_full";
    scene.add(group);

    // ---------- Carpet (pit floor) ----------
    const carpetTex = makeCarpetTexture(THREE);
    const carpetMat = new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.95,
      metalness: 0.0,
    });

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(R - 0.15, 64),
      carpetMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY;
    floor.receiveShadow = true;
    group.add(floor);

    // ---------- Pit Walls (solid cylinder) ----------
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1b1b22,
      roughness: 0.8,
      metalness: 0.05,
    });

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, pitDepth, 96, 1, true),
      wallMat
    );
    wall.position.y = (deckY + floorY) / 2;
    wall.receiveShadow = true;
    group.add(wall);

    // ---------- Trim ring (glow-ish) but NOT blocking stairs ----------
    // We cut a "gap" by simply placing trim slightly OUTSIDE and ABOVE stair path.
    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(R + 0.06, 0.05, 16, 120),
      new THREE.MeshStandardMaterial({
        color: 0x00b7ff,
        emissive: 0x0077aa,
        emissiveIntensity: 1.0,
        roughness: 0.3,
        metalness: 0.2,
      })
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = deckY - 0.06;
    group.add(trim);

    // ---------- Stairs (8 fast steps) ----------
    // Place stairs at an angle where you want the entrance.
    const stairAngle = opt.stairAngle ?? Math.PI * 0.5; // change if you want
    const stairs = buildStairs(THREE, {
      R,
      deckY,
      floorY,
      stairCount,
      angle: stairAngle,
    });
    group.add(stairs.group);

    // Add walk/teleport surfaces
    ctx.walkSurfaces.push(floor, stairs.topPlate, stairs.bottomPlate, ...stairs.steps);
    ctx.teleportSurfaces.push(floor, stairs.topPlate, stairs.bottomPlate, ...stairs.steps);

    // Make walls NOT teleportable (but solid visually)
    // (We do not add wall to teleportSurfaces.)

    console.log("✅ PitFull: carpet + walls + stairs built");
    return group;
  },
};

function buildStairs(THREE, p) {
  const { R, deckY, floorY, stairCount, angle } = p;

  const group = new THREE.Group();
  group.name = "stairs_full";

  const stairWidth = 1.25;
  const tread = 0.55; // depth of each step
  const totalDrop = deckY - floorY;
  const rise = totalDrop / stairCount;

  // Where the stairs start (on rim)
  const startRad = R - 0.45;

  const stairMat = new THREE.MeshStandardMaterial({
    color: 0x22222b,
    roughness: 0.75,
    metalness: 0.05,
  });

  // Top plate (landing)
  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(stairWidth + 0.35, 0.12, 1.05),
    stairMat
  );
  placeOnRing(topPlate, startRad + 0.2, deckY - 0.06, angle);
  topPlate.rotation.y = -angle;
  topPlate.receiveShadow = true;
  group.add(topPlate);

  // Steps
  const steps = [];
  for (let i = 0; i < stairCount; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stairWidth, 0.12, tread),
      stairMat
    );

    // Move inward a bit each step so it "walks down into pit"
    const rad = startRad - (i + 0.35) * 0.42;
    const y = deckY - (i + 1) * rise;

    placeOnRing(step, rad, y, angle);
    step.rotation.y = -angle;
    step.castShadow = true;
    step.receiveShadow = true;

    group.add(step);
    steps.push(step);
  }

  // Bottom plate (landing) — at last step, touching floor region
  const bottomPlate = new THREE.Mesh(
    new THREE.BoxGeometry(stairWidth + 0.45, 0.12, 1.10),
    stairMat
  );
  const bottomRad = startRad - (stairCount + 0.35) * 0.42;
  placeOnRing(bottomPlate, bottomRad, floorY + 0.06, angle);
  bottomPlate.rotation.y = -angle;
  bottomPlate.receiveShadow = true;
  group.add(bottomPlate);

  // Rails (on OUTSIDE of stairs) — correct side, smooth-ish curve
  const rail = buildRail(THREE, {
    steps,
    topPlate,
    bottomPlate,
    widthOffset: (stairWidth / 2) + 0.22, // outside of stairs
    angle,
  });
  group.add(rail);

  return { group, topPlate, bottomPlate, steps };
}

function buildRail(THREE, p) {
  const { steps, topPlate, bottomPlate, widthOffset, angle } = p;
  const g = new THREE.Group();
  g.name = "stair_rail";

  // Poles
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x006b6b,
    emissiveIntensity: 0.8,
    roughness: 0.35,
    metalness: 0.5,
  });

  const poleGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 10);
  const points = [];

  // collect points along steps for smooth rail curve
  const nodes = [topPlate, ...steps, bottomPlate];
  for (let i = 0; i < nodes.length; i += 2) {
    const n = nodes[i];
    const pos = new THREE.Vector3();
    n.getWorldPosition(pos);

    // offset to outside side (local-right direction based on angle)
    const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
    pos.add(right.multiplyScalar(widthOffset));

    // pole position (mid)
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(pos.x, pos.y + 0.45, pos.z);
    g.add(pole);

    // rail curve point (top of pole)
    points.push(new THREE.Vector3(pos.x, pos.y + 0.9, pos.z));
  }

  // Smooth curve handrail
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, 0.03, 10, false),
    new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x007a7a,
      emissiveIntensity: 0.9,
      roughness: 0.25,
      metalness: 0.6,
    })
  );
  g.add(tube);

  return g;
}

function placeOnRing(mesh, radius, y, angle) {
  mesh.position.set(
    Math.cos(angle) * radius,
    y,
    Math.sin(angle) * radius
  );
}

function makeCarpetTexture(THREE) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const x = c.getContext("2d");

  // base
  x.fillStyle = "#3b2a52";
  x.fillRect(0, 0, c.width, c.height);

  // speckle + lines
  for (let i = 0; i < 9000; i++) {
    const px = (Math.random() * c.width) | 0;
    const py = (Math.random() * c.height) | 0;
    const a = Math.random() * 0.18;
    x.fillStyle = `rgba(255,255,255,${a})`;
    x.fillRect(px, py, 1, 1);
  }
  x.strokeStyle = "rgba(0,255,255,0.15)";
  x.lineWidth = 3;
  for (let r = 60; r < 520; r += 70) {
    x.beginPath();
    x.arc(256, 256, r, 0, Math.PI * 2);
    x.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 4;
  return tex;
}
