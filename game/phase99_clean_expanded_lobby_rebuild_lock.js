import * as THREE from "three";

const LABEL = "PHASE-113-EXPANDED-LOBBY-ORGANIZATION-ALIGNMENT-LOCK";
const ROOT = "PHASE99_CLEAN_EXPANDED_LOBBY_REBUILD_ROOT";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0x9b4dff;
const WALL = 0x070914;
const FLOOR = 0x0b0e16;
const CLEAR_RE = /PHASE9[0-8]|UPDATE4|DAILY_PICK|WALLET_GATEWAY|LOCATOR|SIGHTLINE|COMFORT|QA|AUDIT|GUIDE|ROPE|EXTRA|DUPLICATE|TEMP|DEBUG/i;
const KEEP_RE = /POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|RAY|ARC|TARGET|PORTAL|PGA|WELLNESS|STORE|SCORPION|MOON|MARS|PLAYER|BOT|CHAIR|DEALER|FLOOR|SECOND_FLOOR|BALCONY|PHASE98_SECOND_FLOOR/i;
let installed = false;

const DOORWAYS = [
  { key:"wellness", title:"WELLNESS", sub:"AWAITING APPROVAL", x:-16.2, y:1.9, z:-18.72, w:4.25, h:3.35, ry:0, c:PURPLE },
  { key:"poker", title:"POKER", sub:"MAIN TABLE", x:0, y:2.0, z:-18.76, w:4.9, h:3.55, ry:0, c:GOLD },
  { key:"pga", title:"PGA RANGE", sub:"TRAINING PORTAL", x:16.2, y:1.9, z:-18.72, w:4.25, h:3.35, ry:0, c:CYAN },
  { key:"store", title:"SVR STORE", sub:"WEB PORTAL", x:23.55, y:1.9, z:5.8, w:3.85, h:3.15, ry:-Math.PI/2, c:GOLD },
  { key:"scorpion", title:"SCORPION", sub:"PRIVATE ROOM", x:23.55, y:1.9, z:-8.8, w:3.85, h:3.15, ry:-Math.PI/2, c:PURPLE }
];

function mat(color, opts={}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? .48,
    metalness: opts.metalness ?? .08,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1
  });
}
function glow(color, opacity=.20){
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
  ctx.fillStyle="#ffffff"; ctx.font="900 78px system-ui,Arial"; ctx.fillText(title,512,205);
  ctx.fillStyle="#bffcff"; ctx.font="800 39px system-ui,Arial"; ctx.fillText(sub,512,305);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=2; return tex;
}
function makePanel(root, name, geom, material, pos, ry=0){
  const mesh = new THREE.Mesh(geom, material);
  mesh.name = name;
  mesh.position.copy(pos);
  mesh.rotation.y = ry;
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  mesh.userData.phase99Solid = true;
  mesh.userData.phase113ExpandedAligned = true;
  root.add(mesh);
  return mesh;
}
function clearOldCrowd(scene){
  let hidden=0, protectedCore=0;
  scene.traverse((obj)=>{
    const n=String(obj.name||"");
    if(!n) return;
    if(KEEP_RE.test(n)){
      obj.visible=true;
      obj.renderOrder=Math.max(obj.renderOrder||0,500);
      obj.userData.phase99CoreProtected=true;
      if(obj.material){
        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        mats.forEach(m=>{ if(m){ m.depthWrite=false; m.needsUpdate=true; }});
      }
      protectedCore++;
      return;
    }
    if(CLEAR_RE.test(n)){
      obj.visible=false;
      obj.userData.phase99HiddenAsCrowd=true;
      hidden++;
      return;
    }
  });
  return {hidden, protectedCore};
}
function buildLargeRoom(root){
  makePanel(root,"PHASE99_EXPANDED_SOLID_MAIN_FLOOR",new THREE.BoxGeometry(48,.14,38),mat(FLOOR,{roughness:.42,metalness:.12,emissive:0x020308,emissiveIntensity:.12}),new THREE.Vector3(0,-.02,-1.6));
  makePanel(root,"PHASE99_FREE_SPAWN_CLEAR_ZONE",new THREE.CircleGeometry(4.7,96),glow(CYAN,.10),new THREE.Vector3(0,.08,10.6)).rotation.x=-Math.PI/2;
  makePanel(root,"PHASE99_FIRST_TIME_USER_MAIN_WALKWAY",new THREE.PlaneGeometry(5.3,27.5),glow(GOLD,.075),new THREE.Vector3(0,.09,-2.9)).rotation.x=-Math.PI/2;
  makePanel(root,"PHASE99_SOLID_REAR_WALL",new THREE.BoxGeometry(48,5.4,.24),mat(WALL,{roughness:.52,metalness:.05,emissive:0x03050c,emissiveIntensity:.18}),new THREE.Vector3(0,2.6,-19.0));
  makePanel(root,"PHASE99_SOLID_LEFT_WALL",new THREE.BoxGeometry(.24,5.4,38),mat(WALL,{roughness:.52,metalness:.05,emissive:0x03050c,emissiveIntensity:.18}),new THREE.Vector3(-24.05,2.6,-1.6));
  makePanel(root,"PHASE99_SOLID_RIGHT_WALL",new THREE.BoxGeometry(.24,5.4,38),mat(WALL,{roughness:.52,metalness:.05,emissive:0x03050c,emissiveIntensity:.18}),new THREE.Vector3(24.05,2.6,-1.6));
  makePanel(root,"PHASE99_SOLID_FRONT_LOW_WALL",new THREE.BoxGeometry(48,2.15,.22),mat(WALL,{roughness:.52,metalness:.05,emissive:0x03050c,emissiveIntensity:.12}),new THREE.Vector3(0,1.08,17.25));
  [
    [0,.24,-18.76,47.2,.08,0,"REAR_BASE"],[0,5.08,-18.76,47.2,.08,0,"REAR_CROWN"],
    [-23.82,.24,-1.6,37.5,.08,Math.PI/2,"LEFT_BASE"],[-23.82,5.08,-1.6,37.5,.08,Math.PI/2,"LEFT_CROWN"],
    [23.82,.24,-1.6,37.5,.08,-Math.PI/2,"RIGHT_BASE"],[23.82,5.08,-1.6,37.5,.08,-Math.PI/2,"RIGHT_CROWN"]
  ].forEach(([x,y,z,w,d,ry,name])=>{
    const trim=makePanel(root,`PHASE99_CONTINUOUS_PURPLE_TRIM_${name}`,new THREE.BoxGeometry(w,.05,d),mat(PURPLE,{roughness:.25,metalness:.35,emissive:PURPLE,emissiveIntensity:.32}),new THREE.Vector3(x,y,z),ry);
    trim.renderOrder=90;
  });
}
function buildDoorway(root,cfg){
  const group=new THREE.Group();
  group.name=`PHASE99_CORRECT_DOORWAY_${cfg.key.toUpperCase()}`;
  group.position.set(cfg.x,0,cfg.z); group.rotation.y=cfg.ry||0; root.add(group);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(cfg.w+.85,cfg.h+.62),new THREE.MeshBasicMaterial({color:0x02040a,transparent:true,opacity:.86,side:THREE.DoubleSide,depthWrite:false}));
  back.name=`${group.name}_FLUSH_WALL_SIGN_BACKPLATE`;
  back.position.set(0,cfg.y,.018);
  back.renderOrder=510; group.add(back);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(cfg.w*.76,cfg.h*.34),new THREE.MeshBasicMaterial({map:signTexture(cfg.title,cfg.sub,cfg.c),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  sign.name=`${group.name}_SIGN_AFFIXED_IN_WALL`;
  sign.position.set(0,cfg.y+.22,.006);
  sign.renderOrder=540; group.add(sign);
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
    stripe.renderOrder=545; group.add(stripe);
  });
  const top=new THREE.Mesh(new THREE.BoxGeometry(cfg.w*1.48,.26,.42),mat(GOLD,{roughness:.30,metalness:.36,emissive:0x3a2605,emissiveIntensity:.22}));
  top.name=`${group.name}_SOLID_TOP_HEADER`;
  top.position.set(0,cfg.y+cfg.h*.58,.11); top.renderOrder=96; group.add(top);
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
  group.add(floor);
}
function buildOrganizedZones(root){
  DOORWAYS.forEach(cfg=>buildDoorway(root,cfg));
  const tableRing=new THREE.Mesh(new THREE.RingGeometry(3.25,3.68,96),glow(GOLD,.18));
  tableRing.name="PHASE99_TABLE_FOCUS_RING_SINGLE_CLEAN";
  tableRing.rotation.x=-Math.PI/2;
  tableRing.position.set(0,.11,-2.7);
  tableRing.renderOrder=505;
  root.add(tableRing);
  const clearBuffer=new THREE.Mesh(new THREE.RingGeometry(5.2,5.55,128),glow(CYAN,.055));
  clearBuffer.name="PHASE113_TABLE_CLEAR_BUFFER_RING_NO_STOREFRONTS_INSIDE";
  clearBuffer.rotation.x=-Math.PI/2;
  clearBuffer.position.set(0,.105,-2.7);
  clearBuffer.renderOrder=504;
  root.add(clearBuffer);
  const spawnLabelTex=signTexture("WELCOME", "Open lobby • table center • portals on walls", CYAN);
  const spawnSign=new THREE.Mesh(new THREE.PlaneGeometry(4.1,1.18),new THREE.MeshBasicMaterial({map:spawnLabelTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  spawnSign.name="PHASE99_FIRST_TIME_USER_WELCOME_VIEW_SIGN";
  spawnSign.position.set(0,2.25,13.9);
  spawnSign.rotation.y=Math.PI;
  spawnSign.renderOrder=530;
  root.add(spawnSign);
}
function firstTimeView(camera){
  if(!camera || window.__SVR_RENDERER__?.xr?.isPresenting) return false;
  camera.position.set(0,1.62,10.6);
  camera.lookAt(0,1.55,-3.0);
  return true;
}
function solidify(scene){
  let solid=0;
  scene.traverse(o=>{
    const n=String(o.name||"");
    if(/PHASE99|PHASE98_SECOND_FLOOR|PORTAL|FLOOR|WALL|DOORWAY|PILLAR|THRESHOLD|TABLE|CARD|CHIP|ACTION/.test(n)){
      o.userData.phase99Solidified=true;
      o.userData.phase113ExpandedAligned=true;
      o.visible=true;
      if(o.isMesh){ o.frustumCulled=false; solid++; }
    }
  });
  return solid;
}
function install(){
  const scene=window.__SVR_SCENE__, renderer=window.__SVR_RENDERER__, camera=window.__SVR_CAMERA__;
  if(!scene||!renderer) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const cleanup=clearOldCrowd(scene);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  buildLargeRoom(root);
  buildOrganizedZones(root);
  const viewSet=firstTimeView(camera);
  const solid=solidify(scene);
  renderer.setClearColor?.(0x010208,1);
  renderer.toneMappingExposure=Math.min(renderer.toneMappingExposure||1,.96);
  renderer.shadowMap.enabled=false;
  window.SVR_PHASE99_CLEAN_EXPANDED_LOBBY_REBUILD_LOCK={
    build:LABEL,
    active:true,
    phase101SecondFloorProtected:true,
    phase113ExpandedAligned:true,
    mode:"expanded organized portal-hub final layout",
    lobbySize:"48 x 38 floor, widened walls, clear center table zone",
    spawn:{x:0,z:10.6,freeRadius:4.7,firstTimeView:viewSet},
    tableClearBufferRadius:5.55,
    doorways:DOORWAYS.map(d=>({key:d.key,x:d.x,z:d.z,sign:"affixed in wall",pillars:"left and right",arch:"correct U arch",solid:true})),
    cleanup,
    solidifiedMeshes:solid,
    quickLoad:true,
    oldPhaseVisualStackCollapsed:true,
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
  installed=true;
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>120) clearInterval(timer); },250);
[700,1600,3200,6200,10000].forEach(d=>setTimeout(install,d));
