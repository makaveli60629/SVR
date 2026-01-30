/**
 * /js/scarlett1/world.js — PERMANENT (LOBBY + DEMO)
 * - Walls closer (room length feel)
 * - Brighter lighting
 * - OPEN pit divot (NO center disk)
 * - Smaller table
 * - Balcony
 * - Store pads
 * - Bots (idle) + simple card dealing demo
 * - Android controls: move stick + look pad (visible above HUD)
 *
 * Safe: no imports.
 */

export async function init(ctx){
  const { THREE, scene, camera, rig, renderer, log } = ctx;

  // ====== SCALE TUNING (walls were too far before) ======
  const holeR  = 5.2;
  const outerR = 26.0;        // ✅ bring walls in
  const pitY   = -1.65;       // your “divot” depth
  const entranceAngle = Math.PI/2;

  // ==========================
  // HELPERS
  // ==========================
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const isXRPresenting=()=> !!(renderer && renderer.xr && renderer.xr.isPresenting);

  // ==========================
  // TOUCH UI WRAPPER
  // ==========================
  let touchRoot = document.getElementById('scarlett-touch-ui');
  if (!touchRoot){
    touchRoot = document.createElement('div');
    touchRoot.id = 'scarlett-touch-ui';
    touchRoot.className = 'scarlett-touch';
    touchRoot.style.cssText = `
      position:fixed; left:0; top:0; width:100%; height:100%;
      pointer-events:none; z-index:9999; touch-action:none;
    `;
    document.body.appendChild(touchRoot);
  }

  // ============================================================
  // ANDROID MOVE JOYSTICK (LEFT)
  // ============================================================
  function createMoveStick({ size=120, margin=18, deadzone=0.12 } = {}) {
    const root = document.createElement("div");
    root.style.cssText = `
      pointer-events:auto;
      position:absolute; left:${margin}px; bottom:${margin}px;
      width:${size}px; height:${size}px; border-radius:999px;
      background:rgba(255,255,255,0.22);
      border:1px solid rgba(255,255,255,0.25);
      z-index:9999; touch-action:none; user-select:none;
    `;
    const knob = document.createElement("div");
    knob.style.cssText = `
      position:absolute; left:50%; top:50%;
      transform:translate(-50%,-50%);
      width:${size*0.44}px; height:${size*0.44}px; border-radius:999px;
      background:rgba(0,0,0,0.35);
      border:1px solid rgba(255,255,255,0.22);
      box-shadow:0 10px 30px rgba(0,0,0,0.35);
    `;
    root.appendChild(knob);
    touchRoot.appendChild(root);

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
        rig.position.add(move); // ✅ move rig (future-safe)
      }
    };

    return { updateMove };
  }

  // ============================================================
  // ANDROID LOOK PAD (RIGHT)
  // ============================================================
  function createLookPad({ width=160, height=160, margin=18, sensitivity=1.6 } = {}) {
    const pad=document.createElement("div");
    pad.style.cssText=`
      pointer-events:auto;
      position:absolute; right:${margin}px; bottom:${margin}px;
      width:${width}px; height:${height}px; border-radius:22px;
      background:rgba(255,255,255,0.10);
      border:1px solid rgba(255,255,255,0.20);
      z-index:9999; touch-action:none; user-select:none;
    `;
    const label=document.createElement("div");
    label.textContent="LOOK";
    label.style.cssText=`
      position:absolute; left:12px; top:10px;
      font:900 12px system-ui; letter-spacing:.12em;
      opacity:.7; color:white;
    `;
    pad.appendChild(label);
    touchRoot.appendChild(pad);

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
      rig.rotation.y -= yawDelta;
      yawDelta *= 0.35;
    };

    return { updateLook };
  }

  // ==========================
  // LIGHTING (BRIGHTER)
  // ==========================
  scene.add(new THREE.AmbientLight(0xffffff, 1.10));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x202040, 0.95));

  const dir = new THREE.DirectionalLight(0xffffff, 1.25);
  dir.position.set(8, 14, 10);
  scene.add(dir);

  const topLight = new THREE.PointLight(0xffffff, 2.8, 120);
  topLight.position.set(0, 9.5, 0);
  scene.add(topLight);

  for (let i=0;i<14;i++){
    const a=(i/14)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.6, 40);
    p.position.set(Math.cos(a)*(outerR*0.55), 5.2, Math.sin(a)*(outerR*0.55));
    scene.add(p);
  }

  // ==========================
  // FLOOR / DECK (RING WITH HOLE)
  // ==========================
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

  // ==========================
  // OPEN PIT DIVOT (NO DISK)
  // ==========================
  const pit = new THREE.Group(); pit.name="PitDivot";
  const pitDepth = (0 - pitY);

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, pitDepth + 0.25, 160, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x05050b, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide })
  );
  pitWall.position.y = pitY + (pitDepth / 2);
  pit.add(pitWall);

  const pitNeonMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.15, roughness:0.35
  });
  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.08, 0.05, 12, 200),
    pitNeonMat
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.03;
  pit.add(pitLip);

  const fog = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR-0.15, holeR-0.15, pitDepth, 120, 1, true),
    new THREE.MeshStandardMaterial({ color:0x000000, transparent:true, opacity:0.16, roughness:1.0, side:THREE.DoubleSide })
  );
  fog.position.y = pitY + pitDepth/2;
  pit.add(fog);

  scene.add(pit);

  // ==========================
  // LOBBY SHELL (WALLS CLOSER)
  // ==========================
  const shell = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x05050b, roughness:0.96, side:THREE.DoubleSide });

  const wallH = 8.8;
  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, wallH, 180, 1, true), wallMat);
  outerWall.position.y = wallH*0.5; shell.add(outerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 180, 1),
    new THREE.MeshStandardMaterial({ color: 0x040409, roughness:1.0, side:THREE.DoubleSide })
  );
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = wallH;
  shell.add(ceiling);

  const shellNeonMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.35, roughness:0.45
  });
  for (let i=0;i<2;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(outerR-1.2-i*1.0, 0.07, 12, 220), shellNeonMat);
    ring.rotation.x = Math.PI/2;
    ring.position.y = wallH - 0.8 - i*0.7;
    shell.add(ring);
  }

  scene.add(shell);

  // ==========================
  // BALCONY (SIMPLE RING)
  // ==========================
  const balcony = new THREE.Group();
  const by = 5.6;
  const inner = outerR-5.8;
  const outer = outerR-2.7;

  const bDeck = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 180, 1),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide })
  );
  bDeck.rotation.x = -Math.PI/2; bDeck.position.y = by; balcony.add(bDeck);

  const bRail = new THREE.Mesh(
    new THREE.TorusGeometry(outer-0.35, 0.05, 10, 200),
    new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.5, metalness:0.3 })
  );
  bRail.rotation.x = Math.PI/2; bRail.position.y = by+0.95; balcony.add(bRail);

  scene.add(balcony);

  // ==========================
  // SMALLER TABLE (IN PIT)
  // ==========================
  const tableGroup = new THREE.Group();
  tableGroup.position.y = pitY + 0.35;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 2.5, 1.1, 44),
    new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.5, metalness:0.35, emissive:0x8a2be2, emissiveIntensity:0.22 })
  );
  base.position.y = 0.55; tableGroup.add(base);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(3.8, 3.8, 0.28, 80),
    new THREE.MeshStandardMaterial({ color:0x07070c, roughness:0.85, metalness:0.12 })
  );
  top.position.y = 1.25; tableGroup.add(top);

  const neon = new THREE.Mesh(
    new THREE.TorusGeometry(3.9, 0.055, 10, 140),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.2, roughness:0.4 })
  );
  neon.rotation.x = Math.PI/2; neon.position.y = 1.35; tableGroup.add(neon);

  // Chairs (scaled down)
  const chairMat = new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.65, metalness:0.25 });
  const chairGlow = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.7, roughness:0.4 });
  const chairDist = 5.35;

  const seatCount = 6; // poker demo seats
  const seats = [];
  for (let i=0;i<seatCount;i++){
    const a=(i/seatCount)*Math.PI*2;
    const chair = new THREE.Group();
    chair.position.set(Math.cos(a)*chairDist, 0, Math.sin(a)*chairDist);
    chair.lookAt(0, 0.8, 0);

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.18, 22), chairMat);
    seat.position.y = 0.75; chair.add(seat);

    const back = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.10, 14, 44, Math.PI), chairMat);
    back.rotation.x = Math.PI/2;
    back.rotation.z = Math.PI/2;
    back.position.set(0, 1.08, -0.28);
    chair.add(back);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.045, 10, 36), chairGlow);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.05;
    chair.add(ring);

    tableGroup.add(chair);
    seats.push(chair);
  }

  scene.add(tableGroup);

  // ==========================
  // STORE PADS (3)
  // ==========================
  const store = new THREE.Group();
  const padMat = new THREE.MeshStandardMaterial({ color:0x0c0c14, roughness:0.9, metalness:0.1 });
  const iconMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.3, roughness:0.25 });

  const storeR = outerR - 5.0;
  for (let i=0;i<3;i++){
    const a = (-Math.PI/2) + i*0.55;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.95,0.95,0.18,24), padMat);
    pad.position.set(Math.cos(a)*storeR, 0.10, Math.sin(a)*storeR);

    const icon = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.35,0.35), iconMat);
    icon.position.set(pad.position.x, 0.80, pad.position.z);

    store.add(pad);
    store.add(icon);
  }
  scene.add(store);

  // ==========================
  // BOTS (SIMPLE IDLE DEMO)
  // ==========================
  const bots = [];
  const botBodyMat = new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.8, metalness:0.2 });
  const botGlowMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.1, roughness:0.35 });

  for (let i=0;i<seatCount;i++){
    const bot = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.70, 6, 12), botBodyMat);
    body.position.y = 1.05;
    bot.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), botGlowMat);
    head.position.y = 1.55;
    bot.add(head);

    // stand slightly behind each chair
    const c = seats[i];
    bot.position.copy(c.position);
    bot.position.multiplyScalar(1.06);
    bot.position.y = pitY + 0.35; // same floor as table group base
    bot.lookAt(0, pitY + 1.2, 0);

    scene.add(bot);
    bots.push(bot);
  }

  // ==========================
  // CARD DEALING DEMO
  // ==========================
  const cards = [];
  const cardMat = new THREE.MeshStandardMaterial({ color:0xf2f2f2, roughness:0.35, metalness:0.05 });
  const cardBackMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.5, roughness:0.45 });

  function makeCard(){
    const g = new THREE.PlaneGeometry(0.42, 0.62);
    const card = new THREE.Mesh(g, cardMat);
    card.rotation.x = -Math.PI/2;
    card.position.set(0, pitY + 1.36, 0);
    card.userData = { vx:0, vz:0, tx:0, tz:0, dealT:0 };
    return card;
  }

  // create 12 cards (2 each seat)
  for (let i=0;i<seatCount*2;i++){
    const card = makeCard();
    scene.add(card);
    cards.push(card);
  }

  function startDeal(){
    let idx = 0;
    for (let s=0; s<seatCount; s++){
      const a = (s/seatCount)*Math.PI*2;
      const targetR = 3.0;
      const tx = Math.cos(a)*targetR;
      const tz = Math.sin(a)*targetR;

      // two cards per seat
      for (let k=0;k<2;k++){
        const card = cards[idx++];
        card.position.set(0, pitY + 1.36, 0);
        card.rotation.y = a + (k*0.18);
        card.userData.tx = tx + (k*0.20);
        card.userData.tz = tz + (k*0.08);
        card.userData.dealT = (s*0.12) + (k*0.06);
      }
    }
  }
  startDeal();

  // ==========================
  // SPAWN (IMPORTANT: rig spawn, not camera)
  // Put you at room edge facing table, not inside it.
  // ==========================
  const spawn = {
    pos: [0, 1.6, outerR - 6.5],
    yaw: Math.PI
  };

  // Mount Android controls (shows above HUD)
  const moveStick = createMoveStick({ size: 120, margin: 18 });
  const lookPad   = createLookPad({ width: 160, height: 160, margin: 18, sensitivity: 1.6 });

  log('[world] lobby + pit + balcony + store + bots + cards ✅');
  log('[android] move stick + look pad mounted ✅');

  // Updates: move/look + neon + bots idle + card dealing anim
  let t = 0;
  return {
    spawn,
    updates:[
      (dt)=> moveStick.updateMove(dt, 2.8),
      (dt)=> lookPad.updateLook(dt),

      (dt)=>{
        t += dt;
        neon.material.emissiveIntensity = 1.05 + Math.sin(t*1.4)*0.18;
      },

      (dt)=>{
        // bots idle sway
        for (let i=0;i<bots.length;i++){
          const b = bots[i];
          b.position.y = (pitY + 0.35) + Math.sin(t*1.2 + i)*0.02;
          b.rotation.y += Math.sin(t*0.9 + i)*0.0006;
        }
      },

      (dt)=>{
        // card dealing / slide to targets
        for (let i=0;i<cards.length;i++){
          const c = cards[i];
          const u = c.userData;
          u.dealT -= dt;
          if (u.dealT > 0) continue;

          const px = c.position.x, pz = c.position.z;
          const tx = u.tx, tz = u.tz;
          const dx = tx - px, dz = tz - pz;
          const d  = Math.hypot(dx,dz);

          if (d > 0.01){
            const sp = 6.0 * dt;
            c.position.x += dx * sp;
            c.position.z += dz * sp;
          }
        }
      }
    ],
    interactables:[]
  };
                           }
