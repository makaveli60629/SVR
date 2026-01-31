export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, updates, log } = ctx;

  // -------------------------
  // DIMENSIONS (pit raised / shallower)
  // -------------------------
  const lobbyR = 46;
  const wallH  = 11;
  const wallT  = 1.2;

  const pitR = 10.5;

  // ✅ Raised pit floor by making pit less deep
  const pitDepth = 5.2;                 // WAS ~7.6
  const pitFloorY = -pitDepth + 0.05;

  const innerFloorR = pitR + 0.30;

  // Stairs entrance direction (toward +X)
  const entryAngle = 0;
  const entryDir = new THREE.Vector3(Math.cos(entryAngle), 0, Math.sin(entryAngle));

  // Store direction (+Z)
  const storeAngle = Math.PI/2;

  // -------------------------
  // TEXTURES (procedural)
  // -------------------------
  function makeCarpetTex(){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#2a1650";
    g.fillRect(0,0,512,512);

    for (let i=0;i<15000;i++){
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
    for (let i=0;i<6;i++){
      g.beginPath();
      g.arc(256,256, 100+i*30, 0, Math.PI*2);
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

    for (let y=0;y<512;y+=64){
      for (let x=0;x<512;x+=96){
        const col = 18 + ((Math.random()*12)|0);
        g.fillStyle = `rgb(${col},${col+2},${col+12})`;
        g.fillRect(x+4, y+4, 88, 56);

        g.strokeStyle = "rgba(0,200,255,0.12)";
        g.lineWidth = 2;
        g.strokeRect(x+4, y+4, 88, 56);
      }
    }

    g.globalAlpha = 0.35;
    g.strokeStyle = "#8a2be2";
    g.lineWidth = 2;
    for (let i=0;i<16;i++){
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
  const metalDark   = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.65, metalness: 0.35 });
  const metalRail   = new THREE.MeshStandardMaterial({ color: 0x141426, roughness: 0.55, metalness: 0.60 });

  // -------------------------
  // LIGHTING (brighter + ceiling not black)
  // -------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.70));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x303070, 1.45);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.10);
  dir.position.set(12, 18, 10);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 1.8, 320);
  top.position.set(0, 16.5, 0);
  scene.add(top);

  // Futuristic ceiling disc + rings (visible, not black)
  {
    const ceilY = 12.0;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(lobbyR - 2.0, 120),
      new THREE.MeshStandardMaterial({
        color: 0x0f1230,
        emissive: 0x121a44,
        emissiveIntensity: 0.7,
        roughness: 0.6,
        metalness: 0.15,
        side: THREE.DoubleSide
      })
    );
    disc.rotation.x = Math.PI/2;
    disc.position.y = ceilY;
    scene.add(disc);

    for (let k=0;k<3;k++){
      const r = lobbyR - 10 - k*8;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.10, 10, 120),
        neonMat(0x00d5ff, 0x00b7ff, 2.0 - k*0.35)
      );
      ring.rotation.x = Math.PI/2;
      ring.position.y = ceilY - 0.6;
      scene.add(ring);
    }
  }

  // -------------------------
  // FLOOR (visible circle ring + teleport plane)
  // -------------------------
  {
    const floor = new THREE.Mesh(
      new THREE.RingGeometry(innerFloorR, lobbyR, 140, 1),
      floorMat
    );
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(innerFloorR + 0.02, 0.10, 10, 120),
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

    const band = new THREE.Mesh(
      new THREE.TorusGeometry(lobbyR-0.35, 0.10, 10, 140),
      neonMat(0x00d5ff, 0x00b7ff, 1.9)
    );
    band.rotation.x = Math.PI/2;
    band.position.y = 2.35;
    scene.add(band);
  }

  // -------------------------
  // PIT (shallower) + trims
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

    // Mid ring (bluish line)
    const mid = new THREE.Mesh(
      new THREE.TorusGeometry(pitR-0.12, 0.07, 10, 120),
      neonMat(0x2222ff, 0x00a6ff, 1.9)
    );
    mid.rotation.x = Math.PI/2;
    mid.position.y = pitFloorY + pitDepth*0.55;
    scene.add(mid);

    // Bottom ring now closer because floor is higher
    const bot = new THREE.Mesh(
      new THREE.TorusGeometry(pitR - 0.25, 0.12, 10, 120),
      neonMat(0xff00aa, 0xff00aa, 2.0)
    );
    bot.rotation.x = Math.PI/2;
    bot.position.y = pitFloorY + 0.18;
    scene.add(bot);

    pitFloor = new THREE.Mesh(new THREE.CircleGeometry(pitR-0.28, 140), pitFloorMat);
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = pitFloorY;
    scene.add(pitFloor);
    teleportSurfaces.push(pitFloor);

    // Pit lights
    const p1 = new THREE.PointLight(0x00c8ff, 0.75, 70);
    p1.position.set(0, pitFloorY + 1.8, 0);
    scene.add(p1);

    const p2 = new THREE.PointLight(0xff00aa, 0.65, 70);
    p2.position.set(2.8, pitFloorY + 2.2, -2.2);
    scene.add(p2);
  }

  // -------------------------
  // SOLID RAILS (horizontal tubes, aligned)
  // - ring rail with a clean opening for the stairs entrance
  // -------------------------
  function angleDist(a,b){
    let d = (a-b)%(Math.PI*2);
    if (d > Math.PI) d -= Math.PI*2;
    if (d < -Math.PI) d += Math.PI*2;
    return Math.abs(d);
  }

  function addRingRailWithOpening(){
    const railR = pitR + 1.55;
    const railY = 1.15;
    const opening = Math.PI/8; // ~22.5 degrees
    const postCount = 28;

    // posts
    const postG = new THREE.CylinderGeometry(0.08, 0.08, 1.05, 10);
    for (let i=0;i<postCount;i++){
      const a = (i/postCount)*Math.PI*2;
      if (angleDist(a, entryAngle) < opening*0.6) continue;

      const x = Math.cos(a)*railR;
      const z = Math.sin(a)*railR;

      const post = new THREE.Mesh(postG, metalRail);
      post.position.set(x, railY-0.47, z);
      scene.add(post);
    }

    // top rail built from short horizontal segments (no “sticks”)
    const segs = 60;
    const tubeLen = (Math.PI*2 / segs) * railR;
    const tubeG = new THREE.CylinderGeometry(0.07, 0.07, tubeLen, 10);

    for (let i=0;i<segs;i++){
      const a = (i/segs)*Math.PI*2;
      if (angleDist(a, entryAngle) < opening*0.55) continue;

      const x = Math.cos(a)*railR;
      const z = Math.sin(a)*railR;

      const tube = new THREE.Mesh(tubeG, neonMat(0x00d5ff, 0x00b7ff, 1.55));
      tube.position.set(x, railY+0.05, z);
      tube.rotation.z = Math.PI/2; // horizontal
      tube.rotation.y = a;
      scene.add(tube);
    }

    // opening edge lights
    const e1 = new THREE.PointLight(0x00c8ff, 0.9, 25);
    e1.position.set(Math.cos(entryAngle-opening/2)*railR, railY+0.3, Math.sin(entryAngle-opening/2)*railR);
    scene.add(e1);

    const e2 = new THREE.PointLight(0x00c8ff, 0.9, 25);
    e2.position.set(Math.cos(entryAngle+opening/2)*railR, railY+0.3, Math.sin(entryAngle+opening/2)*railR);
    scene.add(e2);
  }
  addRingRailWithOpening();

  // -------------------------
  // CURVED / WALL-SIDE STAIRS (spiral hugging PIT WALL)
  // - wall (pit wall) on one side
  // - handrail on the inner side guiding you down
  // -------------------------
  function addSpiralPitStairs(){
    // Start at pit lip near opening (top), spiral down to near pit floor.
    const steps = 18;                 // feels like real stairs, not ladder
    const stepW = 1.65;
    const stepD = 0.75;

    const startY = 0.95;
    const endY   = pitFloorY + 1.10;
    const stepH  = (startY - endY) / steps;

    // Hug pit wall: radius near pit wall (inside pit)
    const rWall = pitR - 0.65;

    // Spiral turns: about ~90 degrees
    const aStart = entryAngle + 0.45;           // offset so you enter naturally through opening
    const aSpan  = Math.PI * 0.58;              // ~104 degrees

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x111122, roughness: 0.82, metalness: 0.22,
      emissive: 0x12003a, emissiveIntensity: 0.22
    });

    // Build steps
    for (let i=0;i<steps;i++){
      const t = i/(steps-1);
      const a = aStart + aSpan*t;

      const x = Math.cos(a)*rWall;
      const z = Math.sin(a)*rWall;
      const y = startY - (i+1)*stepH;

      const s = new THREE.Mesh(
        new THREE.BoxGeometry(stepW, Math.max(0.14, stepH*0.92), stepD),
        stepMat
      );
      s.position.set(x, y, z);
      // face along the tangent direction of the spiral
      s.rotation.y = a + Math.PI/2;
      scene.add(s);
      teleportSurfaces.push(s);
    }

    // Bottom landing
    const aEnd = aStart + aSpan;
    const landX = Math.cos(aEnd)*(rWall - 0.55);
    const landZ = Math.sin(aEnd)*(rWall - 0.55);

    const landing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 2.6), stepMat);
    landing.position.set(landX, endY - 0.15, landZ);
    landing.rotation.y = aEnd + Math.PI/2;
    scene.add(landing);
    teleportSurfaces.push(landing);

    // Inner handrail (solid + horizontal)
    const railR = rWall - 0.95;       // inner side (toward center)
    const railY = 1.35;

    const segs = 28;
    const tubeLen = (aSpan / segs) * railR;
    const tubeG = new THREE.CylinderGeometry(0.06, 0.06, tubeLen, 10);

    for (let i=0;i<segs;i++){
      const tt = (i+0.5)/segs;
      const a = aStart + aSpan*tt;

      const x = Math.cos(a)*railR;
      const z = Math.sin(a)*railR;

      const tube = new THREE.Mesh(tubeG, neonMat(0x00ffff, 0x00c8ff, 1.2));
      tube.position.set(x, railY + (startY-endY)*tt*0.65, z);
      tube.rotation.z = Math.PI/2;        // horizontal
      tube.rotation.y = a;
      scene.add(tube);

      // occasional post
      if (i % 4 === 0){
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05, 0.9, 10), metalRail);
        post.position.set(x, tube.position.y - 0.45, z);
        scene.add(post);
      }
    }

    // Entrance platform outside pit aligned with opening
    const platR = innerFloorR + 1.25;
    const platX = entryDir.x * platR;
    const platZ = entryDir.z * platR;

    const platform = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.22, 3.3), metalDark);
    platform.position.set(platX, 0.11, platZ);
    platform.rotation.y = entryAngle;
    scene.add(platform);
    teleportSurfaces.push(platform);

    // small gate frame
    const frameM = neonMat(0x8a2be2, 0x6f00ff, 1.1);
    const pillarG = new THREE.BoxGeometry(0.22, 2.7, 0.22);

    const leftP  = new THREE.Mesh(pillarG, frameM);
    const rightP = new THREE.Mesh(pillarG, frameM);
    leftP.position.set(platX + 1.7, 1.35, platZ);
    rightP.position.set(platX - 1.7, 1.35, platZ);
    scene.add(leftP, rightP);

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 0.22), frameM);
    topBar.position.set(platX, 2.55, platZ);
    scene.add(topBar);

    return { platform };
  }
  const { platform: entryPlatform } = addSpiralPitStairs();

  // -------------------------
  // JUMBOTRONS (flush aligned)
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
      new THREE.MeshStandardMaterial({ color: 0x111133, emissive: 0x2222ff, emissiveIntensity: 0.95 })
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
    });
  }

  // -------------------------
  // PILLARS taller + top caps + lights
  // -------------------------
  {
    const count = 10;
    const coreG = new THREE.CylinderGeometry(0.55, 0.7, 10.8, 14); // taller
    const bandG = new THREE.CylinderGeometry(0.68, 0.68, 0.30, 14);
    const capG  = new THREE.CylinderGeometry(0.9, 0.9, 0.35, 16);

    const coreM = new THREE.MeshStandardMaterial({ color: 0x0e0e16, roughness: 0.6, metalness: 0.4 });

    for (let i=0;i<count;i++){
      const a = (i/count)*Math.PI*2;
      const r = lobbyR - 1.1;
      const x = Math.cos(a)*r;
      const z = Math.sin(a)*r;

      const p = new THREE.Mesh(coreG, coreM);
      p.position.set(x, 5.4, z);
      scene.add(p);

      const b1 = new THREE.Mesh(bandG, neonMat(0x8a2be2, 0x6f00ff, 2.0));
      b1.position.set(x, 2.4, z);
      scene.add(b1);

      const b2 = b1.clone();
      b2.position.y = 7.8;
      scene.add(b2);

      const cap = new THREE.Mesh(capG, neonMat(0x00d5ff, 0x00b7ff, 1.2));
      cap.position.set(x, 10.9, z);
      scene.add(cap);

      const upl = new THREE.PointLight(0x6f00ff, 0.35, 34);
      upl.position.set(x, 1.0, z);
      scene.add(upl);
    }
  }

  // -------------------------
  // STORE FRONT + SIGN + display lights + “planters/trees”
  // -------------------------
  function makeTextSignTexture(text){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#061019";
    g.fillRect(0,0,c.width,c.height);

    g.fillStyle = "rgba(0,255,204,0.15)";
    g.fillRect(0,0,c.width,c.height);

    g.font = "bold 96px sans-serif";
    g.fillStyle = "#00ffcc";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 256, 120);

    g.strokeStyle = "rgba(0,200,255,0.7)";
    g.lineWidth = 6;
    g.strokeRect(16, 16, c.width-32, c.height-32);

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 6;
    return tex;
  }

  function addStorefront(){
    const storeZ = lobbyR - 0.9;
    const storeY = 3.0;

    const facade = new THREE.Group();

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(18, 7.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.45, metalness: 0.45 })
    );
    frame.position.set(0, storeY, storeZ - 0.20);
    facade.add(frame);

    const glassM = new THREE.MeshStandardMaterial({
      color: 0x0a1020, roughness: 0.12, metalness: 0.95,
      emissive: 0x001133, emissiveIntensity: 0.35, transparent:true, opacity:0.75
    });

    const winL = new THREE.Mesh(new THREE.BoxGeometry(6.0, 4.6, 0.12), glassM);
    winL.position.set(-5.5, storeY+0.3, storeZ+0.10);
    facade.add(winL);

    const winR = winL.clone();
    winR.position.x = 5.5;
    facade.add(winR);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 5.6, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x05050a, emissive: 0x00ffcc, emissiveIntensity: 0.22 })
    );
    door.position.set(0, storeY-0.1, storeZ+0.12);
    facade.add(door);

    // ✅ Real sign (textured)
    const signTex = makeTextSignTexture("STORE");
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(10.8, 1.8, 0.25),
      new THREE.MeshStandardMaterial({
        map: signTex,
        emissive: 0x00ffcc,
        emissiveIntensity: 0.65,
        roughness: 0.4,
        metalness: 0.2
      })
    );
    sign.position.set(0, storeY+3.7, storeZ+0.05);
    facade.add(sign);

    // Teleport pad (outside store)
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.22, 40),
      neonMat(0x00ffcc, 0x00ffcc, 1.2)
    );
    pad.position.set(0, 0.12, lobbyR - 8.8);
    scene.add(pad);
    teleportSurfaces.push(pad);

    // display case lights
    const dl1 = new THREE.PointLight(0x00ffcc, 0.55, 30);
    dl1.position.set(-6.0, 6.7, lobbyR - 2.2);
    scene.add(dl1);

    const dl2 = new THREE.PointLight(0x00ffcc, 0.55, 30);
    dl2.position.set(6.0, 6.7, lobbyR - 2.2);
    scene.add(dl2);

    // “Trees/planters”
    function planter(x,z){
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.45, 18), metalDark);
      base.position.set(x, 0.22, z);
      scene.add(base);

      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.14, 1.3, 12), neonMat(0x00d5ff,0x00b7ff,0.7));
      stalk.position.set(x, 1.1, z);
      scene.add(stalk);

      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), neonMat(0x00ffcc,0x00ffcc,0.6));
      crown.position.set(x, 1.9, z);
      scene.add(crown);
    }
    planter(-9.0, lobbyR - 7.5);
    planter( 9.0, lobbyR - 7.5);

    scene.add(facade);
    return pad;
  }
  addStorefront();

  // -------------------------
  // AVATAR DISPLAYS: load your real avatars if filenames match
  // - looks in /assets/avatars/
  // - if not found, it uses mannequins instead (no crash)
  // -------------------------
  async function tryLoadGLB(url){
    const { GLTFLoader } = await import("https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
    return await new Promise((resolve, reject)=>{
      const loader = new GLTFLoader();
      loader.load(url, gltf=>resolve(gltf.scene), undefined, err=>reject(err));
    });
  }

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

  // 👇 Put your actual filenames here (in assets/avatars/)
  // Example: "ninja.glb", "combat_ninja.glb", "female.glb", etc.
  const avatarFiles = [
    "avatar1.glb",
    "avatar2.glb",
    "avatar3.glb",
    "avatar4.glb",
    "avatar5.glb",
    "avatar6.glb",
  ];

  async function placeAvatarDisplay(x, z, idx, color){
    const spot = new THREE.PointLight(color, 0.55, 18);
    spot.position.set(x, 2.8, z+0.6);
    scene.add(spot);

    let model = null;
    const url = `assets/avatars/${avatarFiles[idx]}`;
    try {
      model = await tryLoadGLB(url);
      model.scale.set(1.2, 1.2, 1.2);
    } catch (e) {
      model = makeMannequin(color);
    }

    model.position.set(x, 0, z);
    model.rotation.y = Math.PI; // face inward
    scene.add(model);

    // small “display case” behind
    const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.22), metalDark);
    caseMesh.position.set(x, 1.4, z+0.55);
    scene.add(caseMesh);

    const edge = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.10, 0.06), neonMat(color, color, 1.1));
    edge.position.set(x, 0.25, z+0.45);
    scene.add(edge);
  }

  // 3 left + 3 right near storefront corridor
  {
    const leftX  = -11.5;
    const rightX =  11.5;
    const z1 = lobbyR - 3.0;
    const z2 = lobbyR - 6.2;
    const z3 = lobbyR - 9.4;

    const colors = [0x8a2be2, 0x00a6ff, 0xff00aa, 0xff00aa, 0x00a6ff, 0x8a2be2];

    await placeAvatarDisplay(leftX,  z1, 0, colors[0]);
    await placeAvatarDisplay(leftX,  z2, 1, colors[1]);
    await placeAvatarDisplay(leftX,  z3, 2, colors[2]);

    await placeAvatarDisplay(rightX, z1, 3, colors[3]);
    await placeAvatarDisplay(rightX, z2, 4, colors[4]);
    await placeAvatarDisplay(rightX, z3, 5, colors[5]);
  }

  // -------------------------
  // NINJA GUARD + COMBAT NINJA PATROL (placeholders until you map your real files)
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

  // Guard at entrance platform
  const guard = makeNinja(0x8a2be2);
  guard.position.copy(entryPlatform.position);
  guard.position.y = 0;
  guard.position.x += 1.25;
  guard.position.z += 0.65;
  guard.rotation.y = entryAngle + Math.PI/2;
  scene.add(guard);

  // Patrol around pit rim (now has “body”)
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
  // TELEPORT PADS (NO PINK PAD IN PIT anymore)
  // - lobby pad (outside)
  // - pit pad (outside pit near entrance)
  // -------------------------
  function makePad(color, x, z){
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.55, 0.20, 36),
      neonMat(color, color, 1.2)
    );
    pad.position.set(x, 0.12, z);
    scene.add(pad);
    teleportSurfaces.push(pad);

    const beam = new THREE.PointLight(color, 0.5, 40);
    beam.position.set(x, 3.0, z);
    scene.add(beam);

    return pad;
  }

  makePad(0x00a6ff, 0, 18); // lobby
  // pit pad now near entrance OUTSIDE pit, not inside
  makePad(0xff00aa, entryDir.x*(innerFloorR+2.2), entryDir.z*(innerFloorR+2.2));

  // -------------------------
  // SPAWN facing pit
  // -------------------------
  rig.position.set(0, 1.8, 26);
  rig.rotation.set(0,0,0);
  rig.lookAt(0, 1.6, 0);

  log("✅ Spiral stairs hugging pit wall + fixed rails + raised pit + brighter ceiling + store + avatar displays");
        }
