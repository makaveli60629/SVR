export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, walkSurfaces, log } = ctx;
  const say=(m)=>{ try{log(m);}catch(e){} console.log(m); };

  const lobbyR = 70;
  const wallH  = 16;

  const pitR = 11.0;
  const pitDepth = 4.2;
  const pitFloorY = -pitDepth + 0.06;

  const entryAngle = 0;

  // stable spawn (don’t force yaw flips; just look at center)
  ctx.spawnPos.set(0, 1.75, -42);
  ctx.spawnLook.set(0, 1.55, 0);

  function makeCanvasTex(drawFn, rx=1, ry=1){
    const c=document.createElement("canvas");
    c.width=512; c.height=512;
    const g=c.getContext("2d");
    drawFn(g,c);
    const t=new THREE.CanvasTexture(c);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(rx,ry);
    t.anisotropy=6;
    return t;
  }

  const carpetTex = makeCanvasTex((g)=>{
    g.fillStyle="#2a1650"; g.fillRect(0,0,512,512);
    for(let i=0;i<22000;i++){
      const x=(Math.random()*512)|0, y=(Math.random()*512)|0;
      const v=16+(Math.random()*52)|0;
      g.fillStyle=`rgb(${v},${(v*0.45)|0},${(v*1.35)|0})`;
      g.fillRect(x,y,1,1);
    }
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
    const bw=92,bh=54;
    for(let y=0;y<512;y+=bh){
      for(let x=0;x<512;x+=bw){
        const off=((y/bh)|0)%2?bw/2:0;
        const rx=x+off;
        const col=14+((Math.random()*18)|0);
        g.fillStyle=`rgb(${col},${col},${col+10})`;
        g.fillRect(rx,y,bw-6,bh-6);
        g.strokeStyle="rgba(0,200,255,0.08)";
        g.strokeRect(rx,y,bw-6,bh-6);
      }
    }
  }, 7, 2);

  const pitFloorTex = makeCanvasTex((g)=>{
    g.fillStyle="#1b0d35"; g.fillRect(0,0,512,512);
    for(let i=0;i<24000;i++){
      const x=(Math.random()*512)|0, y=(Math.random()*512)|0;
      const v=10+(Math.random()*34)|0;
      g.fillStyle=`rgb(${v},${(v*0.35)|0},${(v*1.25)|0})`;
      g.fillRect(x,y,1,1);
    }
  }, 5, 5);

  const floorMat = new THREE.MeshStandardMaterial({ map:carpetTex, roughness:0.95, metalness:0.03, side:THREE.DoubleSide });
  const wallMat  = new THREE.MeshStandardMaterial({ map:wallTex,  roughness:0.72, metalness:0.22, side:THREE.DoubleSide });
  const pitWallMat = new THREE.MeshStandardMaterial({ map:pitWallTex, roughness:0.92, metalness:0.08, side:THREE.DoubleSide });
  const pitFloorMat= new THREE.MeshStandardMaterial({ map:pitFloorTex, roughness:0.98, metalness:0.02, side:THREE.DoubleSide });

  const metalDark = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.65, metalness:0.35 });
  const metalRail = new THREE.MeshStandardMaterial({ color:0x141426, roughness:0.55, metalness:0.60 });
  const neonBasic = (c)=> new THREE.MeshBasicMaterial({ color:c });

  // lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const hemi = new THREE.HemisphereLight(0xffffff, 0x303070, 1.55);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);
  const top = new THREE.PointLight(0xffffff, 2.2, 650);
  top.position.set(0, 22, 0);
  scene.add(top);

  // surfaces
  teleportSurfaces.length = 0;
  walkSurfaces.length = 0;

  // floor ring (NO floor over pit)
  const innerFloorR = pitR + 0.30;
  const floorRing = new THREE.Mesh(new THREE.RingGeometry(innerFloorR, lobbyR, 220, 1), floorMat);
  floorRing.rotation.x = -Math.PI/2;
  scene.add(floorRing);
  teleportSurfaces.push(floorRing);
  walkSurfaces.push(floorRing);

  // walls
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 220, 1, true), wallMat);
  wall.position.y = wallH/2;
  scene.add(wall);

  // pit wall + floor
  const pitWall = new THREE.Mesh(new THREE.CylinderGeometry(pitR, pitR, pitDepth, 180, 1, true), pitWallMat);
  pitWall.position.y = -pitDepth/2 + 0.08;
  scene.add(pitWall);

  const pitFloor = new THREE.Mesh(new THREE.CircleGeometry(pitR-0.28, 180), pitFloorMat);
  pitFloor.rotation.x = -Math.PI/2;
  pitFloor.position.y = pitFloorY;
  scene.add(pitFloor);
  teleportSurfaces.push(pitFloor);
  walkSurfaces.push(pitFloor);

  // trim border
  const trim = new THREE.Mesh(new THREE.TorusGeometry(pitR+0.25, 0.11, 10, 200), neonBasic(0xff00aa));
  trim.rotation.x = Math.PI/2;
  trim.position.y = 0.22;
  scene.add(trim);

  // stairs + smooth curved rail
  {
    const opening = Math.PI/7;

    const platR = (pitR + 0.3) + 0.95;
    const topPed = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 4.1), metalDark);
    topPed.position.set(Math.cos(entryAngle)*platR, 0.11, Math.sin(entryAngle)*platR);
    topPed.rotation.y = entryAngle;
    scene.add(topPed);
    teleportSurfaces.push(topPed);
    walkSurfaces.push(topPed);

    const stepCount = 11;
    const stepW = 2.12;
    const stepD = 1.00;

    const yTop = 0.86;
    const yBot = pitFloorY + 0.28;
    const stepH = (yTop - yBot) / stepCount;

    const r = pitR - 0.62;
    const aStart = entryAngle + opening*0.45;
    const aSpan  = Math.PI * 0.30;

    const stepMat = new THREE.MeshStandardMaterial({
      color:0x121226, roughness:0.78, metalness:0.22,
      emissive:0x12003a, emissiveIntensity:0.22
    });

    // RIGHT side rail (inner toward pit center)
    const railSideR = r - 1.05;

    const poleG = new THREE.CylinderGeometry(0.06,0.06,0.92,10);

    let lastStepPos = new THREE.Vector3();
    const railPoints = [];

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
      walkSurfaces.push(step);

      if (i === stepCount - 1) lastStepPos.set(x,y,z);

      // poles
      const rx = Math.cos(a)*railSideR;
      const rz = Math.sin(a)*railSideR;

      const pole = new THREE.Mesh(poleG, metalRail);
      pole.position.set(rx, y+0.46, rz);
      scene.add(pole);

      // points for smooth handrail
      railPoints.push(new THREE.Vector3(rx, y+0.92, rz));
    }

    // bottom plate under last step
    const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 3.6), metalDark);
    bottomPlate.position.set(lastStepPos.x, pitFloorY + 0.08, lastStepPos.z);
    scene.add(bottomPlate);
    teleportSurfaces.push(bottomPlate);
    walkSurfaces.push(bottomPlate);

    // ✅ one continuous smooth curved handrail (tube)
    if (railPoints.length >= 4){
      const curve = new THREE.CatmullRomCurve3(railPoints);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 120, 0.07, 10, false),
        neonBasic(0x00ffff)
      );
      scene.add(tube);
    }
  }

  // apply spawn
  rig.position.copy(ctx.spawnPos);
  rig.lookAt(ctx.spawnLook);

  say("✅ World: smooth stair handrail tube + tighter stairs.");
}
