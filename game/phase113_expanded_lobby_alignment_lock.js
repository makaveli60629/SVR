import * as THREE from "three";

const LABEL = "PHASE-113-EXPANDED-LOBBY-ORGANIZATION-ALIGNMENT-LOCK";
const ROOT = "PHASE113_EXPANDED_LOBBY_ALIGNMENT_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function has(scene, name){ return !!scene?.getObjectByName?.(name); }
function count(scene, re){
  let n = 0;
  scene?.traverse?.((o)=>{ if(re.test(String(o.name || ""))) n++; });
  return n;
}
function visibleCount(scene, re){
  let n = 0;
  scene?.traverse?.((o)=>{ if(re.test(String(o.name || "")) && o.visible !== false) n++; });
  return n;
}
function objectPos(scene, name){
  const o = scene?.getObjectByName?.(name);
  if(!o) return null;
  return { x:+o.position.x.toFixed(2), y:+o.position.y.toFixed(2), z:+o.position.z.toFixed(2) };
}
function qa(scene){
  const doors = ["WELLNESS","POKER","PGA","STORE","SCORPION"].map((k)=>`PHASE99_CORRECT_DOORWAY_${k}`);
  const requiredDoors = Object.fromEntries(doors.map((d)=>[d, has(scene,d)]));
  const mainFloor = scene.getObjectByName("PHASE99_EXPANDED_SOLID_MAIN_FLOOR");
  const spawn = scene.getObjectByName("PHASE99_FREE_SPAWN_CLEAR_ZONE");
  const tableBuffer = scene.getObjectByName("PHASE113_TABLE_CLEAR_BUFFER_RING_NO_STOREFRONTS_INSIDE");
  const duplicateOverlay = scene.getObjectByName(DUP) ? 1 : 0;
  const report = {
    build: LABEL,
    mainFloor: !!mainFloor,
    mainFloorScaleApprox: mainFloor ? { x:+mainFloor.geometry?.parameters?.width || null, z:+mainFloor.geometry?.parameters?.depth || null } : null,
    spawn: !!spawn,
    spawnPosition: objectPos(scene,"PHASE99_FREE_SPAWN_CLEAR_ZONE"),
    tableBuffer: !!tableBuffer,
    rearWall: has(scene,"PHASE99_SOLID_REAR_WALL"),
    leftWall: has(scene,"PHASE99_SOLID_LEFT_WALL"),
    rightWall: has(scene,"PHASE99_SOLID_RIGHT_WALL"),
    frontWall: has(scene,"PHASE99_SOLID_FRONT_LOW_WALL"),
    requiredDoors,
    doorwayCount: count(scene,/PHASE99_CORRECT_DOORWAY_[A-Z]+$/i),
    pillarCount: visibleCount(scene,/SIDE_PILLAR_CORRECT/i),
    archCount: visibleCount(scene,/CORRECT_UPSIDE_DOWN_U_ARCH/i),
    signCount: visibleCount(scene,/SIGN_AFFIXED_IN_WALL/i),
    pokerObjects: visibleCount(scene,/POKER|TABLE|CARD|CHIP|ACTION|WATCH/i),
    duplicateOverlay,
    oneTableGuard: duplicateOverlay === 0,
    ready: !!mainFloor && !!spawn && !!tableBuffer && duplicateOverlay === 0 && Object.values(requiredDoors).every(Boolean)
  };
  return report;
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
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  cleanUi();
  const removedDuplicateTable = removeDuplicateTable(scene);
  const report = qa(scene);
  window.SVR_PHASE113_EXPANDED_LOBBY_ALIGNMENT_LOCK = {
    build: LABEL,
    active: true,
    expandedLobby: true,
    organizedAlignment: true,
    removedDuplicateTable,
    report,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE113_LOBBY_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
