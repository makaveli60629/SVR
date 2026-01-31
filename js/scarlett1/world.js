export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, walkSurfaces, updates, log } = ctx;
  const say=(m)=>{ try{log(m);}catch(e){} console.log(m); };

  // Bigger room
  const lobbyR = 70;
  const wallH  = 16;

  // Pit
  const pitR = 11.0;
  const pitDepth = 4.2;
  const pitFloorY = -pitDepth + 0.06;

  const entryAngle = 0;          // +X
  const storeAngle = Math.PI/2;  // +Z

  ctx.walkSurfaces = ctx.walkSurfaces || [];
  const WS = ctx.walkSurfaces;

  // ✅ Spawn preset (Spine re-applies this when VR session starts)
  ctx.spawnPos.set(0, 1.75, -42);
  ctx.spawnLook.set(0, 1.55, 0);

  // -------------------------
  // TEXTURES (procedural)
  // -------------------------
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

  const carpetTex = makeCanvasTex((g)=>{
    g.fillStyle="#2a1650"; g.fillRect(0,0,512,512);
    for (let i=0;i<22000;i++){
      const x=(Math.random()*512)|0, y=(Math.random()*512)|0;
      const v=16+(Math.random()*52)|0;
      g.fillStyle=`rgb(${v},${(v*0.45)|0},${(v*1.35)|0})`;
      g.fillRect(x,y,1,1);
    }
    g.globalAlpha=0.18; g.strokeStyle="#00c8ff"; g.lineWidth=2;
    for (let i=0;i<7;i++){ g.beginPath(); g.arc(256,256,90+i*28,0,Math.PI*2); g.stroke(); }
    g.globalAlpha=1;
  }, 9, 9);

  const wallTex = makeCanvasTex((g)=>{
    g.fillStyle="#0b0f1f"; g.fillRect(0,0,512,512);
    for (let y=0;y<512;y+=64){
      for (let x=0;x<512;x+=96){
        const col=18+((Math.random()*12)|0);
        g.fillStyle=`rgb(${col},${col+2},${col+12})`;
        g.fillRect(x+4,y+4,88,56);
        g.strokeStyle="rgba(0,200,255,0.12)";
        g.lineWidth=2;
        g.strokeRect(x+4,y+4,88,56);
      }
    }
  }, 7, 2);

  const pitWallTex = makeCanvasTex((g)=>{
    g.fillStyle="#0a0a12"; g.fillRect(0,0,512,512);
    const bw=92, bh=54;
    for (let y=0;y<512;y+=bh){
      for (let x=0;x<512;x+=bw){
        const off=((y/bh)|0)%2 ? bw/2 : 0;
        const rx=x+off;
        const col=14+((Math.random()*18)|0);
        g.fillStyle=`rgb(${col},${col},${col+10})`;
        g.fillRect(rx, y, bw-6, bh-6);
        g.strokeStyle="rgba(0,200,255,0.08)";
        g.strokeRect(rx, y, bw-6, bh-6);
      }
    }
  }, 7, 2);

  const pitFloorTex = makeCanvasTex((g)=>{
    g.fillStyle="#1b0d35"; g.fillRect(0,0,512,512);
    for (let i=0;i<24000;i++){
      const x=(Math.random()*512)|0, y=(Math.random()*512)|0;
      const v=10+(Math.random()*34)|0;
      g.fillStyle=`rgb(${v},${(v*0.35)|0},${(v*1.25)|0})`;
      g.fillRect(x,y,1,1);
    }
    g.globalAlpha=0.18; g.strokeStyle="#00c8ff"; g.lineWidth=2;
    for (let i=0;i<5;i++){ g.beginPath(); g.arc(256,256,80+i*38,0,Math.PI*2); g.stroke(); }
    g.globalAlpha=1;
  }, 5, 5);

  // Neon “text” signs using canvas so you don’t just see a square
  function neonTextMesh(text, glowColor=0x00c8ff, w=1024, h=256){
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");

    g.fillStyle = "rgba(0,0,0,0)";
    g.fillRect(0,0,w,h);

    g.textAlign = "center";
    g.textBaseline = "middle";

    // glow
    g.font = "110px cursive";
    g.shadowColor = "#00ffff";
    g.shadowBlur = 28;
    g.fillStyle = "#ffffff";
    g.fillText(text, w/2, h/2);

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 6;

    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent:true });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.7), mat);
    return plane;
  }

  // -------------------------
  // MATERIALS
  // -------------------------
  const floorMat = new THREE.MeshStandardMaterial({ map:carpetTex, roughness:0.95, metalness:0.03, side:THREE.DoubleSide });
  const wallMat  = new THREE.MeshStandardMaterial({ map:wallTex,  roughness:0.72, metalness:0.22, side:THREE.DoubleSide });

  const pitWallMat = new THREE.MeshStandardMaterial({ map:pitWallTex, roughness:0.92, metalness:0.08, side:THREE.DoubleSide });
  const pitFloorMat= new THREE.MeshStandardMaterial({ map:pitFloorTex, roughness:0.98, metalness:0.02, side:THREE.DoubleSide });

  const metalDark = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.65, metalness:0.35 });
  const metalRail = new THREE.MeshStandardMaterial({ color:0x141426, roughness:0.55, metalness:0.60 });

  const neonBasic = (c)=> new THREE.MeshBasicMaterial({ color:c });

  const glassMat = new THREE.MeshStandardMaterial({
    color:0x88ccff, transparent:true, opacity:0.22,
    roughness:0.08, metalness:0.05,
    emissive:0x001133, emissiveIntensity:0.25
  });

  // -------------------------
  // LIGHTING
  // -------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const hemi = new THREE.HemisphereLight(0xffffff, 0x303070, 1.55);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(14, 22, 12);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 2.2, 650);
  top.position.set(0, 22, 0);
  scene.add(top);

  // -------------------------
  // SKY + CEILING RINGS
  // -------------------------
  {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(420, 32, 20),
      new THREE.MeshBasicMaterial({ color:0x04040a, side:THREE.BackSide })
    );
    scene.add(sky);

    const ceilY = 17.0;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(lobbyR-2, 160),
      new THREE.MeshStandardMaterial({ color:0x11184a, emissive:0x1a2a66, emissiveIntensity:0.85, roughness:0.6, metalness:0.12, side:THREE.DoubleSide })
    );
    disc.rotation.x = Math.PI/2;
    disc.position.y = ceilY;
    scene.add(disc);

    for (let k=0;k<3;k++){
      const r = lobbyR - 14 - k*10;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.12, 10, 180),
        new THREE.MeshStandardMaterial({ color:0x00d5ff, emissive:0x00b7ff, emissiveIntensity:(2.0-k*0.35), roughness:0.4, metalness:0.25 })
      );
      ring.rotation.x = Math.PI/2;
      ring.position.y = ceilY - 0.8;
      scene.add(ring);
    }
  }

  // -------------------------
  // FLOOR + TELEPORT PLANE
  // -------------------------
  const innerFloorR = pitR + 0.30;
  {
    const floor = new THREE.Mesh(new THREE.RingGeometry(innerFloorR, lobbyR, 200, 1), floorMat);
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    const tp = new THREE.Mesh(
      new THREE.CircleGeometry(lobbyR-2, 160),
      new THREE.MeshBasicMaterial({ transparent:true, opacity:0, side:THREE.DoubleSide })
    );
    tp.rotation.x = -Math.PI/2;
    tp.position.y = 0.02;
    scene.add(tp);
    teleportSurfaces.push(tp);
    WS.push(tp);

    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.46, 48),
      new THREE.MeshBasicMaterial({ color:0x00ffff, transparent:true, opacity:0.95, side:THREE.DoubleSide })
    );
    marker.rotation.x = -Math.PI/2;
    marker.position.y = 0.06;
    scene.add(marker);
  }

  // -------------------------
  // WALLS
  // -------------------------
  {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 200, 1, true), wallMat);
    wall.position.y = wallH/2;
    scene.add(wall);

    const band = new THREE.Mesh(new THREE.TorusGeometry(lobbyR-0.55, 0.12, 10, 200), neonBasic(0x00a6ff));
    band.rotation.x = Math.PI/2;
    band.position.y = 2.85;
    scene.add(band);
  }

  // -------------------------
  // PIT WALL + FLOOR
  // -------------------------
  {
    const pitWall = new THREE.Mesh(
      new THREE.CylinderGeometry(pitR, pitR, pitDepth, 180, 1, true),
      pitWallMat
    );
    pitWall.position.y = -pitDepth/2 + 0.08;
    scene.add(pitWall);

    const pitFloor = new THREE.Mesh(
      new THREE.CircleGeometry(pitR-0.28, 180),
      pitFloorMat
    );
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = pitFloorY;
    scene.add(pitFloor);
    teleportSurfaces.push(pitFloor);
    WS.push(pitFloor);

    // ✅ “Crayon tube” becomes a sleeve DOWN the pit edge (creases the circle)
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(pitR+0.22, pitR+0.22, pitDepth+1.2, 180, 1, true),
      new THREE.MeshStandardMaterial({
        color:0x0b1322,
        roughness:0.45,
        metalness:0.55,
        emissive:0x003355,
        emissiveIntensity:0.55,
        side:THREE.DoubleSide
      })
    );
    sleeve.position.y = -((pitDepth+1.2)/2) + 1.25;
    scene.add(sleeve);

    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(pitR+0.25, 0.14, 10, 180),
      neonBasic(0xff00aa) // new color
    );
    lip.rotation.x = Math.PI/2;
    lip.position.y = 1.05;
    scene.add(lip);

    const mid = new THREE.Mesh(
      new THREE.TorusGeometry(pitR-0.18, 0.08, 10, 180),
      neonBasic(0x00a6ff)
    );
    mid.rotation.x = Math.PI/2;
    mid.position.y = pitFloorY + pitDepth*0.62;
    scene.add(mid);

    const bot = new THREE.Mesh(
      new THREE.TorusGeometry(pitR-0.35, 0.11, 10, 180),
      neonBasic(0x00ffff)
    );
    bot.rotation.x = Math.PI/2;
    bot.position.y = pitFloorY + 0.22;
    scene.add(bot);

    const p1 = new THREE.PointLight(0x00c8ff, 1.0, 110);
    p1.position.set(0, pitFloorY + 2.4, 0);
    scene.add(p1);
  }

  // -------------------------
  // PIT RAIL (TRUE CIRCLE) posts + torus top rail
  // -------------------------
  {
    const railR = pitR + 1.55;
    const railY = 1.15;
    const opening = Math.PI/7;

    const postCount = 40;
    const postG = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 10);

    for (let i=0;i<postCount;i++){
      const a = (i/postCount)*Math.PI*2;
      const dist = Math.abs(((a-entryAngle+Math.PI)%(Math.PI*2))-Math.PI);
      if (dist < opening*0.60) continue;

      const x = Math.cos(a)*railR;
      const z = Math.sin(a)*railR;

      const post = new THREE.Mesh(postG, metalRail);
      post.position.set(x, railY-0.47, z);
      scene.add(post);
    }

    const topRail = new THREE.Mesh(
      new THREE.TorusGeometry(railR, 0.085, 10, 220),
      neonBasic(0x00d5ff)
    );
    topRail.rotation.x = Math.PI/2;
    topRail.position.y = railY + 0.05;
    scene.add(topRail);
  }

  // -------------------------
  // 8 STAIRS + TOP/BOTTOM PEDESTALS (tight)
  // -------------------------
  {
    const opening = Math.PI/7;

    const platR = (pitR + 0.3) + 0.95;
    const topPed = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.22, 3.8), metalDark);
    topPed.position.set(Math.cos(entryAngle)*platR, 0.11, Math.sin(entryAngle)*platR);
    topPed.rotation.y = entryAngle;
    scene.add(topPed);
    teleportSurfaces.push(topPed);
    WS.push(topPed);

    const botPed = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 3.0), metalDark);
    botPed.position.set(Math.cos(entryAngle)*(pitR-0.9), pitFloorY + 0.58, Math.sin(entryAngle)*(pitR-0.9));
    botPed.rotation.y = entryAngle;
    scene.add(botPed);
    teleportSurfaces.push(botPed);
    WS.push(botPed);

    const stepCount = 8;
    const stepW = 2.05;
    const stepD = 0.98;

    const yTop = 0.78;
    const yBot = pitFloorY + 0.80;
    const stepH = (yTop - yBot) / stepCount;

    const r = pitR - 0.55;
    const aStart = entryAngle + opening*0.45;
    const aSpan  = Math.PI * 0.28;

    const stepMat = new THREE.MeshStandardMaterial({
      color:0x121226, roughness:0.78, metalness:0.22,
      emissive:0x12003a, emissiveIntensity:0.22
    });

    // ✅ stair rail on correct side (toward open side / center)
    const railSideR = r - 0.95; // inward (not outside the pit wall!)
    const poleG = new THREE.CylinderGeometry(0.06,0.06,0.95,10);

    let prevRailPos = null;

    for (let i=0;i<stepCount;i++){
      const t = (i+1)/stepCount;
      const a = aStart + aSpan*t;

      const x = Math.cos(a)*r;
      const z = Math.sin(a)*r;
      const y = yTop - (i+1)*stepH;

      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.18, stepD), stepMat);
      step.position.set(x,y,z);
      step.rotation.y = a + Math.PI/2;
      scene.add(step);
      teleportSurfaces.push(step);
      WS.push(step);

      // posts + top rail segments
      const rx = Math.cos(a)*railSideR;
      const rz = Math.sin(a)*railSideR;

      const pole = new THREE.Mesh(poleG, metalRail);
      pole.position.set(rx, y+0.45, rz);
      scene.add(pole);

      const railPos = new THREE.Vector3(rx, y+0.92, rz);
      if (prevRailPos){
        const mid = prevRailPos.clone().add(railPos).multiplyScalar(0.5);
        const len = prevRailPos.distanceTo(railPos);
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,len,10), neonBasic(0x00ffff));
        seg.position.copy(mid);
        seg.lookAt(railPos);
        seg.rotation.x += Math.PI/2;
        scene.add(seg);
      }
      prevRailPos = railPos;
    }
  }

  // -------------------------
  // DOORS (4) + JUMBOTRONS above each
  // -------------------------
  function addDoor(angle, label, neonColor){
    const r = lobbyR - 1.0;
    const x = Math.cos(angle)*r;
    const z = Math.sin(angle)*r;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(7.0, 7.8, 0.7),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.45, metalness:0.45 })
    );
    frame.position.set(x, 3.9, z);
    frame.rotation.y = -angle + Math.PI/2;
    scene.add(frame);

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 6.8, 0.25),
      new THREE.MeshStandardMaterial({ color:0x05060a, emissive:neonColor, emissiveIntensity:0.55, roughness:0.4, metalness:0.2 })
    );
    glow.position.set(0,0,0.22);
    frame.add(glow);

    // neon text sign
    const sign = neonTextMesh(label);
    sign.position.set(0, 5.5, 0.45);
    frame.add(sign);

    // jumbotron aligned to wall above door
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 5.6, 0.40),
      new THREE.MeshStandardMaterial({ color:0x05060a, emissive:0x0b1a22, emissiveIntensity:0.7, roughness:0.35, metalness:0.3 })
    );
    screen.position.set(x, 11.4, z);
    screen.rotation.y = -angle + Math.PI/2;
    scene.add(screen);

    // teleport pad in front
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 48),
      neonBasic(neonColor)
    );
    pad.rotation.x = -Math.PI/2;
    pad.position.set(x - Math.cos(angle)*3.6, 0.03, z - Math.sin(angle)*3.6);
    scene.add(pad);
    teleportSurfaces.push(pad);
    WS.push(pad);
  }

  addDoor(storeAngle, "STORE", 0x00ffcc);
  addDoor(-Math.PI/2, "POKER", 0x00c8ff);
  addDoor(Math.PI, "VIP", 0xff00aa);
  addDoor(0, "LOUNGE", 0x8a2be2);

  // -------------------------
  // STOREFRONT + BALCONY + RAIL AROUND BALCONY
  // -------------------------
  {
    const storeZ = lobbyR - 1.0;
    const storeY = 3.1;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(22.0, 9.2, 1.7),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.45, metalness:0.45 })
    );
    frame.position.set(0, storeY, storeZ - 0.65);
    scene.add(frame);

    // hood / cover
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(24.0, 1.3, 4.6),
      new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.55, metalness:0.35, emissive:0x0a0014, emissiveIntensity:0.22 })
    );
    hood.position.set(0, storeY+4.2, storeZ - 2.2);
    scene.add(hood);

    // store sign (bright)
    const sign = neonTextMesh("Scarlett Store");
    sign.position.set(0, storeY+4.3, storeZ + 0.30);
    scene.add(sign);

    // windows
    const winL = new THREE.Mesh(new THREE.BoxGeometry(7.8, 6.0, 0.14), glassMat);
    winL.position.set(-7.0, storeY+0.2, storeZ + 0.35);
    scene.add(winL);
    const winR = winL.clone(); winR.position.x = 7.0; scene.add(winR);

    // brighter interior edge lighting
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(22.0, 0.16, 0.18),
      neonBasic(0x00ffff)
    );
    edge.position.set(0, storeY-0.2, storeZ + 0.58);
    scene.add(edge);

    // spotlights under hood
    for (let i=0;i<4;i++){
      const s = new THREE.SpotLight(0x00c8ff, 2.2, 34, Math.PI/6, 0.4, 1.0);
      s.position.set(-8.5 + i*5.7, storeY+4.2, storeZ - 3.1);
      s.target.position.set(-8.5 + i*5.7, storeY+1.2, storeZ + 0.8);
      scene.add(s);
      scene.add(s.target);
    }

    // balcony platform
    const by = 8.2;
    const bz = lobbyR - 6.4;
    const balcony = new THREE.Mesh(
      new THREE.BoxGeometry(24.0, 0.38, 10.5),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.55, metalness:0.35, emissive:0x0a0014, emissiveIntensity:0.24 })
    );
    balcony.position.set(0, by, bz);
    scene.add(balcony);
    teleportSurfaces.push(balcony);
    WS.push(balcony);

    // balcony rail: full rectangle
    const postG = new THREE.CylinderGeometry(0.06,0.06,1.05,10);
    const railMat = neonBasic(0x00ffff);

    const corners = [
      new THREE.Vector3(-11.5, by+0.15, bz-4.8),
      new THREE.Vector3( 11.5, by+0.15, bz-4.8),
      new THREE.Vector3( 11.5, by+0.15, bz+4.8),
      new THREE.Vector3(-11.5, by+0.15, bz+4.8),
    ];

    for (let i=0;i<4;i++){
      const a = corners[i];
      const b = corners[(i+1)%4];

      // posts along edge
      const steps = 7;
      for (let k=0;k<=steps;k++){
        const t = k/steps;
        const p = a.clone().lerp(b,t);
        const post = new THREE.Mesh(postG, metalRail);
        post.position.set(p.x, by+0.65, p.z);
        scene.add(post);
      }

      // top rail segment
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,len,10), railMat);
      seg.position.set(mid.x, by+1.18, mid.z);
      seg.lookAt(b);
      seg.rotation.x += Math.PI/2;
      scene.add(seg);
    }

    // store pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.22, 40),
      neonBasic(0x00ffcc)
    );
    pad.position.set(0, 0.12, lobbyR - 12.5);
    scene.add(pad);
    teleportSurfaces.push(pad);
    WS.push(pad);
  }

  // -------------------------
  // PILLARS protruding from walls
  // -------------------------
  {
    const pillarG = new THREE.CylinderGeometry(0.9, 1.05, wallH, 18);
    for (let i=0;i<10;i++){
      const a = (i/10)*Math.PI*2;
      const x = Math.cos(a)*(lobbyR-1.1);
      const z = Math.sin(a)*(lobbyR-1.1);
      const p = new THREE.Mesh(pillarG, new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.55, metalness:0.35, emissive:0x001133, emissiveIntensity:0.25 }));
      p.position.set(x, wallH/2, z);
      scene.add(p);

      const band = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.10, 10, 60), neonBasic(0x00a6ff));
      band.rotation.x = Math.PI/2;
      band.position.set(x, 3.2, z);
      scene.add(band);
    }
  }

  // -------------------------
  // AVATARS (fix GLTFLoader CDN)
  // -------------------------
  let GLTFLoader = null;
  try {
    const mod = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
    GLTFLoader = mod.GLTFLoader;
    say("✅ GLTFLoader OK (jsdelivr)");
  } catch(e) {
    say("⚠️ GLTFLoader failed — using placeholders");
  }

  const normalizeModel = (model, targetHeight=1.9) => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = Math.max(0.01, size.y);
    const s = targetHeight / h;
    model.scale.setScalar(s);

    const box2 = new THREE.Box3().setFromObject(model);
    const min = new THREE.Vector3();
    box2.getMin(min);
    model.position.y -= min.y;
  };

  const makePlaceholder = (color=0x00ffcc) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.85, 6, 12),
      new THREE.MeshStandardMaterial({ color:0x0b0b12, roughness:0.6, metalness:0.2, emissive:color, emissiveIntensity:0.35 })
    );
    body.position.y = 1.0;
    g.add(body);
    return g;
  };

  const loadAvatar = async (file, targetHeight=1.95) => {
    if (!GLTFLoader) return null;
    const loader = new GLTFLoader();
    return await new Promise((resolve) => {
      loader.load(
        `assets/avatars/${file}`,
        (gltf)=>{
          const model = gltf.scene;
          normalizeModel(model, targetHeight);
          resolve(model);
        },
        undefined,
        ()=>resolve(null)
      );
    });
  };

  // Guard + patrol (placeholders if loader still fails)
  {
    const guard = (await loadAvatar("ninja.glb", 1.9)) || makePlaceholder(0x8a2be2);
    const platR = (pitR + 0.3) + 0.95;
    guard.position.set(Math.cos(entryAngle)*platR + 1.2, 0, Math.sin(entryAngle)*platR + 0.6);
    guard.rotation.y = entryAngle + Math.PI/2;
    scene.add(guard);

    const patrol = (await loadAvatar("combat_ninja_inspired_by_jin_roh_wolf_brigade.glb", 1.95)) || makePlaceholder(0xff00aa);
    patrol.position.set(pitR + 7.0, 0, 0);
    scene.add(patrol);

    let t=0;
    updates.push((dt)=>{
      t += dt;
      const a = t * 0.33;
      const r = pitR + 7.0;
      patrol.position.x = Math.cos(a)*r;
      patrol.position.z = Math.sin(a)*r;
      patrol.rotation.y = -a + Math.PI/2;
    });
  }

  // Apply spawn immediately (Spine also re-applies on Enter VR)
  rig.position.copy(ctx.spawnPos);
  rig.lookAt(ctx.spawnLook);

  say("✅ World rebuilt: spawn fixed, feet circle fixed, pit sleeve added, true circular rails, 8-step stairs tight, bigger walls, doors + jumbotrons, store brighter, GLTFLoader updated.");
        }
