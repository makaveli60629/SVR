import * as THREE from "three";

const LABEL = "UPDATE-3.1-I-FINAL-PHASE-LABEL-MOON-REALIGN-LOCK";
const TITLE = `SVR Poker • ${LABEL}`;
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const MOON_NAME = "PHASE229_SAFE_HIGH_SKY_MOON";
const MARS_NAME = "PHASE229_SAFE_HIGH_SKY_MARS";
const SIGN_NAME = "PHASE229_RUNTIME_LABEL_SIGN";

function stamp(){
  window.SVR_PHASE229 = {
    build: LABEL,
    active: true,
    phase: "3.1-I",
    finalPhaseLabel: true,
    moonMovedOffTable: true,
    titleGuard: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-I",
    finalPhaseLabel: true,
    moonMovedOffTable: true,
    checkedAt: new Date().toISOString()
  });
  window.SVR_PHASE106 = Object.assign(window.SVR_PHASE106 || {}, { build: LABEL });
  try { document.title = TITLE; } catch {}
}

function installTitleGuard(){
  if(window.SVR_PHASE229_TITLE_GUARD_INSTALLED) return;
  window.SVR_PHASE229_TITLE_GUARD_INSTALLED = true;
  const desc = Object.getOwnPropertyDescriptor(Document.prototype, "title");
  if(desc?.get && desc?.set){
    try{
      Object.defineProperty(document, "title", {
        configurable: true,
        get(){ return TITLE; },
        set(v){ desc.set.call(document, String(v || "").includes(LABEL) ? String(v) : TITLE); }
      });
    }catch{}
  }
  try{
    Object.defineProperty(window, "SVR_CURRENT_BUILD", { configurable:true, get(){ return LABEL; }, set(){} });
    Object.defineProperty(window, "SVR_LOCKED_FINAL_BUILD", { configurable:true, get(){ return LABEL; }, set(){} });
  }catch{}
  const titleEl = document.querySelector("title");
  if(titleEl){
    const obs = new MutationObserver(()=>{ if(titleEl.textContent !== TITLE) titleEl.textContent = TITLE; });
    obs.observe(titleEl,{ childList:true, characterData:true, subtree:true });
  }
}

function installDomLabel(){
  let el = document.getElementById("svr-phase-final-label");
  if(!el){
    el = document.createElement("div");
    el.id = "svr-phase-final-label";
    el.style.cssText = "position:fixed;right:10px;top:10px;z-index:999999;background:rgba(0,0,0,.72);border:1px solid #7ffcff;color:#7ffcff;font:700 11px system-ui,Arial;padding:6px 8px;border-radius:8px;letter-spacing:.06em;pointer-events:none;";
    document.body.appendChild(el);
  }
  el.textContent = "PHASE 229 ACTIVE • 3.1-I";
}

function makeMoonTexture(){
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(210,170,20,256,256,255);
  g.addColorStop(0,"#ffffff");
  g.addColorStop(.38,"#d8d8d2");
  g.addColorStop(.72,"#8d8b86");
  g.addColorStop(1,"#353631");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,512,512);
  for(let i=0;i<85;i++){
    const x=Math.random()*512, y=Math.random()*512, r=3+Math.random()*26;
    const cg=ctx.createRadialGradient(x,y,1,x,y,r);
    cg.addColorStop(0,"rgba(45,45,42,.34)");
    cg.addColorStop(.65,"rgba(120,120,115,.10)");
    cg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeMarsTexture(){
  const c=document.createElement("canvas"); c.width=256; c.height=256;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,256,256);
  g.addColorStop(0,"#f0a05d"); g.addColorStop(.45,"#b84424"); g.addColorStop(1,"#5a1e16");
  ctx.fillStyle=g; ctx.fillRect(0,0,256,256);
  for(let i=0;i<40;i++){ ctx.fillStyle=`rgba(80,25,12,${.08+Math.random()*.12})`; ctx.fillRect(Math.random()*256,Math.random()*256,30+Math.random()*80,2+Math.random()*8); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

function cleanOldMoons(scene){
  const remove=[];
  scene.traverse(o=>{
    const n=String(o.name||"");
    if((/moon/i.test(n) || /mars/i.test(n)) && n!==MOON_NAME && n!==MARS_NAME) remove.push(o);
  });
  remove.forEach(o=>{ o.visible=false; o.parent?.remove(o); });
  return remove.length;
}

function ensureSafeSky(scene){
  let removed = cleanOldMoons(scene);
  let moon = scene.getObjectByName(MOON_NAME);
  if(!moon){
    moon = new THREE.Mesh(new THREE.SphereGeometry(2.35,48,32), new THREE.MeshStandardMaterial({ map:makeMoonTexture(), roughness:.92, metalness:0, emissive:0x888888, emissiveIntensity:.18 }));
    moon.name = MOON_NAME;
    scene.add(moon);
    const halo = new THREE.Mesh(new THREE.RingGeometry(2.75,3.55,96), new THREE.MeshBasicMaterial({ color:0xcfd8ff, transparent:true, opacity:.20, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending }));
    halo.name = "PHASE229_SAFE_MOON_HIGH_HALO";
    moon.add(halo);
  }
  moon.position.set(-24,34,-72);
  moon.scale.setScalar(1);
  moon.visible = true;
  moon.rotation.y += 0.0012;

  let mars = scene.getObjectByName(MARS_NAME);
  if(!mars){
    mars = new THREE.Mesh(new THREE.SphereGeometry(1.05,32,24), new THREE.MeshStandardMaterial({ map:makeMarsTexture(), roughness:.85, emissive:0x331000, emissiveIntensity:.13 }));
    mars.name = MARS_NAME;
    scene.add(mars);
  }
  mars.position.set(8,31,-80);
  mars.scale.setScalar(1);
  mars.visible = true;
  mars.rotation.y += 0.0018;
  window.SVR_PHASE229_SKY_REALIGN = { build:LABEL, removedOldSkyObjects:removed, moon:{x:moon.position.x,y:moon.position.y,z:moon.position.z}, mars:{x:mars.position.x,y:mars.position.y,z:mars.position.z}, checkedAt:new Date().toISOString() };
}

function signTexture(){
  const c=document.createElement("canvas"); c.width=1024; c.height=256;
  const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(0,0,0,.82)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle="#7ffcff"; ctx.lineWidth=8; ctx.strokeRect(10,10,c.width-20,c.height-20);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#7ffcff"; ctx.font="900 54px system-ui,Arial"; ctx.fillText("PHASE 229 ACTIVE",512,96);
  ctx.fillStyle="#ffd98a"; ctx.font="800 30px system-ui,Arial"; ctx.fillText("FINAL RUNTIME • MOON REALIGNED HIGH SKY",512,160);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

function ensurePhaseSign(scene){
  let sign = scene.getObjectByName(SIGN_NAME);
  if(!sign){
    sign = new THREE.Mesh(new THREE.PlaneGeometry(4.8,1.2), new THREE.MeshBasicMaterial({ map:signTexture(), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
    sign.name = SIGN_NAME;
    scene.add(sign);
  }
  sign.position.set(0,4.8,8.8);
  sign.rotation.set(0,Math.PI,0);
  sign.visible = true;
}

function install(){
  stamp();
  installTitleGuard();
  installDomLabel();
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  ensureSafeSky(scene);
  ensurePhaseSign(scene);
  return true;
}

stamp();
installTitleGuard();
installDomLabel();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>200) clearInterval(timer); },150);
setInterval(install,500);
