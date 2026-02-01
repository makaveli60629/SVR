// SVR/js/scarlett1/world.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const AVATARS = {
  male:   './assets/avatars/male.glb',
  female: './assets/avatars/female.glb',
  ninja:  './assets/avatars/ninja.glb',
  combat: './assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb',
};

function makeCarpetTexture(){
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');

  g.fillStyle = '#2a1047';
  g.fillRect(0,0,c.width,c.height);

  for (let y=0;y<512;y+=8){
    g.fillStyle = (y%16===0) ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)';
    g.fillRect(0,y,512,4);
  }
  for (let x=0;x<512;x+=10){
    g.fillStyle = (x%20===0) ? 'rgba(0,255,255,0.025)' : 'rgba(255,0,160,0.02)';
    g.fillRect(x,0,2,512);
  }

  g.strokeStyle = 'rgba(0,220,255,0.18)';
  g.lineWidth = 10;
  g.beginPath(); g.arc(256,256,190,0,Math.PI*2); g.stroke();
  g.strokeStyle = 'rgba(255,40,140,0.15)';
  g.lineWidth = 6;
  g.beginPath(); g.arc(256,256,232,0,Math.PI*2); g.stroke();

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6,6);
  t.anisotropy = 8;
  return t;
}

function makeWallTexture(){
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#07080c';
  g.fillRect(0,0,512,512);

  for (let y=0;y<512;y+=64){
    for (let x=0;x<512;x+=64){
      g.fillStyle = ((x+y)/64)%2===0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,255,255,0.018)';
      g.fillRect(x+3,y+3,58,58);
      g.strokeStyle = 'rgba(255,40,140,0.06)';
      g.strokeRect(x+3,y+3,58,58);
    }
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10,3);
  t.anisotropy = 8;
  return t;
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
  tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent:true });
  return new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.4), mat);
}

function makeGlassBox(w,h,d){
  const g = new THREE.BoxGeometry(w,h,d);
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    roughness: 0.08,
    metalness: 0.0,
    transmission: 0.85,
    thickness: 0.08,
    transparent: true,
    opacity: 0.35,
  });
  return new THREE.Mesh(g,m);
}

export async function initWorld(ctx){
  const { THREE: T, scene, Bus } = ctx;
  const walkSurfaces = [];
  const teleportSurfaces = [];
  const updaters = [];

  // If you see ONLY a black world + feet ring, this file did NOT load.
  Bus?.log?.("world.js: running ✅");

  scene.add(new T.AmbientLight(0xffffff, 0.62));
  const key = new T.DirectionalLight(0xffffff, 0.85);
  key.position.set(10, 16, 10);
  scene.add(key);

  const rim = new T.DirectionalLight(0x77ccff, 0.55);
  rim.position.set(-12, 10, -10);
  scene.add(rim);

  const top = new T.PointLight(0xffffff, 1.15, 140);
  top.position.set(0, 12.5, 0);
  scene.add(top);

  for (let i=0;i<10;i++){
    const a = (i/10)*Math.PI*2;
    const p = new T.PointLight(i%2?0xff2a8a:0x00d6ff, 0.75, 40);
    p.position.set(Math.cos(a)*10.5, 6.6, Math.sin(a)*10.5);
    scene.add(p);
  }

  const outerR = 22.0;
  const wallR  = 24.0;
  const pitR   = 7.2;
  const pitDepth = 3.4;
  const entranceAngle = Math.PI/2;

  const carpetTex = makeCarpetTexture();
  const wallTex = makeWallTexture();

  const matCarpet = new T.MeshStandardMaterial({ map: carpetTex, color: 0xffffff, roughness: 0.98, metalness: 0.0 });
  const matPitWall = new T.MeshStandardMaterial({ map: wallTex, color: 0xffffff, roughness: 0.9, metalness: 0.0, side: T.DoubleSide });

  const matRail = new T.MeshStandardMaterial({
    color: 0x00d6ff,
    roughness: 0.25,
    metalness: 0.75,
    emissive: new T.Color(0x001018),
    emissiveIntensity: 1.35
  });
  const matTrim = new T.MeshStandardMaterial({
    color: 0xff2a8a,
    roughness: 0.25,
    metalness: 0.25,
    emissive: new T.Color(0x250010),
    emissiveIntensity: 2.2
  });

  // Floor
  const floor = new T.Mesh(new T.CylinderGeometry(outerR, outerR, 0.30, 120), matCarpet);
  floor.position.y = 0.0;
  scene.add(floor);
  walkSurfaces.push(floor);
  teleportSurfaces.push(floor);

  // Walls & ceiling
  const walls = new T.Mesh(new T.CylinderGeometry(wallR, wallR, 9.0, 140, 1, true), matPitWall);
  walls.position.y = 4.4;
  scene.add(walls);

  const ceiling = new T.Mesh(new T.CylinderGeometry(wallR, wallR, 0.25, 140), new T.MeshStandardMaterial({ color: 0x06070b, roughness: 0.95 }));
  ceiling.position.y = 9.0;
  scene.add(ceiling);

  // Pit
  const pitWall = new T.Mesh(new T.CylinderGeometry(pitR, pitR, pitDepth, 120, 1, true), matPitWall);
  pitWall.position.y = -pitDepth/2 - 0.05;
  scene.add(pitWall);

  const pitBottom = new T.Mesh(new T.CylinderGeometry(pitR-0.35, pitR-0.35, 0.24, 120), new T.MeshStandardMaterial({ color: 0x14121c, roughness: 0.95 }));
  pitBottom.position.y = -pitDepth - 0.17;
  scene.add(pitBottom);
  walkSurfaces.push(pitBottom);
  teleportSurfaces.push(pitBottom);

  // Trim/rail gap at stairs
  const gap = 0.55;
  const arcLen = Math.PI*2 - gap;
  const start = entranceAngle + gap/2;

  const trimArc = new T.Mesh(new T.TorusGeometry(pitR + 0.12, 0.09, 14, 180, arcLen), matTrim);
  trimArc.rotation.x = Math.PI/2;
  trimArc.rotation.z = start;
  trimArc.position.y = 0.08;
  scene.add(trimArc);

  const railArc = new T.Mesh(new T.TorusGeometry(pitR + 0.72, 0.10, 10, 220, arcLen), matRail);
  railArc.rotation.x = Math.PI/2;
  railArc.rotation.z = start;
  railArc.position.y = 1.02;
  scene.add(railArc);

  for (let i=0;i<28;i++){
    const a = (i/28)*Math.PI*2;
    const da = Math.atan2(Math.sin(a-entranceAngle), Math.cos(a-entranceAngle));
    if (Math.abs(da) < gap/2) continue;

    const post = new T.Mesh(new T.CylinderGeometry(0.06,0.06,1.02, 12), matRail);
    post.position.set(Math.cos(a)*(pitR+0.72), 0.52, Math.sin(a)*(pitR+0.72));
    scene.add(post);
  }

  // Stairs
  const steps = 8;
  const stepH = pitDepth / steps;
  const stepD = 0.62;
  const stepW = 2.3;

  const stairs = new T.Group();
  stairs.position.set(0, 0, pitR + 0.45);
  stairs.rotation.y = Math.PI;
  scene.add(stairs);

  const matStair = new T.MeshStandardMaterial({ color: 0x242733, roughness: 0.95 });

  const topLand = new T.Mesh(new T.BoxGeometry(stepW, 0.20, 1.35), matStair);
  topLand.position.set(0, 0.10, -0.85);
  stairs.add(topLand);
  walkSurfaces.push(topLand); teleportSurfaces.push(topLand);

  for (let i=0;i<steps;i++){
    const y = -(i+1)*stepH;
    const z = -(i*stepD);
    const s = new T.Mesh(new T.BoxGeometry(stepW, 0.20, stepD), matStair);
    s.position.set(0, y + 0.10, z);
    stairs.add(s);
    walkSurfaces.push(s); teleportSurfaces.push(s);
  }

  const bottomLand = new T.Mesh(new T.BoxGeometry(stepW, 0.20, 1.35), matStair);
  bottomLand.position.set(0, -pitDepth - 0.10, -((steps-1)*stepD) - 0.85);
  stairs.add(bottomLand);
  walkSurfaces.push(bottomLand); teleportSurfaces.push(bottomLand);

  const railCurve = new T.CatmullRomCurve3([
    new T.Vector3(stepW/2 + 0.26, 1.05, -0.95),
    new T.Vector3(stepW/2 + 0.26, 0.75, -1.75),
    new T.Vector3(stepW/2 + 0.26, 0.25, -3.00),
    new T.Vector3(stepW/2 + 0.26, -0.55, -4.45),
    new T.Vector3(stepW/2 + 0.26, -1.40, -5.75),
  ]);
  const stairRail = new T.Mesh(new T.TubeGeometry(railCurve, 120, 0.06, 10, false), matRail);
  stairs.add(stairRail);

  // Table pedestal
  const pedestal = new T.Mesh(new T.CylinderGeometry(1.55, 1.75, 0.85, 64), new T.MeshStandardMaterial({ color: 0x0e1016, roughness: 0.7, metalness: 0.2 }));
  pedestal.position.set(0, -pitDepth + 0.30, 0);
  scene.add(pedestal);

  const tableTop = new T.Mesh(new T.CylinderGeometry(2.25, 2.25, 0.14, 96), new T.MeshStandardMaterial({ color: 0x161b25, roughness: 0.35, metalness: 0.65 }));
  tableTop.position.set(0, -pitDepth + 0.82, 0);
  scene.add(tableTop);

  const passLine = new T.Mesh(new T.TorusGeometry(1.55, 0.03, 10, 140), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.2 }));
  passLine.rotation.x = Math.PI/2;
  passLine.position.set(0, -pitDepth + 0.90, 0);
  scene.add(passLine);

  const logo = new T.Mesh(new T.CircleGeometry(0.55, 48), new T.MeshStandardMaterial({ color: 0xff2a8a, roughness: 0.3, metalness: 0.25, emissive: new T.Color(0x250010), emissiveIntensity: 2.0 }));
  logo.rotation.x = -Math.PI/2;
  logo.position.set(0, -pitDepth + 0.91, 0);
  scene.add(logo);

  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const seat = new T.Mesh(new T.BoxGeometry(0.55, 0.75, 0.55), new T.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.92 }));
    seat.position.set(Math.cos(a)*3.0, -pitDepth + 0.40, Math.sin(a)*3.0);
    seat.lookAt(0, seat.position.y, 0);
    scene.add(seat);
  }

  // Store + balcony
  const store = new T.Group();
  store.position.set(0, 0, -18.0);
  scene.add(store);

  const storeFrame = new T.Mesh(new T.BoxGeometry(9.0, 3.2, 1.4), new T.MeshStandardMaterial({ color: 0x0d0f15, roughness: 0.9 }));
  storeFrame.position.set(0, 1.6, 0);
  store.add(storeFrame);

  const hood = new T.Mesh(new T.BoxGeometry(9.4, 0.30, 2.2), new T.MeshStandardMaterial({ color: 0x10131a, roughness: 0.85 }));
  hood.position.set(0, 3.05, 0.45);
  store.add(hood);

  for (let i=-3;i<=3;i+=2){
    const s = new T.SpotLight(0x77ccff, 1.0, 18, Math.PI/6, 0.35, 1.0);
    s.position.set(i, 3.0, 1.2);
    s.target.position.set(i, 1.2, 0.5);
    store.add(s); store.add(s.target);
  }

  const sign = makeNeonSign('SCARLETT STORE');
  sign.position.set(0, 2.35, 0.72);
  store.add(sign);

  const balconyPlat = new T.Mesh(new T.BoxGeometry(9.6, 0.22, 4.2), new T.MeshStandardMaterial({ color: 0x0b0c12, roughness: 0.95 }));
  balconyPlat.position.set(0, 4.1, -0.4);
  store.add(balconyPlat);

  const railFront = new T.Mesh(new T.BoxGeometry(9.6, 0.08, 0.08), matRail);
  railFront.position.set(0, 4.6, 1.55);
  store.add(railFront);

  const railLeft = new T.Mesh(new T.BoxGeometry(0.08, 0.08, 4.0), matRail);
  railLeft.position.set(-4.75, 4.6, -0.35);
  store.add(railLeft);

  const railRight = new T.Mesh(new T.BoxGeometry(0.08, 0.08, 4.0), matRail);
  railRight.position.set(4.75, 4.6, -0.35);
  store.add(railRight);

  for (let x=-4.6; x<=4.6; x+=1.15){
    const p = new T.Mesh(new T.CylinderGeometry(0.05,0.05,0.95,10), matRail);
    p.position.set(x, 4.15 + 0.95/2, 1.55);
    store.add(p);
  }

  // Displays
  const loader = new GLTFLoader();
  loader.setCrossOrigin('anonymous');

  async function spawnShowcase(key, localX){
    const booth = new T.Group();
    booth.position.set(localX, 0, 0.85);
    store.add(booth);

    const ped = new T.Mesh(new T.CylinderGeometry(0.62, 0.72, 0.38, 32), new T.MeshStandardMaterial({ color: 0x10131a, roughness: 0.85 }));
    ped.position.set(0, 0.19, 0);
    booth.add(ped);

    const glass = makeGlassBox(1.55, 2.35, 1.25);
    glass.position.set(0, 1.2, 0);
    booth.add(glass);

    const l = new T.PointLight(0x77ccff, 1.0, 8);
    l.position.set(0, 2.0, 0.7);
    booth.add(l);

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
      updaters.push((dt)=>{ booth.rotation.y += dt*0.35; });
      Bus?.log?.(`STORE DISPLAY: ${key} ok`);
    }catch(e){
      Bus?.log?.(`STORE DISPLAY FAIL: ${key} ${(e?.message||e)}`);
    }
  }

  await spawnShowcase('male',   -3.0);
  await spawnShowcase('female', -1.0);
  await spawnShowcase('ninja',   1.0);
  await spawnShowcase('combat',  3.0);

  // Avatar spawner for HUD buttons (single avatar near table, on pit floor)
  let current = null;
  async function spawnAvatar(key){
    const url = AVATARS[key];
    if (!url) return;
    if (current){ scene.remove(current); current = null; }
    try{
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root) return;
      addSoftEmissive(root);
      normalizeHuman(root, 1.75);
      root.position.set(2.2, -pitDepth + 0.0, 2.2);
      root.rotation.y = Math.PI;
      current = root;
      scene.add(root);
      Bus?.log?.(`AVATAR: ${key} spawned`);
    }catch(e){
      Bus?.log?.(`AVATAR FAIL: ${key} ${(e?.message||e)}`);
    }
  }
  window.spawnAvatar = (k)=>spawnAvatar(k);
  window.clearAvatar = ()=>{ if (current) scene.remove(current); current=null; Bus?.log?.("AVATAR: cleared"); };

  // simple walkers
  function spawnWalker(i){
    const bot = new T.Mesh(new T.CapsuleGeometry(0.22, 0.85, 8, 16), new T.MeshStandardMaterial({ color: i%2?0x222233:0x1a1e28, roughness: 0.85 }));
    scene.add(bot);
    const speed = 0.55 + Math.random()*0.4;
    const radius = 9.5 + Math.random()*3.0;
    let tt = Math.random()*Math.PI*2;
    updaters.push((dt)=>{
      tt += dt*speed;
      bot.position.set(Math.cos(tt)*radius, 1.0, Math.sin(tt)*radius);
      bot.lookAt(0,1.0,0);
    });
  }
  for (let i=0;i<4;i++) spawnWalker(i);

  ctx.worldUpdate = (dt)=>{ for (const fn of updaters) fn(dt); };

  return { walkSurfaces, teleportSurfaces };
}
