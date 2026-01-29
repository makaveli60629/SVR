/**
 * /js/scarlett1/world.js — PERMANENT
 * - OPEN pit divot (NO center disk)
 * - Brighter lobby lighting
 * - Android controls:
 *    - Left joystick = move
 *    - Right look pad = turn (yaw)
 * Safe: no imports (prevents GitHub ESM black screen)
 */

export async function init(ctx){
  const { THREE, scene, camera, log } = ctx;

  const holeR = 6.0;
  const outerR = 70.0;
  const pitY  = -1.65;
  const entranceAngle = Math.PI/2;

  // ============================================================
  // ANDROID MOVE JOYSTICK (LEFT)
  // ============================================================
  function createMoveStick({ size=120, margin=18, deadzone=0.12 } = {}) {
    const root = document.createElement("div");
    root.style.cssText = `
      position:fixed; left:${margin}px; bottom:${margin}px;
      width:${size}px; height:${size}px; border-radius:999px;
      background:rgba(255,255,255,0.22);
      border:1px solid rgba(255,255,255,0.25);
      z-index:70; touch-action:none; user-select:none;
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

    const updateMove=(dt, speed=2.8)=>{
      if(isXRPresenting()) return; // don’t fight XR
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

  // ============================================================
  // ANDROID LOOK PAD (RIGHT) — swipe to turn yaw
  // ============================================================
  function createLookPad({ width=160, height=160, margin=18, sensitivity=1.6 } = {}) {
    const pad=document.createElement("div");
    pad.style.cssText=`
      position:fixed; right:${margin}px; bottom:${margin}px;
      width:${width}px; height:${height}px; border-radius:22px;
      background:rgba(255,255,255,0.10);
      border:1px solid rgba(255,255,255,0.20);
      z-index:70; touch-action:none; user-select:none;
    `;
    const label=document.createElement("div");
    label.textContent="LOOK";
    label.style.cssText=`
      position:absolute; left:12px; top:10px;
      font:700 12px system-ui; letter-spacing:.12em;
      opacity:.7; color:white;
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
      yawDelta += (dx / 200) * sensitivity; // scaled
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
      yawDelta *= 0.35; // decay
    };

    return { updateLook };
  }

  // ==========================
  // BRIGHTER LIGHTING
  // ==========================
  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  const hemi = new THREE.HemisphereLight(0xffffff, 0x202040, 0.85);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.05);
  dir.position.set(10,18,12);
  scene.add(dir);

  const topLight = new THREE.PointLight(0xffffff, 2.2, 220);
  topLight.position.set(0,12.0,0);
  scene.add(topLight);

  for (let i=0;i<18;i++){
    const a=(i/18)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.4, 95);
    p.position.set(Math.cos(a)*(outerR*0.55), 6.2, Math.sin(a)*(outerR*0.55));
    scene.add(p);
  }

  // Upper deck ring (hole)
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 180, 1),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide })
  );
  deck.rotation.x = -Math.PI/2;
  deck.position.y = 0;
  scene.add(deck);

  const grid = new THREE.GridHelper(outerR*2, 80, 0x2a2a44, 0x141422);
  grid.position.y = 0.01;
  scene.add(grid);

  // ==========================
  // OPEN PIT DIVOT (NO DISK)
  // ==========================
  const pit = new THREE.Group(); pit.name="PitDivot";
  const pitDepth = (0 - pitY);

  const pitWallMat = new THREE.MeshStandardMaterial({
    color: 0x05050b, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide
  });

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, pitDepth + 0.25, 200, 1, true),
    pitWallMat
  );
  pitWall.position.y = pitY + (pitDepth / 2);
  pit.add(pitWall);

  const pitNeonMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.0, roughness:0.35
  });
  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.08, 0.045, 12, 220),
    pitNeonMat
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.02;
  pit.add(pitLip);

  const fogMat = new THREE.MeshStandardMaterial({
    color:0x000000, transparent:true, opacity:0.18, roughness:1.0, metalness:0.0, side:THREE.DoubleSide
  });
  const fog = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR-0.15, holeR-0.15, pitDepth, 120, 1, true),
    fogMat
  );
  fog.position.y = pitY + pitDepth/2;
  pit.add(fog);

  scene.add(pit);

  // Lobby shell
  const shell = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x05050b, roughness:0.95, side:THREE.DoubleSide });

  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, 10.5, 200, 1, true), wallMat);
  outerWall.position.y = 5.25; shell.add(outerWall);

  const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR-0.7, outerR-0.7, 10.5, 200, 1, true), wallMat);
  innerWall.position.y = 5.25; shell.add(innerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 200, 1),
    new THREE.MeshStandardMaterial({ color: 0x040409, roughness:1.0, side:THREE.DoubleSide })
  );
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = 10.5;
  shell.add(ceiling);

  const shellNeonMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.3, roughness:0.45 });
  for (let i=0;i<3;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(outerR-1.6-i*1.0, 0.07, 12, 240), shellNeonMat);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 9.9 - i*0.7;
    shell.add(ring);
  }
  scene.add(shell);

  // Rail + entrance gap
  const rail = new THREE.Group();
  const railY = 1.0;
  const postMat = new THREE.MeshStandardMaterial({ color:0x12121a, roughness:0.8 });
  const railMat2 = new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.6, metalness:0.25 });

  const topRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.04, 10, 220), railMat2);
  topRing.rotation.x = Math.PI/2; topRing.position.y = railY; rail.add(topRing);

  const midRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.03, 10, 220), railMat2);
  midRing.rotation.x = Math.PI/2; midRing.position.y = railY-0.35; rail.add(midRing);

  const postGeo = new THREE.CylinderGeometry(0.05,0.05,1.0,12);
  const count = 64;
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

  // Stairs
  const stairs = new THREE.Group();
  const steps = 14;
  const stepH = (0 - pitY)/steps;
  const stepD = 0.28;
  const wStep = 1.25;
  const stepMat = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.95 });
  const glowMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.9, roughness:0.45 });

  const startR = holeR+0.75;
  for (let i=0;i<steps;i++){
    const t=i/(steps-1);
    const y = 0 - t*(0-pitY) - stepH*0.5;
    const r = startR - t*1.25;
    const s = new THREE.Mesh(new THREE.BoxGeometry(wStep, stepH*0.95, stepD), stepMat);
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

  // Balcony
  const balcony = new THREE.Group();
  const by = 6.8;
  const inner = outerR-6.0;
  const outer = outerR-2.5;

  const bDeck = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 200, 1),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide })
  );
  bDeck.rotation.x = -Math.PI/2; bDeck.position.y = by; balcony.add(bDeck);

  const bRail = new THREE.Mesh(
    new THREE.TorusGeometry(outer-0.35, 0.05, 10, 240),
    new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.5, metalness:0.3 })
  );
  bRail.rotation.x = Math.PI/2; bRail.position.y = by+1.0; balcony.add(bRail);

  scene.add(balcony);

  // Table + chairs
  const tableGroup = new THREE.Group();
  tableGroup.position.y = pitY + 0.35;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 3.2, 1.3, 48),
    new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.5, metalness:0.35, emissive:0x8a2be2, emissiveIntensity:0.25 })
  );
  base.position.y = 0.7; tableGroup.add(base);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 5.4, 0.35, 96),
    new THREE.MeshStandardMaterial({ color:0x07070c, roughness:0.85, metalness:0.12 })
  );
  top.position.y = 1.55; tableGroup.add(top);

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(5.45, 0.22, 18, 140),
    new THREE.MeshStandardMaterial({ color:0x050508, roughness:0.55, metalness:0.25 })
  );
  trim.rotation.x = Math.PI/2; trim.position.y = 1.72; tableGroup.add(trim);

  const neon = new THREE.Mesh(
    new THREE.TorusGeometry(5.55, 0.06, 10, 160),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.15, roughness:0.4 })
  );
  neon.rotation.x = Math.PI/2; neon.position.y = 1.72; tableGroup.add(neon);

  const chairMat = new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.65, metalness:0.25 });
  const chairGlow = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.7, roughness:0.4 });
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

    tableGroup.add(chair);
  }
  scene.add(tableGroup);

  // Camera
  camera.position.set(0, 1.6, 14);
  camera.lookAt(0, 1.4, 0);

  // Mount Android controls
  const moveStick = createMoveStick({ size: 120, margin: 18 });
  const lookPad   = createLookPad({ width: 160, height: 160, margin: 18, sensitivity: 1.6 });

  log('[world] OPEN pit divot (no disk) + stadium built ✅');
  log('[android] move stick + look pad mounted ✅');

  // Updates: move + look + neon pulse
  let t = 0;
  return {
    updates:[
      (dt)=> moveStick.updateMove(dt, 3.0),
      (dt)=> lookPad.updateLook(dt),
      (dt)=>{
        t += dt;
        neon.material.emissiveIntensity = 1.0 + Math.sin(t*1.4)*0.18;
      }
    ],
    interactables:[]
  };
}
