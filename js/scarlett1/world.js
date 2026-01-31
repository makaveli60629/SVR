export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, walkSurfaces, log } = ctx;

  const say=(m)=>{ try{log(m);}catch(e){} console.log(m); };

  // BASIC WORLD (no GLBs yet — we bring those back after you’re unblocked)
  const lobbyR = 54, wallH=12, pitR=10.5, pitDepth=4.6;
  const pitFloorY = -pitDepth + 0.06;
  const innerFloorR = pitR + 0.3;

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dir = new THREE.DirectionalLight(0xffffff, 1.15); dir.position.set(14,20,12); scene.add(dir);
  const top = new THREE.PointLight(0xffffff, 2.1, 420); top.position.set(0,18,0); scene.add(top);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(innerFloorR, lobbyR, 160, 1),
    new THREE.MeshStandardMaterial({ color:0x2a1650, roughness:0.95, metalness:0.03, side:THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI/2;
  scene.add(floor);

  const tp = new THREE.Mesh(
    new THREE.CircleGeometry(lobbyR-2, 140),
    new THREE.MeshBasicMaterial({ transparent:true, opacity:0 })
  );
  tp.rotation.x = -Math.PI/2;
  tp.position.y = 0.02;
  scene.add(tp);
  teleportSurfaces.push(tp);
  walkSurfaces.push(tp);

  // Walls
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 160, 1, true),
    new THREE.MeshStandardMaterial({ color:0x0b0f1f, roughness:0.75, metalness:0.2, side:THREE.DoubleSide })
  );
  wall.position.y = wallH/2;
  scene.add(wall);

  // Pit wall
  const pitW = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR, pitR, pitDepth, 160, 1, true),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.95, metalness:0.08, side:THREE.DoubleSide })
  );
  pitW.position.y = -pitDepth/2 + 0.08;
  scene.add(pitW);

  // Pit floor
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(pitR-0.28, 160),
    new THREE.MeshStandardMaterial({ color:0x1b0d35, roughness:0.98, metalness:0.02 })
  );
  pitFloor.rotation.x = -Math.PI/2;
  pitFloor.position.y = pitFloorY;
  scene.add(pitFloor);
  teleportSurfaces.push(pitFloor);
  walkSurfaces.push(pitFloor);

  // Neon trims
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(pitR+0.22, 0.14, 10, 140),
    new THREE.MeshStandardMaterial({ color:0x00ffff, emissive:0x00c8ff, emissiveIntensity:2.6 })
  );
  lip.rotation.x = Math.PI/2;
  lip.position.y = 1.05;
  scene.add(lip);

  // Connected stairs (short)
  const entryAngle=0;
  const opening=Math.PI/7;
  const stepCount=16, stepW=1.85, stepD=0.82;
  const topY=0.95, bottomY=pitFloorY+1.05;
  const stepH=(topY-bottomY)/stepCount;
  const rWall=pitR-0.55;
  const aStart=entryAngle+opening*0.45;
  const aSpan=Math.PI*0.55;

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.22, 3.6),
    new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.65, metalness:0.35 })
  );
  const platR = innerFloorR + 0.65;
  platform.position.set(Math.cos(entryAngle)*platR, 0.11, Math.sin(entryAngle)*platR);
  scene.add(platform);
  teleportSurfaces.push(platform);
  walkSurfaces.push(platform);

  const stepMat = new THREE.MeshStandardMaterial({ color:0x121226, roughness:0.78, metalness:0.22, emissive:0x12003a, emissiveIntensity:0.2 });

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
    walkSurfaces.push(step);
  }

  // Store block (placeholder)
  const storeZ = lobbyR - 0.8;
  const store = new THREE.Mesh(
    new THREE.BoxGeometry(19.5, 8.2, 1.2),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.45, metalness:0.45 })
  );
  store.position.set(0, 3.0, storeZ - 0.45);
  scene.add(store);

  // Balcony above store
  const balcony = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.35, 9.5),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.55, metalness:0.35, emissive:0x0a0014, emissiveIntensity:0.22 })
  );
  balcony.position.set(0, 7.6, lobbyR - 5.0);
  scene.add(balcony);
  teleportSurfaces.push(balcony);
  walkSurfaces.push(balcony);

  // Spawn facing pit
  rig.position.set(0, 1.7, -26);
  rig.lookAt(0, 1.6, 0);

  say("✅ world init OK (safe world). If you still see black, the error will be shown in the log above.");
                   }
