/**
 * Scarlett1 World — V7 “BRIGHT BEAUTIFIED” LOBBY
 * - MAX lighting (can’t miss)
 * - Open pit (NO cap disk)
 * - Rails + stairs + balcony
 * - Store pedestals + big signage
 * - 4 Jumbotrons
 * - Humanoid bots (head/torso/legs) walking ring
 * - Community card animation loop
 * - Simple in-world Menu Panel (ray-click with controller trigger)
 *
 * Safe: NO imports.
 */
export async function init({ THREE, scene, camera, rig, renderer, setXRSpawn, log }) {
  log('[world] init V7 bright beautified');

  // ------------------ TUNABLES ------------------
  const OUTER_R = 26;
  const WALL_H  = 8.0;

  const PIT_R = 7.6;
  const PIT_DEPTH = 3.8;

  const RING_INNER = PIT_R + 1.6;
  const RING_OUTER = OUTER_R - 2.0;

  const ENTRY_ANGLE = Math.PI * 0.5;

  const BALCONY_Y = 3.3;

  // XR spawn OUTSIDE pit (rig-based)
  setXRSpawn?.(new THREE.Vector3(0, 0, 14.5), Math.PI);

  // ------------------ BACKGROUND + FOG ------------------
  scene.background = new THREE.Color(0x040408);
  scene.fog = new THREE.Fog(0x040408, 18, 70);

  // ------------------ LIGHTING: MAX BRIGHT ------------------
  scene.add(new THREE.AmbientLight(0xffffff, 1.25));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a2a66, 1.45);
  hemi.position.set(0, 30, 0);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(12, 24, 10);
  scene.add(sun);

  const sun2 = new THREE.DirectionalLight(0xffffff, 1.8);
  sun2.position.set(-12, 18, -14);
  scene.add(sun2);

  // ring of ceiling lights
  for (let i=0;i<12;i++){
    const a=(i/12)*Math.PI*2;
    const p=new THREE.PointLight(0xffffff, 1.4, 55);
    p.position.set(Math.cos(a)*(OUTER_R*0.55), WALL_H-1.0, Math.sin(a)*(OUTER_R*0.55));
    scene.add(p);
  }

  // neon accents
  const pitGlow = new THREE.PointLight(0x7a45ff, 3.0, 70);
  pitGlow.position.set(0, 2.6, 0);
  scene.add(pitGlow);

  const cyan = new THREE.PointLight(0x2bd6ff, 2.0, 70);
  cyan.position.set(10, 4, 10);
  scene.add(cyan);

  const mag = new THREE.PointLight(0xff3cff, 2.0, 70);
  mag.position.set(-10, 4, -10);
  scene.add(mag);

  // ------------------ MATERIALS ------------------
  const matFloor = new THREE.MeshStandardMaterial({ color:0x141421, roughness:0.85, metalness:0.08, side:THREE.DoubleSide });
  const matRing  = new THREE.MeshStandardMaterial({ color:0x0f0f18, roughness:0.88, metalness:0.10, side:THREE.DoubleSide });
  const matWall  = new THREE.MeshStandardMaterial({ color:0x1a1a28, roughness:0.92, metalness:0.05, side:THREE.DoubleSide });
  const matPit   = new THREE.MeshStandardMaterial({ color:0x090913, roughness:0.96, metalness:0.02, side:THREE.DoubleSide });
  const matRail  = new THREE.MeshStandardMaterial({ color:0x202033, roughness:0.35, metalness:0.85 });
  const matNeon  = new THREE.MeshStandardMaterial({ color:0x120818, roughness:0.3, metalness:0.2, emissive:0x7a45ff, emissiveIntensity:1.2, side:THREE.DoubleSide });

  // ------------------ FLOOR (beautified radial) ------------------
  const floor = new THREE.Mesh(new THREE.CircleGeometry(OUTER_R, 120), matFloor);
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  floor.userData.teleportable = true;
  scene.add(floor);

  // floor neon rings
  for (let i=0;i<3;i++){
    const r = OUTER_R - 4.0 - i*4.0;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.06, 10, 240),
      new THREE.MeshStandardMaterial({ color:0x101020, emissive:0x2bd6ff, emissiveIntensity:0.35, roughness:0.5, metalness:0.2 })
    );
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.02;
    scene.add(ring);
  }

  // ------------------ OPEN PIT (NO CAP DISK) ------------------
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(PIT_R, PIT_R, PIT_DEPTH, 128, 1, true),
    matPit
  );
  pitWall.position.y = -PIT_DEPTH/2;
  pitWall.rotation.y = Math.PI;
  scene.add(pitWall);

  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(PIT_R-0.05, 100),
    new THREE.MeshStandardMaterial({ color:0x06060b, roughness:0.98, metalness:0.02, emissive:0x1a0830, emissiveIntensity:0.35, side:THREE.DoubleSide })
  );
  pitBottom.rotation.x = -Math.PI/2;
  pitBottom.position.y = -PIT_DEPTH;
  pitBottom.userData.teleportable = true;
  scene.add(pitBottom);

  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(PIT_R+0.15, 0.08, 12, 240),
    matNeon
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.65;
  scene.add(pitLip);

  // ------------------ RING WALKWAY ------------------
  const ring = new THREE.Mesh(new THREE.RingGeometry(RING_INNER, RING_OUTER, 160), matRing);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.01;
  ring.userData.teleportable = true;
  scene.add(ring);

  // ------------------ WALLS + CEILING ------------------
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

  // ceiling crown neon
  for (let i=0;i<2;i++){
    const rr = OUTER_R - 1.4 - i*1.0;
    const crown = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.10, 12, 260), matNeon);
    crown.rotation.x = Math.PI/2;
    crown.position.y = WALL_H - 0.6 - i*0.65;
    scene.add(crown);
  }

  // ------------------ PIT RAIL POSTS + RAIL ------------------
  const railTop = new THREE.Mesh(new THREE.TorusGeometry(PIT_R+0.55, 0.06, 10, 240), matRail);
  railTop.rotation.x = Math.PI/2;
  railTop.position.y = 1.05;
  scene.add(railTop);

  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 10);
  const postCount = 56;
  const gap = Math.PI/9;

  for (let i=0;i<postCount;i++){
    const a=(i/postCount)*Math.PI*2;
    const da = Math.atan2(Math.sin(a-ENTRY_ANGLE), Math.cos(a-ENTRY_ANGLE));
    if (Math.abs(da) < gap) continue;

    const p = new THREE.Mesh(postGeo, matRail);
    p.position.set(Math.cos(a)*(PIT_R+0.55), 0.55, Math.sin(a)*(PIT_R+0.55));
    scene.add(p);
  }

  // ------------------ STAIRS DOWN INTO PIT ------------------
  const stair = new THREE.Group();
  scene.add(stair);

  const steps = 14;
  const stepW = 2.8;
  const stepH = PIT_DEPTH/steps;
  const stepD = 0.55;
  const stepMat = new THREE.MeshStandardMaterial({ color:0x171726, roughness:0.85, metalness:0.08 });

  for (let i=0;i<steps;i++){
    const t=i/(steps-1);
    const y = -t*PIT_DEPTH + stepH*0.5;
    const r = PIT_R + 0.8 + t*2.4;
    const x = Math.cos(ENTRY_ANGLE)*r;
    const z = Math.sin(ENTRY_ANGLE)*r;

    const s = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), stepMat);
    s.position.set(x,y,z);
    s.lookAt(0,y,0);
    stair.add(s);
  }

  // ------------------ BALCONY + RAILS ------------------
  const balcony = new THREE.Mesh(
    new THREE.RingGeometry(RING_INNER+1.0, RING_OUTER-1.0, 160),
    new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.9, metalness:0.08, side:THREE.DoubleSide })
  );
  balcony.rotation.x = -Math.PI/2;
  balcony.position.y = BALCONY_Y;
  balcony.userData.teleportable = true;
  scene.add(balcony);

  const bOuter = new THREE.Mesh(new THREE.TorusGeometry(RING_OUTER-1.2, 0.07, 10, 240), matRail);
  bOuter.rotation.x = Math.PI/2;
  bOuter.position.y = BALCONY_Y + 1.1;
  scene.add(bOuter);

  const bInner = new THREE.Mesh(new THREE.TorusGeometry(RING_INNER+1.2, 0.07, 10, 240), matRail);
  bInner.rotation.x = Math.PI/2;
  bInner.position.y = BALCONY_Y + 1.1;
  scene.add(bInner);

  // ------------------ 4 JUMBOTRONS ------------------
  const screens = [];
  const screenGeo = new THREE.PlaneGeometry(7.2, 3.8);

  function makeScreen(angle){
    const mat = new THREE.MeshStandardMaterial({
      color:0x07070c,
      roughness:0.45,
      metalness:0.12,
      emissive:0x2b1bff,
      emissiveIntensity:2.2,
      side:THREE.DoubleSide
    });
    const m = new THREE.Mesh(screenGeo, mat);
    const r = OUTER_R - 0.45;
    m.position.set(Math.cos(angle)*r, 4.9, Math.sin(angle)*r);
    m.lookAt(0, 4.9, 0);
    scene.add(m);
    screens.push(m);

    // sign under it
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 0.85),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, emissive:0x7a45ff, emissiveIntensity:1.4, roughness:0.6, metalness:0.1, side:THREE.DoubleSide })
    );
    sign.position.set(Math.cos(angle)*(OUTER_R-0.6), 2.35, Math.sin(angle)*(OUTER_R-0.6));
    sign.lookAt(0, 2.35, 0);
    scene.add(sign);
  }

  makeScreen(Math.PI*0.25);
  makeScreen(Math.PI*0.75);
  makeScreen(Math.PI*1.25);
  makeScreen(Math.PI*1.75);

  // ------------------ STORE: PEDESTALS + BIG SIGN ------------------
  const store = new THREE.Group();
  scene.add(store);

  const storeItems = ["STORE","AVATARS","CARDS","CHIPS","MUSIC","TV","LIGHTS","THEME"];

  function makeLabel(text){
    const c=document.createElement('canvas');
    c.width=512; c.height=256;
    const g=c.getContext('2d');

    g.fillStyle='rgba(10,12,18,0.9)';
    g.fillRect(0,0,c.width,c.height);

    g.strokeStyle='rgba(125,95,255,0.6)';
    g.lineWidth=10;
    g.strokeRect(16,16,c.width-32,c.height-32);

    g.fillStyle='rgba(255,255,255,0.96)';
    g.font='900 58px system-ui, Arial';
    g.textAlign='center';
    g.textBaseline='middle';
    g.fillText(text, c.width/2, c.height/2 - 10);

    g.fillStyle='rgba(230,236,252,0.85)';
    g.font='800 26px system-ui, Arial';
    g.fillText('point + trigger', c.width/2, c.height/2 + 58);

    const tex=new THREE.CanvasTexture(c);
    tex.needsUpdate=true;
    return tex;
  }

  const pedMat = new THREE.MeshStandardMaterial({ color:0x12121c, roughness:0.7, metalness:0.22, emissive:0x1b0b2a, emissiveIntensity:0.15 });
  const pedGlow = new THREE.MeshStandardMaterial({ color:0x7a45ff, emissive:0x7a45ff, emissiveIntensity:1.4, roughness:0.3, metalness:0.05 });

  const storeRadius = RING_OUTER - 3.8;
  const storeY = 0;

  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    const pedestal=new THREE.Group();
    pedestal.position.set(Math.cos(a)*storeRadius, storeY, Math.sin(a)*storeRadius);
    pedestal.lookAt(0, 1.0, 0);

    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 0.72, 32), pedMat);
    base.position.y=0.36;
    pedestal.add(base);

    const ringGlow=new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.07, 12, 80), pedGlow);
    ringGlow.rotation.x=Math.PI/2;
    ringGlow.position.y=0.03;
    pedestal.add(ringGlow);

    const card=new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.75),
      new THREE.MeshStandardMaterial({ map:makeLabel(storeItems[i]), transparent:true, roughness:0.7, metalness:0.05, emissive:0x220b44, emissiveIntensity:0.35, side:THREE.DoubleSide })
    );
    card.position.set(0, 2.2, 0);
    pedestal.add(card);

    pedestal.userData.storeItem = storeItems[i];
    store.add(pedestal);
  }

  // giant store banner
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(9.0, 2.2),
    new THREE.MeshStandardMaterial({ map:makeLabel("SCARLETT STORE"), transparent:true, emissive:0x2a0b44, emissiveIntensity:0.45, side:THREE.DoubleSide })
  );
  banner.position.set(0, 6.2, -(OUTER_R-0.55));
  banner.lookAt(0, 6.2, 0);
  scene.add(banner);

  // ------------------ HUMANOID BOTS (not pills) ------------------
  const bots = [];
  const botCount = 10;

  const botBody = new THREE.MeshStandardMaterial({ color:0x141420, roughness:0.55, metalness:0.45, emissive:0x120818, emissiveIntensity:0.18 });
  const botGlow = new THREE.MeshStandardMaterial({ color:0x7a45ff, roughness:0.3, metalness:0.1, emissive:0x7a45ff, emissiveIntensity:0.9 });

  function makeHumanoidBot(){
    const g = new THREE.Group();

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), botGlow);
    head.position.y = 1.55;
    g.add(head);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 8, 12), botBody);
    torso.position.y = 1.0;
    g.add(torso);

    const hip = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.22), botBody);
    hip.position.y = 0.65;
    g.add(hip);

    const legGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.55, 10);

    const legL = new THREE.Mesh(legGeo, botBody);
    legL.position.set(-0.10, 0.30, 0);
    g.add(legL);

    const legR = new THREE.Mesh(legGeo, botBody);
    legR.position.set(0.10, 0.30, 0);
    g.add(legR);

    const feet = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.08, 0.22), botBody);
    feet.position.y = 0.02;
    g.add(feet);

    return g;
  }

  for (let i=0;i<botCount;i++){
    const b = makeHumanoidBot();
    b.userData.a = (i/botCount)*Math.PI*2;
    b.userData.r = (RING_INNER + RING_OUTER)*0.5 + (i%2 ? 0.7 : -0.7);
    b.userData.speed = 0.45 + (i%3)*0.14;
    scene.add(b);
    bots.push(b);
  }

  // ------------------ CARDS: COMMUNITY FLIP LOOP ------------------
  const cardGroup = new THREE.Group();
  scene.add(cardGroup);

  cardGroup.position.set(0, 1.05, 0); // “center presentation” above pit rim
  // NOTE: no table yet — cards float over center so you can see the animation

  const cardFront = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.8, metalness:0.06, emissive:0x101020, emissiveIntensity:0.10, side:THREE.DoubleSide });
  const cardBack  = new THREE.MeshStandardMaterial({ color:0x7a45ff, roughness:0.6, metalness:0.12, emissive:0x7a45ff, emissiveIntensity:0.18, side:THREE.DoubleSide });

  function makeCard(){
    const g = new THREE.Group();
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.25), cardFront.clone());
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.25), cardBack.clone());
    b.rotation.y = Math.PI;
    g.add(f); g.add(b);
    g.rotation.x = -Math.PI/2;
    g.userData.front = f;
    g.userData.faceUp = false;
    return g;
  }

  const cards = [];
  const spacing = 1.0;
  for (let i=0;i<5;i++){
    const c = makeCard();
    c.position.set((i-2)*spacing, 0.0, 0.0);
    cardGroup.add(c);
    cards.push(c);
  }

  const communityColors = [0xffe066,0x66ffdd,0x66a3ff,0xff66cc,0xa6ff66];
  const flipCard = (card, up)=>{
    card.userData.faceUp = up;
    if (up){
      card.userData.front.material.color.setHex(communityColors[(Math.random()*communityColors.length)|0]);
      card.rotation.z = 0;
    } else {
      card.rotation.z = Math.PI;
    }
  };
  for (const c of cards) flipCard(c,false);

  // ------------------ MENU PANEL (ray-click) ------------------
  // Basic clickable targets: store toggles, spawn buttons, cards now, etc.
  const menu = new THREE.Group();
  scene.add(menu);

  // panel canvas
  const panelCanvas = document.createElement('canvas');
  panelCanvas.width = 1024;
  panelCanvas.height = 512;
  const pg = panelCanvas.getContext('2d');

  const panelTex = new THREE.CanvasTexture(panelCanvas);
  panelTex.needsUpdate = true;

  const panelMat = new THREE.MeshStandardMaterial({
    map: panelTex,
    transparent: true,
    roughness: 0.6,
    metalness: 0.1,
    emissive: 0x120818,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide
  });

  const panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), panelMat);
  panelMesh.position.set(0, 1.7, 10.5);
  panelMesh.lookAt(0, 1.6, 0);
  menu.add(panelMesh);

  // clickable “buttons” mapped in panel UV space (simple)
  const buttons = [
    { label:'SPAWN SAFE', x:60,  y:120, w:300, h:90, action:'spawnSafe' },
    { label:'SPAWN BALCONY', x:390, y:120, w:360, h:90, action:'spawnBalcony' },
    { label:'DEAL CARDS', x:60, y:240, w:300, h:90, action:'dealCards' },
    { label:'TOGGLE STORE GLOW', x:390, y:240, w:500, h:90, action:'toggleStore' },
  ];

  function drawPanel(){
    pg.clearRect(0,0,panelCanvas.width,panelCanvas.height);
    pg.fillStyle='rgba(10,12,18,0.86)';
    pg.fillRect(0,0,panelCanvas.width,panelCanvas.height);

    pg.strokeStyle='rgba(125,95,255,0.6)';
    pg.lineWidth=10;
    pg.strokeRect(18,18,panelCanvas.width-36,panelCanvas.height-36);

    pg.fillStyle='rgba(255,255,255,0.96)';
    pg.font='900 54px system-ui, Arial';
    pg.fillText('SCARLETT MENU', 60, 80);

    pg.font='800 32px system-ui, Arial';
    pg.fillStyle='rgba(230,236,252,0.86)';
    pg.fillText('Point + Trigger to click', 60, 115);

    for (const b of buttons){
      pg.fillStyle='rgba(30,22,55,0.82)';
      pg.fillRect(b.x,b.y,b.w,b.h);
      pg.strokeStyle='rgba(43,214,255,0.55)';
      pg.lineWidth=6;
      pg.strokeRect(b.x+6,b.y+6,b.w-12,b.h-12);

      pg.fillStyle='rgba(255,255,255,0.96)';
      pg.font='900 34px system-ui, Arial';
      pg.fillText(b.label, b.x+18, b.y+58);
    }

    panelTex.needsUpdate = true;
  }
  drawPanel();

  // ray-click helper: store intersections on panel then map to canvas coords
  function tryClickPanel(hit){
    if (!hit || hit.object !== panelMesh) return false;

    // hit.uv is panel UV 0..1
    const uv = hit.uv;
    if (!uv) return false;

    const px = uv.x * panelCanvas.width;
    const py = (1-uv.y) * panelCanvas.height;

    for (const b of buttons){
      if (px>=b.x && px<=b.x+b.w && py>=b.y && py<=b.y+b.h){
        onMenuAction(b.action);
        return true;
      }
    }
    return false;
  }

  let storeGlowOn = true;
  function onMenuAction(action){
    if (action === 'spawnSafe'){
      // Just set a good view point (teleport will move rig, but this is for non-xr fallback)
      if (rig) { rig.position.set(0,0,14.5); rig.rotation.y = Math.PI; }
      log('[menu] spawn safe');
    }
    if (action === 'spawnBalcony'){
      if (rig) { rig.position.set(0,0,RING_OUTER-4.0); rig.rotation.y = Math.PI; }
      log('[menu] spawn balcony (approx)');
    }
    if (action === 'dealCards'){
      for (const c of cards) flipCard(c,false);
      // flip in stages quickly
      flipCard(cards[0], true);
      flipCard(cards[1], true);
      flipCard(cards[2], true);
      setTimeout(()=> flipCard(cards[3], true), 500);
      setTimeout(()=> flipCard(cards[4], true), 900);
      log('[menu] deal cards');
    }
    if (action === 'toggleStore'){
      storeGlowOn = !storeGlowOn;
      for (const ped of store.children){
        for (const ch of ped.children){
          if (ch.material && ch.material.emissiveIntensity != null){
            ch.material.emissiveIntensity = storeGlowOn ? 1.0 : 0.15;
          }
        }
      }
      log('[menu] toggle store glow');
    }
  }

  // Let spine know panel is teleportable too if you want (optional)
  // panelMesh.userData.teleportable = false;

  // ------------------ CAMERA (non-XR) ------------------
  camera.position.set(0, 1.7, 14.5);
  camera.lookAt(0, 1.5, 0);

  // ------------------ UPDATE LOOP ------------------
  let t = 0;
  let dealT = 0;
  let dealStage = 0;

  function resetDeal(){
    for (const c of cards) flipCard(c,false);
    dealT = 0;
    dealStage = 0;
  }
  resetDeal();

  // Hook for “menu click” via controller ray:
  // Spine teleporter uses raycaster already; but we can still react if it hits panel.
  // We'll just expose a function that spine can optionally call later.
  window.__SCARLETT_WORLD_CLICK_PANEL__ = tryClickPanel;

  function update(dt){
    t += dt;

    // screens pulse
    const pulse = 1.7 + Math.sin(t*1.6)*0.55;
    for (const s of screens) s.material.emissiveIntensity = pulse;

    // pit neon pulse
    pitLip.material.emissiveIntensity = 1.0 + Math.sin(t*2.2)*0.3;

    // store labels bob
    for (const ped of store.children){
      ped.lookAt(0, 1.0, 0);
      const label = ped.children[ped.children.length-1];
      if (label) label.position.y = 2.2 + Math.sin(t*1.6 + ped.position.x*0.07)*0.06;
    }

    // bots walk ring
    for (const b of bots){
      b.userData.a += dt * b.userData.speed;
      const a = b.userData.a;
      const r = b.userData.r;
      b.position.set(Math.cos(a)*r, 0, Math.sin(a)*r);
      b.rotation.y = -(a + Math.PI*0.5);
      b.position.y = 0.02 + Math.sin(t*6 + a*3)*0.03;
    }

    // card loop (auto)
    dealT += dt;
    if (dealStage === 0 && dealT > 2.0){
      flipCard(cards[0], true); flipCard(cards[1], true); flipCard(cards[2], true);
      dealStage = 1;
    } else if (dealStage === 1 && dealT > 4.0){
      flipCard(cards[3], true);
      dealStage = 2;
    } else if (dealStage === 2 && dealT > 6.0){
      flipCard(cards[4], true);
      dealStage = 3;
    } else if (dealStage === 3 && dealT > 10.0){
      resetDeal();
    }
  }

  log('[world] V7 ready ✅ (MAX light, store+signs, jumbotrons, humanoid bots, cards, menu panel)');

  return {
    updates:[update],
    interactables:[],
    teleportSurfaces:[ ring, floor, balcony, pitBottom ]
  };
    }
