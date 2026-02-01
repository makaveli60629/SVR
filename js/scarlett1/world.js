import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export async function init(ctx) {
  const { scene, walkSurfaces, teleportSurfaces } = ctx;

  // ---------- big lobby floor ----------
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(60, 96),
    new THREE.MeshStandardMaterial({ color: 0x2a1236, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  walkSurfaces.push(floor);
  teleportSurfaces.push(floor);

  // ---------- pit ----------
  const pitR = 8;
  const pitDepth = 3.2;

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR, pitR, pitDepth, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x111018, roughness: 0.9 })
  );
  pitWall.position.y = -(pitDepth / 2);
  scene.add(pitWall);

  // pit floor (walkable)
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(pitR - 0.15, 96),
    new THREE.MeshStandardMaterial({ color: 0x3a1b4b, roughness: 0.95 })
  );
  pitFloor.rotation.x = -Math.PI / 2;
  pitFloor.position.y = -pitDepth;
  scene.add(pitFloor);

  walkSurfaces.push(pitFloor);
  teleportSurfaces.push(pitFloor);

  // neon trim ring (does NOT block stairs)
  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(pitR + 0.15, 0.06, 12, 120),
    new THREE.MeshStandardMaterial({ color: 0x00c8ff, emissive: 0x005577 })
  );
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.05;
  scene.add(trim);

  // ---------- simple “6-step” stair down (curved-ish) ----------
  // We’ll do a clean short staircase: 6 steps down to pit floor.
  const steps = 6;
  const stepH = pitDepth / steps;
  const stepD = 0.75;

  const stairGroup = new THREE.Group();
  stairGroup.position.set(pitR + 0.2, 0, 0);
  scene.add(stairGroup);

  for (let i = 0; i < steps; i++) {
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(stepD, 0.18, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x1c1a22, roughness: 0.85 })
    );

    const y = -i * stepH - 0.09;
    const z = -i * 0.9;

    s.position.set(0, y, z);
    stairGroup.add(s);

    walkSurfaces.push(s);
    teleportSurfaces.push(s);
  }

  // bottom plate (tight)
  const bottomPlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.2, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x15121b, roughness: 0.9 })
  );
  bottomPlate.position.set(pitR - 1.2, -pitDepth + 0.1, -steps * 0.9);
  scene.add(bottomPlate);

  walkSurfaces.push(bottomPlate);
  teleportSurfaces.push(bottomPlate);

  // ---------- store block placeholder ----------
  const store = new THREE.Mesh(
    new THREE.BoxGeometry(10, 4, 3),
    new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.8 })
  );
  store.position.set(0, 2, -18);
  scene.add(store);

  // store sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(8, 1, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xff00aa, emissive: 0x330022 })
  );
  sign.position.set(0, 4.2, -16.4);
  scene.add(sign);

  // ---------- 4 jumbotron placeholders ----------
  const ringR = 46;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const j = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x202a44, emissive: 0x090c18 })
    );
    j.position.set(Math.cos(a) * ringR, 8, Math.sin(a) * ringR);
    j.lookAt(0, 7, 0);
    scene.add(j);
  }

  // ---------- extra brightness ----------
  const top = new THREE.PointLight(0xffffff, 1.4, 160);
  top.position.set(0, 16, 0);
  scene.add(top);

  const pitLight = new THREE.PointLight(0x00c8ff, 1.2, 40);
  pitLight.position.set(0, -1.2, 0);
  scene.add(pitLight);

  console.log("✅ Scarlett1 demo world restored (floor/pit/stairs/store/jumbotrons)");
}
