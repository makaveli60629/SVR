import * as THREE from "three";

const LABEL = "PHASE-114-LOBBY-NO-CROWDING-ALIGNMENT-GUARD";
const ROOT = "PHASE114_LOBBY_NO_CROWDING_ALIGNMENT_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const TABLE_CENTER = new THREE.Vector3(0, 0, -2.7);

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function has(scene, name){ return !!scene?.getObjectByName?.(name); }
function worldPos(o){ const v = new THREE.Vector3(); o?.getWorldPosition?.(v); return v; }
function visibleCount(scene, re){
  let n = 0;
  scene?.traverse?.((o)=>{ if(re.test(String(o.name || "")) && o.visible !== false) n++; });
  return n;
}
function doorwayDistanceReport(scene){
  const names = ["WELLNESS","POKER","PGA","STORE","SCORPION"].map((k)=>`PHASE99_CORRECT_DOORWAY_${k}`);
  const rows = {};
  names.forEach((name)=>{
    const o = scene.getObjectByName(name);
    if(!o){ rows[name] = { exists:false }; return; }
    const p = worldPos(o);
    const flat = new THREE.Vector3(p.x, 0, p.z);
    const d = flat.distanceTo(TABLE_CENTER);
    rows[name] = { exists:true, x:+p.x.toFixed(2), z:+p.z.toFixed(2), distanceFromTable:+d.toFixed(2), clear:d > 6.0 };
  });
  return rows;
}
function qa(scene){
  const doorways = doorwayDistanceReport(scene);
  const allDoorwaysClear = Object.values(doorways).every((d)=>d.exists && d.clear);
  const report = {
    mainFloor: has(scene,"PHASE99_EXPANDED_SOLID_MAIN_FLOOR"),
    spawn: has(scene,"PHASE99_FREE_SPAWN_CLEAR_ZONE"),
    tableBuffer: has(scene,"PHASE113_TABLE_CLEAR_BUFFER_RING_NO_STOREFRONTS_INSIDE"),
    oneTable: !scene.getObjectByName(DUP),
    doorways,
    allDoorwaysClear,
    pillars: visibleCount(scene,/SIDE_PILLAR_CORRECT/i),
    arches: visibleCount(scene,/CORRECT_UPSIDE_DOWN_U_ARCH/i),
    signs: visibleCount(scene,/SIGN_AFFIXED_IN_WALL/i),
    pokerObjects: visibleCount(scene,/POKER|TABLE|CARD|CHIP|ACTION|WATCH/i),
    ready: has(scene,"PHASE99_EXPANDED_SOLID_MAIN_FLOOR") && has(scene,"PHASE99_FREE_SPAWN_CLEAR_ZONE") && has(scene,"PHASE113_TABLE_CLEAR_BUFFER_RING_NO_STOREFRONTS_INSIDE") && !scene.getObjectByName(DUP) && allDoorwaysClear
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
  window.SVR_PHASE114_LOBBY_NO_CROWDING_ALIGNMENT_GUARD = {
    build: LABEL,
    active: true,
    hiddenGuard: true,
    expandedLobbyPreserved: true,
    noCrowdingGuard: true,
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
  window.SVR_RUN_PHASE114_LOBBY_ALIGNMENT_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
