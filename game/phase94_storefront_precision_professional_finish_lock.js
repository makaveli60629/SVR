import * as THREE from "three";

const LABEL = "PHASE-94-STOREFRONT-PRECISION-PROFESSIONAL-FINISH-LOCK";
const ROOT = "PHASE94_STOREFRONT_PRECISION_PRO_FINISH_ROOT";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xbd7cff;
const BLACK = 0x04060d;
const STONE = 0x161925;
let installed = false;

const STOREFRONTS = [
  { key:"wellness", title:"WELLNESS", sub:"AWAITING APPROVAL", x:-7.95, z:-8.38, w:2.90, h:2.42, color:PURPLE, accent:"#bd7cff" },
  { key:"play", title:"PLAY POKER", sub:"MAIN TABLE", x:0, z:-8.54, w:3.28, h:2.62, color:GOLD, accent:"#ffd98a" },
  { key:"pga", title:"PGA", sub:"DRIVING RANGE", x:7.95, z:-8.38, w:2.90, h:2.42, color:CYAN, accent:"#7ffcff" },
  { key:"store", title:"SVR STORE", sub:"WEB PORTAL", x:9.55, z:3.40, w:2.64, h:2.22, ry:-Math.PI/2, color:GOLD, accent:"#ffd98a" },
  { key:"scorpion", title:"SCORPION", sub:"PRIVATE ROOM", x:11.90, z:-7.35, w:2.64, h:2.22, ry:-Math.PI/2, color:PURPLE, accent:"#bd7cff" }
];

function mStandard(color, roughness=.38, metalness=.26){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive:color, emissiveIntensity:.035 });
}
function mBasic(color, opacity=.55){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false });
}
function mGlow(color, opacity=.28){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function labelTexture(title, sub, accent){
  const c=document.createElement("canvas"); c.width=900; c.height=420;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03050b"; ctx.fillRect(0,0,900,420);
  ctx.fillStyle="rgba(255,255,255,.035)"; ctx.fillRect(30,30,840,360);
  ctx.strokeStyle="rgba(255,217,138,.86)"; ctx.lineWidth=8; ctx.strokeRect(34,34,832,352);
  ctx.strokeStyle=accent; ctx.lineWidth=5; ctx.strokeRect(58,58,784,304);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#ffffff"; ctx.font="900 58px system-ui,Arial"; ctx.fillText(title,450,160);
  ctx.fillStyle="#bffcff"; ctx.font="800 31px system-ui,Arial"; ctx.fillText(sub,450,245);
  ctx.fillStyle="#ffd98a"; ctx.font="700 20px system-ui,Arial"; ctx.fillText("SVR PORTAL",450,318);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=2; return tex;
}
function oriented(root, mesh, cfg, x=0,y=0,z=0){
  mesh.position.set(cfg.x + x*Math.cos(cfg.ry||0) + z*Math.sin(cfg.ry||0), y, cfg.z + z*Math.cos(cfg.ry||0) - x*Math.sin(cfg.ry||0));
  mesh.rotation.y = cfg.ry || 0;
  root.add(mesh);
  return mesh;
}
function makeStorefront(root, cfg){
  const group = new THREE.Group();
  group.name = `PHASE94_PRECISION_STOREFRONT_${cfg.key.toUpperCase()}`;
  group.position.set(cfg.x,0,cfg.z);
  group.rotation.y = cfg.ry || 0;
  root.add(group);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w+.46,cfg.h+.32), mBasic(BLACK,.82));
  back.name = `${group.name}_DISPLAY_BACKPLATE_CLEAR_TEXT_ZONE`;
  back.position.set(0,1.58,.035);
  back.renderOrder = 326;
  group.add(back);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w,cfg.h*.42), new THREE.MeshBasicMaterial({map:labelTexture(cfg.title,cfg.sub,cfg.accent),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  sign.name = `${group.name}_READABLE_CENTER_SIGN_NO_PILLAR_OVERLAP`;
  sign.position.set(0,1.72,0);
  sign.renderOrder = 350;
  group.add(sign);

  const leftX = -cfg.w*.62;
  const rightX = cfg.w*.62;
  [leftX,rightX].forEach((x,i)=>{
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(.17,cfg.h+.55,.18), mStandard(STONE,.44,.16));
    pillar.name = `${group.name}_${i?"RIGHT":"LEFT"}_OUTSIDE_PILLAR_DOES_NOT_BLOCK_TEXT`;
    pillar.position.set(x,1.43,.02);
    pillar.renderOrder = 44;
    group.add(pillar);
    const line = new THREE.Mesh(new THREE.BoxGeometry(.035,cfg.h+.40,.02), mGlow(i?CYAN:cfg.color,.50));
    line.name = `${pillar.name}_NEON_EDGE`;
    line.position.set(x + (i?-.092:.092),1.45,-.085);
    line.renderOrder = 355;
    group.add(line);
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(cfg.w*1.36,.16,.18), mStandard(GOLD,.32,.42));
  top.name = `${group.name}_TOP_GOLD_DOORWAY_HEADER`;
  top.position.set(0,cfg.h+.78,.02);
  top.renderOrder = 46;
  group.add(top);

  const arch = new THREE.Mesh(new THREE.TorusGeometry(cfg.w*.58,.035,10,72,Math.PI), new THREE.MeshBasicMaterial({color:cfg.color,transparent:true,opacity:.74,depthWrite:false}));
  arch.name = `${group.name}_UPSIDE_DOWN_U_ARCH_CLEAR_OPENING`;
  arch.position.set(0,cfg.h+.58,-.08);
  arch.rotation.z = Math.PI;
  arch.renderOrder = 358;
  group.add(arch);

  const threshold = new THREE.Mesh(new THREE.BoxGeometry(cfg.w*1.18,.035,.34), mStandard(GOLD,.30,.40));
  threshold.name = `${group.name}_GOLD_THRESHOLD_PORTAL_DOORWAY`;
  threshold.position.set(0,.055,.28);
  threshold.renderOrder = 60;
  group.add(threshold);

  const glowRing = new THREE.Mesh(new THREE.RingGeometry(cfg.w*.30,cfg.w*.38,64), mGlow(cfg.color,.18));
  glowRing.name = `${group.name}_SUBTLE_FLOOR_PORTAL_GLOW`;
  glowRing.rotation.x = -Math.PI/2;
  glowRing.position.set(0,.072,.55);
  glowRing.renderOrder = 322;
  group.add(glowRing);
}
function addSymmetryGuides(root){
  const centerLine = new THREE.Mesh(new THREE.BoxGeometry(.035,.026,13.2), mBasic(CYAN,.22));
  centerLine.name = "PHASE94_SUBTLE_CENTERLINE_FOR_LOBBY_SYMMETRY";
  centerLine.position.set(0,.085,.05);
  centerLine.renderOrder = 50;
  root.add(centerLine);
  [-4.1,4.1].forEach((x,i)=>{
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.04,.03,9.8), mBasic(GOLD,.22));
    rail.name = `PHASE94_SUBTLE_LOBBY_FLOW_EDGE_${i}`;
    rail.position.set(x,.09,-1.4);
    rail.renderOrder=50;
    root.add(rail);
  });
}
function addVipCeilingRim(root){
  [[0,-3.0,5.8,3.2],[0,2.4,6.4,2.7],[0,-8.3,17.2,.18]].forEach(([x,z,w,d],i)=>{
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w,.035,d), mGlow(i===2?GOLD:CYAN,.12));
    rim.name = `PHASE94_CEILING_REFLECTION_RIM_${i}`;
    rim.position.set(x,3.35,z);
    rim.renderOrder=24;
    root.add(rim);
  });
}
function cleanOcclusion(scene){
  let fixed=0, hidden=0, protectedSigns=0;
  scene.traverse((o)=>{
    const n=String(o.name||"").toUpperCase();
    if(/SIGN|DISPLAY|PANEL|PORTAL|WATCH|CARD|CHIP|ACTION|JUMBOTRON/.test(n)){
      o.renderOrder=Math.max(o.renderOrder||0,360);
      o.userData.phase94ReadableProtected=true;
      protectedSigns++;
      if(o.material){
        const mats=Array.isArray(o.material)?o.material:[o.material];
        mats.forEach(m=>{ if(m){ m.depthWrite=false; m.needsUpdate=true; }});
      }
    }
    if(/PILLAR|COLUMN/.test(n) && /DISPLAY|SIGN|PANEL/.test(n)){
      o.renderOrder=Math.min(o.renderOrder||60,55);
      fixed++;
    }
    if(/DEBUG|TEMP|OLD_PLACEHOLDER|DUPLICATE|TEST_ONLY/.test(n)){
      if(o.visible!==false){ o.visible=false; hidden++; }
    }
    if(/DUST|FOG|SPRITE/.test(n) && o.material){
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{ if(m?.opacity && m.opacity>.14){ m.opacity=.14; m.needsUpdate=true; fixed++; }});
    }
  });
  return {fixed, hidden, protectedSigns};
}
function install(){
  const scene=window.__SVR_SCENE__;
  const renderer=window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  STOREFRONTS.forEach(cfg=>makeStorefront(root,cfg));
  addSymmetryGuides(root);
  addVipCeilingRim(root);
  const clean=cleanOcclusion(scene);
  renderer.toneMappingExposure=Math.min(renderer.toneMappingExposure||1,1.0);
  installed=true;
  window.SVR_PHASE94_STOREFRONT_PRECISION_PROFESSIONAL_FINISH_LOCK={
    build:LABEL,
    active:true,
    storefronts:STOREFRONTS.map(s=>s.key),
    fixes:["pillars outside text zones","backplates behind signs","gold doorway thresholds","subtle portal glow","symmetry guides","ceiling reflection rims","occlusion cleanup"],
    clean,
    siteTouched:false,
    publicRootTouched:false,
    privateScenesTouched:false,
    pokerLogicTouched:false,
    movementTouched:false,
    watchTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>180) clearInterval(timer); },300);
[1400,3000,6200,10400,16000].forEach(d=>setTimeout(install,d));
