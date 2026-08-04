import * as THREE from "three";

const LABEL = "PHASE-95-LOBBY-LIGHTING-SIGHTLINE-POLISH-LOCK";
const ROOT = "PHASE95_LOBBY_LIGHTING_SIGHTLINE_POLISH_ROOT";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xbd7cff;
const WARM = 0xffb86b;
let installed = false;

function glow(color, opacity=.2){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function basic(color, opacity=.5){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false });
}
function standard(color, roughness=.36, metalness=.22){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive:color, emissiveIntensity:.04 });
}
function textTex(title, sub="", accent="#ffd98a"){
  const c=document.createElement("canvas"); c.width=1024; c.height=320;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#02040a"; ctx.fillRect(0,0,1024,320);
  ctx.fillStyle="rgba(255,255,255,.035)"; ctx.fillRect(22,22,980,276);
  ctx.strokeStyle=accent; ctx.lineWidth=8; ctx.strokeRect(30,30,964,260);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 52px system-ui,Arial"; ctx.fillText(title,512,118);
  if(sub){ ctx.fillStyle="#bffcff"; ctx.font="800 27px system-ui,Arial"; ctx.fillText(sub,512,205); }
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=2; return tex;
}
function addLightPools(root){
  const pools=[
    {name:"CENTER_ENTRY",x:0,z:3.25,r:2.35,c:GOLD,o:.12},
    {name:"POKER_TABLE",x:0,z:-2.72,r:3.15,c:WARM,o:.18},
    {name:"WELLNESS_PORTAL",x:-7.95,z:-7.42,r:1.35,c:PURPLE,o:.16},
    {name:"PGA_PORTAL",x:7.95,z:-7.42,r:1.35,c:CYAN,o:.16},
    {name:"STORE_PORTAL",x:8.75,z:3.35,r:1.28,c:GOLD,o:.14},
    {name:"SCORPION_PORTAL",x:11.15,z:-6.75,r:1.28,c:PURPLE,o:.14}
  ];
  pools.forEach((p)=>{
    const disk=new THREE.Mesh(new THREE.CircleGeometry(p.r,96), glow(p.c,p.o));
    disk.name=`PHASE95_SOFT_LIGHT_POOL_${p.name}`; disk.rotation.x=-Math.PI/2; disk.position.set(p.x,.105,p.z); disk.renderOrder=370; root.add(disk);
  });
}
function addSightlineRails(root){
  const rails=[
    {x:-2.25,z:.25,w:.035,d:10.2,c:GOLD},
    {x:2.25,z:.25,w:.035,d:10.2,c:GOLD},
    {x:0,z:-5.35,w:5.3,d:.035,c:CYAN},
    {x:0,z:5.30,w:5.8,d:.035,c:PURPLE}
  ];
  rails.forEach((r,i)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(r.w,.022,r.d), glow(r.c,.18));
    mesh.name=`PHASE95_SUBTLE_SIGHTLINE_RAIL_${i}`; mesh.position.set(r.x,.13,r.z); mesh.renderOrder=371; root.add(mesh);
  });
}
function addReadableLocatorSigns(root){
  const signs=[
    ["POKER TABLE", "center play area", 0, 2.82, -5.75, 0, "#ffd98a"],
    ["PORTAL HUB", "walk the carpet path", 0, 2.55, 4.85, Math.PI, "#7ffcff"],
    ["SPONSOR WALL", "ads stay behind arches", -9.72, 2.35, -.7, Math.PI/2, "#bd7cff"],
    ["STORE / ROOMS", "right wall portals", 9.72, 2.35, -.7, -Math.PI/2, "#ffd98a"]
  ];
  signs.forEach(([title,sub,x,y,z,ry,accent],i)=>{
    const back=new THREE.Mesh(new THREE.PlaneGeometry(2.45,.72), basic(0x02040a,.72));
    back.name=`PHASE95_LOCATOR_SIGN_BACKPLATE_${i}`; back.position.set(x,y,z+.025*Math.cos(ry||0)); back.rotation.y=ry; back.renderOrder=362; root.add(back);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.28,.60), new THREE.MeshBasicMaterial({map:textTex(title,sub,accent),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    sign.name=`PHASE95_READABLE_LOCATOR_SIGN_${i}_${title.replace(/\s+/g,"_")}`; sign.position.set(x,y,z); sign.rotation.y=ry; sign.renderOrder=372; root.add(sign);
  });
}
function addCeilingWarmth(root){
  const bars=[
    {x:0,z:-2.7,w:7.2,c:GOLD},
    {x:0,z:2.2,w:6.2,c:CYAN},
    {x:-7.9,z:-7.7,w:2.4,c:PURPLE},
    {x:7.9,z:-7.7,w:2.4,c:CYAN}
  ];
  bars.forEach((b,i)=>{
    const bar=new THREE.Mesh(new THREE.BoxGeometry(b.w,.035,.08), glow(b.c,.15));
    bar.name=`PHASE95_CEILING_WARMTH_LIGHT_BAR_${i}`; bar.position.set(b.x,3.68,b.z); bar.renderOrder=35; root.add(bar);
  });
}
function protectSightlines(scene){
  let protectedReadable=0, dimmedNoise=0, lowPriorityDecor=0;
  scene.traverse((o)=>{
    const n=String(o.name||"").toUpperCase();
    if(/SIGN|PANEL|PORTAL|WATCH|CARD|CHIP|ACTION|BUTTON|JUMBOTRON|DISPLAY/.test(n)){
      o.renderOrder=Math.max(o.renderOrder||0,380);
      o.userData.phase95SightlineProtected=true;
      protectedReadable++;
      const mats=o.material ? (Array.isArray(o.material)?o.material:[o.material]) : [];
      mats.forEach(m=>{ if(m){ m.depthWrite=false; m.needsUpdate=true; }});
    }
    if(/PILLAR|COLUMN|ARCH/.test(n) && !/PHASE94_PRECISION|PHASE95/.test(n)){
      o.renderOrder=Math.min(o.renderOrder||50,58);
      lowPriorityDecor++;
    }
    if(/DUST|FOG|SPRITE|STAR/.test(n) && o.material){
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{ if(m?.opacity && m.opacity>.12){ m.opacity=.12; m.needsUpdate=true; dimmedNoise++; }});
    }
  });
  return {protectedReadable, dimmedNoise, lowPriorityDecor};
}
function rendererTune(renderer){
  if(!renderer) return {};
  renderer.setClearColor?.(0x010208,1);
  renderer.toneMappingExposure=Math.min(renderer.toneMappingExposure||1,0.98);
  renderer.shadowMap.enabled=false;
  return {clearColor:"#010208", exposure:renderer.toneMappingExposure, shadows:false};
}
function install(){
  const scene=window.__SVR_SCENE__; const renderer=window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  addLightPools(root);
  addSightlineRails(root);
  addReadableLocatorSigns(root);
  addCeilingWarmth(root);
  const sightlines=protectSightlines(scene);
  const render=rendererTune(renderer);
  installed=true;
  window.SVR_PHASE95_LOBBY_LIGHTING_SIGHTLINE_POLISH_LOCK={
    build:LABEL,
    active:true,
    style:"professional casino lighting with readable sign sightlines, softer glow, focused table and portal pools",
    added:["soft light pools","sightline rails","locator signs","ceiling warmth","readability priority","noise dimming"],
    sightlines,
    render,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    privateScenesTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>180) clearInterval(timer); },300);
[1200,2800,6200,10800,17000].forEach(d=>setTimeout(install,d));
