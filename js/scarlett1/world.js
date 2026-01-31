/**
 * SCARLETT1 — LOBBY READY (NO TABLES YET)
 * Features:
 * - Visible carpet ring floor + pit opening
 * - Tech-textured outer wall
 * - 4 Jumbotrons flush aligned
 * - Solid pit rails with an opening + entrance platform connected to stairs
 * - Embedded stairs (walk down and back up)
 * - Ninja guard at entrance + combat ninja patrol (one walking)
 * - Storefront facade + sign + 3 avatar displays left + 3 right
 * - Teleport pads: LOBBY / PIT / STORE
 */
export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, updates, log } = ctx;

  // -------------------------
  // DIMENSIONS
  // -------------------------
  const lobbyR = 46;
  const wallH  = 11;
  const wallT  = 1.2;

  const pitR = 10.5;
  const pitDepth = 7.6;
  const pitFloorY = -pitDepth + 0.05;

  const innerFloorR = pitR + 0.30;

  // Stairs/entrance direction: +X (easy to find)
  const entryAngle = 0; // radians
  const entryDir = new THREE.Vector3(Math.cos(entryAngle), 0, Math.sin(entryAngle));

  // Store direction: +Z (front)
  const storeAngle = Math.PI/2;

  // -------------------------
  // TEXTURES (procedural, stable)
  // -------------------------
  function makeCarpetTex(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");

    g.fillStyle = "#2a1650";
    g.fillRect(0,0,512,512);

    for (let i=0;i<16000;i++){
      const x = (Math.random()*512)|0;
      const y = (Math.random()*512)|0;
      const v = 18 + (Math.random()*44)|0;
      g.fillStyle = `rgb(${v},${(v*0.5)|0},${(v*1.35)|0})`;
      g.fillRect(x,y,1,1);
    }

    g.globalAlpha = 0.14;
    g.strokeStyle = "#3c2372";
    g.lineWidth = 3;
    for (let i=-60;i<580;i+=26){
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i+260, 512);
      g.stroke();
    }
    g.globalAlpha = 1;

    g.globalAlpha = 0.18;
    g.strokeStyle = "#00c8ff";
    g.lineWidth = 2;
    for (let i=0;i<7;i++){
      g.beginPath();
      g.arc(256,256, 88+i*28, 0, Math.PI*2);
      g.stroke();
    }
    g.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8,8);
    tex.anisotropy = 6;
    return tex;
  }

  function makeWallTechTex(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");

    g.fillStyle = "#0b0f1f";
    g.fillRect(0,0,512,512);

    // panels
    for (let y=0;y<512;y+=64){
      for (let x=0;x<512;x+=96){
        const col = 18 + ((Math.random()*12)|0);
        g.fillStyle = `rgb(${col},${col+2},${col+10})`;
        g.fillRect(x+4, y+4, 88, 56);

        g.strokeStyle = "rgba(0,200,255,0.12)";
        g.lineWidth = 2;
        g.strokeRect(x+4, y+4, 88, 56);
      }
    }

    // tech traces
    g.globalAlpha = 0.35;
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
    tex.repeat.set(6,2);
    tex.anisotropy = 6;
    return tex;
  }

  function makePitTex(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");

    g.fillStyle = "#0a0a12";
    g.fillRect(0,0,512,512);

    const bw=92, bh=50;
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

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(7,2);
    tex.anisotropy = 6;
    return tex;
  }

  const carpetTex = makeCarpetTex();
  const wallTex   = makeWallTechTex();
  const pitTex    = makePitTex();

  // -------------------------
  // MATERIALS
  // -------------------------
  const neonMat = (c, e, inten=2.0) =>
    new THREE.MeshStandardMaterial({ color:c, emissive:e, emissiveIntensity:inten, roughness:0.4, metalness:0.25 });

  const floorMat = new THREE.MeshStandardMaterial({
    map: carpetTex, color: 0xffffff, roughness: 0.95, metalness: 0.03, side: THREE.DoubleSide
  });

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex, color: 0xffffff, roughness: 0.70, metalness: 0.22, side: THREE.DoubleSide
  });

  const pitWallMat = new THREE.MeshStandardMaterial({
    map: pitTex, color: 0xffffff, roughness: 0.92, metalness: 0.08, side: THREE.DoubleSide
  });

  const pitFloorMat = new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.98, metalness: 0.02 });

  const metalDark = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.65, metalness: 0.35 });
  const metalRail = new THREE.MeshStandardMaterial({ color: 0x151526, roughness: 0.55, metalness: 0.55 });

  // -------------------------
  // LIGHTING (more, but stable)
  // -------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a55, 1.35);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.05);
  dir.position.set(12, 18, 10);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 1.6, 280);
  top.position.set(0, 16.5, 0);
  scene.add(top);

  // Ceiling rings (visual reference)
  for (let k=0;k<2;k++){
    const r = lobbyR - 12 - k*8;
    const y = 10.4;
    const tor = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.09, 10, 120),
      neonMat(0x00d5ff, 0x00b7ff, 2.1 - k*0.35)
    );
    tor.rotation.x = Math.PI/2;
    tor.position.y = y;
    scene.add(tor);
  }

  // -------------------------
  // FLOOR (visible ring + pit opening)
  // -------------------------
  {
    const floor = new THREE.Mesh(
      new THREE.RingGeometry(innerFloorR, lobbyR, 140, 1),
      floorMat
    );
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    // Inner trim to seal any tiny gap
    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(innerFloorR + 0.02, 0.09, 10, 120),
      neonMat(0x8a2be2, 0x6f00ff, 1.85)
    );
    trim.rotation.x = Math.PI/2;
    trim.position.y = 0.05;
    scene.add(trim);

    // Invisible teleport plane across lobby
    const tp = new THREE.Mesh(
      new THREE.CircleGeometry(lobbyR-2, 120),
      new THREE.MeshBasicMaterial({ transparent:true, opacity:0 })
    );
    tp.rotation.x = -Math.PI/2;
    tp.position.y = 0.02;
    scene.add(tp);
    teleportSurfaces.push(tp);
  }

  // -------------------------
  // OUTER WALL (textured)
  // -------------------------
  {
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 140, 1, true),
      wallMat
    );
    wall.position.y = wallH/2;
    scene.add(wall);

    // Single neon band (NOT a balcony ring)
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(lobbyR-0.35, 0.10, 10, 140),
      neonMat(0x00d5ff, 0x00b7ff, 1.9)
    );
    band.rotation.x = Math.PI/2;
    band.position.y = 2.35;
    scene.add(band);
  }

  // -------------------------
  // PIT WALL + FLOOR + DEPTH TRIMS
  // -------------------------
  let pitFloor = null;
  {
    const pitW = new THREE.Mesh(
      new THREE.CylinderGeometry(pitR, pitR, pitDepth, 140, 1, true),
      pitWallMat
    );
    pitW.position.y = -pitDepth/2 + 0.08;
    scene.add(pitW);

    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 120),
      neonMat(0x00ffff, 0x00c8ff, 2.6)
    );
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

    const bot = new THREE.Mesh(
      new THREE.TorusGeometry(pitR - 0.25, 0.12, 10, 120),
      neonMat(0xff00aa, 0xff00aa, 2.2)
    );
    bot.rotation.x = Math.PI/2;
    bot.position.y = pitFloorY + 0.18;
    scene.add(bot);

    pitFloor = new THREE.Mesh(new THREE.CircleGeometry(pitR-0.28, 140), pitFloorMat);
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = pitFloorY;
    scene.add(pitFloor);
    teleportSurfaces.push(pitFloor);

    // Pit lights so you can read depth
    const p1 = new THREE.PointLight(0xff00aa, 0.8, 60);
    p1.position.set(0, pitFloorY + 1.4, 0);
    scene.add(p1);

    const p2 = new THREE.PointLight(0x00c8ff, 0.6, 60);
    p2.position.set(3.0, pitFloorY + 2.2, -2.2);
    scene.add(p2);
  }

  // -------------------------
  // SOLID PIT RAIL with OPENING aligned to stairs
  // -------------------------
  function addPitRailWithOpening(){
    const railR = pitR + 1.55;
    const railY = 1.15;

    const span = Math.PI * 2;
    const opening = Math.PI / 8;                 // ~22.5 degrees opening
    const start = entryAngle - opening/2;
    const end   = entryAngle + opening/2;

    // Solid posts around except opening
    const postCount = 28;
    const postG = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 10);
    for (let i=0;i<postCount;i++){
      const a = (i/postCount)*span;
      // skip posts near opening
      const da = angleDist(a, entryAngle);
      if (da < opening*0.55) continue;

      const x = Math.cos(a)*railR;
      const z = Math.sin(a)*railR;

      const post = new THREE.Mesh(postG, metalRail);
      post.position.set(x, railY-0.45, z);
      scene.add(post);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), neonMat(0x00ffff, 0x00c8ff, 1.2));
      cap.position.set(x, railY+0.15, z);
      scene.add(cap);
    }

    // Top rail segments as two arcs (left + right of opening)
    const arc1 = makeArcRail(railR, railY+0.05, start+opening/2, Math.PI*2 - opening);
    scene.add(arc1);

    // Neon guide at opening edges
    const edge1 = new THREE.PointLight(0x00c8ff, 0.9, 25);
    edge1.position.set(Math.cos(start)*railR, railY+0.2, Math.sin(start)*railR);
    scene.add(edge1);

    const edge2 = new THREE.PointLight(0x00c8ff, 0.9, 25);
    edge2.position.set(Math.cos(end)*railR, railY+0.2, Math.sin(end)*railR);
    scene.add(edge2);

    function makeArcRail(r, y, aStart, aLen){
      // approximate arc with short cylinders (stable + solid)
      const group = new THREE.Group();
      const segs = 36;
      const tubeLen = (aLen / segs) * r;

      for (let i=0;i<segs;i++){
        const t = (i+0.5)/segs;
        const a = aStart + aLen*t;
        // skip if inside opening
        const da = angleDist(a, entryAngle);
        if (da < opening*0.52) continue;

        const x = Math.cos(a)*r;
        const z = Math.sin(a)*r;

        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, tubeLen, 10),
          neonMat(0x00d5ff, 0x00b7ff, 1.6)
        );
        cyl.position.set(x, y, z);
        cyl.rotation.z = Math.PI/2;
        cyl.rotation.y = a;
        group.add(cyl);
      }
      return group;
    }

    function angleDist(a,b){
      let d = (a-b)%(Math.PI*2);
      if (d > Math.PI) d -= Math.PI*2;
      if (d < -Math.PI) d += Math.PI*2;
      return Math.abs(d);
    }
  }
  addPitRailWithOpening();

  // -------------------------
  // EMBEDDED STAIRS (walk down + back up) + entrance platform
  // -------------------------
  function addStairsAndEntrance(){
    // “Quick” stairs: fewer steps, deeper tread
    const steps = 10;
    const stepW = 2.8;
    const stepD = 0.78;
    const startY = 0.85;
    const endY = pitFloorY + 1.05;
    const stepH = (startY - endY) / steps;

    // Start just outside opening, push inward
    const startR = innerFloorR + 0.90;
    const endR   = pitR - 0.20;

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x111122, roughness: 0.82, metalness: 0.22,
      emissive: 0x12003a, emissiveIntensity: 0.22
    });

    // Entrance platform at top (connected to lobby floor)
    const platR = innerFloorR + 1.25;
    const platX = entryDir.x * platR;
    const platZ = entryDir.z * platR;

    const platform = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 3.2), metalDark);
    platform.position.set(platX, 0.22/2, platZ);
    platform.rotation.y = entryAngle;
    scene.add(platform);
    teleportSurfaces.push(platform);

    // Add a small “gate frame” so it reads like an entrance
    const frameM = neonMat(0x8a2be2, 0x6f00ff, 1.3);
    const pillarG = new THREE.BoxGeometry(0.22, 2.6, 0.22);
    const leftP  = new THREE.Mesh(pillarG, frameM);
    const rightP = new THREE.Mesh(pillarG, frameM);
    leftP.position.set(platX + 1.6, 1.3, platZ);
    rightP.position.set(platX - 1.6, 1.3, platZ);
    scene.add(leftP, rightP);

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 0.22), frameM);
    topBar.position.set(platX, 2.5, platZ);
    scene.add(topBar);

    // Steps
    for (let i=0;i<steps;i++){
      const t = (i+0.5)/steps;
      const r = startR + (endR - startR)*t;

      const x = entryDir.x * r;
      const z = entryDir.z * r;
      const y = startY - (i+1)*stepH;

      const s = new THREE.Mesh(
        new THREE.BoxGeometry(stepW, Math.max(0.12, stepH*0.92), stepD),
        stepMat
      );
      s.position.set(x, y, z);
      s.rotation.y = entryAngle;
      scene.add(s);
      teleportSurfaces.push(s);

      // guide lights (3 only)
      if (i === 2 || i === 5 || i === 8){
        const p = new THREE.PointLight(0x00c8ff, 0.35, 22);
        p.position.set(x + 0.7, y + 0.7, z);
        scene.add(p);
      }
    }

    // Bottom landing
    const landR = endR - 0.9;
    const landX = entryDir.x * landR;
    const landZ = entryDir.z * landR;

    const landing = new THREE.Mesh(new THREE.BoxGeometry(stepW+1.0, 0.18, 2.6), stepMat);
    landing.position.set(landX, endY - 0.15, landZ);
    landing.rotation.y = entryAngle;
    scene.add(landing);
    teleportSurfaces.push(landing);

    // Small landing rail (solid)
    const lr = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06, stepW+0.8, 10), neonMat(0x00ffff, 0x00c8ff, 1.3));
    lr.position.set(landX, endY + 0.9, landZ + 0.95);
    lr.rotation.z = Math.PI/2;
    lr.rotation.y = entryAngle;
    scene.add(lr);

    return { platform };
  }
  const { platform: entryPlatform } = addStairsAndEntrance();

  // -------------------------
  // JUMBOTRONS (4) — flush to wall
  // -------------------------
  function placeOnWall(obj, angle, wallRadius, y, depth=0.7, inset=0.05){
    const nx = Math.cos(angle), nz = Math.sin(angle);
    const r = wallRadius - inset - (depth*0.5);
    obj.position.set(nx*r, y, nz*r);
    obj.rotation.y = angle + Math.PI;
  }

  function makeJumbotron(){
    const w=10.5, h=6.0, d=0.7;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w,h,d),
      new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 0.35, metalness: 0.35 })
    );

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(w*0.88, h*0.82),
      new THREE.MeshStandardMaterial({ color: 0x111133, emissive: 0x2222ff, emissiveIntensity: 0.9 })
    );
    screen.position.z = d/2 + 0.001;
    body.add(screen);

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(w*0.92, h*0.86, 0.05),
      neonMat(0x00c8ff, 0x00a6ff, 1.7)
    );
    trim.position.z = d/2 + 0.02;
    body.add(trim);

    body.userData.depth = d;
    return body;
  }

  {
    const angles = [Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
    angles.forEach(a=>{
      const j = makeJumbotron();
      placeOnWall(j, a, lobbyR - (wallT*0.5), 7.3, j.userData.depth, 0.05);
      scene.add(j);

      // Door marker under each jumbotron (still just visual)
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 6.6, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x0d0d14, emissive: 0x3a00ff, emissiveIntensity: 0.35 })
      );
      placeOnWall(door, a, lobbyR - (wallT*0.5), 3.1, 0.24, 0.03);
      scene.add(door);
    });
  }

  // -------------------------
  // PILLARS (futuristic) + uplights
  // -------------------------
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

      const upl = new THREE.PointLight(0x6f00ff, 0.35, 30);
      upl.position.set(x, 1.0, z);
      scene.add(upl);
    }
  }

  // -------------------------
  // STOREFRONT (outside only) at +Z
  // - looks like a real store front
  // - 3 avatar displays left + 3 right on the wall
  // - teleport pad
  // -------------------------
  function addStorefront(){
    const storeZ = lobbyR - 0.9;
    const storeY = 3.0;

    // facade base
    const facade = new THREE.Group();

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(18, 7.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.45, metalness: 0.45 })
    );
    frame.position.set(0, storeY, storeZ - 0.20);
    facade.add(frame);

    // window panels
    const glassM = new THREE.MeshStandardMaterial({
      color: 0x0a1020, roughness: 0.15, metalness: 0.9,
      emissive: 0x001133, emissiveIntensity: 0.35, transparent:true, opacity:0.75
    });

    const winL = new THREE.Mesh(new THREE.BoxGeometry(6.0, 4.6, 0.12), glassM);
    winL.position.set(-5.5, storeY+0.3, storeZ+0.10);
    facade.add(winL);

    const winR = winL.clone();
    winR.position.x = 5.5;
    facade.add(winR);

    // doorway
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 5.6, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x05050a, emissive: 0x00ffcc, emissiveIntensity: 0.25 })
    );
    door.position.set(0, storeY-0.1, storeZ+0.12);
    facade.add(door);

    // sign
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 1.3, 0.28),
      neonMat(0x00ffcc, 0x00ffcc, 1.2)
    );
    sign.position.set(0, storeY+3.6, storeZ+0.05);
    facade.add(sign);

    // teleport pad “STORE”
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.22, 40),
      neonMat(0x00ffcc, 0x00ffcc, 1.3)
    );
    pad.position.set(0, 0.12, lobbyR - 8.8);
    scene.add(pad);
    teleportSurfaces.push(pad);

    scene.add(facade);

    // Avatar displays: 3 left + 3 right (placeholder mannequins)
    function makeMannequin(color){
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.28, 0.75, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.6, metalness: 0.3, emissive: color, emissiveIntensity: 0.25 })
      );
      body.position.y = 1.0;
      g.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0x05050a, emissive: color, emissiveIntensity: 0.35 })
      );
      head.position.y = 1.7;
      g.add(head);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.18, 18),
        neonMat(0x00d5ff, 0x00b7ff, 1.2)
      );
      base.position.y = 0.09;
      g.add(base);

      return g;
    }

    const leftX = -11.5;
    const rightX = 11.5;

    const z1 = lobbyR - 3.0;
    const z2 = lobbyR - 6.2;
    const z3 = lobbyR - 9.4;

    const left = [
      {x:leftX,z:z1,c:0x8a2be2},
      {x:leftX,z:z2,c:0x00a6ff},
      {x:leftX,z:z3,c:0xff00aa}
    ];
    const right = [
      {x:rightX,z:z1,c:0xff00aa},
      {x:rightX,z:z2,c:0x00a6ff},
      {x:rightX,z:z3,c:0x8a2be2}
    ];

    [...left, ...right].forEach(d=>{
      const m = makeMannequin(d.c);
      m.position.set(d.x, 0, d.z);
      m.rotation.y = Math.PI; // face inward
      scene.add(m);

      // small spotlight
      const spot = new THREE.PointLight(d.c, 0.45, 18);
      spot.position.set(d.x, 2.6, d.z+0.6);
      scene.add(spot);
    });

    // label lights around store area
    const storeGlow = new THREE.PointLight(0x00ffcc, 0.55, 55);
    storeGlow.position.set(0, 7.5, lobbyR - 2.0);
    scene.add(storeGlow);

    return pad;
  }
  const storePad = addStorefront();

  // -------------------------
  // TELEPORT PADS: LOBBY + PIT + STORE
  // -------------------------
  function makePad(labelColor, x, z){
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.20, 36),
      neonMat(labelColor, labelColor, 1.2)
    );
    pad.position.set(x, 0.12, z);
    scene.add(pad);
    teleportSurfaces.push(pad);

    const beam = new THREE.PointLight(labelColor, 0.55, 40);
    beam.position.set(x, 3.0, z);
    scene.add(beam);

    return pad;
  }

  const lobbyPad = makePad(0x00a6ff,  0, 18);
  const pitPad   = makePad(0xff00aa,  0, 6);

  // -------------------------
  // NINJA + COMBAT NINJA (one standing guard, one walking)
  // (Placeholders now; you can swap to your real avatars later.)
  // -------------------------
  function makeNinja(color){
    const g = new THREE.Group();

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.30, 0.80, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x05050a, roughness: 0.55, metalness: 0.25, emissive: color, emissiveIntensity: 0.18 })
    );
    torso.position.y = 1.05;
    g.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0x05050a, emissive: color, emissiveIntensity: 0.25 })
    );
    head.position.y = 1.75;
    g.add(head);

    const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.06, 0.06), neonMat(0x00ffff, 0x00c8ff, 1.3));
    eyes.position.set(0, 1.74, 0.20);
    g.add(eyes);

    return g;
  }

  // Guard ninja at entrance platform
  const guard = makeNinja(0x8a2be2);
  guard.position.copy(entryPlatform.position);
  guard.position.y = 0;
  // offset to the side of entrance
  guard.position.x += 1.25;
  guard.position.z += 0.65;
  guard.rotation.y = entryAngle + Math.PI/2;
  scene.add(guard);

  // Combat ninja patrol (walks around pit rim)
  const patrol = makeNinja(0xff00aa);
  patrol.position.set(pitR + 6.2, 0, 0);
  scene.add(patrol);

  let patrolT = 0;
  updates.push((dt)=>{
    patrolT += dt;
    const a = patrolT * 0.35;
    const r = pitR + 6.2;
    patrol.position.x = Math.cos(a)*r;
    patrol.position.z = Math.sin(a)*r;
    patrol.rotation.y = -a + Math.PI/2;
  });

  // -------------------------
  // Simple teleport behavior (pads are surfaces; your Input does raycast)
  // If you want SNAP teleport to named areas later, we can add it.
  // -------------------------

  // -------------------------
  // FINAL: spawn & orientation
  // -------------------------
  rig.position.set(0, 1.8, 26);
  rig.rotation.set(0,0,0);
  rig.lookAt(0, 1.6, 0);

  log("✅ Lobby ready: stairs+entrance, rails, store, bots, textures, jumbotrons.");
      }
