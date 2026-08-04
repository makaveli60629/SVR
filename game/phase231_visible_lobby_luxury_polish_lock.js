import * as THREE from "three";

const LABEL = "UPDATE-3.1-K-PHASE-231-VISIBLE-LOBBY-LUXURY-POLISH-LOCK";
const TITLE = `SVR Poker • ${LABEL}`;
const ROOT = "PHASE231_VISIBLE_LOBBY_LUXURY_POLISH_ROOT";
const LABEL_ID = "svr-phase-231-label";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xb55cff;
const DARK = 0x070814;

function stamp(){
  window.SVR_PHASE231 = {
    build: LABEL,
    active: true,
    phase: "3.1-K",
    visibleLuxuryLobbyPolish: true,
    siteTouched: false,
    preservesPhase230Moon: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-K",
    phase231: true,
    visibleLuxuryLobbyPolish: true,
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
  if(titleEl && !window.SVR_PHASE231_TITLE_OBSERVER){
    window.SVR_PHASE231_TITLE_OBSERVER = true;
    new MutationObserver(()=>{ if(titleEl.textContent !== TITLE) titleEl.textContent = TITLE; }).observe(titleEl,{childList:true,characterData:true,subtree:true});
  }
}

function domLabel(){
  document.getElementById("svr-phase-230-label")?.remove();
  document.getElementById("svr-phase-final-label")?.remove();
  let el = document.getElementById(LABEL_ID);
  if(!el){
    el = document.createElement("div");
    el.id = LABEL_ID;
    el.style.cssText = "position:fixed;right:10px;top:10px;z-index:999999;background:rgba(0,0,0,.78);border:1px solid #ffd98a;color:#ffd98a;font:800 11px system-ui,Arial;padding:6px 9px;border-radius:8px;letter-spacing:.06em;pointer-events:none;";
    document.body.appendChild(el);
  }
  el.textContent = "PHASE 231 ACTIVE • LUXURY LOBBY POLISH";
}

function canvasText(lines, w=1024, h=512, accent=GOLD){
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(2,4,13,.88)"; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=`#${accent.toString(16).padStart(6,"0")}`; ctx.lineWidth=10; ctx.strokeRect(14,14,w-28,h-28);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#ffd98a"; ctx.font="900 58px system-ui,Arial"; ctx.fillText(lines[0]||"SVR",w/2,h*.34);
  ctx.fillStyle="#7ffcff"; ctx.font="800 31px system-ui,Arial"; ctx.fillText(lines[1]||"",w/2,h*.58);
  ctx.fillStyle="#ffffff"; ctx.font="700 22px system-ui,Arial"; ctx.fillText(lines[2]||"",w/2,h*.76);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

function marbleTexture(){
  const c=document.createElement("canvas"); c.width=512; c.height=512;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,512,512);
  g.addColorStop(0,"#0a101c"); g.addColorStop(.35,"#151f34"); g.addColorStop(.72,"#080a12"); g.addColorStop(1,"#22263a");
  ctx.fillStyle=g; ctx.fillRect(0,0,512,512);
  for(let i=0;i<70;i++){
    ctx.strokeStyle=`rgba(150,185,255,${.05+Math.random()*.08})`; ctx.lineWidth=1+Math.random()*3;
    ctx.beginPath(); ctx.moveTo(Math.random()*512,0); ctx.bezierCurveTo(Math.random()*512,150,Math.random()*512,360,Math.random()*512,512); ctx.stroke();
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(7,5); return t;
}

function mat(color, rough=.55, metal=.08, opacity=1){
  return new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:metal, transparent:opacity<1, opacity, side:THREE.DoubleSide });
}
function glow(color, opacity=.45){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }); }
function plane(root,name,w,h,x,y,z,material,rx=-Math.PI/2,ry=0){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material); m.name=name; m.position.set(x,y,z); m.rotation.x=rx; m.rotation.y=ry; root.add(m); return m; }
function box(root,name,sx,sy,sz,x,y,z,material){ const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material); m.name=name; m.position.set(x,y,z); root.add(m); return m; }
function cyl(root,name,r,h,x,y,z,material){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),material); m.name=name; m.position.set(x,y,z); root.add(m); return m; }

function addArch(root,x,z,label){
  const goldMat = mat(GOLD,.35,.32,.94);
  cyl(root,`PHASE231_${label}_LEFT_COLUMN`,.12,3.0,x-1.2,1.55,z,goldMat);
  cyl(root,`PHASE231_${label}_RIGHT_COLUMN`,.12,3.0,x+1.2,1.55,z,goldMat);
  box(root,`PHASE231_${label}_TOP_BEAM`,2.65,.12,.16,x,3.08,z,goldMat);
  const curve = new THREE.EllipseCurve(0,0,1.23,.82,0,Math.PI,false,0);
  const pts = curve.getPoints(32).map(p=>new THREE.Vector3(x+p.x,3.03+p.y,z));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo,new THREE.LineBasicMaterial({color:GOLD,transparent:true,opacity:.82}));
  line.name=`PHASE231_${label}_GOLD_ARCH_LINE`;
  root.add(line);
  const pane = plane(root,`PHASE231_${label}_DARK_RECESSED_PANEL`,2.25,1.7,x,2.05,z+.03,mat(0x050713,.8,0,.64),0,0);
  pane.rotation.y = 0;
}

function addSign(root,name,lines,x,y,z,w=2.4,h=1.0,accent=GOLD){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:canvasText(lines,1024,512,accent),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  m.name=name; m.position.set(x,y,z); m.rotation.y=Math.PI; root.add(m); return m;
}

function build(scene){
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);

  const marble = marbleTexture();
  plane(root,"PHASE231_POLISHED_DARK_MARBLE_FLOOR",31,19,0,.061,-1.8,new THREE.MeshStandardMaterial({map:marble,roughness:.45,metalness:.04,transparent:true,opacity:.64,side:THREE.DoubleSide}));
  plane(root,"PHASE231_RED_CARPET_RUNWAY_POLISH",6.5,11.8,0,.078,2.1,mat(0x8c1f2e,.62,.02,.72));
  plane(root,"PHASE231_GOLD_CENTER_MEDALLION_RING",4.6,4.6,0,.095,-2.0,glow(GOLD,.23));
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.25,2.32,128),glow(GOLD,.72)); ring.name="PHASE231_GOLD_TABLE_RING_REFLECTION"; ring.rotation.x=-Math.PI/2; ring.position.set(0,.12,-2.0); root.add(ring);

  [-12,-8,-4,0,4,8,12].forEach((x,i)=>addArch(root,x,-12.75,`BACK_ARCH_${i}`));
  [-14,14].forEach((x,side)=>{
    for(let i=0;i<3;i++) addArch(root,x, -8 + i*4.2, `${side?"RIGHT":"LEFT"}_SIDE_ARCH_${i}`);
  });

  box(root,"PHASE231_BACK_GOLD_BALCONY_RAIL",28,.08,.10,0,3.35,-12.50,mat(GOLD,.28,.35,.9));
  box(root,"PHASE231_LEFT_GOLD_BALCONY_RAIL",.10,.08,17,-14.8,3.35,-4.5,mat(GOLD,.28,.35,.9));
  box(root,"PHASE231_RIGHT_GOLD_BALCONY_RAIL",.10,.08,17,14.8,3.35,-4.5,mat(GOLD,.28,.35,.9));
  box(root,"PHASE231_BACK_CYAN_LIGHT_STRIP",29,.035,.05,0,3.72,-12.38,glow(CYAN,.80));
  box(root,"PHASE231_LEFT_CYAN_LIGHT_STRIP",.05,.035,17.5,-14.65,3.72,-4.4,glow(CYAN,.70));
  box(root,"PHASE231_RIGHT_CYAN_LIGHT_STRIP",.05,.035,17.5,14.65,3.72,-4.4,glow(CYAN,.70));

  addSign(root,"PHASE231_MAIN_PLAY_GAME_SIGN",["PLAY GAME","Choose Your Table","Hold'em • Omaha • Private Rooms"],0,2.25,-7.4,4.4,1.25,GOLD);
  addSign(root,"PHASE231_REIKI_PORTAL_SIGN",["WELLNESS HUB","Awaiting Approval","VR relaxation portal"],-5.8,1.7,-5.4,2.45,.95,PURPLE);
  addSign(root,"PHASE231_PGA_PORTAL_SIGN",["PGA HUB","Practice. Grow. Achieve.","Golf training portal"],5.8,1.7,-5.4,2.45,.95,CYAN);
  addSign(root,"PHASE231_SCORPION_PORTAL_SIGN",["SCORPION ROOM","Private Game Room","Portal locked to room"],9.9,1.78,-8.7,2.25,.9,PURPLE);
  addSign(root,"PHASE231_LEFT_JUMBOTRON",["TIER 1","JUMBOTRON","Your brand here"],-11.4,1.85,-8.6,2.8,1.3,CYAN);
  addSign(root,"PHASE231_RIGHT_JUMBOTRON",["TIER 1","JUMBOTRON","Your brand here"],11.4,1.85,-8.6,2.8,1.3,CYAN);

  for(let i=0;i<10;i++){
    const x=-13.5+i*3;
    const p=new THREE.PointLight(i%2?CYAN:GOLD,.45,5,1.7); p.name=`PHASE231_WARM_CYAN_LOBBY_SPOT_${i}`; p.position.set(x,3.25,-10.7); root.add(p);
  }
  const centerLight = new THREE.PointLight(GOLD,1.1,10,1.8); centerLight.name="PHASE231_GOLD_CENTER_TABLE_GLOW"; centerLight.position.set(0,4.2,-2.2); root.add(centerLight);

  window.SVR_PHASE231_GEOMETRY = { build:LABEL, arches:13, signs:6, floorPolish:true, checkedAt:new Date().toISOString() };
}

function install(){
  stamp();
  guardTitle();
  domLabel();
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  build(scene);
  return true;
}

stamp(); guardTitle(); domLabel();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>180) clearInterval(timer); },180);
setTimeout(install,1200);
setTimeout(install,3000);
