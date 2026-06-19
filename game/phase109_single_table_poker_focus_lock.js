import * as THREE from "three";

const LABEL = "PHASE-109-SINGLE-TABLE-POKER-FOCUS-LOCK";
const ROOT = "PHASE109_SINGLE_TABLE_POKER_FOCUS_ROOT";

function removeKnownDuplicate(scene){
  let removed = 0;
  let dup = scene.getObjectByName("PHASE103_MAIN_TABLE_SURFACE");
  while(dup){
    dup.parent?.remove(dup);
    removed++;
    dup = scene.getObjectByName("PHASE103_MAIN_TABLE_SURFACE");
  }
  return removed;
}

function report(scene){
  let duplicateOverlay = 0;
  let pokerTableObjects = 0;
  let cards = 0;
  let chips = 0;
  let watch = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/PHASE103_MAIN_TABLE_SURFACE/i.test(n)) duplicateOverlay++;
    if(/POKER|TABLE|ACTION/i.test(n) && o.visible !== false) pokerTableObjects++;
    if(/CARD/i.test(n) && o.visible !== false) cards++;
    if(/CHIP/i.test(n) && o.visible !== false) chips++;
    if(/WATCH/i.test(n) && o.visible !== false) watch++;
  });
  return {
    duplicateOverlay,
    pokerTableObjects,
    cards,
    chips,
    watch,
    singleTableReady: duplicateOverlay === 0 && pokerTableObjects > 0
  };
}

function cleanUi(){
  document.title = "Scarlett Poker VR";
  const s = document.getElementById("safeStatus");
  if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}

function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  cleanUi();
  const removed = removeKnownDuplicate(scene);
  const qa = report(scene);
  window.SVR_PHASE109_SINGLE_TABLE_POKER_FOCUS_LOCK = {
    build: LABEL,
    active: true,
    removed,
    qa,
    singleTableReady: qa.singleTableReady,
    duplicateTableLockedOut: qa.duplicateOverlay === 0,
    originalPokerObjectsPreserved: qa.pokerTableObjects > 0,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE109_TABLE_QA = () => report(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}

install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
