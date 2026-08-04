import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-204-VISUAL-GUIDE-LOCK";

function makeTex(text, sub, color){
  const c = document.createElement("canvas");
  c.width = 720;
  c.height = 220;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(0,0,0,.82)";
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = color;
  x.lineWidth = 10;
  x.strokeRect(14,14,c.width-28,c.height-28);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#fff";
  x.font = "900 54px system-ui,Arial";
  x.fillText(text,c.width/2,86);
  x.fillStyle = "#eaf5ff";
  x.font = "700 24px system-ui,Arial";
  x.fillText(sub,c.width/2,150);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function addGuide(root, name, text, sub, color, x, y, z){
  const p = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55,.48),
    new THREE.MeshBasicMaterial({ map:makeTex(text,sub,color), transparent:true, side:THREE.DoubleSide, depthWrite:false })
  );
  p.name = name;
  p.position.set(x,y,z);
  p.renderOrder = 210;
  root.add(p);
  return p;
}
function install(){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__;
  if (!scene || !camera || window.SVR_PHASE204_INSTALLED) return false;
  const old = scene.getObjectByName("PHASE204_VISUAL_GUIDE_ROOT");
  if (old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = "PHASE204_VISUAL_GUIDE_ROOT";
  scene.add(root);
  addGuide(root,"PHASE204_GUIDE_BACK","BACK","previous slide","#7ffcff",-13.08,1.16,-10.70);
  addGuide(root,"PHASE204_GUIDE_NEXT","NEXT","next slide","#ffd98a",-10.92,1.16,-10.70);
  addGuide(root,"PHASE204_GUIDE_ENTER","ENTER ROOM","meditation route","#a77cff",-12,0.88,-10.70);
  addGuide(root,"PHASE204_GUIDE_STORE","STORE","opens web store","#8dffb4",6,1.42,-10.25);
  addGuide(root,"PHASE204_GUIDE_PGA","PGA","practice bay","#7ffcff",-6,1.42,-10.25);
  addGuide(root,"PHASE204_GUIDE_SCORPION","SCORPION","private room","#ff5b8c",12,1.42,-10.25);
  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt)=>{
    if (typeof oldTick === "function") oldTick(dt);
    root.children.forEach(p=>p.lookAt(camera.position));
  };
  window.SVR_PHASE204_INSTALLED = true;
  window.SVR_PHASE204_VISUAL_GUIDE = { label:LABEL, locked:true, guideLabels:true, carouselLabels:true, routeLabels:true, checkedAt:new Date().toISOString() };
  return true;
}
function label(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE204 = { build:LABEL, active:true, visualGuide:true };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if ((el.textContent||"").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}
label();
let tries = 0;
const timer = setInterval(()=>{ label(); tries++; if (install() || tries > 80) clearInterval(timer); },250);
setTimeout(install,1000);
setTimeout(install,2500);
