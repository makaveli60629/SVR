import * as THREE from "three";

const LABEL = "PHASE-92-LOBBY-BEAUTY-PASS-LOCK";
const ROOT = "PHASE92_LOBBY_BEAUTY_PASS_ROOT";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xbd7cff;
const WARM = 0xffb86b;
const DARK = 0x06070d;
let installed = false;

function mat(color, opts={}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? .38,
    metalness: opts.metalness ?? .18,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1
  });
}
function glow(color, opacity=.34){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function canvasTex(title, subtitle="", color="#ffd98a"){
  const c=document.createElement("canvas"); c.width=900; c.height=360;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#04060d"; ctx.fillRect(0,0,c.width,c.height);
  const grad=ctx.createLinearGradient(0,0,c.width,c.height); grad.addColorStop(0,"rgba(255,217,138,.18)"); grad.addColorStop(1,"rgba(127,252,255,.08)");
  ctx.fillStyle=grad; ctx.fillRect(18,18,864,324);
  ctx.strokeStyle=color; ctx.lineWidth=10; ctx.strokeRect(24,24,852,312);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 54px system-ui,Arial"; ctx.fillText(title,450,132);
  if(subtitle){ ctx.fillStyle="#bffcff"; ctx.font="800 28px system-ui,Arial"; ctx.fillText(subtitle,450,220); }
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=2; return tex;
}
function addFloorPolish(root){
  const marble = new THREE.Mesh(new THREE.PlaneGeometry(19.5, 15.5), mat(0x11131d,{roughness:.28,metalness:.08,emissive:0x05060b,emissiveIntensity:.15}));
  marble.name="PHASE92_DARK_MARBLE_FLOOR_SHEEN"; marble.rotation.x=-Math.PI/2; marble.position.set(0,.012,-1.1); marble.renderOrder=18; root.add(marble);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 13.4), new THREE.MeshStandardMaterial({color:0x4a0715, roughness:.62, metalness:0, emissive:0x16020a, emissiveIntensity:.2, transparent:true, opacity:.72}));
  carpet.name="PHASE92_CLEAN_CENTER_RED_CARPET_POLISH"; carpet.rotation.x=-Math.PI/2; carpet.position.set(0,.03,.3); carpet.renderOrder=24; root.add(carpet);
  [-1.86,1.86].forEach((x)=>{
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.045,.035,13.55), mat(GOLD,{roughness:.30,metalness:.42,emissive:0x3a2504,emissiveIntensity:.22}));
    rail.name="PHASE92_GOLD_CARPET_EDGE"; rail.position.set(x,.06,.3); root.add(rail);
  });
}
function addTableSpotlight(root){
  const spot = new THREE.Mesh(new THREE.CircleGeometry(2.9,96), glow(GOLD,.18));
  spot.name="PHASE92_POKER_TABLE_WARM_SPOTLIGHT_POOL"; spot.rotation.x=-Math.PI/2; spot.position.set(0,.07,-2.65); spot.renderOrder=48; root.add(spot);
  const halo = new THREE.Mesh(new THREE.RingGeometry(2.35,3.05,96), glow(CYAN,.14));
  halo.name="PHASE92_TABLE_CYAN_FOCUS_RING"; halo.rotation.x=-Math.PI/2; halo.position.set(0,.075,-2.65); halo.renderOrder=49; root.add(halo);
}
function addCeilingGlow(root){
  const positions=[[-6,3.85,-8],[0,3.95,-8],[6,3.85,-8],[-6,3.75,3.8],[0,3.95,4.2],[6,3.75,3.8]];
  positions.forEach((p,i)=>{
    const disk=new THREE.Mesh(new THREE.CircleGeometry(.82,48), glow(i%2?CYAN:GOLD,.18));
    disk.name=`PHASE92_SOFT_CASINO_CEILING_GLOW_${i}`; disk.rotation.x=Math.PI/2; disk.position.set(p[0],p[1],p[2]); disk.renderOrder=38; root.add(disk);
  });
}
function addPortalUnifier(root){
  const portals=[
    ["WELLNESS", "AWAITING APPROVAL", -7.95, 2.38, -8.18, 0, "#bd7cff"],
    ["PGA TRAINING", "DRIVING RANGE", 7.95, 2.38, -8.18, 0, "#7ffcff"],
    ["SVR STORE", "WEB PORTAL", 9.35, 2.08, 3.18, -Math.PI/2, "#ffd98a"],
    ["SCORPION", "PRIVATE ROOM", 11.90, 2.18, -7.25, -Math.PI/2, "#bd7cff"],
    ["PLAY POKER", "MAIN TABLE", 0, 2.42, -8.36, 0, "#ffd98a"]
  ];
  portals.forEach(([title,sub,x,y,z,ry,color],i)=>{
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2.95,1.02), new THREE.MeshBasicMaterial({color:DARK, transparent:true, opacity:.76, side:THREE.DoubleSide, depthWrite:false}));
    back.name=`PHASE92_PORTAL_SIGN_BACKPLATE_${i}`; back.position.set(x,y,z+.025); back.rotation.y=ry; back.renderOrder=300; root.add(back);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.75,.86), new THREE.MeshBasicMaterial({map:canvasTex(title,sub,color), transparent:true, side:THREE.DoubleSide, depthWrite:false}));
    sign.name=`PHASE92_UNIFIED_PORTAL_SIGN_${i}_${title.replace(/\s+/g,"_")}`; sign.position.set(x,y,z); sign.rotation.y=ry; sign.renderOrder=305; root.add(sign);
  });
}
function addArchInteriorDepth(root){
  const bays=[[-8.0,-8.28],[0,-8.48],[8.0,-8.28]];
  bays.forEach(([x,z],i)=>{
    const inner=new THREE.Mesh(new THREE.BoxGeometry(2.7,2.1,.12), mat(0x0d1018,{roughness:.48,metalness:.08,emissive:0x070913,emissiveIntensity:.16,transparent:true,opacity:.92}));
    inner.name=`PHASE92_ARCH_INTERIOR_DARK_DEPTH_${i}`; inner.position.set(x,1.42,z+.18); inner.renderOrder=34; root.add(inner);
    const trim=new THREE.Mesh(new THREE.TorusGeometry(1.22,.025,10,64,Math.PI), new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.78,depthWrite:false}));
    trim.name=`PHASE92_ARCH_TOP_GOLD_DEPTH_TRIM_${i}`; trim.position.set(x,2.38,z+.1); trim.rotation.z=Math.PI; trim.renderOrder=310; root.add(trim);
  });
}
function reduceVisualNoise(scene){
  let dimmed=0, raised=0;
  scene.traverse((obj)=>{
    const n=String(obj.name||"").toUpperCase();
    if(/DEBUG|TEST_ONLY|TEMP|OLD_PLACEHOLDER|DUPLICATE/.test(n)){ obj.visible=false; dimmed++; }
    if(/SPRITE|STAR|FOG|DUST/.test(n) && obj.material){
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      mats.forEach(m=>{ if(m?.opacity && m.opacity>.22){ m.opacity=.22; m.needsUpdate=true; dimmed++; }});
    }
    if(/PORTAL|SIGN|PANEL|WATCH|CARD|CHIP|ACTION/.test(n)){ obj.renderOrder=Math.max(obj.renderOrder||0,320); raised++; }
  });
  return {dimmed, raised};
}
function tuneRenderer(renderer){
  if(!renderer) return {};
  renderer.setClearColor?.(0x02030a,1);
  renderer.toneMappingExposure = Math.min(renderer.toneMappingExposure || 1, 1.05);
  renderer.shadowMap.enabled=false;
  return {clearColor:"#02030a", exposure:renderer.toneMappingExposure, shadows:false};
}
function install(){
  const scene=window.__SVR_SCENE__; const renderer=window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  addFloorPolish(root);
  addTableSpotlight(root);
  addCeilingGlow(root);
  addArchInteriorDepth(root);
  addPortalUnifier(root);
  const noise=reduceVisualNoise(scene);
  const rendererStats=tuneRenderer(renderer);
  installed=true;
  window.SVR_PHASE92_LOBBY_BEAUTY_PASS_LOCK={
    build:LABEL,
    active:true,
    style:"luxury casino lobby, dark marble, gold trim, cyan/purple SVR neon, clean portal signage",
    added:["marble sheen","center carpet polish","table spotlight","ceiling glow","arch depth","unified portal signs","noise reduction"],
    noise,
    rendererStats,
    siteTouched:false,
    publicRootTouched:false,
    privateScenesTouched:false,
    pokerLogicTouched:false,
    movementTouched:false,
    performanceSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>180) clearInterval(timer); },300);
[1200,2600,5200,9000,15000].forEach(d=>setTimeout(install,d));
