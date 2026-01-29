/**
 * MODULE: world.js (SCARLETT1)
 * Builds: stadium deck hole + OPEN pit divot (NO center disk) + double walls + rails + stairs + balcony + neon table
 * Safe: no external imports (prevents GitHub Pages module-load black screen).
 *
 * ONLY EDIT /js/scarlett1/* from now on.
 */
export async function init(ctx){
  const { THREE, scene, camera, log } = ctx;

  const holeR = 6.0;
  const outerR = 70.0;
  const pitY  = -1.65;            // pit depth (lower = deeper)
  const entranceAngle = Math.PI/2;

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
    new THREE.MeshStandardMaterial({
      color: 0x0b0b12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide
    })
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
  // No center disk. Inner pit wall cylinder shows depth.
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

  // Lip neon ring near opening (depth cue)
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

  // Dark fog cylinder (visual depth cue)
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
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x05050b, roughness:0.95, side:THREE.DoubleSide
  });

  const outerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR, outerR, 10.5, 200, 1, true),
    wallMat
  );
  outerWall.position.y = 5.25;
  shell.add(outerWall);

  const innerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR-0.7, outerR-0.7, 10.5, 200, 1, true),
    wallMat
  );
  innerWall.position.y = 5.25;
  shell.add(innerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 200, 1),
    new THREE.MeshStandardMaterial({
      color: 0x040409, roughness:1.0, side:THREE.DoubleSide
    })
  );
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = 10.5;
  shell.add(ceiling);

  const neonMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.25, roughness:0.5
  });
  for (let i=0;i<3;i++){
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(outerR-1.6-i*1.0, 0.07, 12, 240),
      neonMat
    );
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

  const topRing = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.85, 0.04, 10, 220),
    railMat
  );
  topRing.rotation.x = Math.PI/2;
  topRing.position.y = railY;
  rail.add(topRing);

  const midRing = new THREE.Mesh(
    new THREE.TorusGeometry(holeR+0.85, 0.03, 10, 220),
    railMat
  );
  midRing.rotation.x = Math.PI/2;
  midRing.position.y = railY-0.35;
  rail.add(midRing);

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

  // Stairs down into pit (aligned to entrance gap)
  const stairs = new THREE.Group(); stairs.name="Stairs";
  const steps = 14;
  const stepH = (0 - pitY)/steps;
  const stepD = 0.28;
  const w = 1.25;
  const stepMat = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.95 });
  const glowMat = new THREE.MeshStandardMaterial({
    color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.8, roughness:0.5
  });

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
  railL.rotation.y = -entranceAngle;
  stairs.add(railL);

  const railR = railL.clone();
  railR.position.set(Math.cos(entranceAngle)*(startR+0.15), (0+pitY)/2+0.1, Math.sin(entranceAngle)*(startR+0.15));
  stairs.add(railR);

  scene.add(stairs);

  // Balcony ring
  const balcony = new THREE.Group(); balcony.name="Balcony";
  const by = 6.8;
  const inner = outerR-6.0;
  const outer = outerR-2.5;

  const bDeck = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 200, 1),
    new THREE.MeshStandardMaterial({
      color:0x0a0a12, roughness:1.0, metalness:0.05, side:THREE.DoubleSide
    })
  );
  bDeck.rotation.x = -Math.PI/2;
  bDeck.position.y = by;
  balcony.add(bDeck);

  const bRail = new THREE.Mesh(
    new THREE.TorusGeometry(outer-0.35, 0.05, 10, 240),
    new THREE.MeshStandardMaterial({ color:0x1a1a26, roughness:0.5, metalness:0.3 })
  );
  bRail.rotation.x = Math.PI/2;
  bRail.position.y = by+1.0;
  balcony.add(bRail);

  scene.add(balcony);

  // Neon table + chairs
  const tableGroup = new THREE.Group(); tableGroup.name="NeonTable";
  tableGroup.position.y = pitY + 0.35;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 3.2, 1.3, 48),
    new THREE.MeshStandardMaterial({
      color:0x0b0b10, roughness:0.5, metalness:0.35,
      emissive:0x8a2be2, emissiveIntensity:0.25
    })
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
    new THREE.MeshStandardMaterial({
      color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:1.1, roughness:0.4
    })
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
    seat.position.y = 0.85;
    chair.add(seat);

    const back = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 14, 48, Math.PI), chairMat);
    back.rotation.x = Math.PI/2;
    back.rotation.z = Math.PI/2;
    back.position.set(0, 1.25, -0.35);
    chair.add(back);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.75, 12), chairMat);
    stem.position.y = 0.45;
    chair.add(stem);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 10, 44), chairGlow);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.05;
    chair.add(ring);

    tableGroup.add(chair);
  }

  scene.add(tableGroup);

  // Guard placeholder at entrance
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

  log('[world] OPEN pit divot (no disk) + stadium built ✅');

  // Per-frame updates (subtle neon pulse)
  let t = 0;
  return {
    updates:[(dt)=>{
      t += dt;
      neon.material.emissiveIntensity = 0.95 + Math.sin(t*1.4)*0.15;
    }],
    interactables:[]
  };
}
