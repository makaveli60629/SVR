/**
 * /js/scarlett1/world.js — PERMANENT
 * BIGGER lobby + smaller table + brighter lights + open pit divot (NO disk)
 * + Android joystick (move) + look pad (turn)
 * + Store ring (pedestals + floating cards)
 * + Bots demo (walk loop around table)
 *
 * Safe: NO external imports.
 */

export async function init(ctx){
  const { THREE, scene, camera, log } = ctx;

  // ==========================
  // SCALE / LAYOUT
  // ==========================
  const holeR = 6.0;

  // "double size" lobby feel (bigger radius + taller walls)
  const outerR = 130.0;     // was ~70
  const wallH  = 15.5;      // taller walls
  const ceilingY = wallH;

  // Pit depth
  const pitY  = -1.85;      // slightly deeper
  const entranceAngle = Math.PI/2;

  // Smaller table (requested)
  const TABLE_SCALE = 0.78;

  // ==========================
  // HELPERS
  // ==========================
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  function isXRPresenting(){
    const r = window.__SCARLETT_RENDERER__;
    return !!(r && r.xr && r.xr.isPresenting);
  }

  function setLayerTop(el){
    el.style.zIndex = '999999';
    el.style.pointerEvents = 'auto';
  }

  // ==========================
  // ANDROID MOVE JOYSTICK (LEFT)
  // ==========================
  function createMoveStick({ size=120, margin=18, deadzone=0.12 } = {}) {
    const root = document.createElement("div");
    root.id = "scarlett-move-stick";
    root.style.cssText = `
      position:fixed; left:${margin}px; bottom:${margin}px;
      width:${size}px; height:${size}px; border-radius:999px;
      background:rgba(255,255,255,0.18);
      border:1px solid rgba(255,255,255,0.24);
      touch-action:none; user-select:none;
    `;
    setLayerTop(root);

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
      x=clamp(nx,-1,1);
      y=clamp(ny,-1,1);
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

    const updateMove=(dt, speed=3.25)=>{
      if(isXRPresenting()) return;

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

  // ==========================
  // ANDROID LOOK PAD (RIGHT)
  // ==========================
  function createLookPad({ width=160, height=160, margin=18, sensitivity=1.7 } = {}) {
    const pad=document.createElement("div");
    pad.id = "scarlett-look-pad";
    pad.style.cssText=`
      position:fixed; right:${margin}px; bottom:${margin}px;
      width:${width}px; height:${height}px; border-radius:22px;
      background:rgba(255,255,255,0.09);
      border:1px solid rgba(255,255,255,0.20);
      touch-action:none; user-select:none;
    `;
    setLayerTop(pad);

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
      if(isXRPresenting()) { yawDelta=0; return; }
      if(Math.abs(yawDelta) < 0.00001) return;

      camera.rotation.order = "YXZ";
      camera.rotation.y -= yawDelta;

      yawDelta *= 0.34;
    };

    return { updateLook };
  }

  // ==========================
  // LIGHTING (BRIGHTER)
  // ==========================
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x303060, 1.05);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.45);
  dir.position.set(18, 26, 14);
  scene.add(dir);

  const topLight = new THREE.PointLight(0xffffff, 3.2, 340);
  topLight.position.set(0, ceilingY - 2.0, 0);
  scene.add(topLight);

  // Purple perimeter lights (more + stronger + farther)
  for (let i=0;i<28;i++){
    const a=(i/28)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.9, 150);
    p.position.set(Math.cos(a)*(outerR*0.58), 8.2, Math.sin(a)*(outerR*0.58));
    scene.add(p);
  }

  // ==========================
  // UPPER DECK (RING WITH HOLE)
  // ==========================
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 240, 1),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b12,
      roughness: 0.95,
      metalness: 0.06,
      side: THREE.DoubleSide
    })
  );
  deck.rotation.x = -Math.PI/2;
  deck.position.y = 0;
  deck.name = "UpperDeck";
  scene.add(deck);

  const grid = new THREE.GridHelper(outerR*2, 120, 0x2a2a44, 0x141422);
  grid.position.y = 0.02;
  scene.add(grid);

  // ==========================
  // OPEN PIT DIVOT (NO DISK)
  // ==========================
  const pit = new THREE.Group(); pit.name="PitDivot";
  const pitDepth = (0 - pitY);

  const pitWallMat = new THREE.MeshStandardMaterial({
    color: 0x05050b, roughness: 0.95, metalness: 0.06, side: THREE.DoubleSide
  });

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, pitDepth + 0.35, 240, 1, true),
    pitWallMat
  );
  pitWall.position.y = pitY + (pitDepth / 2);
  pit.add(pitWall);

  const pitNeonMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.25, roughness:0.35
  });
  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.08, 0.055, 12, 260),
    pitNeonMat
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.03;
  pit.add(pitLip);

  // subtle fog tube
  const fogMat = new THREE.MeshStandardMaterial({
    color:0x000000, transparent:true, opacity:0.16,
    roughness:1.0, metalness:0.0, side:THREE.DoubleSide
  });
  const fog = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR-0.18, holeR-0.18, pitDepth, 160, 1, true),
    fogMat
  );
  fog.position.y = pitY + pitDepth/2;
  pit.add(fog);

  scene.add(pit);

  // ==========================
  // LOBBY SHELL (DOUBLE WALLS + CEILING)
  // ==========================
  const shell = new THREE.Group(); shell.name="LobbyShell";

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x05050b, roughness:0.95, metalness:0.06, side:THREE.DoubleSide
  });

  const outerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR, outerR, wallH, 280, 1, true),
    wallMat
  );
  outerWall.position.y = wallH/2;
  shell.add(outerWall);

  const innerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR-1.1, outerR-1.1, wallH, 280, 1, true),
    wallMat
  );
  innerWall.position.y = wallH/2;
  shell.add(innerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 260, 1),
    new THREE.MeshStandardMaterial({
      color: 0x040409, roughness:1.0, metalness:0.04, side:THREE.DoubleSide
    })
  );
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = ceilingY;
  shell.add(ceiling);

  // Neon crown rings
  const shellNeonMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.55, roughness:0.45
  });
  for (let i=0;i<4;i++){
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(outerR-2.4-i*1.15, 0.085, 12, 300),
      shellNeonMat
    );
    ring.rotation.x = Math.PI/2;
    ring.position.y = ceilingY - 0.9 - i*0.85;
    shell.add(ring);
  }

  scene.add(shell);

  // ==========================
  // RAIL AROUND HOLE (ENTRANCE GAP)
  // ==========================
  const rail = new THREE.Group(); rail.name="Rail";
  const railY = 1.05;
  const postMat = new THREE.MeshStandardMaterial({ color:0x12121a, roughness:0.8 });
  const railMat2 = new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.55, metalness:0.3 });

  const topRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.05, 12, 260), railMat2);
  topRing.rotation.x = Math.PI/2; topRing.position.y = railY; rail.add(topRing);

  const midRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.04, 12, 260), railMat2);
  midRing.rotation.x = Math.PI/2; midRing.position.y = railY-0.40; rail.add(midRing);

  const postGeo = new THREE.CylinderGeometry(0.06,0.06,1.05,14);
  const count = 84;
  const gap = Math.PI/10;
  for (let i=0;i<count;i++){
    const a=(i/count)*Math.PI*2;
    const da = Math.atan2(Math.sin(a-entranceAngle), Math.cos(a-entranceAngle));
    if (Math.abs(da) < gap) continue;
    const p = new THREE.Mesh(postGeo, postMat);
    p.position.set(Math.cos(a)*(holeR+0.85), 0.55, Math.sin(a)*(holeR+0.85));
    rail.add(p);
  }
  scene.add(rail);

  // ==========================
  // STAIRS INTO PIT (ENTRANCE)
  // ==========================
  const stairs = new THREE.Group(); stairs.name="Stairs";

  const steps = 16;
  const stepH = (0 - pitY)/steps;
  const stepD = 0.30;
  const w = 1.35;

  const stepMat = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.95 });
  const glowMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.05, roughness:0.45 });

  const startR = holeR+0.78;
  for (let i=0;i<steps;i++){
    const t=i/(steps-1);
    const y = 0 - t*(0-pitY) - stepH*0.5;
    const r = startR - t*1.45;
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, stepH*0.95, stepD), stepMat);
    s.position.set(Math.cos(entranceAngle)*r, y, Math.sin(entranceAngle)*r);
    s.rotation.y = -entranceAngle;
    stairs.add(s);
  }
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.05,(0-pitY)+0.25,0.05), glowMat);
  railL.position.set(Math.cos(entranceAngle)*(startR-0.18), (0+pitY)/2+0.12, Math.sin(entranceAngle)*(startR-0.18));
  railL.rotation.y = -entranceAngle; stairs.add(railL);

  const railR = railL.clone();
  railR.position.set(Math.cos(entranceAngle)*(startR+0.18), (0+pitY)/2+0.12, Math.sin(entranceAngle)*(startR+0.18));
  stairs.add(railR);

  scene.add(stairs);

  // ==========================
  // BALCONY RING (BIGGER)
  // ==========================
  const balcony = new THREE.Group(); balcony.name="Balcony";
  const by = 8.2;

  const innerB = outerR - 10.5;
  const outerB = outerR - 5.5;

  const bDeck = new THREE.Mesh(
    new THREE.RingGeometry(innerB, outerB, 280, 1),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide })
  );
  bDeck.rotation.x = -Math.PI/2;
  bDeck.position.y = by;
  balcony.add(bDeck);

  const bRail = new THREE.Mesh(
    new THREE.TorusGeometry(outerB-0.55, 0.06, 10, 320),
    new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.5, metalness:0.35 })
  );
  bRail.rotation.x = Math.PI/2;
  bRail.position.y = by+1.15;
  balcony.add(bRail);

  // balcony glow
  const bGlow = new THREE.Mesh(
    new THREE.TorusGeometry(innerB+0.55, 0.06, 10, 320),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.05, roughness:0.4 })
  );
  bGlow.rotation.x = Math.PI/2;
  bGlow.position.y = by+0.10;
  balcony.add(bGlow);

  scene.add(balcony);

  // ==========================
  // TABLE (SMALLER) + CHAIRS
  // ==========================
  const tableGroup = new THREE.Group(); tableGroup.name="NeonTable";
  tableGroup.position.y = pitY + 0.35;
  tableGroup.scale.setScalar(TABLE_SCALE);

  const tableBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 3.0, 1.25, 56),
    new THREE.MeshStandardMaterial({
      color:0x0b0b10, roughness:0.55, metalness:0.35,
      emissive:0x8a2be2, emissiveIntensity:0.28
    })
  );
  tableBase.position.y = 0.68;
  tableGroup.add(tableBase);

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(5.1, 5.1, 0.32, 120),
    new THREE.MeshStandardMaterial({ color:0x07070c, roughness:0.85, metalness:0.12 })
  );
  tableTop.position.y = 1.48;
  tableGroup.add(tableTop);

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(5.15, 0.19, 18, 180),
    new THREE.MeshStandardMaterial({ color:0x050508, roughness:0.55, metalness:0.25 })
  );
  trim.rotation.x = Math.PI/2;
  trim.position.y = 1.62;
  tableGroup.add(trim);

  const neon = new THREE.Mesh(
    new THREE.TorusGeometry(5.25, 0.06, 10, 220),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.15, roughness:0.4 })
  );
  neon.rotation.x = Math.PI/2;
  neon.position.y = 1.62;
  tableGroup.add(neon);

  // chairs
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

    const back = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.11, 14, 48, Math.PI), chairMat);
    back.rotation.x = Math.PI/2;
    back.rotation.z = Math.PI/2;
    back.position.set(0, 1.18, -0.34);
    chair.add(back);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.70, 12), chairMat);
    stem.position.y = 0.42;
    chair.add(stem);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.05, 10, 44), chairGlow);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.05;
    chair.add(ring);

    tableGroup.add(chair);
  }

  scene.add(tableGroup);

  // ==========================
  // STORE RING (PEDESTALS + FLOATING CARDS)
  // ==========================
  function makeCanvasLabel(text, { w=512, h=256 } = {}){
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');

    // background
    g.fillStyle = 'rgba(10,12,18,0.85)';
    g.fillRect(0,0,w,h);

    // border
    g.strokeStyle = 'rgba(160,205,255,0.35)';
    g.lineWidth = 10;
    g.strokeRect(14,14,w-28,h-28);

    // title
    g.fillStyle = 'rgba(255,255,255,0.96)';
    g.font = '900 54px system-ui, Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w/2, h/2 - 6);

    // subtitle
    g.fillStyle = 'rgba(230,236,252,0.80)';
    g.font = '700 26px system-ui, Arial';
    g.fillText('tap / point to preview', w/2, h/2 + 54);

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 2;
    tex.needsUpdate = true;
    return tex;
  }

  const store = new THREE.Group(); store.name="Store";
  const storeRadius = outerR - 18.0;

  const pedMat = new THREE.MeshStandardMaterial({
    color:0x0b0b12, roughness:0.7, metalness:0.2,
    emissive:0x1b0b2a, emissiveIntensity:0.15
  });

  const pedGlowMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.0, roughness:0.4
  });

  const storeItems = [
    "STORE", "AVATARS", "CARDS", "CHIPS",
    "MUSIC", "TV", "LIGHTS", "THEME"
  ];

  for(let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;

    const pedestal = new THREE.Group();
    pedestal.position.set(Math.cos(a)*storeRadius, 0, Math.sin(a)*storeRadius);
    pedestal.lookAt(0, 0.8, 0);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, 0.65, 28), pedMat);
    base.position.y = 0.33;
    pedestal.add(base);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.10, 0.06, 12, 72), pedGlowMat);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.02;
    pedestal.add(ring);

    const labelTex = makeCanvasLabel(storeItems[i]);
    const cardMat = new THREE.MeshStandardMaterial({
      map: labelTex,
      transparent:true,
      roughness:0.85,
      metalness:0.05,
      emissive:0x2a0b44,
      emissiveIntensity:0.25
    });

    const card = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.55), cardMat);
    card.position.set(0, 2.05, 0);
    pedestal.add(card);

    store.add(pedestal);
  }

  scene.add(store);

  // ==========================
  // BOTS DEMO (WALK LOOP)
  // ==========================
  const bots = new THREE.Group(); bots.name="Bots";

  const botGeo = new THREE.CapsuleGeometry(0.22, 0.90, 6, 12);
  const botMats = [
    new THREE.MeshStandardMaterial({ color:0x2b5cff, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0xff3b7a, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0x00c2ff, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0x7cff4a, roughness:0.65 }),
  ];

  const botCount = 8;
  const botPathR = 9.2;          // around table
  const botY = pitY + 0.55;

  const botData = [];
  for(let i=0;i<botCount;i++){
    const mesh = new THREE.Mesh(botGeo, botMats[i%4]);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    bots.add(mesh);

    botData.push({
      mesh,
      phase: (i/botCount) * Math.PI * 2,
      speed: 0.25 + (i%3)*0.02
    });
  }
  scene.add(bots);

  // A guard placeholder at entrance (bigger now)
  const guard = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.30, 1.05, 6, 12),
    new THREE.MeshStandardMaterial({ color:0x111111, emissive:0x8a2be2, emissiveIntensity:0.3 })
  );
  guard.position.set(Math.cos(entranceAngle)*(holeR+0.55), 0.65, Math.sin(entranceAngle)*(holeR+0.55));
  guard.rotation.y = -entranceAngle + Math.PI;
  guard.name="GUARD_PLACEHOLDER";
  scene.add(guard);

  // ==========================
  // CAMERA DEFAULT
  // ==========================
  camera.position.set(0, 1.7, 16);
  camera.lookAt(0, 1.35, 0);

  // ==========================
  // MOUNT ANDROID CONTROLS
  // ==========================
  const moveStick = createMoveStick({ size: 124, margin: 18 });
  const lookPad   = createLookPad({ width: 170, height: 170, margin: 18, sensitivity: 1.75 });

  log('[world] BIG lobby + smaller table + bright lights + open pit (no disk) ✅');
  log('[store] pedestals + floating cards ✅');
  log('[bots] demo walk loop ✅');
  log('[android] move stick + look pad mounted ✅');

  // ==========================
  // UPDATES
  // ==========================
  let t = 0;
  return {
    updates:[
      (dt)=> moveStick.updateMove(dt, 3.35),
      (dt)=> lookPad.updateLook(dt),
      (dt)=>{
        // neon pulse
        t += dt;
        neon.material.emissiveIntensity = 1.02 + Math.sin(t*1.35)*0.22;

        // pit lip pulse
        pitLip.material.emissiveIntensity = 1.12 + Math.sin(t*1.05 + 1.0)*0.20;

        // store cards bob a tiny bit (and keep facing center)
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
      }
    ],
    interactables:[]
  };
}
