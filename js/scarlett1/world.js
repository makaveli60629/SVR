/**
 * Scarlett1 World — V6 FAST LOBBY + OPEN PIT + BALCONY + STAIRS + RAILS + STORE + BOTS
 * - XR Spawn is set via setXRSpawn (rig-based)
 * - Teleportable surfaces returned for spine teleport
 * - No cap disk in pit
 */

export async function init({ THREE, scene, camera, rig, renderer, setXRSpawn, log }) {
  log('[world] init V6');

  const OUTER_R = 26;
  const WALL_H  = 7.5;

  const PIT_R     = 7.5;
  const PIT_DEPTH = 3.6;
  const PIT_FLOOR_Y = -PIT_DEPTH;

  const ENTRY_ANGLE = Math.PI * 0.5;
  const BALCONY_Y = 3.2;

  // Spawn OUTSIDE pit (XR uses rig)
  setXRSpawn?.(new THREE.Vector3(0, 0, 14.5), Math.PI);

  scene.background = new THREE.Color(0x040407);
  scene.fog = new THREE.Fog(0x040407, 18, 60);

  // Lights (brighter + color)
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const hemi = new THREE.HemisphereLight(0xffffff, 0x23234a, 1.15);
  hemi.position.set(0, 18, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.25);
  dir.position.set(8, 16, 10);
  scene.add(dir);

  const pitGlow = new THREE.PointLight(0x7a45ff, 2.2, 60);
  pitGlow.position.set(0, 3.5, 0);
  scene.add(pitGlow);

  const cyan = new THREE.PointLight(0x2bd6ff, 1.2, 55);
  cyan.position.set(8, 4, 8);
  scene.add(cyan);

  const mag = new THREE.PointLight(0xff3cff, 1.0, 55);
  mag.position.set(-8, 4, -8);
  scene.add(mag);

  const matFloor = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.92, metalness: 0.06 });
  const matRing  = new THREE.MeshStandardMaterial({ color: 0x0d0d14, roughness: 0.88, metalness: 0.10, side:THREE.DoubleSide });
  const matWall  = new THREE.MeshStandardMaterial({ color: 0x161623, roughness: 0.92, metalness: 0.05, side:THREE.DoubleSide });
  const matPit   = new THREE.MeshStandardMaterial({ color: 0x08080f, roughness: 0.95, metalness: 0.02, side:THREE.DoubleSide });
  const matRail  = new THREE.MeshStandardMaterial({ color: 0x1a1a28, roughness: 0.45, metalness: 0.85 });
  const matNeon  = new THREE.MeshStandardMaterial({ color: 0x120818, roughness: 0.35, metalness: 0.25, emissive: 0x7a45ff, emissiveIntensity: 1.0 });

  // Outer floor
  const floor = new THREE.Mesh(new THREE.CircleGeometry(OUTER_R, 96), matFloor);
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  floor.userData.teleportable = true;
  scene.add(floor);

  // Open pit wall + bottom (NO CAP DISK on top)
  const pitWall = new THREE.Mesh(new THREE.CylinderGeometry(PIT_R, PIT_R, PIT_DEPTH, 96, 1, true), matPit);
  pitWall.position.y = -PIT_DEPTH/2;
  pitWall.rotation.y = Math.PI;
  scene.add(pitWall);

  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(PIT_R - 0.05, 80),
    new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 0.98, metalness: 0.02, emissive: 0x160a22, emissiveIntensity: 0.35, side:THREE.DoubleSide })
  );
  pitBottom.rotation.x = -Math.PI/2;
  pitBottom.position.y = PIT_FLOOR_Y;
  pitBottom.userData.teleportable = true;
  scene.add(pitBottom);

  // Ring walkway around pit
  const ringInner = PIT_R + 1.5;
  const ringOuter = OUTER_R - 2.0;
  const ring = new THREE.Mesh(new THREE.RingGeometry(ringInner, ringOuter, 128), matRing);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.01;
  ring.userData.teleportable = true;
  scene.add(ring);

  // Walls
  const walls = new THREE.Mesh(new THREE.CylinderGeometry(OUTER_R, OUTER_R, WALL_H, 128, 1, true), matWall);
  walls.position.y = WALL_H/2;
  walls.rotation.y = Math.PI;
  scene.add(walls);

  // Pit rails
  const pitRail = new THREE.Mesh(new THREE.TorusGeometry(PIT_R + 0.2, 0.08, 14, 128), matRail);
  pitRail.rotation.x = Math.PI/2;
  pitRail.position.y = 0.95;
  scene.add(pitRail);

  const pitNeon = new THREE.Mesh(new THREE.TorusGeometry(PIT_R + 0.55, 0.05, 10, 128), matNeon);
  pitNeon.rotation.x = Math.PI/2;
  pitNeon.position.y = 0.65;
  scene.add(pitNeon);

  // Balcony
  const balcony = new THREE.Mesh(
    new THREE.RingGeometry(ringInner + 0.8, ringOuter - 0.8, 128),
    new THREE.MeshStandardMaterial({ color:0x0d0d13, roughness:0.92, metalness:0.08, side:THREE.DoubleSide })
  );
  balcony.rotation.x = -Math.PI/2;
  balcony.position.y = BALCONY_Y;
  balcony.userData.teleportable = true;
  scene.add(balcony);

  const balconyOuterRail = new THREE.Mesh(new THREE.TorusGeometry(ringOuter - 0.7, 0.07, 12, 128), matRail);
  balconyOuterRail.rotation.x = Math.PI/2;
  balconyOuterRail.position.y = BALCONY_Y + 1.0;
  scene.add(balconyOuterRail);

  const balconyInnerRail = new THREE.Mesh(new THREE.TorusGeometry(ringInner + 1.0, 0.07, 12, 128), matRail);
  balconyInnerRail.rotation.x = Math.PI/2;
  balconyInnerRail.position.y = BALCONY_Y + 1.0;
  scene.add(balconyInnerRail);

  // Stairs down into pit (entry)
  const stair = new THREE.Group();
  scene.add(stair);

  const steps = 14;
  const stepW = 2.6;
  const stepH = PIT_DEPTH / steps;
  const stepD = 0.55;
  const stepMat = new THREE.MeshStandardMaterial({ color:0x12121a, roughness:0.85, metalness:0.08 });

  for (let i=0;i<steps;i++){
    const t = i/(steps-1);
    const y = -t * PIT_DEPTH + stepH*0.5;
    const r = PIT_R + 0.6 + t*2.2;
    const x = Math.cos(ENTRY_ANGLE)*r;
    const z = Math.sin(ENTRY_ANGLE)*r;

    const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), stepMat);
    step.position.set(x,y,z);
    step.lookAt(0,y,0);
    stair.add(step);
  }

  // Jumbotrons (4)
  const screens = [];
  const screenGeo = new THREE.PlaneGeometry(6.2, 3.2);

  function makeScreen(angle, y){
    const mat = new THREE.MeshStandardMaterial({
      color:0x0b0b12,
      roughness:0.55,
      metalness:0.10,
      emissive:0x2b1bff,
      emissiveIntensity:1.4,
      side:THREE.DoubleSide
    });
    const m = new THREE.Mesh(screenGeo, mat);
    const r = OUTER_R - 0.4;
    m.position.set(Math.cos(angle)*r, y, Math.sin(angle)*r);
    m.lookAt(0, y, 0);
    scene.add(m);
    screens.push(m);
  }
  makeScreen(Math.PI*0.25, 4.6);
  makeScreen(Math.PI*0.75, 4.6);
  makeScreen(Math.PI*1.25, 4.6);
  makeScreen(Math.PI*1.75, 4.6);

  // Store kiosk
  const store = new THREE.Group();
  scene.add(store);

  const storeAngle = ENTRY_ANGLE + Math.PI*0.5;
  const storeR = ringOuter - 3.5;
  store.position.set(Math.cos(storeAngle)*storeR, 0, Math.sin(storeAngle)*storeR);
  store.lookAt(0, 0.7, 0);

  const booth = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.6, 1.4),
    new THREE.MeshStandardMaterial({ color:0x0e0e16, roughness:0.7, metalness:0.2, emissive:0x090012, emissiveIntensity:0.25 })
  );
  booth.position.y = 0.8;
  store.add(booth);

  const boothTop = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.18, 1.55), matNeon);
  boothTop.position.y = 1.55;
  store.add(boothTop);

  const storeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.55),
    new THREE.MeshStandardMaterial({ color:0x09090f, emissive:0x7a45ff, emissiveIntensity:1.3, roughness:0.5, metalness:0.1, side:THREE.DoubleSide })
  );
  storeSign.position.set(0, 2.05, 0.72);
  store.add(storeSign);

  // Pedestal + table placeholder (until you choose final)
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.4, 1.6, 64),
    new THREE.MeshStandardMaterial({ color:0x111118, roughness:0.8, metalness:0.25, emissive:0x160a22, emissiveIntensity:0.25 })
  );
  pedestal.position.set(0, PIT_FLOOR_Y + 0.8, 0);
  scene.add(pedestal);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 3.6, 0.22, 96),
    new THREE.MeshStandardMaterial({ color:0x0b0b12, roughness:0.75, metalness:0.15, emissive:0x1d0f33, emissiveIntensity:0.35 })
  );
  table.position.set(0, PIT_FLOOR_Y + 1.55, 0);
  scene.add(table);

  // Bots walking ring + idlers near pit
  const bots = [];
  const botCount = 10;

  const botBodyMat = new THREE.MeshStandardMaterial({
    color:0x111118, roughness:0.45, metalness:0.75,
    emissive:0x2c1a55, emissiveIntensity:0.25
  });
  const botCoreMat = new THREE.MeshStandardMaterial({
    color:0x0b0b12, roughness:0.25, metalness:0.15,
    emissive:0x7a45ff, emissiveIntensity:0.9
  });

  function makeBot(){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 8, 12), botBodyMat);
    body.position.y = 0.75;
    g.add(body);

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), botCoreMat);
    core.position.set(0, 0.95, 0.22);
    g.add(core);
    return g;
  }

  for (let i=0;i<botCount;i++){
    const b = makeBot();
    b.userData.a = (i/botCount)*Math.PI*2;
    b.userData.r = (ringInner + ringOuter)*0.5 + (i%2 ? 0.6 : -0.6);
    b.userData.speed = 0.35 + (i%3)*0.12;
    scene.add(b);
    bots.push(b);
  }

  // Idle bots watching / “playing”
  for (let i=0;i<4;i++){
    const b = makeBot();
    const a = ENTRY_ANGLE + Math.PI + i*(Math.PI/8);
    const r = PIT_R + 2.0;
    b.position.set(Math.cos(a)*r, 0, Math.sin(a)*r);
    b.rotation.y = -a + Math.PI*0.5;
    scene.add(b);
  }

  // Desktop/mobile safe camera only (XR uses rig)
  camera.position.set(0, 1.6, 14.5);
  camera.lookAt(0, 1.4, 0);

  log('[world] V6 ready ✅ (XR spawn via rig, teleport surfaces returned)');

  // Updates
  let t = 0;
  function update(dt){
    t += dt;

    // screens pulse
    const pulse = 1.1 + Math.sin(t*1.6)*0.35;
    for (const s of screens) s.material.emissiveIntensity = pulse;

    // neon pulse
    pitNeon.material.emissiveIntensity = 0.85 + Math.sin(t*2.1)*0.25;

    // bots walk ring
    for (const b of bots){
      b.userData.a += dt*b.userData.speed;
      const a = b.userData.a;
      const r = b.userData.r;
      b.position.set(Math.cos(a)*r, 0, Math.sin(a)*r);
      b.rotation.y = -(a + Math.PI*0.5);
      b.position.y = 0.02 + Math.sin(t*6 + a*3)*0.03;
    }
  }

  return {
    updates:[update],
    interactables:[],
    // These are what teleport raycaster hits:
    teleportSurfaces:[ ring, floor, balcony, pitBottom ]
  };
                                    }
