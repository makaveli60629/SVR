import * as THREE from "three";

const LABEL = "PHASE-117-LUXURY-LOBBY-VISUAL-POLISH-LOCK";
const ROOT = "PHASE117_LUXURY_LOBBY_VISUAL_POLISH_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0x9b4dff;
const CRIMSON = 0x3a0712;
const BLACK = 0x05060b;

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function mat(color, opts={}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? .44,
    metalness: opts.metalness ?? .12,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true
  });
}
function glow(color, opacity=.22){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function marbleTexture(){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#05060b"); g.addColorStop(.5,"#11131f"); g.addColorStop(1,"#05060b");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<34;i++){
    x.strokeStyle = i%3===0 ? "rgba(255,217,138,.16)" : "rgba(127,252,255,.055)";
    x.lineWidth = 1 + Math.random()*3;
    x.beginPath();
    const y = Math.random()*c.height;
    x.moveTo(-30,y);
    for(let px=0;px<c.width+60;px+=80){ x.lineTo(px, y + Math.sin(px*.018+i)*22 + Math.random()*18); }
    x.stroke();
  }
  x.strokeStyle = "rgba(255,217,138,.58)"; x.lineWidth = 10; x.strokeRect(20,20,c.width-40,c.height-40);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
function addPlane(root, name, w, h, material, pos, rot={}){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), material);
  m.name = name;
  m.position.set(pos.x,pos.y,pos.z);
  m.rotation.set(rot.x||0, rot.y||0, rot.z||0);
  m.renderOrder = pos.renderOrder ?? 610;
  m.userData.phase117Luxury = true;
  root.add(m);
  return m;
}
function addBox(root, name, sx, sy, sz, material, pos, rotY=0){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  m.name = name;
  m.position.set(pos.x,pos.y,pos.z);
  m.rotation.y = rotY;
  m.renderOrder = pos.renderOrder ?? 600;
  m.userData.phase117Luxury = true;
  root.add(m);
  return m;
}
function addCenterCarpet(root){
  addPlane(root,"PHASE117_LUXURY_CENTER_RED_CARPET_MAIN_RUNNER",5.6,24.5,mat(CRIMSON,{roughness:.74,metalness:.03,emissive:0x180106,emissiveIntensity:.12,side:THREE.DoubleSide,depthWrite:false}),{x:0,y:.125,z:-1.55,renderOrder:612},{x:-Math.PI/2});
  addPlane(root,"PHASE117_LUXURY_CARPET_TABLE_MEDALLION",8.0,8.0,glow(GOLD,.085),{x:0,y:.132,z:-2.7,renderOrder:613},{x:-Math.PI/2});
  [-3.05,3.05].forEach((x,i)=>{
    addBox(root,`PHASE117_LUXURY_CARPET_GOLD_EDGE_${i?"RIGHT":"LEFT"}`,0.08,.035,24.6,mat(GOLD,{roughness:.28,metalness:.58,emissive:0x3a2605,emissiveIntensity:.18}),{x,y:.16,z:-1.55,renderOrder:614});
  });
  [-1.85,1.85].forEach((x,i)=>{
    addBox(root,`PHASE117_LUXURY_INNER_CARPET_PINSTRIPE_${i?"RIGHT":"LEFT"}`,0.035,.028,23.8,mat(0x7b4a1a,{roughness:.32,metalness:.45,emissive:0x201004,emissiveIntensity:.12}),{x,y:.17,z:-1.55,renderOrder:615});
  });
}
function addWallPanels(root){
  const marble = marbleTexture();
  const panelMat = new THREE.MeshBasicMaterial({ map:marble, transparent:true, opacity:.92, side:THREE.DoubleSide, depthWrite:false });
  const panels = [
    ["REAR_LEFT",-11.8,2.65,-18.61,5.2,2.05,0],
    ["REAR_RIGHT",11.8,2.65,-18.61,5.2,2.05,0],
    ["LEFT_FRONT",-23.86,2.55,9.8,4.3,2.0,Math.PI/2],
    ["LEFT_REAR",-23.86,2.55,-14.4,4.3,2.0,Math.PI/2],
    ["RIGHT_FRONT",23.86,2.55,9.8,4.3,2.0,-Math.PI/2],
    ["RIGHT_REAR",23.86,2.55,-14.4,4.3,2.0,-Math.PI/2]
  ];
  panels.forEach(([n,x,y,z,w,h,ry])=>{
    const p = addPlane(root,`PHASE117_LUXURY_DARK_MARBLE_WALL_PANEL_${n}`,w,h,panelMat,{x,y,z,renderOrder:607},{y:ry});
    p.userData.phase117WallPanel = true;
  });
}
function addChandelier(root){
  const group = new THREE.Group(); group.name = "PHASE117_LUXURY_TABLE_CHANDELIER_GLOW"; group.position.set(0,4.82,-2.7); root.add(group);
  const ringMat = new THREE.MeshBasicMaterial({ color:GOLD, transparent:true, opacity:.78, depthWrite:false, blending:THREE.AdditiveBlending });
  [1.0,1.55,2.05].forEach((r,i)=>{
    const tor = new THREE.Mesh(new THREE.TorusGeometry(r,.025,8,96),ringMat);
    tor.name = `PHASE117_LUXURY_CHANDELIER_RING_${i}`;
    tor.rotation.x = Math.PI/2;
    tor.position.y = -i*.09;
    tor.userData.phase117Luxury = true;
    group.add(tor);
  });
  for(let i=0;i<12;i++){
    const a = i/12*Math.PI*2;
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),new THREE.MeshBasicMaterial({color: i%2?CYAN:GOLD, transparent:true, opacity:.82, depthWrite:false, blending:THREE.AdditiveBlending}));
    bead.name = "PHASE117_LUXURY_CHANDELIER_CRYSTAL";
    bead.position.set(Math.cos(a)*1.55,-.38,Math.sin(a)*1.55);
    bead.userData.phase117Luxury = true;
    group.add(bead);
  }
  const light = new THREE.PointLight(0xffd98a,1.25,13,2.2); light.name = "PHASE117_LUXURY_SOFT_TABLE_LIGHT"; light.position.set(0,-.25,0); group.add(light);
  group.userData.tick = (dt,time)=>{ group.rotation.y += dt*.10; light.intensity = 1.05 + Math.sin(time*1.4)*.12; };
}
function addSymmetryDecor(root){
  const postMat = mat(0x171015,{roughness:.38,metalness:.25,emissive:0x1f0710,emissiveIntensity:.12});
  const glowMat = glow(PURPLE,.28);
  [[-6.3,3.8],[6.3,3.8],[-6.3,-9.2],[6.3,-9.2],[-18.5,2.5],[18.5,2.5],[-18.5,-12.2],[18.5,-12.2]].forEach(([x,z],i)=>{
    const post = addBox(root,`PHASE117_LUXURY_SHORT_DECOR_POST_${i}`,.22,.95,.22,postMat,{x,y:.52,z,renderOrder:604});
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.18,18,12),glowMat);
    orb.name = `PHASE117_LUXURY_GLOW_ORB_${i}`;
    orb.position.set(x,1.12,z);
    orb.renderOrder = 620;
    orb.userData.phase117Luxury = true;
    root.add(orb);
  });
  [[-9.5,-15.75],[9.5,-15.75],[-21.0,-2.0],[21.0,-2.0]].forEach(([x,z],i)=>{
    addBox(root,`PHASE117_LUXURY_LOW_GOLD_WAYFINDING_RAIL_${i}`,3.8,.06,.08,mat(GOLD,{roughness:.26,metalness:.62,emissive:0x3a2605,emissiveIntensity:.16}),{x,y:.72,z,renderOrder:608},0);
  });
}
function protectCore(scene){
  let protectedObjects = 0;
  scene.traverse?.((o)=>{
    const n = String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase117CoreProtected = true;
      if(o.isMesh){ o.frustumCulled = false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function qa(scene){
  return {
    luxuryObjects: count(scene,/PHASE117_LUXURY/i),
    carpet: !!scene.getObjectByName("PHASE117_LUXURY_CENTER_RED_CARPET_MAIN_RUNNER"),
    wallPanels: count(scene,/PHASE117_LUXURY_DARK_MARBLE_WALL_PANEL/i),
    chandelier: !!scene.getObjectByName("PHASE117_LUXURY_TABLE_CHANDELIER_GLOW"),
    decorPosts: count(scene,/PHASE117_LUXURY_SHORT_DECOR_POST/i),
    oneTable: !scene.getObjectByName(DUP),
    portals: count(scene,/PHASE99_CORRECT_DOORWAY_|PHASE115_CORRECT_DOORWAY_/i),
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP|ACTION|WATCH/i),
    ready: !!scene.getObjectByName("PHASE117_LUXURY_CENTER_RED_CARPET_MAIN_RUNNER") && !!scene.getObjectByName("PHASE117_LUXURY_TABLE_CHANDELIER_GLOW") && !scene.getObjectByName(DUP)
  };
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function cleanUi(){
  document.title = "Scarlett Poker VR";
  const s = document.getElementById("safeStatus"); if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable = removeDuplicateTable(scene);
  addCenterCarpet(root);
  addWallPanels(root);
  addChandelier(root);
  addSymmetryDecor(root);
  const protectedObjects = protectCore(scene);
  const report = qa(scene);
  window.SVR_PHASE117_LUXURY_LOBBY_VISUAL_POLISH_LOCK = {
    build:LABEL,
    active:true,
    luxuryVisualPolish:true,
    organizedLuxuryLobby:true,
    removedDuplicateTable,
    protectedObjects,
    report,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    portalRoutesTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE117_LUXURY_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
