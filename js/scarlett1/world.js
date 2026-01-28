// /js/scarlett1/world.js
// Minimal world builder consistent with current conversation:
// - Shallow pit (not basement)
// - Carpeted pit floor
// - Pedestal with table + chairs
// - Light rail rim line (visual)

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export function buildWorld(scene) {
  const PIT_RADIUS = 10.0;

  // Ground void (subtle)
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(120, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0x050712, side: THREE.BackSide })
  );
  scene.add(sky);

  // Shallow pit floor (carpet)
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(PIT_RADIUS - 0.2, 64),
    new THREE.MeshStandardMaterial({ color: 0x6b4a7a, roughness: 0.95 })
  );
  pitFloor.rotation.x = -Math.PI / 2;
  pitFloor.position.y = -0.45; // ✅ shallow
  scene.add(pitFloor);

  // Pit wall ring (cylinder)
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(PIT_RADIUS, PIT_RADIUS, 1.0, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x101420, roughness: 0.95, side: THREE.DoubleSide })
  );
  wall.position.y = -0.05;
  scene.add(wall);

  // Rim floor (walkway ring)
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(PIT_RADIUS + 0.6, PIT_RADIUS + 6.8, 96),
    new THREE.MeshStandardMaterial({ color: 0x0e111a, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.0;
  scene.add(rim);

  // Neon rail line at rim edge (visual)
  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(PIT_RADIUS + 0.55, 0.045, 10, 200),
    new THREE.MeshStandardMaterial({ color: 0x2a7cff, emissive: 0x0b2a66, emissiveIntensity: 1.0, roughness: 0.4 })
  );
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 0.10;
  scene.add(rail);

  // Pedestal (table sits on this)
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.5, 0.8, 48),
    new THREE.MeshStandardMaterial({ color: 0x242a35, roughness: 0.95 })
  );
  pedestal.position.y = -0.10; // slightly sunk
  scene.add(pedestal);

  // Table
  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(2.05, 2.05, 0.12, 48),
    new THREE.MeshStandardMaterial({ color: 0x3a241f, roughness: 0.85 })
  );
  tableTop.position.y = 0.65;
  scene.add(tableTop);

  const tableStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.65, 0.70, 32),
    new THREE.MeshStandardMaterial({ color: 0x2a1c19, roughness: 0.9 })
  );
  tableStem.position.y = 0.28;
  scene.add(tableStem);

  // Chairs (simple)
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
    seat.position.y = 0.35;
    g.add(seat);

    const back = new THREE.Mesh(backGeo, chairMat);
    back.position.y = 0.70;
    back.position.z = -0.22;
    g.add(back);

    const legs = [
      [ 0.22, 0.10,  0.22],
      [-0.22, 0.10,  0.22],
      [ 0.22, 0.10, -0.22],
      [-0.22, 0.10, -0.22],
    ];
    for (const [x,y,z] of legs) {
      const leg = new THREE.Mesh(legGeo, chairMat);
      leg.position.set(x, y, z);
      g.add(leg);
    }

    // Put chairs on pedestal level
    g.position.y = -0.10; // align to pedestal top-ish
    scene.add(g);
  }

  // Small "sink" center marker (visual)
  const sink = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 0.10, 32),
    new THREE.MeshStandardMaterial({ color: 0x0c0f18, roughness: 0.9 })
  );
  sink.position.y = -0.25;
  scene.add(sink);
}
