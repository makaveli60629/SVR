// SVR/js/scarlett1/world.js
// A-FULL-RESTORE: circular lobby + OPEN pit (no cover) + stairs + center table + store + balcony + jumbotrons + guard + roaming bots
// IMPORTANT FIX: floor is a RING with a HOLE so you can see and enter the pit.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const AVATARS = {
  male:   './assets/avatars/male.glb',
  female: './assets/avatars/female.glb',
  ninja:  './assets/avatars/ninja.glb',
  combat: './assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb',
};

function makeCanvasTexture(drawFn, size=512){
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  drawFn(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function makeCarpetTexture(){
  return makeCanvasTexture((g, s)=>{
    g.fillStyle = '#2a1047'; g.fillRect(0,0,s,s);
    for (let y=0;y<s;y+=8){
      g.fillStyle = (y%16===0) ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)';
      g.fillRect(0,y,s,4);
    }
    for (let x=0;x<s;x+=10){
      g.fillStyle = (x%20===0) ? 'rgba(0,255,255,0.025)' : 'rgba(255,0,160,0.02)';
      g.fillRect(x,0,2,s);
    }
    g.strokeStyle = 'rgba(0,220,255,0.18)'; g.lineWidth = 10;
    g.beginPath(); g.arc(s/2,s/2,s*0.37,0,Math.PI*2); g.stroke();
    g.strokeStyle = 'rgba(255,40,140,0.15)'; g.lineWidth = 6;
    g.beginPath(); g.arc(s/2,s/2,s*0.45,0,Math.PI*2); g.stroke();
  }, 512);
}

function makeWallTexture(){
  return makeCanvasTexture((g, s)=>{
    g.fillStyle = '#07080c'; g.fillRect(0,0,s,s);
    for (let y=0;y<s;y+=64){
      for (let x=0;x<s;x+=64){
        g.fillStyle = ((x+y)/64)%2===0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,255,255,0.018)';
        g.fillRect(x+3,y+3,58,58);
        g.strokeStyle = 'rgba(255,40,140,0.06)';
        g.strokeRect(x+3,y+3,58,58);
      }
    }
  }, 512);
}

function normalizeHuman(root, targetHeight=1.7){
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  root.position.sub(center);

  const h = Math.max(size.y, size.x, size.z, 0.001);
  root.scale.setScalar(targetHeight / h);

  const box2 = new THREE.Box3().setFromObject(root);
  root.position.y -= box2.min.y;
}

function addSoftEmissive(root){
  root.traverse(o=>{
    if (!o.isMesh) return;
    const apply = (mat)=>{
      if (!mat) return;
      if ('emissive' in mat){
        mat.emissive = mat.emissive || new THREE.Color(0x000000);
        mat.emissive.add(new THREE.Color(0x001000));
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.35);
      }
      mat.needsUpdate = true;
    };
    if (Array.isArray(o.material)) o.material.forEach(apply);
    else apply(o.material);
  });
}

function makeNeonSign(text='SCARLETT STORE'){
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0,0,c.width,c.height);
  g.font = 'bold 120px system-ui, Segoe UI, Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  g.shadowColor = 'rgba(255,40,140,0.85)';
  g.shadowBlur = 28;
  g.fillStyle = 'rgba(255,90,200,0.95)';
  g.fillText(text, c.width/2, c.height/2);

  g.shadowColor = 'rgba(0,220,255,0.85)';
  g.shadowBlur = 14;
  g.fillStyle = 'rgba(220,255,255,0.9)';
  g.fillText(text, c.width/2, c.height/2);

  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent:true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.4), mat);
  return mesh;
}

function makeGlassBox(w,h,d){
  const g = new THREE.BoxGeometry(w,h,d);
  // Standard material (much cheaper than MeshPhysicalMaterial on Quest)
  const m = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    roughness: 0.15,
    metalness: 0.0,
    transparent: true,
    opacity: 0.22,
    emissive: new THREE.Color(0x001018),
    emissiveIntensity: 0.35,
  });
  return new THREE.Mesh(g,m);
}

export async function initWorld(ctx){
  const { THREE: T, scene, rig, Bus } = ctx;
  const teleportSurfaces = [];
  const updaters = [];

  // lighting
  scene.add(new T.AmbientLight(0xffffff, 0.62));
  const key = new T.DirectionalLight(0xffffff, 0.85);
  key.position.set(10, 16, 10); scene.add(key);
  const rim = new T.DirectionalLight(0x77ccff, 0.55);
  rim.position.set(-12, 10, -10); scene.add(rim);
  const top = new T.PointLight(0xffffff, 1.15, 140);
  top.position.set(0, 12.5, 0); scene.add(top);
  for (let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2;
    const p=new T.PointLight(i%2?0xff2a8a:0x00d6ff, 0.75, 40);
    p.position.set(Math.cos(a)*10.5, 6.6, Math.sin(a)*10.5);
    scene.add(p);
  }

  // dimensions
  const outerR = 22.0;
  const wallR  = 24.0;
  const pitR   = 7.2;
  const pitDepth = 3.4;
  const entranceAngle = Math.PI/2;

  // materials
  const carpetTex = makeCarpetTexture(); carpetTex.repeat.set(6,6);
  const wallTex = makeWallTexture(); wallTex.repeat.set(10,3);

  const matCarpet = new T.MeshStandardMaterial({ map: carpetTex, roughness:0.98, metalness:0.0 });
  const matWall = new T.MeshStandardMaterial({ map: wallTex, roughness:0.9, metalness:0.0, side:T.DoubleSide });
  const matRail = new T.MeshStandardMaterial({
    color: 0x00d6ff, roughness:0.25, metalness:0.75,
    emissive: new T.Color(0x001018), emissiveIntensity: 1.35
  });
  const matTrim = new T.MeshStandardMaterial({
    color: 0xff2a8a, roughness:0.25, metalness:0.25,
    emissive: new T.Color(0x250010), emissiveIntensity: 2.2
  });

  // ===== LOBBY FLOOR (RING WITH HOLE) =====
  const shape = new T.Shape();
  shape.absarc(0,0,outerR,0,Math.PI*2,false);
  const hole = new T.Path();
  hole.absarc(0,0,pitR+0.25,0,Math.PI*2,true);
  shape.holes.push(hole);

  const floorGeo = new T.ExtrudeGeometry(shape, { depth:0.30, bevelEnabled:false, curveSegments:120 });
  floorGeo.rotateX(-Math.PI/2);
  floorGeo.translate(0, 0.0, 0);

  const floor = new T.Mesh(floorGeo, matCarpet);
  floor.position.y = 0.0;
  scene.add(floor);
  teleportSurfaces.push(floor);

  // walls + ceiling
  const walls = new T.Mesh(new T.CylinderGeometry(wallR, wallR, 9.0, 90, 1, true), matWall);
  walls.position.y = 4.4; scene.add(walls);
  const ceiling = new T.Mesh(new T.CylinderGeometry(wallR, wallR, 0.25, 90),
    new T.MeshStandardMaterial({ color: 0x06070b, roughness: 0.95 })
  );
  ceiling.position.y = 9.0; scene.add(ceiling);

  // pit wall + bottom
  const pitWall = new T.Mesh(new T.CylinderGeometry(pitR, pitR, pitDepth, 72, 1, true), matWall);
  pitWall.position.y = -pitDepth/2 - 0.05; scene.add(pitWall);

  const pitBottom = new T.Mesh(
    new T.CylinderGeometry(pitR-0.35, pitR-0.35, 0.24, 72),
    new T.MeshStandardMaterial({ color: 0x14121c, roughness: 0.95 })
  );
  pitBottom.position.y = -pitDepth - 0.17; scene.add(pitBottom);
  teleportSurfaces.push(pitBottom);

  // pit trim + rail with entrance gap
  const gap = 0.55;
  const arcLen = Math.PI*2 - gap;
  const start = entranceAngle + gap/2;

  const trimArc = new T.Mesh(new T.TorusGeometry(pitR + 0.12, 0.09, 10, 120, arcLen), matTrim);
  trimArc.rotation.x = Math.PI/2; trimArc.rotation.z = start; trimArc.position.y = 0.08; scene.add(trimArc);

  const railArc = new T.Mesh(new T.TorusGeometry(pitR + 0.72, 0.10, 8, 140, arcLen), matRail);
  railArc.rotation.x = Math.PI/2; railArc.rotation.z = start; railArc.position.y = 1.02; scene.add(railArc);

  const postCount = 28;
  for (let i=0;i<postCount;i++){
    const a=(i/postCount)*Math.PI*2;
    const da = Math.atan2(Math.sin(a-entranceAngle), Math.cos(a-entranceAngle));
    if (Math.abs(da) < gap/2) continue;
    const post = new T.Mesh(new T.CylinderGeometry(0.06,0.06,1.02, 12), matRail);
    post.position.set(Math.cos(a)*(pitR+0.72), 0.52, Math.sin(a)*(pitR+0.72));
    scene.add(post);
  }

  // stairs
  const steps = 8, stepH = pitDepth/steps, stepD = 0.62, stepW = 2.3;
  const stairs = new T.Group(); stairs.name='stairs';
  stairs.position.set(0, 0, pitR + 0.45);
  stairs.rotation.y = Math.PI;
  scene.add(stairs);

  const matStair = new T.MeshStandardMaterial({ color: 0x242733, roughness: 0.95 });
  const topLand = new T.Mesh(new T.BoxGeometry(stepW, 0.20, 1.35), matStair);
  topLand.position.set(0, 0.10, -0.85); stairs.add(topLand); teleportSurfaces.push(topLand);

  for (let i=0;i<steps;i++){
    const y = -(i+1)*stepH;
    const z = -(i*stepD);
    const s = new T.Mesh(new T.BoxGeometry(stepW, 0.20, stepD), matStair);
    s.position.set(0, y + 0.10, z);
    stairs.add(s); teleportSurfaces.push(s);
  }

  const bottomLand = new T.Mesh(new T.BoxGeometry(stepW, 0.20, 1.35), matStair);
  bottomLand.position.set(0, -pitDepth - 0.10, -((steps-1)*stepD) - 0.85);
  stairs.add(bottomLand); teleportSurfaces.push(bottomLand);

  // center pedestal + table + 8 seats
  const pedestal = new T.Mesh(
    new T.CylinderGeometry(1.55, 1.75, 0.85, 64),
    new T.MeshStandardMaterial({ color: 0x0e1016, roughness: 0.7, metalness: 0.2 })
  );
  pedestal.position.set(0, -pitDepth + 0.30, 0); scene.add(pedestal); teleportSurfaces.push(pedestal);

  const tableTop = new T.Mesh(
    new T.CylinderGeometry(2.25, 2.25, 0.14, 96),
    new T.MeshStandardMaterial({ color: 0x161b25, roughness: 0.35, metalness: 0.65 })
  );
  tableTop.position.set(0, -pitDepth + 0.82, 0); scene.add(tableTop);

  const passLine = new T.Mesh(
    new T.TorusGeometry(1.55, 0.03, 10, 140),
    new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.2 })
  );
  passLine.rotation.x = Math.PI/2;
  passLine.position.set(0, -pitDepth + 0.90, 0); scene.add(passLine);

  const logo = new T.Mesh(
    new T.CircleGeometry(0.55, 48),
    new T.MeshStandardMaterial({ color: 0xff2a8a, roughness: 0.3, metalness: 0.25,
      emissive: new T.Color(0x250010), emissiveIntensity: 2.0 })
  );
  logo.rotation.x = -Math.PI/2;
  logo.position.set(0, -pitDepth + 0.91, 0); scene.add(logo);

  const seatR = 3.0;
  for (let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    const seat = new T.Mesh(new T.BoxGeometry(0.55, 0.75, 0.55),
      new T.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.92 })
    );
    seat.position.set(Math.cos(a)*seatR, -pitDepth + 0.40, Math.sin(a)*seatR);
    seat.lookAt(0, seat.position.y, 0);
    scene.add(seat);
  }

  // store + balcony
  const store = new T.Group(); store.name='store';
  store.position.set(0, 0, -18.0);
  scene.add(store);

  const storeFrame = new T.Mesh(new T.BoxGeometry(9.0, 3.2, 1.4),
    new T.MeshStandardMaterial({ color: 0x0d0f15, roughness: 0.9 })
  );
  storeFrame.position.set(0, 1.6, 0); store.add(storeFrame);

  const hood = new T.Mesh(new T.BoxGeometry(9.4, 0.30, 2.2),
    new T.MeshStandardMaterial({ color: 0x10131a, roughness: 0.85 })
  );
  hood.position.set(0, 3.05, 0.45); store.add(hood);

  for (let i=-3;i<=3;i+=2){
    const s = new T.SpotLight(0x77ccff, 1.0, 18, Math.PI/6, 0.35, 1.0);
    s.position.set(i, 3.0, 1.2);
    s.target.position.set(i, 1.2, 0.5);
    store.add(s); store.add(s.target);
  }

  const sign = makeNeonSign('SCARLETT STORE');
  sign.position.set(0, 2.35, 0.72); store.add(sign);

  const balconyPlat = new T.Mesh(new T.BoxGeometry(9.6, 0.22, 4.2),
    new T.MeshStandardMaterial({ color: 0x0b0c12, roughness: 0.95 })
  );
  balconyPlat.position.set(0, 4.1, -0.4); store.add(balconyPlat);
  teleportSurfaces.push(balconyPlat);

  const railFront = new T.Mesh(new T.BoxGeometry(9.6, 0.08, 0.08), matRail);
  railFront.position.set(0, 4.6, 1.55); store.add(railFront);
  const railLeft = new T.Mesh(new T.BoxGeometry(0.08, 0.08, 4.0), matRail);
  railLeft.position.set(-4.75, 4.6, -0.35); store.add(railLeft);
  const railRight = new T.Mesh(new T.BoxGeometry(0.08, 0.08, 4.0), matRail);
  railRight.position.set(4.75, 4.6, -0.35); store.add(railRight);
  for (let x=-4.6; x<=4.6; x+=1.15){
    const p = new T.Mesh(new T.CylinderGeometry(0.05,0.05,0.95,10), matRail);
    p.position.set(x, 4.15+0.95/2, 1.55); store.add(p);
  }

  // doors + jumbotrons
  function addDoorAndJumbo(angle){
    const g = new T.Group();
    const r = wallR - 0.8;
    g.position.set(Math.cos(angle)*r, 0, Math.sin(angle)*r);
    g.rotation.y = -angle + Math.PI/2;
    scene.add(g);

    const door = new T.Mesh(new T.BoxGeometry(3.2, 3.2, 0.28),
      new T.MeshStandardMaterial({ color: 0x0d0f15, roughness: 0.85 })
    );
    door.position.set(0, 1.6, 0); g.add(door);

    const frame = new T.Mesh(new T.BoxGeometry(3.5, 3.5, 0.12), matRail);
    frame.position.set(0, 1.6, 0.12); g.add(frame);

    const jumbo = new T.Mesh(new T.PlaneGeometry(5.6, 3.0),
      new T.MeshStandardMaterial({ color: 0x11131a, roughness: 0.45, metalness: 0.4,
        emissive: new T.Color(0x001018), emissiveIntensity: 2.0 })
    );
    jumbo.position.set(0, 5.8, 0.16); g.add(jumbo);
  }
  addDoorAndJumbo(0);
  addDoorAndJumbo(Math.PI/2);
  addDoorAndJumbo(Math.PI);
  addDoorAndJumbo(-Math.PI/2);

  // store showcase avatars + avatar buttons
  const loader = new GLTFLoader();
  loader.setCrossOrigin('anonymous');

  async function spawnShowcase(key, localX){
    const booth = new T.Group();
    booth.position.set(localX, 0, 0.85);
    store.add(booth);

    const ped = new T.Mesh(new T.CylinderGeometry(0.62, 0.72, 0.38, 32),
      new T.MeshStandardMaterial({ color: 0x10131a, roughness: 0.85 })
    );
    ped.position.set(0, 0.19, 0); booth.add(ped);

    const glass = makeGlassBox(1.55, 2.35, 1.25);
    glass.position.set(0, 1.2, 0); booth.add(glass);

    const p = new T.PointLight(0x77ccff, 1.0, 8);
    p.position.set(0, 2.0, 0.7); booth.add(p);

    const url = AVATARS[key];
    if (!url) return;

    try{
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root) return;
      addSoftEmissive(root);
      normalizeHuman(root, 1.65);
      root.position.set(0, 0.0, 0);
      root.rotation.y = Math.PI;
      booth.add(root);
      updaters.push((dt)=>{ booth.rotation.y += dt * 0.35; });
      Bus?.log?.(`STORE DISPLAY: ${key} ok`);
    }catch(e){
      Bus?.log?.(`STORE DISPLAY FAIL: ${key} ${(e?.message||e)}`);
    }
  }

  await spawnShowcase('male', -3.0);
  await spawnShowcase('female', -1.0);
  await spawnShowcase('ninja', 1.0);
  await spawnShowcase('combat', 3.0);

  let currentAvatar = null;
  function setHud(name){
    const el = document.getElementById('av');
    if (el) el.textContent = 'Avatar: ' + (name ? name.toUpperCase() : 'NONE');
  }

  async function loadAvatar(key){
    const url = AVATARS[key];
    if (!url) return;
    if (currentAvatar){
      scene.remove(currentAvatar);
      currentAvatar = null;
    }
    setHud(key);
    try{
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root) throw new Error('no scene');
      addSoftEmissive(root);
      normalizeHuman(root, 1.7);
      root.position.set(1.6, 0.0, 1.6);
      root.rotation.y = Math.PI;
      currentAvatar = root;
      scene.add(root);
      Bus?.log?.(`AVATAR: ${key} spawned`);
    }catch(e){
      setHud(null);
      Bus?.log?.(`AVATAR LOAD FAIL: ${e?.message||e}`);
    }
  }

  window.spawnAvatar = (key)=>loadAvatar(key);
  window.clearAvatar = ()=>{
    if (currentAvatar) scene.remove(currentAvatar);
    currentAvatar = null; setHud(null);
    Bus?.log?.('AVATAR: cleared');
  };
  Bus?.log?.('AVATAR MANAGER ONLINE');

  // guard at entrance
  // JITTER KILL: do NOT auto-load any GLB guards here.
  // Some GLBs (often exported as Character_output/source or very high poly) can cause
  // heavy GPU spikes when they enter view on Quest/Android.
  function spawnGuardCapsule(){
    const guardGroup = new T.Group();
    guardGroup.position.set(0, 0, pitR + 2.0);
    guardGroup.rotation.y = Math.PI;
    scene.add(guardGroup);

    const cap = new T.Mesh(
      new T.CapsuleGeometry(0.28, 1.0, 8, 16),
      new T.MeshStandardMaterial({ color: 0x13141b, roughness: 0.9 })
    );
    cap.position.set(0, 1.0, 0);
    guardGroup.add(cap);
    Bus?.log?.('GUARD: capsule (perf)');
  }
  spawnGuardCapsule();

  // roaming bots
  function spawnWalker(i){
    const bot = new T.Mesh(new T.CapsuleGeometry(0.22, 0.85, 8, 16),
      new T.MeshStandardMaterial({ color: i%2?0x222233:0x1a1e28, roughness: 0.85 })
    );
    scene.add(bot);
    const speed = 0.55 + Math.random()*0.4;
    const radius = 9.5 + Math.random()*3.0;
    let t = Math.random()*Math.PI*2;
    updaters.push((dt)=>{
      t += dt*speed;
      bot.position.set(Math.cos(t)*radius, 1.0, Math.sin(t)*radius);
      bot.lookAt(0,1.0,0);
    });
  }
  for (let i=0;i<4;i++) spawnWalker(i);

  // spawn position (outside pit near entrance)
  rig.position.set(0, 0, 7.5);

  const worldUpdate = (dt)=>{ for (const fn of updaters) fn(dt); };

  Bus?.log?.('WORLD: pit + stairs + lobby loaded ✅');
  return { teleportSurfaces, worldUpdate };
}
