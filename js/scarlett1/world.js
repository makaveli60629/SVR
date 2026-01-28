import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/**
 * Single-room: Circular Lobby + Shallow Pit Divot (hawk view from lobby).
 */
export function buildWorld(scene){
  const PIT_RADIUS = 8;
  const PIT_Y = -0.85; // shallow divot

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(140, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x050711, side: THREE.BackSide })
  );
  scene.add(sky);

  const lobby = new THREE.Mesh(
    new THREE.CircleGeometry(PIT_RADIUS + 14, 96),
    new THREE.MeshStandardMaterial({ color: 0x0c0f18, roughness: 0.98 })
  );
  lobby.rotation.x = -Math.PI/2;
  lobby.position.y = 0;
  scene.add(lobby);

  const pit = new THREE.Mesh(
    new THREE.CircleGeometry(PIT_RADIUS - 0.2, 64),
    new THREE.MeshStandardMaterial({ color: 0x6b4a7a, roughness: 0.95 })
  );
  pit.rotation.x = -Math.PI/2;
  pit.position.y = PIT_Y;
  scene.add(pit);

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(PIT_RADIUS, PIT_RADIUS, Math.abs(PIT_Y), 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x111524, side: THREE.DoubleSide, roughness: 0.9 })
  );
  wall.position.y = PIT_Y/2;
  scene.add(wall);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(PIT_RADIUS, 0.09, 14, 260, Math.PI*1.6),
    new THREE.MeshStandardMaterial({ color: 0x2a7cff, emissive: 0x0b2a66, emissiveIntensity: 0.8, roughness: 0.3 })
  );
  rail.rotation.x = Math.PI/2;
  rail.position.y = 0.12;
  scene.add(rail);

  for (let i=0;i<12;i++){
    const a = (i/12)*Math.PI*2;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 4.4, 18),
      new THREE.MeshStandardMaterial({ color: 0x1b2238, roughness: 0.8 })
    );
    pillar.position.set(Math.cos(a)*(PIT_RADIUS+10), 2.2, Math.sin(a)*(PIT_RADIUS+10));
    scene.add(pillar);
  }

  for (let i=0;i<4;i++){
    const a = (i/4)*Math.PI*2;
    const j = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x10132a, emissive: 0x1b2cff, emissiveIntensity: 0.35 })
    );
    j.position.set(Math.cos(a)*(PIT_RADIUS+7.2), 3.0, Math.sin(a)*(PIT_RADIUS+7.2));
    j.lookAt(0, 2.2, 0);
    scene.add(j);
  }

  const stairs = new THREE.Group();
  for (let i=0;i<7;i++){
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.18, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x1c2233, roughness: 0.8 })
    );
    step.position.y = 0.09 - i*(Math.abs(PIT_Y)/7);
    step.position.z = -i*0.62;
    stairs.add(step);
  }
  stairs.position.set(PIT_RADIUS-0.6, 0, 0);
  stairs.rotation.y = -Math.PI/2;
  scene.add(stairs);

  const guard = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 1.2, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a2f3a, emissive: 0x0b2a66, emissiveIntensity: 0.18 })
  );
  guard.position.set(PIT_RADIUS+0.9, 0.65, 0);
  scene.add(guard);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.2, 0.9, 18),
    new THREE.MeshStandardMaterial({ color: 0x2a1d18, roughness: 0.85 })
  );
  pedestal.position.y = PIT_Y + 0.45;
  scene.add(pedestal);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.3, 2.3, 0.16, 48),
    new THREE.MeshStandardMaterial({ color: 0x3a241f, roughness: 0.7 })
  );
  table.position.y = PIT_Y + 0.95;
  scene.add(table);

  const chair = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.9, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.9 })
  );
  chair.position.set(0, PIT_Y + 0.45, 3.0);
  scene.add(chair);

  for (let i=0;i<5;i++){
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.02, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
    );
    card.position.set(Math.cos(i)*0.9, PIT_Y + 1.1, Math.sin(i)*0.9);
    scene.add(card);
  }
}
