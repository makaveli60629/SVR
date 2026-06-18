import * as THREE from "three";

function t(title, sub){
  const c = document.createElement('canvas'); c.width = 1100; c.height = 520;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,'#03070b'); g.addColorStop(.5,'#18042a'); g.addColorStop(1,'#031d1b');
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = 'rgba(134,255,240,.92)'; x.lineWidth = 12; x.strokeRect(20,20,c.width-40,c.height-40);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(136,255,240,.75)'; x.shadowBlur = 22;
  x.fillStyle = '#fff'; x.font = '900 78px system-ui'; x.fillText(title,c.width/2,150,c.width-80);
  x.shadowBlur = 8; x.fillStyle = '#bafff4'; x.font = '700 36px system-ui';
  String(sub||'').split('\n').forEach((line,i)=>x.fillText(line,c.width/2,285+i*55,c.width-90));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

function addReturn(){
  const a = document.createElement('a');
  a.href = './index.html?v=phase294-return';
  a.textContent = 'Return to Lobby';
  a.style.cssText = 'position:fixed;left:14px;top:14px;z-index:5;padding:10px 14px;border-radius:999px;border:1px solid rgba(140,255,240,.55);background:rgba(0,0,0,.62);color:white;text-decoration:none;font:700 13px system-ui';
  document.body.appendChild(a);
}

function stars(scene){
  const n = 900, p = new Float32Array(n*3);
  for(let i=0;i<n;i++){const r=50+Math.random()*90,a=Math.random()*Math.PI*2,y=8+Math.random()*65;p[i*3]=Math.cos(a)*r;p[i*3+1]=y;p[i*3+2]=Math.sin(a)*r;}
  const g = new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(p,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xe8ecff,size:.13,transparent:true,opacity:.9,depthWrite:false})));
}

function makeCarouselCard(title, lines=[]){
  return new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.28), new THREE.MeshBasicMaterial({map:t(title, lines.join('\n')),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
}

function addPrivateReikiHologramCarousel(scene){
  const group = new THREE.Group(); group.name = 'SVR_PHASE294_PRIVATE_REIKI_APPROVAL_SAFE_CAROUSEL'; scene.add(group);
  const glowMat = new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.12,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false});
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.5,1.9,4.2,64,1,true),glowMat); beam.position.set(0,2.1,-.5); group.add(beam);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.3,3.0),new THREE.MeshBasicMaterial({map:t('REIKI HOLDING ROOM','approved media slot\nSVR preview only\nAWAITING APPROVAL'),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  screen.position.set(0,3.15,-3.85); group.add(screen);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.15,.035,12,128),new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.84,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.rotation.x = Math.PI/2; ring.position.set(0,.18,-.5); group.add(ring);
  const cards = [makeCarouselCard('VIDEO SLOT',['approved media','carousel panel']),makeCarouselCard('REIKI STORE',['approval-safe','wellness placeholders']),makeCarouselCard('MEDITATION',['breathing ring','quiet room']),makeCarouselCard('APPROVAL',['SVR placeholder','awaiting approval'])];
  cards.forEach((card,i)=>{card.userData.a=i/cards.length*Math.PI*2; group.add(card);});
  const light = new THREE.PointLight(0x8ffff0,1.65,12,2); light.position.set(0,3,-2.5); group.add(light);
  group.userData.tick = (dt,time)=>{ ring.rotation.z+=dt*.7; beam.rotation.y+=dt*.2; light.intensity=1.15+.45*Math.sin(time*1.8); cards.forEach((card,i)=>{const a=card.userData.a+time*.28; card.position.set(Math.cos(a)*3.25,2.05+Math.sin(time+i)*.1,-.6+Math.sin(a)*1.3); card.lookAt(0,2.15,-.6); card.material.opacity=Math.sin(a)>-.45?1:.45;}); };
  return group;
}

function fallbackBuddhaTexture(){
  const c=document.createElement('canvas'); c.width=1200; c.height=760; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,'#06100c'); g.addColorStop(.55,'#1a0f12'); g.addColorStop(1,'#020506'); x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='rgba(210,185,145,.32)'; x.beginPath(); x.ellipse(c.width/2,350,190,235,0,0,Math.PI*2); x.fill();
  x.fillStyle='rgba(220,190,145,.48)'; x.beginPath(); x.arc(c.width/2,225,88,0,Math.PI*2); x.fill();
  x.fillStyle='#eafff5'; x.font='900 72px system-ui'; x.fillText('REIKI MEDITATION',c.width/2,610);
  x.fillStyle='#ffccd4'; x.font='900 34px system-ui'; x.fillText('AWAITING APPROVAL',c.width/2,680);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}

function addBackgroundImage(scene, url){
  const mat = new THREE.MeshBasicMaterial({map:fallbackBuddhaTexture(),transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false});
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(15.5,9.0), mat);
  wall.name = 'PHASE294 REIKI PRIVATE APPROVAL-SAFE BACKGROUND';
  wall.position.set(0,4.1,-7.4);
  scene.add(wall);
  const loader = new THREE.TextureLoader(); loader.crossOrigin = 'anonymous';
  loader.load(url, (tex)=>{tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8; mat.map=tex; mat.needsUpdate=true;}, undefined, ()=>{});
}

export function bootPrivateScene(cfg){
  const app=document.getElementById('app'); document.body.style.margin='0'; document.body.style.overflow='hidden'; document.body.style.background='#000';
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x010006);
  const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,500); camera.position.set(0,1.65,7.5);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(innerWidth,innerHeight); renderer.xr.enabled=true; app.appendChild(renderer.domElement);
  addReturn(); stars(scene); scene.add(new THREE.HemisphereLight(0xb7c9ff,0x111018,.9));
  if(cfg.backgroundImage) addBackgroundImage(scene, cfg.backgroundImage);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(11,96),new THREE.MeshStandardMaterial({color:cfg.floor||0x071012,roughness:.85,emissive:cfg.emissive||0x061724,emissiveIntensity:.25,side:THREE.DoubleSide})); floor.rotation.x=-Math.PI/2; scene.add(floor);
  const privateTicks=[];
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(5,2.35),new THREE.MeshBasicMaterial({map:t(cfg.title,cfg.body),side:THREE.DoubleSide,transparent:true,opacity:.92})); panel.position.set(0,3.1,-4.2); scene.add(panel);
  if(cfg.kind==='reiki'){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.05,.04,12,128),new THREE.MeshBasicMaterial({color:0x88fff0,transparent:true,opacity:.85})); ring.rotation.x=Math.PI/2; ring.position.y=.08; scene.add(ring);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.35,1.6,4,64,1,true),new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.08,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})); beam.position.y=2; scene.add(beam);
    privateTicks.push(addPrivateReikiHologramCarousel(scene));
  }
  if(cfg.kind==='pga'){
    const lane=new THREE.Mesh(new THREE.PlaneGeometry(4.4,16),new THREE.MeshStandardMaterial({color:0x124f23,roughness:.9,emissive:0x06310e,emissiveIntensity:.2,side:THREE.DoubleSide})); lane.rotation.x=-Math.PI/2; lane.position.z=-4; scene.add(lane);
  }
  const earth=new THREE.Mesh(new THREE.SphereGeometry(4.8,44,22),new THREE.MeshBasicMaterial({color:0x2e86ff})); earth.position.set(0,82,-120); scene.add(earth);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1.9,40,20),new THREE.MeshBasicMaterial({color:0xdeddda})); moon.position.set(-13,88,-124); scene.add(moon);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(1.55,36,18),new THREE.MeshBasicMaterial({color:0xb14d2e})); mars.position.set(18,94,-132); scene.add(mars);
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  renderer.setAnimationLoop(()=>{const time=performance.now()/1000; earth.rotation.y+=.0009; moon.rotation.y+=.001; mars.rotation.y+=.0015; const ot=time*.22; moon.position.set(earth.position.x+Math.cos(ot)*13,earth.position.y+5,earth.position.z+Math.sin(ot)*9); mars.position.set(earth.position.x+Math.cos(ot*.55)*24,earth.position.y+10,earth.position.z+Math.sin(ot*.55)*16); privateTicks.forEach(g=>g?.userData?.tick?.(.016,time)); camera.lookAt(0,1.5,-1.5); renderer.render(scene,camera);});
}
