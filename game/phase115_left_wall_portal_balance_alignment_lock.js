import * as THREE from "three";

const LABEL = "PHASE-115-LEFT-WALL-PORTAL-BALANCE-ALIGNMENT-LOCK";
const ROOT = "PHASE115_LEFT_WALL_PORTAL_BALANCE_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0x9b4dff;

const PORTALS = [
  { key:"lounge", title:"SVR LOUNGE", sub:"SOCIAL PORTAL", x:-23.55, y:1.9, z:5.8, w:3.85, h:3.15, ry:Math.PI/2, c:GOLD },
  { key:"vibes", title:"VIBES THEATER", sub:"PORTAL PREVIEW", x:-23.55, y:1.9, z:-8.8, w:3.85, h:3.15, ry:Math.PI/2, c:PURPLE }
];

function mat(color, opts={}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? .44,
    metalness: opts.metalness ?? .10,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1
  });
}
function glow(color, opacity=.24){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function signTexture(title, sub, color){
  const c=document.createElement("canvas"); c.width=1024; c.height=512;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03050b"; ctx.fillRect(0,0,1024,512);
  ctx.fillStyle="rgba(255,255,255,.035)"; ctx.fillRect(48,48,928,416);
  ctx.strokeStyle="#ffd98a"; ctx.lineWidth=12; ctx.strokeRect(56,56,912,400);
  ctx.strokeStyle=`#${color.toString(16).padStart(6,"0")}`; ctx.lineWidth=7; ctx.strokeRect(86,86,852,340);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#ffffff"; ctx.font="900 70px system-ui,Arial"; ctx.fillText(title,512,205);
  ctx.fillStyle="#bffcff"; ctx.font="800 38px system-ui,Arial"; ctx.fillText(sub,512,305);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=2; return tex;
}
function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function buildDoorway(root,cfg){
  const old = root.getObjectByName(`PHASE115_CORRECT_DOORWAY_${cfg.key.toUpperCase()}`);
  if(old) old.parent?.remove(old);
  const group=new THREE.Group();
  group.name=`PHASE115_CORRECT_DOORWAY_${cfg.key.toUpperCase()}`;
  group.position.set(cfg.x,0,cfg.z);
  group.rotation.y=cfg.ry||0;
  root.add(group);

  const back=new THREE.Mesh(new THREE.PlaneGeometry(cfg.w+.85,cfg.h+.62),new THREE.MeshBasicMaterial({color:0x02040a,transparent:true,opacity:.86,side:THREE.DoubleSide,depthWrite:false}));
  back.name=`${group.name}_FLUSH_WALL_SIGN_BACKPLATE`;
  back.position.set(0,cfg.y,.018);
  back.renderOrder=510;
  group.add(back);

  const sign=new THREE.Mesh(new THREE.PlaneGeometry(cfg.w*.76,cfg.h*.34),new THREE.MeshBasicMaterial({map:signTexture(cfg.title,cfg.sub,cfg.c),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  sign.name=`${group.name}_SIGN_AFFIXED_IN_WALL`;
  sign.position.set(0,cfg.y+.22,.006);
  sign.renderOrder=540;
  group.add(sign);

  const pillarX=cfg.w*.64;
  [-pillarX,pillarX].forEach((x,i)=>{
    const p=new THREE.Mesh(new THREE.BoxGeometry(.36,cfg.h+.82,.42),mat(0x161925,{roughness:.42,metalness:.12,emissive:i?0x052029:0x160820,emissiveIntensity:.16}));
    p.name=`${group.name}_${i?"RIGHT":"LEFT"}_SIDE_PILLAR_CORRECT`;
    p.position.set(x,cfg.y,.10);
    p.renderOrder=95;
    group.add(p);
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(.04,cfg.h+.66,.04),glow(i?CYAN:cfg.c,.46));
    stripe.name=`${p.name}_NEON_INNER_EDGE`;
    stripe.position.set(x + (i?-.21:.21),cfg.y,.25);
    stripe.renderOrder=545;
    group.add(stripe);
  });

  const top=new THREE.Mesh(new THREE.BoxGeometry(cfg.w*1.48,.26,.42),mat(GOLD,{roughness:.30,metalness:.36,emissive:0x3a2605,emissiveIntensity:.22}));
  top.name=`${group.name}_SOLID_TOP_HEADER`;
  top.position.set(0,cfg.y+cfg.h*.58,.11);
  top.renderOrder=96;
  group.add(top);

  const arch=new THREE.Mesh(new THREE.TorusGeometry(cfg.w*.60,.048,12,96,Math.PI),new THREE.MeshBasicMaterial({color:cfg.c,transparent:true,opacity:.82,depthWrite:false}));
  arch.name=`${group.name}_CORRECT_UPSIDE_DOWN_U_ARCH`;
  arch.position.set(0,cfg.y+cfg.h*.48,.30);
  arch.rotation.z=Math.PI;
  arch.renderOrder=546;
  group.add(arch);

  const floor=new THREE.Mesh(new THREE.BoxGeometry(cfg.w*1.10,.07,1.35),mat(0x101521,{roughness:.44,metalness:.16,emissive:cfg.c,emissiveIntensity:.08}));
  floor.name=`${group.name}_SOLID_PORTAL_THRESHOLD_FLOOR`;
  floor.position.set(0,.06,1.08);
  floor.userData.svrTeleportFloor=true;
  floor.userData.svrWalkable=true;
  floor.userData.phase115PortalThreshold=true;
  group.add(floor);
}
function visibleCount(scene, re){
  let n=0;
  scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; });
  return n;
}
function qa(scene){
  const lounge = !!scene.getObjectByName("PHASE115_CORRECT_DOORWAY_LOUNGE");
  const vibes = !!scene.getObjectByName("PHASE115_CORRECT_DOORWAY_VIBES");
  return {
    lounge,
    vibes,
    leftWallBalanced:lounge && vibes,
    rightWallStillPresent: !!scene.getObjectByName("PHASE99_CORRECT_DOORWAY_STORE") && !!scene.getObjectByName("PHASE99_CORRECT_DOORWAY_SCORPION"),
    rearWallStillPresent: !!scene.getObjectByName("PHASE99_CORRECT_DOORWAY_WELLNESS") && !!scene.getObjectByName("PHASE99_CORRECT_DOORWAY_POKER") && !!scene.getObjectByName("PHASE99_CORRECT_DOORWAY_PGA"),
    oneTable: !scene.getObjectByName(DUP),
    pillars: visibleCount(scene,/SIDE_PILLAR_CORRECT/i),
    arches: visibleCount(scene,/CORRECT_UPSIDE_DOWN_U_ARCH/i),
    signs: visibleCount(scene,/SIGN_AFFIXED_IN_WALL/i),
    pokerObjects: visibleCount(scene,/POKER|TABLE|CARD|CHIP|ACTION|WATCH/i),
    ready:lounge && vibes && !scene.getObjectByName(DUP)
  };
}
function cleanUi(){
  document.title = "Scarlett Poker VR";
  const s = document.getElementById("safeStatus"); if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}
function install(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group();
  root.name=ROOT;
  scene.add(root);
  cleanUi();
  const removedDuplicateTable = removeDuplicateTable(scene);
  PORTALS.forEach((cfg)=>buildDoorway(root,cfg));
  const report = qa(scene);
  window.SVR_PHASE115_LEFT_WALL_PORTAL_BALANCE_ALIGNMENT_LOCK = {
    build:LABEL,
    active:true,
    leftWallPortalBalance:true,
    addedPortals:PORTALS.map((p)=>p.key),
    removedDuplicateTable,
    report,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    privateRoomsCreated:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE115_PORTAL_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
