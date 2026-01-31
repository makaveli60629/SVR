/**
 * SCARLETT1 — BEAUTIFIED (SAFE)
 * - Futuristic carpet floor (procedural texture)
 * - Tech/brick pit walls (procedural texture)
 * - Pillars with neon bands
 * - Ceiling ring lights (high, non-blocking)
 * - Pit depth neon trims (top/mid/bottom)
 * - Pit rail
 * - QUICK stairs w/ landing (aligned to pit edge)
 * - NO tables yet
 */
export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, log } = ctx;

  // -------------------------
  // DIMENSIONS
  // -------------------------
  const lobbyR = 46;
  const wallH  = 11;
  const wallT  = 1.2;

  const pitR = 10.5;
  const pitDepth = 7.6;
  const pitFloorY = -pitDepth + 0.05;

  // For tight floor-to-pit gap
  const innerFloorR = pitR + 0.30;

  // Stair placement (at +X side, descending toward center)
  const stairAngle = 0; // +X direction
  const stairOuterR = innerFloorR + 0.85;   // start just outside pit opening
  const stairInnerR = pitR - 0.15;          // end just inside pit radius

  // -------------------------
  // PROCEDURAL TEXTURES (safe + lightweight)
  // -------------------------
  function makeCarpetTexture(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");

    // base
    g.fillStyle = "#24143a";
    g.fillRect(0,0,512,512);

    // fibers noise
    for (let i=0;i<22000;i++){
      const x = (Math.random()*512)|0;
      const y = (Math.random()*512)|0;
      const v = 18 + (Math.random()*50)|0;
      g.fillStyle = `rgb(${v},${(v*0.55)|0},${(v*1.4)|0})`;
      g.fillRect(x,y,1,1);
    }

    // diagonal weave
    g.globalAlpha = 0.18;
    g.strokeStyle = "#3b215e";
    g.lineWidth = 3;
    for (let i=-40;i<560;i+=18){
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i+220, 512);
      g.stroke();
    }
    g.globalAlpha = 1;

    // neon thread rings (subtle)
    g.globalAlpha = 0.22;
    g.strokeStyle = "#00c8ff";
    g.lineWidth = 2;
    for (let i=0;i<9;i++){
      g.beginPath();
      g.arc(256,256, 70+i*22, 0, Math.PI*2);
      g.stroke();
    }
    g.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(9, 9);
    tex.anisotropy = 8;
    return tex;
  }

  function makePitWallTexture(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");

    // base
    g.fillStyle = "#0b0b12";
    g.fillRect(0,0,512,512);

    // brick plates
    const bw = 84, bh = 44;
    for (let y=0;y<512;y+=bh){
      for (let x=0;x<512;x+=bw){
        const off = ((y/bh)|0)%2 ? bw/2 : 0;
        const rx = x + off;
        const col = 14 + ((Math.random()*18)|0);
        g.fillStyle = `rgb(${col},${col},${col+10})`;
        g.fillRect(rx, y, bw-6, bh-6);

        // seams
        g.strokeStyle = "rgba(0,200,255,0.08)";
        g.lineWidth = 2;
        g.strokeRect(rx, y, bw-6, bh-6);
      }
    }

    // tech traces
    g.globalAlpha = 0.35;
    g.strokeStyle = "#8a2be2";
    g.lineWidth = 2;
    for (let i=0;i<28;i++){
      g.beginPath();
      g.moveTo(0, (Math.random()*512)|0);
      g.lineTo(512, (Math.random()*512)|0);
      g.stroke();
    }
    g.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(7, 2);
    tex.anisotropy = 8;
    return tex;
  }

  const carpetTex = makeCarpetTexture();
  const pitTex = makePitWallTexture();

  // -------------------------
  // MATERIAL HELPERS
  // -------------------------
  const neonMat = (c, e, inten=2.1) =>
    new THREE.MeshStandardMaterial({ color:c, emissive:e, emissiveIntensity:inten, roughness:0.4, metalness:0.25 });

  const floorMat = new THREE.MeshStandardMaterial({
    map: carpetTex,
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.03,
    side: THREE.DoubleSide
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x18203a,
    roughness: 0.72,
    metalness: 0.22,
    side: THREE.DoubleSide
  });

  const pitWallMat = new THREE.MeshStandardMaterial({
    map: pitTex,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.08,
    side: THREE.DoubleSide
  });

  const pitFloorMat = new THREE.MeshStandardMaterial({
    color: 0x0b0b12,
    roughness: 0.98,
    metalness: 0.02
  });

  // -------------------------
  // LIGHTING (futuristic, bright, readable)
  // -------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.62));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a55, 1.45);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.05);
  dir.position.set(12, 18, 10);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 1.75, 320);
  top.position.set(0, 17, 0);
  scene.add(top);

  // Ceiling ring lights + point lights around rings (high, non-blocking)
  {
    const ringCount = 3;
    for (let k=0;k<ringCount;k++){
      const r = lobbyR - 10 - k*6;
      const y = 10.4;
      const torG = new THREE.TorusGeometry(r, 0.09, 10, 220);
      const torM = neonMat(0x00d5ff, 0x00b7ff, 2.4 - k*0.45);
      const tor = new THREE.Mesh(torG, torM);
      tor.rotation.x = Math.PI/2;
      tor.position.y = y;
      scene.add(tor);

      for (let i=0;i<10;i++){
        const a = (i/10)*Math.PI*2;
        const p = new THREE.PointLight(0x66ccff, 0.75, 65);
        p.position.set(Math.cos(a)*r, y-0.2, Math.sin(a)*r);
        scene.add(p);
      }
    }
  }

  // -------------------------
  // FLOOR RING (carpet) + inner neon trim to hide any tiny gap
  // -------------------------
  let telePlane = null;
  {
    const g = new THREE.RingGeometry(innerFloorR, lobbyR, 200, 1);
    const floor = new THREE.Mesh(g, floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    // inner trim (gap cover)
    const trimG = new THREE.TorusGeometry(innerFloorR + 0.02, 0.09, 10, 180);
    const trim = new THREE.Mesh(trimG, neonMat(0x8a2be2, 0x6f00ff, 1.9));
    trim.rotation.x = Math.PI/2;
    trim.position.y = 0.05;
    scene.add(trim);

    // teleport helper plane (invisible)
    const tpG = new THREE.CircleGeometry(lobbyR-2, 140);
    const tpM = new THREE.MeshBasicMaterial({ transparent:true, opacity:0 });
    telePlane = new THREE.Mesh(tpG, tpM);
    telePlane.rotation.x = -Math.PI/2;
    telePlane.position.y = 0.02;
    scene.add(telePlane);
    teleportSurfaces.push(telePlane);
  }

  // -------------------------
  // OUTER WALL
  // -------------------------
  {
    const g = new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 200, 1, true);
    const wall = new THREE.Mesh(g, wallMat);
    wall.position.y = wallH/2;
    scene.add(wall);

    // single neon band (nice but not “balcony ring”)
    const bandG = new THREE.TorusGeometry(lobbyR-0.35, 0.10, 10, 240);
    const band = new THREE.Mesh(bandG, neonMat(0x00d5ff, 0x00b7ff, 2.0));
    band.rotation.x = Math.PI/2;
    band.position.y = 2.35;
    scene.add(band);
  }

  // -------------------------
  // PIT WALL + DEPTH TRIMS
  // -------------------------
  let pitFloor = null;
  {
    const pitWallG = new THREE.CylinderGeometry(pitR, pitR, pitDepth, 200, 1, true);
    const pitW = new THREE.Mesh(pitWallG, pitWallMat);
    pitW.position.y = -pitDepth/2 + 0.08;
    scene.add(pitW);

    // top lip
    const lipG = new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 160);
    const lip = new THREE.Mesh(lipG, neonMat(0x00ffff, 0x00c8ff, 2.7));
    lip.rotation.x = Math.PI/2;
    lip.position.y = 1.05;
    scene.add(lip);

    // mid rings
    const midG = new THREE.TorusGeometry(pitR-0.12, 0.06, 10, 160);
    for (let i=1;i<=2;i++){
      const mid = new THREE.Mesh(midG, neonMat(0x2222ff, 0x00a6ff, 1.85));
      mid.rotation.x = Math.PI/2;
      mid.position.y = pitFloorY + (pitDepth * 0.33 * i);
      scene.add(mid);
    }

    // bottom trim (requested)
    const botG = new THREE.TorusGeometry(pitR - 0.25, 0.12, 10, 160);
    const bot = new THREE.Mesh(botG, neonMat(0xff00aa, 0xff00aa, 2.35));
    bot.rotation.x = Math.PI/2;
    bot.position.y = pitFloorY + 0.18;
    scene.add(bot);

    // pit floor
    const pitFloorG = new THREE.CircleGeometry(pitR-0.28, 200);
    pitFloor = new THREE.Mesh(pitFloorG, pitFloorMat);
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = pitFloorY;
    scene.add(pitFloor);
    teleportSurfaces.push(pitFloor);

    // pit lights (so depth reads clearly)
    const pitLight1 = new THREE.PointLight(0xff00aa, 0.9, 55);
    pitLight1.position.set(0, pitFloorY + 1.4, 0);
    scene.add(pitLight1);

    const pitLight2 = new THREE.PointLight(0x00c8ff, 0.7, 55);
    pitLight2.position.set(3.0, pitFloorY + 2.0, -2.2);
    scene.add(pitLight2);
  }

  // -------------------------
  // PIT RAIL (walk feel)
  // -------------------------
  {
    const railG = new THREE.TorusGeometry(pitR + 1.35, 0.09, 10, 170);
    const rail = new THREE.Mesh(railG, neonMat(0x00d5ff, 0x00b7ff, 1.95));
    rail.rotation.x = Math.PI/2;
    rail.position.y = 1.15;
    scene.add(rail);
  }

  // -------------------------
  // PILLARS (futuristic)
  // -------------------------
  {
    const count = 12;
    for (let i=0;i<count;i++){
      const a = (i/count)*Math.PI*2;
      const r = lobbyR - 1.1;

      const x = Math.cos(a)*r;
      const z = Math.sin(a)*r;

      // pillar core
      const pg = new THREE.CylinderGeometry(0.55, 0.7, 9.2, 18);
      const pm = new THREE.MeshStandardMaterial({ color: 0x0e0e16, roughness: 0.6, metalness: 0.4 });
      const p = new THREE.Mesh(pg, pm);
      p.position.set(x, 4.6, z);
      scene.add(p);

      // neon bands
      const bandG = new THREE.CylinderGeometry(0.68, 0.68, 0.28, 18);
      const b1 = new THREE.Mesh(bandG, neonMat(0x8a2be2, 0x6f00ff, 2.1));
      b1.position.set(x, 2.2, z);
      scene.add(b1);

      const b2 = b1.clone();
      b2.position.y = 6.9;
      scene.add(b2);

      // small light at each pillar
      const pl = new THREE.PointLight(0x6f00ff, 0.35, 30);
      pl.position.set(x, 4.8, z);
      scene.add(pl);
    }
  }

  // -------------------------
  // QUICK STAIRS (aligned) — fewer steps, with landing
  // Goal: “down quick / up quick”
  // -------------------------
  function addQuickStairs(){
    // We build a straight run from near pit edge down to near pit floor,
    // plus a small landing at the bottom to feel natural.
    const steps = 10;            // fewer steps
    const stepW = 2.4;
    const stepD = 0.70;          // deeper steps = quicker feel
    const startY = 0.85;
    const endY   = pitFloorY + 1.05;
    const stepH  = (startY - endY) / steps;

    // compute start/end positions on angle
    const startX = Math.cos(stairAngle) * stairOuterR;
    const startZ = Math.sin(stairAngle) * stairOuterR;

    // direction towards center
    const dx = -Math.cos(stairAngle);
    const dz = -Math.sin(stairAngle);

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.82,
      metalness: 0.22,
      emissive: 0x12003a,
      emissiveIntensity: 0.22
    });

    for (let i=0;i<steps;i++){
      const y = startY - (i+1)*stepH;

      // move inward each step
      const px = startX + dx * (i * stepD);
      const pz = startZ + dz * (i * stepD);

      const g = new THREE.BoxGeometry(stepW, Math.max(0.12, stepH*0.92), stepD);
      const s = new THREE.Mesh(g, stepMat);
      s.position.set(px, y, pz);
      s.rotation.y = stairAngle; // align with direction
      scene.add(s);
      teleportSurfaces.push(s);
    }

    // landing platform at bottom
    const landG = new THREE.BoxGeometry(stepW + 0.6, 0.18, 2.2);
    const land = new THREE.Mesh(landG, stepMat);
    const landX = startX + dx * (steps * stepD + 0.6);
    const landZ = startZ + dz * (steps * stepD + 0.6);
    land.position.set(landX, endY - 0.15, landZ);
    land.rotation.y = stairAngle;
    scene.add(land);
    teleportSurfaces.push(land);

    // landing rail glow
    const railG = new THREE.BoxGeometry(stepW + 0.9, 0.10, 0.12);
    const rail = new THREE.Mesh(railG, neonMat(0x00ffff, 0x00c8ff, 1.6));
    rail.position.set(landX, endY + 0.9, landZ + 0.85);
    rail.rotation.y = stairAngle;
    scene.add(rail);

    // guide lights down the stairs
    for (let i=0;i<5;i++){
      const lx = startX + dx * (i * stepD * 2.0 + 0.4);
      const lz = startZ + dz * (i * stepD * 2.0 + 0.4);
      const ly = startY - i * (startY-endY)/5;

      const p = new THREE.PointLight(0x00c8ff, 0.35, 20);
      p.position.set(lx + 0.6, ly + 0.6, lz);
      scene.add(p);
    }
  }
  addQuickStairs();

  // -------------------------
  // TELEPORT SURFACES: pit floor already added, stairs/landing added, telePlane added
  // -------------------------

  // -------------------------
  // SAFE SPAWN
  // -------------------------
  rig.position.set(0, 1.8, 24);
  rig.lookAt(0, 1.6, 0);

  log("✅ Beautified world loaded (carpet, pillars, lights, aligned quick stairs)");
                                          }
