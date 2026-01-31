export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, log } = ctx;

  const lobbyR = 46;
  const wallH  = 11;
  const pitR   = 10.5;
  const pitDepth = 7.6;
  const pitFloorY = -pitDepth + 0.05;

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a55, 1.35);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(10, 18, 8);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 1.6, 300);
  top.position.set(0, 17, 0);
  scene.add(top);

  // Materials (brighter palette)
  const matFloor = new THREE.MeshStandardMaterial({ color: 0x2b1a3d, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide });
  const matWall  = new THREE.MeshStandardMaterial({ color: 0x1a2038, roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide });
  const matPit   = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide });

  const matNeon = (c, e, i=2.2) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i, roughness: 0.4, metalness: 0.2 });

  // Floor ring (no cap)
  const innerFloorR = pitR + 0.30;
  {
    const g = new THREE.RingGeometry(innerFloorR, lobbyR, 180, 1);
    const floor = new THREE.Mesh(g, matFloor);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    // Teleport helper plane
    const tpG = new THREE.CircleGeometry(lobbyR-2, 120);
    const tpM = new THREE.MeshBasicMaterial({ transparent:true, opacity:0 });
    const tp = new THREE.Mesh(tpG, tpM);
    tp.rotation.x = -Math.PI/2;
    tp.position.y = 0.02;
    scene.add(tp);
    teleportSurfaces.push(tp);
  }

  // Outer wall
  {
    const g = new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 180, 1, true);
    const wall = new THREE.Mesh(g, matWall);
    wall.position.y = wallH/2;
    scene.add(wall);
  }

  // Pit wall
  {
    const g = new THREE.CylinderGeometry(pitR, pitR, pitDepth, 160, 1, true);
    const pit = new THREE.Mesh(g, matPit);
    pit.position.y = -pitDepth/2 + 0.08;
    scene.add(pit);
  }

  // Pit floor
  let pitFloor = null;
  {
    const g = new THREE.CircleGeometry(pitR-0.28, 160);
    const m = new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.98, metalness: 0.02 });
    pitFloor = new THREE.Mesh(g, m);
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = pitFloorY;
    scene.add(pitFloor);
    teleportSurfaces.push(pitFloor);
  }

  // Neon trims (top + mid + bottom)
  {
    const topG = new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 140);
    const topT = new THREE.Mesh(topG, matNeon(0x00ffff, 0x00c8ff, 2.6));
    topT.rotation.x = Math.PI/2;
    topT.position.y = 1.05;
    scene.add(topT);

    const midG = new THREE.TorusGeometry(pitR-0.12, 0.06, 10, 140);
    for (let i=1;i<=2;i++){
      const mid = new THREE.Mesh(midG, matNeon(0x2222ff, 0x00a6ff, 1.7));
      mid.rotation.x = Math.PI/2;
      mid.position.y = pitFloorY + (pitDepth * 0.33 * i);
      scene.add(mid);
    }

    const botG = new THREE.TorusGeometry(pitR - 0.25, 0.12, 10, 140);
    const botT = new THREE.Mesh(botG, matNeon(0xff00aa, 0xff00aa, 2.3));
    botT.rotation.x = Math.PI/2;
    botT.position.y = pitFloorY + 0.18;
    scene.add(botT);

    const pitLight = new THREE.PointLight(0xff00aa, 0.9, 50);
    pitLight.position.set(0, pitFloorY + 1.3, 0);
    scene.add(pitLight);
  }

  // Simple stairs down (+X side)
  {
    const steps = 18;
    const startX = pitR + 2.2;
    const startZ = 2.5;
    const startY = 0.9;
    const endY   = pitFloorY + 0.9;
    const stepH  = (startY - endY) / steps;
    const stepD  = 0.55;
    const stepW  = 2.2;

    const stepMat = new THREE.MeshStandardMaterial({ color: 0x141425, roughness: 0.85, metalness: 0.15, emissive: 0x08002a, emissiveIntensity: 0.25 });

    for (let i=0;i<steps;i++){
      const y = startY - (i+1)*stepH;
      const g = new THREE.BoxGeometry(stepW, stepH*0.95, stepD);
      const s = new THREE.Mesh(g, stepMat);
      const z = startZ - i*stepD;
      s.position.set(startX, y, z);
      scene.add(s);
      teleportSurfaces.push(s);
    }
  }

  // Spawn safe
  rig.position.set(0, 1.8, 24);
  rig.lookAt(0, 1.6, 0);

  log("✅ SAFE world built");
}
