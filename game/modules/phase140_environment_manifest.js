import * as THREE from "three";

const PHASE140_ENV = "PHASE-140-ENVIRONMENT-ANCHOR-MANIFEST";
let lastScene = null;
let installed = false;

const LOUNGE_POS = new THREE.Vector3(-20.74, 0, 5.00);
const CAT_POS = new THREE.Vector3(0, 0.08, 17.82);

function makeLabelTexture(title, subtitle, color = "#71f7ff"){
  const c = document.createElement("canvas"); c.width = 1400; c.height = 720;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#030307"); g.addColorStop(.5,"#16091f"); g.addColorStop(1,"#030307");
  x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="#ffd77b"; x.lineWidth=18; x.strokeRect(30,30,c.width-60,c.height-60);
  x.strokeStyle=color; x.lineWidth=7; x.strokeRect(78,78,c.width-156,c.height-156);
  x.textAlign="center"; x.textBaseline="middle"; x.shadowColor=color; x.shadowBlur=20;
  x.fillStyle="#fff7e3"; x.font="900 104px Arial"; x.fillText(title,c.width/2,270);
  x.shadowColor="#ffd77b"; x.fillStyle="#ffd77b"; x.font="900 44px Arial"; x.fillText(subtitle,c.width/2,365);
  x.shadowBlur=0; x.fillStyle="rgba(255,255,255,.86)"; x.font="700 30px Arial"; x.fillText("FIST TELEPORT MARKER • RELEASE TO ENTER",c.width/2,465);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function makePlanetTexture(kind){
  const c=document.createElement("canvas"); c.width=c.height=512; const x=c.getContext("2d"); const s=c.width;
  const moon=kind==="moon";
  const g=x.createRadialGradient(s*.35,s*.30,s*.04,s*.52,s*.52,s*.52);
  if(moon){ g.addColorStop(0,"#fff"); g.addColorStop(.35,"#eef5ff"); g.addColorStop(.72,"#aeb9c8"); g.addColorStop(1,"#505865"); }
  else { g.addColorStop(0,"#ffc58e"); g.addColorStop(.35,"#e37a4c"); g.addColorStop(.72,"#8b301b"); g.addColorStop(1,"#2d0c07"); }
  x.fillStyle=g; x.fillRect(0,0,s,s);
  for(let i=0;i<90;i++){ x.fillStyle = moon ? "rgba(50,58,70,.22)" : (i%3?"rgba(55,10,6,.25)":"rgba(255,220,150,.24)"); x.beginPath(); x.ellipse(Math.random()*s,Math.random()*s,moon?3+Math.random()*18:20+Math.random()*95,moon?3+Math.random()*18:3+Math.random()*16,Math.random()*Math.PI,0,Math.PI*2); x.fill(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

function add(root,obj,x,y,z){ obj.position.set(x,y,z); obj.frustumCulled=false; root.add(obj); return obj; }

function install(scene){
  if(!scene || installed) return false;
  installed = true;

  // Lounge storefront anchored exactly to requested portal coordinate.
  const lounge = new THREE.Group(); lounge.name="PHASE140_LOUNGE_STOREFRONT_ANCHORED"; lounge.position.copy(LOUNGE_POS); lounge.lookAt(new THREE.Vector3(0,2.2,0)); lounge.frustumCulled=false;
  add(lounge,new THREE.Mesh(new THREE.BoxGeometry(12.5,6.2,.22),new THREE.MeshBasicMaterial({color:0x030307,toneMapped:false})),0,3.25,.12);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(11.7,5.5),new THREE.MeshBasicMaterial({map:makeLabelTexture("THE LOUNGE","PRIVATE SOCIAL ROOM"),side:THREE.DoubleSide,toneMapped:false,depthWrite:false}));
  panel.renderOrder=240000; add(lounge,panel,0,3.25,-.05);
  add(lounge,new THREE.Mesh(new THREE.RingGeometry(1.08,1.38,72),new THREE.MeshBasicMaterial({color:0xffd77b,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})),0,.12,1.32).rotation.x=-Math.PI/2;
  add(lounge,new THREE.PointLight(0xffd77b,2.5,13,2),0,4.2,1.0);
  scene.add(lounge);

  // South wall cat position marker/fallback, facing north toward poker pit.
  const cat = scene.getObjectByName("SOUTH_WALL_CAT_DECOR_PHASE136") || scene.getObjectByName("SOUTH_WALL_CAT_DECOR_PHASE135");
  if(cat){ cat.position.copy(CAT_POS); cat.lookAt(new THREE.Vector3(0,.6,0)); cat.visible=true; cat.frustumCulled=false; }

  // High-visibility celestial layer, depth disabled and high render order.
  const sky = new THREE.Group(); sky.name="PHASE140_CELESTIAL_FORCE_LAYER"; sky.frustumCulled=false;
  const moon = new THREE.Mesh(new THREE.SphereGeometry(6,64,32),new THREE.MeshBasicMaterial({map:makePlanetTexture("moon"),color:0xffffff,depthWrite:false,depthTest:false,toneMapped:false}));
  moon.name="PHASE140_FORCE_VISIBLE_MOON"; moon.position.set(-15,65,-120); moon.renderOrder=260000; moon.frustumCulled=false; sky.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(3.8,64,32),new THREE.MeshBasicMaterial({map:makePlanetTexture("mars"),color:0xffffff,depthWrite:false,depthTest:false,toneMapped:false}));
  mars.name="PHASE140_FORCE_VISIBLE_MARS"; mars.position.set(35,75,-110); mars.renderOrder=260001; mars.frustumCulled=false; sky.add(mars);
  scene.add(sky);
  scene.userData._phase140EnvTick = (dt)=>{ const t=performance.now()*.001; moon.rotation.y+=dt*.12; mars.rotation.y+=dt*.16; moon.position.x=-15+Math.sin(t*.04)*5; mars.position.x=35+Math.sin(t*.035+1)*5; };
  console.log(`[${PHASE140_ENV}] installed`);
  return true;
}

const r = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrPhase140Env){
  THREE.WebGLRenderer.prototype.__svrPhase140Env=true;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){ lastScene=scene||lastScene; install(lastScene); if(lastScene?.userData?._phase140EnvTick) lastScene.userData._phase140EnvTick(0.016); return r.call(this,scene,camera); };
}
setInterval(()=>install(lastScene),1000);
console.log(`[${PHASE140_ENV}] loaded`);
