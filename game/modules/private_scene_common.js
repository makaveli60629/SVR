import * as THREE from "three";

export const STORE_PORTAL_URL = "https://svrpoker.com/site/store.html";

export function makeCanvasTexture(width, height, painter){
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  painter(ctx, width, height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function makeTextTexture(title, lines = [], accent = '#b98cff'){
  return makeCanvasTexture(1400, 800, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, '#05060d');
    g.addColorStop(1, '#101021');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = accent; ctx.lineWidth = 16; ctx.strokeRect(26,26,w-52,h-52);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 86px system-ui, Arial';
    ctx.fillText(title, w/2, 126);
    ctx.fillStyle = '#d8f8ff'; ctx.font = '40px system-ui, Arial';
    let y = 265;
    for (const line of lines){
      ctx.fillText(line, w/2, y); y += 70;
    }
  });
}

export function bootPrivateScene({ title, subtitle, kind='generic', accent=0xb98cff, store=false }){
  const app = document.getElementById('app');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02030a);
  scene.fog = new THREE.FogExp2(0x02030a, 0.026);

  const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.05, 260);
  camera.position.set(0, 1.65, 7.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.xr.enabled = true;
  app.appendChild(renderer.domElement);

  document.getElementById('roomTitle').textContent = title;
  document.getElementById('roomSubtitle').textContent = subtitle;
  document.getElementById('backLobby').addEventListener('click', ()=>{ location.href = './index.html'; });
  document.getElementById('enterVr')?.addEventListener('click', async()=>{
    if (!navigator.xr) return;
    const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor','bounded-floor','hand-tracking'] });
    renderer.xr.setSession(session);
  });

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(34, 96),
    new THREE.MeshStandardMaterial({ color: 0x070910, roughness: 0.9, metalness: 0.02, emissive: 0x080a16, emissiveIntensity: 0.12 })
  );
  floor.rotation.x = -Math.PI/2;
  scene.add(floor);

  const grid = new THREE.GridHelper(54, 42, accent, 0x202040);
  grid.material.transparent = true;
  grid.material.opacity = 0.20;
  scene.add(grid);

  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x05030a, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(-4,8,6); scene.add(key);
  const glow = new THREE.PointLight(accent, 2.0, 28, 2.0);
  glow.position.set(0,4,2); scene.add(glow);

  // Moon and Mars are high in every private room.
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 48, 24), new THREE.MeshBasicMaterial({ color: 0xf1f3ff }));
  moon.position.set(-13, 16, -26); scene.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(1.2, 36, 18), new THREE.MeshBasicMaterial({ color: 0xff7b52 }));
  mars.position.set(16, 14, -30); scene.add(mars);

  for (let i=0;i<140;i++){
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.025 + Math.random()*0.025, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const a = Math.random()*Math.PI*2, r=20+Math.random()*80;
    star.position.set(Math.cos(a)*r, 8+Math.random()*36, Math.sin(a)*r-25);
    scene.add(star);
  }

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 4.25),
    new THREE.MeshBasicMaterial({ map: makeTextTexture(title, [subtitle, 'Private scene route verified', 'Return gate active', 'Lobby remains clean'], '#'+accent.toString(16).padStart(6,'0')), transparent: true, side: THREE.DoubleSide })
  );
  panel.position.set(0, 3.0, -6.0);
  scene.add(panel);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.045, 16, 96),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = Math.PI/2;
  ring.position.y = 0.035;
  scene.add(ring);

  if (kind === 'reiki'){
    const mat = new THREE.MeshStandardMaterial({ color: 0x173222, roughness: 0.85, emissive: 0x0b2b19, emissiveIntensity: 0.26 });
    for (let i=0;i<18;i++){
      const a=i/18*Math.PI*2, r=7+Math.sin(i)*1.2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.12,2.2,10), new THREE.MeshStandardMaterial({ color: 0x49351e }));
      trunk.position.set(Math.cos(a)*r,1.1,Math.sin(a)*r-1.5); scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.9,2.4,16), mat);
      crown.position.set(trunk.position.x,2.8,trunk.position.z); scene.add(crown);
    }
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,16), new THREE.MeshBasicMaterial({ color: 0x7dffb2, transparent:true, opacity:0.65 }));
    orb.position.set(0,1.2,0); scene.add(orb);
  }

  if (kind === 'drive' || kind === 'chip'){
    const turf = new THREE.Mesh(new THREE.PlaneGeometry(kind==='drive'?10:8, kind==='drive'?34:16), new THREE.MeshStandardMaterial({ color: 0x164b22, roughness: 0.92 }));
    turf.rotation.x=-Math.PI/2; turf.position.z = kind==='drive' ? -8 : -3; turf.position.y=0.006; scene.add(turf);
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.5), new THREE.MeshBasicMaterial({ map: makeTextTexture('STAND HERE', ['AIM AT BALL'], '#ffd166'), side:THREE.DoubleSide }));
    mat.rotation.x=-Math.PI/2; mat.position.set(0,0.015,2.2); scene.add(mat);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13,24,12), new THREE.MeshBasicMaterial({ color:0xffffff }));
    ball.position.set(0,0.16,0.8); scene.add(ball);
    for (const z of [-6,-12,-18]){
      const target = new THREE.Mesh(new THREE.TorusGeometry(1.2,0.04,12,64), new THREE.MeshBasicMaterial({ color:0xffd166 }));
      target.rotation.x=Math.PI/2; target.position.set(0,0.04,z); scene.add(target);
    }
  }

  if (store){
    const frame = document.createElement('iframe');
    frame.src = STORE_PORTAL_URL;
    frame.title = 'SVR Store Portal';
    frame.className = 'storeFrame';
    document.body.appendChild(frame);
    document.getElementById('portalUrl').textContent = STORE_PORTAL_URL;
  }

  window.addEventListener('resize', ()=>{
    camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight);
  });

  renderer.setAnimationLoop((t)=>{
    const time=t*0.001;
    ring.rotation.z += 0.004;
    moon.rotation.y += 0.002;
    mars.rotation.y += 0.003;
    camera.lookAt(0,1.45,-1.6);
    renderer.render(scene,camera);
  });
}
