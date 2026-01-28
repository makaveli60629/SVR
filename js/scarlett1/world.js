// /js/scarlett1/world.js
// SCARLETT1 • LOBBY + DIVOT PIT (PERMANENT)
// Requirement:
// - Same lobby space (NOT a separate room)
// - Standing on lobby floor looking DOWN into a shallow divot pit
// - Carpet in pit, pedestal + table + chairs in center
// - Stairs leading down into pit

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export function buildWorld(scene) {
  const PIT_RADIUS = 10.0;

  // Sky / room darkness (soft)
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(140, 28, 20),
    new THREE.MeshBasicMaterial({ color: 0x050712, side: THREE.BackSide })
  );
  scene.add(sky);

  // LOBBY FLOOR (big circle) at y=0 (this is where the player stands)
  const lobbyFloor = new THREE.Mesh(
    new THREE.CircleGeometry(PIT_RADIUS + 12, 96),
    new THREE.MeshStandardMaterial({ color: 0x0c0f18, roughness: 0.98 })
  );
  lobbyFloor.rotation.x = -Math.PI / 2;
  lobbyFloor.position.y = 0.0;
  scene.add(lobbyFloor);

  // DIVOT PIT DEPTH (shallow, just a couple steps down)
  const PIT_FLOOR_Y = -0.90;

  // Pit floor (carpet)
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(PIT_RADIUS - 0.25, 80),
    new THREE.MeshStandardMaterial({ color: 0x6b4a7a, roughness: 0.97 })
  );
  pitFloor.rotation.x = -Math.PI / 2;
  pitFloor.position.y = PIT_FLOOR_Y;
  scene.add(pitFloor);

  // Pit wall (cylinder) connecting lobby to pit floor
  const wallH = Math.abs(PIT_FLOOR_Y) + 0.02;
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(PIT_RADIUS, PIT_RADIUS, wallH, 80, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x111524, roughness: 0.95, side: THREE.DoubleSide })
  );
  pitWall.position.y = PIT_FLOOR_Y/2;
  scene.add(pitWall);

  // Rim highlight ring at pit edge
  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(PIT_RADIUS, 0.08, 14, 260),
    new THREE.MeshStandardMaterial({ color: 0x2a7cff, emissive: 0x0b2a66, emissiveIntensity: 1.0, roughness: 0.4 })
  );
  edge.rotation.x = Math.PI / 2;
  edge.position.y = 0.06;
  scene.add(edge);

  // Pedestal in the pit center
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.3, 2.6, 0.65, 56),
    new THREE.MeshStandardMaterial({ color: 0x242a35, roughness: 0.95 })
  );
  pedestal.position.y = PIT_FLOOR_Y + 0.35; // base sits on carpet, top slightly below lobby
  scene.add(pedestal);

  // Table
  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(2.05, 2.05, 0.12, 56),
    new THREE.MeshStandardMaterial({ color: 0x3a241f, roughness: 0.85 })
  );
  tableTop.position.y = PIT_FLOOR_Y + 0.98;
  scene.add(tableTop);

  const tableStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.65, 0.75, 40),
    new THREE.MeshStandardMaterial({ color: 0x2a1c19, roughness: 0.9 })
  );
  tableStem.position.y = PIT_FLOOR_Y + 0.60;
  scene.add(tableStem);

  // Chairs around table
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.95 });
  const seatGeo = new THREE.BoxGeometry(0.55, 0.10, 0.55);
  const backGeo = new THREE.BoxGeometry(0.55, 0.60, 0.10);
  const legGeo = new THREE.BoxGeometry(0.08, 0.50, 0.08);

  const chairRadius = 3.0;
  const chairs = 8;
  for (let i = 0; i < chairs; i++) {
    const a = (i / chairs) * Math.PI * 2;
    const g = new THREE.Group();
    g.position.set(Math.cos(a) * chairRadius, 0, Math.sin(a) * chairRadius);
    g.rotation.y = -a + Math.PI;

    const seat = new THREE.Mesh(seatGeo, chairMat);
    seat.position.y = PIT_FLOOR_Y + 0.55;
    g.add(seat);

    const back = new THREE.Mesh(backGeo, chairMat);
    back.position.y = PIT_FLOOR_Y + 0.90;
    back.position.z = -0.22;
    g.add(back);

    const legs = [
      [ 0.22, PIT_FLOOR_Y + 0.30,  0.22],
      [-0.22, PIT_FLOOR_Y + 0.30,  0.22],
      [ 0.22, PIT_FLOOR_Y + 0.30, -0.22],
      [-0.22, PIT_FLOOR_Y + 0.30, -0.22],
    ];
    for (const [x,y,z] of legs) {
      const leg = new THREE.Mesh(legGeo, chairMat);
      leg.position.set(x, y, z);
      g.add(leg);
    }
    scene.add(g);
  }

  // 4 stairways down into the pit (static, cardinal directions)
  const stairMat = new THREE.MeshStandardMaterial({ color: 0x1c2233, roughness: 0.97 });
  const stairsCount = 4;
  const steps = 6;
  const width = 2.2;
  const depth = 0.55;
  const stepH = Math.abs(PIT_FLOOR_Y) / steps;

  for (let i = 0; i < stairsCount; i++) {
    const angle = (i / stairsCount) * Math.PI * 2;
    const baseR = PIT_RADIUS - 0.6;
    const g = new THREE.Group();
    g.position.set(Math.cos(angle) * baseR, 0, Math.sin(angle) * baseR);
    g.rotation.y = -angle;

    for (let s = 0; s < steps; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.18, depth),
        stairMat
      );
      step.position.y = -s * stepH + 0.09;
      step.position.z = -s * depth - 0.25;
      g.add(step);
    }
    scene.add(g);
  }

  // Small center "sink" marker
  const sink = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 0.10, 40),
    new THREE.MeshStandardMaterial({ color: 0x0c0f18, roughness: 0.92 })
  );
  sink.position.y = PIT_FLOOR_Y + 0.20;
  scene.add(sink);
}
