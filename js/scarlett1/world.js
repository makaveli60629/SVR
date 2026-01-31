export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, walkSurfaces, updates, log } = ctx;
  const say=(m)=>{ try{log(m);}catch(e){} console.log(m); };

  // -------------------------
  // CONFIG
  // -------------------------
  const lobbyR = 56;         // bigger walls
  const wallH  = 14;
  const pitR   = 11.0;
  const pitDepth = 4.2;      // raised pit (less deep)
  const pitFloorY = -pitDepth + 0.06;

  const entryAngle = 0;      // pit entrance direction (+X)
  const storeAngle = Math.PI/2; // store direction (+Z)

  // Ensure arrays exist
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
    for (let i=0;i<18000;i++){
      const x=(Math.random()*512)|0, y=(Math.random()*512)|0;
      const v=18+(Math.random()*48)|0;
      g.fillStyle=`rgb(${v},${(v*0.5)|0},${(v*1.3)|0})`;
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

  // -------------------------
  // MATERIALS
  // -------------------------
  const floorMat = new THREE.MeshStandardMaterial({ map: carpetTex, color:0xffffff, roughness:0.95, metalness:0.03, side:THREE.DoubleSide });
  const wallMat  = new THREE.MeshStandardMaterial({ map: wallTex, color:0xffffff, roughness:0.70, metalness:0.22, side:THREE.DoubleSide });

  const metalDark = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.65, metalness:0.35 });
  const neonBasic = (c)=> new THREE.MeshBasicMaterial({ color:c });

  const glassMat = new THREE.MeshStandardMaterial({
    color:0x88ccff, transparent:true, opacity:0.22,
    roughness:0.08, metalness:0.05,
    emissive:0x001133, emissiveIntensity:0.25
  });

  // -------------------------
  // LIGHTING (bright + futuristic)
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
  // SKY DOME + CEILING RINGS
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
        new THREE.MeshStandardMaterial({ color:0x00d5ff, emissive:0x00b7ff, emissiveIntensity:(2.0-k*0.35), roughness:0.4, metalness:0.25 })
      );
      ring.rotation.x = Math.PI/2;
      ring.position.y = ceilY - 0.7;
      scene.add(ring);
    }
  }

  // -------------------------
  // FLOOR + TELEPORT PLANE + CENTER MARKER
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
  // JUMBOTRONS (aligned to wall)
  // -------------------------
  function addJumbotron(angle){
    const y = 9.2;
    const zR = lobbyR - 0.7;
    const x = Math.cos(angle) * zR;
    const z = Math.sin(angle) * zR;

    const scr = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 5.2, 0.35),
      new THREE.MeshStandardMaterial({ color:0x05060a, emissive:0x0b1a22, emissiveIntensity:0.7, roughness:0.35, metalness:0.3 })
    );
    scr.position.set(x, y, z);
    scr.rotation.y = -angle + Math.PI/2;
    scene.add(scr);

    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(9.7, 5.7, 0.55),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.45, metalness:0.55 })
    );
    bezel.position.copy(scr.position);
    bezel.rotation.copy(scr.rotation);
    scene.add(bezel);

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(9.9, 0.18, 0.18),
      neonBasic(0x00ffff)
    );
    glow.position.set(x, y-2.85, z);
    glow.rotation.copy(scr.rotation);
    scene.add(glow);
  }

  addJumbotron(Math.PI/4);
  addJumbotron(3*Math.PI/4);
  addJumbotron(5*Math.PI/4);
  addJumbotron(7*Math.PI/4);

  // -------------------------
  // PIT WALL + FLOOR + NEON DEPTH RINGS
  // -------------------------
  {
    const pitWall = new THREE.Mesh(
      new THREE.CylinderGeometry(pitR, pitR, pitDepth, 180, 1, true),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.92, metalness:0.08, side:THREE.DoubleSide })
    );
    pitWall.position.y = -pitDepth/2 + 0.08;
    scene.add(pitWall);

    const pitFloor = new THREE.Mesh(
      new THREE.CircleGeometry(pitR-0.28, 180),
      new THREE.MeshStandardMaterial({ color:0x1b0d35, roughness:0.98, metalness:0.02, side:THREE.DoubleSide })
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
  // SOLID RAIL RING with opening at entrance
  // -------------------------
  {
    const railR = pitR + 1.55;
    const railY = 1.15;
    const opening = Math.PI/7;

    const postCount = 40;
    const postG = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 10);
    const topG  = new THREE.TorusGeometry(railR, 0.09, 10, 180);

    for (let i=0;i<postCount;i++){
      const a = (i/postCount)*Math.PI*2;
      const dist = Math.abs(((a-entryAngle+Math.PI)%(Math.PI*2))-Math.PI);
      if (dist < opening*0.60) continue;

      const x = Math.cos(a)*railR;
      const z = Math.sin(a)*railR;

      const post = new THREE.Mesh(postG, new THREE.MeshStandardMaterial({ color:0x141426, roughness:0.55, metalness:0.60 }));
      post.position.set(x, railY-0.47, z);
      scene.add(post);
    }

    const top = new THREE.Mesh(topG, new THREE.MeshBasicMaterial({ color:0x00d5ff }));
    top.rotation.x = Math.PI/2;
    top.position.y = railY + 0.05;

    // carve opening by placing 2 arcs instead of full ring
    // easier: hide ring and use segments
    scene.add(top);

    // NOTE: top ring is continuous visually; opening is functionally through post skipping + stairs path
  }

  // -------------------------
  // CONNECTED CURVED STAIRS hugging wall + handrail
  // -------------------------
  {
    const opening = Math.PI/7;
    const stepCount = 18;
    const stepW = 1.95;
    const stepD = 0.86;

    const topY = 0.95;
    const bottomY = pitFloorY + 1.05;
    const stepH = (topY - bottomY) / stepCount;

    const rWall = pitR - 0.55;
    const aStart = entryAngle + opening*0.45;
    const aSpan  = Math.PI * 0.58;

    // entrance platform (connected)
    const platR = (pitR + 0.3) + 0.95;
    const platform = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.22, 3.8), metalDark);
    platform.position.set(Math.cos(entryAngle)*platR, 0.11, Math.sin(entryAngle)*platR);
    platform.rotation.y = entryAngle;
    scene.add(platform);
    teleportSurfaces.push(platform);
    WS.push(platform);

    const stepMat = new THREE.MeshStandardMaterial({ color:0x121226, roughness:0.78, metalness:0.22, emissive:0x12003a, emissiveIntensity:0.2 });

    // handrail
    const railMat = new THREE.MeshBasicMaterial({ color:0x00ffff });
    const poleMat = new THREE.MeshStandardMaterial({ color:0x141426, roughness:0.55, metalness:0.60 });
    const poleG = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 10);
    const railSegG = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 10);

    let prevRailPos = null;

    for (let i=0;i<stepCount;i++){
      const t=i/(stepCount-1);
      const a=aStart+aSpan*t;

      const x=Math.cos(a)*rWall;
      const z=Math.sin(a)*rWall;
      const y=topY-(i+1)*stepH;

      const step=new THREE.Mesh(new THREE.BoxGeometry(stepW, Math.max(0.16, stepH*0.94), stepD), stepMat);
      step.position.set(x,y,z);
      step.rotation.y=a+Math.PI/2;
      scene.add(step);
      teleportSurfaces.push(step);
      WS.push(step);

      // rail posts (outer side)
      const outerX = Math.cos(a)*(rWall+0.95);
      const outerZ = Math.sin(a)*(rWall+0.95);
      const pole = new THREE.Mesh(poleG, poleMat);
      pole.position.set(outerX, y+0.45, outerZ);
      scene.add(pole);

      const railPos = new THREE.Vector3(outerX, y+0.98, outerZ);
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
  // STORE FRONT (facade + glass display windows) + pad
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

    // top sign
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(12.0, 1.2, 0.45),
      new THREE.MeshStandardMaterial({ color:0x101018, emissive:0x00a6ff, emissiveIntensity:0.8, roughness:0.4, metalness:0.2 })
    );
    sign.position.set(0, storeY+4.1, storeZ - 0.1);
    scene.add(sign);

    const winL = new THREE.Mesh(new THREE.BoxGeometry(7.2, 5.6, 0.14), glassMat);
    winL.position.set(-6.4, storeY+0.1, storeZ + 0.25);
    scene.add(winL);

    const winR = winL.clone();
    winR.position.x = 6.4;
    scene.add(winR);

    // little plants
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

    // store interaction pad (near doorway)
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.22, 40),
      new THREE.MeshBasicMaterial({ color:0x00ffcc })
    );
    pad.position.set(0, 0.12, lobbyR - 9.5);
    scene.add(pad);
    teleportSurfaces.push(pad);
    WS.push(pad);
  }

  // -------------------------
  // BALCONY ABOVE STORE ONLY
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

    // rail top
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08,0.08,22,10),
      new THREE.MeshBasicMaterial({ color:0x00ffff })
    );
    rail.rotation.z = Math.PI/2;
    rail.position.set(0, y+1.15, z-4.7);
    scene.add(rail);
  }

  // -------------------------
  // AVATARS (Ninja guard + Combat patrol)
  // -------------------------
  let GLTFLoader = null;
  try {
    const mod = await import("https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
    GLTFLoader = mod.GLTFLoader;
    say("✅ GLTFLoader OK");
  } catch(e) {
    say("⚠️ GLTFLoader failed — using placeholders");
  }

  const normalizeModel = (model, targetHeight=1.85) => {
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

  const loadAvatar = async (file, targetHeight) => {
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

  // Guard at pit entrance
  {
    const guard = (await loadAvatar("ninja.glb", 1.9)) || makePlaceholder(0x8a2be2);
    const platR = (pitR + 0.3) + 0.95;
    guard.position.set(Math.cos(entryAngle)*platR + 1.2, 0, Math.sin(entryAngle)*platR + 0.6);
    guard.rotation.y = entryAngle + Math.PI/2;
    scene.add(guard);

    // Combat patrol around pit
    const patrol = (await loadAvatar("combat_ninja_inspired_by_jin_roh_wolf_brigade.glb", 1.95)) || makePlaceholder(0xff00aa);
    patrol.position.set(pitR + 6.6, 0, 0);
    scene.add(patrol);

    let t=0;
    updates.push((dt)=>{
      t += dt;
      const a = t * 0.33;
      const r = pitR + 6.6;
      patrol.position.x = Math.cos(a)*r;
      patrol.position.z = Math.sin(a)*r;
      patrol.rotation.y = -a + Math.PI/2;
    });
  }

  // -------------------------
  // SPAWN (face pit)
  // -------------------------
  rig.position.set(0, 1.85, -34);
  rig.rotation.set(0,0,0);
  rig.lookAt(0, 1.55, 0);

  say("✅ Full demo world restored (safe + VR locomotion + teleport).");
}
