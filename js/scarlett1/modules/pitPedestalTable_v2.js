
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { makeCasinoFloorTexture } from './floorTexture.js';

/**
 * pitPedestalTable_v2.js — deeper pit + textured floors
 * Default pitDepth is much deeper than your prior -1.6.
 */
export function addPitPedestalTableV2(scene, opts = {}) {
  const pitDepth = Math.max(2.5, opts.pitDepth ?? 6.5); // meters down
  const pitRadius = opts.pitRadius ?? 6.4;
  const floorRadius = opts.floorRadius ?? 16;

  const group = new THREE.Group();
  scene.add(group);

  // Textured floor (top level)
  const floorTex = makeCasinoFloorTexture();
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(floorRadius, floorRadius, 0.25, 128),
    new THREE.MeshStandardMaterial({ map: floorTex, color: 0xffffff, roughness: 0.95 })
  );
  ground.position.y = -0.12;
  group.add(ground);

  // Pit wall: tall cylinder, open top, goes down
  const pitHeight = pitDepth + 1.0;
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius, pitRadius, pitHeight, 128, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0f0f16, side: THREE.DoubleSide, roughness: 1.0 })
  );
  // Center so top lip is near y=-0.2
  pitWall.position.y = -0.2 - pitHeight/2;
  group.add(pitWall);

  // Pit floor disk (bottom)
  const pitFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius, pitRadius, 0.2, 128),
    new THREE.MeshStandardMaterial({ color: 0x05050a, roughness: 1.0 })
  );
  pitFloor.position.y = -0.2 - pitHeight + 0.1;
  group.add(pitFloor);

  // Rim ring (reads like a hole)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(pitRadius+0.05, 0.12, 18, 160),
    new THREE.MeshStandardMaterial({ color: 0x0b2b6f, emissive: 0x0b2b6f, emissiveIntensity: 1.8, roughness: 0.6 })
  );
  rim.position.y = -0.05;
  rim.rotation.x = Math.PI/2;
  group.add(rim);

  // Pedestal: sunk, but visible above floor
  const pedestalHeight = 2.2;
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.55, pedestalHeight, 72),
    new THREE.MeshStandardMaterial({ color: 0x2a2a33, roughness: 0.75, metalness: 0.1 })
  );
  pedestal.position.y = -0.2 - (pedestalHeight/2) - 0.55;
  group.add(pedestal);

  // Table top + rail on top of pedestal
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(1.95, 1.95, 0.22, 72),
    new THREE.MeshStandardMaterial({ color: 0x0a6b33, roughness: 0.95 })
  );
  table.position.y = pedestal.position.y + pedestalHeight/2 + 0.18;
  group.add(table);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(2.02, 0.12, 18, 128),
    new THREE.MeshStandardMaterial({ color: 0x1a0f0a, roughness: 0.85 })
  );
  rail.position.y = table.position.y + 0.09;
  rail.rotation.x = Math.PI / 2;
  group.add(rail);

  // Divots (6 spots)
  const divotMat = new THREE.MeshStandardMaterial({ color: 0x064a24, roughness: 1.0 });
  const radius = 1.35;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const divot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 32), divotMat);
    divot.position.set(Math.cos(a) * radius, table.position.y + 0.01, Math.sin(a) * radius);
    group.add(divot);
  }

  return { group, ground, pitWall, pitFloor, rim, pedestal, table, rail };
}
