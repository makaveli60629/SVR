import * as THREE from "three";

const PHASE128 = "PHASE-128-FORCED-VISIBLE-EXECUTIVE-LOUNGE";
let lastScene = null;
let installed = false;

const LOUNGE_WORLD = new THREE.Vector3(-20.74, 0.0, 5.00);

function rr(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

function makeTexture(){
  const c=document.createElement('canvas'); c.width=1800; c.height=900;
  const x=c.getContext('2d');
  const bg=x.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0,'#030306'); bg.addColorStop(.5,'#151018'); bg.addColorStop(1,'#050306');
  x.fillStyle=bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle='#ffd77b'; x.lineWidth=18; rr(x,34,34,c.width-68,c.height-68,42); x.stroke();
  x.strokeStyle='rgba(113,247,255,.85)'; x.lineWidth=6; rr(x,80,80,c.width-160,c.height-160,28); x.stroke();

  // Martini / executive emblem.
  x.save(); x.translate(330,390); x.shadowBlur=28; x.shadowColor='#ffd77b';
  x.strokeStyle='#ffd77b'; x.lineWidth=14; x.lineCap='round'; x.lineJoin='round';
  x.beginPath(); x.moveTo(-185,-170); x.lineTo(185,-170); x.lineTo(44,38); x.quadraticCurveTo(0,82,-44,38); x.closePath(); x.stroke();
  x.strokeStyle='#71f7ff'; x.lineWidth=10; x.beginPath(); x.moveTo(0,70); x.lineTo(0,225); x.stroke();
  x.beginPath(); x.moveTo(-92,225); x.quadraticCurveTo(0,264,92,225); x.stroke();
  x.strokeStyle='#ff4fd8'; x.lineWidth=11; x.beginPath(); x.moveTo(40,-170); x.bezierCurveTo(125,-240,95,-330,10,-292); x.bezierCurveTo(-74,-255,-26,-190,40,-170); x.stroke();
  x.restore();

  x.textAlign='left'; x.textBaseline='middle';
  x.shadowColor='#71f7ff'; x.shadowBlur=14;
  x.fillStyle='#fff7e3'; x.font='900 126px Arial'; x.fillText('SVR EXECUTIVE',620,330);
  x.fillStyle='#ffd77b'; x.font='900 120px Arial'; x.fillText('LOUNGE',620,455);
  x.shadowColor='#ffd77b'; x.fillStyle='#71f7ff'; x.font='800 42px Arial'; x.fillText('PRIVATE SOCIAL PORTAL  •  VIP HANGOUT',628,545);
  x.shadowBlur=0; x.fillStyle='rgba(255,255,255,.86)'; x.font='700 32px Arial';
  x.fillText('Fist teleport logo on marker → release to enter',632,610);

  x.fillStyle='rgba(255,215,123,.16)'; rr(x,620,690,980,92,22); x.fill();
  x.strokeStyle='rgba(255,215,123,.80)'; x.lineWidth=4; rr(x,620,690,980,92,22); x.stroke();
  x.fillStyle='#fff7e3'; x.font='900 40px Arial'; x.fillText('MAGNETIC QUICK-SELECT READY',660,736);

  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; return tex;
}

function makeDoorTexture(){
  const c=document.createElement('canvas'); c.width=900; c.height=1300;
  const x=c.getContext('2d');
  const bg=x.createLinearGradient(0,0,c.width,c.height); bg.addColorStop(0,'#050508'); bg.addColorStop(.5,'#151018'); bg.addColorStop(1,'#020203');
  x.fillStyle=bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle='#ffd77b'; x.lineWidth=20; rr(x,42,42,c.width-84,c.height-84,36); x.stroke();
  x.strokeStyle='rgba(113,247,255,.85)'; x.lineWidth=7; rr(x,92,92,c.width-184,c.height-184,24); x.stroke();
  x.textAlign='center'; x.textBaseline='middle'; x.shadowBlur=22; x.shadowColor='#ffd77b';
  x.fillStyle='#ffd77b'; x.font='900 78px Arial'; x.fillText('ENTER',450,555);
  x.fillStyle='#fff7e3'; x.font='900 82px Arial'; x.fillText('LOUNGE',450,655);
  x.shadowBlur=0; x.fillStyle='rgba(255,255,255,.80)'; x.font='800 34px Arial'; x.fillText('PRIVATE ROOM',450,730);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; return tex;
}

function hideOld(scene){
  ["EXECUTIVE_LOUNGE_STOREFRONT_PHASE127","LOUNGE_PORTAL_HOLOGRAM_PHASE126"].forEach((name)=>{
    const o=scene.getObjectByName(name); if(o) o.visible=false;
  });
}

function add(root,obj,x,y,z){ obj.position.set(x,y,z); obj.frustumCulled=false; root.add(obj); return obj; }

function install(scene){
  if(!scene || installed) return false;
  installed=true;
  hideOld(scene);

  const root=new THREE.Group();
  root.name='FORCED_VISIBLE_EXECUTIVE_LOUNGE_PHASE128';
  root.position.copy(LOUNGE_WORLD);
  root.lookAt(new THREE.Vector3(0,2.4,0));
  root.frustumCulled=false;

  const black=new THREE.MeshBasicMaterial({color:0x040407,toneMapped:false});
  const gold=new THREE.MeshBasicMaterial({color:0xffd77b,toneMapped:false});
  const cyan=new THREE.MeshBasicMaterial({color:0x71f7ff,toneMapped:false});

  add(root,new THREE.Mesh(new THREE.BoxGeometry(14.0,7.4,.28),black),0,3.7,.18);
  add(root,new THREE.Mesh(new THREE.BoxGeometry(14.4,.20,.40),gold),0,7.45,.04);
  add(root,new THREE.Mesh(new THREE.BoxGeometry(14.4,.12,.34),cyan),0,.08,.04);
  add(root,new THREE.Mesh(new THREE.BoxGeometry(.22,7.4,.40),gold),-7.15,3.75,.04);
  add(root,new THREE.Mesh(new THREE.BoxGeometry(.22,7.4,.40),gold),7.15,3.75,.04);

  const header=new THREE.Mesh(new THREE.PlaneGeometry(12.8,6.4),new THREE.MeshBasicMaterial({map:makeTexture(),transparent:true,side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false}));
  header.name='PHASE128_EXECUTIVE_LOUNGE_VISIBLE_HEADER'; header.renderOrder=160000; add(root,header,0,4.25,-.08);

  const door=new THREE.Mesh(new THREE.PlaneGeometry(2.8,4.05),new THREE.MeshBasicMaterial({map:makeDoorTexture(),transparent:true,side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false}));
  door.name='PHASE128_LOUNGE_ENTRY_DOOR_VISIBLE'; door.renderOrder=160001; add(root,door,0,2.28,-.14);

  add(root,new THREE.Mesh(new THREE.BoxGeometry(11.4,.08,2.45),black),0,.04,1.28);
  add(root,new THREE.Mesh(new THREE.BoxGeometry(9.4,.045,.10),gold),0,.12,1.28);

  add(root,new THREE.PointLight(0xffd77b,2.2,12,2),0,4.9,1.3);
  add(root,new THREE.PointLight(0x71f7ff,1.6,10,2),-4.5,3.8,1.1);
  add(root,new THREE.PointLight(0xff4fd8,1.4,10,2),4.5,3.8,1.1);

  scene.add(root);
  scene.userData.phase128ForcedLoungeStorefront=root;
  console.log(`[${PHASE128}] forced visible lounge storefront installed`, root.position);
  return true;
}

const originalRender=THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrLoungeStorefrontPhase128){
  THREE.WebGLRenderer.prototype.__svrLoungeStorefrontPhase128=true;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){ lastScene=scene||lastScene; install(lastScene); return originalRender.call(this,scene,camera); };
}
setInterval(()=>install(lastScene),1000);
console.log(`[${PHASE128}] loaded`);
