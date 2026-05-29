import * as THREE from "three";

const PHASE129 = "PHASE-129-LOUNGE-STOREFRONT-USER-POSITION";
const TARGET = new THREE.Vector3(-15.93, 0, 5.28);
let lastScene = null;
let done = false;

function makeTex(){
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 760;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#040407"); g.addColorStop(.5,"#171019"); g.addColorStop(1,"#030305");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "#ffd77b"; x.lineWidth = 18; x.strokeRect(30,30,c.width-60,c.height-60);
  x.strokeStyle = "#71f7ff"; x.lineWidth = 6; x.strokeRect(72,72,c.width-144,c.height-144);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = "#71f7ff"; x.shadowBlur = 18;
  x.fillStyle = "#fff7e3"; x.font = "900 100px Arial"; x.fillText("SVR EXECUTIVE", c.width/2, 265);
  x.fillStyle = "#ffd77b"; x.font = "900 112px Arial"; x.fillText("LOUNGE", c.width/2, 390);
  x.shadowColor = "#ffd77b"; x.fillStyle = "#71f7ff"; x.font = "800 38px Arial"; x.fillText("PRIVATE SOCIAL PORTAL • VIP HANGOUT", c.width/2, 490);
  x.shadowBlur = 0; x.fillStyle = "rgba(255,255,255,.85)"; x.font = "700 29px Arial"; x.fillText("MAGNETIC QUICK SELECT READY", c.width/2, 560);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function install(scene){
  if(!scene || done) return false;
  done = true;

  const old = scene.getObjectByName("FORCED_VISIBLE_EXECUTIVE_LOUNGE_PHASE128");
  if(old){
    old.position.copy(TARGET);
    old.lookAt(new THREE.Vector3(0,2.4,0));
    old.name = "LOUNGE_STOREFRONT_USER_POSITION_PHASE129";
    old.visible = true;
    old.frustumCulled = false;
    scene.userData.phase129LoungeStorefront = old;
    console.log(`[${PHASE129}] moved existing storefront`, TARGET);
    return true;
  }

  const root = new THREE.Group();
  root.name = "LOUNGE_STOREFRONT_USER_POSITION_PHASE129";
  root.position.copy(TARGET);
  root.lookAt(new THREE.Vector3(0,2.4,0));
  root.frustumCulled = false;

  const back = new THREE.Mesh(new THREE.BoxGeometry(10.5,5.6,.24), new THREE.MeshBasicMaterial({color:0x050508,toneMapped:false}));
  back.position.set(0,3.0,.12); root.add(back);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(9.8,5.15), new THREE.MeshBasicMaterial({map:makeTex(),side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false}));
  panel.position.set(0,3.0,-.04); panel.renderOrder = 170000; panel.frustumCulled = false; root.add(panel);
  const glow = new THREE.PointLight(0xffd77b,2.1,12,2); glow.position.set(0,3.6,1.2); root.add(glow);
  scene.add(root);
  scene.userData.phase129LoungeStorefront = root;
  console.log(`[${PHASE129}] created fallback storefront`, TARGET);
  return true;
}

const r = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrLoungeStorefrontPhase129){
  THREE.WebGLRenderer.prototype.__svrLoungeStorefrontPhase129 = true;
  THREE.WebGLRenderer.prototype.render = function(scene,camera){ lastScene = scene || lastScene; install(lastScene); return r.call(this,scene,camera); };
}
setInterval(()=>install(lastScene),800);
console.log(`[${PHASE129}] loaded`);
