import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const LABEL = 'PHASE-155-LOBBY-BARRIER-BALCONY-TABLE-LOCK';
const SAFE = { minX:-18.05, maxX:18.05, minZ:-15.05, maxZ:15.05, eyeMin:1.05, eyeMax:5.35 };
const TABLE_CANDIDATES = [
  '/game/assets/table.glb','/game/assets/poker-table.glb','/game/assets/poker_table.glb',
  '/game/models/table.glb','/game/models/poker-table.glb','/game/models/poker_table.glb',
  '/assets/table.glb','/assets/poker-table.glb','/update/table.glb','/update/poker-table.glb',
  '/game/assets/table.obj','/game/assets/poker-table.obj','/game/models/table.obj','/update/table.obj',
  '/game/assets/table.fbx','/game/assets/poker-table.fbx','/game/models/table.fbx','/update/table.fbx'
];

function mat(color, opacity=1, emissive=0x000000){
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive?0.12:0, roughness:0.72, metalness:0.08, transparent:opacity<1, opacity });
}
function glow(color, opacity=.42){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false }); }
function addBox(root,name,sx,sy,sz,x,y,z,material){
  let old = root.getObjectByName(name); if(old) old.parent?.remove(old);
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  m.name = name; m.position.set(x,y,z); root.add(m); return m;
}
function addCylinder(root,name,r,h,x,y,z,material,scaleZ=1){
  let old = root.getObjectByName(name); if(old) old.parent?.remove(old);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,96), material);
  m.name = name; m.position.set(x,y,z); m.scale.z = scaleZ; root.add(m); return m;
}
function sceneRoot(scene){ return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene; }

function sealBalcony(scene){
  const root = sceneRoot(scene); if(!root) return 0;
  let count = 0;
  const deck = mat(0x171c28,.96,0x03050c);
  const cream = mat(0xf3eee2,.96,0x100b04);
  const glass = new THREE.MeshBasicMaterial({ color:0x9eeeff, transparent:true, opacity:.15, side:THREE.DoubleSide, depthWrite:false });
  addBox(root,'PHASE155_UPSTAIRS_REAR_FLOOR_TO_WALL_SEAL',37.7,.22,1.68,0,3.43,-15.72,deck); count++;
  addBox(root,'PHASE155_UPSTAIRS_WEST_FLOOR_TO_WALL_SEAL',1.06,.22,18.6,-18.70,3.43,-3.0,deck); count++;
  addBox(root,'PHASE155_UPSTAIRS_EAST_FLOOR_TO_WALL_SEAL',1.06,.22,18.6,18.70,3.43,-3.0,deck); count++;
  addBox(root,'PHASE155_REAR_WHITE_RAIL_FOOTER_CONNECTED',36.4,.20,.18,0,3.55,-11.22,cream); count++;
  addBox(root,'PHASE155_REAR_OUTER_WHITE_RAIL_FOOTER_CONNECTED',36.4,.20,.18,0,3.55,-14.84,cream); count++;
  addBox(root,'PHASE155_WEST_WHITE_RAIL_FOOTER_CONNECTED',.18,.20,18.0,-15.58,3.55,-3.0,cream); count++;
  addBox(root,'PHASE155_EAST_WHITE_RAIL_FOOTER_CONNECTED',.18,.20,18.0,15.58,3.55,-3.0,cream); count++;
  addBox(root,'PHASE155_REAR_GLASS_TO_FLOOR_FILLER',35.7,.80,.055,0,3.86,-11.12,glass); count++;
  addBox(root,'PHASE155_WEST_GLASS_TO_FLOOR_FILLER',.055,.80,17.2,-15.50,3.86,-3.0,glass); count++;
  addBox(root,'PHASE155_EAST_GLASS_TO_FLOOR_FILLER',.055,.80,17.2,15.50,3.86,-3.0,glass); count++;
  for(let i=0;i<9;i++){
    const x = -14 + i*3.5;
    addBox(root,`PHASE155_REAR_GLASS_POST_TO_FLOOR_${i+1}`,.13,.95,.13,x,3.88,-11.17,cream); count++;
  }
  [-15.58,15.58].forEach((x,side)=>{ for(let i=0;i<7;i++){ addBox(root,`PHASE155_${side?'EAST':'WEST'}_GLASS_POST_TO_FLOOR_${i+1}`,.13,.90,.13,x,3.86,-10.3+i*2.55,cream); count++; } });
  return count;
}

function installPerimeterVisuals(scene){
  const root = sceneRoot(scene); if(!root) return 0;
  let count = 0;
  const wall = new THREE.MeshBasicMaterial({ color:0xff5b8c, transparent:true, opacity:.035, depthWrite:false, side:THREE.DoubleSide });
  const rail = glow(0xffd98a,.22);
  addBox(root,'PHASE155_INVISIBLE_NORTH_VOID_BLOCKER',36.6,3.2,.42,0,1.6,SAFE.minZ-.05,wall); count++;
  addBox(root,'PHASE155_INVISIBLE_SOUTH_VOID_BLOCKER',36.6,2.2,.42,0,1.1,SAFE.maxZ+.05,wall); count++;
  addBox(root,'PHASE155_INVISIBLE_WEST_VOID_BLOCKER',.42,3.2,30.6,SAFE.minX-.05,1.6,0,wall); count++;
  addBox(root,'PHASE155_INVISIBLE_EAST_VOID_BLOCKER',.42,3.2,30.6,SAFE.maxX+.05,1.6,0,wall); count++;
  addBox(root,'PHASE155_PERIMETER_GOLD_LINE_NORTH',36.0,.045,.08,0,.18,SAFE.minZ+.15,rail); count++;
  addBox(root,'PHASE155_PERIMETER_GOLD_LINE_SOUTH',36.0,.045,.08,0,.18,SAFE.maxZ-.15,rail); count++;
  addBox(root,'PHASE155_PERIMETER_GOLD_LINE_WEST',.08,.045,30.0,SAFE.minX+.15,.18,0,rail); count++;
  addBox(root,'PHASE155_PERIMETER_GOLD_LINE_EAST',.08,.045,30.0,SAFE.maxX-.15,.18,0,rail); count++;
  return count;
}

function clampCamera(){
  const cam = window.__SVR_CAMERA__;
  if(!cam) return false;
  const before = { x:cam.position.x, y:cam.position.y, z:cam.position.z };
  if(!Number.isFinite(cam.position.x) || !Number.isFinite(cam.position.y) || !Number.isFinite(cam.position.z)) cam.position.set(0,1.62,7.2);
  cam.position.x = THREE.MathUtils.clamp(cam.position.x, SAFE.minX, SAFE.maxX);
  cam.position.z = THREE.MathUtils.clamp(cam.position.z, SAFE.minZ, SAFE.maxZ);
  cam.position.y = THREE.MathUtils.clamp(cam.position.y, SAFE.eyeMin, SAFE.eyeMax);
  return Math.abs(before.x-cam.position.x)>.001 || Math.abs(before.y-cam.position.y)>.001 || Math.abs(before.z-cam.position.z)>.001;
}

function suppressOculusOverlay(){
  if(!document.getElementById('phase155-oculus-overlay-off-style')){
    const style = document.createElement('style');
    style.id = 'phase155-oculus-overlay-off-style';
    style.textContent = `
      body.svr-xr-clean-view #safeStage,body.svr-xr-clean-view #bootFallback,body.svr-xr-clean-view #hud,body.svr-xr-clean-view #log,body.svr-xr-clean-view #err,body.svr-xr-clean-view #svrPhaseBadge,body.svr-xr-clean-view .phase-label,body.svr-xr-clean-view [class*="phase-label"],body.svr-xr-clean-view [id*="PhaseBadge"],body.svr-xr-clean-view [id*="phaseBadge"]{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;}
    `;
    document.head.appendChild(style);
  }
  const renderer = window.__SVR_RENDERER__;
  const clean = !!renderer?.xr?.isPresenting;
  document.body.classList.toggle('svr-xr-clean-view', clean);
  if(clean){
    ['safeStage','bootFallback','hud','log','err','svrPhaseBadge'].forEach(id=>{ const el=document.getElementById(id); if(el){ el.style.display='none'; el.style.opacity='0'; el.style.visibility='hidden'; el.style.pointerEvents='none'; } });
  }
  return clean;
}

async function tryLoadTableModel(scene){
  if(window.SVR_PHASE155_TABLE_ASSET?.loading || window.SVR_PHASE155_TABLE_ASSET?.assetLoaded) return window.SVR_PHASE155_TABLE_ASSET;
  window.SVR_PHASE155_TABLE_ASSET = { build:LABEL, loading:true, assetLoaded:false, candidates:TABLE_CANDIDATES, checkedAt:new Date().toISOString() };
  const root = sceneRoot(scene); if(!root) return window.SVR_PHASE155_TABLE_ASSET;
  const old = root.getObjectByName('PHASE155_RESTORED_ASSET_TABLE'); if(old) old.parent?.remove(old);
  for(const url of TABLE_CANDIDATES){
    try{
      const res = await fetch(url, { method:'HEAD', cache:'no-store' });
      if(!res.ok) continue;
      let obj = null;
      if(/\.glb$|\.gltf$/i.test(url)) obj = (await new GLTFLoader().loadAsync(url)).scene;
      else if(/\.obj$/i.test(url)) obj = await new OBJLoader().loadAsync(url);
      else if(/\.fbx$/i.test(url)) obj = await new FBXLoader().loadAsync(url);
      if(!obj) continue;
      obj.name = 'PHASE155_RESTORED_ASSET_TABLE';
      obj.position.set(0,0,0.75);
      obj.scale.setScalar(1.0);
      obj.traverse?.(o=>{ if(o.isMesh){ o.castShadow=false; o.receiveShadow=true; o.frustumCulled=false; } });
      root.add(obj);
      window.SVR_PHASE155_TABLE_ASSET = { build:LABEL, loading:false, assetLoaded:true, url, fallbackEnhanced:false, checkedAt:new Date().toISOString() };
      return window.SVR_PHASE155_TABLE_ASSET;
    }catch(error){ window.SVR_PHASE155_LAST_TABLE_LOAD_ERROR = `${url}: ${error?.message || error}`; }
  }
  installEnhancedFallbackTable(scene);
  window.SVR_PHASE155_TABLE_ASSET = { build:LABEL, loading:false, assetLoaded:false, fallbackEnhanced:true, candidates:TABLE_CANDIDATES, note:'No live FBX/OBJ/GLB table asset found; enhanced table fallback installed until model is added.', checkedAt:new Date().toISOString() };
  return window.SVR_PHASE155_TABLE_ASSET;
}

function installEnhancedFallbackTable(scene){
  const root = sceneRoot(scene); if(!root) return;
  let group = root.getObjectByName('PHASE155_ENHANCED_REAL_TABLE_FALLBACK');
  if(group) group.parent?.remove(group);
  group = new THREE.Group(); group.name = 'PHASE155_ENHANCED_REAL_TABLE_FALLBACK'; group.position.set(0,0,0.75); root.add(group);
  const rail = mat(0x1a1016,1,0x050204);
  const felt = mat(0x062313,1,0x052a18);
  const gold = glow(0xffd98a,.65);
  const leather = mat(0x24151d,1,0x060204);
  const base = addCylinder(group,'PHASE155_TABLE_LEATHER_RAIL',2.62,.28,0,.86,0,rail,.64);
  const cushion = addCylinder(group,'PHASE155_TABLE_PADDED_HAND_REST',2.35,.16,0,1.05,0,leather,.60);
  const top = addCylinder(group,'PHASE155_TABLE_DEEP_GREEN_FELT',2.13,.055,0,1.17,0,felt,.56);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.08,.025,8,140), gold); ring.name='PHASE155_TABLE_GOLD_PASS_LINE'; ring.scale.z=.56; ring.rotation.x=Math.PI/2; ring.position.y=1.205; group.add(ring);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(.46,64), glow(0x7ffcff,.28)); logo.name='PHASE155_TABLE_CENTER_LOGO_PLACEHOLDER'; logo.rotation.x=-Math.PI/2; logo.position.y=1.215; group.add(logo);
  [base,cushion,top].forEach(m=>{ m.receiveShadow=true; });
}

function install(scene=window.__SVR_SCENE__){
  if(!scene) return false;
  const balconyPieces = sealBalcony(scene);
  const blockers = installPerimeterVisuals(scene);
  suppressOculusOverlay();
  tryLoadTableModel(scene);
  let clamps = window.SVR_PHASE155_LOBBY_BARRIER?.cameraClamps || 0;
  if(!window.__SVR_RENDERER__?.xr?.isPresenting && clampCamera()) clamps++;
  window.SVR_PHASE155_LOBBY_BARRIER = { build:LABEL, active:true, balconyFloorTouchesWall:true, glassRailsConnectedToFloor:true, voidPerimeterVisualBlockers:blockers, tightBounds:SAFE, oculusOverlaySuppressed:true, cameraClamps:clamps, tableRestoreAttempted:true, balconyPieces, checkedAt:new Date().toISOString() };
  return true;
}

window.SVR_RUN_PHASE155_LOBBY_BARRIER_FIX = () => install();
[500,1200,2500,5000].forEach(ms=>setTimeout(()=>install(),ms));
setInterval(()=>install(),1500);
