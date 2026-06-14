import * as THREE from "three";

const LABEL = "UPDATE-3.1-J-PHASE-230-MOON-OFF-TABLE-LABEL-LOCK";
const TITLE = `SVR Poker • ${LABEL}`;
const MOON_NAME = "PHASE230_SMALL_HIGH_SKY_MOON";
const MARS_NAME = "PHASE230_SMALL_HIGH_SKY_MARS";
const LABEL_ID = "svr-phase-230-label";

function stamp(){
  window.SVR_PHASE230 = {
    build: LABEL,
    active: true,
    phase: "3.1-J",
    moonOffTable: true,
    smallHighSkyMoon: true,
    titleGuard: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-J",
    phase230: true,
    moonOffTable: true,
    checkedAt: new Date().toISOString()
  });
  try { document.title = TITLE; } catch {}
}

function guardTitle(){
  try{
    Object.defineProperty(window, "SVR_CURRENT_BUILD", { configurable:true, get(){ return LABEL; }, set(){} });
    Object.defineProperty(window, "SVR_LOCKED_FINAL_BUILD", { configurable:true, get(){ return LABEL; }, set(){} });
  }catch{}
  const titleEl = document.querySelector("title");
  if(titleEl && !window.SVR_PHASE230_TITLE_OBSERVER){
    window.SVR_PHASE230_TITLE_OBSERVER = true;
    new MutationObserver(()=>{ if(titleEl.textContent !== TITLE) titleEl.textContent = TITLE; }).observe(titleEl,{childList:true,characterData:true,subtree:true});
  }
}

function domLabel(){
  let el = document.getElementById(LABEL_ID);
  if(!el){
    el = document.createElement("div");
    el.id = LABEL_ID;
    el.style.cssText = "position:fixed;right:10px;top:10px;z-index:999999;background:rgba(0,0,0,.78);border:1px solid #ffd98a;color:#ffd98a;font:800 11px system-ui,Arial;padding:6px 9px;border-radius:8px;letter-spacing:.06em;pointer-events:none;";
    document.body.appendChild(el);
  }
  el.textContent = "PHASE 230 ACTIVE • MOON OFF TABLE";
  document.getElementById("svr-phase-final-label")?.remove();
}

function makeMoonTexture(){
  const c=document.createElement("canvas"); c.width=384; c.height=384;
  const ctx=c.getContext("2d");
  const g=ctx.createRadialGradient(145,110,18,192,192,190);
  g.addColorStop(0,"#fff"); g.addColorStop(.42,"#d8d8d2"); g.addColorStop(.78,"#8f8e88"); g.addColorStop(1,"#3a3a36");
  ctx.fillStyle=g; ctx.fillRect(0,0,384,384);
  for(let i=0;i<58;i++){
    const x=Math.random()*384, y=Math.random()*384, r=3+Math.random()*18;
    ctx.fillStyle=`rgba(30,30,30,${.08+Math.random()*.12})`;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

function makeMarsTexture(){
  const c=document.createElement("canvas"); c.width=256; c.height=256;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,256,256);
  g.addColorStop(0,"#e78e52"); g.addColorStop(.55,"#b33b22"); g.addColorStop(1,"#551910");
  ctx.fillStyle=g; ctx.fillRect(0,0,256,256);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

function removeAllOldSky(scene){
  const remove=[];
  scene.traverse(o=>{
    const n=String(o.name||"");
    if((/moon/i.test(n) || /mars/i.test(n)) && n!==MOON_NAME && n!==MARS_NAME) remove.push(o);
  });
  remove.forEach(o=>{ o.visible=false; o.parent?.remove(o); });
  return remove.length;
}

function sky(scene){
  const removed = removeAllOldSky(scene);
  let moon = scene.getObjectByName(MOON_NAME);
  if(!moon){
    moon = new THREE.Mesh(new THREE.SphereGeometry(1.15,40,24), new THREE.MeshStandardMaterial({ map:makeMoonTexture(), roughness:.9, emissive:0x777777, emissiveIntensity:.12 }));
    moon.name = MOON_NAME;
    scene.add(moon);
  }
  moon.position.set(-34,42,-118);
  moon.scale.setScalar(1);
  moon.visible = true;
  moon.rotation.y += 0.001;

  let mars = scene.getObjectByName(MARS_NAME);
  if(!mars){
    mars = new THREE.Mesh(new THREE.SphereGeometry(.65,30,18), new THREE.MeshStandardMaterial({ map:makeMarsTexture(), roughness:.85, emissive:0x331000, emissiveIntensity:.10 }));
    mars.name = MARS_NAME;
    scene.add(mars);
  }
  mars.position.set(16,38,-125);
  mars.scale.setScalar(1);
  mars.visible = true;
  mars.rotation.y += 0.0015;
  window.SVR_PHASE230_SKY = { build:LABEL, removedOldSkyObjects:removed, moon:{x:moon.position.x,y:moon.position.y,z:moon.position.z}, mars:{x:mars.position.x,y:mars.position.y,z:mars.position.z}, checkedAt:new Date().toISOString() };
}

function install(){
  stamp();
  guardTitle();
  domLabel();
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  sky(scene);
  return true;
}

stamp();
guardTitle();
domLabel();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>220) clearInterval(timer); },150);
setInterval(install,600);
