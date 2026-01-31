/**
 * SCARLETT1 DEMO WORLD — BEAUTIFIED
 * - Carpet ring floor (procedural)
 * - Pit walls textured (procedural brick/tech)
 * - Neon trim at pit bottom for depth
 * - Pillars + ceiling ring lights
 * - Stairs down into pit + back up
 * - Balcony ONLY above store (sector), not full ring
 * - Rails
 * - Simple bots walking + ninja guard at pit entrance
 */
export async function init(ctx){
  const { THREE, scene, rig, log } = ctx;

  // -------------------------
  // DIMENSIONS
  // -------------------------
  const lobbyR = 46;
  const wallH  = 11;
  const wallT  = 1.2;

  const pitR = 10.5;
  const pitDepth = 7.6;

  const pitFloorY = -pitDepth + 0.05;

  // Store direction (front, +Z)
  const storeAngle = Math.PI/2; // +Z direction

  // -------------------------
  // PROCEDURAL TEXTURES
  // -------------------------
  function makeCarpetTexture(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");

    // base
    g.fillStyle = "#1a0f2a";
    g.fillRect(0,0,512,512);

    // weave noise
    for (let i=0;i<26000;i++){
      const x = (Math.random()*512)|0;
      const y = (Math.random()*512)|0;
      const v = 18 + (Math.random()*42)|0;
      g.fillStyle = `rgb(${v},${v*0.55|0},${v*1.35|0})`;
      g.fillRect(x,y,1,1);
    }

    // subtle stripes
    g.globalAlpha = 0.18;
    for (let y=0;y<512;y+=18){
      g.fillStyle = (y%36===0) ? "#2a1a42" : "#140b22";
      g.fillRect(0,y,512,8);
    }
    g.globalAlpha = 1;

    // neon thread arcs
    g.globalAlpha = 0.35;
    g.strokeStyle = "#00c8ff";
    g.lineWidth = 2;
    for (let i=0;i<10;i++){
      g.beginPath();
      g.arc(256,256, 60+i*22, 0, Math.PI*2);
      g.stroke();
    }
    g.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8,8);
    tex.anisotropy = 8;
    return tex;
  }

  function makeBrickTechTexture(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");

    // base dark
    g.fillStyle = "#0a0a12";
    g.fillRect(0,0,512,512);

    // bricks
    const bw = 84, bh = 44;
    for (let y=0;y<512;y+=bh){
      for (let x=0;x<512;x+=bw){
        const off = ((y/bh)|0)%2 ? bw/2 : 0;
        const rx = x + off;
        const col = 18 + ((Math.random()*20)|0);
        g.fillStyle = `rgb(${col},${col},${col+8})`;
        g.fillRect(rx, y, bw-6, bh-6);

        // seams glow hint
        g.strokeStyle = "rgba(0,200,255,0.08)";
        g.lineWidth = 2;
        g.strokeRect(rx, y, bw-6, bh-6);
      }
    }

    // tech lines
    g.globalAlpha = 0.4;
    g.strokeStyle = "#8a2be2";
    g.lineWidth = 2;
    for (let i=0;i<24;i++){
      g.beginPath();
      g.moveTo(0, (Math.random()*512)|0);
      g.lineTo(512, (Math.random()*512)|0);
      g.stroke();
    }
    g.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6,2);
    tex.anisotropy = 8;
    return tex;
  }

  const carpetTex = makeCarpetTexture();
  const brickTex  = makeBrickTechTexture();

  // -------------------------
  // MATERIAL HELPERS
  // -------------------------
  const matCarpet = new THREE.MeshStandardMaterial({
    map: carpetTex,
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  const matWall = new THREE.MeshStandardMaterial({
    color: 0x121225,
    roughness: 0.75,
    metalness: 0.22,
    side: THREE.DoubleSide
  });

  const matPitWall = new THREE.MeshStandardMaterial({
    map: brickTex,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.08,
    side: THREE.DoubleSide
  });

  const emissiveMat = (c, e, inten=1.7) => new THREE.MeshStandardMaterial({
    color: c, emissive: e, emissiveIntensity: inten,
    roughness: 0.45, metalness: 0.2
  });

  // -------------------------
  // LIGHTING (more + brighter)
  // -------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x283060, 1.35);
  hemi.position.set(0, 50, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(10, 18, 8);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 1.6, 300);
  top.position.set(0, 17, 0);
  scene.add(top);

  // Ceiling ring lights (high, non-blocking)
  {
    const ringCount = 3;
    for (let k=0;k<ringCount;k++){
      const r = lobbyR - 10 - k*6;
      const y = 10.4;
      const torG = new THREE.TorusGeometry(r, 0.09, 10, 200);
      const torM = emissiveMat(0x00d5ff, 0x00b7ff, 2.2 - k*0.4);
      const tor = new THREE.Mesh(torG, torM);
      tor.rotation.x = Math.PI/2;
      tor.position.y = y;
      scene.add(tor);

      // add actual light points around ring
      for (let i=0;i<10;i++){
        const a = (i/10)*Math.PI*2;
        const p = new THREE.PointLight(0x66ccff, 0.75, 60);
        p.position.set(Math.cos(a)*r, y-0.2, Math.sin(a)*r);
        scene.add(p);
      }
    }
  }

  // -------------------------
  // FLOOR: RING CARPET (NO CAP OVER PIT)
  // Tighten gap by matching inner radius to pit lip closely
  // -------------------------
  const innerFloorR = pitR + 0.30;
  {
    const g = new THREE.RingGeometry(innerFloorR, lobbyR, 180, 1);
    const floor = new THREE.Mesh(g, matCarpet);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0.0;
    scene.add(floor);

    // inner trim to hide any tiny gap
    const trimG = new THREE.TorusGeometry(innerFloorR + 0.02, 0.08, 10, 160);
    const trimM = emissiveMat(0x8a2be2, 0x6f00ff, 1.7);
    const trim = new THREE.Mesh(trimG, trimM);
    trim.rotation.x = Math.PI/2;
    trim.position.y = 0.05;
    scene.add(trim);
  }

  // -------------------------
  // OUTER WALL
  // -------------------------
  {
    const g = new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 180, 1, true);
    const wall = new THREE.Mesh(g, matWall);
    wall.position.y = wallH/2;
    scene.add(wall);

    // neon band (single band only — no “whole balcony ring” look)
    const bandG = new THREE.TorusGeometry(lobbyR-0.35, 0.10, 10, 220);
    const bandM = emissiveMat(0x00d5ff, 0x00b7ff, 2.0);
    const band = new THREE.Mesh(bandG, bandM);
    band.rotation.x = Math.PI/2;
    band.position.y = 2.4;
    scene.add(band);
  }

  // -------------------------
  // PIT WALL + NEON LIPS + BOTTOM TRIM (depth visibility)
  // -------------------------
  {
    const pitWallG = new THREE.CylinderGeometry(pitR, pitR, pitDepth, 160, 1, true);
    const pitWall = new THREE.Mesh(pitWallG, matPitWall);
    pitWall.position.y = -pitDepth/2 + 0.08;
    scene.add(pitWall);

    // top lip glow
    const lipG = new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 140);
    const lipM = emissiveMat(0x00ffff, 0x00c8ff, 2.5);
    const lip = new THREE.Mesh(lipG, lipM);
    lip.rotation.x = Math.PI/2;
    lip.position.y = 1.05;
    scene.add(lip);

    // mid-depth glow rings
    for (let i=1;i<=2;i++){
      const rr = pitR - 0.12;
      const rg = new THREE.TorusGeometry(rr, 0.06, 10, 140);
      const rm = emissiveMat(0x2222ff, 0x00a6ff, 1.6);
      const rmesh = new THREE.Mesh(rg, rm);
      rmesh.rotation.x = Math.PI/2;
      rmesh.position.y = pitFloorY + (pitDepth * 0.33 * i);
      scene.add(rmesh);
    }

    // bottom trim glow (the one you requested)
    const bottomG = new THREE.TorusGeometry(pitR - 0.25, 0.12, 10, 140);
    const bottomM = emissiveMat(0xff00aa, 0xff00aa, 2.2);
    const bottom = new THREE.Mesh(bottomG, bottomM);
    bottom.rotation.x = Math.PI/2;
    bottom.position.y = pitFloorY + 0.18;
    scene.add(bottom);

    // subtle pit floor light so you can see depth
    const pitLight = new THREE.PointLight(0xff00aa, 0.85, 40);
    pitLight.position.set(0, pitFloorY + 1.3, 0);
    scene.add(pitLight);
  }

  // Pit floor
  let pitFloorMesh = null;
  {
    const pitFloorG = new THREE.CircleGeometry(pitR-0.28, 160);
    const pitFloorM = new THREE.MeshStandardMaterial({
      color: 0x080812, roughness: 0.98, metalness: 0.03
    });
    pitFloorMesh = new THREE.Mesh(pitFloorG, pitFloorM);
    pitFloorMesh.rotation.x = -Math.PI/2;
    pitFloorMesh.position.y = pitFloorY;
    scene.add(pitFloorMesh);
  }

  // -------------------------
  // PEDESTAL + TABLE MARKER (still placeholder)
  // -------------------------
  {
    const pedG = new THREE.CylinderGeometry(3.5, 3.5, 1.4, 72);
    const pedM = new THREE.MeshStandardMaterial({ color: 0x12121a, roughness: 0.6, metalness: 0.25 });
    const ped = new THREE.Mesh(pedG, pedM);
    ped.position.set(0, pitFloorY + 0.80, 0);
    scene.add(ped);

    const tableG = new THREE.CylinderGeometry(4.4, 4.4, 0.28, 100);
    const tableM = new THREE.MeshStandardMaterial({
      color: 0x1a0f20, roughness: 0.55, metalness: 0.2,
      emissive: 0x16001c, emissiveIntensity: 0.65
    });
    const table = new THREE.Mesh(tableG, tableM);
    table.position.set(0, pitFloorY + 1.70, 0);
    scene.add(table);

    const neonG = new THREE.TorusGeometry(4.4, 0.08, 10, 160);
    const neonM = emissiveMat(0x00ffff, 0x00c8ff, 2.0);
    const neon = new THREE.Mesh(neonG, neonM);
    neon.rotation.x = Math.PI/2;
    neon.position.set(0, pitFloorY + 1.88, 0);
    scene.add(neon);
  }

  // -------------------------
  // PIT RAIL (so you feel the edge)
  // -------------------------
  {
    const railG = new THREE.TorusGeometry(pitR + 1.4, 0.09, 10, 160);
    const railM = emissiveMat(0x00d5ff, 0x00b7ff, 1.9);
    const rail = new THREE.Mesh(railG, railM);
    rail.rotation.x = Math.PI/2;
    rail.position.y = 1.15;
    scene.add(rail);
  }

  // -------------------------
  // PILLARS (around wall)
  // -------------------------
  {
    const count = 12;
    for (let i=0;i<count;i++){
      const a = (i/count)*Math.PI*2;
      const r = lobbyR - 1.1;
      const x = Math.cos(a)*r;
      const z = Math.sin(a)*r;

      const pg = new THREE.CylinderGeometry(0.55, 0.7, 9.2, 18);
      const pm = new THREE.MeshStandardMaterial({ color: 0x0f0f1a, roughness: 0.6, metalness: 0.35 });
      const p = new THREE.Mesh(pg, pm);
      p.position.set(x, 4.6, z);
      scene.add(p);

      const glowG = new THREE.CylinderGeometry(0.65, 0.65, 0.28, 18);
      const glowM = emissiveMat(0x8a2be2, 0x6f00ff, 2.0);
      const g1 = new THREE.Mesh(glowG, glowM);
      g1.position.set(x, 2.3, z);
      scene.add(g1);

      const g2 = g1.clone();
      g2.position.y = 6.8;
      scene.add(g2);
    }
  }

  // -------------------------
  // BALCONY ONLY ABOVE STORE (SECTOR, NOT FULL RING)
  // -------------------------
  let balconyMesh = null;
  {
    const balY = 5.6;
    const inner = lobbyR - 11.0;
    const outer = lobbyR - 4.2;

    // A sector centered at storeAngle
    const thetaLen = Math.PI / 3; // 60 degrees
    const thetaStart = storeAngle - thetaLen/2;

    const g = new THREE.RingGeometry(inner, outer, 140, 1, thetaStart, thetaLen);
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: carpetTex,
      roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide
    });
    balconyMesh = new THREE.Mesh(g, m);
    balconyMesh.rotation.x = -Math.PI/2;
    balconyMesh.position.y = balY;
    scene.add(balconyMesh);

    // Balcony rail just for that sector
    const railR = inner + 0.4;
    const railG = new THREE.TorusGeometry(railR, 0.08, 10, 200, thetaLen);
    const railM = emissiveMat(0x00ffff, 0x00c8ff, 2.0);
    const rail = new THREE.Mesh(railG, railM);
    rail.rotation.x = Math.PI/2;
    rail.position.y = balY + 1.1;
    rail.rotation.z = thetaStart; // align arc
    scene.add(rail);
  }

  // -------------------------
  // JUMBOTRONS (flush)
  // -------------------------
  function placeOnCircularWall(obj, angle, wallRadius, y, depth=0.7, inset=0.05){
    const nx = Math.cos(angle), nz = Math.sin(angle);
    const r = wallRadius - inset - (depth * 0.5);
    obj.position.set(nx * r, y, nz * r);
    obj.rotation.y = angle + Math.PI;
  }

  function makeJumbotron(){
    const w = 10.5, h = 6.0, d = 0.7;
    const bodyG = new THREE.BoxGeometry(w, h, d);
    const bodyM = new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 0.35, metalness: 0.35 });
    const body = new THREE.Mesh(bodyG, bodyM);

    const screenG = new THREE.PlaneGeometry(w*0.88, h*0.82);
    const screenM = new THREE.MeshStandardMaterial({ color: 0x111133, emissive: 0x2222ff, emissiveIntensity: 0.9 });
    const screen = new THREE.Mesh(screenG, screenM);
    screen.position.z = (d/2) + 0.001;
    body.add(screen);

    const trimG = new THREE.BoxGeometry(w*0.92, h*0.86, 0.05);
    const trimM = emissiveMat(0x00c8ff, 0x00a6ff, 1.7);
    const trim = new THREE.Mesh(trimG, trimM);
    trim.position.z = (d/2) + 0.02;
    body.add(trim);

    body.userData.depth = d;
    return body;
  }

  {
    const angles = [Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
    angles.forEach((a) => {
      const j = makeJumbotron();
      placeOnCircularWall(j, a, lobbyR - (wallT*0.5), 7.3, j.userData.depth, 0.05);
      scene.add(j);

      // door marker under each jumbotron
      const doorG = new THREE.BoxGeometry(4.4, 6.6, 0.24);
      const doorM = new THREE.MeshStandardMaterial({ color: 0x0d0d14, emissive: 0x3a00ff, emissiveIntensity: 0.35 });
      const door = new THREE.Mesh(doorG, doorM);
      placeOnCircularWall(door, a, lobbyR - (wallT*0.5), 3.1, 0.24, 0.03);
      scene.add(door);
    });
  }

  // -------------------------
  // STAIRS DOWN INTO PIT (and back up)
  // Entrance at +X side (easy to find)
  // -------------------------
  function addStairs(startX, startZ, startY, endY){
    const steps = 18;
    const stepH = (startY - endY) / steps;
    const stepD = 0.55;
    const stepW = 2.2;

    const mat = new THREE.MeshStandardMaterial({
      color: 0x101018, roughness: 0.8, metalness: 0.2,
      emissive: 0x08002a, emissiveIntensity: 0.25
    });

    for (let i=0;i<steps;i++){
      const y = startY - (i+1)*stepH;
      const g = new THREE.BoxGeometry(stepW, stepH*0.95, stepD);
      const s = new THREE.Mesh(g, mat);
      const z = startZ - i*stepD; // march inward
      s.position.set(startX, y, z);
      scene.add(s);
      ctx.teleportSurfaces.push(s);
    }

    // rail posts along stairs
    for (let i=0;i<7;i++){
      const y = startY - i*(startY-endY)/6;
      const postG = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 10);
      const postM = emissiveMat(0x00d5ff, 0x00b7ff, 1.3);
      const p = new THREE.Mesh(postG, postM);
      p.position.set(startX + stepW/2 + 0.18, y + 0.5, startZ - i*1.4);
      scene.add(p);
    }
  }

  // Start from lobby floor near pit edge, end near pit floor
  addStairs(pitR + 2.2, 2.5, 0.9, pitFloorY + 0.9);

  // -------------------------
  // PADS (store/vip/poker) — keep above ground, not in pit
  // -------------------------
  function makePad(color){
    const padG = new THREE.CylinderGeometry(1.05, 1.05, 0.18, 42);
    const padM = emissiveMat(color, color, 1.6);
    return new THREE.Mesh(padG, padM);
  }

  {
    const pads = [
      { name:"STORE", color:0x00ffcc, x: 0,  z: lobbyR-8 },
      { name:"VIP",   color:0xff00aa, x: -14, z: 20 },
      { name:"POKER", color:0x00a6ff, x:  14, z: 20 }
    ];

    pads.forEach(p => {
      const pad = makePad(p.color);
      pad.position.set(p.x, 0.12, p.z);
      scene.add(pad);

      const beamG = new THREE.CylinderGeometry(0.06, 0.06, 7.0, 16);
      const beamM = emissiveMat(p.color, p.color, 2.0);
      const beam = new THREE.Mesh(beamG, beamM);
      beam.position.set(p.x, 3.6, p.z);
      scene.add(beam);

      ctx.teleportSurfaces.push(pad);
    });
  }

  // -------------------------
  // TELEPORT SURFACES (floor, pit floor, balcony)
  // -------------------------
  // (For raycast teleport)
  scene.traverse(obj => {
    if (!obj.isMesh) return;
    // Keep it simple: allow teleport to big “walkable” meshes
  });

  // Explicitly add
  // NOTE: floor ring is not stored as variable; create a hidden large plane for teleport
  {
    const telePlaneG = new THREE.CircleGeometry(lobbyR-2, 120);
    const telePlaneM = new THREE.MeshBasicMaterial({ color: 0x000000, transparent:true, opacity:0.0 });
    const telePlane = new THREE.Mesh(telePlaneG, telePlaneM);
    telePlane.rotation.x = -Math.PI/2;
    telePlane.position.y = 0.02;
    scene.add(telePlane);
    ctx.teleportSurfaces.push(telePlane);
  }

  if (pitFloorMesh) ctx.teleportSurfaces.push(pitFloorMesh);
  if (balconyMesh) ctx.teleportSurfaces.push(balconyMesh);

  // -------------------------
  // BOTS (placeholder, but moving)
  // -------------------------
  function makeBot(color=0x2222ff){
    const bot = new THREE.Group();

    const bodyG = new THREE.CapsuleGeometry(0.25, 0.6, 6, 14);
    const bodyM = new THREE.MeshStandardMaterial({
      color: 0x0c0c12, roughness: 0.6, metalness: 0.3,
      emissive: color, emissiveIntensity: 0.35
    });
    const body = new THREE.Mesh(bodyG, bodyM);
    body.position.y = 0.9;
    bot.add(body);

    const headG = new THREE.SphereGeometry(0.22, 18, 16);
    const headM = new THREE.MeshStandardMaterial({
      color: 0x07070c,
      emissive: color, emissiveIntensity: 0.55,
      roughness: 0.5, metalness: 0.2
    });
    const head = new THREE.Mesh(headG, headM);
    head.position.y = 1.55;
    bot.add(head);

    const eyeG = new THREE.SphereGeometry(0.03, 10, 10);
    const eyeM = emissiveMat(0x00ffff, 0x00c8ff, 2.2);
    const e1 = new THREE.Mesh(eyeG, eyeM);
    e1.position.set(-0.06, 1.55, 0.18);
    const e2 = e1.clone(); e2.position.x = 0.06;
    bot.add(e1, e2);

    bot.userData = { t: Math.random()*1000 };
    return bot;
  }

  // Walking ring bots
  const bots = [];
  for (let i=0;i<6;i++){
    const b = makeBot(i%2?0x8a2be2:0x00a6ff);
    const a = (i/6)*Math.PI*2;
    const r = pitR + 6.0;
    b.position.set(Math.cos(a)*r, 0, Math.sin(a)*r);
    scene.add(b);
    bots.push(b);
  }

  // Ninja guard at pit entrance (near stairs)
  const ninja = makeBot(0xff00aa);
  ninja.scale.set(1.1, 1.1, 1.1);
  ninja.position.set(pitR + 3.2, 0, 2.8);
  ninja.rotation.y = -Math.PI/2;
  scene.add(ninja);

  // Animate bots
  const tick = () => {
    for (const b of bots){
      b.userData.t += 0.016;
      const t = b.userData.t;
      const a = t*0.28;
      const r = pitR + 6.0 + Math.sin(t*0.6)*0.2;
      b.position.x = Math.cos(a)*r;
      b.position.z = Math.sin(a)*r;
      b.rotation.y = -a + Math.PI/2;
      b.position.y = 0;
    }
    // guard idle bob
    ninja.position.y = 0.02 + Math.sin(performance.now()*0.002)*0.02;

    requestAnimationFrame(tick);
  };
  tick();

  // -------------------------
  // SAFE SPAWN + LOOK AT PIT
  // -------------------------
  rig.position.set(0, 1.8, 22);
  rig.lookAt(0, 1.6, 0);

  log("✅ Carpet floor + pit depth trim + brick pit walls");
  log("✅ Balcony is sector above store ONLY");
  log("✅ Stairs added (down + up feel test)");
  log("✅ Rails + pillars + ceiling rings");
  log("✅ Bots walking + ninja guard");
  log("✅ Teleport surfaces armed");
                                }
