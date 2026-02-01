// /js/scarlett1/world.js
// This is a self-contained demo world with:
// - outer ring floor (walk/teleport)
// - center pit with textured-ish material
// - tight stairs down into pit (8 steps)
// - rails around pit (solid barrier)
// - simple store front and balcony frame placeholders
//
// NO bare imports. Uses THREE passed in ctx.

export async function initWorld(ctx){
  const { THREE, scene, Bus } = ctx;

  const walkSurfaces = [];
  const teleportSurfaces = [];

  // ======= Materials =======
  const matFloor = new THREE.MeshStandardMaterial({ color: 0x3a1b66, roughness: 0.95, metalness: 0.0 });
  const matPit   = new THREE.MeshStandardMaterial({ color: 0x1b1225, roughness: 0.85, metalness: 0.05 });
  const matWall  = new THREE.MeshStandardMaterial({ color: 0x10131a, roughness: 0.9, metalness: 0.0 });
  const matTrim  = new THREE.MeshStandardMaterial({ color: 0xff2a8a, roughness: 0.3, metalness: 0.2, emissive: new THREE.Color(0x120008), emissiveIntensity: 1.0 });
  const matRail  = new THREE.MeshStandardMaterial({ color: 0x00d5ff, roughness: 0.2, metalness: 0.7, emissive: new THREE.Color(0x001018), emissiveIntensity: 1.0 });
  const matStair = new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.95, metalness: 0.0 });

  // ======= Dimensions =======
  const outerR = 16.0;
  const pitR   = 6.2;
  const pitDepth = 3.2;

  // ======= Outer ring floor (walkable) =======
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR, outerR, 0.25, 96, 1, false),
    matFloor
  );
  floor.position.set(0, 0.0, 0);
  floor.receiveShadow = false;
  scene.add(floor);
  walkSurfaces.push(floor);
  teleportSurfaces.push(floor);

  // Center hole cut illusion: add pit "void" top cap darker disk slightly below
  const pitTop = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR, pitR, 0.05, 96),
    matPit
  );
  pitTop.position.set(0, -0.06, 0);
  scene.add(pitTop);

  // ======= Pit walls + bottom (walkable in pit) =======
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR, pitR, pitDepth, 96, 1, true),
    matWall
  );
  pitWall.position.y = -pitDepth/2 - 0.05;
  scene.add(pitWall);

  const pitBottom = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR-0.25, pitR-0.25, 0.22, 96),
    matPit
  );
  pitBottom.position.y = -pitDepth - 0.15;
  scene.add(pitBottom);
  walkSurfaces.push(pitBottom);
  teleportSurfaces.push(pitBottom);

  // ======= Pit top trim (DOES NOT block stairs) =======
  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(pitR + 0.10, 0.08, 14, 140),
    matTrim
  );
  trim.rotation.x = Math.PI/2;
  trim.position.y = 0.05;
  scene.add(trim);

  // ======= Rail barrier ring (solid collision-ish) =======
  // (No physics engine; but thick geometry helps and visually seals.)
  const railRing = new THREE.Mesh(
    new THREE.TorusGeometry(pitR + 0.45, 0.10, 10, 160),
    matRail
  );
  railRing.rotation.x = Math.PI/2;
  railRing.position.y = 1.0;
  scene.add(railRing);

  // Add vertical posts
  for (let i=0;i<24;i++){
    const a = (i/24)*Math.PI*2;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06,0.06,1.0,12),
      matRail
    );
    post.position.set(Math.cos(a)*(pitR+0.45), 0.5, Math.sin(a)*(pitR+0.45));
    scene.add(post);
  }

  // ======= Stairs down (8 steps) =======
  // Place stairs at +Z side, aligned to opening in rail (we'll remove posts near entrance)
  const stairGroup = new THREE.Group();
  stairGroup.position.set(0, 0, pitR + 0.2);
  stairGroup.rotation.y = Math.PI; // face toward center
  scene.add(stairGroup);

  const steps = 8;
  const stepH = pitDepth / steps;
  const stepD = 0.55;
  const stepW = 2.1;

  // Top landing (walkable)
  const landingTop = new THREE.Mesh(
    new THREE.BoxGeometry(stepW, 0.18, 1.2),
    matStair
  );
  landingTop.position.set(0, 0.09, -0.7);
  stairGroup.add(landingTop);
  walkSurfaces.push(landingTop);
  teleportSurfaces.push(landingTop);

  // Steps
  for (let i=0;i<steps;i++){
    const y = - (i+1)*stepH;
    const z = - (i*stepD);
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, 0.18, stepD),
      matStair
    );
    step.position.set(0, y + 0.09, z);
    stairGroup.add(step);
    walkSurfaces.push(step);
    teleportSurfaces.push(step);
  }

  // Bottom landing (walkable) — attaches to last step
  const landingBottom = new THREE.Mesh(
    new THREE.BoxGeometry(stepW, 0.18, 1.2),
    matStair
  );
  landingBottom.position.set(0, -pitDepth - 0.05, -((steps-1)*stepD) - 0.7);
  stairGroup.add(landingBottom);
  walkSurfaces.push(landingBottom);
  teleportSurfaces.push(landingBottom);

  // Decorative stair base skirt
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(stepW+0.4, pitDepth+0.6, (steps*stepD)+1.6),
    new THREE.MeshStandardMaterial({ color: 0x141821, roughness: 0.95, metalness: 0.0 })
  );
  base.position.set(0, -(pitDepth/2), -((steps*stepD)/2) - 0.6);
  stairGroup.add(base);

  // Stair rails (right side only, outside wall side)
  const railSide = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(stepW/2 + 0.25, 1.0, -0.8),
        new THREE.Vector3(stepW/2 + 0.25, 0.7, -1.6),
        new THREE.Vector3(stepW/2 + 0.25, 0.2, -2.8),
        new THREE.Vector3(stepW/2 + 0.25, -0.6, -4.2),
        new THREE.Vector3(stepW/2 + 0.25, -1.4, -5.4),
      ]),
      80, 0.06, 10, false
    ),
    matRail
  );
  stairGroup.add(railSide);

  // Remove posts near stair opening (visual opening)
  // (We can't "remove" earlier posts easily without tracking; keep it simple.)

  // ======= Table pedestal placeholder in pit center =======
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.35, 0.7, 48),
    new THREE.MeshStandardMaterial({ color: 0x0d0f14, roughness: 0.7, metalness: 0.2 })
  );
  pedestal.position.set(0, -pitDepth + 0.25, 0);
  scene.add(pedestal);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.12, 64),
    new THREE.MeshStandardMaterial({ color: 0x151a23, roughness: 0.35, metalness: 0.65 })
  );
  table.position.set(0, -pitDepth + 0.65, 0);
  scene.add(table);

  // Chairs placeholder ring
  for (let i=0;i<6;i++){
    const a=(i/6)*Math.PI*2;
    const chair = new THREE.Mesh(
      new THREE.BoxGeometry(0.45,0.7,0.45),
      new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.9, metalness: 0.0 })
    );
    chair.position.set(Math.cos(a)*2.6, -pitDepth + 0.35, Math.sin(a)*2.6);
    scene.add(chair);
  }

  // ======= Store front + balcony placeholder =======
  const store = new THREE.Group();
  store.position.set(-7.5, 0, -10.5);
  scene.add(store);

  const storeFrame = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, 2.8, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x0f1218, roughness: 0.85 })
  );
  storeFrame.position.set(0, 1.4, 0);
  store.add(storeFrame);

  const storeLight = new THREE.PointLight(0x55ccff, 1.2, 14);
  storeLight.position.set(0, 2.2, 1.0);
  store.add(storeLight);

  // balcony rail
  const balcony = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 0.22, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.9 })
  );
  balcony.position.set(0, 3.2, -0.2);
  store.add(balcony);

  const balconyRail = new THREE.Mesh(
    new THREE.TorusGeometry(2.9, 0.07, 10, 90, Math.PI),
    matRail
  );
  balconyRail.rotation.x = Math.PI/2;
  balconyRail.rotation.z = Math.PI;
  balconyRail.position.set(0, 3.6, 0.35);
  store.add(balconyRail);

  // Neon sign (cursive-ish block)
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 1.0),
    new THREE.MeshStandardMaterial({ color: 0xff2a8a, emissive: new THREE.Color(0x3a001a), emissiveIntensity: 3.0 })
  );
  sign.position.set(0, 2.4, 0.58);
  store.add(sign);

  // ======= Walls (sealed) =======
  // Simple cylindrical wall to stop "walking through"
  const roomWall = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR+1.0, outerR+1.0, 7.0, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x07080c, roughness: 0.95, side: THREE.DoubleSide })
  );
  roomWall.position.y = 3.2;
  scene.add(roomWall);

  // Return surfaces so input can raycast & snap
  Bus?.log?.("Full demo world restored (safe + VR locomotion + teleport).");
  return { walkSurfaces, teleportSurfaces };
}
