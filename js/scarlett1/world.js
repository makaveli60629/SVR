/**
 * /js/scarlett1/world.js
 * OPTION A+ WORLD
 *
 * Goals:
 * - Bright circular lobby + pit
 * - Working stairs into pit
 * - Center pedestal + demo table + 8 seats
 * - Balcony ring + rails
 * - Store zone pads + 4 jumbotrons
 * - Simple roaming "bots" + guard placeholder
 *
 * Exposes:
 * - ctx.walkSurfaces[] (ground snap)
 * - ctx.teleportSurfaces[] (teleport reticle)
 */

export async function init(ctx){
  const { THREE, scene, Bus } = ctx;

  // -------------------------------------------------------------------------
  // TEXTURE HELPERS
  // -------------------------------------------------------------------------
  function makeCanvasTexture(draw, size=512){
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    draw(g, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }

  const carpetTex = makeCanvasTexture((g,s)=>{
    g.fillStyle = '#1a0f1f';
    g.fillRect(0,0,s,s);
    // subtle pattern
    g.strokeStyle = 'rgba(255,255,255,0.06)';
    g.lineWidth = 2;
    for (let i=0;i<24;i++){
      const y = (i/24)*s;
      g.beginPath();
      g.moveTo(0,y);
      g.lineTo(s,y);
      g.stroke();
    }
    // vignette
    const grd = g.createRadialGradient(s/2,s/2,s*0.1, s/2,s/2,s*0.55);
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(1,'rgba(0,0,0,0.55)');
    g.fillStyle = grd;
    g.fillRect(0,0,s,s);
  });
  carpetTex.repeat.set(6,6);

  const tableTex = makeCanvasTexture((g,s)=>{
    g.fillStyle = '#0f1318';
    g.fillRect(0,0,s,s);

    // pass line
    g.strokeStyle = '#ffffff';
    g.lineWidth = 10;
    g.beginPath();
    g.arc(s/2,s/2,s*0.36, 0, Math.PI*2);
    g.stroke();

    g.strokeStyle = '#00ffff';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(s/2,s/2,s*0.28, 0, Math.PI*2);
    g.stroke();

    // logo
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.font = 'bold 56px system-ui, Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('SCARLETT', s/2, s/2 - 18);
    g.font = 'bold 38px system-ui, Arial';
    g.fillText('POKER', s/2, s/2 + 34);
  }, 1024);

  function labelPlane(text, w=1.4, h=0.5){
    const tex = makeCanvasTexture((g,s)=>{
      g.fillStyle = 'rgba(0,0,0,0.55)';
      g.fillRect(0,0,s,s);
      g.strokeStyle = 'rgba(0,255,255,0.9)';
      g.lineWidth = 8;
      g.strokeRect(10,10,s-20,s-20);
      g.fillStyle = '#ffffff';
      g.font = 'bold 64px system-ui, Arial';
      g.textAlign='center';
      g.textBaseline='middle';
      g.fillText(text, s/2, s/2);
    }, 512);
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: new THREE.Color(0x001010), emissiveIntensity: 1.3, roughness: 0.7 });
    return new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat);
  }

  // -------------------------------------------------------------------------
  // LIGHTING (bright, readable)
  // -------------------------------------------------------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  const sun = new THREE.DirectionalLight(0xffffff, 0.85);
  sun.position.set(10,18,6);
  scene.add(sun);

  const core = new THREE.PointLight(0xffffff, 1.4, 140);
  core.position.set(0,10,0);
  scene.add(core);

  for (let i=0;i<12;i++){
    const a = (i/12)*Math.PI*2;
    const p = new THREE.PointLight(0x8a2be2, 1.15, 60);
    p.position.set(Math.cos(a)*22, 5.2, Math.sin(a)*22);
    scene.add(p);
  }

  // -------------------------------------------------------------------------
  // GEOMETRY: LOBBY + PIT
  // -------------------------------------------------------------------------
  const walkSurfaces = [];
  const teleportSurfaces = [];
  ctx.walkSurfaces = walkSurfaces;
  ctx.teleportSurfaces = teleportSurfaces;

  // Lobby floor (carpet)
  const lobbyR = 28;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(lobbyR, 96),
    new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.95, metalness: 0.0 })
  );
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  scene.add(floor);
  walkSurfaces.push(floor);
  teleportSurfaces.push(floor);

  // Lobby outer wall
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(lobbyR, lobbyR, 8.0, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x05050a, roughness: 0.85, metalness: 0.08, side: THREE.DoubleSide })
  );
  wall.position.y = 4.0;
  scene.add(wall);

  // Neon rail ring
  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(lobbyR-1.0, 0.09, 10, 140),
    new THREE.MeshStandardMaterial({ color: 0x001018, emissive: 0x00ffff, emissiveIntensity: 2.0, roughness: 0.35 })
  );
  rail.rotation.x = Math.PI/2;
  rail.position.y = 1.1;
  scene.add(rail);

  // Pit cylinder
  const pitR = 6.3;
  const pitY = -2.1;

  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR, pitR, 4.6, 72, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x090915, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide })
  );
  pitWall.position.y = pitY - 0.7;
  scene.add(pitWall);

  // Pit floor
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(pitR-0.15, 72),
    new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.95, metalness: 0.0 })
  );
  pitFloor.rotation.x = -Math.PI/2;
  pitFloor.position.y = pitY - 3.0;
  scene.add(pitFloor);
  walkSurfaces.push(pitFloor);
  teleportSurfaces.push(pitFloor);

  // Lip ring (visual)
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(pitR, 0.16, 12, 128),
    new THREE.MeshStandardMaterial({ color: 0x00c8ff, emissive: 0x0077ff, emissiveIntensity: 1.6, roughness: 0.4 })
  );
  lip.rotation.x = Math.PI/2;
  lip.position.y = 0.04;
  scene.add(lip);

  // -------------------------------------------------------------------------
  // STAIRS (walkable ramp steps into pit)
  // -------------------------------------------------------------------------
  const stairs = new THREE.Group();
  stairs.name = 'Stairs';
  scene.add(stairs);

  const steps = 18;
  const stepW = 2.4;
  const stepH = 0.16;
  const stepD = 0.55;
  const startY = 0.0;
  const endY = pitFloor.position.y + 0.02;
  const totalDrop = startY - endY;
  const dy = totalDrop / steps;

  const stepMat = new THREE.MeshStandardMaterial({ color: 0x12121a, roughness: 0.95 });
  const stairAngle = Math.PI/2; // entrance facing +X

  for (let i=0;i<steps;i++){
    const t = i/(steps-1);
    const y = startY - dy*i - stepH/2;
    const r = THREE.MathUtils.lerp(pitR+2.4, pitR-1.0, t);

    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, stepH, stepD),
      stepMat
    );

    step.position.set(
      Math.cos(stairAngle)*r,
      y,
      Math.sin(stairAngle)*r
    );
    step.lookAt(0, y, 0);
    stairs.add(step);
    walkSurfaces.push(step);
    teleportSurfaces.push(step);
  }

  // -------------------------------------------------------------------------
  // CENTER PEDESTAL + DEMO TABLE + 8 SEATS
  // -------------------------------------------------------------------------
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.2, 1.25, 64),
    new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.8, metalness: 0.15 })
  );
  pedestal.position.set(0, pitFloor.position.y + 0.62, 0);
  scene.add(pedestal);
  walkSurfaces.push(pedestal);
  teleportSurfaces.push(pedestal);

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.1, 0.22, 64),
    new THREE.MeshStandardMaterial({ map: tableTex, roughness: 0.55, metalness: 0.1 })
  );
  tableTop.position.set(0, pedestal.position.y + 0.82, 0);
  scene.add(tableTop);
  walkSurfaces.push(tableTop);
  teleportSurfaces.push(tableTop);

  // Seats
  const seatGroup = new THREE.Group();
  seatGroup.name = 'Seats';
  scene.add(seatGroup);

  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1b1b24, roughness: 0.75 });
  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const seat = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 0.7, 8, 16),
      seatMat
    );
    seat.position.set(Math.cos(a)*3.6, pedestal.position.y + 0.55, Math.sin(a)*3.6);
    seat.lookAt(0, seat.position.y, 0);
    seatGroup.add(seat);
  }

  // -------------------------------------------------------------------------
  // BALCONY (upper ring) + SIMPLE RAMP UP
  // -------------------------------------------------------------------------
  const balconyY = 3.2;
  const balconyR = 22.0;

  const balcony = new THREE.Mesh(
    new THREE.RingGeometry(balconyR-2.0, balconyR, 96),
    new THREE.MeshStandardMaterial({ color: 0x0d0d13, roughness: 0.95, side: THREE.DoubleSide })
  );
  balcony.rotation.x = -Math.PI/2;
  balcony.position.y = balconyY;
  scene.add(balcony);
  walkSurfaces.push(balcony);
  teleportSurfaces.push(balcony);

  const balconyRail = new THREE.Mesh(
    new THREE.TorusGeometry(balconyR-0.6, 0.08, 10, 140),
    new THREE.MeshStandardMaterial({ color: 0x001018, emissive: 0x00ffff, emissiveIntensity: 1.8, roughness: 0.35 })
  );
  balconyRail.rotation.x = Math.PI/2;
  balconyRail.position.y = balconyY + 1.05;
  scene.add(balconyRail);

  // Ramp (walkable) from lobby floor to balcony
  // A wide sloped box. Teleport works regardless, but this makes it feel like "stairs".
  const ramp = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.35, 10.5),
    new THREE.MeshStandardMaterial({ color: 0x13131b, roughness: 0.9 })
  );
  ramp.position.set(-10.5, balconyY/2, -10.5);
  ramp.rotation.x = -Math.atan2(balconyY, 10.5);
  scene.add(ramp);
  walkSurfaces.push(ramp);
  teleportSurfaces.push(ramp);

  // -------------------------------------------------------------------------
  // STORE ZONE PADS
  // -------------------------------------------------------------------------
  const storeZone = new THREE.Group();
  storeZone.name = 'StoreZone';
  scene.add(storeZone);

  const padMat = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.7, metalness: 0.2, emissive: 0x001010, emissiveIntensity: 0.8 });
  const pad = (label, x,z) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75,0.75,0.12,32), padMat);
    base.position.y = 0.06;
    g.add(base);
    const l = labelPlane(label, 1.5, 0.55);
    l.position.set(0, 0.9, 0);
    l.rotation.y = Math.PI;
    g.add(l);
    g.position.set(x, 0, z);
    storeZone.add(g);
    teleportSurfaces.push(base);
    walkSurfaces.push(base);
  };

  pad('STORE', 16, 10);
  pad('VIP', 19, 7);
  pad('POKER', 13, 7);

  // Avatar display windows inside the Store area (glass showcases)
  await buildStoreDisplayWindows(ctx, {
    origin: new ctx.THREE.Vector3(19.6, 0, 12.4),
    facing: -Math.PI/2,
  });

  // -------------------------------------------------------------------------
  // JUMBOTRONS (4)
  // -------------------------------------------------------------------------
  const jumboMat = new THREE.MeshStandardMaterial({
    color: 0x05070c,
    emissive: 0x2222ff,
    emissiveIntensity: 1.2,
    roughness: 0.5,
    metalness: 0.2
  });

  const jumbo = (x,z,ry) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.6, 0.25), new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.8 }));
    frame.position.set(x, 5.2, z);
    frame.rotation.y = ry;

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.2), jumboMat);
    screen.position.set(x, 5.2, z);
    screen.rotation.y = ry;
    // offset slightly forward
    screen.translateZ(0.14);

    scene.add(frame);
    scene.add(screen);
  };

  jumbo(0,  (lobbyR-0.6),  Math.PI);
  jumbo(0, -(lobbyR-0.6),  0);
  jumbo( (lobbyR-0.6), 0, -Math.PI/2);
  jumbo(-(lobbyR-0.6), 0,  Math.PI/2);

  // -------------------------------------------------------------------------
  // SIMPLE ROAMING BOTS (placeholders until GLB bots wired)
  // -------------------------------------------------------------------------
  const bots = new THREE.Group();
  bots.name = 'RoamBots';
  scene.add(bots);

  const botGeo = new THREE.CapsuleGeometry(0.24, 0.95, 8, 16);
  const botMat = new THREE.MeshStandardMaterial({ color: 0x1b1b27, roughness: 0.6, emissive: 0x090010, emissiveIntensity: 0.5 });
  const botCount = 6;

  const botData = [];
  for (let i=0;i<botCount;i++){
    const m = new THREE.Mesh(botGeo, botMat);
    m.position.y = 1.05;
    bots.add(m);
    botData.push({
      a: Math.random()*Math.PI*2,
      r: 14 + Math.random()*6,
      s: 0.15 + Math.random()*0.18
    });
  }

  // Guard placeholder (swap to combat GLB via avatar button if desired)
  const guard = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 1.05, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.7, emissive: 0x001000, emissiveIntensity: 0.9 })
  );
  guard.position.set(18.0, 1.15, 12.0);
  guard.lookAt(16, 1.15, 10);
  scene.add(guard);

  // -------------------------------------------------------------------------
  // ANIMATE HOOK
  // -------------------------------------------------------------------------
  ctx.__worldTick = (dt) => {
    // bots walk in a circle and occasionally wobble
    for (let i=0;i<botCount;i++){
      const d = botData[i];
      d.a += d.s * dt;
      const x = Math.cos(d.a)*d.r;
      const z = Math.sin(d.a)*d.r;
      const m = bots.children[i];
      m.position.x = x;
      m.position.z = z;
      m.lookAt(Math.cos(d.a+0.02)*d.r, 1.05, Math.sin(d.a+0.02)*d.r);
    }
  };

  Bus?.log?.('WORLD: lobby + pit + stairs + pedestal table loaded');
}


// =============================================================================
// Helpers: Store avatar showcases (no folder moves; uses CDN GLTFLoader)
// =============================================================================
async function buildStoreDisplayWindows(ctx, { origin, facing = 0 } = {}) {
  const { THREE, scene, Bus } = ctx;
  try {
    // GLTFLoader from CDN (works on GitHub Pages; avoids bare specifier 'three')
    const mod = await import('https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');
    const GLTFLoader = mod.GLTFLoader;
    const loader = new GLTFLoader();
    loader.setCrossOrigin('anonymous');

    const avatarList = [
      { key: 'male',   label: 'MALE',   url: './assets/avatars/male.glb' },
      { key: 'female', label: 'FEMALE', url: './assets/avatars/female.glb' },
      { key: 'ninja',  label: 'NINJA',  url: './assets/avatars/ninja.glb' },
      { key: 'combat', label: 'COMBAT', url: './assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb' },
    ];

    const g = new THREE.Group();
    g.name = 'StoreShowcases';
    scene.add(g);

    const base = origin || new THREE.Vector3(19.6, 0, 12.4);

    // wall backer
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 4.2, 10.8),
      new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.85, metalness: 0.05 })
    );
    wall.position.copy(base).add(new THREE.Vector3(0.0, 2.1, 0.0));
    wall.rotation.y = facing;
    g.add(wall);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b2a44,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.85,
      transparent: true,
      opacity: 0.35,
      thickness: 0.15,
      ior: 1.45,
      emissive: new THREE.Color(0x001018),
      emissiveIntensity: 0.6,
    });

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x11111a, roughness: 0.6, metalness: 0.2 });
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x17171f, roughness: 0.75, metalness: 0.1, emissive: 0x001000, emissiveIntensity: 0.4 });

    const spacing = 2.55;
    const startZ = +3.8;

    // lighting for the wall
    const strip = new THREE.RectAreaLight(0x66ccff, 10.0, 1.2, 10.0);
    strip.position.copy(base).add(new THREE.Vector3(-0.55, 2.7, 0));
    strip.rotation.y = facing + Math.PI/2;
    g.add(strip);

    const floorSpot = new THREE.PointLight(0x8a2be2, 1.3, 12);
    floorSpot.position.copy(base).add(new THREE.Vector3(-1.1, 3.2, 0));
    g.add(floorSpot);

    // Make a tiny label texture
    function makeLabel(text) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 128;
      const ctx2 = c.getContext('2d');
      ctx2.clearRect(0,0,c.width,c.height);
      ctx2.fillStyle = 'rgba(0,0,0,0.0)';
      ctx2.fillRect(0,0,c.width,c.height);
      ctx2.font = 'bold 72px Arial';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.fillStyle = '#bff6ff';
      ctx2.shadowColor = '#00ffff';
      ctx2.shadowBlur = 18;
      ctx2.fillText(text, c.width/2, c.height/2);
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 2;
      return tex;
    }

    // A simple normalizer similar to your avatar manager
    function normalize(root, targetHeight = 1.75) {
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      root.position.sub(center);

      const h = Math.max(size.y, 0.001);
      const s = targetHeight / h;
      root.scale.setScalar(s);

      const box2 = new THREE.Box3().setFromObject(root);
      root.position.y -= box2.min.y;
    }

    // Build each window
    for (let i = 0; i < avatarList.length; i++) {
      const a = avatarList[i];
      const zOff = startZ - i * spacing;

      const cell = new THREE.Group();
      cell.name = `Showcase_${a.key}`;
      cell.position.copy(base).add(new THREE.Vector3(-0.35, 0, zOff));
      cell.rotation.y = facing;
      g.add(cell);

      // frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.65, 0.18), frameMat);
      frame.position.set(-0.22, 1.55, 0);
      cell.add(frame);

      // glass in front (slightly offset)
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 2.42), glassMat);
      glass.position.set(-0.14, 1.55, 0.11);
      cell.add(glass);

      // pedestal
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.28, 32), pedestalMat);
      pedestal.position.set(-0.18, 0.16, -0.05);
      cell.add(pedestal);

      // label
      const labelTex = makeLabel(a.label);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.28),
        new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
      );
      label.position.set(-0.18, 0.46, 0.10);
      cell.add(label);

      // local light per window
      const l = new THREE.PointLight(0x00ffff, 0.85, 6.5);
      l.position.set(-0.85, 2.35, 0.55);
      cell.add(l);

      // avatar
      try {
        const gltf = await loader.loadAsync(a.url);
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) throw new Error('No scene in GLB');

        root.traverse((o) => {
          if (!o.isMesh) return;
          const m = o.material;
          const apply = (mat) => {
            if (!mat) return;
            if ('emissive' in mat) {
              mat.emissive = mat.emissive || new THREE.Color(0x000000);
              mat.emissive.add(new THREE.Color(0x001000));
              mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.55);
            }
            mat.needsUpdate = true;
          };
          if (Array.isArray(m)) m.forEach(apply); else apply(m);
        });

        normalize(root, 1.7);
        root.position.set(-0.18, 0.28, -0.05);
        root.rotation.y = Math.PI; // face outward
        cell.add(root);

        // slow showroom spin
        root.userData.__spin = 0.2 + i * 0.06;
      } catch (e) {
        Bus?.log?.(`STORE AVATAR FAIL (${a.key}): ${e?.message || e}`);
        const fallback = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.22, 0.9, 8, 16),
          new THREE.MeshStandardMaterial({ color: 0x142235, roughness: 0.7, emissive: 0x001018, emissiveIntensity: 1.0 })
        );
        fallback.position.set(-0.18, 0.65, -0.05);
        cell.add(fallback);
      }
    }

    // rotate showroom avatars via Spine render loop
    const prevUpdate = ctx.worldUpdate;
    ctx.worldUpdate = (dt) => {
      if (prevUpdate) prevUpdate(dt);
      g.traverse((o) => {
        const s = o.userData?.__spin;
        if (s) o.rotation.y += s * dt;
      });
    };
    Bus?.log?.('STORE: avatar display windows loaded');
  } catch (e) {
    Bus?.log?.(`STORE: display windows unavailable (${e?.message || e})`);
  }
}
