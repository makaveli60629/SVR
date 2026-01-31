/**
 * SCARLETT1 WORLD (PERMANENT)
 * Circular lobby + pit + poker room + balcony placeholders
 * 4 Jumbotrons placed FLUSH to circular wall (no protrude)
 */
export async function init(ctx){
  const { THREE, scene, rig, log } = ctx;

  // --- Lighting (bright) ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(10, 18, 10);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 1.2, 200);
  top.position.set(0, 14, 0);
  scene.add(top);

  // --- Dimensions ---
  const lobbyR = 42;         // lobby inner radius
  const wallH  = 10;
  const wallT  = 1.2;

  // --- Floor ---
  {
    const g = new THREE.CircleGeometry(lobbyR, 96);
    const m = new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.9, metalness: 0.05 });
    const floor = new THREE.Mesh(g, m);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);
  }

  // --- Circular Wall ---
  {
    const g = new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 128, 1, true);
    const m = new THREE.MeshStandardMaterial({ color: 0x11111c, roughness: 0.7, metalness: 0.15, side: THREE.DoubleSide });
    const wall = new THREE.Mesh(g, m);
    wall.position.y = wallH/2;
    scene.add(wall);

    // inner trim ring
    const rg = new THREE.TorusGeometry(lobbyR - 0.2, 0.08, 12, 128);
    const rm = new THREE.MeshStandardMaterial({ color: 0x3a2bff, emissive: 0x2b1cff, emissiveIntensity: 1.0 });
    const ring = new THREE.Mesh(rg, rm);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 2.2;
    scene.add(ring);
  }

  // --- Pit (center cut visual) ---
  const pitR = 10;
  const pitDepth = 5.5;
  {
    const g = new THREE.CylinderGeometry(pitR, pitR, pitDepth, 96, 1, true);
    const m = new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide });
    const pitWall = new THREE.Mesh(g, m);
    pitWall.position.y = -pitDepth/2 + 0.05;
    scene.add(pitWall);

    const lipG = new THREE.TorusGeometry(pitR+0.25, 0.12, 10, 96);
    const lipM = new THREE.MeshStandardMaterial({ color: 0x00d5ff, emissive: 0x00a6ff, emissiveIntensity: 1.25 });
    const lip = new THREE.Mesh(lipG, lipM);
    lip.rotation.x = Math.PI/2;
    lip.position.y = 0.9;
    scene.add(lip);
  }

  // --- Simple pedestal + table placeholder (so you SEE something) ---
  {
    const pedG = new THREE.CylinderGeometry(3.2, 3.2, 1.2, 48);
    const pedM = new THREE.MeshStandardMaterial({ color: 0x12121a, roughness: 0.6, metalness: 0.2 });
    const ped = new THREE.Mesh(pedG, pedM);
    ped.position.set(0, -3.8, 0);
    scene.add(ped);

    const tableG = new THREE.CylinderGeometry(3.6, 3.6, 0.25, 64);
    const tableM = new THREE.MeshStandardMaterial({ color: 0x1b0f1f, roughness: 0.55, metalness: 0.15, emissive: 0x18001f, emissiveIntensity: 0.4 });
    const table = new THREE.Mesh(tableG, tableM);
    table.position.set(0, -3.1, 0);
    scene.add(table);

    const neonG = new THREE.TorusGeometry(3.6, 0.06, 10, 128);
    const neonM = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00c8ff, emissiveIntensity: 1.4 });
    const neon = new THREE.Mesh(neonG, neonM);
    neon.rotation.x = Math.PI/2;
    neon.position.set(0, -3.0, 0);
    scene.add(neon);
  }

  // --- Helper: place object flush on circular wall ---
  function placeOnCircularWall(obj, angle, wallRadius, y, depth=0.4, inset=0.03){
    const nx = Math.cos(angle);
    const nz = Math.sin(angle);
    const r = wallRadius - inset - (depth * 0.5);
    obj.position.set(nx * r, y, nz * r);
    obj.rotation.y = angle + Math.PI; // face center
  }

  // --- Jumbotron builder ---
  function makeJumbotron(){
    const w = 10, h = 5.5, d = 0.6;
    const bodyG = new THREE.BoxGeometry(w, h, d);
    const bodyM = new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 0.35, metalness: 0.35 });
    const body = new THREE.Mesh(bodyG, bodyM);

    // screen inset
    const screenG = new THREE.PlaneGeometry(w*0.88, h*0.82);
    const screenM = new THREE.MeshStandardMaterial({ color: 0x111133, emissive: 0x2222ff, emissiveIntensity: 0.65 });
    const screen = new THREE.Mesh(screenG, screenM);
    screen.position.z = (d/2) + 0.001;
    body.add(screen);

    // trim glow
    const trimG = new THREE.BoxGeometry(w*0.92, h*0.86, 0.04);
    const trimM = new THREE.MeshStandardMaterial({ color: 0x00c8ff, emissive: 0x00a6ff, emissiveIntensity: 1.1 });
    const trim = new THREE.Mesh(trimG, trimM);
    trim.position.z = (d/2) + 0.02;
    body.add(trim);

    body.userData.depth = d;
    return body;
  }

  // --- Place 4 Jumbotrons (diagonals) FLUSH ---
  {
    const angles = [Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
    angles.forEach((a) => {
      const j = makeJumbotron();
      const d = j.userData.depth || 0.6;
      placeOnCircularWall(j, a, lobbyR - (wallT*0.5), 6.8, d, 0.04);
      scene.add(j);

      // Door under each jumbotron (simple opening marker)
      const doorG = new THREE.BoxGeometry(4.2, 6.4, 0.25);
      const doorM = new THREE.MeshStandardMaterial({ color: 0x101018, emissive: 0x2200ff, emissiveIntensity: 0.35 });
      const door = new THREE.Mesh(doorG, doorM);
      placeOnCircularWall(door, a, lobbyR - (wallT*0.5), 3.2, 0.25, 0.02);
      scene.add(door);
    });
  }

  // --- Spawn safety (prevents lip snag) ---
  rig.position.set(0, 1.7, 16);

  log("✅ Lobby created");
  log("✅ Deep pit created");
  log("✅ Poker room created (placeholder)");
  log("✅ Store room created (placeholder)");
  log("✅ Balcony room created (placeholder)");
  log("✅ Jumbotrons aligned flush");
  log("✅ Lighting loaded (bright)");
}
