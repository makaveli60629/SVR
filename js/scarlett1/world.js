/**
 * Scarlett1 World — V8 “SPAWN PAD + OPEN PIT DEPTH + STAIRS + STORE + JUMBOTRONS”
 * Fixes your report:
 *  - You were spawning at pit center (0,0,0). Now you spawn on a Spawn Pad on the ring.
 *  - Pit has NO cap disk (open wall + visible bottom + depth light).
 *  - Full stairs down to the pit, plus rail with entrance gap.
 *  - Store is placed near spawn so you SEE it.
 *  - Jumbotrons are ABOVE doors and bigger.
 *
 * Safe: NO imports.
 */
export async function init({ THREE, scene, camera, rig, renderer, setXRSpawn, log }) {
  log('[world] init V8 spawnpad+pit+store+jumbotrons');

  // ---------- SIZES ----------
  const OUTER_R = 24.0;     // walls close enough (not miles away)
  const WALL_H  = 8.5;

  const PIT_R   = 7.2;
  const PIT_DEPTH = 4.2;    // deeper so you SEE it

  const ENTRY_ANGLE = Math.PI * 0.5;

  // ---------- BACKGROUND ----------
  scene.background = new THREE.Color(0x05050a);
  scene.fog = new THREE.Fog(0x05050a, 18, 65);

  // ---------- LIGHTING (BRIGHT) ----------
  scene.add(new THREE.AmbientLight(0xffffff, 1.25));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a2a66, 1.4);
  hemi.position.set(0, 30, 0);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(12, 22, 10);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xffffff, 1.6);
  fill.position.set(-14, 16, -12);
  scene.add(fill);

  // pit depth accent light
  const pitDepthLight = new THREE.PointLight(0x7a45ff, 3.2, 80);
  pitDepthLight.position.set(0, -2.0, 0);
  scene.add(pitDepthLight);

  // ceiling ring lights
  for (let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2;
    const p=new THREE.PointLight(0xffffff, 1.2, 55);
    p.position.set(Math.cos(a)*(OUTER_R*0.55), WALL_H-1.2, Math.sin(a)*(OUTER_R*0.55));
    scene.add(p);
  }

  // ---------- MATERIALS ----------
  const matFloor = new THREE.MeshStandardMaterial({ color:0x141421, roughness:0.85, metalness:0.08, side:THREE.DoubleSide });
  const matRing  = new THREE.MeshStandardMaterial({ color:0x0f0f18, roughness:0.9,  metalness:0.10, side:THREE.DoubleSide });
  const matWall  = new THREE.MeshStandardMaterial({ color:0x1a1a28, roughness:0.92, metalness:0.05, side:THREE.DoubleSide });
  const matPit   = new THREE.MeshStandardMaterial({ color:0x080812, roughness:0.97, metalness:0.02, side:THREE.DoubleSide });
  const matNeon  = new THREE.MeshStandardMaterial({ color:0x120818, roughness:0.3, metalness:0.2, emissive:0x7a45ff, emissiveIntensity:1.35, side:THREE.DoubleSide });
  const matRail  = new THREE.MeshStandardMaterial({ color:0x202033, roughness:0.35, metalness:0.85 });

  // ---------- FLOOR (teleportable) ----------
  const floor = new THREE.Mesh(new THREE.CircleGeometry(OUTER_R, 120), matFloor);
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  floor.userData.teleportable = true;
  scene.add(floor);

  // floor neon rings for “color”
  for (let i=0;i<3;i++){
    const r = OUTER_R - 3.5 - i*3.2;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.06, 10, 240),
      new THREE.MeshStandardMaterial({ color:0x101020, emissive:0x2bd6ff, emissiveIntensity:0.35, roughness:0.5, metalness:0.2 })
    );
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.02;
    scene.add(ring);
  }

  // ---------- WALLS + CEILING ----------
  const walls = new THREE.Mesh(
    new THREE.CylinderGeometry(OUTER_R, OUTER_R, WALL_H, 160, 1, true),
    matWall
  );
  walls.position.y = WALL_H/2;
  walls.rotation.y = Math.PI;
  scene.add(walls);

  const ceiling = new THREE.Mesh(
    new THREE.CircleGeometry(OUTER_R, 120),
    new THREE.MeshStandardMaterial({ color:0x090910, roughness:0.95, metalness:0.05, side:THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI/2;
  ceiling.position.y = WALL_H;
  scene.add(ceiling);

  // ---------- OPEN PIT (NO CAP DISK) ----------
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(PIT_R, PIT_R, PIT_DEPTH, 140, 1, true),
    matPit
  );
  pitWall.position.y = -PIT_DEPTH/2;
  pitWall.rotation.y = Math.PI;
  scene.add(pitWall);

  // Visible bottom disk DOWN at the bottom (this is NOT a cap at the top)
  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(PIT_R-0.08, 120),
    new THREE.MeshStandardMaterial({
      color:0x06060b,
      roughness:0.98,
      metalness:0.02,
      emissive:0x1a0830,
      emissiveIntensity:0.55,
      side:THREE.DoubleSide
    })
  );
  pitBottom.rotation.x = -Math.PI/2;
  pitBottom.position.y = -PIT_DEPTH;
  pitBottom.userData.teleportable = true;
  scene.add(pitBottom);

  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(PIT_R+0.12, 0.09, 12, 240),
    matNeon
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.65;
  scene.add(pitLip);

  // ---------- WALK RING (teleportable) ----------
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(PIT_R + 1.6, OUTER_R - 2.0, 180),
    matRing
  );
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.01;
  ring.userData.teleportable = true;
  scene.add(ring);

  // ---------- RAIL WITH ENTRANCE GAP ----------
  const railTop = new THREE.Mesh(new THREE.TorusGeometry(PIT_R+0.58, 0.06, 10, 240), matRail);
  railTop.rotation.x = Math.PI/2;
  railTop.position.y = 1.08;
  scene.add(railTop);

  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 10);
  const postCount = 56;
  const gap = Math.PI/8;

  for (let i=0;i<postCount;i++){
    const a=(i/postCount)*Math.PI*2;
    const da = Math.atan2(Math.sin(a-ENTRY_ANGLE), Math.cos(a-ENTRY_ANGLE));
    if (Math.abs(da) < gap) continue;

    const p = new THREE.Mesh(postGeo, matRail);
    p.position.set(Math.cos(a)*(PIT_R+0.58), 0.58, Math.sin(a)*(PIT_R+0.58));
    scene.add(p);
  }

  // ---------- FULL STAIRS DOWN INTO PIT ----------
  const stairs = new THREE.Group();
  scene.add(stairs);

  const steps = 18;
  const stepW = 3.0;
  const stepH = PIT_DEPTH/steps;
  const stepD = 0.62;

  const stepMat = new THREE.MeshStandardMaterial({ color:0x171726, roughness:0.85, metalness:0.08, emissive:0x070714, emissiveIntensity:0.08 });

  const startR = PIT_R + 0.9;
  const endR   = PIT_R - 0.6;

  for (let i=0;i<steps;i++){
    const t = i/(steps-1);
    const y = -t*PIT_DEPTH + stepH*0.5;                 // goes all the way down
    const r = startR + (endR - startR)*t;               // slightly curves inward

    const x = Math.cos(ENTRY_ANGLE)*r;
    const z = Math.sin(ENTRY_ANGLE)*r;

    const s = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), stepMat);
    s.position.set(x, y, z);
    s.lookAt(0, y, 0);
    stairs.add(s);
  }

  // ---------- DOORS + JUMBOTRONS (ABOVE DOORS, BIGGER) ----------
  const doorW = 3.4;
  const doorH = 3.2;

  const doorMat = new THREE.MeshStandardMaterial({ color:0x0b0b12, roughness:0.7, metalness:0.2, emissive:0x0a0a18, emissiveIntensity:0.15 });

  const screenGeo = new THREE.PlaneGeometry(9.0, 4.8); // BIGGER
  const screenMat = new THREE.MeshStandardMaterial({
    color:0x07070c,
    roughness:0.45,
    metalness:0.12,
    emissive:0x2b1bff,
    emissiveIntensity:2.4,
    side:THREE.DoubleSide
  });

  function addDoorAndScreen(angle){
    const r = OUTER_R - 0.35;

    // door (cutout look only)
    const door = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), doorMat);
    door.position.set(Math.cos(angle)*r, doorH/2, Math.sin(angle)*r);
    door.lookAt(0, doorH/2, 0);
    scene.add(door);

    // screen above door
    const screen = new THREE.Mesh(screenGeo, screenMat.clone());
    screen.position.set(Math.cos(angle)*(OUTER_R-0.45), 5.9, Math.sin(angle)*(OUTER_R-0.45));
    screen.lookAt(0, 5.9, 0);
    scene.add(screen);

    // label strip under screen
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 0.9),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, emissive:0x7a45ff, emissiveIntensity:1.55, roughness:0.6, metalness:0.1, side:THREE.DoubleSide })
    );
    strip.position.set(Math.cos(angle)*(OUTER_R-0.55), 3.8, Math.sin(angle)*(OUTER_R-0.55));
    strip.lookAt(0, 3.8, 0);
    scene.add(strip);

    return screen;
  }

  const jumbos = [
    addDoorAndScreen(Math.PI*0.00),
    addDoorAndScreen(Math.PI*0.50),
    addDoorAndScreen(Math.PI*1.00),
    addDoorAndScreen(Math.PI*1.50),
  ];

  // ---------- SPAWN PAD (VISIBLE) ----------
  const spawnPad = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.12, 12, 60),
    new THREE.MeshStandardMaterial({ color:0x0b0b12, emissive:0x2bd6ff, emissiveIntensity:1.6, roughness:0.35, metalness:0.2 })
  );
  spawnPad.rotation.x = Math.PI/2;
  spawnPad.position.set(0, 0.04, 14.5);
  spawnPad.userData.teleportable = true;
  scene.add(spawnPad);

  // FORCE SPAWN HERE in XR
  setXRSpawn?.(new THREE.Vector3(spawnPad.position.x, 0, spawnPad.position.z), Math.PI);

  // ---------- STORE (PUT IT WHERE YOU CAN SEE IT) ----------
  const store = new THREE.Group();
  scene.add(store);

  const pedMat = new THREE.MeshStandardMaterial({ color:0x12121c, roughness:0.7, metalness:0.22, emissive:0x1b0b2a, emissiveIntensity:0.15 });
  const pedGlow = new THREE.MeshStandardMaterial({ color:0x7a45ff, emissive:0x7a45ff, emissiveIntensity:1.4, roughness:0.3, metalness:0.05 });

  function makeLabel(text){
    const c=document.createElement('canvas');
    c.width=512; c.height=256;
    const g=c.getContext('2d');
    g.fillStyle='rgba(10,12,18,0.92)'; g.fillRect(0,0,c.width,c.height);
    g.strokeStyle='rgba(125,95,255,0.65)'; g.lineWidth=10; g.strokeRect(16,16,c.width-32,c.height-32);
    g.fillStyle='rgba(255,255,255,0.96)'; g.font='900 56px system-ui, Arial';
    g.textAlign='center'; g.textBaseline='middle';
    g.fillText(text, c.width/2, c.height/2 - 8);
    g.fillStyle='rgba(230,236,252,0.85)'; g.font='800 26px system-ui, Arial';
    g.fillText('point + trigger', c.width/2, c.height/2 + 58);
    const tex=new THREE.CanvasTexture(c);
    tex.needsUpdate=true;
    return tex;
  }

  const items = ['STORE','AVATARS','CARDS','CHIPS'];

  // Place store line-of-sight near spawn (right side)
  for (let i=0;i<4;i++){
    const pedestal = new THREE.Group();
    pedestal.position.set(3.6 + i*2.6, 0, 12.0);
    pedestal.lookAt(0, 1.0, 0);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 0.72, 28), pedMat);
    base.position.y = 0.36;
    pedestal.add(base);

    const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.07, 12, 80), pedGlow);
    ringGlow.rotation.x = Math.PI/2;
    ringGlow.position.y = 0.03;
    pedestal.add(ringGlow);

    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 1.4),
      new THREE.MeshStandardMaterial({ map:makeLabel(items[i]), transparent:true, emissive:0x220b44, emissiveIntensity:0.35, roughness:0.7, metalness:0.05, side:THREE.DoubleSide })
    );
    card.position.set(0, 2.0, 0);
    pedestal.add(card);

    store.add(pedestal);
  }

  // ---------- BOTS (simple humanoids) ----------
  const bots = [];
  const botCount = 8;

  const botBody = new THREE.MeshStandardMaterial({ color:0x141420, roughness:0.55, metalness:0.45, emissive:0x120818, emissiveIntensity:0.18 });
  const botGlow = new THREE.MeshStandardMaterial({ color:0x7a45ff, roughness:0.3, metalness:0.1, emissive:0x7a45ff, emissiveIntensity:0.9 });

  function makeBot(){
    const g = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), botGlow);
    head.position.y = 1.55; g.add(head);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 8, 12), botBody);
    torso.position.y = 1.0; g.add(torso);
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.22), botBody);
    hips.position.y = 0.65; g.add(hips);
    const legGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.55, 10);
    const legL = new THREE.Mesh(legGeo, botBody); legL.position.set(-0.10, 0.30, 0); g.add(legL);
    const legR = new THREE.Mesh(legGeo, botBody); legR.position.set(0.10, 0.30, 0); g.add(legR);
    const feet = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.08, 0.22), botBody);
    feet.position.y = 0.02; g.add(feet);
    return g;
  }

  for (let i=0;i<botCount;i++){
    const b = makeBot();
    b.userData.a = (i/botCount)*Math.PI*2;
    b.userData.r = (PIT_R+2.8 + OUTER_R-3.0) * 0.5 + (i%2 ? 0.5 : -0.5);
    b.userData.speed = 0.55 + (i%3)*0.12;
    scene.add(b);
    bots.push(b);
  }

  // ---------- CAMERA DEFAULT (non-XR) ----------
  camera.position.set(0, 1.7, 14.5);
  camera.lookAt(0, 1.5, 0);

  // ---------- UPDATE LOOP ----------
  let t = 0;

  function update(dt){
    t += dt;

    // jumbotrons pulse
    for (const s of jumbos){
      s.material.emissiveIntensity = 2.1 + Math.sin(t*1.6)*0.5;
    }

    // pit lip pulse
    pitLip.material.emissiveIntensity = 1.1 + Math.sin(t*2.2)*0.35;

    // store bob
    for (const ped of store.children){
      const label = ped.children[ped.children.length-1];
      if (label) label.position.y = 2.0 + Math.sin(t*1.7 + ped.position.x*0.4)*0.06;
    }

    // bots walk
    for (const b of bots){
      b.userData.a += dt * b.userData.speed;
      const a = b.userData.a;
      const r = b.userData.r;
      b.position.set(Math.cos(a)*r, 0.02 + Math.sin(t*6 + a*3)*0.03, Math.sin(a)*r);
      b.rotation.y = -(a + Math.PI*0.5);
    }
  }

  log('[world] V8 ready ✅ spawn pad + open pit + stairs + store + jumbotrons');

  // IMPORTANT: Provide teleport surfaces so teleport actually works
  return {
    updates:[update],
    interactables:[],
    teleportSurfaces:[ floor, ring, spawnPad, pitBottom ]
  };
}
