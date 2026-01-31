export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, log, updates } = ctx;

  // Dimensions
  const lobbyR = 46;
  const wallH  = 11;
  const pitR = 10.5;
  const pitDepth = 7.6;
  const pitFloorY = -pitDepth + 0.05;
  const innerFloorR = pitR + 0.30;

  // ---- Procedural textures (kept, but light) ----
  function makeCarpetTexture(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");

    g.fillStyle = "#2a1650";
    g.fillRect(0,0,512,512);

    for (let i=0;i<18000;i++){
      const x = (Math.random()*512)|0;
      const y = (Math.random()*512)|0;
      const v = 18 + (Math.random()*46)|0;
      g.fillStyle = `rgb(${v},${(v*0.5)|0},${(v*1.35)|0})`;
      g.fillRect(x,y,1,1);
    }

    g.globalAlpha = 0.16;
    g.strokeStyle = "#3c2372";
    g.lineWidth = 3;
    for (let i=-40;i<560;i+=22){
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i+240, 512);
      g.stroke();
    }
    g.globalAlpha = 1;

    g.globalAlpha = 0.20;
    g.strokeStyle = "#00c8ff";
    g.lineWidth = 2;
    for (let i=0;i<7;i++){
      g.beginPath();
      g.arc(256,256, 90+i*26, 0, Math.PI*2);
      g.stroke();
    }
    g.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    tex.anisotropy = 6;
    return tex;
  }

  function makePitWallTexture(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");

    g.fillStyle = "#0a0a12";
    g.fillRect(0,0,512,512);

    const bw = 92, bh = 50;
    for (let y=0;y<512;y+=bh){
      for (let x=0;x<512;x+=bw){
        const off = ((y/bh)|0)%2 ? bw/2 : 0;
        const rx = x + off;
        const col = 14 + ((Math.random()*16)|0);
        g.fillStyle = `rgb(${col},${col},${col+10})`;
        g.fillRect(rx, y, bw-6, bh-6);

        g.strokeStyle = "rgba(0,200,255,0.08)";
        g.lineWidth = 2;
        g.strokeRect(rx, y, bw-6, bh-6);
      }
    }

    g.globalAlpha = 0.30;
    g.strokeStyle = "#8a2be2";
    g.lineWidth = 2;
    for (let i=0;i<18;i++){
      g.beginPath();
      g.moveTo(0, (Math.random()*512)|0);
      g.lineTo(512, (Math.random()*512)|0);
      g.stroke();
    }
    g.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(7, 2);
    tex.anisotropy = 6;
    return tex;
  }

  const carpetTex = makeCarpetTexture();
  const pitTex = makePitWallTexture();

  // Materials
  const neonMat = (c, e, inten=2.0) =>
    new THREE.MeshStandardMaterial({ color:c, emissive:e, emissiveIntensity:inten, roughness:0.4, metalness:0.25 });

  const floorMat = new THREE.MeshStandardMaterial({
    map: carpetTex, color: 0xffffff, roughness: 0.95, metalness: 0.03, side: THREE.DoubleSide
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x18203a, roughness: 0.72, metalness: 0.22, side: THREE.DoubleSide
  });

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x0e1020, roughness: 0.55, metalness: 0.35
  });

  const pitWallMat = new THREE.MeshStandardMaterial({
    map: pitTex, color: 0xffffff, roughness: 0.92, metalness: 0.08, side: THREE.DoubleSide
  });

  const pitFloorMat = new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.98, metalness: 0.02 });

  // Lighting (reduced count, more stable)
  scene.add(new THREE.AmbientLight(0xffffff, 0.62));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a55, 1.35);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(12, 18, 10);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 1.5, 260);
  top.position.set(0, 17, 0);
  scene.add(top);

  // Ceiling neon rings (fewer segments)
  for (let k=0;k<2;k++){
    const r = lobbyR - 12 - k*8;
    const y = 10.4;
    const torG = new THREE.TorusGeometry(r, 0.09, 10, 120);
    const tor = new THREE.Mesh(torG, neonMat(0x00d5ff, 0x00b7ff, 2.2 - k*0.4));
    tor.rotation.x = Math.PI/2;
    tor.position.y = y;
    scene.add(tor);
  }

  // Lobby floor ring
  {
    const g = new THREE.RingGeometry(innerFloorR, lobbyR, 140, 1);
    const floor = new THREE.Mesh(g, floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    // inner trim to “seal” gap visually
    const trimG = new THREE.TorusGeometry(innerFloorR + 0.02, 0.09, 10, 120);
    const trim = new THREE.Mesh(trimG, neonMat(0x8a2be2, 0x6f00ff, 1.85));
    trim.rotation.x = Math.PI/2;
    trim.position.y = 0.05;
    scene.add(trim);

    // Invisible teleport plane
    const tpG = new THREE.CircleGeometry(lobbyR-2, 120);
    const tpM = new THREE.MeshBasicMaterial({ transparent:true, opacity:0 });
    const tp = new THREE.Mesh(tpG, tpM);
    tp.rotation.x = -Math.PI/2;
    tp.position.y = 0.02;
    scene.add(tp);
    teleportSurfaces.push(tp);
  }

  // Outer wall
  {
    const g = new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 140, 1, true);
    const wall = new THREE.Mesh(g, wallMat);
    wall.position.y = wallH/2;
    scene.add(wall);

    // Futuristic wall panels (performance-friendly)
    const panelCount = 18;
    for (let i=0;i<panelCount;i++){
      const a = (i/panelCount)*Math.PI*2;
      const r = lobbyR - 0.65;
      const x = Math.cos(a)*r;
      const z = Math.sin(a)*r;

      const pg = new THREE.BoxGeometry(6.2, 3.6, 0.22);
      const p = new THREE.Mesh(pg, panelMat);
      p.position.set(x, 5.3, z);
      p.rotation.y = a + Math.PI;
      scene.add(p);

      // small neon strip
      const sg = new THREE.BoxGeometry(5.6, 0.10, 0.06);
      const s = new THREE.Mesh(sg, neonMat(0x00ffff, 0x00c8ff, 1.3));
      s.position.set(0, -1.55, 0.14);
      p.add(s);
    }

    // single neon band
    const bandG = new THREE.TorusGeometry(lobbyR-0.35, 0.10, 10, 140);
    const band = new THREE.Mesh(bandG, neonMat(0x00d5ff, 0x00b7ff, 1.9));
    band.rotation.x = Math.PI/2;
    band.position.y = 2.35;
    scene.add(band);
  }

  // Pit wall + trims
  let pitFloor = null;
  {
    const g = new THREE.CylinderGeometry(pitR, pitR, pitDepth, 140, 1, true);
    const pitW = new THREE.Mesh(g, pitWallMat);
    pitW.position.y = -pitDepth/2 + 0.08;
    scene.add(pitW);

    const lipG = new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 120);
    const lip = new THREE.Mesh(lipG, neonMat(0x00ffff, 0x00c8ff, 2.6));
    lip.rotation.x = Math.PI/2;
    lip.position.y = 1.05;
    scene.add(lip);

    const midG = new THREE.TorusGeometry(pitR-0.12, 0.06, 10, 120);
    for (let i=1;i<=2;i++){
      const mid = new THREE.Mesh(midG, neonMat(0x2222ff, 0x00a6ff, 1.7));
      mid.rotation.x = Math.PI/2;
      mid.position.y = pitFloorY + (pitDepth * 0.33 * i);
      scene.add(mid);
    }

    const botG = new THREE.TorusGeometry(pitR - 0.25, 0.12, 10, 120);
    const bot = new THREE.Mesh(botG, neonMat(0xff00aa, 0xff00aa, 2.2));
    bot.rotation.x = Math.PI/2;
    bot.position.y = pitFloorY + 0.18;
    scene.add(bot);

    // Pit floor
    pitFloor = new THREE.Mesh(new THREE.CircleGeometry(pitR-0.28, 140), pitFloorMat);
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = pitFloorY;
    scene.add(pitFloor);
    teleportSurfaces.push(pitFloor);

    // A couple lights only (stable)
    const p1 = new THREE.PointLight(0xff00aa, 0.75, 55);
    p1.position.set(0, pitFloorY + 1.4, 0);
    scene.add(p1);

    const p2 = new THREE.PointLight(0x00c8ff, 0.55, 55);
    p2.position.set(3.0, pitFloorY + 2.0, -2.2);
    scene.add(p2);

    // Vent band detail near pit bottom
    const ventG = new THREE.TorusGeometry(pitR - 0.55, 0.05, 10, 120);
    const vent = new THREE.Mesh(ventG, neonMat(0x00d5ff, 0x00b7ff, 1.3));
    vent.rotation.x = Math.PI/2;
    vent.position.y = pitFloorY + 0.65;
    scene.add(vent);
  }

  // Pit rail
  {
    const railG = new THREE.TorusGeometry(pitR + 1.35, 0.09, 10, 120);
    const rail = new THREE.Mesh(railG, neonMat(0x00d5ff, 0x00b7ff, 1.85));
    rail.rotation.x = Math.PI/2;
    rail.position.y = 1.15;
    scene.add(rail);
  }

  // Pillars (reduced count for performance)
  {
    const count = 10;
    const coreG = new THREE.CylinderGeometry(0.55, 0.7, 9.2, 14);
    const bandG = new THREE.CylinderGeometry(0.68, 0.68, 0.28, 14);
    const coreM = new THREE.MeshStandardMaterial({ color: 0x0e0e16, roughness: 0.6, metalness: 0.4 });

    for (let i=0;i<count;i++){
      const a = (i/count)*Math.PI*2;
      const r = lobbyR - 1.1;
      const x = Math.cos(a)*r;
      const z = Math.sin(a)*r;

      const p = new THREE.Mesh(coreG, coreM);
      p.position.set(x, 4.6, z);
      scene.add(p);

      const b1 = new THREE.Mesh(bandG, neonMat(0x8a2be2, 0x6f00ff, 2.0));
      b1.position.set(x, 2.2, z);
      scene.add(b1);

      const b2 = b1.clone();
      b2.position.y = 6.9;
      scene.add(b2);
    }
  }

  // ✅ STABLE STAIRS: short arc ramp with steps (aligned, quick)
  // This hugs the pit edge and drops cleanly with fewer segments.
  function addArcStairs(){
    const steps = 9;                 // quick down/up
    const stepW = 2.6;
    const stepD = 0.85;
    const startY = 0.85;
    const endY = pitFloorY + 1.05;
    const stepH = (startY - endY) / steps;

    const angleCenter = 0;           // +X
    const angleSpan = Math.PI / 7;   // ~25 degrees arc
    const a0 = angleCenter - angleSpan/2;
    const a1 = angleCenter + angleSpan/2;

    const rStart = innerFloorR + 0.85;
    const rEnd = pitR - 0.05;

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x111122, roughness: 0.82, metalness: 0.22,
      emissive: 0x12003a, emissiveIntensity: 0.22
    });

    for (let i=0;i<steps;i++){
      const t = (i + 0.5) / steps;
      const a = a0 + (a1 - a0) * t;
      const r = rStart + (rEnd - rStart) * t;

      const x = Math.cos(a)*r;
      const z = Math.sin(a)*r;
      const y = startY - (i+1)*stepH;

      const g = new THREE.BoxGeometry(stepW, Math.max(0.12, stepH*0.92), stepD);
      const s = new THREE.Mesh(g, stepMat);
      s.position.set(x, y, z);
      s.rotation.y = a + Math.PI/2;
      scene.add(s);
      teleportSurfaces.push(s);
    }

    // Landing
    const landA = angleCenter;
    const landR = rEnd - 0.8;
    const landX = Math.cos(landA)*landR;
    const landZ = Math.sin(landA)*landR;

    const land = new THREE.Mesh(new THREE.BoxGeometry(stepW+0.8, 0.18, 2.4), stepMat);
    land.position.set(landX, endY - 0.15, landZ);
    land.rotation.y = landA + Math.PI/2;
    scene.add(land);
    teleportSurfaces.push(land);

    // Guide lights (very few)
    for (let i=0;i<3;i++){
      const tt = (i+1)/4;
      const aa = a0 + (a1-a0)*tt;
      const rr = rStart + (rEnd-rStart)*tt;
      const lx = Math.cos(aa)*rr;
      const lz = Math.sin(aa)*rr;
      const ly = startY - (startY-endY)*tt;

      const p = new THREE.PointLight(0x00c8ff, 0.35, 22);
      p.position.set(lx + 0.5, ly + 0.7, lz);
      scene.add(p);
    }
  }
  addArcStairs();

  // “Store zone” marker (no rooms yet, just vibe + future location)
  {
    const storeZ = lobbyR - 8.5;
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.22, 40),
      neonMat(0x00ffcc, 0x00ffcc, 1.4)
    );
    pad.position.set(0, 0.12, storeZ);
    scene.add(pad);
    teleportSurfaces.push(pad);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 1.2, 0.25),
      neonMat(0x00ffcc, 0x00ffcc, 1.0)
    );
    sign.position.set(0, 6.4, lobbyR - 0.9);
    sign.rotation.y = Math.PI;
    scene.add(sign);
  }

  // No extra rAF loops. If you want motion (bots later), add it via updates[] only.
  // Example placeholder subtle pulse (very cheap):
  const pulseTargets = [];
  scene.traverse(o => { if (o.isMesh && o.material?.emissive) pulseTargets.push(o); });
  let pulseT = 0;
  updates.push((dt) => {
    pulseT += dt;
    const k = 0.85 + Math.sin(pulseT*1.2)*0.08;
    // Only pulse a few meshes (avoid huge loops)
    for (let i=0;i<pulseTargets.length;i+=20){
      const m = pulseTargets[i].material;
      if (m && m.emissiveIntensity != null) m.emissiveIntensity = Math.max(0.2, m.emissiveIntensity * 0.92 + k * 0.08);
    }
  });

  // Spawn safe
  rig.position.set(0, 1.8, 24);
  rig.lookAt(0, 1.6, 0);

  log("✅ Beautified + stabilized (performance + smooth input + aligned arc stairs)");
                                          }
