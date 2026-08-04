import * as THREE from "three";

const LABEL = "PHASE-108-DUPLICATE-TABLE-REMOVAL-LOCK";
const ROOT = "PHASE108_DUPLICATE_TABLE_REMOVAL_ROOT";

function removePhase103Duplicate(scene){
  let removed = 0;
  let old = scene.getObjectByName("PHASE103_MAIN_TABLE_SURFACE");
  while(old){
    old.parent?.remove(old);
    removed++;
    old = scene.getObjectByName("PHASE103_MAIN_TABLE_SURFACE");
  }
  return removed;
}
function tableReport(scene){
  let phase103Duplicate = 0;
  let pokerObjects = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/PHASE103_MAIN_TABLE_SURFACE/i.test(n)) phase103Duplicate++;
    if(/POKER|TABLE|CARD|CHIP|ACTION/i.test(n) && o.visible !== false) pokerObjects++;
  });
  return { phase103Duplicate, pokerObjects, ok: phase103Duplicate === 0 && pokerObjects > 0 };
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  const removed = removePhase103Duplicate(scene);
  const report = tableReport(scene);
  window.SVR_PHASE108_DUPLICATE_TABLE_REMOVAL_LOCK = {
    build: LABEL,
    active: true,
    duplicateTableRemoved: true,
    removed,
    report,
    originalPokerTablePreserved: report.pokerObjects > 0,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE108_TABLE_QA = () => tableReport(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
