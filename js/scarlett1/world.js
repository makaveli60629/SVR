// /js/scarlett1/world.js
// SCARLETT ONE — PHASE 4 WORLD (FULL)
// PIT (DEEP) + CARPET FLOOR + CENTER PEDESTAL + TABLE + 8 CHAIRS + 4 STAIRS
// Designed to avoid “chairs buried in dirt” by deepening pit + raising platform set.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let WORLD_GROUP;

export function buildWorld(scene) {
  if (WORLD_GROUP) {
    scene.add(WORLD_GROUP);
    return WORLD_GROUP;
  }

  WORLD_GROUP = new THREE.Group();
  WORLD_GROUP.name = "SCARLETT_WORLD";

  // ---------------- LIGHTS (FAILSAFE) ----------------
  if (!scene.getObjectByName("WORLD_LIGHTS")) {
    const lights = new THREE.Group();
    lights.name = "WORLD_LIGHTS";

    const hemi = new THREE.HemisphereLight(0xffffff, 0x1d2440, 0.95);
    lights.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(10, 14, 8);
    lights.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(-10, 8, -8);
    lights.add(fill);

    const rim = new THREE.PointLight(0x2a7cff, 0.9, 60);
    rim.position.set(0, 2.4, 0);
    lights.add(rim);

    scene.add(lights);
  }

  // ---------------- CONFIG ----------------
  const pitRadius = 9.5;

  // Make pit DEEP so it reads as a real cylinder dug out.
  // This fixes the “pit is filled halfway / chairs buried” look.
  const pitDepth = 10.5;

  // Raise platform set so chairs + table sit safely above rim.
  const platformLift = 0.75; // global lift applied to pedestal/table/chairs

  // ---------------- FLOOR (CARPET) ----------------
  const carpetTex = makeCarpetTexture();
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(22, 96),
    new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 1.0,
      metalness: 0.0,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0; // ground reference
  floor.name = "CARPET_FLOOR";
  WORLD_GROUP.add(floor);

  // ---------------- PIT (WALL) ----------------
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius, pitRadius, pitDepth, 128, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x151a26,
      roughness: 0.9,
      metalness: 0.05,
    })
  );
  pitWall.position.y = -pitDepth / 2;
  pitWall.name = "PIT_WALL";
  WORLD_GROUP.add(pitWall);

  // Inner “dark liner” to amplify sink illusion
  const pitInner = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius - 0.55, pitRadius - 0.55, pitDepth * 0.995, 128, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x07090f,
      roughness: 1.0,
      metalness: 0.0,
    })
  );
  pitInner.position.y = -pitDepth / 2 - 0.02;
  pitInner.name = "PIT_INNER";
  WORLD_GROUP.add(pitInner);

  // Pit bottom cap (very dark)
  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(pitRadius - 0.65, 128),
    new THREE.MeshStandardMaterial({ color: 0x04050a, roughness: 1.0 })
  );
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = -pitDepth + 0.05;
  pitBottom.name = "PIT_BOTTOM";
  WORLD_GROUP.add(pitBottom);

  // Rim rail glow
  const rimRail = new THREE.Mesh(
    new THREE.TorusGeometry(pitRadius - 0.12, 0.06, 10, 160),
    new THREE.MeshStandardMaterial({
      color: 0x2a7cff,
      roughness: 0.4,
      metalness: 0.25,
      emissive: 0x0b2a66,
      emissiveIntensity: 1.15,
    })
  );
  rimRail.rotation.x = Math.PI / 2;
  rimRail.position.y = 0.03;
  rimRail.name = "RIM_RAIL";
  WORLD_GROUP.add(rimRail);

  // Depth rings (visual cue that it goes DOWN)
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry((pitRadius - 0.9) * (1 - t * 0.22), 0.02, 8, 120),
      new THREE.MeshStandardMaterial({
        color: 0x132040,
        roughness: 0.95,
        metalness: 0.05,
        emissive: 0x0b1a33,
        emissiveIntensity: 0.45,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -pitDepth * t;
    ring.name = `DEPTH_RING_${i}`;
    WORLD_GROUP.add(ring);
  }

  // ---------------- PEDESTAL (CENTER) ----------------
  const pedestalHeight = 1.6;
  const pedestalRadius = 3.0;

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(pedestalRadius, pedestalRadius, pedestalHeight, 80),
    new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.75, metalness: 0.15 })
  );
  pedestal.position.y = pedestalHeight / 2 + platformLift;
  pedestal.name = "PEDESTAL";
  WORLD_GROUP.add(pedestal);

  // Pedestal top lip (glow)
  const pedestalLip = new THREE.Mesh(
    new THREE.TorusGeometry(pedestalRadius, 0.08, 10, 120),
    new THREE.MeshStandardMaterial({
      color: 0x2a7cff,
      roughness: 0.45,
      metalness: 0.25,
      emissive: 0x0b2a66,
      emissiveIntensity: 1.0,
    })
  );
  pedestalLip.rotation.x = Math.PI / 2;
  pedestalLip.position.y = pedestalHeight + platformLift + 0.02;
  pedestalLip.name = "PEDESTAL_LIP";
  WORLD_GROUP.add(pedestalLip);

  // ---------------- TABLE ----------------
  const tableRadius = 1.6;

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(tableRadius, tableRadius, 0.12, 90),
    new THREE.MeshStandardMaterial({ color: 0x0f4a2f, roughness: 0.95 })
  );
  tableTop.position.y = pedestalHeight + platformLift + 0.95;
  tableTop.name = "TABLE_TOP";
  WORLD_GROUP.add(tableTop);

  const tableEdge = new THREE.Mesh(
    new THREE.CylinderGeometry(tableRadius + 0.12, tableRadius + 0.12, 0.14, 90),
    new THREE.MeshStandardMaterial({ color: 0x2b1b10, roughness: 0.75 })
  );
  tableEdge.position.y = tableTop.position.y;
  tableEdge.name = "TABLE_EDGE";
  WORLD_GROUP.add(tableEdge);

  const tableBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.65, 0.85, 40),
    new THREE.MeshStandardMaterial({ color: 0x2b1b10, roughness: 0.75 })
  );
  tableBase.position.y = pedestalHeight + platformLift + 0.55;
  tableBase.name = "TABLE_BASE";
  WORLD_GROUP.add(tableBase);

  // ---------------- CHAIRS (8) ----------------
  const chairRingRadius = 2.75;

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;

    const chair = makeChair();
    chair.position.set(
      Math.cos(a) * chairRingRadius,
      pedestalHeight + platformLift + 0.35,
      Math.sin(a) * chairRingRadius
    );
    chair.rotation.y = -a + Math.PI;
    chair.name = `CHAIR_${i}`;
    WORLD_GROUP.add(chair);
  }

  // ---------------- STAIRS (4 SIDES) ----------------
  // These are simple “ramps” made of steps. Later we can animate in/out.
  const stairsCount = 4;
  const stairRun = 3.6;
  const stairSteps = 7;
  const stairsWidth = 2.4;

  for (let i = 0; i < stairsCount; i++) {
    const angle = (i / stairsCount) * Math.PI * 2;
    const stairGroup = new THREE.Group();
    stairGroup.name = `STAIRS_${i}`;

    for (let s = 0; s < stairSteps; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(stairsWidth, 0.24, stairRun / stairSteps),
        new THREE.MeshStandardMaterial({ color: 0x1c2233, roughness: 0.95 })
      );
      step.position.y = s * 0.24 + 0.12; // build upward
      step.position.z = -s * (stairRun / stairSteps) - (stairRun / stairSteps) / 2;
      stairGroup.add(step);
    }

    const edgeR = pitRadius - 0.28;
    stairGroup.position.set(Math.cos(angle) * edgeR, 0.02, Math.sin(angle) * edgeR);
    stairGroup.rotation.y = -angle;
    WORLD_GROUP.add(stairGroup);
  }

  scene.add(WORLD_GROUP);
  return WORLD_GROUP;
}

// ---------------- HELPERS ----------------

function makeChair() {
  const g = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x303645,
    roughness: 0.85,
    metalness: 0.1,
  });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.10, 0.58), mat);
  seat.position.y = 0.45;
  g.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.55, 0.10), mat);
  back.position.set(0, 0.76, -0.24);
  g.add(back);

  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 10);
  const legs = [
    [0.24, 0.24],
    [-0.24, 0.24],
    [0.24, -0.24],
    [-0.24, -0.24],
  ];
  for (const [x, z] of legs) {
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.set(x, 0.22, z);
    g.add(leg);
  }

  return g;
}

// Procedural carpet so you don’t need external textures
function makeCarpetTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  // base
  ctx.fillStyle = "#1a0f18";
  ctx.fillRect(0, 0, size, size);

  // noise specks
  for (let i = 0; i < 26000; i++) {
    const x = (Math.random() * size) | 0;
    const y = (Math.random() * size) | 0;
    const v = 20 + ((Math.random() * 60) | 0);
    ctx.fillStyle = `rgba(${v},${(v * 0.6) | 0},${(v * 0.9) | 0},0.08)`;
    ctx.fillRect(x, y, 1, 1);
  }

  // weave lines
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#2a1a2a";
  ctx.lineWidth = 2;
  const step = 32;
  for (let x = 0; x <= size; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // vignette
  ctx.globalAlpha = 0.6;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 60, size / 2, size / 2, size / 1.1);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
                              }
