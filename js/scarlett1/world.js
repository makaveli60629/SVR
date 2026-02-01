import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

export async function init(ctx){
  const { scene, rig, teleportSurfaces, walkSurfaces, log } = ctx;
  const say = (m)=>{ try{ log(m); }catch(e){} console.log(m); };

  // ---------- helpers
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
  const neon = (c)=> new THREE.MeshBasicMaterial({ color:c });

  // ---------- dimensions
  const lobbyR = 78;         // bigger lobby
  const wallH  = 18;

  const pitR = 11.0;
  const pitDepth = 3.6;      // slightly shallower
  const pitFloorY = -pitDepth + 0.06;

  // store at +Z
  const storeAngle = Math.PI/2;

  // stair opening at +X (0 rad)
  const stairAngle = 0;
  const stairGap = Math.PI/8; // opening width

  // spawn faces center
  ctx.spawnPos.set(0, 1.75, -45);
  ctx.spawnLook.set(0, 1.55, 0);

  ctx.bounds = {
    lobbyR: lobbyR - 1.2,
    pitOuterR: pitR + 0.55,
    pitInnerR: pitR - 0.65,
    pitTopY: 0.55
  };

  teleportSurfaces.length = 0;
  walkSurfaces.length = 0;

  // ---------- lighting (brighter + more color)
  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  const hemi = new THREE.HemisphereLight(0xffffff, 0x2d2a60, 1.9);
  hemi.position.set(0, 50, 0);
  scene.add(hemi);

  const top = new THREE.PointLight(0xffffff, 2.8, 800);
  top.position.set(0, 24, 0);
  scene.add(top);

  // ring lights
  for (let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2;
    const p=new THREE.PointLight(0x00ffff, 1.4, 140);
    p.position.set(Math.cos(a)*30, 10.5, Math.sin(a)*30);
    scene.add(p);
  }

  // ---------- floor ring
  const innerFloorR = pitR + 0.30;
  const floorRing = new THREE.Mesh(new THREE.RingGeometry(innerFloorR, lobbyR, 240, 1), floorMat);
  floorRing.rotation.x = -Math.PI/2;
  scene.add(floorRing);
  teleportSurfaces.push(floorRing);
  walkSurfaces.push(floorRing);

  // ---------- outer wall
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(lobbyR, lobbyR, wallH, 240, 1, true), wallMat);
  wall.position.y = wallH/2;
  scene.add(wall);

  // ---------- pit wall + floor
  const pitWall = new THREE.Mesh(new THREE.CylinderGeometry(pitR, pitR, pitDepth, 200, 1, true), pitWallMat);
  pitWall.position.y = -pitDepth/2 + 0.08;
  scene.add(pitWall);

  const pitFloor = new THREE.Mesh(new THREE.CircleGeometry(pitR-0.28, 180), floorMat);
  pitFloor.rotation.x = -Math.PI/2;
  pitFloor.position.y = pitFloorY;
  scene.add(pitFloor);
  teleportSurfaces.push(pitFloor);
  walkSurfaces.push(pitFloor);

  // ---------- seam trim (ARCS, not full ring) – avoids blocking stairs
  function addArcTrim(a0, a1, y, r, color){
    const pts=[];
    const steps=90;
    for (let i=0;i<=steps;i++){
      const t=i/steps;
      const a=a0 + (a1-a0)*t;
      pts.push(new THREE.Vector3(Math.cos(a)*r, y, Math.sin(a)*r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.08, 12, false), neon(color));
    scene.add(tube);
  }

  const trimR = pitR + 0.34;
  const yTrim = 0.12;

  // skip stair opening
  addArcTrim(stairAngle + stairGap, stairAngle + Math.PI*2 - stairGap, yTrim, trimR, 0x00ffff);

  // ---------- stairs (kept from your improved look + nicer base)
  {
    const entryAngle = stairAngle;
    const opening = stairGap;

    const topPed = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 4.2), metalDark);
    topPed.position.set(Math.cos(entryAngle)*(pitR+2.1), 0.11, Math.sin(entryAngle)*(pitR+2.1));
    topPed.rotation.y = entryAngle;
    scene.add(topPed);
    teleportSurfaces.push(topPed);
    walkSurfaces.push(topPed);

    const stepCount = 10;
    const stepW = 2.2;
    const stepD = 1.02;

    const yTop = 0.84;
    const yBot = pitFloorY + 0.26;
    const stepH = (yTop - yBot) / stepCount;

    const r = pitR - 0.60;
    const aStart = entryAngle + opening*0.45;
    const aSpan  = Math.PI * 0.30;

    const stepMat = new THREE.MeshStandardMaterial({
      color:0x121226, roughness:0.78, metalness:0.22,
      emissive:0x12003a, emissiveIntensity:0.22
    });

    const skirtMat = new THREE.MeshStandardMaterial({
      color:0x0b0b16, roughness:0.85, metalness:0.22,
      emissive:0x001133, emissiveIntensity:0.35
    });

    const railSideR = r - 1.05;
    const poleG = new THREE.CylinderGeometry(0.06,0.06,0.92,10);

    const railPts = [];
    let lastPos = new THREE.Vector3();
    let lastA = aStart;

    for (let i=0;i<stepCount;i++){
      const t=(i+1)/stepCount;
      const a=aStart + aSpan*t;

      const x=Math.cos(a)*r;
      const z=Math.sin(a)*r;
      const y=yTop - (i+1)*stepH;

      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.18, stepD), stepMat);
      step.position.set(x,y,z);
      step.rotation.y = a + Math.PI/2;
      scene.add(step);
      teleportSurfaces.push(step);
      walkSurfaces.push(step);

      // fancy base skirt behind each step
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.62, 0.12), skirtMat);
      skirt.position.set(x, y-0.22, z);
      skirt.rotation.y = a + Math.PI/2;
      skirt.translateZ(0.50);
      scene.add(skirt);

      if (i === stepCount-1){ lastPos.set(x,y,z); lastA=a; }

      // poles
      const rx=Math.cos(a)*railSideR;
      const rz=Math.sin(a)*railSideR;
      const pole=new THREE.Mesh(poleG, metalRail);
      pole.position.set(rx, y+0.46, rz);
      scene.add(pole);

      railPts.push(new THREE.Vector3(rx, y+0.92, rz));
    }

    const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 4.0), metalDark);
    bottomPlate.position.set(lastPos.x, pitFloorY + 0.08, lastPos.z);
    bottomPlate.rotation.y = lastA + Math.PI/2;
    scene.add(bottomPlate);
    teleportSurfaces.push(bottomPlate);
    walkSurfaces.push(bottomPlate);

    // smooth rail
    if (railPts.length >= 4){
      const curve=new THREE.CatmullRomCurve3(railPts);
      const tube=new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.075, 12, false), neon(0x00ffff));
      scene.add(tube);
    }
  }

  // ---------- center pedestal + table + chairs
  {
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 1.2, 48),
      new THREE.MeshStandardMaterial({
        color:0x10101a, roughness:0.65, metalness:0.55,
        emissive:0x12003a, emissiveIntensity:0.15
      })
    );
    pedestal.position.set(0, pitFloorY + 0.6, 0);
    scene.add(pedestal);
    teleportSurfaces.push(pedestal);
    walkSurfaces.push(pedestal);

    const neonRing = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.08, 10, 140), neon(0xff00aa));
    neonRing.rotation.x = Math.PI/2;
    neonRing.position.set(0, pitFloorY + 1.15, 0);
    scene.add(neonRing);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.6, 0.22, 64),
      new THREE.MeshStandardMaterial({
        color:0x1a1a24, roughness:0.45, metalness:0.35,
        emissive:0x002244, emissiveIntensity:0.18
      })
    );
    table.position.set(0, pitFloorY + 1.28, 0);
    scene.add(table);

    const chairMat = new THREE.MeshStandardMaterial({ color:0x141426, roughness:0.65, metalness:0.30 });
    for (let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2;
      const cx=Math.cos(a)*3.75;
      const cz=Math.sin(a)*3.75;

      const seat=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.38,0.16,24), chairMat);
      seat.position.set(cx, pitFloorY + 0.60, cz);

      const back=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.55,0.55), chairMat);
      back.position.set(cx, pitFloorY + 0.92, cz);
      back.lookAt(0, back.position.y, 0);
      back.translateZ(-0.28);

      scene.add(seat); scene.add(back);
      teleportSurfaces.push(seat); walkSurfaces.push(seat);
    }
  }

  // ---------- store facade + balcony above it
  const store = new THREE.Group();
  scene.add(store);

  const storeR = lobbyR - 0.8;
  const storeX = Math.cos(storeAngle)*storeR;
  const storeZ = Math.sin(storeAngle)*storeR;
  store.position.set(storeX, 0, storeZ);
  store.rotation.y = -storeAngle;

  const storeBody = new THREE.Mesh(new THREE.BoxGeometry(14, 6.0, 3.0), new THREE.MeshStandardMaterial({
    color:0x0f0f18, roughness:0.65, metalness:0.35,
    emissive:0x001122, emissiveIntensity:0.25
  }));
  storeBody.position.set(0, 3.0, -1.3);
  store.add(storeBody);

  // store sign
  const sign = new THREE.Mesh(new THREE.BoxGeometry(13.8, 1.0, 0.25), neon(0xff00aa));
  sign.position.set(0, 6.2, -2.5);
  store.add(sign);

  // glass windows
  const glassMat = new THREE.MeshStandardMaterial({
    color:0x66ccff, transparent:true, opacity:0.18, roughness:0.05, metalness:0.2
  });
  const winL = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.2, 0.08), glassMat);
  const winR = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.2, 0.08), glassMat);
  winL.position.set(-3.7, 3.2, -2.82);
  winR.position.set( 3.7, 3.2, -2.82);
  store.add(winL); store.add(winR);

  // spotlights under balcony hood
  for (let i=-3;i<=3;i+=3){
    const sp = new THREE.SpotLight(0x00ffff, 2.5, 30, Math.PI/7, 0.45, 1.0);
    sp.position.set(i*1.4, 6.8, -1.5);
    sp.target.position.set(i*1.4, 2.8, -2.8);
    store.add(sp);
    store.add(sp.target);
  }

  // balcony platform
  const balcony = new THREE.Mesh(new THREE.BoxGeometry(16, 0.25, 6.0), metalDark);
  balcony.position.set(0, 8.0, -1.3);
  store.add(balcony);
  teleportSurfaces.push(balcony);
  walkSurfaces.push(balcony);

  // balcony rails (simple)
  const rail = new THREE.Mesh(new THREE.BoxGeometry(16, 1.0, 0.15), neon(0x00ffff));
  rail.position.set(0, 8.6, -4.2);
  store.add(rail);

  // ---------- avatar loading (store displays + guards + walker)
  const loader = new GLTFLoader();

  async function loadAvatar(url){
    return new Promise((resolve)=>{
      loader.load(url, (gltf)=> resolve(gltf.scene), ()=>{}, (err)=>{
        console.warn("GLTF load fail", url, err);
        resolve(null);
      });
    });
  }

  // IMPORTANT: correct relative path on GitHub Pages
  const PATH = "assets/avatars/";

  const male = await loadAvatar(PATH + "male.glb");
  const ninja = await loadAvatar(PATH + "ninja.glb");
  const combat = await loadAvatar(PATH + "combat_ninja_inspired_by_jin_roh_wolf_brigade.glb");

  // store display: put three models behind each window
  function placeInWindow(model, x, z){
    if (!model) return;
    const m = model.clone(true);
    m.position.set(x, 1.05, z);
    m.scale.setScalar(1.25);
    m.rotation.y = Math.PI; // face outward
    store.add(m);
  }

  // left window
  placeInWindow(male, -4.6, -2.35);
  placeInWindow(ninja, -3.7, -2.35);
  placeInWindow(combat, -2.8, -2.35);

  // right window
  placeInWindow(male,  2.8, -2.35);
  placeInWindow(ninja, 3.7, -2.35);
  placeInWindow(combat,4.6, -2.35);

  // guards at pit entrance (top of stairs)
  function placeGuard(model, x, z, rotY){
    if (!model) return;
    const m = model.clone(true);
    m.position.set(x, 0.11, z);
    m.scale.setScalar(1.55);
    m.rotation.y = rotY;
    scene.add(m);
    return m;
  }

  const guardR = placeGuard(ninja,  Math.cos(stairAngle)*(pitR+4.2),  Math.sin(stairAngle)*(pitR+4.2), -stairAngle + Math.PI/2);
  const guardL = placeGuard(combat, Math.cos(stairAngle)*(pitR+5.2),  Math.sin(stairAngle)*(pitR+3.2), -stairAngle + Math.PI/2);

  // walking male around lobby ring
  let walker = null;
  if (male){
    walker = male.clone(true);
    walker.scale.setScalar(1.4);
    walker.position.set(0, 0.11, -20);
    scene.add(walker);
  }

  // ---------- columns + neon accents (beautify)
  for (let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2;
    const x=Math.cos(a)*(lobbyR-1.4);
    const z=Math.sin(a)*(lobbyR-1.4);

    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,10,18), metalDark);
    col.position.set(x, 5.0, z);
    scene.add(col);

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.75,0.08,10,80), neon(0x00ffff));
    band.rotation.x = Math.PI/2;
    band.position.set(x, 2.4, z);
    scene.add(band);
  }

  // updates: walker motion
  ctx.updates.push((dt)=>{
    if (walker){
      walker.userData.t = (walker.userData.t || 0) + dt*0.35;
      const a = walker.userData.t;
      const rr = 28;
      walker.position.x = Math.cos(a)*rr;
      walker.position.z = Math.sin(a)*rr;
      walker.position.y = 0.12;
      walker.lookAt(0, walker.position.y, 0);
    }
  });

  // apply spawn now
  rig.position.copy(ctx.spawnPos);
  rig.lookAt(ctx.spawnLook);

  say("✅ World restored: no trim blocking stairs + balcony + store windows + avatars + walker + brighter lobby.");
      }
