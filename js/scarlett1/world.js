// /js/scarlett1/world.js
// Minimal "pit + stairs" world that is WALKABLE, SOLID, and provides teleport surfaces.
// You can keep expanding this file later without touching runtime.
export async function init(ctx){
  const { THREE, scene, walkSurfaces, teleportSurfaces, log } = ctx;

  // --- Floor ring (lobby) ---
  const lobby = new THREE.Mesh(
    new THREE.RingGeometry(7.0, 24.0, 96),
    new THREE.MeshStandardMaterial({ color: 0x5a2b8f, roughness: 0.92, metalness: 0.05 })
  );
  lobby.rotation.x = -Math.PI/2;
  lobby.position.y = 0;
  scene.add(lobby);

  // --- Pit floor ---
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(6.2, 72),
    new THREE.MeshStandardMaterial({ color: 0x1b1c22, roughness: 0.95, metalness: 0.02 })
  );
  pitFloor.rotation.x = -Math.PI/2;
  pitFloor.position.y = -1.6;
  scene.add(pitFloor);

  // Walk/teleport surfaces
  walkSurfaces.push(lobby, pitFloor);
  teleportSurfaces.push(lobby, pitFloor);

  // --- Pit wall cylinder (solid visual) ---
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(6.3, 6.3, 3.2, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.98, metalness: 0.0, side: THREE.DoubleSide })
  );
  wall.position.y = -0.0;
  scene.add(wall);

  // --- Trim (glow-ish) ---
  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(6.35, 0.08, 16, 128),
    new THREE.MeshStandardMaterial({ color: 0xff2aa6, emissive: 0xff2aa6, emissiveIntensity: 0.6, roughness: 0.5, metalness: 0.2 })
  );
  trim.rotation.x = Math.PI/2;
  trim.position.y = 0.02; // at top edge
  scene.add(trim);

  // --- Stairs (8 steps) to pit ---
  // Place stairs at +Z (front)
  const steps = 8;
  const stepW = 2.0;
  const stepH = 0.20;
  const stepD = 0.55;

  const stairGroup = new THREE.Group();
  stairGroup.position.set(0, 0, 6.3); // top edge
  stairGroup.rotation.y = 0; // face toward center

  const mat = new THREE.MeshStandardMaterial({ color: 0x22252b, roughness: 0.9, metalness: 0.05 });

  for (let i=0;i<steps;i++){
    const s = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), mat);
    // each step goes down and inward
    s.position.y = - (i+0.5) * stepH;
    s.position.z = - (i+0.5) * stepD;
    stairGroup.add(s);
    walkSurfaces.push(s);
    teleportSurfaces.push(s);
  }

  // Bottom plate (at pit floor)
  const bottomPlate = new THREE.Mesh(
    new THREE.BoxGeometry(stepW+0.2, 0.08, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.95, metalness: 0.02 })
  );
  bottomPlate.position.set(0, -1.6 + 0.04, 6.3 - steps*stepD - 0.8);
  scene.add(bottomPlate);
  walkSurfaces.push(bottomPlate);
  teleportSurfaces.push(bottomPlate);

  // Top plate (flush with lobby)
  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(stepW+0.2, 0.08, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.95, metalness: 0.02 })
  );
  topPlate.position.set(0, 0.04, 6.3 + 0.6);
  scene.add(topPlate);
  walkSurfaces.push(topPlate);
  teleportSurfaces.push(topPlate);

  scene.add(stairGroup);

  // --- Simple rails (one smooth curve each side) ---
  // (visual only for now; collision is handled by keeping pit wall + surfaces)
  const railMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.7 });
  function makeRail(side=1){
    const pts = [];
    for (let i=0;i<=steps;i++){
      const y = - (i) * stepH + 0.85;
      const z = - (i) * stepD - 0.1;
      pts.push(new THREE.Vector3(side*(stepW*0.6), y, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.04, 10, false),
      railMat
    );
    return tube;
  }
  const railL = makeRail(-1);
  const railR = makeRail( 1);
  stairGroup.add(railL, railR);

  // --- Center pedestal + table placeholder ---
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 2.0, 0.9, 48),
    new THREE.MeshStandardMaterial({ color: 0x0f0f14, roughness: 0.85, metalness: 0.08 })
  );
  pedestal.position.set(0, -1.6 + 0.45, 0);
  scene.add(pedestal);
  walkSurfaces.push(pedestal);
  teleportSurfaces.push(pedestal);

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.55, 0.12, 48),
    new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6, metalness: 0.15 })
  );
  tableTop.position.set(0, -1.6 + 0.95, 0);
  scene.add(tableTop);
  walkSurfaces.push(tableTop);
  teleportSurfaces.push(tableTop);

  log?.('WORLD: pit + stairs loaded');
}
