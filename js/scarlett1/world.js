export async function init(ctx){
  const { THREE, scene, rig, teleportSurfaces, walkSurfaces, log } = ctx;
  const say = (m)=>{ try{ log(m); }catch(e){} console.log(m); };

  // --- Dimensions
  const lobbyR = 70;
  const wallH  = 16;

  const pitR = 11.0;
  const pitDepth = 4.2;
  const pitFloorY = -pitDepth + 0.06;

  // spawn ALWAYS faces center/table
  ctx.spawnPos.set(0, 1.75, -42);
  ctx.spawnLook.set(0, 1.55, 0);

  // bounds for Input.clampToBounds()
  ctx.bounds = {
    lobbyR: lobbyR - 1.0,
    pitOuterR: pitR + 0.55,
    pitInnerR: pitR - 0.65,
    pitTopY: 0.55
  };

  // --- Textures (simple but bright)
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
    for(let i=0;i<24000;i++){
      const x=(Math.random()*512)|0, y=(Math.random()*512)|0;
      const v=16+(Math.random()*60)|0;
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

  const floorMat = new THREE.MeshStandardMaterial({ map:carpetTex, roughness:0.95, metalness:0.03, side:THREE.DoubleSide });
  const wallMat  = new THREE.MeshStandardMaterial({ map:wallTex,  roughness:0.72, metalness:0.22, side:THREE.DoubleSide });
  const pitWallMat = new THREE.MeshStandardMaterial({ map:pitWallTex, roughness:0.92, metalness:0.08, side:THREE.DoubleSide });

  const metalDark = new THREE.MeshStandardMaterial({ color:0x101018, roughness:0.65, metalness:0.35 });
  const metalRail = new THREE.MeshStandardMaterial({ color:0x141426, roughness:0.55, metalness:0.60 });
  const neonBasic = (c)=> new THREE.MeshBasicMaterial({ color:c });

  // --- Lighting (brighter)
  scene.add(new THREE.AmbientLight(0xffffff, 0.70));
  const hemi = new THREE.HemisphereLight(0xffffff, 0x303070, 1.65);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);
  const top = new THREE.PointLight(0xffffff, 2.4, 650);
  top.position.set(0, 22, 0);
  scene.add(top);

  teleportSurfaces.length = 0;
  walkSurfaces.length = 0;

  // --- Main floor ring (hole over pit)
  const innerFloorR = pitR + 0.30;
  const floorRing = new THREE.Mesh(new THREE.RingGeometry(innerFloorR, lobbyR, 220, 1), floorMat);
  floorRing.rotation.x = -Math.PI/2;
  scene.add(floorRing);
  teleportSurfaces.push(floorRing);
  walkSurfaces.push(floorRing);

  // --- Walls
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 220, 1, true), wallMat);
  wall.position.y = wallH/2;
  scene.add(wall);

  // --- Pit wall + floor (sealed visually)
  const pitWall = new THREE.Mesh(new THREE.CylinderGeometry(pitR, pitR, pitDepth, 180, 1, true), pitWallMat);
  pitWall.position.y = -pitDepth/2 + 0.08;
  scene.add(pitWall);

  const pitFloor = new THREE.Mesh(new THREE.CircleGeometry(pitR-0.28, 180), floorMat);
  pitFloor.rotation.x = -Math.PI/2;
  pitFloor.position.y = pitFloorY;
  scene.add(pitFloor);
  teleportSurfaces.push(pitFloor);
  walkSurfaces.push(pitFloor);

  // --- Gap trim to cover any seam (glowing ring)
  const seamTrim = new THREE.Mesh(new THREE.TorusGeometry(pitR+0.32, 0.10, 10, 240), neonBasic(0x00ffff));
  seamTrim.rotation.x = Math.PI/2;
  seamTrim.position.y = 0.18;
  scene.add(seamTrim);

  // --- Stairs (with base/skirt + smooth rail)
  {
    const entryAngle = 0;
    const opening = Math.PI/7;

    const topPed = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 4.1), metalDark);
    topPed.position.set(Math.cos(entryAngle)*(pitR+1.9), 0.11, Math.sin(entryAngle)*(pitR+1.9));
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

    // stair skirt/base (fancy)
    const skirtMat = new THREE.MeshStandardMaterial({
      color:0x0d0d18, roughness:0.85, metalness:0.20,
      emissive:0x001133, emissiveIntensity:0.25
    });

    const railSideR = r - 1.05;
    const poleG = new THREE.CylinderGeometry(0.06,0.06,0.92,10);

    const railPoints = [];
    let lastStepPos = new THREE.Vector3();
    let lastAngle = aStart;

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

      if (i === stepCount - 1){
        lastStepPos.set(x,y,z);
        lastAngle = a;
      }

      // skirt panel behind each step (makes it look “built in”)
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.50, 0.10), skirtMat);
      skirt.position.set(x, y-0.20, z);
      skirt.rotation.y = a + Math.PI/2;
      // push slightly outward
      skirt.translateZ(0.46);
      scene.add(skirt);

      // poles
      const rx = Math.cos(a)*railSideR;
      const rz = Math.sin(a)*railSideR;

      const pole = new THREE.Mesh(poleG, metalRail);
      pole.position.set(rx, y+0.46, rz);
      scene.add(pole);

      railPoints.push(new THREE.Vector3(rx, y+0.92, rz));
    }

    const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 3.6), metalDark);
    bottomPlate.position.set(lastStepPos.x, pitFloorY + 0.08, lastStepPos.z);
    bottomPlate.rotation.y = lastAngle + Math.PI/2;
    scene.add(bottomPlate);
    teleportSurfaces.push(bottomPlate);
    walkSurfaces.push(bottomPlate);

    // smooth tube rail
    if (railPoints.length >= 4){
      const curve = new THREE.CatmullRomCurve3(railPoints);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 140, 0.075, 12, false),
        neonBasic(0x00ffff)
      );
      scene.add(tube);
    }
  }

  // --- Center pedestal + table + chairs (dead center)
  {
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 1.2, 48),
      new THREE.MeshStandardMaterial({ color:0x10101a, roughness:0.65, metalness:0.55, emissive:0x12003a, emissiveIntensity:0.15 })
    );
    pedestal.position.set(0, pitFloorY + 0.6, 0);
    scene.add(pedestal);
    teleportSurfaces.push(pedestal);
    walkSurfaces.push(pedestal);

    const neon = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.08, 10, 120), neonBasic(0xff00aa));
    neon.rotation.x = Math.PI/2;
    neon.position.set(0, pitFloorY + 1.15, 0);
    scene.add(neon);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.6, 0.22, 64),
      new THREE.MeshStandardMaterial({ color:0x1a1a24, roughness:0.45, metalness:0.35, emissive:0x002244, emissiveIntensity:0.18 })
    );
    table.position.set(0, pitFloorY + 1.28, 0);
    scene.add(table);

    // 6 chairs
    const chairMat = new THREE.MeshStandardMaterial({ color:0x141426, roughness:0.65, metalness:0.30 });
    for (let i=0;i<6;i++){
      const a = (i/6)*Math.PI*2;
      const cx = Math.cos(a)*3.75;
      const cz = Math.sin(a)*3.75;

      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.38,0.16,24), chairMat);
      seat.position.set(cx, pitFloorY + 0.60, cz);

      const back = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.55,0.55), chairMat);
      back.position.set(cx, pitFloorY + 0.92, cz);
      back.lookAt(0, back.position.y, 0);
      back.translateZ(-0.28);

      scene.add(seat);
      scene.add(back);

      teleportSurfaces.push(seat);
      walkSurfaces.push(seat);
    }
  }

  // Place rig at spawn now (Spine will also applySpawn)
  rig.position.copy(ctx.spawnPos);
  rig.lookAt(ctx.spawnLook);

  say("✅ World ready: sealed pit bounds + trim + stairs base + center pedestal/table/chairs.");
    }
