import * as THREE from "three";

export const PRIVATE_SCENE_LOCK_VERSION = "PHASE-85-TRUE-LOBBY-KIOSK-SCORPION-CELESTIAL-LOCK";

function makeLabelTexture(title, sub=''){
  const c=document.createElement('canvas'); c.width=1400; c.height=500; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,'#090014'); g.addColorStop(1,'#020005'); x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle='rgba(184,120,255,.95)'; x.lineWidth=14; x.strokeRect(28,28,c.width-56,c.height-56);
  x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#fff'; x.font='900 94px system-ui,Arial'; x.fillText(title,c.width/2,180);
  x.fillStyle='#7effcf'; x.font='700 44px system-ui,Arial'; x.fillText(sub,c.width/2,305);
  x.fillStyle='#ffd36b'; x.font='600 30px system-ui,Arial'; x.fillText('Moon + Mars celestial lock active • Return with browser Back or Lobby button',c.width/2,395);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8; return tex;
}

function orbTexture(kind){
  const c=document.createElement('canvas'); c.width=512; c.height=512; const x=c.getContext('2d');
  const cx=256, cy=256; const rg=x.createRadialGradient(cx-80,cy-90,20,cx,cy,240);
  if(kind==='mars'){ rg.addColorStop(0,'#ffc09a'); rg.addColorStop(.45,'#e06d3d'); rg.addColorStop(1,'#421107'); }
  else { rg.addColorStop(0,'#ffffff'); rg.addColorStop(.55,'#cfd7e6'); rg.addColorStop(1,'#374053'); }
  x.fillStyle=rg; x.beginPath(); x.arc(cx,cy,235,0,Math.PI*2); x.fill();
  x.globalAlpha=.25; x.fillStyle=kind==='mars'?'#3d0f05':'#1a2030';
  for(let i=0;i<44;i++){ x.beginPath(); x.ellipse(Math.random()*512,Math.random()*512,10+Math.random()*40,4+Math.random()*16,Math.random()*Math.PI,0,Math.PI*2); x.fill(); }
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}

export function buildPrivateScene({ title='SVR PRIVATE ROOM', subtitle='Module route lock', scorpion=false, store=false }={}){
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x020006);
  const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,1000); camera.position.set(0,1.6,6); camera.lookAt(0,1.2,0);
  const renderer=new THREE.WebGLRenderer({ antialias:true, alpha:false }); renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5)); renderer.setSize(innerWidth,innerHeight); renderer.xr.enabled=true; document.getElementById('app')?.appendChild(renderer.domElement);
  document.body.appendChild(THREE.WEBGL ? document.createElement('span') : document.createElement('span'));
  scene.add(new THREE.HemisphereLight(0xc7d5ff,0x140018,1.15)); const key=new THREE.DirectionalLight(0xffffff,1.2); key.position.set(4,8,4); scene.add(key);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(18,80), new THREE.MeshStandardMaterial({ color:0x080712, roughness:.86, metalness:.05, emissive:0x09001a, emissiveIntensity:.22 })); floor.rotation.x=-Math.PI/2; scene.add(floor);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(8.4,3.0), new THREE.MeshBasicMaterial({ map:makeLabelTexture(title,subtitle), transparent:true, side:THREE.DoubleSide })); label.position.set(0,3.2,-5.2); scene.add(label);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1.4,48,48), new THREE.MeshStandardMaterial({ map:orbTexture('moon'), color:0xffffff, roughness:.95, emissive:0x28364c, emissiveIntensity:.18 })); moon.position.set(-7,8.5,-16); scene.add(moon);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(.82,40,40), new THREE.MeshStandardMaterial({ map:orbTexture('mars'), color:0xff8f5e, roughness:.82, emissive:0x4a1508, emissiveIntensity:.24 })); mars.position.set(7.8,9.8,-19); scene.add(mars);
  scene.add(new THREE.PointLight(0xeaf2ff,2.1,80).position.copy(moon.position)); scene.add(new THREE.PointLight(0xff9a72,1.25,60).position.copy(mars.position));
  if(scorpion) addScorpionTable(scene);
  if(store) addStoreRoom(scene);
  addReturnPanel(scene);
  addControls(camera, renderer.domElement);
  addVRButton(renderer);
  window.addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
  let t=0; renderer.setAnimationLoop((_,frame)=>{ t+=0.016; moon.rotation.y+=0.004; mars.rotation.y+=0.005; label.position.y=3.2+Math.sin(t*.8)*.03; renderer.render(scene,camera); });
}

function addScorpionTable(scene){
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(3.25,3.25,.22,80), new THREE.MeshStandardMaterial({ color:0x351d13, roughness:.65, metalness:.08, emissive:0x150705, emissiveIntensity:.12 })); rail.scale.z=.62; rail.position.y=.82; scene.add(rail);
  const felt=new THREE.Mesh(new THREE.CylinderGeometry(2.85,2.85,.08,80), new THREE.MeshStandardMaterial({ color:0x063e31, roughness:.92, emissive:0x02150f, emissiveIntensity:.2 })); felt.scale.z=.58; felt.position.y=.98; scene.add(felt);
  const line=new THREE.Mesh(new THREE.TorusGeometry(2.15,.018,8,120), new THREE.MeshBasicMaterial({ color:0xffd36b })); line.scale.z=.58; line.rotation.x=Math.PI/2; line.position.y=1.03; scene.add(line);
  for(let i=0;i<6;i++){ const a=i*Math.PI*2/6+Math.PI/6; const chair=new THREE.Mesh(new THREE.BoxGeometry(.72,.48,.72), new THREE.MeshStandardMaterial({ color:i===3?0x2e1458:0x101827, roughness:.7, emissive:i===3?0x240052:0x050816, emissiveIntensity:.24 })); chair.position.set(Math.cos(a)*4.2,.35,Math.sin(a)*2.8); chair.lookAt(0,.35,0); scene.add(chair); }
  for(let i=0;i<5;i++){ const stack=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.09,24), new THREE.MeshStandardMaterial({ color:[0xffffff,0xff3d3d,0x38a9ff,0x272727,0x9b5cff][i], roughness:.55 })); stack.position.set(-1.2+i*.6,1.09,.75); scene.add(stack); }
}

function addStoreRoom(scene){
  for(let i=0;i<5;i++){ const p=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.8,.08), new THREE.MeshStandardMaterial({ color:0x1a102b, emissive:0x190041, emissiveIntensity:.32 })); p.position.set(-4+i*2,1.1,-3); scene.add(p); }
}

function addReturnPanel(scene){ const tex=makeLabelTexture('RETURN TO LOBBY','Use browser back or /game/'); const p=new THREE.Mesh(new THREE.PlaneGeometry(4.5,1.6), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide })); p.position.set(0,1.6,4.5); p.rotation.y=Math.PI; scene.add(p); }

function addControls(camera, dom){ let keys={}; addEventListener('keydown',e=>keys[e.code]=true); addEventListener('keyup',e=>keys[e.code]=false); function step(){ const sp=.045; if(keys.KeyW||keys.ArrowUp) camera.position.z-=sp; if(keys.KeyS||keys.ArrowDown) camera.position.z+=sp; if(keys.KeyA||keys.ArrowLeft) camera.position.x-=sp; if(keys.KeyD||keys.ArrowRight) camera.position.x+=sp; requestAnimationFrame(step); } step(); }
function addVRButton(renderer){ const b=document.createElement('button'); b.textContent='ENTER VR'; b.style.cssText='position:fixed;right:16px;bottom:16px;z-index:10;padding:12px 18px;border-radius:999px;background:#130020;color:#fff;border:1px solid #b98cff'; b.onclick=async()=>{ if(navigator.xr){ const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']}); renderer.xr.setSession(s); } }; document.body.appendChild(b); }
