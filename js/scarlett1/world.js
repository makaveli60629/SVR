// /js/scarlett1/world.js
// SCARLETT ONE — PHASE 4 WORLD
// PIT + PEDESTAL + TABLE + CHAIRS + STAIRS
// PERMANENT WORLD GEOMETRY

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let WORLD_GROUP;

export function buildWorld(scene) {
  if (WORLD_GROUP) {
    scene.add(WORLD_GROUP);
    return WORLD_GROUP;
  }

  WORLD_GROUP = new THREE.Group();
  WORLD_GROUP.name = "SCARLETT_WORLD";

  // ---------------- LIGHTS (failsafe) ----------------
  if (!scene.getObjectByName("WORLD_LIGHTS")) {
    const lights = new THREE.Group();
    lights.name = "WORLD_LIGHTS";

    lights.add(new THREE.HemisphereLight(0xffffff, 0x222244, 0.9));

    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(8, 12, 6);
    lights.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-8, 6, -6);
    lights.add(fill);

    scene.add(lights);
  }

  // ---------------- FLOOR ----------------
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(18, 96),
    new THREE.MeshStandardMaterial({
      color: 0x0f1420,
      roughness: 0.95
    })
  );
  floor.rotation.x = -Math.PI / 2;
  WORLD_GROUP.add(floor);

  // ---------------- PIT ----------------
  const pitDepth = 5.5;
  const pitRadius = 9.5;

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius, pitRadius, pitDepth, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x151a26 })
  );
  pitWall.position.y = -pitDepth / 2;
  WORLD_GROUP.add(pitWall);

  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(pitRadius - 0.5, 96),
    new THREE.MeshStandardMaterial({ color: 0x05070d })
  );
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = -pitDepth + 0.05;
  WORLD_GROUP.add(pitBottom);

  // ---------------- PEDESTAL ----------------
  const pedestalHeight = 1.2;
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3, pedestalHeight, 64),
    new THREE.MeshStandardMaterial({ color: 0x2a2f3a })
  );
  pedestal.position.y = pedestalHeight / 2;
  WORLD_GROUP.add(pedestal);

  // ---------------- TABLE ----------------
  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.12, 64),
    new THREE.MeshStandardMaterial({ color: 0x0f4a2f })
  );
  tableTop.position.y = pedestalHeight + 0.85;
  WORLD_GROUP.add(tableTop);

  const tableBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.6, 0.8, 32),
    new THREE.MeshStandardMaterial({ color: 0x2b1b10 })
  );
  tableBase.position.y = pedestalHeight + 0.45;
  WORLD_GROUP.add(tableBase);

  // ---------------- CHAIRS ----------------
  const chairRadius = 2.7;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;

    const chair = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.45, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x303645 })
    );

    chair.position.set(
      Math.cos(a) * chairRadius,
      pedestalHeight + 0.25,
      Math.sin(a) * chairRadius
    );
    chair.rotation.y = -a + Math.PI;
    WORLD_GROUP.add(chair);
  }

  // ---------------- STAIRS (4 SIDES) ----------------
  const stairRun = 3.2;
  const stairSteps = 6;

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const stairGroup = new THREE.Group();

    for (let s = 0; s < stairSteps; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.25, stairRun / stairSteps),
        new THREE.MeshStandardMaterial({ color: 0x1c2233 })
      );
      step.position.y = s * 0.25;
      step.position.z = -s * (stairRun / stairSteps);
      stairGroup.add(step);
    }

    stairGroup.position.set(
      Math.cos(angle) * (pitRadius - 0.3),
      0,
      Math.sin(angle) * (pitRadius - 0.3)
    );
    stairGroup.rotation.y = -angle;

    WORLD_GROUP.add(stairGroup);
  }

  scene.add(WORLD_GROUP);
  return WORLD_GROUP;
}
