import * as THREE from "three";

const LABEL = "PHASE-118-LUXURY-DEPTH-WAYFINDING-POLISH-LOCK";
const ROOT = "PHASE118_LUXURY_DEPTH_WAYFINDING_POLISH_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0x9b4dff;
const RED = 0x4b0712;

const WAYFINDERS = [
  { name:"POKER", sub:"MAIN TABLE", x:0, y:3.85, z:-17.92, ry:0, c:GOLD },
  { name:"WELLNESS", sub:"REIKI ROUTE", x:-16.2, y:3.72, z:-17.92, ry:0, c:PURPLE },
  { name:"PGA", sub:"RANGE ROUTE", x:16.2, y:3.72, z:-17.92, ry:0, c:CYAN },
  { name:"LOUNGE", sub:"LEFT WALL", x:-23.72, y:3.55, z:5.8, ry:Math.PI/2, c:GOLD },
  { name:"VIBES", sub:"THEATER", x:-23.72, y:3.55, z:-8.8, ry:Math.PI/2, c:PURPLE },
  { name:"STORE", sub:"RIGHT WALL", x:23.72, y:3.55, z:5.8, ry:-Math.PI/2, c:GOLD },
  { name:"SCORPION", sub:"PRIVATE", x:23.72, y:3.55, z:-8.8, ry:-Math.PI/2, c:PURPLE }
];

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function mat(color, opts={}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? .42,
    metalness: opts.metalness ?? .18,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true
  });
}
function glow(color, opacity=.25){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function textTexture(title, sub, color){
  const c = document.createElement("canvas"); c.width = 900; c.height = 360;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#05060b"); g.addColorStop(.55,"#120817"); g.addColorStop(1,"#03050a");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(255,217,138,.78)"; x.lineWidth = 9; x.strokeRect(22,22,c.width-44,c.height-44);
  x.strokeStyle = `#${color.toString(16).padStart(6,"0")}`; x.lineWidth = 5; x.strokeRect(48,48,c.width-96,c.height-96);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = `#${color.toString(16).padStart(6,"0")}`; x.shadowBlur = 18;
  x.fillStyle = "#fff8df"; x.font = "900 58px system-ui,Arial"; x.fillText(title,c.width/2,142,c.width-90);
  x.shadowBlur = 8; x.fillStyle = "#bffcff"; x.font = "800 30px system-ui,Arial"; x.fillText(sub,c.width/2,222,c.width-90);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
function addBox(root,name,sx,sy,sz,material,pos,ry=0){
  const o = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);
  o.name = name; o.position.set(pos.x,pos.y,pos.z); o.rotation.y = ry; o.renderOrder = pos.renderOrder ?? 630; o.userData.phase118Luxury = true; root.add(o); return o;
}
function addPlane(root,name,w,h,material,pos,rot={}){
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);
  o.name = name; o.position.set(pos.x,pos.y,pos.z); o.rotation.set(rot.x||0,rot.y||0,rot.z||0); o.renderOrder = pos.renderOrder ?? 635; o.userData.phase118Luxury = true; root.add(o); return o;
}
function addCeiling(root){
  const ceilingMat = mat(0x070811,{roughness:.58,metalness:.10,emissive:0x03040a,emissiveIntensity:.16});
  addPlane(root,"PHASE118_LUXURY_COFFEE_BLACK_CEILING_PANEL",40,30,ceilingMat,{x:0,y:5.25,z:-1.6,renderOrder:500},{x:Math.PI/2});
  const goldMat = mat(GOLD,{roughness:.30,metalness:.55,emissive:0x2e1d04,emissiveIntensity:.16});
  [-16,-8,0,8,16].forEach((x,i)=>addBox(root,`PHASE118_LUXURY_CEILING_GOLD_RIB_X_${i}`,0.055,.055,29.2,goldMat,{x,y:5.18,z:-1.6,renderOrder:636}));
  [-14,-7,0,7,14].forEach((z,i)=>addBox(root,`PHASE118_LUXURY_CEILING_GOLD_RIB_Z_${i}`,39.0,.055,0.055,goldMat,{x:0,y:5.17,z,renderOrder:636}));
  [[-10,6],[10,6],[-10,-9],[10,-9],[0,-2.7]].forEach(([x,z],i)=>{
    const halo = new THREE.Mesh(new THREE.RingGeometry(.55,.82,64),glow(i===4?GOLD:CYAN,i===4?.30:.18));
    halo.name = `PHASE118_LUXURY_CEILING_SOFT_LIGHT_HALO_${i}`;
    halo.position.set(x,5.1,z); halo.rotation.x = Math.PI/2; halo.renderOrder = 638; halo.userData.phase118Luxury = true; root.add(halo);
    const light = new THREE.PointLight(i===4?0xffd98a:0x7ffcff,i===4?.85:.38,i===4?12:8,2.0);
    light.name = `PHASE118_LUXURY_CEILING_LIGHT_${i}`;
    light.position.set(x,4.85,z); root.add(light);
  });
}
function addWayfinding(root){
  WAYFINDERS.forEach((w)=>{
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2.9,.92),new THREE.MeshBasicMaterial({map:textTexture(w.name,w.sub,w.c),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    back.name = `PHASE118_LUXURY_WAYFINDER_${w.name}`;
    back.position.set(w.x,w.y,w.z); back.rotation.y = w.ry; back.renderOrder = 660; back.userData.phase118Luxury = true; root.add(back);
    const rail = addBox(root,`PHASE118_LUXURY_WAYFINDER_GOLD_UNDERLINE_${w.name}`,2.72,.04,.04,mat(GOLD,{roughness:.28,metalness:.62,emissive:0x2e1d04,emissiveIntensity:.20}),{x:w.x,y:w.y-.58,z:w.z,renderOrder:661},w.ry);
    rail.userData.phase118Wayfinder = true;
  });
}
function addSideRunners(root){
  const runnerMat = mat(RED,{roughness:.76,metalness:.04,emissive:0x180207,emissiveIntensity:.10,side:THREE.DoubleSide,depthWrite:false});
  [-12.6,12.6].forEach((x,i)=>{
    addPlane(root,`PHASE118_LUXURY_SIDE_RUNNER_${i?"RIGHT":"LEFT"}`,2.2,18.5,runnerMat,{x,y:.135,z:-1.8,renderOrder:633},{x:-Math.PI/2});
    addBox(root,`PHASE118_LUXURY_SIDE_RUNNER_GOLD_EDGE_A_${i}`,0.055,.028,18.6,mat(GOLD,{roughness:.28,metalness:.55,emissive:0x2d1e04,emissiveIntensity:.15}),{x:x-1.14,y:.165,z:-1.8,renderOrder:634});
    addBox(root,`PHASE118_LUXURY_SIDE_RUNNER_GOLD_EDGE_B_${i}`,0.055,.028,18.6,mat(GOLD,{roughness:.28,metalness:.55,emissive:0x2d1e04,emissiveIntensity:.15}),{x:x+1.14,y:.165,z:-1.8,renderOrder:634});
  });
}
function addWallLightBars(root){
  const bars = [
    [0,-18.73,38,0,"REAR"],[-23.86,-1.6,30,Math.PI/2,"LEFT"],[23.86,-1.6,30,-Math.PI/2,"RIGHT"]
  ];
  bars.forEach(([x,z,w,ry,name])=>{
    const bar = addBox(root,`PHASE118_LUXURY_CONTINUOUS_WALL_LIGHT_BAR_${name}`,w,.05,.04,mat(GOLD,{roughness:.28,metalness:.62,emissive:0x3a2504,emissiveIntensity:.28}),{x,y:3.92,z,renderOrder:650},ry);
    bar.userData.phase118WallLightBar = true;
    const cyan = addBox(root,`PHASE118_LUXURY_CYAN_SECONDARY_WALL_LIGHT_BAR_${name}`,w*.92,.035,.035,mat(CYAN,{roughness:.25,metalness:.35,emissive:CYAN,emissiveIntensity:.22}),{x,y:3.72,z,renderOrder:649},ry);
    cyan.userData.phase118WallLightBar = true;
  });
}
function protectCore(scene){
  let protectedObjects = 0;
  scene.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase118CoreProtected = true;
      if(o.isMesh){ o.frustumCulled = false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function qa(scene){
  return {
    ceiling: !!scene.getObjectByName("PHASE118_LUXURY_COFFEE_BLACK_CEILING_PANEL"),
    wayfinders: count(scene,/PHASE118_LUXURY_WAYFINDER_[A-Z]/i),
    sideRunners: count(scene,/PHASE118_LUXURY_SIDE_RUNNER_(LEFT|RIGHT)$/i),
    wallBars: count(scene,/PHASE118_LUXURY_.*WALL_LIGHT_BAR/i),
    portalRoutes: !!window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK,
    oneTable: !scene.getObjectByName(DUP),
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP|ACTION|WATCH/i),
    ready: !!scene.getObjectByName("PHASE118_LUXURY_COFFEE_BLACK_CEILING_PANEL") && count(scene,/PHASE118_LUXURY_WAYFINDER_[A-Z]/i) >= 7 && !scene.getObjectByName(DUP)
  };
}
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
  addCeiling(root);
  addWayfinding(root);
  addSideRunners(root);
  addWallLightBars(root);
  const protectedObjects = protectCore(scene);
  const report = qa(scene);
  window.SVR_PHASE118_LUXURY_DEPTH_WAYFINDING_POLISH_LOCK = { build:LABEL, active:true, luxuryDepth:true, wayfindingPolish:true, removedDuplicateTable, protectedObjects, report, siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, portalRoutesTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE118_LUXURY_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
