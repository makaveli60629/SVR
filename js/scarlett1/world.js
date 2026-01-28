// /js/scarlett1/world.js — FULL WORLD
// Deep pit + big pedestal floor with carpet cap + table + 8 chairs + 4 stairs

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let WORLD_GROUP;

export function buildWorld(scene) {
  if (WORLD_GROUP) {
    scene.add(WORLD_GROUP);
    return WORLD_GROUP;
  }

  WORLD_GROUP = new THREE.Group();
  WORLD_GROUP.name = "SCARLETT_WORLD";

  // ---------- PIT ----------
  const pitRadius = 10.0;
  const pitDepth = 12.0;

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius, pitRadius, pitDepth, 128, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x151a26, roughness: 0.9 })
  );
  pitWall.position.y = -pitDepth / 2;
  WORLD_GROUP.add(pitWall);

  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(pitRadius - 0.7, 128),
    new THREE.MeshStandardMaterial({ color: 0x04050a, roughness: 1.0 })
  );
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = -pitDepth + 0.05;
  WORLD_GROUP.add(pitBottom);

  const rimRail = new THREE.Mesh(
    new THREE.TorusGeometry(pitRadius - 0.12, 0.06, 10, 160),
    new THREE.MeshStandardMaterial({
      color: 0x2a7cff,
      roughness: 0.4,
      metalness: 0.25,
      emissive: 0x0b2a66,
      emissiveIntensity: 1.1,
    })
  );
  rimRail.rotation.x = Math.PI / 2;
  rimRail.position.y = 0.03;
  WORLD_GROUP.add(rimRail);

  // ---------- PEDESTAL = FLOOR ----------
  // Must cover chair ring fully.
  const pedestalRadius = 4.6;
  const pedestalHeight = 1.8;

  // pedestal top surface sits at y=0
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(pedestalRadius, pedestalRadius, pedestalHeight, 96),
    new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.8, metalness: 0.1 })
  );
  pedestal.position.y = -pedestalHeight / 2;
  WORLD_GROUP.add(pedestal);

  // Carpet cap on top surface
  const carpet = new THREE.Mesh(
    new THREE.CircleGeometry(pedestalRadius - 0.05, 128),
    new THREE.MeshStandardMaterial({
      map: makeCarpetTexture(),
      roughness: 1.0,
      metalness: 0.0,
      emissive: 0x05020a,
      emissiveIntensity: 0.25,
    })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.y = 0.01;
  WORLD_GROUP.add(carpet);

  // ---------- TABLE ----------
  const tableRadius = 1.6;

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(tableRadius, tableRadius, 0.12, 96),
    new THREE.MeshStandardMaterial({ color: 0x0f4a2f, roughness: 0.95 })
  );
  tableTop.position.y = 0.92;
  WORLD_GROUP.add(tableTop);

  const tableEdge = new THREE.Mesh(
    new THREE.CylinderGeometry(tableRadius + 0.12, tableRadius + 0.12, 0.14, 96),
    new THREE.MeshStandardMaterial({ color: 0x2b1b10, roughness: 0.75 })
  );
  tableEdge.position.y = tableTop.position.y;
  WORLD_GROUP.add(tableEdge);

  const tableBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.65, 0.85, 48),
    new THREE.MeshStandardMaterial({ color: 0x2b1b10, roughness: 0.75 })
  );
  tableBase.position.y = 0.45;
  WORLD_GROUP.add(tableBase);

  // ---------- CHAIRS (legs start at y=0 floor line) ----------
  const chairRingRadius = 3.15;

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const chair = makeChair();

    chair.position.set(
      Math.cos(a) * chairRingRadius,
      0.0,
      Math.sin(a) * chairRingRadius
    );
    chair.rotation.y = -a + Math.PI;
    WORLD_GROUP.add(chair);
  }

  // ---------- STAIRS (4 sides) ----------
  const stairsCount = 4;
  const stairRun = 3.8;
  const stairSteps = 7;
  const stairsWidth = 2.4;

  for (let i = 0; i < stairsCount; i++) {
    const angle = (i / stairsCount) * Math.PI * 2;
    const stairGroup = new THREE.Group();

    for (let s = 0; s < stairSteps; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(stairsWidth, 0.24, stairRun / stairSteps),
        new THREE.MeshStandardMaterial({ color: 0x1c2233, roughness: 0.95 })
      );
      step.position.y = s * 0.24 + 0.12;
      step.position.z = -s * (stairRun / stairSteps) - (stairRun / stairSteps) / 2;
      stairGroup.add(step);
    }

    const edgeR = pitRadius - 0.35;
    stairGroup.position.set(Math.cos(angle) * edgeR, 0.02, Math.sin(angle) * edgeR);
    stairGroup.rotation.y = -angle;
    WORLD_GROUP.add(stairGroup);
  }

  scene.add(WORLD_GROUP);
  return WORLD_GROUP;
}

// ---------- Helpers ----------
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

  // Bottom touches y=0
  for (const [x, z] of legs) {
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.set(x, 0.225, z);
    g.add(leg);
  }

  return g;
}

function makeCarpetTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#2a0f22";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 28000; i++) {
    const x = (Math.random() * size) | 0;
    const y = (Math.random() * size) | 0;
    const v = 30 + ((Math.random() * 70) | 0);
    ctx.fillStyle = `rgba(${v},${(v * 0.45) | 0},${(v * 0.75) | 0},0.10)`;
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#3b1a33";
  ctx.lineWidth = 2;
  const step = 32;

  for (let x = 0; x <= size; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
  }
  for (let y = 0; y <= size; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.needsUpdate = true;
  return tex;
      }
