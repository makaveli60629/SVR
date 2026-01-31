/**
 * SCARLETT1 DEMO WORLD — FULL
 * Circular lobby + OPEN pit (ring floor) + balcony ring + store pads + poker pit centerpiece
 * Jumbotrons flush to wall
 */
export async function init(ctx){
  const { THREE, scene, rig, log } = ctx;

  // -------------------------
  // DIMENSIONS
  // -------------------------
  const lobbyR = 46;
  const wallH  = 11;
  const wallT  = 1.2;

  const pitR = 10.5;
  const pitDepth = 7.0;

  // -------------------------
  // LIGHTING (BRIGHT)
  // -------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x202040, 1.2);
  hemi.position.set(0, 50, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(10, 18, 8);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 1.4, 260);
  top.position.set(0, 16, 0);
  scene.add(top);

  // Purple accent lights around lobby
  for (let i=0;i<10;i++){
    const a = (i/10) * Math.PI*2;
    const p = new THREE.PointLight(0x8a2be2, 1.1, 80);
    p.position.set(Math.cos(a)*(lobbyR-6), 6.2, Math.sin(a)*(lobbyR-6));
    scene.add(p);
  }

  // -------------------------
  // MATERIAL HELPERS
  // -------------------------
  const floorMat = (color) => new THREE.MeshStandardMaterial({
    color, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide
  });

  const emissiveMat = (c, e, inten=1.6) => new THREE.MeshStandardMaterial({
    color: c, emissive: e, emissiveIntensity: inten, roughness: 0.5, metalness: 0.2
  });

  // -------------------------
  // FLOOR: RING (NO DISK OVER PIT)
  // -------------------------
  {
    const inner = pitR + 0.55;
    const outer = lobbyR;
    const g = new THREE.RingGeometry(inner, outer, 140, 1);
    const m = floorMat(0x141427);
    const floor = new THREE.Mesh(g, m);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    // Add some “tile” lines (visual interest)
    const linesG = new THREE.RingGeometry(inner+0.02, outer-0.02, 140, 1);
    const linesM = emissiveMat(0x05050a, 0x101040, 0.7);
    const lines = new THREE.Mesh(linesG, linesM);
    lines.rotation.x = -Math.PI/2;
    lines.position.y = 0.01;
    scene.add(lines);
  }

  // -------------------------
  // OUTER WALL (CYLINDER)
  // -------------------------
  {
    const g = new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 160, 1, true);
    const m = new THREE.MeshStandardMaterial({
      color: 0x10101b, roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide
    });
    const wall = new THREE.Mesh(g, m);
    wall.position.y = wallH/2;
    scene.add(wall);

    // Neon band
    const bandG = new THREE.TorusGeometry(lobbyR-0.35, 0.10, 10, 200);
    const bandM = emissiveMat(0x00d5ff, 0x00b7ff, 2.0);
    const band = new THREE.Mesh(bandG, bandM);
    band.rotation.x = Math.PI/2;
    band.position.y = 2.4;
    scene.add(band);
  }

  // -------------------------
  // PIT WALL + GLOW LIP
  // -------------------------
  {
    const pitWallG = new THREE.CylinderGeometry(pitR, pitR, pitDepth, 120, 1, true);
    const pitWallM = new THREE.MeshStandardMaterial({
      color: 0x07070d, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide
    });
    const pitWall = new THREE.Mesh(pitWallG, pitWallM);
    pitWall.position.y = -pitDepth/2 + 0.08;
    scene.add(pitWall);

    const lipG = new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 120);
    const lipM = emissiveMat(0x00ffff, 0x00c8ff, 2.4);
    const lip = new THREE.Mesh(lipG, lipM);
    lip.rotation.x = Math.PI/2;
    lip.position.y = 1.05;
    scene.add(lip);
  }

  // -------------------------
  // PIT FLOOR + CENTER PEDESTAL + “TABLE” (VISUAL DEMO)
  // -------------------------
  {
    const pitFloorG = new THREE.CircleGeometry(pitR-0.25, 120);
    const pitFloorM = floorMat(0x0a0a12);
    const pitFloor = new THREE.Mesh(pitFloorG, pitFloorM);
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = -pitDepth + 0.05;
    scene.add(pitFloor);

    const pedG = new THREE.CylinderGeometry(3.4, 3.4, 1.4, 64);
    const pedM = new THREE.MeshStandardMaterial({ color: 0x12121a, roughness: 0.6, metalness: 0.25 });
    const ped = new THREE.Mesh(pedG, pedM);
    ped.position.set(0, -pitDepth + 0.85, 0);
    scene.add(ped);

    const tableG = new THREE.CylinderGeometry(4.2, 4.2, 0.28, 90);
    const tableM = new THREE.MeshStandardMaterial({
      color: 0x1a0f20, roughness: 0.55, metalness: 0.2,
      emissive: 0x120018, emissiveIntensity: 0.6
    });
    const table = new THREE.Mesh(tableG, tableM);
    table.position.set(0, -pitDepth + 1.75, 0);
    scene.add(table);

    const neonG = new THREE.TorusGeometry(4.2, 0.08, 10, 140);
    const neonM = emissiveMat(0x00ffff, 0x00c8ff, 2.0);
    const neon = new THREE.Mesh(neonG, neonM);
    neon.rotation.x = Math.PI/2;
    neon.position.set(0, -pitDepth + 1.93, 0);
    scene.add(neon);
  }

  // -------------------------
  // BALCONY RING WALKWAY (UPPER LEVEL)
  // -------------------------
  {
    const balY = 5.6;
    const inner = lobbyR - 10;
    const outer = lobbyR - 3.8;
    const g = new THREE.RingGeometry(inner, outer, 160, 1);
    const m = floorMat(0x121224);
    const balcony = new THREE.Mesh(g, m);
    balcony.rotation.x = -Math.PI/2;
    balcony.position.y = balY;
    scene.add(balcony);

    // Balcony rail glow
    const railG = new THREE.TorusGeometry(inner + 0.25, 0.08, 10, 200);
    const railM = emissiveMat(0x8a2be2, 0x6f00ff, 1.8);
    const rail = new THREE.Mesh(railG, railM);
    rail.rotation.x = Math.PI/2;
    rail.position.y = balY + 1.1;
    scene.add(rail);
  }

  // -------------------------
  // JUMBOTRONS (FLUSH to wall)
  // -------------------------
  function placeOnCircularWall(obj, angle, wallRadius, y, depth=0.6, inset=0.04){
    const nx = Math.cos(angle), nz = Math.sin(angle);
    const r = wallRadius - inset - (depth * 0.5);
    obj.position.set(nx * r, y, nz * r);
    obj.rotation.y = angle + Math.PI; // face center
  }

  function makeJumbotron(){
    const w = 10.5, h = 6.0, d = 0.7;
    const bodyG = new THREE.BoxGeometry(w, h, d);
    const bodyM = new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 0.35, metalness: 0.35 });
    const body = new THREE.Mesh(bodyG, bodyM);

    const screenG = new THREE.PlaneGeometry(w*0.88, h*0.82);
    const screenM = new THREE.MeshStandardMaterial({ color: 0x111133, emissive: 0x2222ff, emissiveIntensity: 0.85 });
    const screen = new THREE.Mesh(screenG, screenM);
    screen.position.z = (d/2) + 0.001;
    body.add(screen);

    const trimG = new THREE.BoxGeometry(w*0.92, h*0.86, 0.05);
    const trimM = emissiveMat(0x00c8ff, 0x00a6ff, 1.6);
    const trim = new THREE.Mesh(trimG, trimM);
    trim.position.z = (d/2) + 0.02;
    body.add(trim);

    body.userData.depth = d;
    return body;
  }

  {
    const angles = [Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
    angles.forEach((a) => {
      const j = makeJumbotron();
      placeOnCircularWall(j, a, lobbyR - (wallT*0.5), 7.3, j.userData.depth, 0.05);
      scene.add(j);

      // Door marker under each jumbotron
      const doorG = new THREE.BoxGeometry(4.4, 6.6, 0.24);
      const doorM = new THREE.MeshStandardMaterial({ color: 0x0d0d14, emissive: 0x3a00ff, emissiveIntensity: 0.35 });
      const door = new THREE.Mesh(doorG, doorM);
      placeOnCircularWall(door, a, lobbyR - (wallT*0.5), 3.1, 0.24, 0.03);
      scene.add(door);
    });
  }

  // -------------------------
  // STORE / VIP / POKER PADS (VISUAL DEMO TARGETS)
  // -------------------------
  function makePad(labelColor){
    const padG = new THREE.CylinderGeometry(1.05, 1.05, 0.18, 42);
    const padM = emissiveMat(labelColor, labelColor, 1.4);
    const pad = new THREE.Mesh(padG, padM);
    return pad;
  }

  {
    const pads = [
      { name:"STORE", color:0x00ffcc, x: 14, z: 20 },
      { name:"VIP",   color:0xff00aa, x:-14, z: 20 },
      { name:"POKER", color:0x00a6ff, x: 0,  z: 10 }
    ];

    pads.forEach(p => {
      const pad = makePad(p.color);
      pad.position.set(p.x, 0.12, p.z);
      scene.add(pad);

      const beamG = new THREE.CylinderGeometry(0.06, 0.06, 7.0, 16);
      const beamM = emissiveMat(p.color, p.color, 1.8);
      const beam = new THREE.Mesh(beamG, beamM);
      beam.position.set(p.x, 3.6, p.z);
      scene.add(beam);
    });
  }

  // -------------------------
  // SAFE SPAWN + LOOK AT CENTER
  // -------------------------
  rig.position.set(0, 1.8, 18);
  rig.lookAt(0, 1.6, 0);

  log("✅ Lobby created");
  log("✅ Deep pit created (OPEN center)");
  log("✅ Balcony ring created");
  log("✅ Jumbotrons aligned flush");
  log("✅ Lighting loaded (bright)");
      }
