export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, walkSurfaces, log } = ctx;
  const say=(m)=>{ try{log(m);}catch(e){} console.log(m); };

  // Clear any old objects if hot-reloading (optional safety)
  // (We won’t traverse and delete here to avoid breaking Spine-managed nodes.)

  // -------------------------
  // CONSTANTS
  // -------------------------
  const lobbyR = 54;
  const wallH  = 12;
  const pitR   = 10.5;
  const pitDepth = 4.6;
  const pitFloorY = -pitDepth + 0.06;
  const innerFloorR = pitR + 0.30;

  // -------------------------
  // LIGHTS (bright)
  // -------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x303070, 1.4);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(14, 20, 12);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 2.1, 420);
  top.position.set(0, 18.0, 0);
  scene.add(top);

  // -------------------------
  // SKY DOME (so you never see "void")
  // -------------------------
  {
    const skyGeo = new THREE.SphereGeometry(300, 32, 20);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x05060a, side: THREE.BackSide });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // faint glow ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(120, 0.6, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0x221155 })
    );
    ring.rotation.x = Math.PI/2;
    ring.position.y = 25;
    scene.add(ring);
  }

  // -------------------------
  // WALK SURFACES
  // -------------------------
  ctx.walkSurfaces = ctx.walkSurfaces || [];
  const WS = ctx.walkSurfaces;

  // -------------------------
  // FLOOR (ring) + invisible teleport plane
  // -------------------------
  {
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a1650,
      roughness: 0.95,
      metalness: 0.03,
      side: THREE.DoubleSide
    });

    const floor = new THREE.Mesh(
      new THREE.RingGeometry(innerFloorR, lobbyR, 160, 1),
      floorMat
    );
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    // Big invisible teleport plane (useful for aiming)
    const tp = new THREE.Mesh(
      new THREE.CircleGeometry(lobbyR-2, 140),
      new THREE.MeshBasicMaterial({ transparent:true, opacity:0, side: THREE.DoubleSide })
    );
    tp.rotation.x = -Math.PI/2;
    tp.position.y = 0.02;
    scene.add(tp);
    teleportSurfaces.push(tp);
    WS.push(tp);

    // Center marker (you asked for a circle you can see)
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.46, 48),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent:true, opacity:0.9, side: THREE.DoubleSide })
    );
    marker.rotation.x = -Math.PI/2;
    marker.position.y = 0.06;
    scene.add(marker);
  }

  // -------------------------
  // OUTER WALL
  // -------------------------
  {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f1f,
      roughness: 0.75,
      metalness: 0.2,
      side: THREE.DoubleSide
    });

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 160, 1, true),
      wallMat
    );
    wall.position.y = wallH/2;
    scene.add(wall);

    const band = new THREE.Mesh(
      new THREE.TorusGeometry(lobbyR-0.45, 0.10, 10, 160),
      new THREE.MeshBasicMaterial({ color: 0x00a6ff })
    );
    band.rotation.x = Math.PI/2;
    band.position.y = 2.45;
    scene.add(band);
  }

  // -------------------------
  // PIT WALL + PIT FLOOR
  // -------------------------
  {
    const pitWallMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a12,
      roughness: 0.95,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const pitW = new THREE.Mesh(
      new THREE.CylinderGeometry(pitR, pitR, pitDepth, 160, 1, true),
      pitWallMat
    );
    pitW.position.y = -pitDepth/2 + 0.08;
    scene.add(pitW);

    const pitFloor = new THREE.Mesh(
      new THREE.CircleGeometry(pitR-0.28, 160),
      new THREE.MeshStandardMaterial({ color: 0x1b0d35, roughness: 0.98, metalness: 0.02, side: THREE.DoubleSide })
    );
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = pitFloorY;
    scene.add(pitFloor);
    teleportSurfaces.push(pitFloor);
    WS.push(pitFloor);

    // Pit marker ring (visible depth reference)
    const pitRing = new THREE.Mesh(
      new THREE.RingGeometry(pitR-0.8, pitR-0.55, 100),
      new THREE.MeshBasicMaterial({ color: 0xff00aa, transparent:true, opacity:0.9, side: THREE.DoubleSide })
    );
    pitRing.rotation.x = -Math.PI/2;
    pitRing.position.y = pitFloorY + 0.08;
    scene.add(pitRing);

    // Lip neon
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 140),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    lip.rotation.x = Math.PI/2;
    lip.position.y = 1.05;
    scene.add(lip);

    const p1 = new THREE.PointLight(0x00c8ff, 1.0, 90);
    p1.position.set(0, pitFloorY + 2.3, 0);
    scene.add(p1);
  }

  // -------------------------
  // CONNECTED ENTRANCE PLATFORM + SHORT SPIRAL STAIRS
  // -------------------------
  {
    const entryAngle = 0;
    const opening = Math.PI/7;

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.22, 3.6),
      new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.65, metalness:0.35 })
    );

    const platR = innerFloorR + 0.65;
    platform.position.set(Math.cos(entryAngle)*platR, 0.11, Math.sin(entryAngle)*platR);
    platform.rotation.y = entryAngle;
    scene.add(platform);
    teleportSurfaces.push(platform);
    WS.push(platform);

    const stepCount=16, stepW=1.85, stepD=0.82;
    const topY=0.95, bottomY=pitFloorY+1.05;
    const stepH=(topY-bottomY)/stepCount;
    const rWall=pitR-0.55;
    const aStart=entryAngle+opening*0.45;
    const aSpan=Math.PI*0.55;

    const stepMat = new THREE.MeshStandardMaterial({
      color:0x121226, roughness:0.78, metalness:0.22, emissive:0x12003a, emissiveIntensity:0.2
    });

    for (let i=0;i<stepCount;i++){
      const t=i/(stepCount-1);
      const a=aStart+aSpan*t;
      const x=Math.cos(a)*rWall;
      const z=Math.sin(a)*rWall;
      const y=topY-(i+1)*stepH;

      const step=new THREE.Mesh(
        new THREE.BoxGeometry(stepW, Math.max(0.16, stepH*0.94), stepD),
        stepMat
      );
      step.position.set(x,y,z);
      step.rotation.y=a+Math.PI/2;
      scene.add(step);
      teleportSurfaces.push(step);
      WS.push(step);
    }
  }

  // -------------------------
  // STOREFRONT PLACEHOLDER + BALCONY
  // -------------------------
  {
    const storeZ = lobbyR - 0.8;

    const store = new THREE.Mesh(
      new THREE.BoxGeometry(19.5, 8.2, 1.2),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.45, metalness:0.45 })
    );
    store.position.set(0, 3.0, storeZ - 0.45);
    scene.add(store);

    const balcony = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.35, 9.5),
      new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.55, metalness:0.35, emissive:0x0a0014, emissiveIntensity:0.22 })
    );
    balcony.position.set(0, 7.6, lobbyR - 5.0);
    scene.add(balcony);
    teleportSurfaces.push(balcony);
    WS.push(balcony);
  }

  // -------------------------
  // SPAWN FIX (absolute)
  // -------------------------
  // If you were seeing a flat purple plane, your camera was likely intersecting geometry.
  // We force a safe position above floor and looking at center.
  rig.position.set(0, 1.85, -34);
  rig.lookAt(0, 1.55, 0);

  say("✅ world init OK (visual markers added). You should now SEE the pit + walls immediately.");
                                   }
