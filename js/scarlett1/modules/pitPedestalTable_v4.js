
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { makeCasinoFloorTexture } from './floorTexture.js';

/**
 * pitPedestalTable_v4.js — UNCOVERS THE PIT
 * Fix: floor is now a RING (hole in the center), so it cannot cover the pit opening.
 *
 * Recommended:
 *   const pit = addPitPedestalTableV4(scene, { pitDepth: 14.0 });
 */
export function addPitPedestalTableV4(scene, opts = {}) {
  const pitDepth = Math.max(4.0, opts.pitDepth ?? 14.0);
  const pitRadius = opts.pitRadius ?? 6.6;
  const floorRadius = opts.floorRadius ?? 18.0;
  const rimThickness = opts.rimThickness ?? 0.18;

  const group = new THREE.Group();
  scene.add(group);

  // ---- FLOOR RING (HOLE IN CENTER) ----
  const floorTex = makeCasinoFloorTexture();
  const ringGeo = new THREE.RingGeometry(pitRadius + 0.05, floorRadius, 192, 1);
  // Rotate to lie flat
  ringGeo.rotateX(-Math.PI / 2);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    color: 0xffffff,
    roughness: 0.95,
    side: THREE.DoubleSide
  });

  const floorRing = new THREE.Mesh(ringGeo, floorMat);
  floorRing.position.y = -0.10;
  floorRing.receiveShadow = true;
  group.add(floorRing);

  // Optional: outer skirt to give the ring thickness impression (cheap)
  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(floorRadius, floorRadius, 0.22, 144, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 1.0, side: THREE.DoubleSide })
  );
  skirt.position.y = -0.21;
  group.add(skirt);

  // ---- PIT WALL (DEEP) ----
  const pitHeight = pitDepth + 1.2;
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius, pitRadius, pitHeight, 192, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0e0e14, side: THREE.DoubleSide, roughness: 1.0 })
  );
  pitWall.position.y = -0.18 - pitHeight / 2; // top lip near floor
  group.add(pitWall);

  // Pit floor at bottom
  const pitFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius, pitRadius, 0.25, 160),
    new THREE.MeshStandardMaterial({ color: 0x040409, roughness: 1.0 })
  );
  pitFloor.position.y = -0.18 - pitHeight + 0.14;
  group.add(pitFloor);

  // Rim glow ring
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(pitRadius + 0.06, rimThickness, 18, 220),
    new THREE.MeshStandardMaterial({
      color: 0x0b2b6f,
      emissive: 0x0b2b6f,
      emissiveIntensity: 2.2,
      roughness: 0.6
    })
  );
  rim.position.y = -0.04;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // ---- PEDESTAL + TABLE ----
  const pedestalHeight = 2.8;
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.75, pedestalHeight, 84),
    new THREE.MeshStandardMaterial({ color: 0x2a2a33, roughness: 0.75, metalness: 0.1 })
  );
  pedestal.position.y = -0.18 - (pedestalHeight/2) - 0.75;
  group.add(pedestal);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.05, 2.05, 0.24, 84),
    new THREE.MeshStandardMaterial({ color: 0x0a6b33, roughness: 0.95 })
  );
  table.position.y = pedestal.position.y + pedestalHeight/2 + 0.2;
  group.add(table);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(2.12, 0.13, 18, 160),
    new THREE.MeshStandardMaterial({ color: 0x1a0f0a, roughness: 0.85 })
  );
  rail.position.y = table.position.y + 0.10;
  rail.rotation.x = Math.PI/2;
  group.add(rail);

  // Divots (6)
  const divotMat = new THREE.MeshStandardMaterial({ color: 0x064a24, roughness: 1.0 });
  const dR = 1.45;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const divot = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 36), divotMat);
    divot.position.set(Math.cos(a)*dR, table.position.y + 0.012, Math.sin(a)*dR);
    group.add(divot);
  }

  return {
    group, floorRing, skirt,
    pitWall, pitFloor, rim,
    pedestal, table, rail,
    pitDepth, pitRadius
  };
}
