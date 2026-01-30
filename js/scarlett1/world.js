/**
 * /js/scarlett1/world.js — PERMANENT FULL LOBBY + PIT + GAME + AVATARS
 * Safe rules:
 *  - NO bare imports
 *  - Works with Spine ctx providing THREE
 *  - Uses GLTFLoader ONLY if already injected by spine; otherwise falls back to simple avatar capsules
 */

export async function init(ctx){
  const { THREE, scene, camera, rig, renderer, setXRSpawn, log } = ctx;

  // ==========================
  // CONFIG (YOUR REQUESTS)
  // ==========================
  const holeR   = 6.0;     // pit radius
  const outerR  = 92.0;    // lobby radius
  const wallH   = 12.0;
  const ceilingY = wallH;

  // Make the hole "deeper" (negative 1.6 deeper from before)
  // Was pitY=-1.85, now -3.45
  const pitY = -3.45;

  // Pedestal should show (table sits on it)
  const pedestalTopY = pitY + 2.15; // visible above pit bottom

  // Table scale smaller
  const TABLE_SCALE = 0.78;

  // Jumbotron placement radius (near wall)
  const jR = outerR - 10.5;

  // Doors under jumbotrons
  const doorW = 6.0, doorH = 5.0;

  // ==========================
  // HELPERS
  // ==========================
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const isXR = ()=>!!(renderer && renderer.xr && renderer.xr.isPresenting);

  // IMPORTANT: XR spawn away from table center
  setXRSpawn?.(new THREE.Vector3(0, 0, 16), 0);

  // ==========================
  // ANDROID MOVE + LOOK (NON-XR ONLY)
  // ==========================
  function bringToFront(el){
    el.style.zIndex='999999';
    el.style.pointerEvents='auto';
  }

  function createMoveStick({ size=124, margin=18, deadzone=0.12 } = {}) {
    const root = document.createElement("div");
    root.id="scarlett-move-stick";
    root.style.cssText = `
      position:fixed; left:${margin}px; bottom:${margin}px;
      width:${size}px; height:${size}px; border-radius:999px;
      background:rgba(255,255,255,0.18);
      border:1px solid rgba(255,255,255,0.24);
      touch-action:none; user-select:none;
    `;
    bringToFront(root);

    const knob = document.createElement("div");
    knob.style.cssText = `
      position:absolute; left:50%; top:50%;
      transform:translate(-50%,-50%);
      width:${size*0.44}px; height:${size*0.44}px; border-radius:999px;
      background:rgba(0,0,0,0.36);
      border:1px solid rgba(255,255,255,0.22);
      box-shadow:0 10px 30px rgba(0,0,0,0.35);
    `;
    root.appendChild(knob);
    document.body.appendChild(root);

    let active=false, pid=null, cx=0, cy=0;
    let x=0, y=0;

    const setKnob=(nx,ny)=>{
      const r=(size*0.5)-(size*0.22);
      knob.style.transform=`translate(calc(-50% + ${nx*r}px), calc(-50% + ${ny*r}px))`;
    };
    const reset=()=>{ active=false; pid=null; x=0; y=0; setKnob(0,0); };

    const onDown=(e)=>{
      active=true; pid=e.pointerId;
      root.setPointerCapture(pid);
      const rect=root.getBoundingClientRect();
      cx=rect.left+rect.width/2;
      cy=rect.top+rect.height/2;
      onMove(e);
    };
    const onMove=(e)=>{
      if(!active || e.pointerId!==pid) return;
      let nx=(e.clientX-cx)/(size*0.5);
      let ny=(e.clientY-cy)/(size*0.5);
      const mag=Math.hypot(nx,ny);
      if(mag>1){ nx/=mag; ny/=mag; }
      if(Math.hypot(nx,ny)<deadzone){ nx=0; ny=0; }
      x=clamp(nx,-1,1); y=clamp(ny,-1,1);
      setKnob(x,y);
    };
    const onUp=(e)=>{
      if(e.pointerId!==pid) return;
      try{ root.releasePointerCapture(pid);}catch{}
      reset();
    };

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);

    const updateMove=(dt, speed=3.3)=>{
      if(isXR()) return;

      const strafe=x;
      const forward=-y;
      if(Math.abs(strafe)<0.001 && Math.abs(forward)<0.001) return;

      const vF=new THREE.Vector3();
      camera.getWorldDirection(vF);
      vF.y=0; vF.normalize();
      const vR=new THREE.Vector3().crossVectors(vF, new THREE.Vector3(0,1,0)).normalize();

      const move=new THREE.Vector3()
        .addScaledVector(vF, forward)
        .addScaledVector(vR, strafe);

      if(move.lengthSq()>0){
        move.normalize().multiplyScalar(speed*dt);
        camera.position.add(move);
      }
    };

    return { updateMove };
  }

  function createLookPad({ width=170, height=170, margin=18, sensitivity=1.75 } = {}) {
    const pad=document.createElement("div");
    pad.id="scarlett-look-pad";
    pad.style.cssText=`
      position:fixed; right:${margin}px; bottom:${margin}px;
      width:${width}px; height:${height}px; border-radius:22px;
      background:rgba(255,255,255,0.09);
      border:1px solid rgba(255,255,255,0.20);
      touch-action:none; user-select:none;
    `;
    bringToFront(pad);

    const label=document.createElement("div");
    label.textContent="LOOK";
    label.style.cssText=`
      position:absolute; left:12px; top:10px;
      font:800 12px system-ui; letter-spacing:.14em;
      opacity:.7; color:white;
    `;
    pad.appendChild(label);
    document.body.appendChild(pad);

    let active=false, pid=null, lastX=0;
    let yawDelta=0;

    pad.addEventListener("pointerdown",(e)=>{
      active=true; pid=e.pointerId;
      pad.setPointerCapture(pid);
      lastX=e.clientX;
    });
    pad.addEventListener("pointermove",(e)=>{
      if(!active || e.pointerId!==pid) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      yawDelta += (dx / 220) * sensitivity;
    });
    const end=(e)=>{
      if(e.pointerId!==pid) return;
      try{ pad.releasePointerCapture(pid);}catch{}
      active=false; pid=null; lastX=0;
    };
    pad.addEventListener("pointerup", end);
    pad.addEventListener("pointercancel", end);

    const updateLook=()=>{
      if(isXR()) { yawDelta=0; return; }
      if(Math.abs(yawDelta) < 0.00001) return;
      camera.rotation.order = "YXZ";
      camera.rotation.y -= yawDelta;
      yawDelta *= 0.34;
    };

    return { updateLook };
  }

  // ==========================
  // LIGHTING (BRIGHT)
  // ==========================
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x303060, 1.05));

  const dir = new THREE.DirectionalLight(0xffffff, 1.45);
  dir.position.set(16, 22, 12);
  scene.add(dir);

  const topLight = new THREE.PointLight(0xffffff, 3.0, 300);
  topLight.position.set(0, ceilingY - 2.0, 0);
  scene.add(topLight);

  // purple ring lights
  for (let i=0;i<22;i++){
    const a=(i/22)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.6, 120);
    p.position.set(Math.cos(a)*(outerR*0.55), 7.6, Math.sin(a)*(outerR*0.55));
    scene.add(p);
  }

  // ==========================
  // FLOOR DECK + GRID
  // ==========================
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 220, 1),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.95, metalness: 0.06, side:THREE.DoubleSide })
  );
  deck.rotation.x = -Math.PI/2;
  scene.add(deck);

  const grid = new THREE.GridHelper(outerR*2, 110, 0x2a2a44, 0x141422);
  grid.position.y = 0.02;
  scene.add(grid);

  // ==========================
  // PIT (OPEN)
  // ==========================
  const pit = new THREE.Group();
  const pitDepth = (0 - pitY);

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, pitDepth + 0.35, 220, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x05050b, roughness: 0.95, metalness: 0.06, side:THREE.DoubleSide })
  );
  pitWall.position.y = pitY + (pitDepth / 2);
  pit.add(pitWall);

  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(holeR, 220),
    new THREE.MeshStandardMaterial({ color:0x040409, roughness:1.0, metalness:0.04 })
  );
  pitBottom.rotation.x = -Math.PI/2;
  pitBottom.position.y = pitY;
  pit.add(pitBottom);

  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.08, 0.055, 12, 240),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.25, roughness:0.35 })
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.03;
  pit.add(pitLip);

  scene.add(pit);

  // ==========================
  // LOBBY SHELL (WALLS + CEILING)
  // ==========================
  const shell = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x05050b, roughness:0.95, metalness:0.06, side:THREE.DoubleSide });

  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, wallH, 240, 1, true), wallMat);
  outerWall.position.y = wallH/2;
  shell.add(outerWall);

  const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR-1.0, outerR-1.0, wallH, 240, 1, true), wallMat);
  innerWall.position.y = wallH/2;
  shell.add(innerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 220, 1),
    new THREE.MeshStandardMaterial({ color: 0x040409, roughness:1.0, metalness:0.04, side:THREE.DoubleSide })
  );
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = ceilingY;
  shell.add(ceiling);

  const crownMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.55, roughness:0.45 });
  for (let i=0;i<3;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(outerR-2.2-i*1.0, 0.08, 12, 240), crownMat);
    ring.rotation.x = Math.PI/2;
    ring.position.y = ceilingY - 0.8 - i*0.8;
    shell.add(ring);
  }
  scene.add(shell);

  // ==========================
  // BALCONY RING
  // ==========================
  const balcony = new THREE.Group();
  const by = 7.2;

  const innerB = outerR - 10.0;
  const outerB = outerR - 5.0;

  const bDeck = new THREE.Mesh(
    new THREE.RingGeometry(innerB, outerB, 240, 1),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide })
  );
  bDeck.rotation.x = -Math.PI/2;
  bDeck.position.y = by;
  balcony.add(bDeck);

  const bRail = new THREE.Mesh(
    new THREE.TorusGeometry(outerB-0.55, 0.06, 10, 260),
    new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.5, metalness:0.35 })
  );
  bRail.rotation.x = Math.PI/2;
  bRail.position.y = by+1.05;
  balcony.add(bRail);

  scene.add(balcony);

  // ==========================
  // PEDESTAL + TABLE ON TOP (CENTER)
  // ==========================
  const center = new THREE.Group();
  center.position.set(0, 0, 0);
  center.position.y = pitY; // base down in pit

  const pedMat = new THREE.MeshStandardMaterial({
    color:0x0b0b12, roughness:0.7, metalness:0.2,
    emissive:0x1b0b2a, emissiveIntensity:0.15
  });
  const pedGlow = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.0, roughness:0.35
  });

  // Cylinder pedestal body
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(4.25, 4.75, pedestalTopY - pitY, 96, 1, false),
    pedMat
  );
  pedestal.position.y = (pedestalTopY - pitY)/2;
  center.add(pedestal);

  // Glow ring at top of pedestal
  const pedRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.65, 0.08, 12, 160),
    pedGlow
  );
  pedRing.rotation.x = Math.PI/2;
  pedRing.position.y = pedestalTopY - pitY + 0.03;
  center.add(pedRing);

  scene.add(center);

  // Table group sits at pedestal top
  const tableGroup = new THREE.Group();
  tableGroup.position.y = pedestalTopY + 0.05;
  tableGroup.scale.setScalar(TABLE_SCALE);

  const tableBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 3.0, 1.25, 56),
    new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.55, metalness:0.35, emissive:0x8a2be2, emissiveIntensity:0.25 })
  );
  tableBase.position.y = 0.68;
  tableGroup.add(tableBase);

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(5.1, 5.1, 0.32, 120),
    new THREE.MeshStandardMaterial({ color:0x07070c, roughness:0.85, metalness:0.12 })
  );
  tableTop.position.y = 1.48;
  tableGroup.add(tableTop);

  const neon = new THREE.Mesh(
    new THREE.TorusGeometry(5.25, 0.06, 10, 220),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.15, roughness:0.4 })
  );
  neon.rotation.x = Math.PI/2;
  neon.position.y = 1.62;
  tableGroup.add(neon);

  // Chairs
  const chairMat = new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.65, metalness:0.25 });
  const chairGlow = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.7, roughness:0.4 });
  const chairDist = 6.75;

  for (let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    const chair = new THREE.Group();
    chair.position.set(Math.cos(a)*chairDist, 0, Math.sin(a)*chairDist);
    chair.lookAt(0, 0.8, 0);

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.92, 0.20, 28), chairMat);
    seat.position.y = 0.80;
    chair.add(seat);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.05, 10, 44), chairGlow);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.05;
    chair.add(ring);

    tableGroup.add(chair);
  }

  scene.add(tableGroup);

  // ==========================
  // 4 JUMBOTRONS + DOORS UNDER THEM
  // ==========================
  const jumboGroup = new THREE.Group();

  function makeJumboTexture(title){
    const c=document.createElement("canvas");
    c.width=1024; c.height=512;
    const g=c.getContext("2d");
    g.fillStyle="#05050b"; g.fillRect(0,0,c.width,c.height);
    g.fillStyle="rgba(138,43,226,0.14)"; g.fillRect(0,0,c.width,c.height);
    g.strokeStyle="rgba(200,220,255,0.25)";
    g.lineWidth=14; g.strokeRect(18,18,c.width-36,c.height-36);

    g.fillStyle="rgba(255,255,255,0.95)";
    g.font="900 64px system-ui, Arial";
    g.textAlign="center"; g.textBaseline="middle";
    g.fillText("SCARLETTVR", c.width/2, 150);

    g.fillStyle="rgba(240,240,255,0.92)";
    g.font="900 72px system-ui, Arial";
    g.fillText(title, c.width/2, 270);

    g.fillStyle="rgba(230,236,252,0.75)";
    g.font="700 34px system-ui, Arial";
    g.fillText("LIVE TABLE • MUSIC • AVATARS", c.width/2, 380);

    const tex=new THREE.CanvasTexture(c);
    tex.needsUpdate=true;
    return tex;
  }

  const jumboTitles = ["TABLE", "AVATARS", "MUSIC", "TV"];
  const jumboTex = jumboTitles.map(makeJumboTexture);

  for(let i=0;i<4;i++){
    const a = (i/4)*Math.PI*2 + Math.PI/4; // rotate to "corner" positions
    const jumbo = new THREE.Group();

    // position
    jumbo.position.set(Math.cos(a)*jR, 7.4, Math.sin(a)*jR);
    jumbo.lookAt(0, 7.4, 0);

    // screen
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 9),
      new THREE.MeshStandardMaterial({
        map: jumboTex[i],
        roughness: 0.75,
        metalness: 0.1,
        emissive: 0xffffff,
        emissiveIntensity: 0.35
      })
    );
    screen.position.set(0, 0, 0);
    jumbo.add(screen);

    // frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(16.6, 9.6, 0.35),
      new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.55, metalness:0.35, emissive:0x1b0b2a, emissiveIntensity:0.2 })
    );
    frame.position.z = -0.22;
    jumbo.add(frame);

    // door under it (on floor)
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(doorW, doorH),
      new THREE.MeshStandardMaterial({ color:0x0b0b12, roughness:0.9, metalness:0.05, emissive:0x8a2be2, emissiveIntensity:0.08 })
    );
    // door position: same angle, but down at wall and floor height
    door.position.set(Math.cos(a)*(outerR-0.9), doorH/2 + 0.02, Math.sin(a)*(outerR-0.9));
    door.lookAt(0, door.position.y, 0);
    jumboGroup.add(door);

    jumboGroup.add(jumbo);
  }
  scene.add(jumboGroup);

  // ==========================
  // COMMUNITY CARDS DEMO (ON TABLE)
  // ==========================
  const cardGroup = new THREE.Group();
  cardGroup.position.y = pedestalTopY + 1.72;
  cardGroup.scale.setScalar(TABLE_SCALE);

  const cardMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.85, metalness: 0.05,
    emissive: 0x101020, emissiveIntensity: 0.08
  });
  const backMat = new THREE.MeshStandardMaterial({
    color: 0x8a2be2, roughness: 0.6, metalness: 0.15,
    emissive: 0x8a2be2, emissiveIntensity: 0.15
  });

  function makeCard(){
    const g = new THREE.Group();
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.12), cardMat.clone());
    const back  = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.12), backMat.clone());
    back.rotation.y = Math.PI;
    g.add(front); g.add(back);
    g.rotation.x = -Math.PI/2;
    g.userData.isFaceUp = false;
    g.userData.front = front;
    return g;
  }

  const cards = [];
  const spacing = 0.92;
  for(let i=0;i<5;i++){
    const c = makeCard();
    c.position.set((i-2)*spacing, 0.01, 0);
    cardGroup.add(c);
    cards.push(c);
  }
  scene.add(cardGroup);

  const communityColors = [0xffe066,0x66ffdd,0x66a3ff,0xff66cc,0xa6ff66];

  function flipCard(card, faceUp){
    card.userData.isFaceUp = faceUp;
    if(faceUp){
      card.userData.front.material.color.setHex(communityColors[(Math.random()*communityColors.length)|0]);
      card.rotation.z = 0;
    } else {
      card.rotation.z = Math.PI;
    }
  }
  for(const c of cards) flipCard(c,false);

  // ==========================
  // BOTS WALKING DEMO
  // ==========================
  const bots = new THREE.Group();
  const botGeo = new THREE.CapsuleGeometry(0.22, 0.90, 6, 12);
  const botMats = [
    new THREE.MeshStandardMaterial({ color:0x2b5cff, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0xff3b7a, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0x00c2ff, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0x7cff4a, roughness:0.65 }),
  ];

  const botCount = 10;
  const botPathR = 13.2;
  const botY = pedestalTopY + 0.55;

  const botData = [];
  for(let i=0;i<botCount;i++){
    const mesh=new THREE.Mesh(botGeo, botMats[i%4]);
    bots.add(mesh);
    botData.push({ mesh, phase:(i/botCount)*Math.PI*2, speed:0.22 + (i%4)*0.02 });
  }
  scene.add(bots);

  // ==========================
  // AVATARS (YOUR GLBS) — SAFE LOADER
  // ==========================
  const avatarGroup = new THREE.Group();
  scene.add(avatarGroup);

  const avatarPaths = [
    "./assets/avatars/male.glb",
    "./assets/avatars/female.glb",
    "./assets/avatars/ninja.glb",
    "./assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb",
    "./assets/avatars/futuristic_apocalypse_female_cargo_pants.glb",
  ];

  // We can ONLY load if GLTFLoader is already present somewhere.
  // (Many modules add it; if not, we fallback to simple capsules.)
  const GLTFLoader = THREE?.GLTFLoader || window?.THREE?.GLTFLoader || window?.GLTFLoader;

  async function spawnAvatarFallback(x,z,color=0xffffff){
    const g=new THREE.Group();
    const body=new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 1.2, 8, 14),
      new THREE.MeshStandardMaterial({ color, roughness:0.6, metalness:0.1 })
    );
    body.position.y=1.0;
    g.add(body);
    g.position.set(x,0,z);
    g.lookAt(0,1.2,0);
    avatarGroup.add(g);
  }

  async function spawnGLB(path, x, z, scale=1.0){
    if(!GLTFLoader) return false;
    return new Promise((resolve)=>{
      try{
        const loader = new GLTFLoader();
        loader.load(path, (gltf)=>{
          const m = gltf.scene || gltf.scenes?.[0];
          if(!m) return resolve(false);
          m.traverse(o=>{
            if(o.isMesh){
              o.castShadow=false; o.receiveShadow=false;
              if(o.material){
                o.material.roughness = (o.material.roughness ?? 0.8);
                o.material.metalness = (o.material.metalness ?? 0.1);
              }
            }
          });
          m.scale.setScalar(scale);
          m.position.set(x,0,z);
          m.lookAt(0,1.2,0);
          avatarGroup.add(m);
          resolve(true);
        }, undefined, ()=>resolve(false));
      }catch{ resolve(false); }
    });
  }

  // Put avatars near the pit edge, evenly spaced
  const aR = holeR + 4.5;
  const avatarColors = [0xddddff,0xffdddd,0xddffdd,0xffffff,0xffe066];

  for(let i=0;i<5;i++){
    const a=(i/5)*Math.PI*2;
    const x=Math.cos(a)*aR;
    const z=Math.sin(a)*aR;
    const ok = await spawnGLB(avatarPaths[i], x, z, 1.15);
    if(!ok) await spawnAvatarFallback(x,z,avatarColors[i%avatarColors.length]);
  }

  // ==========================
  // CAMERA DEFAULT (NON-XR)
  // ==========================
  camera.position.set(0, 1.7, 16);
  camera.lookAt(0, 1.35, 0);

  // ==========================
  // ANDROID CONTROLS
  // ==========================
  const moveStick = createMoveStick();
  const lookPad   = createLookPad();

  log("[world] FULL lobby + pit + pedestal + table + jumbotrons + doors + avatars ✅");

  // ==========================
  // UPDATES
  // ==========================
  let t=0;
  let dealTimer=0;
  let dealStage=0;

  function resetHand(){
    for(const c of cards) flipCard(c,false);
    dealStage=0;
    dealTimer=0;
  }
  resetHand();

  return {
    updates:[
      (dt)=> moveStick.updateMove(dt, 3.35),
      ()=> lookPad.updateLook(),

      (dt)=>{
        t += dt;

        // neon pulse
        neon.material.emissiveIntensity = 1.02 + Math.sin(t*1.35)*0.22;
        pitLip.material.emissiveIntensity = 1.15 + Math.sin(t*1.05 + 1.0)*0.20;
        pedRing.material.emissiveIntensity = 0.95 + Math.sin(t*1.25)*0.22;

        // bots loop
        for(const b of botData){
          b.phase += dt * b.speed;
          const a = b.phase;
          b.mesh.position.set(Math.cos(a)*botPathR, botY + Math.sin(t*2.2 + a)*0.05, Math.sin(a)*botPathR);
          b.mesh.lookAt(0, botY, 0);
        }

        // card dealing loop
        dealTimer += dt;
        if(dealStage === 0 && dealTimer > 2.0){
          flipCard(cards[0], true);
          flipCard(cards[1], true);
          flipCard(cards[2], true);
          dealStage = 1;
        } else if(dealStage === 1 && dealTimer > 4.5){
          flipCard(cards[3], true);
          dealStage = 2;
        } else if(dealStage === 2 && dealTimer > 6.8){
          flipCard(cards[4], true);
          dealStage = 3;
        } else if(dealStage === 3 && dealTimer > 10.0){
          resetHand();
        }

        // subtle jumbotron glow
        jumboGroup.children.forEach((obj)=>{
          if(obj.material && obj.material.emissiveIntensity !== undefined){
            obj.material.emissiveIntensity = 0.12 + Math.sin(t*1.1)*0.03;
          }
        });
      }
    ],
    interactables:[]
  };
}
