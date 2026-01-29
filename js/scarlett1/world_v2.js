import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export async function init(ctx) {
  const { scene } = ctx;

  // Lighting
  scene.add(new THREE.AmbientLight(0x552266, 0.7));
  const key = new THREE.PointLight(0xaa66ff, 1.6, 180);
  key.position.set(0, 22, 0);
  scene.add(key);
  const rim = new THREE.PointLight(0x3355ff, 0.8, 180);
  rim.position.set(20, 10, 20);
  scene.add(rim);

  // Big circular lobby floor
  const lobbyFloor = new THREE.Mesh(
    new THREE.CircleGeometry(80, 64),
    new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.95 })
  );
  lobbyFloor.rotation.x = -Math.PI / 2;
  lobbyFloor.name = "lobbyFloor";
  scene.add(lobbyFloor);

  // Ring "observation deck" visual (non-blocking)
  const deckRing = new THREE.Mesh(
    new THREE.RingGeometry(14, 80, 96),
    new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.95, side: THREE.DoubleSide })
  );
  deckRing.rotation.x = -Math.PI / 2;
  deckRing.position.y = 0.02;
  deckRing.name = "upperDeckRing";
  scene.add(deckRing);

  // Pit floor (deeper)
  const pitY = -3.2;
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 96),
    new THREE.MeshStandardMaterial({ color: 0x07070a, roughness: 0.9 })
  );
  pitFloor.rotation.x = -Math.PI / 2;
  pitFloor.position.y = pitY;
  pitFloor.name = "pitFloor";
  scene.add(pitFloor);

  // Pit wall
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(14, 14, 3.2, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.9, side: THREE.DoubleSide })
  );
  pitWall.position.y = pitY / 2;
  pitWall.name = "pitWall";
  scene.add(pitWall);

  // Rails aligned to deck edge with a gap at +Z (entrance)
  const railY = 1.15;
  const railR = 14.2;
  const posts = 60;
  const gapCenter = Math.PI / 2;          // +Z
  const gapWidth = Math.PI / 10;          // entrance width

  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 10);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.8 });

  for (let i = 0; i < posts; i++) {
    const t = (i / posts) * Math.PI * 2;
    const inGap = Math.abs(((t - gapCenter + Math.PI*3)%(Math.PI*2)) - Math.PI) < gapWidth/2;
    if (inGap) continue;
    const p = new THREE.Mesh(postGeo, postMat);
    p.position.set(Math.cos(t) * railR, railY * 0.55, Math.sin(t) * railR);
    scene.add(p);
  }

  const railRing = new THREE.Mesh(
    new THREE.TorusGeometry(railR, 0.11, 10, 180),
    new THREE.MeshStandardMaterial({ color: 0x32323d, roughness: 0.55, metalness: 0.2 })
  );
  railRing.rotation.x = Math.PI / 2;
  railRing.position.y = railY;
  railRing.name = "deckRailRing";
  scene.add(railRing);

  // Stairs down through the gap
  const steps = 9;
  const stepW = 5.0, stepH = 0.22, stepD = 1.1;
  const stepGeo = new THREE.BoxGeometry(stepW, stepH, stepD);
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x1e1e28, roughness: 0.95 });

  for (let i = 0; i < steps; i++) {
    const s = new THREE.Mesh(stepGeo, stepMat);
    const y = 0.02 + (- (i+1) * ((railY - pitY) / (steps+1)));
    const z = railR - (i * 1.0);
    s.position.set(0, y, z);
    scene.add(s);
  }

  // Table group in pit (bigger, lowered)
  const table = new THREE.Group();
  table.position.y = pitY + 0.7;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(3.8, 5.2, 1.2, 96),
    new THREE.MeshStandardMaterial({ color: 0x09090d, emissive: 0x3a0060, emissiveIntensity: 0.9 })
  );
  base.position.y = 0.6;
  table.add(base);

  const topDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(7.2, 7.2, 0.38, 128),
    new THREE.MeshStandardMaterial({ color: 0x060607, roughness: 0.28 })
  );
  topDisk.position.y = 1.35;
  table.add(topDisk);

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(7.25, 0.22, 16, 200),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.35, metalness: 0.2 })
  );
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 1.48;
  table.add(trim);

  const neon = new THREE.Mesh(
    new THREE.TorusGeometry(7.35, 0.06, 10, 200),
    new THREE.MeshBasicMaterial({ color: 0x8a2be2 })
  );
  neon.rotation.x = Math.PI / 2;
  neon.position.y = 1.44;
  table.add(neon);

  // Better chair silhouette (seat + back + post + base ring)
  const chairGroup = new THREE.Group();
  const chairDist = 9.1;

  const seatGeo = new THREE.BoxGeometry(1.4, 0.22, 1.2);
  const backGeo = new THREE.BoxGeometry(1.4, 0.9, 0.18);
  const stemGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.1, 12);
  const footGeo = new THREE.TorusGeometry(0.55, 0.06, 10, 40);

  const chairMat = new THREE.MeshStandardMaterial({ color: 0x121218, roughness: 0.65 });
  const chairNeon = new THREE.MeshBasicMaterial({ color: 0x7a2aff });

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const g = new THREE.Group();

    const seat = new THREE.Mesh(seatGeo, chairMat);
    seat.position.y = 0.55;

    const back = new THREE.Mesh(backGeo, chairMat);
    back.position.set(0, 1.05, -0.52);
    back.rotation.x = -0.12;

    const stem = new THREE.Mesh(stemGeo, chairMat);
    stem.position.y = 0.0;

    const foot = new THREE.Mesh(footGeo, chairNeon);
    foot.rotation.x = Math.PI / 2;
    foot.position.y = -0.55;

    g.add(seat, back, stem, foot);
    g.position.set(Math.cos(a) * chairDist, pitY + 0.1, Math.sin(a) * chairDist);
    g.lookAt(0, pitY + 0.6, 0);
    chairGroup.add(g);
  }

  scene.add(table);
  scene.add(chairGroup);

  // Balcony ring above stores
  const balconyY = 7.0;
  const balconyRing = new THREE.Mesh(
    new THREE.RingGeometry(22, 26, 96),
    new THREE.MeshStandardMaterial({ color: 0x151520, roughness: 0.9, side: THREE.DoubleSide })
  );
  balconyRing.rotation.x = -Math.PI / 2;
  balconyRing.position.y = balconyY;
  balconyRing.name = "balconyFloor";
  scene.add(balconyRing);

  const balconyRail = new THREE.Mesh(
    new THREE.TorusGeometry(24, 0.12, 10, 200),
    new THREE.MeshStandardMaterial({ color: 0x2d2d38, roughness: 0.6 })
  );
  balconyRail.rotation.x = Math.PI / 2;
  balconyRail.position.y = balconyY + 1.1;
  scene.add(balconyRail);

  // 3 Jumbotrons above doors
  const jtGeo = new THREE.PlaneGeometry(8, 4);
  const jtMat = new THREE.MeshStandardMaterial({ color: 0x220033, emissive: 0x6622aa, emissiveIntensity: 1.0 });

  const doorAngles = [0, (2*Math.PI)/3, (4*Math.PI)/3];
  for (let i = 0; i < 3; i++) {
    const t = doorAngles[i];
    const jt = new THREE.Mesh(jtGeo, jtMat);
    jt.position.set(Math.cos(t) * 30, 8.5, Math.sin(t) * 30);
    jt.lookAt(0, 7.5, 0);
    scene.add(jt);
  }

  // Extra lights for visibility
  const ringLights = 10;
  for (let i = 0; i < ringLights; i++) {
    const t = (i / ringLights) * Math.PI * 2;
    const l = new THREE.PointLight(0x8a2be2, 0.55, 70);
    l.position.set(Math.cos(t)*28, 6, Math.sin(t)*28);
    scene.add(l);
  }

  return { updates: [] };
}
