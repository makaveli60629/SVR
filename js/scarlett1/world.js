/**
 * /js/scarlett1/world.js — PERMANENT (LOBBY + TABLE + BOTS DEMO)
 * - Circular lobby shell (bright)
 * - OPEN pit divot (NO center disk)
 * - Center pedestal + poker table on top (pedestal visible)
 * - 8 bot “demo” movers (orbit + idle bob) + 1 guard at stairs
 * - Android on-screen controls:
 *    - Left joystick = move
 *    - Right look pad = turn (yaw)
 * Safe: no imports
 */

export async function init(ctx){
  const { THREE, scene, camera, log } = ctx;

  // -----------------------------
  // WORLD CONSTANTS
  // -----------------------------
  const holeR = 6.0;          // hole radius
  const outerR = 70.0;        // lobby radius
  const pitY  = -1.65;        // pit bottom y
  const entranceAngle = Math.PI/2; // stairs direction

  // -----------------------------
  // ANDROID MOVE JOYSTICK (LEFT) — FORCE ON TOP
  // -----------------------------
  function createMoveStick({ size=140, margin=18, deadzone=0.12 } = {}) {
    const old = document.getElementById("scarlett-move-stick");
    if (old) old.remove();

    const root = document.createElement("div");
    root.id = "scarlett-move-stick";
    root.style.cssText = `
      position:fixed;
      left:calc(${margin}px + env(safe-area-inset-left));
      bottom:calc(${margin}px + env(safe-area-inset-bottom));
      width:${size}px; height:${size}px;
      border-radius:999px;
      background:rgba(255,255,255,0.20);
      border:2px solid rgba(140,200,255,0.45);
      z-index:999999;
      touch-action:none;
      user-select:none;
      pointer-events:auto;
      display:block;
    `;

    const knob = document.createElement("div");
    knob.style.cssText = `
      position:absolute; left:50%; top:50%;
      transform:translate(-50%,-50%);
      width:${size*0.44}px; height:${size*0.44}px; border-radius:999px;
      background:rgba(0,0,0,0.38);
      border:2px solid rgba(255,255,255,0.22);
      box-shadow:0 10px 30px rgba(0,0,0,0.35);
    `;
    root.appendChild(knob);

    const tag = document.createElement("div");
    tag.textContent = "MOVE";
    tag.style.cssText = `
      position:absolute; left:50%; top:-18px; transform:translateX(-50%);
      font:800 12px system-ui; letter-spacing:.16em;
      color:rgba(210,235,255,0.92);
      text-shadow:0 2px 10px rgba(0,0,0,0.55);
    `;
    root.appendChild(tag);

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

    const isXRPresenting=()=>{
      const r=window.__SCARLETT_RENDERER__;
      return !!(r && r.xr && r.xr.isPresenting);
    };

    const updateMove=(dt, speed=3.2)=>{
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

    return { updateMove, el: root };
  }

  // -----------------------------
  // ANDROID LOOK PAD (RIGHT)
  // -----------------------------
  function createLookPad({ width=180, height=160, margin=18, sensitivity=1.8 } = {}) {
    const old = document.getElementById("scarlett-look-pad");
    if (old) old.remove();

    const pad=document.createElement("div");
    pad.id="scarlett-look-pad";
    pad.style.cssText=`
      position:fixed;
      right:calc(${margin}px + env(safe-area-inset-right));
      bottom:calc(${margin}px + env(safe-area-inset-bottom));
      width:${width}px; height:${height}px;
      border-radius:22px;
      background:rgba(255,255,255,0.10);
      border:2px solid rgba(255,210,140,0.35);
      z-index:999999;
      touch-action:none;
      user-select:none;
      pointer-events:auto;
      display:block;
    `;

    const label=document.createElement("div");
    label.textContent="LOOK";
    label.style.cssText=`
      position:absolute; left:12px; top:10px;
      font:900 12px system-ui; letter-spacing:.16em;
      opacity:.85; color:white;
      text-shadow:0 2px 10px rgba(0,0,0,0.55);
    `;
    pad.appendChild(label);
    document.body.appendChild(pad);

    let active=false, pid=null, lastX=0;
    let yawDelta=0;

    const isXRPresenting=()=>{
      const r=window.__SCARLETT_RENDERER__;
      return !!(r && r.xr && r.xr.isPresenting);
    };

    pad.addEventListener("pointerdown",(e)=>{
      active=true; pid=e.pointerId;
      pad.setPointerCapture(pid);
      lastX=e.clientX;
    });
    pad.addEventListener("pointermove",(e)=>{
      if(!active || e.pointerId!==pid) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      yawDelta += (dx / 180) * sensitivity;
    });
    const end=(e)=>{
      if(e.pointerId!==pid) return;
      try{ pad.releasePointerCapture(pid);}catch{}
      active=false; pid=null; lastX=0;
    };
    pad.addEventListener("pointerup", end);
    pad.addEventListener("pointercancel", end);

    const updateLook=()=>{
      if(isXRPresenting()) { yawDelta=0; return; }
      if(Math.abs(yawDelta) < 0.00001) return;
      camera.rotation.order = "YXZ";
      camera.rotation.y -= yawDelta;
      yawDelta *= 0.35;
    };

    return { updateLook, el: pad };
  }

  // -----------------------------
  // LIGHTING (BRIGHT LOBBY)
  // -----------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 1.10));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x24244a, 1.00));

  const dir = new THREE.DirectionalLight(0xffffff, 1.35);
  dir.position.set(10, 20, 12);
  scene.add(dir);

  const topLight = new THREE.PointLight(0xffffff, 2.8, 280);
  topLight.position.set(0, 12.5, 0);
  scene.add(topLight);

  for (let i=0;i<20;i++){
    const a=(i/20)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.6, 120);
    p.position.set(Math.cos(a)*(outerR*0.55), 6.4, Math.sin(a)*(outerR*0.55));
    scene.add(p);
  }

  // -----------------------------
  // LOBBY FLOOR (RING WITH HOLE)
  // -----------------------------
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 220, 1),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0.0;
  floor.name = "LobbyFloor";
  scene.add(floor);

  const grid = new THREE.GridHelper(outerR*2, 90, 0x2a2a44, 0x141422);
  grid.position.y = 0.01;
  scene.add(grid);

  // -----------------------------
  // OPEN PIT DIVOT (NO CENTER DISK)
  // -----------------------------
  const pit = new THREE.Group(); pit.name="PitDivot";
  const pitDepth = (0 - pitY);

  const pitWallMat = new THREE.MeshStandardMaterial({
    color: 0x05050b, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide
  });

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, pitDepth + 0.25, 220, 1, true),
    pitWallMat
  );
  pitWall.position.y = pitY + (pitDepth / 2);
  pit.add(pitWall);

  const pitNeonMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.25, roughness:0.35
  });
  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.08, 0.045, 12, 240),
    pitNeonMat
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.02;
  pit.add(pitLip);

  const fogMat = new THREE.MeshStandardMaterial({
    color:0x000000, transparent:true, opacity:0.18, roughness:1.0, metalness:0.0, side:THREE.DoubleSide
  });
  const fog = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR-0.15, holeR-0.15, pitDepth, 160, 1, true),
    fogMat
  );
  fog.position.y = pitY + pitDepth/2;
  pit.add(fog);

  scene.add(pit);

  // -----------------------------
  // LOBBY SHELL (DOUBLE WALL + CEILING + NEON RINGS)
  // -----------------------------
  const shell = new THREE.Group(); shell.name="LobbyShell";
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x05050b, roughness:0.95, side:THREE.DoubleSide });

  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, 10.8, 240, 1, true), wallMat);
  outerWall.position.y = 5.4; shell.add(outerWall);

  const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR-0.75, outerR-0.75, 10.8, 240, 1, true), wallMat);
  innerWall.position.y = 5.4; shell.add(innerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 240, 1),
    new THREE.MeshStandardMaterial({ color: 0x040409, roughness:1.0, side:THREE.DoubleSide })
  );
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = 10.8;
  shell.add(ceiling);

  const shellNeonMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.6, roughness:0.45
  });
  for (let i=0;i<4;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(outerR-1.8-i*1.0, 0.07, 12, 280), shellNeonMat);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 9.95 - i*0.7;
    shell.add(ring);
  }
  scene.add(shell);

  // -----------------------------
  // 4 JUMBOTRONS (CORNERS-ish) + DOORS UNDER THEM
  // -----------------------------
  const media = new THREE.Group(); media.name="Jumbotrons";
  const screenGeo = new THREE.PlaneGeometry(12, 6.2);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x111126, roughness: 0.6, metalness: 0.15,
    emissive: 0x2b5cff, emissiveIntensity: 0.35
  });
  const doorGeo = new THREE.PlaneGeometry(5.2, 6.4);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a12, roughness: 0.8, metalness: 0.2,
    emissive: 0x8a2be2, emissiveIntensity: 0.12
  });

  for (let i=0;i<4;i++){
    const a = (i/4)*Math.PI*2 + Math.PI/4; // 45, 135, 225, 315
    const r = outerR - 3.4;

    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(Math.cos(a)*r, 6.8, Math.sin(a)*r);
    screen.lookAt(0, 6.8, 0);
    media.add(screen);

    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(Math.cos(a)*(r-0.25), 3.4, Math.sin(a)*(r-0.25));
    door.lookAt(0, 3.4, 0);
    media.add(door);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 1.2),
      new THREE.MeshStandardMaterial({ color:0x080812, emissive:0x8a2be2, emissiveIntensity:0.55, roughness:0.7 })
    );
    sign.position.set(Math.cos(a)*r, 9.2, Math.sin(a)*r);
    sign.lookAt(0, 9.2, 0);
    media.add(sign);
  }
  scene.add(media);

  // -----------------------------
  // RAIL AROUND HOLE (WITH ENTRANCE GAP)
  // -----------------------------
  const rail = new THREE.Group(); rail.name="Rail";
  const railY = 1.0;
  const postMat = new THREE.MeshStandardMaterial({ color:0x12121a, roughness:0.8 });
  const railMat2 = new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.6, metalness:0.25 });

  const topRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.04, 10, 240), railMat2);
  topRing.rotation.x = Math.PI/2; topRing.position.y = railY; rail.add(topRing);

  const midRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.03, 10, 240), railMat2);
  midRing.rotation.x = Math.PI/2; midRing.position.y = railY-0.35; rail.add(midRing);

  const postGeo = new THREE.CylinderGeometry(0.05,0.05,1.0,12);
  const count = 72;
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

  // -----------------------------
  // STAIRS DOWN INTO PIT (ENTRANCE)
  // -----------------------------
  const stairs = new THREE.Group(); stairs.name="Stairs";
  const steps = 14;
  const stepH = (0 - pitY)/steps;
  const stepD = 0.30;
  const w = 1.35;
  const stepMat = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.95 });
  const glowMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.05, roughness:0.45 });

  const startR = holeR+0.75;
  for (let i=0;i<steps;i++){
    const t=i/(steps-1);
    const y = 0 - t*(0-pitY) - stepH*0.5;
    const r = startR - t*1.25;
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, stepH*0.95, stepD), stepMat);
    s.position.set(Math.cos(entranceAngle)*r, y, Math.sin(entranceAngle)*r);
    s.rotation.y = -entranceAngle;
    stairs.add(s);

    // step edge glow
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w, stepH*0.10, 0.03), glowMat);
    edge.position.set(s.position.x, y + (stepH*0.42), s.position.z - Math.cos(entranceAngle)*0.14);
    edge.rotation.y = -entranceAngle;
    stairs.add(edge);
  }
  scene.add(stairs);

  // -----------------------------
  // BALCONY RING
  // -----------------------------
  const balcony = new THREE.Group(); balcony.name="Balcony";
  const by = 6.8;
  const innerB = outerR-6.0;
  const outerB = outerR-2.5;

  const bDeck = new THREE.Mesh(
    new THREE.RingGeometry(innerB, outerB, 240, 1),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide })
  );
  bDeck.rotation.x = -Math.PI/2; bDeck.position.y = by; balcony.add(bDeck);

  const bRail = new THREE.Mesh(
    new THREE.TorusGeometry(outerB-0.35, 0.05, 10, 260),
    new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.5, metalness:0.3 })
  );
  bRail.rotation.x = Math.PI/2; bRail.position.y = by+1.0; balcony.add(bRail);

  scene.add(balcony);

  // -----------------------------
  // CENTER PEDESTAL (VISIBLE) + TABLE ON TOP
  // -----------------------------
  const tableGroup = new THREE.Group(); tableGroup.name="PokerStage";

  // pedestal sits inside the pit, top flush near pit surface
  const pedestalTopY = pitY + 0.10;       // slightly above pit bottom but still in pit
  const pedestalH = (0 - pedestalTopY) + 0.15; // reaches to deck with a little lip
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(3.9, 4.25, pedestalH, 64),
    new THREE.MeshStandardMaterial({
      color:0x07070f, roughness:0.85, metalness:0.15,
      emissive:0x8a2be2, emissiveIntensity:0.10
    })
  );
  pedestal.position.y = pedestalTopY + pedestalH/2;
  tableGroup.add(pedestal);

  // pedestal neon trim
  const pedestalTrim = new THREE.Mesh(
    new THREE.TorusGeometry(4.05, 0.07, 12, 220),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.2, roughness:0.35 })
  );
  pedestalTrim.rotation.x = Math.PI/2;
  pedestalTrim.position.y = 0.06;
  tableGroup.add(pedestalTrim);

  // table sits on pedestal top (in the pit)
  const tableY = pedestalTopY + 0.25;
  const table = new THREE.Group(); table.name="NeonTable";
  table.position.y = tableY;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 3.2, 1.3, 48),
    new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.5, metalness:0.35, emissive:0x8a2be2, emissiveIntensity:0.28 })
  );
  base.position.y = 0.70;
  table.add(base);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 5.4, 0.35, 96),
    new THREE.MeshStandardMaterial({ color:0x07070c, roughness:0.85, metalness:0.12 })
  );
  top.position.y = 1.55;
  table.add(top);

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(5.45, 0.22, 18, 140),
    new THREE.MeshStandardMaterial({ color:0x050508, roughness:0.55, metalness:0.25 })
  );
  trim.rotation.x = Math.PI/2;
  trim.position.y = 1.72;
  table.add(trim);

  const neon = new THREE.Mesh(
    new THREE.TorusGeometry(5.55, 0.06, 10, 160),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.25, roughness:0.4 })
  );
  neon.rotation.x = Math.PI/2;
  neon.position.y = 1.72;
  table.add(neon);

  // chairs
  const chairMat = new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.65, metalness:0.25 });
  const chairGlow = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.8, roughness:0.4 });
  const chairDist = 7.15;

  for (let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    const chair = new THREE.Group();
    chair.position.set(Math.cos(a)*chairDist, 0, Math.sin(a)*chairDist);
    chair.lookAt(0, 0.8, 0);

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.22, 28), chairMat);
    seat.position.y = 0.85; chair.add(seat);

    const back = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 14, 48, Math.PI), chairMat);
    back.rotation.x = Math.PI/2;
    back.rotation.z = Math.PI/2;
    back.position.set(0, 1.25, -0.35);
    chair.add(back);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.75, 12), chairMat);
    stem.position.y = 0.45; chair.add(stem);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 10, 44), chairGlow);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.05;
    chair.add(ring);

    table.add(chair);
  }

  tableGroup.add(table);
  scene.add(tableGroup);

  // -----------------------------
  // BOT DEMO (8 capsules orbiting table + idle bob)
  // -----------------------------
  const bots = new THREE.Group(); bots.name="BotsDemo";
  const botGeo = new THREE.CapsuleGeometry(0.22, 0.85, 6, 12);
  const botMats = [
    new THREE.MeshStandardMaterial({ color:0x2b5cff, roughness:0.75 }),
    new THREE.MeshStandardMaterial({ color:0xff3b7a, roughness:0.75 }),
    new THREE.MeshStandardMaterial({ color:0x00c2ff, roughness:0.75 }),
    new THREE.MeshStandardMaterial({ color:0x7cff4a, roughness:0.75 }),
  ];

  const botBaseR = 9.2;
  const botY = tableY + 0.35;
  const botList = [];
  for (let i=0;i<8;i++){
    const m = new THREE.Mesh(botGeo, botMats[i%4]);
    m.position.set(Math.cos((i/8)*Math.PI*2)*botBaseR, botY, Math.sin((i/8)*Math.PI*2)*botBaseR);
    m.lookAt(0, botY, 0);
    m.userData.phase = (i/8)*Math.PI*2;
    botList.push(m);
    bots.add(m);
  }
  scene.add(bots);

  // Guard at entrance
  const guard = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.26,0.95,6,12),
    new THREE.MeshStandardMaterial({ color:0x111111, emissive:0x8a2be2, emissiveIntensity:0.25 })
  );
  guard.position.set(Math.cos(entranceAngle)*(holeR+0.55), 0.6, Math.sin(entranceAngle)*(holeR+0.55));
  guard.rotation.y = -entranceAngle + Math.PI;
  guard.name="GUARD_PLACEHOLDER";
  scene.add(guard);

  // -----------------------------
  // CAMERA DEFAULT
  // -----------------------------
  camera.position.set(0, 1.6, 14);
  camera.lookAt(0, 1.4, 0);

  // -----------------------------
  // MOUNT ANDROID CONTROLS
  // -----------------------------
  const moveStick = createMoveStick({ size: 140, margin: 18 });
  const lookPad   = createLookPad({ width: 180, height: 160, margin: 18, sensitivity: 1.8 });

  try{
    log(`[android] moveStick=${!!document.getElementById("scarlett-move-stick")} lookPad=${!!document.getElementById("scarlett-look-pad")}`);
    log(`[android] z(move)=${getComputedStyle(moveStick.el).zIndex} z(look)=${getComputedStyle(lookPad.el).zIndex}`);
  } catch {}

  log('[world] LOBBY + OPEN PIT + PEDESTAL TABLE + BOTS DEMO ✅');

  // -----------------------------
  // UPDATES (move/look + neon pulse + bots orbit)
  // -----------------------------
  let t = 0;
  return {
    updates:[
      (dt)=> moveStick.updateMove(dt, 3.2),
      ()=> lookPad.updateLook(),
      (dt)=>{
        t += dt;

        // table neon pulse
        neon.material.emissiveIntensity = 1.15 + Math.sin(t*1.4)*0.18;

        // pit lip pulse
        pitLip.material.emissiveIntensity = 1.10 + Math.sin(t*1.1)*0.18;

        // bot demo: slow orbit + bob
        const orbitSpeed = 0.18; // radians/sec
        for (let i=0;i<botList.length;i++){
          const b = botList[i];
          const a = b.userData.phase + t*orbitSpeed;
          b.position.x = Math.cos(a)*botBaseR;
          b.position.z = Math.sin(a)*botBaseR;
          b.position.y = botY + Math.sin(t*2.2 + i)*0.06;
          b.lookAt(0, botY, 0);
        }
      }
    ],
    interactables:[]
  };
}
