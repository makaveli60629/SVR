export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, walkSurfaces, updates, log } = ctx;
  const say=(m)=>{ try{log(m);}catch(e){} console.log(m); };

  // -------------------------
  // CONFIG
  // -------------------------
  const lobbyR = 56;
  const wallH  = 14;

  const pitR   = 11.0;
  const pitDepth = 4.2;
  const pitFloorY = -pitDepth + 0.06;

  const entryAngle = 0;           // +X
  const storeAngle = Math.PI/2;   // +Z

  ctx.walkSurfaces = ctx.walkSurfaces || [];
  const WS = ctx.walkSurfaces;

  // -------------------------
  // TEXTURE HELPERS
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

  const carpetTex = makeCanvasTex((g,c)=>{
    g.fillStyle="#2a1650"; g.fillRect(0,0,512,512);
    for (let i=0;i<20000;i++){
      const x=(Math.random()*512)|0, y=(Math.random()*512)|0;
      const v=16+(Math.random()*50)|0;
      g.fillStyle=`rgb(${v},${(v*0.45)|0},${(v*1.35)|0})`;
      g.fillRect(x,y,1,1);
    }
    g.globalAlpha=0.18; g.strokeStyle="#00c8ff"; g.lineWidth=2;
    for (let i=0;i<7;i++){ g.beginPath(); g.arc(256,256,90+i*28,0,Math.PI*2); g.stroke(); }
    g.globalAlpha=1;
  }, 8, 8);

  const wallTex = makeCanvasTex((g,c)=>{
    g.fillStyle="#0b0f1f"; g.fillRect(0,0,512,512);
    for (let y=0;y<512;y+=64){
      for (let x=0;x<512;x+=96){
        const col=18+((Math.random()*12)|0);
        g.fillStyle=`rgb(${col},${col+2},${col+12})`;
        g.fillRect(x+4,y+4,88,56);
        g.strokeStyle="rgba(0,200,255,0.12)"; g.lineWidth=2;
        g.strokeRect(x+4,y+4,88,56);
      }
    }
  }, 6, 2);

  // ✅ PIT WALL “BRICK/STONE” feel
  const pitWallTex = makeCanvasTex((g,c)=>{
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

  // ✅ PIT FLOOR carpet (darker)
  const pitFloorTex = makeCanvasTex((g,c)=>{
    g.fillStyle="#1b0d35"; g.fillRect(0,0,512,512);
    for (let i=0;i<22000;i++){
      const x=(Math.random()*512)|0, y=(Math.random()*512)|0;
      const v=10+(Math.random()*32)|0;
      g.fillStyle=`rgb(${v},${(v*0.35)|0},${(v*1.25)|0})`;
      g.fillRect(x,y,1,1);
    }
    g.globalAlpha=0.18; g.strokeStyle="#00c8ff"; g.lineWidth=2;
    for (let i=0;i<5;i++){ g.beginPath(); g.arc(256,256,80+i*38,0,Math.PI*2); g.stroke(); }
    g.globalAlpha=1;
  }, 5, 5);

  // -------------------------
  // MATERIALS
  // -------------------------
  const floorMat = new THREE.MeshStandardMaterial({ map:carpetTex, color:0xffffff, roughness:0.95, metalness:0.03, side:THREE.DoubleSide });
  const wallMat  = new THREE.MeshStandardMaterial({ map:wallTex,  color:0xffffff, roughness:0.70, metalness:0.22, side:THREE.DoubleSide });

  const pitWallMat = new THREE.MeshStandardMaterial({ map:pitWallTex, color:0xffffff, roughness:0.92, metalness:0.08, side:THREE.DoubleSide });
  const pitFloorMat= new THREE.MeshStandardMaterial({ map:pitFloorTex,color:0xffffff, roughness:0.98, metalness:0.02, side:THREE.DoubleSide });

  const metalDark = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.65, metalness:0.35 });
  const metalRail = new THREE.MeshStandardMaterial({ color:0x141426, roughness:0.55, metalness:0.60 });

  const neon = (c,e,inten=1.6)=> new THREE.MeshStandardMaterial({ color:c, emissive:e, emissiveIntensity:inten, roughness:0.4, metalness:0.25 });
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
  dir.position.set(14, 20, 12);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 2.0, 520);
  top.position.set(0, 20, 0);
  scene.add(top);

  // -------------------------
  // SKY + CEILING RINGS
  // -------------------------
  {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(350, 32, 20),
      new THREE.MeshBasicMaterial({ color:0x04040a, side:THREE.BackSide })
    );
    scene.add(sky);

    const ceilY = 15.0;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(lobbyR-2, 140),
      new THREE.MeshStandardMaterial({ color:0x11184a, emissive:0x1a2a66, emissiveIntensity:0.85, roughness:0.6, metalness:0.12, side:THREE.DoubleSide })
    );
    disc.rotation.x = Math.PI/2;
    disc.position.y = ceilY;
    scene.add(disc);

    for (let k=0;k<3;k++){
      const r = lobbyR - 12 - k*9;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.12, 10, 140),
        neon(0x00d5ff, 0x00b7ff, 2.0-k*0.35)
      );
      ring.rotation.x = Math.PI/2;
      ring.position.y = ceilY - 0.7;
      scene.add(ring);
    }
  }

  // -------------------------
  // FLOOR + TELEPORT PLANE
  // -------------------------
  const innerFloorR = pitR + 0.30;

  {
    const floor = new THREE.Mesh(new THREE.RingGeometry(innerFloorR, lobbyR, 180, 1), floorMat);
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    const tp = new THREE.Mesh(new THREE.CircleGeometry(lobbyR-2, 140), new THREE.MeshBasicMaterial({ transparent:true, opacity:0, side:THREE.DoubleSide }));
    tp.rotation.x = -Math.PI/2;
    tp.position.y = 0.02;
    scene.add(tp);
    teleportSurfaces.push(tp);
    WS.push(tp);

    // Visible center marker (for orientation)
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.46, 48), new THREE.MeshBasicMaterial({ color:0x00ffff, transparent:true, opacity:0.95, side:THREE.DoubleSide }));
    marker.rotation.x = -Math.PI/2;
    marker.position.y = 0.06;
    scene.add(marker);
  }

  // -------------------------
  // WALLS + NEON BAND
  // -------------------------
  {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 180, 1, true), wallMat);
    wall.position.y = wallH/2;
    scene.add(wall);

    const band = new THREE.Mesh(new THREE.TorusGeometry(lobbyR-0.45, 0.12, 10, 180), neonBasic(0x00a6ff));
    band.rotation.x = Math.PI/2;
    band.position.y = 2.65;
    scene.add(band);
  }

  // -------------------------
  // PIT (textured) + depth neon rings
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

    const lip = new THREE.Mesh(new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 180), neonBasic(0x00ffff));
    lip.rotation.x = Math.PI/2;
    lip.position.y = 1.05;
    scene.add(lip);

    const mid = new THREE.Mesh(new THREE.TorusGeometry(pitR-0.18, 0.08, 10, 180), neonBasic(0x00a6ff));
    mid.rotation.x = Math.PI/2;
    mid.position.y = pitFloorY + pitDepth*0.62;
    scene.add(mid);

    const bot = new THREE.Mesh(new THREE.TorusGeometry(pitR-0.35, 0.11, 10, 180), neonBasic(0xff00aa));
    bot.rotation.x = Math.PI/2;
    bot.position.y = pitFloorY + 0.22;
    scene.add(bot);

    const p1 = new THREE.PointLight(0x00c8ff, 1.0, 95);
    p1.position.set(0, pitFloorY + 2.3, 0);
    scene.add(p1);

    const p2 = new THREE.PointLight(0xff00aa, 0.7, 95);
    p2.position.set(3.2, pitFloorY + 2.6, -2.4);
    scene.add(p2);
  }

  // -------------------------
  // CLEAN PIT RAIL (no distortion) with opening at entrance
  // -------------------------
  {
    const railR = pitR + 1.55;
    const railY = 1.15;
    const opening = Math.PI/7;

    const postCount = 36;
    const postG = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 10);
    const topG  = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 10);

    let prev = null;
    for (let i=0;i<=postCount;i++){
      const a = (i/postCount)*Math.PI*2;
      const dist = Math.abs(((a-entryAngle+Math.PI)%(Math.PI*2))-Math.PI);
      if (dist < opening*0.60) { prev = null; continue; }

      const x = Math.cos(a)*railR;
      const z = Math.sin(a)*railR;

      const post = new THREE.Mesh(postG, metalRail);
      post.position.set(x, railY-0.47, z);
      scene.add(post);

      const railPoint = new THREE.Vector3(x, railY+0.05, z);
      if (prev){
        const mid = prev.clone().add(railPoint).multiplyScalar(0.5);
        const len = prev.distanceTo(railPoint);
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,len,10), neonBasic(0x00d5ff));
        seg.position.copy(mid);
        seg.lookAt(railPoint);
        seg.rotation.x += Math.PI/2;
        scene.add(seg);
      }
      prev = railPoint;
    }
  }

  // -------------------------
  // 6 QUICK STAIRS + TOP/BOTTOM PEDESTALS (walkable)
  // -------------------------
  {
    const opening = Math.PI/7;

    // Two pedestals
    const topPed = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 3.6), metalDark);
    const platR = (pitR + 0.3) + 0.95;
    topPed.position.set(Math.cos(entryAngle)*platR, 0.11, Math.sin(entryAngle)*platR);
    topPed.rotation.y = entryAngle;
    scene.add(topPed);
    teleportSurfaces.push(topPed);
    WS.push(topPed);

    const botPed = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 2.8), metalDark);
    botPed.position.set(Math.cos(entryAngle)*(pitR-0.9), pitFloorY + 0.58, Math.sin(entryAngle)*(pitR-0.9));
    botPed.rotation.y = entryAngle;
    scene.add(botPed);
    teleportSurfaces.push(botPed);
    WS.push(botPed);

    // 6 steps bridging between pedestals (curved along wall slightly)
    const stepCount = 6;
    const stepW = 2.0;
    const stepD = 0.95;

    const yTop = 0.70;
    const yBot = pitFloorY + 0.78;
    const stepH = (yTop - yBot) / stepCount;

    const r = pitR - 0.55;
    const aStart = entryAngle + opening*0.45;
    const aSpan  = Math.PI * 0.25; // short arc (fast stairs)

    const stepMat = new THREE.MeshStandardMaterial({
      color:0x121226, roughness:0.78, metalness:0.22,
      emissive:0x12003a, emissiveIntensity:0.2
    });

    // Handrail
    const poleG = new THREE.CylinderGeometry(0.06,0.06,0.95,10);
    const railMat = neonBasic(0x00ffff);

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

      // rail post outside
      const ox = Math.cos(a)*(r+0.95);
      const oz = Math.sin(a)*(r+0.95);

      const pole = new THREE.Mesh(poleG, metalRail);
      pole.position.set(ox, y+0.45, oz);
      scene.add(pole);

      const railPos = new THREE.Vector3(ox, y+0.92, oz);
      if (prevRailPos){
        const mid = prevRailPos.clone().add(railPos).multiplyScalar(0.5);
        const len = prevRailPos.distanceTo(railPos);
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,len,10), railMat);
        seg.position.copy(mid);
        seg.lookAt(railPos);
        seg.rotation.x += Math.PI/2;
        scene.add(seg);
      }
      prevRailPos = railPos;
    }
  }

  // -------------------------
  // STOREFRONT + SIGN + SPOTLIGHTS under balcony hood
  // -------------------------
  {
    const storeZ = lobbyR - 0.8;
    const storeY = 3.0;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(20.5, 8.8, 1.5),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.45, metalness:0.45 })
    );
    frame.position.set(0, storeY, storeZ - 0.55);
    scene.add(frame);

    // Hood/cover (so it doesn’t look like a black slab)
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(22.0, 1.2, 4.0),
      new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.55, metalness:0.35, emissive:0x0a0014, emissiveIntensity:0.18 })
    );
    hood.position.set(0, storeY+4.0, storeZ - 2.0);
    scene.add(hood);

    // Store sign on the face (cursive vibe via glow bar)
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(12.5, 1.3, 0.5),
      new THREE.MeshStandardMaterial({ color:0x101018, emissive:0xff00aa, emissiveIntensity:1.1, roughness:0.4, metalness:0.2 })
    );
    sign.position.set(0, storeY+4.15, storeZ + 0.05);
    scene.add(sign);

    // Windows
    const winL = new THREE.Mesh(new THREE.BoxGeometry(7.2, 5.6, 0.14), glassMat);
    winL.position.set(-6.4, storeY+0.1, storeZ + 0.25);
    scene.add(winL);
    const winR = winL.clone(); winR.position.x = 6.4; scene.add(winR);

    // Spotlights under hood
    for (let i=0;i<3;i++){
      const s = new THREE.SpotLight(0x00c8ff, 2.0, 30, Math.PI/6, 0.4, 1.0);
      s.position.set(-6 + i*6, storeY+4.0, storeZ - 2.8);
      s.target.position.set(-6 + i*6, storeY+1.0, storeZ + 0.5);
      scene.add(s);
      scene.add(s.target);
    }

    // Plants
    const plant = ()=> {
      const g = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.55,0.55,18), new THREE.MeshStandardMaterial({color:0x1a1a22, roughness:0.7, metalness:0.1}));
      pot.position.y=0.28; g.add(pot);
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.55,16,12), new THREE.MeshStandardMaterial({color:0x114422, roughness:0.9, metalness:0.02}));
      bush.position.y=0.95; g.add(bush);
      return g;
    };
    const p1 = plant(); p1.position.set(-9.0, 0, lobbyR-10.2); scene.add(p1);
    const p2 = plant(); p2.position.set( 9.0, 0, lobbyR-10.2); scene.add(p2);

    // Store pad near doorway
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.22, 40),
      neonBasic(0x00ffcc)
    );
    pad.position.set(0, 0.12, lobbyR - 9.5);
    scene.add(pad);
    teleportSurfaces.push(pad);
    WS.push(pad);
  }

  // -------------------------
  // BALCONY above store only (with rail)
  // -------------------------
  {
    const y = 7.8;
    const z = lobbyR - 5.2;

    const balcony = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.35, 10.0),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.55, metalness:0.35, emissive:0x0a0014, emissiveIntensity:0.22 })
    );
    balcony.position.set(0, y, z);
    scene.add(balcony);
    teleportSurfaces.push(balcony);
    WS.push(balcony);

    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08,0.08,22,10),
      neonBasic(0x00ffff)
    );
    rail.rotation.z = Math.PI/2;
    rail.position.set(0, y+1.15, z-4.7);
    scene.add(rail);
  }

  // -------------------------
  // ENTRANCES (POKER / VIP / STORE) as door frames + neon labels
  // -------------------------
  function addDoor(angle, label, color){
    const r = lobbyR - 0.9;
    const x = Math.cos(angle)*r;
    const z = Math.sin(angle)*r;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 7.2, 0.55),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.5, metalness:0.35 })
    );
    frame.position.set(x, 3.6, z);
    frame.rotation.y = -angle + Math.PI/2;
    scene.add(frame);

    const inner = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 6.2, 0.25),
      neon(color, color, 0.65)
    );
    inner.position.set(0,0,0.18);
    frame.add(inner);

    // “cursive” look: curved neon bar + a label block (placeholder for real text later)
    const bar = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.08, 10, 64, Math.PI),
      neonBasic(color)
    );
    bar.rotation.x = Math.PI/2;
    bar.rotation.z = Math.PI;
    bar.position.set(0, 4.2, 0.35);
    frame.add(bar);

    const tag = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.8, 0.2),
      neon(color, color, 1.0)
    );
    tag.position.set(0, 5.3, 0.35);
    frame.add(tag);

    // Teleportable pad in front of door
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(1.7, 40),
      neonBasic(color)
    );
    pad.rotation.x = -Math.PI/2;
    pad.position.set(x - Math.cos(angle)*3.2, 0.03, z - Math.sin(angle)*3.2);
    scene.add(pad);
    teleportSurfaces.push(pad);
    WS.push(pad);
  }

  addDoor(storeAngle, "STORE", 0x00ffcc);
  addDoor(-Math.PI/2, "POKER", 0x00c8ff);
  addDoor(Math.PI, "VIP", 0xff00aa);

  // -------------------------
  // SPAWN (facing pit)
  // -------------------------
  rig.position.set(0, 1.85, -34);
  rig.rotation.set(0,0,0);
  rig.lookAt(0, 1.55, 0);

  say("✅ Updated: teleport reticle visible, pit textured, 6-step stairs w/ pedestals, clean rails, store sign + spotlights, door entrances + neon signs.");
}
