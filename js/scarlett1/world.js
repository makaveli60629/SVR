/**
 * MODULE: world.js (SCARLETT1) — PERMANENT WORLD
 * - Stadium deck + OPEN pit divot (NO center disk)
 * - Double walls + rails + stairs + balcony + neon table
 * - SAFE Android joystick (INLINE, no imports; cannot black-screen)
 *
 * ONLY EDIT /js/scarlett1/* from now on.
 */
export async function init(ctx){
  const { THREE, scene, camera, log } = ctx;

  const holeR = 6.0;
  const outerR = 70.0;
  const pitY  = -1.65;            // pit depth (lower = deeper)
  const entranceAngle = Math.PI/2;

  // ============================================================
  // SAFE ANDROID JOYSTICK (INLINE) — cannot fail module loading
  // ============================================================
  function createAndroidJoystick(opts = {}) {
    const {
      size = 120,
      margin = 18,
      deadzone = 0.12,
      opacity = 0.22,
      knobOpacity = 0.35,
    } = opts;

    const root = document.createElement("div");
    root.style.position = "fixed";
    root.style.left = `${margin}px`;
    root.style.bottom = `${margin}px`;
    root.style.width = `${size}px`;
    root.style.height = `${size}px`;
    root.style.borderRadius = "999px";
    root.style.background = `rgba(255,255,255,${opacity})`;
    root.style.border = "1px solid rgba(255,255,255,0.25)";
    root.style.zIndex = "60";
    root.style.touchAction = "none";
    root.style.userSelect = "none";
    root.style.webkitUserSelect = "none";

    const knob = document.createElement("div");
    knob.style.position = "absolute";
    knob.style.left = "50%";
    knob.style.top = "50%";
    knob.style.transform = "translate(-50%,-50%)";
    knob.style.width = `${size * 0.44}px`;
    knob.style.height = `${size * 0.44}px`;
    knob.style.borderRadius = "999px";
    knob.style.background = `rgba(0,0,0,${knobOpacity})`;
    knob.style.border = "1px solid rgba(255,255,255,0.22)";
    knob.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
    root.appendChild(knob);

    document.body.appendChild(root);

    let active = false;
    let pid = null;
    let cx = 0, cy = 0;
    let x = 0, y = 0;

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function setKnob(nx, ny) {
      const r = (size * 0.5) - (size * 0.22);
      knob.style.transform = `translate(calc(-50% + ${nx*r}px), calc(-50% + ${ny*r}px))`;
    }
    function reset() { active=false; pid=null; x=0; y=0; setKnob(0,0); }

    function onDown(e){
      active = true;
      pid = e.pointerId;
      root.setPointerCapture(pid);
      const rect = root.getBoundingClientRect();
      cx = rect.left + rect.width/2;
      cy = rect.top + rect.height/2;
      onMove(e);
    }
    function onMove(e){
      if (!active || e.pointerId !== pid) return;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      const r = size * 0.5;
      let nx = dx / r;
      let ny = dy / r;

      // clamp to circle
      const mag = Math.hypot(nx, ny);
      if (mag > 1) { nx/=mag; ny/=mag; }

      // deadzone
      if (Math.hypot(nx, ny) < deadzone) { nx=0; ny=0; }

      x = clamp(nx, -1, 1);
      y = clamp(ny, -1, 1);
      setKnob(x, y);
    }
    function onUp(e){
      if (e.pointerId !== pid) return;
      try { root.releasePointerCapture(pid); } catch {}
      reset();
    }

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);

    function isXRPresenting(){
      const r = window.__SCARLETT_RENDERER__;
      return !!(r && r.xr && r.xr.isPresenting);
    }

    function updateMove(dt, camera, speed = 2.8){
      if (!camera) return;
      if (isXRPresenting()) return; // don’t fight XR

      const strafe  = x;
      const forward = -y;

      if (Math.abs(strafe) < 0.001 && Math.abs(forward) < 0.001) return;

      const vF = new THREE.Vector3();
      camera.getWorldDirection(vF);
      vF.y = 0; vF.normalize();

      const vR = new THREE.Vector3().crossVectors(vF, new THREE.Vector3(0,1,0)).normalize();

      const move = new THREE.Vector3();
      move.addScaledVector(vF, forward);
      move.addScaledVector(vR, strafe);

      if (move.lengthSq() > 0){
        move.normalize().multiplyScalar(speed * dt);
        camera.position.add(move);
      }
    }

    return { updateMove };
  }

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const dir = new THREE.DirectionalLight(0xffffff, 0.65);
  dir.position.set(8,14,10);
  scene.add(dir);

  const topLight = new THREE.PointLight(0xffffff, 1.2, 140);
  topLight.position.set(0,10.5,0);
  scene.add(topLight);

  for (let i=0;i<14;i++){
    const a=(i/14)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.1, 70);
    p.position.set(Math.cos(a)*(outerR*0.55), 6.0, Math.sin(a)*(outerR*0.55));
    scene.add(p);
  }

  // Upper deck ring (hole)
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 180, 1),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide })
  );
  deck.rotation.x = -Math.PI/2;
  deck.position.y = 0;
  deck.name = "UpperDeck";
  scene.add(deck);

  const grid = new THREE.GridHelper(outerR*2, 80, 0x2a2a44, 0x141422);
  grid.position.y = 0.01;
  scene.add(grid);

  // ==========================
  // PIT / DIVOT (OPEN CENTER)
  // ==========================
  const pit = new THREE.Group(); pit.name="PitDivot";
  const pitDepth = (0 - pitY);

  const pitWallMat = new THREE.MeshStandardMaterial({
    color: 0x05050b, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide
  });

  // Inner wall cylinder (open ended)
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, pitDepth + 0.25, 200, 1, true),
    pitWallMat
  );
  pitWall.position.y = pitY + (pitDepth / 2);
  pit.add(pitWall);

  // Lip neon ring near opening
  const pitNeonMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.9, roughness:0.4
  });
  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.08, 0.045, 12, 220),
    pitNeonMat
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.02;
  pit.add(pitLip);

  // Fog volume (depth cue)
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

  // Double walls + ceiling
  const shell = new THREE.Group(); shell.name="LobbyShell";
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

  const shellNeonMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.25, roughness:0.5 });
  for (let i=0;i<3;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(outerR-1.6-i*1.0, 0.07, 12, 240), shellNeonMat);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 9.9 - i*0.7;
    shell.add(ring);
  }
  scene.add(shell);

  // Rail around hole (with entrance gap)
  const rail = new THREE.Group(); rail.name="Rail";
  const railY = 1.0;
  const postMat = new THREE.MeshStandardMaterial({ color:0x12121a, roughness:0.8 });
  const railMat = new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.6, metalness:0.25 });

  const topRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.04, 10, 220), railMat);
  topRing.rotation.x = Math.PI/2; topRing.position.y = railY; rail.add(topRing);

  const midRing = new THREE.Mesh(new THREE.TorusGeometry(holeR+0.85, 0.03, 10, 220), railMat);
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

  // Stairs down into pit
  const stairs = new THREE.Group(); stairs.name="Stairs";
  const steps = 14;
  const stepH = (0 - pitY)/steps;
  const stepD = 0.28;
  const w = 1.25;
  const stepMat = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.95 });
  const glowMat = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.8, roughness:0.5 });

  const startR = holeR+0.75;
  for (let i=0;i<steps;i++){
    const t=i/(steps-1);
    const y = 0 - t*(0-pitY) - stepH*0.5;
    const r = startR - t*1.25;
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

  // Balcony
  const balcony = new THREE.Group(); balcony.name="Balcony";
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

  // Neon table + chairs
  const tableGroup = new THREE.Group(); tableGroup.name="NeonTable";
  tableGroup.position.y = pitY + 0.35;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 3.2, 1.3, 48),
    new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.5, metalness:0.35, emissive:0x8a2be2, emissiveIntensity:0.25 })
  );
  base.position.y = 0.7;
  tableGroup.add(base);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 5.4, 0.35, 96),
    new THREE.MeshStandardMaterial({ color:0x07070c, roughness:0.85, metalness:0.12 })
  );
  top.position.y = 1.55;
  tableGroup.add(top);

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(5.45, 0.22, 18, 140),
    new THREE.MeshStandardMaterial({ color:0x050508, roughness:0.55, metalness:0.25 })
  );
  trim.rotation.x = Math.PI/2;
  trim.position.y = 1.72;
  tableGroup.add(trim);

  const neon = new THREE.Mesh(
    new THREE.TorusGeometry(5.55, 0.06, 10, 160),
    new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.1, roughness:0.4 })
  );
  neon.rotation.x = Math.PI/2;
  neon.position.y = 1.72;
  tableGroup.add(neon);

  const chairMat = new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.65, metalness:0.25 });
  const chairGlow = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.6, roughness:0.4 });
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

  // Guard placeholder
  const guard = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.26,0.95,6,12),
    new THREE.MeshStandardMaterial({ color:0x111111, emissive:0x8a2be2, emissiveIntensity:0.25 })
  );
  guard.position.set(Math.cos(entranceAngle)*(holeR+0.55), 0.6, Math.sin(entranceAngle)*(holeR+0.55));
  guard.rotation.y = -entranceAngle + Math.PI;
  guard.name="GUARD_PLACEHOLDER";
  scene.add(guard);

  // Camera default
  camera.position.set(0, 1.6, 14);
  camera.lookAt(0, 1.4, 0);

  // Joystick ON (bottom-left) — safe
  const joy = createAndroidJoystick({ size: 120, margin: 18 });
  log('[world] OPEN pit divot (no disk) + stadium built ✅');
  log('[android] joystick mounted ✅');

  // Updates
  let t = 0;
  const moveUpdate = (dt)=> joy.updateMove(dt, camera, 2.8);

  return {
    updates:[
      moveUpdate,
      (dt)=>{
        t += dt;
        neon.material.emissiveIntensity = 0.95 + Math.sin(t*1.4)*0.15;
      }
    ],
    interactables:[]
  };
    }
