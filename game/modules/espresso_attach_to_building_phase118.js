import * as THREE from "three";

const PHASE118 = "PHASE-118-ESPRESSO-ATTACH-TO-VISIBLE-BLUE-BUILDING";
let lastScene = null;
let installed = false;

function rectTexture(){
  const c=document.createElement('canvas'); c.width=900; c.height=1400;
  const x=c.getContext('2d');
  x.fillStyle='#100204'; x.fillRect(0,0,900,1400);
  x.strokeStyle='#ffd77b'; x.lineWidth=28; x.strokeRect(35,35,830,1330);
  x.strokeStyle='rgba(255,215,123,.7)'; x.lineWidth=4; x.strokeRect(60,60,780,1280);
  x.fillStyle='#e10d0d'; x.fillRect(95,88,180,55);
  x.fillStyle='#fff'; x.font='900 32px Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('1ST TIER',185,116);
  const wood=x.createLinearGradient(90,120,810,760); wood.addColorStop(0,'#c88a3d'); wood.addColorStop(.55,'#e7bd72'); wood.addColorStop(1,'#935b29');
  x.fillStyle=wood; x.fillRect(90,120,720,690); x.strokeStyle='#f1b958'; x.lineWidth=8; x.strokeRect(90,120,720,690);
  x.fillStyle='#fff8e8'; x.beginPath(); x.ellipse(450,610,275,105,0,0,Math.PI*2); x.fill();
  x.fillStyle='#fff8e8'; x.beginPath(); x.ellipse(450,430,265,145,0,0,Math.PI*2); x.fill();
  const crema=x.createRadialGradient(440,390,25,440,390,240); crema.addColorStop(0,'#ffe4a4'); crema.addColorStop(.45,'#d98b35'); crema.addColorStop(1,'#6d2b08');
  x.fillStyle=crema; x.beginPath(); x.ellipse(450,390,230,118,0,0,Math.PI*2); x.fill();
  x.fillStyle='rgba(76,22,4,.55)'; for(let i=0;i<250;i++){x.beginPath();x.arc(280+((i*37)%340),300+((i*61)%160),2+((i*11)%5),0,Math.PI*2);x.fill();}
  x.fillStyle='rgba(8,1,2,.96)'; x.fillRect(85,850,730,270); x.strokeStyle='#ffd77b'; x.lineWidth=6; x.strokeRect(85,850,730,270);
  x.fillStyle='#fff7e3'; x.font='900 90px Arial'; x.fillText('ESPRESSO',450,948);
  x.fillStyle='#ffd77b'; x.font='900 76px Arial'; x.fillText('WITH CREAM',450,1040);
  x.fillStyle='#fff'; x.font='900 30px Arial'; x.fillText('REAL PHOTO AD TEXTURE',450,1095);
  x.fillStyle='#3a1d0e'; x.fillRect(120,1210,660,95); x.strokeStyle='#ffd77b'; x.lineWidth=5; x.strokeRect(120,1210,660,95);
  x.fillStyle='#fff7e3'; x.font='900 39px Arial'; x.fillText('SVR LOBBY WALL AD',450,1260);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}

function isCandidateBuilding(obj){
  if(!obj?.isMesh || !obj.geometry || !obj.visible) return false;
  let p=obj; while(p){ const n=String(p.name||'').toLowerCase(); if(/portal|chair|seat|table|card|chip|hand|watch|ad|billboard|espresso|pga|reiki_room/.test(n)) return false; p=p.parent; }
  const box=new THREE.Box3().setFromObject(obj); const size=new THREE.Vector3(); const center=new THREE.Vector3(); box.getSize(size); box.getCenter(center);
  if(size.y<5 || center.y<2) return false;
  const mat=Array.isArray(obj.material)?obj.material[0]:obj.material; const col=mat?.color;
  const blue=col ? (col.b>0.25 && col.b>=col.r && col.g>=col.r*.65) : true;
  return blue && size.x>0.5 && size.z>0.3;
}

function pickBuilding(scene){
  const items=[];
  scene.traverse(o=>{
    if(!isCandidateBuilding(o)) return;
    const box=new THREE.Box3().setFromObject(o); const size=new THREE.Vector3(); const center=new THREE.Vector3(); box.getSize(size); box.getCenter(center);
    // Favor tall blue buildings in the visible Reiki-side skyline, but keep robust if names/coords shift.
    const score=size.y*4 + Math.max(size.x,size.z)*2 - Math.abs(center.z+12)*0.2 - Math.abs(center.x)*0.05;
    items.push({o,box,size,center,score});
  });
  items.sort((a,b)=>b.score-a.score);
  return items[0]||null;
}

function install(scene){
  if(!scene || installed) return false;
  const hit=pickBuilding(scene);
  if(!hit) return false;
  installed=true;

  const root=new THREE.Group(); root.name='ESPRESSO_PHASE118_ATTACHED_TO_BLUE_BUILDING'; root.frustumCulled=false;
  const toLobby=new THREE.Vector3(0,3,0).sub(hit.center).normalize();
  const pos=hit.center.clone(); pos.y=Math.min(hit.center.y+hit.size.y*.12, hit.box.max.y-2.0); pos.addScaledVector(toLobby, .18);
  root.position.copy(pos); root.lookAt(new THREE.Vector3(0,3,0));

  const maxWidth=Math.min(8.0, Math.max(4.2, hit.size.x*1.25));
  const height=maxWidth*1.55;
  const back=new THREE.Mesh(new THREE.BoxGeometry(maxWidth+.35,height+.35,.16), new THREE.MeshBasicMaterial({color:0x050102,toneMapped:false,depthTest:false}));
  back.renderOrder=99997; back.frustumCulled=false; root.add(back);
  const ad=new THREE.Mesh(new THREE.PlaneGeometry(maxWidth,height), new THREE.MeshBasicMaterial({map:rectTexture(),side:THREE.DoubleSide,toneMapped:false,depthTest:false,depthWrite:false}));
  ad.name='ESPRESSO_PHASE118_AD_ON_SELECTED_BUILDING_FACE'; ad.renderOrder=99999; ad.frustumCulled=false; ad.position.z=-.10; root.add(ad);
  const light=new THREE.PointLight(0xffd77b,2.5,28,2); light.position.set(0,0,-2.4); root.add(light);
  scene.add(root);
  scene.userData.phase118EspressoBuildingTarget={name:hit.o.name,center:hit.center,size:hit.size};
  console.log(`[${PHASE118}] attached to building`, hit.o.name, hit.center, hit.size);
  return true;
}

const originalRender=THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrEspressoPhase118){
  THREE.WebGLRenderer.prototype.__svrEspressoPhase118=true;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){ lastScene=scene||lastScene; install(lastScene); return originalRender.call(this,scene,camera); };
}
setInterval(()=>install(lastScene),700);
console.log(`[${PHASE118}] loaded`);
