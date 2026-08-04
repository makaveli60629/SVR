import * as THREE from "three";

const LABEL = "PHASE-164-FBX-TABLE-FINAL-ALIGNMENT-SEAT-ANCHOR-LOCK";
const SAFE_FBX_NAMES = new Set([
  "PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT",
  "PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED"
]);
const KILL_PREFIXES = [
  "PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED",
  "PHASE200_TABLE_",
  "PHASE200_CLEAN_CHAIR_",
  "PHASE159_SEAT_GUIDE_ROOT",
  "PHASE159_OPEN_PLAYER_STOOL",
  "PHASE159_BOT_STOOL_",
  "PHASE155_ENHANCED_REAL_TABLE_FALLBACK",
  "PHASE155_RESTORED_ASSET_TABLE",
  "PHASE155_TABLE_",
  "PHASE156_TABLE2_",
  "PHASE157_STABLE_",
  "PHASE158_ACTUAL_FBX_TABLE_SCALE_ROOT",
  "PHASE142_PLAYABLE_POKER_CORE_ROOT"
];
const FLOOR_Y = 0.02;

function sceneRoot(scene){
  return scene?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || scene;
}
function isInsideFbxAuthority(o){
  let p=o;
  while(p){
    if(SAFE_FBX_NAMES.has(String(p.name||""))) return true;
    p=p.parent;
  }
  return false;
}
function shouldRemove(o){
  if(!o || isInsideFbxAuthority(o)) return false;
  const name=String(o.name||"");
  return KILL_PREFIXES.some(prefix=>name===prefix || name.startsWith(prefix));
}
function removeFakeTableArea(scene){
  const root=sceneRoot(scene);
  if(!root) return 0;
  const kill=[];
  root.traverse?.(o=>{ if(shouldRemove(o)) kill.push(o); });
  const unique=[...new Set(kill)];
  unique.sort((a,b)=>{
    let da=0, db=0, p=a; while(p){da++; p=p.parent;} p=b; while(p){db++; p=p.parent;} return da-db;
  });
  let removed=0;
  unique.forEach(o=>{
    if(o.parent && shouldRemove(o)){
      o.parent.remove(o);
      removed++;
    }
  });
  return removed;
}
function floorFbxTable(scene){
  const root=sceneRoot(scene);
  if(!root) return null;
  const fbxRoot=root.getObjectByName("PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT") || root.getObjectByName("PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED");
  if(!fbxRoot) return null;
  fbxRoot.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(fbxRoot);
  if(!Number.isFinite(box.min.y)) return null;
  const delta=FLOOR_Y-box.min.y;
  if(Math.abs(delta)>0.002){
    fbxRoot.position.y += delta;
    fbxRoot.updateMatrixWorld(true);
  }
  const after=new THREE.Box3().setFromObject(fbxRoot);
  const size=new THREE.Vector3(); after.getSize(size);
  return {
    name:fbxRoot.name,
    floorY:+after.min.y.toFixed(4),
    positionY:+fbxRoot.position.y.toFixed(4),
    size:{x:+size.x.toFixed(3),y:+size.y.toFixed(3),z:+size.z.toFixed(3)}
  };
}
function install(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  const removed=removeFakeTableArea(scene);
  const fbx=floorFbxTable(scene);
  window.SVR_PHASE164_FBX_TABLE_FINAL_ALIGNMENT_SEAT_ANCHOR_LOCK={
    build:LABEL,
    active:true,
    removedThisPass:removed,
    fbx,
    visibleGeometryTableAllowed:false,
    visibleChairOrStoolRingAllowed:false,
    invisibleSeatAnchorsOnly:true,
    siteTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE164_TABLE_AUDIT=()=>window.SVR_PHASE164_FBX_TABLE_FINAL_ALIGNMENT_SEAT_ANCHOR_LOCK;
  return true;
}

[80,180,350,700,1200,2200,4200,7000,10000].forEach(ms=>setTimeout(install,ms));
setInterval(install,900);
install();

