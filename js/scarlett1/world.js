import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export async function init(ctx){
  const { scene, teleportSurfaces, walkSurfaces, rig, log } = ctx;
  const say = (m)=>{ try{ log(m); }catch(e){} console.log(m); };

  // bounds for movement clamp
  const lobbyR = 70;
  const pitR = 10;
  const pitDepth = 3.2;
  const pitFloorY = -pitDepth + 0.06;

  ctx.bounds = {
    lobbyR: lobbyR - 1.2,
    pitOuterR: pitR + 0.55,
    pitInnerR: pitR - 0.65,
    pitTopY: 0.55
  };

  // spawn
  ctx.spawnPos.set(0, 1.75, -42);
  ctx.spawnLook.set(0, 1.55, 0);

  teleportSurfaces.length = 0;
  walkSurfaces.length = 0;

  // lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const hemi = new THREE.HemisphereLight(0xffffff, 0x2d2a60, 1.8);
  hemi.position.set(0, 40, 0);
  scene.add(hemi);

  const top = new THREE.PointLight(0xffffff, 2.2, 700);
  top.position.set(0, 22, 0);
  scene.add(top);

  // floor material
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2a1650,
    roughness: 0.95,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  // lobby floor ring (with pit hole)
  const floorRing = new THREE.Mesh(
    new THREE.RingGeometry(pitR + 0.3, lobbyR, 200, 1),
    floorMat
  );
  floorRing.rotation.x = -Math.PI / 2;
  scene.add(floorRing);
  teleportSurfaces.push(floorRing);
  walkSurfaces.push(floorRing);

  // pit wall
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitR, pitR, pitDepth, 160, 1, true),
    new THREE.MeshStandardMaterial({ color:0x0a0a12, roughness:0.9, metalness:0.12, side:THREE.DoubleSide })
  );
  pitWall.position.y = -pitDepth/2 + 0.08;
  scene.add(pitWall);

  // pit floor
  const pitFloor = new THREE.Mesh(new THREE.CircleGeometry(pitR - 0.25, 140), floorMat);
  pitFloor.rotation.x = -Math.PI/2;
  pitFloor.position.y = pitFloorY;
  scene.add(pitFloor);
  teleportSurfaces.push(pitFloor);
  walkSurfaces.push(pitFloor);

  // trim (arc that leaves opening at +X so stairs won’t be blocked)
  const stairAngle = 0;
  const gap = Math.PI/7;
  function addArcTrim(a0, a1){
    const pts=[];
    const steps=80;
    const r = pitR + 0.35;
    const y = 0.12;
    for(let i=0;i<=steps;i++){
      const t=i/steps;
      const a=a0+(a1-a0)*t;
      pts.push(new THREE.Vector3(Math.cos(a)*r, y, Math.sin(a)*r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 180, 0.08, 12, false),
      new THREE.MeshBasicMaterial({ color:0x00ffff })
    );
    scene.add(tube);
  }
  addArcTrim(stairAngle + gap, stairAngle + Math.PI*2 - gap);

  // very simple stairs (safe + walkable) at +X
  {
    const stepMat = new THREE.MeshStandardMaterial({ color:0x141426, roughness:0.8, metalness:0.25 });
    const steps = 10;
    const yTop = 0.85;
    const yBot = pitFloorY + 0.25;
    const stepH = (yTop - yBot)/steps;

    const r = pitR - 0.65;
    const aStart = 0.20;
    const aSpan = Math.PI * 0.25;

    let last = null;

    for(let i=0;i<steps;i++){
      const t=(i+1)/steps;
      const a=aStart + aSpan*t;
      const x=Math.cos(a)*r;
      const z=Math.sin(a)*r;
      const y=yTop - (i+1)*stepH;

      const step = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 1.0), stepMat);
      step.position.set(x,y,z);
      step.rotation.y = a + Math.PI/2;
      scene.add(step);
      teleportSurfaces.push(step);
      walkSurfaces.push(step);
      last = step;
    }

    if (last){
      const plate = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 4.0), stepMat);
      plate.position.set(last.position.x, pitFloorY + 0.08, last.position.z);
      plate.rotation.y = last.rotation.y;
      scene.add(plate);
      teleportSurfaces.push(plate);
      walkSurfaces.push(plate);
    }
  }

  rig.position.copy(ctx.spawnPos);
  rig.lookAt(ctx.spawnLook);

  say("✅ world init OK (no 'three' import, world path fixed, safe pit + stairs).");
}
