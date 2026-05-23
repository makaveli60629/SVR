import * as THREE from "three";
import { CONFIG } from "./config.js";

// PHASE-102-SMART-VR-POLISH-MODULE-LOCK
// Lightweight one-time polish module: no per-frame full-scene traversal.
// Adds high Moon/Mars, approval-safe green Reiki hub with red carpet/ropes/plants,
// corrected Espresso wall ad in front of Reiki/building zone, and a development access guide.

const PHASE = "PHASE-102-SMART-VR-POLISH-MODULE-LOCK";
const scenes = new Set();
let built = false;

function tex(w, h, paint){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  paint(ctx,w,h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function rr(ctx,x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

function signTexture(title, lines, color="#69e8ff", bg0="#06140d", bg1="#03070a"){
  return tex(1400,720,(ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,bg0); g.addColorStop(1,bg1); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=color; ctx.lineWidth=12; rr(ctx,26,26,w-52,h-52,38); ctx.stroke();
    ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.font="900 82px system-ui,Arial"; ctx.fillText(title,w/2,150);
    ctx.fillStyle="#e9defa"; ctx.font="700 44px system-ui,Arial"; let y=300; for(const line of lines){ctx.fillText(line,w/2,y); y+=88;}
    ctx.fillStyle=color; ctx.font="800 30px system-ui,Arial"; ctx.fillText(PHASE,w/2,h-76);
  });
}

function moonTex(){
  return tex(512,512,(ctx,w,h)=>{
    const g=ctx.createRadialGradient(w*.38,h*.32,20,w*.5,h*.5,w*.5); g.addColorStop(0,"#ffffff"); g.addColorStop(.55,"#dfe6f5"); g.addColorStop(1,"#9fa8bd"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.fillStyle="rgba(70,80,105,.22)";
    [[160,180,48],[290,122,32],[330,320,58],[210,350,24],[390,220,34]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();});
  });
}
function marsTex(){
  return tex(512,512,(ctx,w,h)=>{
    const g=ctx.createRadialGradient(w*.35,h*.28,24,w*.5,h*.5,w*.55); g.addColorStop(0,"#ffd1a4"); g.addColorStop(.45,"#b94c29"); g.addColorStop(1,"#4d160d"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="rgba(255,210,150,.22)"; ctx.lineWidth=18; for(let y=120;y<420;y+=62){ctx.beginPath();ctx.moveTo(50,y);ctx.bezierCurveTo(180,y-30,310,y+38,462,y-8);ctx.stroke();}
  });
}

function addSky(scene){
  if(scene.userData.phase102Sky) return; scene.userData.phase102Sky=true;
  const R = CONFIG.ROOM_RADIUS || 24;
  const moon = new THREE.Mesh(new THREE.SphereGeometry(7.5,48,24), new THREE.MeshBasicMaterial({ map:moonTex(), color:0xffffff }));
  moon.name="PHASE102_HIGH_MOON_LOCK"; moon.position.set(-210, 235, -(R+720)); scene.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(4.4,40,20), new THREE.MeshBasicMaterial({ map:marsTex(), color:0xffffff }));
  mars.name="PHASE102_HIGH_MARS_LOCK"; mars.position.set(260, 255, -(R+850)); scene.add(mars);
  const moonLight = new THREE.PointLight(0xeaf2ff, .85, 900, 2); moonLight.position.copy(moon.position); scene.add(moonLight);
  const marsLight = new THREE.PointLight(0xff9b6b, .35, 780, 2); marsLight.position.copy(mars.position); scene.add(marsLight);
}

function addRope(root,a,b,y,mat){
  const dir = new THREE.Vector3().subVectors(b,a); const len=dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,len,12), mat);
  m.position.copy(a).lerp(b,.5).add(new THREE.Vector3(0,y,0));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize()); root.add(m);
}

function addPlant(root,x,z,scale=1){
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.18,.24,.28,18), new THREE.MeshStandardMaterial({color:0x5b2a11, roughness:.75}));
  pot.position.set(x,.14,z); pot.scale.setScalar(scale); root.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({color:0x2cd56a, roughness:.65, metalness:.02, emissive:0x062510, emissiveIntensity:.18});
  for(let i=0;i<7;i++){
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(.09,.58,10), leafMat);
    const a=i/7*Math.PI*2; leaf.position.set(x+Math.cos(a)*.12*scale,.55+Math.sin(i)*.04,z+Math.sin(a)*.12*scale); leaf.rotation.z=Math.sin(a)*.65; leaf.rotation.x=Math.cos(a)*.35; leaf.scale.setScalar(scale); root.add(leaf);
  }
}

function addReiki(scene){
  if(scene.userData.phase102Reiki) return; scene.userData.phase102Reiki=true;
  const R = CONFIG.ROOM_RADIUS || 24;
  const root = new THREE.Group(); root.name="PHASE102_GREEN_REIKI_APPROVAL_HUB";
  root.position.set(R-4.2,0,0); root.lookAt(0,1.4,0); scene.add(root);
  const greenMat = new THREE.MeshStandardMaterial({ color:0x114d2a, roughness:.65, metalness:.05, emissive:0x082b17, emissiveIntensity:.45 });
  const redMat = new THREE.MeshStandardMaterial({ color:0xb50c28, roughness:.38, metalness:.12, emissive:0x680512, emissiveIntensity:.58 });
  const goldMat = new THREE.MeshStandardMaterial({ color:0xffd36b, roughness:.32, metalness:.45, emissive:0x5a3505, emissiveIntensity:.24 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10.8,5.4), new THREE.MeshStandardMaterial({color:0x0a2b17, roughness:.92, metalness:.02, emissive:0x03170b, emissiveIntensity:.2, side:THREE.DoubleSide})); floor.rotation.x=-Math.PI/2; floor.position.set(0,.014,1.0); root.add(floor);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(9.0,4.2), new THREE.MeshStandardMaterial({color:0x8e0719, roughness:.9, metalness:.02, emissive:0x310109, emissiveIntensity:.3, side:THREE.DoubleSide})); carpet.rotation.x=-Math.PI/2; carpet.position.set(0,.022,1.0); root.add(carpet);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10.5,4.1), greenMat); wall.position.set(0,2.35,.72); root.add(wall);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.8,2.0), new THREE.MeshBasicMaterial({map:signTexture("REIKI HUB",["AWAITING APPROVAL","Green wellness look restored","Red carpet • red ropes • plants"],"#75ff9f","#04180a","#070a08"), transparent:true, side:THREE.DoubleSide, depthWrite:false})); sign.position.set(0,2.45,.80); sign.renderOrder=52; root.add(sign);
  const pts=[new THREE.Vector3(-4.6,0,-.65),new THREE.Vector3(4.6,0,-.65),new THREE.Vector3(4.6,0,2.95),new THREE.Vector3(-4.6,0,2.95)];
  pts.forEach(p=>{const post=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.86,16),goldMat);post.position.copy(p).add(new THREE.Vector3(0,.43,0));root.add(post);const cap=new THREE.Mesh(new THREE.SphereGeometry(.11,16,12),redMat);cap.position.copy(p).add(new THREE.Vector3(0,.90,0));root.add(cap);});
  for(let i=0;i<pts.length;i++){addRope(root,pts[i],pts[(i+1)%pts.length],.72,redMat);addRope(root,pts[i],pts[(i+1)%pts.length],.54,redMat);}
  addPlant(root,-5.0,3.15,1.15); addPlant(root,5.0,3.15,1.15); addPlant(root,-4.9,-.95,.95); addPlant(root,4.9,-.95,.95);
  const glow = new THREE.PointLight(0x75ff9f,1.3,10,2); glow.position.set(0,2.4,1.5); root.add(glow);
}

function addEspresso(scene){
  if(scene.userData.phase102Espresso) return; scene.userData.phase102Espresso=true;
  const texLoader = new THREE.TextureLoader();
  texLoader.load("./assets/ads/espresso_lobby_wall_ad_phase91.svg?v=phase102-correct-espresso", (map)=>{
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({map, side:THREE.DoubleSide, transparent:false});
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.1,6.0), mat);
    board.name="PHASE102_CORRECT_ESPRESSO_AD_FRONT_OF_REIKI_BUILDING";
    board.position.set((CONFIG.ROOM_RADIUS||24)-5.0,4.0,-8.0);
    board.lookAt(0,2.0,0);
    board.renderOrder=56;
    scene.add(board);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(4.35,6.25), new THREE.MeshBasicMaterial({color:0x1d0d05, side:THREE.DoubleSide}));
    frame.position.copy(board.position); frame.position.z += .025; frame.quaternion.copy(board.quaternion); frame.renderOrder=55; scene.add(frame);
  });
}

function addAccessGuide(scene){
  if(scene.userData.phase102Guide) return; scene.userData.phase102Guide=true;
  const guide = new THREE.Mesh(new THREE.PlaneGeometry(7.2,2.4), new THREE.MeshBasicMaterial({map:signTexture("SMART VR GAME HUB",["Site • Game • Data modules connected","Step on portals to enter private rooms","Quest / Android / Desktop control targets locked"],"#69e8ff","#050516","#08020c"), transparent:true, side:THREE.DoubleSide, depthWrite:false}));
  guide.name="PHASE102_SMART_VR_ACCESS_INTERFACE";
  guide.position.set(0,3.2,9.8); guide.lookAt(0,2.0,0); guide.renderOrder=50; scene.add(guide);
}

function build(scene){
  if(!scene || built) return;
  built = true;
  addSky(scene);
  addReiki(scene);
  addEspresso(scene);
  addAccessGuide(scene);
  window.SVR_PHASE102_SMART_VR_POLISH = { phase:PHASE, ready:true, modules:["moon-mars-high","green-reiki-red-rope-plants","espresso-ad-front-reiki","portal-access-guide"], performance:"one-time only" };
}

function scan(){
  for(const scene of scenes){ if(!built && scene.children?.length > 8) build(scene); }
  if(!built) setTimeout(()=>requestAnimationFrame(scan), 250);
}

const originalAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function phase102SceneAdd(...objects){
  scenes.add(this);
  return originalAdd.apply(this, objects);
};
requestAnimationFrame(scan);
console.log(`[SVR] ${PHASE} loaded`);
