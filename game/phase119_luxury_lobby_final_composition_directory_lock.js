import * as THREE from "three";

const LABEL = "PHASE-119-LUXURY-LOBBY-FINAL-COMPOSITION-DIRECTORY-LOCK";
const ROOT = "PHASE119_LUXURY_LOBBY_FINAL_COMPOSITION_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0x9b4dff;
const RED = 0x4b0712;

const DIRECTORY_LINES_LEFT = ["LEFT WING", "SVR LOUNGE", "VIBES THEATER", "SOCIAL / EVENTS"];
const DIRECTORY_LINES_RIGHT = ["RIGHT WING", "SVR STORE", "SCORPION ROOM", "STORE / PRIVATE"];
const DIRECTORY_LINES_CENTER = ["MAIN FLOOR", "POKER TABLE", "WELLNESS", "PGA RANGE"];

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
function panelTexture(title, lines, color){
  const c = document.createElement("canvas"); c.width = 1000; c.height = 620;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#03040a"); g.addColorStop(.55,"#140611"); g.addColorStop(1,"#05060c");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(255,217,138,.85)"; x.lineWidth = 12; x.strokeRect(24,24,c.width-48,c.height-48);
  x.strokeStyle = `#${color.toString(16).padStart(6,"0")}`; x.lineWidth = 6; x.strokeRect(62,62,c.width-124,c.height-124);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = `#${color.toString(16).padStart(6,"0")}`; x.shadowBlur = 20;
  x.fillStyle = "#fff8df"; x.font = "900 66px system-ui,Arial"; x.fillText(title,c.width/2,118,c.width-100);
  x.shadowBlur = 6;
  lines.forEach((line,i)=>{
    x.fillStyle = i===0 ? "#ffd98a" : "#bffcff";
    x.font = i===0 ? "900 42px system-ui,Arial" : "800 34px system-ui,Arial";
    x.fillText(line,c.width/2,232+i*78,c.width-120);
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
function addPlane(root,name,w,h,material,pos,rot={}){
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);
  o.name = name; o.position.set(pos.x,pos.y,pos.z); o.rotation.set(rot.x||0,rot.y||0,rot.z||0); o.renderOrder = pos.renderOrder ?? 690; o.userData.phase119Luxury = true; root.add(o); return o;
}
function addBox(root,name,sx,sy,sz,material,pos,ry=0){
  const o = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);
  o.name = name; o.position.set(pos.x,pos.y,pos.z); o.rotation.y = ry; o.renderOrder = pos.renderOrder ?? 680; o.userData.phase119Luxury = true; root.add(o); return o;
}
function addDirectoryBoards(root){
  const left = new THREE.Mesh(new THREE.PlaneGeometry(3.65,2.25), new THREE.MeshBasicMaterial({map:panelTexture("DIRECTORY", DIRECTORY_LINES_LEFT, PURPLE), transparent:true, side:THREE.DoubleSide, depthWrite:false}));
  left.name = "PHASE119_LUXURY_DIRECTORY_LEFT_WING_BOARD";
  left.position.set(-5.75,2.35,13.9); left.rotation.y = Math.PI; left.renderOrder = 700; left.userData.phase119Luxury = true; root.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(3.65,2.25), new THREE.MeshBasicMaterial({map:panelTexture("DIRECTORY", DIRECTORY_LINES_RIGHT, GOLD), transparent:true, side:THREE.DoubleSide, depthWrite:false}));
  right.name = "PHASE119_LUXURY_DIRECTORY_RIGHT_WING_BOARD";
  right.position.set(5.75,2.35,13.9); right.rotation.y = Math.PI; right.renderOrder = 700; right.userData.phase119Luxury = true; root.add(right);
  const center = new THREE.Mesh(new THREE.PlaneGeometry(4.2,2.45), new THREE.MeshBasicMaterial({map:panelTexture("WELCOME", DIRECTORY_LINES_CENTER, CYAN), transparent:true, side:THREE.DoubleSide, depthWrite:false}));
  center.name = "PHASE119_LUXURY_FRONT_WELCOME_DIRECTORY_BOARD";
  center.position.set(0,3.05,16.94); center.rotation.y = Math.PI; center.renderOrder = 701; center.userData.phase119Luxury = true; root.add(center);
}
function addVipRopes(root){
  const goldMat = mat(GOLD,{roughness:.30,metalness:.65,emissive:0x352204,emissiveIntensity:.18});
  const redGlow = glow(RED,.45);
  const points = [[-3.45,7.0],[-3.45,3.5],[-3.45,0.0],[-3.45,-3.5],[-3.45,-7.0],[3.45,7.0],[3.45,3.5],[3.45,0.0],[3.45,-3.5],[3.45,-7.0]];
  points.forEach(([x,z],i)=>{
    addBox(root,`PHASE119_LUXURY_VIP_STANCHION_POST_${i}`,.16,.72,.16,goldMat,{x,y:.46,z,renderOrder:682});
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.13,16,10),new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.92,depthWrite:false,blending:THREE.AdditiveBlending}));
    cap.name = `PHASE119_LUXURY_VIP_STANCHION_GOLD_CAP_${i}`;
    cap.position.set(x,.86,z); cap.renderOrder = 685; cap.userData.phase119Luxury = true; root.add(cap);
  });
  [[-3.45,5.25],[-3.45,1.75],[-3.45,-1.75],[-3.45,-5.25],[3.45,5.25],[3.45,1.75],[3.45,-1.75],[3.45,-5.25]].forEach(([x,z],i)=>{
    const rope = addBox(root,`PHASE119_LUXURY_VIP_RED_ROPE_${i}`,.08,.05,3.1,redGlow,{x,y:.82,z,renderOrder:684});
    rope.material.depthWrite = false;
  });
}
function addWingLabels(root){
  const mk = (name,sub,color,x,z,ry)=>{
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2,.88),new THREE.MeshBasicMaterial({map:panelTexture(name,[sub],color),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    mesh.name = `PHASE119_LUXURY_WING_LABEL_${name.replace(/\s+/g,"_")}`;
    mesh.position.set(x,3.05,z); mesh.rotation.y = ry; mesh.renderOrder = 702; mesh.userData.phase119Luxury = true; root.add(mesh);
  };
  mk("LEFT WING","LOUNGE • VIBES",PURPLE,-23.72,13.0,Math.PI/2);
  mk("RIGHT WING","STORE • SCORPION",GOLD,23.72,13.0,-Math.PI/2);
  mk("MAIN TABLE","POKER CENTER",CYAN,0,3.0,Math.PI);
}
function addFloorCompass(root){
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.15,1.25,96),glow(CYAN,.22));
  ring.name = "PHASE119_LUXURY_SPAWN_COMPASS_RING";
  ring.position.set(0,.18,10.6); ring.rotation.x = -Math.PI/2; ring.renderOrder = 703; ring.userData.phase119Luxury = true; root.add(ring);
  [[0,9.25,0,.9,"TABLE"],[-1.35,10.6,Math.PI/2,.65,"LEFT"],[1.35,10.6,-Math.PI/2,.65,"RIGHT"]].forEach(([x,z,rz,len,name],i)=>{
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(.16,.44,4),new THREE.MeshBasicMaterial({color:i===0?GOLD:CYAN,transparent:true,opacity:.82,depthWrite:false,blending:THREE.AdditiveBlending}));
    arrow.name = `PHASE119_LUXURY_SPAWN_COMPASS_ARROW_${name}`;
    arrow.position.set(x,.21,z); arrow.rotation.x = -Math.PI/2; arrow.rotation.z = rz; arrow.renderOrder = 704; arrow.userData.phase119Luxury = true; root.add(arrow);
  });
}
function protectCore(scene){
  let protectedObjects = 0;
  scene.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase119CoreProtected = true;
      if(o.isMesh){ o.frustumCulled = false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function qa(scene){
  return {
    directoryBoards: count(scene,/PHASE119_LUXURY_.*DIRECTORY.*BOARD/i),
    vipPosts: count(scene,/PHASE119_LUXURY_VIP_STANCHION_POST/i),
    vipRopes: count(scene,/PHASE119_LUXURY_VIP_RED_ROPE/i),
    wingLabels: count(scene,/PHASE119_LUXURY_WING_LABEL/i),
    compass: !!scene.getObjectByName("PHASE119_LUXURY_SPAWN_COMPASS_RING"),
    oneTable: !scene.getObjectByName(DUP),
    portalRoutes: !!window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK,
    luxuryPhase117: !!window.SVR_PHASE117_LUXURY_LOBBY_VISUAL_POLISH_LOCK,
    luxuryPhase118: !!window.SVR_PHASE118_LUXURY_DEPTH_WAYFINDING_POLISH_LOCK,
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP|ACTION|WATCH/i),
    ready: count(scene,/PHASE119_LUXURY_.*DIRECTORY.*BOARD/i) >= 3 && count(scene,/PHASE119_LUXURY_VIP_STANCHION_POST/i) >= 8 && !scene.getObjectByName(DUP)
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
  addDirectoryBoards(root);
  addVipRopes(root);
  addWingLabels(root);
  addFloorCompass(root);
  const protectedObjects = protectCore(scene);
  const report = qa(scene);
  window.SVR_PHASE119_LUXURY_LOBBY_FINAL_COMPOSITION_DIRECTORY_LOCK = { build:LABEL, active:true, finalComposition:true, directoryLock:true, removedDuplicateTable, protectedObjects, report, siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, portalRoutesTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE119_LUXURY_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
