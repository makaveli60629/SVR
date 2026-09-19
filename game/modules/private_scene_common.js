import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { createHands } from "./hands_phase228.js";
import { createTeleportRig } from "./movement_phase228.js?v=phase170-private-room";

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


const PRIVATE_BUILD='PHASE-464-PRIVATE-ROOM-REMODEL';
function addPremiumRoomArchitecture(scene,cfg){
  const root=new THREE.Group();root.name='PHASE464_PRIVATE_ROOM_ARCHITECTURE';scene.add(root);
  const theme={pga:[0x0e2415,0x8dffb4],scorpion:[0x170b13,0xff5b8c],smoker:[0x161014,0xffb070],store:[0x12091d,0xa77cff],reiki:[0x071713,0x7ffcff]}[cfg.kind]||[0x10131c,0x7ffcff];
  const wall=new THREE.MeshStandardMaterial({color:theme[0],roughness:.72,metalness:.12,emissive:theme[0],emissiveIntensity:.12});
  const accent=new THREE.MeshStandardMaterial({color:theme[1],roughness:.34,metalness:.45,emissive:theme[1],emissiveIntensity:.28});
  const add=(g,n,sx,sy,sz,x,y,z,m)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);mesh.name=n;mesh.position.set(x,y,z);g.add(mesh);return mesh;};
  add(root,'PHASE464_ROOM_BACK_WALL',12,4,.16,0,2,-6.5,wall);
  add(root,'PHASE464_ROOM_LEFT_WALL',.16,4,11,-5.9,2,-1,wall);
  add(root,'PHASE464_ROOM_RIGHT_WALL',.16,4,11,5.9,2,-1,wall);
  add(root,'PHASE464_ROOM_CROWN',10,.12,.2,0,3.85,-6.35,accent);
  for(const x of[-4.7,4.7]) add(root,'PHASE464_ROOM_COLUMN_'+x,.42,3.5,.42,x,1.75,-5.9,accent);
  const light=new THREE.PointLight(theme[1],1.05,12,1.8);light.position.set(0,2.7,-2.8);root.add(light);
  if(cfg.kind==='scorpion'){
    const overlook=new THREE.Mesh(new THREE.PlaneGeometry(7.8,2.6),new THREE.MeshBasicMaterial({color:0x080912,transparent:true,opacity:.82,side:THREE.DoubleSide}));
    overlook.name='PHASE464_SCORPION_CITY_OVERLOOK';overlook.position.set(0,2.25,-6.35);root.add(overlook);
  }
  if(cfg.kind==='smoker'){
    const lounge=new THREE.Mesh(new THREE.BoxGeometry(5.6,.38,1.45),new THREE.MeshStandardMaterial({color:0x281514,roughness:.9}));
    lounge.name='PHASE464_LOUNGE_SEATING';lounge.position.set(0,.3,-3.5);root.add(lounge);
  }
  if(cfg.kind==='store'){
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.45,.24,48),accent);plinth.name='PHASE464_STORE_DISPLAY_PLINTH';plinth.position.set(0,.13,-1.8);root.add(plinth);
  }
  window.SVR_PHASE464_PRIVATE_ROOM={build:PRIVATE_BUILD,kind:cfg.kind||'generic',installed:true,checkedAt:new Date().toISOString()};
  return root;
}

export function bootPrivateScene(cfg){
  const app=document.getElementById('app'); document.body.style.margin='0'; document.body.style.overflow='hidden'; document.body.style.background='#000';
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x010006);
  const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,500); camera.position.set(0,1.65,7.5);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.25)); renderer.setSize(innerWidth,innerHeight); renderer.xr.enabled=true; renderer.xr.setReferenceSpaceType('local-floor'); app.appendChild(renderer.domElement);
  window.__SVR_SCENE__=scene; window.__SVR_RENDERER__=renderer; window.__SVR_CAMERA__=camera;
  const vrButton=VRButton.createButton(renderer,{optionalFeatures:['local-floor','bounded-floor','hand-tracking']}); vrButton.classList.add('svr-vr-button'); document.body.appendChild(vrButton);
  addReturn(); stars(scene); scene.add(new THREE.HemisphereLight(0xb7c9ff,0x111018,.9));
  if(cfg.backgroundImage) addBackgroundImage(scene, cfg.backgroundImage);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(11,96),new THREE.MeshStandardMaterial({color:cfg.floor||0x071012,roughness:.85,emissive:cfg.emissive||0x061724,emissiveIntensity:.25,side:THREE.DoubleSide})); floor.rotation.x=-Math.PI/2; scene.add(floor);
  addPremiumRoomArchitecture(scene,cfg);
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
  const roomClamp=(x,z)=>({x:THREE.MathUtils.clamp(x,-5.35,5.35),z:THREE.MathUtils.clamp(z,-6.1,5.5)});
  const hands=createHands({scene,renderer,log:()=>{}});
  const tp=createTeleportRig({scene,renderer,camera,roomClamp,log:()=>{}});
  renderer.xr.addEventListener('sessionstart',()=>tp.onSessionStart?.());
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  let last=performance.now();
  renderer.setAnimationLoop(()=>{const now=performance.now(),dt=Math.min((now-last)/1000,.033);last=now;const time=now/1000; earth.rotation.y+=.0009; moon.rotation.y+=.001; mars.rotation.y+=.0015; const ot=time*.22; moon.position.set(earth.position.x+Math.cos(ot)*13,earth.position.y+5,earth.position.z+Math.sin(ot)*9); mars.position.set(earth.position.x+Math.cos(ot*.55)*24,earth.position.y+10,earth.position.z+Math.sin(ot*.55)*16); privateTicks.forEach(g=>g?.userData?.tick?.(dt,time)); hands.update(dt); const leftHand=hands.getLeftHand(),rightHand=hands.getRightHand(),leftController=hands.getLeftController(),rightController=hands.getRightController(); tp.update({dt,leftHand,rightHand,leftController,rightController,statusCb:()=>{},modeCb:()=>{}}); if(!renderer.xr.isPresenting)camera.lookAt(0,1.5,-1.5); renderer.render(scene,camera);});
  window.SVR_PHASE464_PRIVATE_ROOM_MOVEMENT={build:'PHASE-464-PRIVATE-ROOM-WALKABLE-XR',walkable:true,webxr:true,roomClamp:true,checkedAt:new Date().toISOString()};
}
