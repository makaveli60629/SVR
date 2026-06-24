import * as THREE from "three";

const LABEL = "PHASE-172-FLOOR-LOGO-FELT-FIT-RAIL-CLEANUP-LOCK";
const ROOT_NAME = "PHASE172_FLOOR_LOGO_FELT_FIT_RAIL_CLEANUP_LOCK";
const FELT_ROOT = "PHASE172_TABLE_FELT_FIT_LOCK";
const FLOOR_LOGO_ROOT = "PHASE172_LOBBY_FLOOR_LOGO_LOCK";
const SAFE_FBX_NAMES = [
  "PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT",
  "PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED"
];
const SURFACE_GROUPS_TO_REMOVE = [
  "PHASE167_FBX_TABLE_FELT_PASSLINE_LOGO_LOCK",
  "PHASE168_TABLE_SURFACE_FELT_LEATHER_HANDREST_LOCK"
];
const EXCLUDE_RE = /PHASE17[012]|PHASE168_PLAYABLE|PHASE168_DEMO|CARD|CHIP|POT|DEALER|BUTTON|FBX|TABLE_FELT|FELT|LOGO|PASS|HAND_REST|LEATHER|MOON|MARS|STAR|HAND|WATCH|TELEPORT|CAMERA|LIGHT/i;
const RAIL_RE = /rope|rail|stanchion|barrier|guard|queue|post|yellow.*line|gold.*rail|velvet/i;
let scene = null;
let installed = false;
let logoPromise = null;
let state = null;

function sceneRoot(s){ return s?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || s; }
function findFbx(root){
  for(const name of SAFE_FBX_NAMES){
    const obj = root?.getObjectByName?.(name);
    if(obj) return obj;
  }
  return null;
}
function tableRecord(root){
  const fbx = findFbx(root);
  if(!fbx) return null;
  fbx.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(fbx);
  if(!Number.isFinite(box.max.y)) return null;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  return { fbx, box, size, center, y:box.max.y + 0.038 };
}
function removeNamed(root, name){
  const old = root?.getObjectByName?.(name);
  if(old) old.parent?.remove(old);
}
function removeOldSurfaces(root){
  let n = 0;
  for(const name of SURFACE_GROUPS_TO_REMOVE){ const old = root?.getObjectByName?.(name); if(old){ old.parent?.remove(old); n++; } }
  return n;
}
function loadImage(url){
  return new Promise(resolve=>{
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = url;
  });
}
async function loadLogo(){
  if(logoPromise) return logoPromise;
  logoPromise = (async()=>{
    for(const url of ["/logo.png","/logo.webp","./assets/ui/logo.png","./ui/logo.png"]){
      const img = await loadImage(url);
      if(img) return { img, url };
    }
    return null;
  })();
  return logoPromise;
}
function makeFeltTexture(logo){
  const c = document.createElement("canvas"); c.width = 2048; c.height = 1024;
  const x = c.getContext("2d");
  const cx = c.width/2, cy = c.height/2, rx = c.width*.492, ry = c.height*.455;
  x.clearRect(0,0,c.width,c.height);
  x.save();
  x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); x.clip();
  const g = x.createRadialGradient(cx,cy,40,cx,cy,rx);
  g.addColorStop(0,"#0f6338"); g.addColorStop(.50,"#073c25"); g.addColorStop(1,"#02140d");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.globalAlpha = .115;
  for(let i=0;i<12000;i++){
    x.fillStyle = Math.random()>.54 ? "#c8ffdc" : "#00150b";
    x.fillRect(Math.random()*c.width, Math.random()*c.height, Math.random()*2.4+.2, 1);
  }
  x.globalAlpha = 1;
  x.strokeStyle = "rgba(255,255,255,.74)"; x.lineWidth = 5;
  x.beginPath(); x.ellipse(cx,cy,rx*.72,ry*.64,0,0,Math.PI*2); x.stroke();
  x.setLineDash([36,18]); x.strokeStyle = "rgba(255,255,255,.42)"; x.lineWidth = 8;
  x.beginPath(); x.ellipse(cx,cy,rx*.79,ry*.70,0,0,Math.PI*2); x.stroke(); x.setLineDash([]);
  x.strokeStyle = "rgba(255,216,122,.95)"; x.lineWidth = 13;
  x.beginPath(); x.ellipse(cx,cy,rx*.89,ry*.805,0,0,Math.PI*2); x.stroke();
  x.fillStyle = "rgba(255,216,122,.96)"; x.font = "900 42px system-ui,Arial"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("PASS LINE",cx,cy-ry*.68); x.fillText("PASS LINE",cx,cy+ry*.68);
  if(logo?.img){
    const s = Math.min(c.width,c.height)*.275;
    x.globalAlpha = .93; x.drawImage(logo.img,cx-s/2,cy-s/2,s,s); x.globalAlpha = 1;
  }else{
    x.fillStyle = "rgba(127,252,255,.94)"; x.font = "900 108px system-ui,Arial"; x.fillText("SVR",cx,cy-18);
    x.fillStyle = "rgba(255,216,122,.94)"; x.font = "900 42px system-ui,Arial"; x.fillText("POKER",cx,cy+70);
  }
  x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t;
}
function makeFloorLogoTexture(logo){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 1024;
  const x = c.getContext("2d"); const cx=512, cy=512;
  x.clearRect(0,0,c.width,c.height);
  const g = x.createRadialGradient(cx,cy,40,cx,cy,505);
  g.addColorStop(0,"rgba(127,252,255,.24)"); g.addColorStop(.58,"rgba(102,33,180,.20)"); g.addColorStop(1,"rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0,0,1024,1024);
  x.strokeStyle = "rgba(127,252,255,.78)"; x.lineWidth = 14; x.beginPath(); x.arc(cx,cy,440,0,Math.PI*2); x.stroke();
  x.strokeStyle = "rgba(255,216,122,.64)"; x.lineWidth = 7; x.beginPath(); x.arc(cx,cy,388,0,Math.PI*2); x.stroke();
  if(logo?.img){ const s=520; x.globalAlpha=.92; x.drawImage(logo.img,cx-s/2,cy-s/2,s,s); x.globalAlpha=1; }
  else { x.fillStyle="#7ffcff"; x.font="900 170px system-ui"; x.textAlign="center"; x.textBaseline="middle"; x.fillText("SVR",cx,cy-35); x.fillStyle="#ffd87a"; x.font="900 72px system-ui"; x.fillText("POKER",cx,cy+92); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t;
}
function ringGeometry(outerX, outerZ, innerX, innerZ){
  const shape = new THREE.Shape();
  shape.absellipse(0,0,outerX/2,outerZ/2,0,Math.PI*2,false,0);
  const hole = new THREE.Path();
  hole.absellipse(0,0,innerX/2,innerZ/2,0,Math.PI*2,true,0);
  shape.holes.push(hole);
  return new THREE.ShapeGeometry(shape, 128);
}
function installFelt(root, rec, logo){
  removeNamed(root, FELT_ROOT);
  const g = new THREE.Group(); g.name = FELT_ROOT; g.position.set(rec.center.x, rec.y, rec.center.z);
  const outerW = Math.max(1.7, Math.min(rec.size.x*.965, 5.15));
  const outerD = Math.max(1.0, Math.min(rec.size.z*.925, 2.95));
  const feltW = outerW*.72;
  const feltD = outerD*.61;
  const leatherMat = new THREE.MeshStandardMaterial({ color:0x2b1510, roughness:.50, metalness:.04, emissive:0x060201, emissiveIntensity:.07, side:THREE.DoubleSide });
  const leather = new THREE.Mesh(ringGeometry(outerW, outerD, feltW*1.015, feltD*1.015), leatherMat);
  leather.name = "PHASE172_DARK_LEATHER_TABLE_EDGE_HAND_REST_NO_YELLOW_RAIL";
  leather.rotation.x = -Math.PI/2; leather.position.y = .020; leather.renderOrder = 1720; g.add(leather);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(outerW/2-.065,.045,12,160), leatherMat);
  lip.name = "PHASE172_ROUNDED_DARK_LEATHER_TABLE_LIP"; lip.rotation.x = Math.PI/2; lip.scale.z = outerD/outerW; lip.position.y=.055; lip.renderOrder=1721; g.add(lip);
  const felt = new THREE.Mesh(new THREE.PlaneGeometry(feltW, feltD), new THREE.MeshBasicMaterial({ map:makeFeltTexture(logo), transparent:true, side:THREE.DoubleSide, depthWrite:false, alphaTest:.03 }));
  felt.name = "PHASE172_CORRECTLY_FITTED_GREEN_FELT_PASSLINE_LOGO"; felt.rotation.x = -Math.PI/2; felt.position.y = .073; felt.renderOrder = 1722; g.add(felt);
  root.add(g);
  return { outerW:+outerW.toFixed(3), outerD:+outerD.toFixed(3), feltW:+feltW.toFixed(3), feltD:+feltD.toFixed(3), y:+(rec.y+.073).toFixed(3) };
}
function installFloorLogo(root, rec, logo){
  removeNamed(root, FLOOR_LOGO_ROOT);
  const g = new THREE.Group(); g.name = FLOOR_LOGO_ROOT;
  const z = rec.center.z + Math.max(3.15, rec.size.z*1.55);
  g.position.set(rec.center.x, .018, z);
  const size = Math.max(2.2, Math.min(4.6, rec.size.x*.92));
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size,size), new THREE.MeshBasicMaterial({ map:makeFloorLogoTexture(logo), transparent:true, side:THREE.DoubleSide, depthWrite:false, alphaTest:.02 }));
  mesh.name = "PHASE172_SVR_LOGO_FITTED_ON_LOBBY_FLOOR"; mesh.rotation.x = -Math.PI/2; mesh.renderOrder = 1600; g.add(mesh);
  root.add(g);
  return { x:+g.position.x.toFixed(3), y:+g.position.y.toFixed(3), z:+g.position.z.toFixed(3), size:+size.toFixed(3) };
}
function materialLooksYellow(obj){
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  return mats.some(m=>{
    const c = m?.color;
    if(!c) return false;
    return c.r > .62 && c.g > .45 && c.b < .24;
  });
}
function distanceToTable(obj, center){
  const p = new THREE.Vector3(); obj.getWorldPosition(p);
  return Math.hypot(p.x-center.x,p.z-center.z);
}
function removeTableRails(root, rec){
  let removed = 0;
  const kill = [];
  const radius = Math.max(2.6, Math.min(5.4, Math.max(rec.size.x, rec.size.z)*1.15));
  root.traverse?.(obj=>{
    if(!obj || obj === root || !obj.parent) return;
    const name = String(obj.name || "");
    if(EXCLUDE_RE.test(name)) return;
    const d = distanceToTable(obj, rec.center);
    if(d > radius) return;
    const namedRail = RAIL_RE.test(name);
    const yellowRail = materialLooksYellow(obj) && /rail|rope|barrier|post|line|guard|stanchion/i.test(name);
    if(namedRail || yellowRail) kill.push(obj);
  });
  [...new Set(kill)].forEach(o=>{ o.parent?.remove(o); removed++; });
  return removed;
}
async function install(){
  scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const root = sceneRoot(scene);
  const rec = tableRecord(root);
  if(!root || !rec) return false;
  const logo = await loadLogo();
  const oldSurfaces = removeOldSurfaces(root);
  const railsRemoved = removeTableRails(root, rec);
  const felt = installFelt(root, rec, logo);
  const floorLogo = installFloorLogo(root, rec, logo);
  state = { build:LABEL, active:true, lobbyFloorLogo:true, floorLogo, feltCorrected:true, felt, yellowRailsAndRopesRemoved:true, railsRemoved, oldSurfacesRemoved:oldSurfaces, logoUrl:logo?.url || "fallback-text", siteTouched:false, checkedAt:new Date().toISOString() };
  window.SVR_PHASE172_FLOOR_LOGO_FELT_RAIL_CLEANUP_LOCK = state;
  window.SVR_RUN_PHASE172_TABLE_FLOOR_AUDIT = () => state;
  window.SVR_LOCKED_FINAL_BUILD = LABEL; window.SVR_LIVE_BUILD_POINTER = LABEL;
  return true;
}

[300,900,1600,2800,5000,8200,12000].forEach(ms=>setTimeout(install,ms));
setInterval(()=>install(),3500);
install();
