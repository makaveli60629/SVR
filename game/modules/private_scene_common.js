import * as THREE from "three";

function makeTextTexture(title, subtitle, color = '#ffffff'){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,'#050814'); g.addColorStop(1,'#18072a');
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = 'rgba(130,220,255,0.7)'; x.lineWidth = 10; x.strokeRect(26,26,c.width-52,c.height-52);
  x.fillStyle = color; x.textAlign='center'; x.font='bold 76px system-ui, Arial'; x.fillText(title, c.width/2, 205);
  x.fillStyle = '#dff7ff'; x.font='34px system-ui, Arial'; x.fillText(subtitle, c.width/2, 282);
  x.fillStyle = 'rgba(255,255,255,0.78)'; x.font='24px system-ui, Arial'; x.fillText('SVR private scene module • return to lobby anytime', c.width/2, 348);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function starTexture(){
  const c=document.createElement('canvas'); c.width=128; c.height=128; const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,2,64,64,60); g.addColorStop(0,'#fff'); g.addColorStop(.25,'rgba(190,220,255,.8)'); g.addColorStop(1,'rgba(190,220,255,0)');
  x.fillStyle=g; x.fillRect(0,0,128,128); const t=new THREE.CanvasTexture(c); return t;
}
export function createPrivateScene(config){
  const app = document.getElementById('app');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(config.bg || 0x03050d); scene.fog = new THREE.FogExp2(config.fog || 0x08001a, 0.018);
  const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.01, 900); camera.position.set(0, 1.65, 8); camera.lookAt(0,1.2,0);
  const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' }); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(innerWidth,innerHeight); renderer.xr.enabled = true; app.appendChild(renderer.domElement);
  const amb = new THREE.HemisphereLight(0x9fdcff,0x17081f,1.15); scene.add(amb);
  const key = new THREE.DirectionalLight(0xded2ff,1.0); key.position.set(-8,18,12); scene.add(key);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(config.radius || 18, 96), new THREE.MeshStandardMaterial({ color:config.floor || 0x102016, roughness:.72, metalness:.06, emissive:config.floorGlow || 0x000000, emissiveIntensity:.12 })); floor.rotation.x=-Math.PI/2; scene.add(floor);
  const titleTex = makeTextTexture(config.title || 'SVR ROOM', config.subtitle || 'Private scene', config.accentText || '#ffffff');
  const board = new THREE.Mesh(new THREE.PlaneGeometry(8.4,4.2), new THREE.MeshBasicMaterial({map:titleTex, side:THREE.DoubleSide})); board.position.set(0,4.0,-10); scene.add(board);

  const moon = new THREE.Mesh(new THREE.SphereGeometry(config.moonSize || 4.2, 48, 48), new THREE.MeshStandardMaterial({ color:0xe6ccff, roughness:.8, metalness:0, emissive:0x432c70, emissiveIntensity:.55 })); moon.position.set(14,24,-36); scene.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(config.marsSize || 2.5, 40, 40), new THREE.MeshStandardMaterial({ color:0xff8e74, roughness:.75, metalness:0, emissive:0x3a1009, emissiveIntensity:.45 })); mars.position.set(-17,19,-32); scene.add(mars);
  const ptsGeo = new THREE.BufferGeometry(); const count=700; const pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, r=60+Math.random()*280, y=20+Math.random()*220; pos[i*3]=Math.cos(a)*r; pos[i*3+1]=y; pos[i*3+2]=Math.sin(a)*r-60; }
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  scene.add(new THREE.Points(ptsGeo, new THREE.PointsMaterial({size:.24, map:starTexture(), transparent:true, opacity:.86, depthWrite:false, blending:THREE.AdditiveBlending})));

  // room-specific props
  (config.props||[]).forEach((p)=>{
    let mesh;
    if(p.type==='box') mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w,p.h,p.d), new THREE.MeshStandardMaterial({color:p.color, roughness:.55, metalness:p.metal||0.12, emissive:p.emissive||0x000000, emissiveIntensity:p.ei||0.0}));
    if(p.type==='sphere') mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r,32,32), new THREE.MeshStandardMaterial({color:p.color, roughness:.55, metalness:p.metal||0, emissive:p.emissive||0x000000, emissiveIntensity:p.ei||0.0}));
    if(p.type==='cylinder') mesh = new THREE.Mesh(new THREE.CylinderGeometry(p.r,p.r,p.h,36), new THREE.MeshStandardMaterial({color:p.color, roughness:.55, metalness:p.metal||0, emissive:p.emissive||0x000000, emissiveIntensity:p.ei||0.0}));
    if(mesh){ mesh.position.set(p.x||0,p.y||0,p.z||0); if(p.rx) mesh.rotation.x=p.rx; if(p.ry) mesh.rotation.y=p.ry; scene.add(mesh); }
  });

  const btn = document.getElementById('backLobby'); btn?.addEventListener('click',()=>{ location.href='./index.html?v=phase84s-return'; });
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  let last=performance.now(); renderer.setAnimationLoop((now)=>{ const dt=Math.min((now-last)/1000,.033); last=now; moon.rotation.y += dt*.026; mars.rotation.y -= dt*.035; board.lookAt(camera.position.x, board.position.y, camera.position.z); renderer.render(scene,camera); });
}
