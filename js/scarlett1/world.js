/**
 * SCARLETT1 world.js — SAFE BOOT VERSION
 * - No top-level imports (prevents black screen)
 * - GLTFLoader is optional; world still loads without it
 * - Bigger walls, pit, connected spiral stairs, balcony above store, store glass cases
 */
export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, updates, log } = ctx;

  // --------- SAFE LOG ----------
  const say = (m)=>{ try{ log?.(m); }catch(e){} console.log(m); };

  // -------------------------
  // DIMENSIONS (bigger walls + adjusted pit)
  // -------------------------
  const lobbyR = 54;
  const wallH  = 12;
  const wallT  = 1.2;

  const pitR = 10.5;

  // pit raised (less deep)
  const pitDepth = 4.6;
  const pitFloorY = -pitDepth + 0.06;

  const innerFloorR = pitR + 0.30;

  // Entrance direction (+X)
  const entryAngle = 0;
  const entryDir = new THREE.Vector3(Math.cos(entryAngle), 0, Math.sin(entryAngle));

  // Store direction (+Z)
  const storeAngle = Math.PI/2;

  // -------------------------
  // HELPERS
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

  const neonMat = (c, e, inten=2.0) =>
    new THREE.MeshStandardMaterial({ color:c, emissive:e, emissiveIntensity:inten, roughness:0.4, metalness:0.25 });

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
    map: pitCarpetTex, color: 0xffffff, roughness: 0.98, metalness: 0.02, side: THREE.DoubleSide
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
  // LIGHTING (bright)
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

  // ceiling
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
  // WALK SURFACES (for gravity snapping in input.js)
  // -------------------------
  ctx.walkSurfaces = ctx.walkSurfaces || [];

  // -------------------------
  // FLOOR + TELEPORT PLANE
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
  // PIT RAIL ring with opening at entrance
  // -------------------------
  const railR = pitR + 1.55;
  const railY = 1.15;
  const opening = Math.PI/7;

  {
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
  }

  // -------------------------
  // CONNECTED ENTRANCE PLATFORM + SHORT SPIRAL STAIRS
  // -------------------------
  function addConnectedSpiralStairs(){
    const stepCount = 16;
    const stepW = 1.85;
    const stepD = 0.82;

    const topY = 0.95;
    const bottomY = pitFloorY + 1.05;
    const stepH = (topY - bottomY) / stepCount;

    const rWall = pitR - 0.55;
    const aStart = entryAngle + opening*0.45;
    const aSpan  = Math.PI * 0.55;

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x121226, roughness: 0.78, metalness: 0.22,
      emissive: 0x12003a, emissiveIntensity: 0.20
    });

    const platR = innerFloorR + 0.65;
    const platX = Math.cos(entryAngle) * platR;
    const platZ = Math.sin(entryAngle) * platR;

    const platform = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 3.6), metalDark);
    platform.position.set(platX, 0.11, platZ);
    platform.rotation.y = entryAngle;
    scene.add(platform);
    teleportSurfaces.push(platform);
    ctx.walkSurfaces.push(platform);

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

      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(stepW*0.92, 0.05, 0.06),
        neonMat(0x00ffff, 0x00c8ff, 0.85)
      );
      edge.position.set(0, 0.08, stepD*0.38);
      step.add(edge);
    }

    return platform;
  }
  const entryPlatform = addConnectedSpiralStairs();

  // -------------------------
  // STOREFRONT (simple + glass windows)
  // -------------------------
  {
    const storeZ = lobbyR - 0.8;
    const storeY = 3.0;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(19.5, 8.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.45, metalness: 0.45 })
    );
    frame.position.set(0, storeY, storeZ - 0.45);
    scene.add(frame);

    const winL = new THREE.Mesh(new THREE.BoxGeometry(6.8, 5.2, 0.14), glassMat);
    winL.position.set(-6.2, storeY+0.1, storeZ + 0.15);
    scene.add(winL);

    const winR = winL.clone();
    winR.position.x = 6.2;
    scene.add(winR);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.22, 40),
      neonMat(0x00ffcc, 0x00ffcc, 1.2)
    );
    pad.position.set(0, 0.12, lobbyR - 9.5);
    scene.add(pad);
    teleportSurfaces.push(pad);
    ctx.walkSurfaces.push(pad);
  }

  // -------------------------
  // BALCONY ABOVE STORE ONLY
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

    const railTopG = new THREE.CylinderGeometry(0.07, 0.07, 22, 10);
    const topRail = new THREE.Mesh(railTopG, neonMat(0x00d5ff,0x00b7ff,1.2));
    topRail.rotation.z = Math.PI/2;
    topRail.position.set(0, y+1.15, z - 4.6);
    scene.add(topRail);
  }

  // -------------------------
  // AVATARS (OPTIONAL LOADER — will NOT crash if it fails)
  // -------------------------
  let GLTFLoader = null;
  try {
    const mod = await import("https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
    GLTFLoader = mod.GLTFLoader;
    say("✅ GLTFLoader OK");
  } catch (e) {
    say("⚠️ GLTFLoader failed — using placeholders (no crash)");
  }

  const makePlaceholder = (color=0x00ffcc) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.75, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.6, metalness: 0.2, emissive: color, emissiveIntensity: 0.25 })
    );
    body.position.y = 1.0;
    g.add(body);
    return g;
  };

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

  // Guard + patrol (won’t crash if fails)
  {
    const guard = (await loadAvatar("ninja.glb", 1.9)) || makePlaceholder(0x8a2be2);
    guard.position.set(entryPlatform.position.x + 1.35, 0, entryPlatform.position.z + 0.65);
    guard.rotation.y = entryAngle + Math.PI/2;
    scene.add(guard);

    const patrol = (await loadAvatar("combat_ninja_inspired_by_jin_roh_wolf_brigade.glb", 1.95)) || makePlaceholder(0xff00aa);
    patrol.position.set(pitR + 6.4, 0, 0);
    scene.add(patrol);

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

  // -------------------------
  // SPAWN facing PIT (not store)
  // -------------------------
  rig.position.set(0, 1.8, -26);
  rig.rotation.set(0,0,0);
  rig.lookAt(0, 1.6, 0);

  say("✅ World loaded (safe boot). If GLBs fail you still see placeholders.");
                                                    }
