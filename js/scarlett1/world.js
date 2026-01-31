import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, updates, log } = ctx;

  // -------------------------
  // DIMENSIONS (bigger walls + adjusted pit)
  // -------------------------
  const lobbyR = 54;           // bigger
  const wallH  = 12;
  const wallT  = 1.2;

  const pitR = 10.5;

  // pit depth raised (less deep than before)
  const pitDepth = 4.6;        // raised more
  const pitFloorY = -pitDepth + 0.06;

  const innerFloorR = pitR + 0.30;

  // Entrance direction (+X)
  const entryAngle = 0;
  const entryDir = new THREE.Vector3(Math.cos(entryAngle), 0, Math.sin(entryAngle));

  // Store direction (+Z)
  const storeAngle = Math.PI/2;

  // -------------------------
  // Helpers
  // -------------------------
  function angleDist(a,b){
    let d = (a-b)%(Math.PI*2);
    if (d > Math.PI) d -= Math.PI*2;
    if (d < -Math.PI) d += Math.PI*2;
    return Math.abs(d);
  }

  function makeCanvasTex(drawFn, repeatX=1, repeatY=1){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    drawFn(g, c);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = 6;
    return tex;
  }

  // -------------------------
  // TEXTURES
  // -------------------------
  const carpetTex = makeCanvasTex((g,c)=>{
    g.fillStyle = "#2a1650";
    g.fillRect(0,0,c.width,c.height);

    for (let i=0;i<16000;i++){
      const x = (Math.random()*c.width)|0;
      const y = (Math.random()*c.height)|0;
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
      g.arc(256,256, 90+i*28, 0, Math.PI*2);
      g.stroke();
    }
    g.globalAlpha = 1;
  }, 8, 8);

  const wallTex = makeCanvasTex((g,c)=>{
    g.fillStyle = "#0b0f1f";
    g.fillRect(0,0,c.width,c.height);

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
  }, 6, 2);

  const pitTex = makeCanvasTex((g,c)=>{
    g.fillStyle = "#0a0a12";
    g.fillRect(0,0,c.width,c.height);

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
  }, 7, 2);

  // Pit carpet (denser)
  const pitCarpetTex = makeCanvasTex((g,c)=>{
    g.fillStyle = "#1b0d35";
    g.fillRect(0,0,c.width,c.height);
    for (let i=0;i<22000;i++){
      const x = (Math.random()*c.width)|0;
      const y = (Math.random()*c.height)|0;
      const v = 12 + (Math.random()*28)|0;
      g.fillStyle = `rgb(${v},${(v*0.4)|0},${(v*1.25)|0})`;
      g.fillRect(x,y,1,1);
    }
    g.globalAlpha = 0.18;
    g.strokeStyle = "#00c8ff";
    g.lineWidth = 2;
    for (let i=0;i<5;i++){
      g.beginPath();
      g.arc(256,256, 80+i*38, 0, Math.PI*2);
      g.stroke();
    }
    g.globalAlpha = 1;
  }, 5, 5);

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

  const pitFloorMat = new THREE.MeshStandardMaterial({
    map: pitCarpetTex,
    color: 0xffffff,
    roughness: 0.98,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  const metalDark = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.65, metalness: 0.35 });
  const metalRail = new THREE.MeshStandardMaterial({ color: 0x141426, roughness: 0.55, metalness: 0.60 });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.22,
    roughness: 0.08,
    metalness: 0.05,
    emissive: 0x001133,
    emissiveIntensity: 0.25
  });

  // -------------------------
  // LIGHTING (bright + readable)
  // -------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x303070, 1.55);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.15);
  dir.position.set(14, 20, 12);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 2.1, 420);
  top.position.set(0, 18.0, 0);
  scene.add(top);

  // ceiling disc + rings
  {
    const ceilY = 13.0;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(lobbyR - 2.0, 140),
      new THREE.MeshStandardMaterial({
        color: 0x11184a,
        emissive: 0x1a2a66,
        emissiveIntensity: 0.85,
        roughness: 0.6,
        metalness: 0.12,
        side: THREE.DoubleSide
      })
    );
    disc.rotation.x = Math.PI/2;
    disc.position.y = ceilY;
    scene.add(disc);

    for (let k=0;k<3;k++){
      const r = lobbyR - 12 - k*9;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.11, 10, 140),
        neonMat(0x00d5ff, 0x00b7ff, 2.0 - k*0.35)
      );
      ring.rotation.x = Math.PI/2;
      ring.position.y = ceilY - 0.7;
      scene.add(ring);
    }
  }

  // -------------------------
  // Walk surfaces for gravity snapping
  // -------------------------
  ctx.walkSurfaces = ctx.walkSurfaces || [];

  // -------------------------
  // FLOOR ring + teleport plane
  // -------------------------
  {
    const floor = new THREE.Mesh(
      new THREE.RingGeometry(innerFloorR, lobbyR, 160, 1),
      floorMat
    );
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(innerFloorR + 0.02, 0.10, 10, 140),
      neonMat(0x8a2be2, 0x6f00ff, 1.9)
    );
    trim.rotation.x = Math.PI/2;
    trim.position.y = 0.05;
    scene.add(trim);

    const tp = new THREE.Mesh(
      new THREE.CircleGeometry(lobbyR-2, 140),
      new THREE.MeshBasicMaterial({ transparent:true, opacity:0 })
    );
    tp.rotation.x = -Math.PI/2;
    tp.position.y = 0.02;
    scene.add(tp);
    teleportSurfaces.push(tp);
    ctx.walkSurfaces.push(tp);
  }

  // -------------------------
  // OUTER WALL
  // -------------------------
  {
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 160, 1, true),
      wallMat
    );
    wall.position.y = wallH/2;
    scene.add(wall);

    const band = new THREE.Mesh(
      new THREE.TorusGeometry(lobbyR-0.45, 0.10, 10, 160),
      neonMat(0x00d5ff, 0x00b7ff, 1.9)
    );
    band.rotation.x = Math.PI/2;
    band.position.y = 2.45;
    scene.add(band);
  }

  // -------------------------
  // PIT
  // -------------------------
  {
    const pitW = new THREE.Mesh(
      new THREE.CylinderGeometry(pitR, pitR, pitDepth, 160, 1, true),
      pitWallMat
    );
    pitW.position.y = -pitDepth/2 + 0.08;
    scene.add(pitW);

    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 140),
      neonMat(0x00ffff, 0x00c8ff, 2.6)
    );
    lip.rotation.x = Math.PI/2;
    lip.position.y = 1.05;
    scene.add(lip);

    const mid = new THREE.Mesh(
      new THREE.TorusGeometry(pitR-0.12, 0.07, 10, 140),
      neonMat(0x2222ff, 0x00a6ff, 2.0)
    );
    mid.rotation.x = Math.PI/2;
    mid.position.y = pitFloorY + pitDepth*0.62;
    scene.add(mid);

    const bot = new THREE.Mesh(
      new THREE.TorusGeometry(pitR - 0.25, 0.11, 10, 140),
      neonMat(0xff00aa, 0xff00aa, 1.9)
    );
    bot.rotation.x = Math.PI/2;
    bot.position.y = pitFloorY + 0.20;
    scene.add(bot);

    const pitFloor = new THREE.Mesh(
      new THREE.CircleGeometry(pitR-0.28, 160),
      pitFloorMat
    );
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = pitFloorY;
    scene.add(pitFloor);
    teleportSurfaces.push(pitFloor);
    ctx.walkSurfaces.push(pitFloor);

    const p1 = new THREE.PointLight(0x00c8ff, 0.95, 90);
    p1.position.set(0, pitFloorY + 2.1, 0);
    scene.add(p1);

    const p2 = new THREE.PointLight(0xff00aa, 0.75, 90);
    p2.position.set(3.2, pitFloorY + 2.4, -2.4);
    scene.add(p2);
  }

  // -------------------------
  // PIT RAIL ring with opening at entrance (tight)
  // -------------------------
  const railR = pitR + 1.55;
  const railY = 1.15;
  const opening = Math.PI/7; // comfortable opening

  {
    // posts
    const postCount = 34;
    const postG = new THREE.CylinderGeometry(0.08, 0.08, 1.08, 10);
    for (let i=0;i<postCount;i++){
      const a = (i/postCount)*Math.PI*2;
      if (angleDist(a, entryAngle) < opening*0.62) continue;

      const x = Math.cos(a)*railR;
      const z = Math.sin(a)*railR;

      const post = new THREE.Mesh(postG, metalRail);
      post.position.set(x, railY-0.47, z);
      scene.add(post);
    }

    // top rail segments (horizontal)
    const segs = 72;
    const tubeLen = (Math.PI*2 / segs) * railR;
    const tubeG = new THREE.CylinderGeometry(0.07, 0.07, tubeLen, 10);

    for (let i=0;i<segs;i++){
      const a = (i/segs)*Math.PI*2;
      if (angleDist(a, entryAngle) < opening*0.58) continue;

      const x = Math.cos(a)*railR;
      const z = Math.sin(a)*railR;

      const tube = new THREE.Mesh(tubeG, neonMat(0x00d5ff, 0x00b7ff, 1.55));
      tube.position.set(x, railY+0.05, z);
      tube.rotation.z = Math.PI/2;
      tube.rotation.y = a;
      scene.add(tube);
    }

    // opening edge lights
    const e1 = new THREE.PointLight(0x00c8ff, 1.0, 26);
    e1.position.set(Math.cos(entryAngle-opening/2)*railR, railY+0.3, Math.sin(entryAngle-opening/2)*railR);
    scene.add(e1);

    const e2 = new THREE.PointLight(0x00c8ff, 1.0, 26);
    e2.position.set(Math.cos(entryAngle+opening/2)*railR, railY+0.3, Math.sin(entryAngle+opening/2)*railR);
    scene.add(e2);
  }

  // -------------------------
  // CONNECTED ENTRANCE PLATFORM + SHORT SPIRAL STAIRS (wall-hugging)
  // -------------------------
  function addConnectedSpiralStairs(){
    const stepCount = 16;              // shorter but usable
    const stepW = 1.85;
    const stepD = 0.82;

    const topY = 0.95;
    const bottomY = pitFloorY + 1.05;
    const stepH = (topY - bottomY) / stepCount;

    // hugging pit wall inside pit
    const rWall = pitR - 0.55;

    // Start at opening direction and immediately curve along wall
    const aStart = entryAngle + opening*0.45;
    const aSpan  = Math.PI * 0.55;     // ~99 degrees

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x121226, roughness: 0.78, metalness: 0.22,
      emissive: 0x12003a, emissiveIntensity: 0.20
    });

    // Entrance platform OUTSIDE pit positioned right at opening edge (connected)
    const platR = innerFloorR + 0.65;
    const platX = Math.cos(entryAngle) * platR;
    const platZ = Math.sin(entryAngle) * platR;

    const platform = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 3.6), metalDark);
    platform.position.set(platX, 0.11, platZ);
    platform.rotation.y = entryAngle;
    scene.add(platform);
    teleportSurfaces.push(platform);
    ctx.walkSurfaces.push(platform);

    // Gate frame (tight)
    const frameM = neonMat(0x8a2be2, 0x6f00ff, 1.1);
    const pillarG = new THREE.BoxGeometry(0.22, 2.9, 0.22);

    const leftP  = new THREE.Mesh(pillarG, frameM);
    const rightP = new THREE.Mesh(pillarG, frameM);
    leftP.position.set(platX + 2.0, 1.45, platZ);
    rightP.position.set(platX - 2.0, 1.45, platZ);
    scene.add(leftP, rightP);

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 0.22), frameM);
    topBar.position.set(platX, 2.75, platZ);
    scene.add(topBar);

    // First step placed near opening so it visually connects
    for (let i=0;i<stepCount;i++){
      const t = i/(stepCount-1);
      const a = aStart + aSpan*t;

      const x = Math.cos(a)*rWall;
      const z = Math.sin(a)*rWall;
      const y = topY - (i+1)*stepH;

      const step = new THREE.Mesh(
        new THREE.BoxGeometry(stepW, Math.max(0.16, stepH*0.94), stepD),
        stepMat
      );
      step.position.set(x, y, z);
      step.rotation.y = a + Math.PI/2;
      scene.add(step);
      teleportSurfaces.push(step);
      ctx.walkSurfaces.push(step);

      // edge strip so steps read better
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(stepW*0.92, 0.05, 0.06),
        neonMat(0x00ffff, 0x00c8ff, 0.85)
      );
      edge.position.set(0, 0.08, stepD*0.38);
      step.add(edge);
    }

    // bottom landing
    const aEnd = aStart + aSpan;
    const landX = Math.cos(aEnd)*(rWall - 0.70);
    const landZ = Math.sin(aEnd)*(rWall - 0.70);

    const landing = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.20, 3.0), stepMat);
    landing.position.set(landX, bottomY - 0.10, landZ);
    landing.rotation.y = aEnd + Math.PI/2;
    scene.add(landing);
    teleportSurfaces.push(landing);
    ctx.walkSurfaces.push(landing);

    // Stair rail that GOES DOWN (inner side) + posts on steps
    const railInnerR = rWall - 1.05;
    const railBaseY = 1.35;

    const segs = 22;
    const tubeLen = (aSpan / segs) * railInnerR;
    const tubeG = new THREE.CylinderGeometry(0.06, 0.06, tubeLen, 10);

    for (let i=0;i<segs;i++){
      const tt = (i+0.5)/segs;
      const a = aStart + aSpan*tt;
      const x = Math.cos(a)*railInnerR;
      const z = Math.sin(a)*railInnerR;

      const y = railBaseY + (topY - bottomY)*tt*0.62; // descending
      const tube = new THREE.Mesh(tubeG, neonMat(0x00ffff, 0x00c8ff, 1.15));
      tube.position.set(x, y, z);
      tube.rotation.z = Math.PI/2;
      tube.rotation.y = a;
      scene.add(tube);

      // post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05, 0.95, 10), metalRail);
      post.position.set(x, y - 0.48, z);
      scene.add(post);
    }

    return platform;
  }

  const entryPlatform = addConnectedSpiralStairs();

  // -------------------------
  // JUMBOTRONS (higher + flush)
  // -------------------------
  function placeOnWall(obj, angle, wallRadius, y, depth=0.7, inset=0.05){
    const nx = Math.cos(angle), nz = Math.sin(angle);
    const r = wallRadius - inset - (depth*0.5);
    obj.position.set(nx*r, y, nz*r);
    obj.rotation.y = angle + Math.PI;
  }

  function makeJumbotron(){
    const w=11.5, h=6.3, d=0.7;
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
      placeOnWall(j, a, lobbyR - (wallT*0.5), 8.5, j.userData.depth, 0.05); // higher
      scene.add(j);
    });
  }

  // -------------------------
  // PILLARS (tight)
  // -------------------------
  {
    const count = 12;
    const coreG = new THREE.CylinderGeometry(0.55, 0.7, 11.6, 14);
    const bandG = new THREE.CylinderGeometry(0.68, 0.68, 0.30, 14);
    const capG  = new THREE.CylinderGeometry(0.9, 0.9, 0.35, 16);
    const coreM = new THREE.MeshStandardMaterial({ color: 0x0e0e16, roughness: 0.6, metalness: 0.4 });

    for (let i=0;i<count;i++){
      const a = (i/count)*Math.PI*2;
      const r = lobbyR - 1.2;
      const x = Math.cos(a)*r;
      const z = Math.sin(a)*r;

      const p = new THREE.Mesh(coreG, coreM);
      p.position.set(x, 5.8, z);
      scene.add(p);

      const b1 = new THREE.Mesh(bandG, neonMat(0x8a2be2, 0x6f00ff, 2.0));
      b1.position.set(x, 2.6, z);
      scene.add(b1);

      const b2 = b1.clone();
      b2.position.y = 8.2;
      scene.add(b2);

      const cap = new THREE.Mesh(capG, neonMat(0x00d5ff, 0x00b7ff, 1.2));
      cap.position.set(x, 11.5, z);
      scene.add(cap);

      const upl = new THREE.PointLight(0x6f00ff, 0.32, 34);
      upl.position.set(x, 1.0, z);
      scene.add(upl);
    }
  }

  // -------------------------
  // STOREFRONT with glass windows + avatars INSIDE behind glass
  // -------------------------
  function makeTextSignTexture(text){
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#061019";
    g.fillRect(0,0,c.width,c.height);
    g.fillStyle = "rgba(0,255,204,0.15)";
    g.fillRect(0,0,c.width,c.height);

    g.font = "bold 86px sans-serif";
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

  const storeGroup = new THREE.Group();
  {
    const storeZ = lobbyR - 0.8;
    const storeY = 3.0;

    // Slight protruding awning/roof
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(20.5, 0.6, 4.0),
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.4, metalness: 0.4, emissive:0x001122, emissiveIntensity:0.25 })
    );
    awning.position.set(0, storeY+4.2, storeZ - 0.6);
    storeGroup.add(awning);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(19.5, 8.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.45, metalness: 0.45 })
    );
    frame.position.set(0, storeY, storeZ - 0.45);
    storeGroup.add(frame);

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(4.1, 6.2, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x05050a, emissive: 0x00ffcc, emissiveIntensity: 0.22 })
    );
    door.position.set(0, storeY-0.2, storeZ + 0.05);
    storeGroup.add(door);

    // Windows (glass panes)
    const winL = new THREE.Mesh(new THREE.BoxGeometry(6.8, 5.2, 0.14), glassMat);
    winL.position.set(-6.2, storeY+0.1, storeZ + 0.15);
    storeGroup.add(winL);

    const winR = winL.clone();
    winR.position.x = 6.2;
    storeGroup.add(winR);

    // Sign
    const signTex = makeTextSignTexture("SCARLETT STORE");
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(14.0, 2.0, 0.30),
      new THREE.MeshStandardMaterial({
        map: signTex,
        emissive: 0x00ffcc,
        emissiveIntensity: 0.65,
        roughness: 0.4,
        metalness: 0.2
      })
    );
    sign.position.set(0, storeY+4.0, storeZ + 0.05);
    storeGroup.add(sign);

    // Interior base (so it looks like a real space behind glass)
    const interior = new THREE.Mesh(
      new THREE.BoxGeometry(18.0, 7.0, 6.0),
      new THREE.MeshStandardMaterial({ color: 0x070711, roughness: 0.85, metalness: 0.1, emissive:0x050522, emissiveIntensity:0.45 })
    );
    interior.position.set(0, storeY-0.3, storeZ - 2.8);
    storeGroup.add(interior);

    // Store pad near door
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.22, 40),
      neonMat(0x00ffcc, 0x00ffcc, 1.2)
    );
    pad.position.set(0, 0.12, lobbyR - 9.5);
    scene.add(pad);
    teleportSurfaces.push(pad);
    ctx.walkSurfaces.push(pad);

    // Store area lights
    const dl1 = new THREE.PointLight(0x00ffcc, 0.6, 35);
    dl1.position.set(-6.5, 7.5, lobbyR - 3.2);
    scene.add(dl1);

    const dl2 = new THREE.PointLight(0x00ffcc, 0.6, 35);
    dl2.position.set(6.5, 7.5, lobbyR - 3.2);
    scene.add(dl2);

    // Planters
    function planter(x,z){
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.45, 18), metalDark);
      base.position.set(x, 0.22, z);
      scene.add(base);

      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.14, 1.4, 12), neonMat(0x00d5ff,0x00b7ff,0.7));
      stalk.position.set(x, 1.15, z);
      scene.add(stalk);

      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.60, 16, 12), neonMat(0x00ffcc,0x00ffcc,0.6));
      crown.position.set(x, 2.05, z);
      scene.add(crown);
    }
    planter(-9.5, lobbyR - 8.2);
    planter( 9.5, lobbyR - 8.2);

    storeGroup.position.set(0,0,0);
    scene.add(storeGroup);
  }

  // -------------------------
  // Balcony ABOVE STORE ONLY (platform + rails)
  // -------------------------
  {
    const y = 7.6;
    const z = lobbyR - 5.0;

    const balcony = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.35, 9.5),
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.55, metalness: 0.35, emissive:0x0a0014, emissiveIntensity:0.22 })
    );
    balcony.position.set(0, y, z);
    scene.add(balcony);
    teleportSurfaces.push(balcony);
    ctx.walkSurfaces.push(balcony);

    // rail around balcony (3 sides)
    const railTopG = new THREE.CylinderGeometry(0.07, 0.07, 22, 10);
    const railSideG = new THREE.CylinderGeometry(0.07, 0.07, 9.5, 10);

    const topRail = new THREE.Mesh(railTopG, neonMat(0x00d5ff,0x00b7ff,1.2));
    topRail.rotation.z = Math.PI/2;
    topRail.position.set(0, y+1.15, z - 4.6);
    scene.add(topRail);

    const leftRail = new THREE.Mesh(railSideG, neonMat(0x00d5ff,0x00b7ff,1.2));
    leftRail.rotation.x = Math.PI/2;
    leftRail.position.set(-10.9, y+1.15, z);
    scene.add(leftRail);

    const rightRail = leftRail.clone();
    rightRail.position.x = 10.9;
    scene.add(rightRail);

    // posts
    const postG = new THREE.CylinderGeometry(0.06,0.06, 1.15, 10);
    for (let i=0;i<=10;i++){
      const x = -10.8 + i*(21.6/10);
      const post = new THREE.Mesh(postG, metalRail);
      post.position.set(x, y+0.58, z-4.6);
      scene.add(post);
    }
    for (let i=0;i<=4;i++){
      const zz = z-4.6 + i*(9.2/4);
      const p1 = new THREE.Mesh(postG, metalRail);
      p1.position.set(-10.9, y+0.58, zz);
      scene.add(p1);
      const p2 = new THREE.Mesh(postG, metalRail);
      p2.position.set(10.9, y+0.58, zz);
      scene.add(p2);
    }
  }

  // -------------------------
  // GLB LOADING (your avatars)
  // -------------------------
  const loader = new GLTFLoader();

  function normalizeModel(model, targetHeight=1.85){
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = Math.max(0.01, size.y);
    const s = targetHeight / h;
    model.scale.setScalar(s);

    // ground it
    const box2 = new THREE.Box3().setFromObject(model);
    const min = new THREE.Vector3();
    box2.getMin(min);
    model.position.y -= min.y;
  }

  function loadGLB(url){
    return new Promise((resolve, reject)=>{
      loader.load(url, (gltf)=>resolve(gltf.scene), undefined, reject);
    });
  }

  async function loadAvatar(file, targetHeight){
    const url = `assets/avatars/${file}`;
    const model = await loadGLB(url);
    normalizeModel(model, targetHeight);
    return model;
  }

  // -------------------------
  // Store “cases” INSIDE store behind windows (3 left, 3 right)
  // -------------------------
  function makeCaseBox(w,h,d){
    // glass box (front-facing)
    const g = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), glassMat);
    g.add(glass);

    // base pedestal inside case
    const base = new THREE.Mesh(new THREE.BoxGeometry(w*0.8, 0.25, d*0.8), metalDark);
    base.position.y = -h*0.35;
    g.add(base);

    // neon frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w*0.95, h*0.95, 0.06), neonMat(0x00ffff,0x00c8ff,0.9));
    frame.position.z = d/2 + 0.02;
    g.add(frame);

    return g;
  }

  async function placeAvatarInStoreCase(x, y, z, file){
    const caseBox = makeCaseBox(2.2, 3.2, 1.6);
    caseBox.position.set(x, y, z);
    scene.add(caseBox);

    // light inside case
    const l = new THREE.PointLight(0x00ffcc, 0.45, 12);
    l.position.set(x, y+1.3, z+0.4);
    scene.add(l);

    try {
      const av = await loadAvatar(file, 1.75);
      av.position.set(x, y-0.9, z);
      av.rotation.y = Math.PI; // face outward
      scene.add(av);
      return av;
    } catch (e) {
      return null;
    }
  }

  {
    // Put cases inside the store interior, visible through windows
    const baseZ = lobbyR - 4.0;     // inside
    const baseY = 3.0;

    const leftX = -6.2;
    const rightX = 6.2;

    const files = ["female.glb","male.glb","futuristic_apocalypse_female_cargo_pants.glb"];

    // three behind left window
    await placeAvatarInStoreCase(leftX-2.2, baseY, baseZ, files[0]);
    await placeAvatarInStoreCase(leftX,     baseY, baseZ, files[1]);
    await placeAvatarInStoreCase(leftX+2.2, baseY, baseZ, files[2]);

    // three behind right window
    await placeAvatarInStoreCase(rightX-2.2, baseY, baseZ, files[0]);
    await placeAvatarInStoreCase(rightX,     baseY, baseZ, files[1]);
    await placeAvatarInStoreCase(rightX+2.2, baseY, baseZ, files[2]);
  }

  // -------------------------
  // Guard + Patrol (your ninja + combat)
  // -------------------------
  {
    // Guard at entrance platform
    try {
      const guard = await loadAvatar("ninja.glb", 1.9);
      guard.position.copy(entryPlatform.position);
      guard.position.y = 0;
      guard.position.x += 1.35;
      guard.position.z += 0.65;
      guard.rotation.y = entryAngle + Math.PI/2;
      scene.add(guard);

      const gl = new THREE.PointLight(0x8a2be2, 0.65, 24);
      gl.position.set(guard.position.x, 2.8, guard.position.z);
      scene.add(gl);
    } catch(e){}

    // Patrol around pit
    let patrol = null;
    try {
      patrol = await loadAvatar("combat_ninja_inspired_by_jin_roh_wolf_brigade.glb", 1.95);
      patrol.position.set(pitR + 6.4, 0, 0);
      scene.add(patrol);
    } catch(e){}

    if (patrol){
      let t = 0;
      updates.push((dt)=>{
        t += dt;
        const a = t * 0.33;
        const r = pitR + 6.4;
        patrol.position.x = Math.cos(a)*r;
        patrol.position.z = Math.sin(a)*r;
        patrol.rotation.y = -a + Math.PI/2;
      });
    }
  }

  // -------------------------
  // Teleport pads (no random pink pad in pit)
  // -------------------------
  function makePad(color, x, z){
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.20, 36),
      neonMat(color, color, 1.2)
    );
    pad.position.set(x, 0.12, z);
    scene.add(pad);
    teleportSurfaces.push(pad);
    ctx.walkSurfaces.push(pad);

    const beam = new THREE.PointLight(color, 0.5, 44);
    beam.position.set(x, 3.0, z);
    scene.add(beam);
  }

  makePad(0x00a6ff, 0, -18); // lobby pad (opposite store side)
  makePad(0xff00aa, entryDir.x*(innerFloorR+2.2), entryDir.z*(innerFloorR+2.2)); // pit entrance pad

  // -------------------------
  // SPAWN facing PIT (not store)
  // -------------------------
  rig.position.set(0, 1.8, -26);     // on the opposite side so store is behind you
  rig.rotation.set(0,0,0);
  rig.lookAt(0, 1.6, 0);             // pit at center

  log("✅ Controllers fixed (in input.js). Gravity snap enabled. Store glass cases + real avatars. Balcony added.");
      }
