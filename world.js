/**
 * /js/scarlett1/world.js — PERMANENT
 * Fixes:
 *  - Walls pulled in (not too far)
 *  - More light
 *  - Smaller table
 *  - Balcony + store
 *  - Bots demo
 *  - Simple card demo (deal flop/turn/river loop)
 *  - Android joystick + look pad (non-XR only)
 *
 * Safe: NO imports.
 */

export async function init(ctx){
  const { THREE, scene, camera, rig, renderer, setXRSpawn, log } = ctx;

  // ======= SIZES (walls closer now) =======
  const holeR = 6.0;
  const outerR = 92.0;       // PULLED IN (was huge)
  const wallH  = 12.0;
  const ceilingY = wallH;

  const pitY  = -1.85;
  const entranceAngle = Math.PI/2;

  // Smaller table
  const TABLE_SCALE = 0.78;

  // ======= helpers =======
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const isXR=()=>!!(renderer && renderer.xr && renderer.xr.isPresenting);

  // IMPORTANT: Set XR spawn away from table center (fixes your Quest issue)
  // In XR we move the rig, NOT the camera.
  setXRSpawn?.(new THREE.Vector3(0, 0, 16), 0);

  // ============================================================
  // ANDROID MOVE + LOOK (NON-XR ONLY)
  // ============================================================
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

    const updateLook=(dt)=>{
      if(isXR()) { yawDelta=0; return; }
      if(Math.abs(yawDelta) < 0.00001) return;
      camera.rotation.order = "YXZ";
      camera.rotation.y -= yawDelta;
      yawDelta *= 0.34;
    };

    return { updateLook };
  }

  // ======= LIGHTING (BRIGHT) =======
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x303060, 1.05));

  const dir = new THREE.DirectionalLight(0xffffff, 1.45);
  dir.position.set(16, 22, 12);
  scene.add(dir);

  const topLight = new THREE.PointLight(0xffffff, 3.0, 260);
  topLight.position.set(0, ceilingY - 2.0, 0);
  scene.add(topLight);

  for (let i=0;i<22;i++){
    const a=(i/22)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.6, 120);
    p.position.set(Math.cos(a)*(outerR*0.55), 7.6, Math.sin(a)*(outerR*0.55));
    scene.add(p);
  }

  // ======= DECK (HOLE RING) =======
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 220, 1),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.95, metalness: 0.06, side:THREE.DoubleSide })
  );
  deck.rotation.x = -Math.PI/2;
  scene.add(deck);

  const grid = new THREE.GridHelper(outerR*2, 110, 0x2a2a44, 0x141422);
  grid.position.y = 0.02;
  scene.add(grid);

  // ======= OPEN PIT (NO DISK) =======
  const pit = new THREE.Group();
  const pitDepth = (0 - pitY);

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, pitDepth + 0.35, 220, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x05050b, roughness: 0.95, metalness: 0.06, side:THREE.DoubleSide })
  );
  pitWall.position.y = pitY + (pitDepth / 2);
  pit.add(pitWall);

  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.08, 0.055, 12, 240),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.25, roughness:0.35 })
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.03;
  pit.add(pitLip);

  scene.add(pit);

  // ======= LOBBY SHELL (WALLS CLOSER) =======
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

  // ======= BALCONY =======
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

  // ======= TABLE (SMALLER) + CHAIRS =======
  const tableGroup = new THREE.Group();
  tableGroup.position.y = pitY + 0.35;
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

  // ======= STORE (PEDESTALS) =======
  const store = new THREE.Group();
  const storeRadius = outerR - 14.0;

  const pedMat = new THREE.MeshStandardMaterial({ color:0x0b0b12, roughness:0.7, metalness:0.2, emissive:0x1b0b2a, emissiveIntensity:0.15 });
  const pedGlowMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.0, roughness:0.4 });

  const storeItems = ["STORE","AVATARS","CARDS","CHIPS","MUSIC","TV","LIGHTS","THEME"];

  function makeLabel(texText){
    const c=document.createElement('canvas');
    c.width=512; c.height=256;
    const g=c.getContext('2d');
    g.fillStyle='rgba(10,12,18,0.85)'; g.fillRect(0,0,c.width,c.height);
    g.strokeStyle='rgba(160,205,255,0.35)'; g.lineWidth=10; g.strokeRect(14,14,c.width-28,c.height-28);
    g.fillStyle='rgba(255,255,255,0.96)'; g.font='900 54px system-ui, Arial';
    g.textAlign='center'; g.textBaseline='middle';
    g.fillText(texText, c.width/2, c.height/2 - 6);
    g.fillStyle='rgba(230,236,252,0.80)'; g.font='700 26px system-ui, Arial';
    g.fillText('tap / point', c.width/2, c.height/2 + 54);
    const tex=new THREE.CanvasTexture(c);
    tex.needsUpdate=true;
    return tex;
  }

  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    const pedestal=new THREE.Group();
    pedestal.position.set(Math.cos(a)*storeRadius, 0, Math.sin(a)*storeRadius);
    pedestal.lookAt(0, 0.8, 0);

    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, 0.65, 28), pedMat);
    base.position.y=0.33;
    pedestal.add(base);

    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.10, 0.06, 12, 72), pedGlowMat);
    ring.rotation.x=Math.PI/2;
    ring.position.y=0.02;
    pedestal.add(ring);

    const card=new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 1.55),
      new THREE.MeshStandardMaterial({ map:makeLabel(storeItems[i]), transparent:true, roughness:0.85, metalness:0.05, emissive:0x2a0b44, emissiveIntensity:0.25 })
    );
    card.position.set(0, 2.05, 0);
    pedestal.add(card);

    store.add(pedestal);
  }
  scene.add(store);

  // ======= BOTS DEMO =======
  const bots = new THREE.Group();
  const botGeo = new THREE.CapsuleGeometry(0.22, 0.90, 6, 12);
  const botMats = [
    new THREE.MeshStandardMaterial({ color:0x2b5cff, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0xff3b7a, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0x00c2ff, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0x7cff4a, roughness:0.65 }),
  ];

  const botCount = 8;
  const botPathR = 9.2;
  const botY = pitY + 0.55;

  const botData = [];
  for(let i=0;i<botCount;i++){
    const mesh=new THREE.Mesh(botGeo, botMats[i%4]);
    bots.add(mesh);
    botData.push({ mesh, phase:(i/botCount)*Math.PI*2, speed:0.26 + (i%3)*0.02 });
  }
  scene.add(bots);

  // ======= CARD GAME DEMO (flop/turn/river loop) =======
  const cardGroup = new THREE.Group();
  cardGroup.position.y = pitY + 1.72;
  cardGroup.scale.setScalar(TABLE_SCALE);

  const cardMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.05,
    emissive: 0x101020,
    emissiveIntensity: 0.08
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x8a2be2,
    roughness: 0.6,
    metalness: 0.15,
    emissive: 0x8a2be2,
    emissiveIntensity: 0.15
  });

  function makeCard(){
    const g = new THREE.Group();
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.12), cardMat.clone());
    const back  = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.12), backMat.clone());
    back.rotation.y = Math.PI;
    g.add(front);
    g.add(back);
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
    // tint the front to simulate "different cards"
    if(faceUp){
      card.userData.front.material.color.setHex(communityColors[Math.floor(Math.random()*communityColors.length)]);
      card.rotation.z = 0;
    } else {
      card.rotation.z = Math.PI;
    }
  }

  // start all face-down
  for(const c of cards) flipCard(c,false);

  // ======= CAMERA DEFAULT (NON-XR) =======
  camera.position.set(0, 1.7, 16);
  camera.lookAt(0, 1.35, 0);

  // ======= ANDROID CONTROLS =======
  const moveStick = createMoveStick();
  const lookPad   = createLookPad();

  log('[world] walls pulled in + balcony + store + bots + cards ✅');
  log('[xr] spawn offset set (no more table-center) ✅');

  // ======= UPDATES =======
  let t = 0;
  let dealTimer = 0;
  let dealStage = 0; // 0=reset, 1=flop, 2=turn, 3=river, 4=show, loops

  function resetHand(){
    for(const c of cards) flipCard(c,false);
    dealStage = 0;
    dealTimer = 0;
  }

  resetHand();

  return {
    updates:[
      (dt)=> moveStick.updateMove(dt, 3.35),
      (dt)=> lookPad.updateLook(dt),

      (dt)=>{
        t += dt;

        // neon pulse
        neon.material.emissiveIntensity = 1.02 + Math.sin(t*1.35)*0.22;
        pitLip.material.emissiveIntensity = 1.15 + Math.sin(t*1.05 + 1.0)*0.20;

        // store cards bob + face center
        for(const ped of store.children){
          ped.lookAt(0, 0.8, 0);
          const card = ped.children[ped.children.length-1];
          if(card) card.position.y = 2.05 + Math.sin(t*1.4 + ped.position.x*0.02)*0.06;
        }

        // bots walking loop
        for(const b of botData){
          b.phase += dt * b.speed;
          const a = b.phase;
          b.mesh.position.set(Math.cos(a)*botPathR, botY + Math.sin(t*2.2 + a)*0.03, Math.sin(a)*botPathR);
          b.mesh.lookAt(0, botY, 0);
        }

        // card dealing loop (every ~10s)
        dealTimer += dt;

        if(dealStage === 0 && dealTimer > 2.0){
          // flop
          flipCard(cards[0], true);
          flipCard(cards[1], true);
          flipCard(cards[2], true);
          dealStage = 1;
        } else if(dealStage === 1 && dealTimer > 4.5){
          // turn
          flipCard(cards[3], true);
          dealStage = 2;
        } else if(dealStage === 2 && dealTimer > 6.8){
          // river
          flipCard(cards[4], true);
          dealStage = 3;
        } else if(dealStage === 3 && dealTimer > 10.0){
          resetHand();
        }
      }
    ],
    interactables:[]
  };
      }
