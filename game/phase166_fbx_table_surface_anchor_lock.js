import * as THREE from "three";

const LABEL = "PHASE-166-FBX-TABLE-SURFACE-ANCHOR-LOCK";
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

function sceneRoot(scene){
  return scene?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || scene;
}
function findFbxRoot(root){
  return root?.getObjectByName?.("PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT") || root?.getObjectByName?.("PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED") || null;
}
function isInsideFbxAuthority(o){
  let p = o;
  while(p){
    if(SAFE_FBX_NAMES.has(String(p.name || ""))) return true;
    p = p.parent;
  }
  return false;
}
function shouldRemove(o){
  if(!o || isInsideFbxAuthority(o)) return false;
  const name = String(o.name || "");
  return KILL_PREFIXES.some(prefix => name === prefix || name.startsWith(prefix));
}
function purgeFakeTableArea(root){
  const kill = [];
  root?.traverse?.(o => { if(shouldRemove(o)) kill.push(o); });
  const unique = [...new Set(kill)].sort((a,b)=>{
    let da = 0, db = 0, p = a;
    while(p){ da++; p = p.parent; }
    p = b;
    while(p){ db++; p = p.parent; }
    return db - da;
  });
  let removed = 0;
  for(const o of unique){
    if(o.parent && shouldRemove(o)){
      o.parent.remove(o);
      removed++;
    }
  }
  return removed;
}
function worldPointFromLocal(table, x, y, z){
  const v = new THREE.Vector3(x,y,z);
  table.localToWorld(v);
  return { x:+v.x.toFixed(3), y:+v.y.toFixed(3), z:+v.z.toFixed(3) };
}
function buildAnchors(table){
  table.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(table);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const surfaceY = box.max.y + 0.018;
  const width = Math.max(size.x, 0.001);
  const depth = Math.max(size.z, 0.001);
  const cardZ = depth * -0.11;
  const chipZ = depth * 0.23;
  return {
    build: LABEL,
    tableName: table.name,
    bounds: {
      min:{ x:+box.min.x.toFixed(3), y:+box.min.y.toFixed(3), z:+box.min.z.toFixed(3) },
      max:{ x:+box.max.x.toFixed(3), y:+box.max.y.toFixed(3), z:+box.max.z.toFixed(3) },
      size:{ x:+size.x.toFixed(3), y:+size.y.toFixed(3), z:+size.z.toFixed(3) },
      center:{ x:+center.x.toFixed(3), y:+center.y.toFixed(3), z:+center.z.toFixed(3) }
    },
    surfaceY:+surfaceY.toFixed(3),
    invisibleOnly:true,
    visibleGeometryAdded:false,
    communityCards:[
      { x:+(center.x - width*0.24).toFixed(3), y:+surfaceY.toFixed(3), z:+(center.z + cardZ).toFixed(3) },
      { x:+(center.x - width*0.12).toFixed(3), y:+surfaceY.toFixed(3), z:+(center.z + cardZ).toFixed(3) },
      { x:+center.x.toFixed(3), y:+surfaceY.toFixed(3), z:+(center.z + cardZ).toFixed(3) },
      { x:+(center.x + width*0.12).toFixed(3), y:+surfaceY.toFixed(3), z:+(center.z + cardZ).toFixed(3) },
      { x:+(center.x + width*0.24).toFixed(3), y:+surfaceY.toFixed(3), z:+(center.z + cardZ).toFixed(3) }
    ],
    pot:{ x:+center.x.toFixed(3), y:+surfaceY.toFixed(3), z:+(center.z + chipZ).toFixed(3) },
    playerCards:{ x:+center.x.toFixed(3), y:+surfaceY.toFixed(3), z:+(center.z + depth*0.38).toFixed(3) },
    dealerButton:{ x:+(center.x + width*0.32).toFixed(3), y:+surfaceY.toFixed(3), z:+(center.z - depth*0.28).toFixed(3) },
    checkedAt:new Date().toISOString()
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const root = sceneRoot(scene);
  if(!root) return false;
  const removed = purgeFakeTableArea(root);
  const fbx = findFbxRoot(root);
  const anchors = fbx ? buildAnchors(fbx) : null;
  window.SVR_TABLE_ANCHORS = anchors;
  window.SVR_PHASE166_FBX_TABLE_SURFACE_ANCHOR_LOCK = {
    build: LABEL,
    active:true,
    removedThisPass:removed,
    fbxFound:!!fbx,
    anchorsReady:!!anchors,
    fakeTableAllowed:false,
    visibleGeometryAdded:false,
    siteTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_RUN_PHASE166_TABLE_AUDIT = () => ({
    ...window.SVR_PHASE166_FBX_TABLE_SURFACE_ANCHOR_LOCK,
    anchors: window.SVR_TABLE_ANCHORS
  });
  return true;
}

[60,150,300,650,1100,1800,3000,5000,8000,12000].forEach(ms => setTimeout(install, ms));
setInterval(install, 1000);
install();
