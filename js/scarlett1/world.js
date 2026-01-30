/**
 * /js/scarlett1/world.js — PERMANENT
 * Lobby rebuild:
 * - Walls closer (room length)
 * - Brighter lighting
 * - Pit divot open (NO center disk)
 * - Smaller poker table
 * - Balcony ring
 * - Store pads
 * - 6 demo bots
 * - Simple card demo (community cards appear)
 * - Android touch controls: move stick + look pad
 */

export async function init(ctx){
  const { THREE, scene, camera, log } = ctx;

  // ---------------------------
  // SCALE (closer room)
  // ---------------------------
  const holeR  = 5.5;
  const outerR = 26.0;       // ✅ closer walls (was huge)
  const pitY   = -1.65;
  const entranceAngle = Math.PI/2;

  // ---------------------------
  // Helpers
  // ---------------------------
  const V3 = (x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

  const isXRPresenting=()=>{
    const r=window.__SCARLETT_RENDERER__;
    return !!(r && r.xr && r.xr.isPresenting);
  };

  // ------------------------------------------------------------
  // ANDROID MOVE STICK (LEFT)
  // ------------------------------------------------------------
  function createMoveStick({ size=120, margin=18, deadzone=0.12 } = {}) {
    const root = document.createElement("div");
    root.style.cssText = `
      position:fixed; left:${margin}px; bottom:${margin}px;
      width:${size}px; height:${size}px; border-radius:999px;
      background:rgba(255,255,255,0.18);
      border:1px solid rgba(255,255,255,0.18);
      z-index:70; touch-action:none; user-select:none;
      backdrop-filter: blur(8px);
    `;
    const knob = document.createElement("div");
    knob.style.cssText = `
      position:absolute; left:50%; top:50%;
      transform:translate(-50%,-50%);
      width:${size*0.44}px; height:${size*0.44}px; border-radius:999px;
      background:rgba(0,0,0,0.35);
      border:1px solid rgba(255,255,255,0.18);
      box-shadow:0 10px 30px rgba(0,0,0,0.35);
    `;
    root.appendChild(knob);
    document.body.appendChild(root);

    let active=false, pid=null, cx=0, cy=0;
    let x=0, y=0;

    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
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

    // Move uses camera for NON-XR only (XR uses headset)
    const updateMove=(dt, speed=2.6)=>{
      if(isXRPresenting()) return;
      const strafe=x;
      const forward=-y;
      if(Math.abs(strafe)<0.001 && Math.abs(forward)<0.001) return;

      const vF=new THREE.Vector3();
      camera.getWorldDirection(vF);
      vF.y=0; vF.normalize();

      const vR=new THREE.Vector3().crossVectors(vF, new THREE.Vector3(0,1,0)).normalize();
      const move=new THREE.Vector3().addScaledVector(vF, forward).addScaledVector(vR, strafe);

      if(move.lengthSq()>0){
        move.normalize().multiplyScalar(speed*dt);
        camera.position.add(move);
      }
    };

    return { updateMove };
  }

  // ------------------------------------------------------------
  // ANDROID LOOK PAD (RIGHT)
  // ------------------------------------------------------------
  function createLookPad({ width=160, height=160, margin=18, sensitivity=1.6 } = {}) {
    const pad=document.createElement("div");
    pad.style.cssText=`
      position:fixed; right:${margin}px; bottom:${margin}px;
      width:${width}px; height:${height}px; border-radius:22px;
      background:rgba(255,255,255,0.08);
      border:1px solid rgba(255,255,255,0.16);
      z-index:70; touch-action:none; user-select:none;
      backdrop-filter: blur(8px);
    `;
    const label=document.createElement("div");
    label.textContent="LOOK";
    label.style.cssText=`
      position:absolute; left:12px; top:10px;
      font:900 12px system-ui; letter-spacing:.12em;
      opacity:.75; color:white;
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
      yawDelta += (dx / 200) * sensitivity;
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
      yawDelta *= 0.35;
    };

    return { updateLook };
  }

  // ---------------------------
  // LIGHTING (BRIGHT)
  // ---------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1b1b40, 1.0));

  const dir = new THREE.DirectionalLight(0xffffff, 1.4);
  dir.position.set(10,18,12);
  scene.add(dir);

  const topLight = new THREE.PointLight(0xffffff, 3.2, 120);
  topLight.position.set(0,10.0,0);
  scene.add(topLight);

  // ring glow lights
  for (let i=0;i<12;i++){
    const a=(i/12)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.2, 45);
    p.position.set(Math.cos(a)*(outerR*0.62), 4.0, Math.sin(a)*(outerR*0.62));
    scene.add(p);
  }

  // ---------------------------
  // DECK FLOOR (hole ring)
  // ---------------------------
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 140, 1),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide })
  );
  deck.rotation.x = -Math.PI/2;
  deck.position.y = 0;
  scene.add(deck);

  const grid = new THREE.GridHelper(outerR*2, 60, 0x2a2a44, 0x141422);
  grid.position.y = 0.01;
  scene.add(grid);

  // ---------------------------
  // OPEN PIT DIVOT (NO DISK)
  // ---------------------------
  const pit = new THREE.Group(); pit.name="PitDivot";
  const pitDepth = (0 - pitY);

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, pitDepth + 0.25, 180, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x05050b, roughness:0.95, metalness:0.05, side:THREE.DoubleSide })
  );
  pitWall.position.y = pitY + (pitDepth / 2);
  pit.add(pitWall);

  const pitLipMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.15, roughness:0.35
  });
  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.08, 0.045, 12, 200),
    pitLipMat
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.02;
  pit.add(pitLip);

  const fog = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR-0.15, holeR-0.15, pitDepth, 110, 1, true),
    new THREE.MeshStandardMaterial({ color:0x000000, transparent:true, opacity:0.18, roughness:1.0, side:THREE.DoubleSide })
  );
  fog.position.y = pitY + pitDepth/2;
  pit.add(fog);

  scene.add(pit);

  // ---------------------------
  // LOBBY SHELL (WALLS CLOSER)
  // ---------------------------
  const shell = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x07070f, roughness:0.95, side:THREE.DoubleSide });

  const wallH = 8.8;
  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, wallH, 180, 1, true), wallMat);
  outerWall.position.y = wallH/2;
  shell.add(outerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 180, 1),
    new THREE.MeshStandardMaterial({ color: 0x040409, roughness:1.0, side:THREE.DoubleSide })
  );
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = wallH;
  shell.add(ceiling);

  const shellNeonMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.35, roughness:0.45 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(outerR-1.2, 0.07, 12, 220), shellNeonMat);
  ring1.rotation.x = Math.PI/2; ring1.position.y = wallH-0.8; shell.add(ring1);

  scene.add(shell);

  // ---------------------------
  // BALCONY RING
  // ---------------------------
  const balcony = new THREE.Group();
  const by = 5.6;
  const bInner = outerR - 5.5;
  const bOuter = outerR - 2.2;

  const bDeck = new THREE.Mesh(
    new THREE.RingGeometry(bInner, bOuter, 180, 1),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide })
  );
  bDeck.rotation.x = -Math.PI/2; bDeck.position.y = by;
  balcony.add(bDeck);

  const bRail = new THREE.Mesh(
    new THREE.TorusGeometry(bOuter-0.25, 0.05, 10, 220),
    new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.5, metalness:0.3 })
  );
  bRail.rotation.x = Math.PI/2; bRail.position.y = by+1.0;
  balcony.add(bRail);

  scene.add(balcony);

  // ---------------------------
  // RAIL + ENTRANCE GAP
  // ---------------------------
  const rail = new THREE.Group();
  const railY = 1.0;
  const postMat = new THREE.MeshStandardMaterial({ color:0x12121a, roughness:0.8 });
  const railMat2 = new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.6, metalness:0.25 });

  const topRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.04, 10, 200), railMat2);
  topRing.rotation.x = Math.PI/2; topRing.position.y = railY; rail.add(topRing);

  const midRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.03, 10, 200), railMat2);
  midRing.rotation.x = Math.PI/2; midRing.position.y = railY-0.35; rail.add(midRing);

  const postGeo = new THREE.CylinderGeometry(0.05,0.05,1.0,12);
  const count = 56;
  const gap = Math.PI/10;
  for (let i=0;i<count;i++){
    const a=(i/count)*Math.PI*2;
    const da = Math.atan2(Math.sin(a-entranceAngle), Math.cos(a-entranceAngle));
    if (Math.abs(da) < gap) continue;
    const p = new THREE.Mesh(postGeo, postMat);
    p.position.set(Math.cos(a)*(holeR+0.85), 0.5, Math.sin(a)*(holeR+0.85));
    rail.add(p);
  }
  scene.add(rail);

  // ---------------------------
  // STAIRS DOWN
  // ---------------------------
  const stairs = new THREE.Group();
  const steps = 12;
  const stepH = (0 - pitY)/steps;
  const stepD = 0.26;
  const w = 1.2;

  const stepMat = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.95 });
  const glowMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.0, roughness:0.45 });

  const startR = holeR+0.75;
  for (let i=0;i<steps;i++){
    const t=i/(steps-1);
    const y = 0 - t*(0-pitY) - stepH*0.5;
    const r = startR - t*1.05;
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, stepH*0.95, stepD), stepMat);
    s.position.set(Math.cos(entranceAngle)*r, y, Math.sin(entranceAngle)*r);
    s.rotation.y = -entranceAngle;
    stairs.add(s);
  }

  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04,(0-pitY)+0.2,0.04), glowMat);
  railL.position.set(Math.cos(entranceAngle)*(startR-0.15), (0+pitY)/2+0.1, Math.sin(entranceAngle)*(startR-0.15));
  railL.rotation.y = -entranceAngle; stairs.add(railL);
  const railR = railL.clone();
  railR.position.set(Math.cos(entranceAngle)*(startR+0.15), (0+pitY)/2+0.1, Math.sin(entranceAngle)*(startR+0.15));
  stairs.add(railR);

  scene.add(stairs);

  // ---------------------------
  // SMALLER TABLE (IN PIT)
  // ---------------------------
  const tableGroup = new THREE.Group();
  tableGroup.position.y = pitY + 0.35;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 2.4, 1.15, 40),
    new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.5, metalness:0.35, emissive:0x8a2be2, emissiveIntensity:0.18 })
  );
  base.position.y = 0.62; tableGroup.add(base);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.2, 0.30, 80),
    new THREE.MeshStandardMaterial({ color:0x07070c, roughness:0.85, metalness:0.12 })
  );
  top.position.y = 1.30; tableGroup.add(top);

  const neon = new THREE.Mesh(
    new THREE.TorusGeometry(4.28, 0.06, 10, 120),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.1, roughness:0.4 })
  );
  neon.rotation.x = Math.PI/2; neon.position.y = 1.45; tableGroup.add(neon);

  // Chairs
  const chairMat = new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.65, metalness:0.25 });
  const chairGlow = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.65, roughness:0.4 });
  const chairDist = 5.55;

  const seats = [];
  for (let i=0;i<6;i++){
    const a=(i/6)*Math.PI*2;
    const chair = new THREE.Group();
    chair.position.set(Math.cos(a)*chairDist, 0, Math.sin(a)*chairDist);
    chair.lookAt(0, 0.8, 0);

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.80, 0.20, 24), chairMat);
    seat.position.y = 0.78; chair.add(seat);

    const back = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.10, 14, 48, Math.PI), chairMat);
    back.rotation.x = Math.PI/2;
    back.rotation.z = Math.PI/2;
    back.position.set(0, 1.15, -0.30);
    chair.add(back);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.70, 12), chairMat);
    stem.position.y = 0.42; chair.add(stem);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 10, 44), chairGlow);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.06;
    chair.add(ring);

    tableGroup.add(chair);
    seats.push(chair);
  }

  scene.add(tableGroup);

  // ---------------------------
  // BOTS (6 simple seated demos)
  // ---------------------------
  const bots = [];
  const botMat = new THREE.MeshStandardMaterial({ color: 0x1a1a26, roughness:0.85, metalness:0.15 });
  const botGlow = new THREE.MeshStandardMaterial({ color: 0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.8, roughness:0.35 });

  for (let i=0;i<6;i++){
    const bot = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 6, 12), botMat);
    body.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), botMat);
    head.position.y = 1.58;
    const visor = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 10, 24), botGlow);
    visor.rotation.x = Math.PI/2;
    visor.position.y = 1.58;

    bot.add(body, head, visor);

    // Place behind chair facing table
    const c = seats[i];
    bot.position.copy(c.position);
    bot.rotation.copy(c.rotation);
    bot.position.add(new THREE.Vector3(0, 0, 0.55)); // behind seat
    bots.push(bot);
    scene.add(bot);
  }

  // ---------------------------
  // STORE PADS (3 kiosks on deck)
  // ---------------------------
  const store = new THREE.Group();
  const padMat = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.9, metalness:0.15 });
  const padGlow = new THREE.MeshStandardMaterial({ color:0x00c8ff, emissive:0x00c8ff, emissiveIntensity:0.9, roughness:0.35 });

  for (let i=0;i<3;i++){
    const a = (i/3)*Math.PI*2 + 0.4;
    const g = new THREE.Group();

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 40), padMat);
    pad.position.y = 0.06;

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.05, 10, 80), padGlow);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.13;

    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.12), padGlow);
    sign.position.set(0, 1.25, 0);
    sign.lookAt(0, 1.25, 0);

    g.add(pad, ring, sign);
    g.position.set(Math.cos(a)*(outerR-5.2), 0, Math.sin(a)*(outerR-5.2));
    g.lookAt(0, 0.9, 0);
    store.add(g);
  }
  scene.add(store);

  // ---------------------------
  // SIMPLE CARD DEMO (community cards)
  // ---------------------------
  const cards = new THREE.Group();
  cards.position.set(0, pitY + 1.52, 0); // hover above table

  const cardMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.05
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: 0x8a2be2,
    roughness: 0.45,
    metalness: 0.15,
    emissive: 0x8a2be2,
    emissiveIntensity: 0.15
  });

  const community = [];
  for (let i=0;i<5;i++){
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.72), cardMat);
    c.rotation.x = -Math.PI/2;
    c.position.set((i-2)*0.62, 0.02, 0);
    c.visible = false;
    community.push(c);
    cards.add(c);
  }

  // deck stack
  const deckStack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.10, 0.75), backMat);
  deckStack.position.set(-3.0, 0.06, 0);
  deckStack.rotation.x = -Math.PI/2;
  cards.add(deckStack);

  scene.add(cards);

  let dealT = 0;
  let dealIdx = 0;

  function updateCards(dt){
    dealT += dt;
    // Reveal a card every ~1.2s
    if (dealIdx < community.length && dealT > 1.2){
      community[dealIdx].visible = true;
      dealIdx++;
      dealT = 0;
    }
  }

  // ---------------------------
  // SPAWN (fix table-center spawn)
  // ---------------------------
  // Non-XR spawn: on the deck, facing pit/table
  camera.position.set(0, 1.6, 10.5);
  camera.lookAt(0, 1.35, 0);

  // Android controls (only for non-XR)
  const moveStick = createMoveStick({ size: 120, margin: 18 });
  const lookPad   = createLookPad({ width: 160, height: 160, margin: 18, sensitivity: 1.6 });

  log('[world] lobby built ✅ (walls closer, brighter, balcony, store)');
  log('[world] pit divot open ✅ (no disk)');
  log('[world] table+6 bots+cards demo ✅');
  log('[android] move stick + look pad mounted ✅');

  // ---------------------------
  // UPDATES
  // ---------------------------
  let t = 0;

  return {
    updates:[
      (dt)=> moveStick.updateMove(dt, 2.8),
      (dt)=> lookPad.updateLook(dt),
      (dt)=>{
        t += dt;
        neon.material.emissiveIntensity = 1.02 + Math.sin(t*1.3)*0.18;
      },
      (dt)=> updateCards(dt),
      (dt)=>{
        // subtle bot idle motion
        const w = Math.sin((t*1.2));
        for (let i=0;i<bots.length;i++){
          bots[i].position.y = (i%2===0 ? 0.0 : 0.01) + (Math.sin(t*0.9 + i)*0.01);
          bots[i].rotation.y += Math.sin(t*0.15 + i)*0.0006;
        }
      }
    ],
    interactables:[]
  };
}
