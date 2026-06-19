import * as THREE from "three";

const LABEL = "PHASE-110-POKER-PLAYABILITY-READINESS-LOCK";
const ROOT = "PHASE110_POKER_PLAYABILITY_READINESS_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";

function cleanTitle(){
  document.title = "Scarlett Poker VR";
  const status = document.getElementById("safeStatus");
  if(status) status.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){
    dup.parent?.remove(dup);
    removed++;
    dup = scene.getObjectByName(DUP);
  }
  return removed;
}

function countVisible(scene, re){
  let count = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(re.test(n) && o.visible !== false) count++;
  });
  return count;
}

function pokerCoreReport(scene){
  const duplicateOverlay = countVisible(scene, /PHASE103_MAIN_TABLE_SURFACE/i);
  const tableObjects = countVisible(scene, /POKER|TABLE|FELT|RAIL/i);
  const cards = countVisible(scene, /CARD/i);
  const chips = countVisible(scene, /CHIP/i);
  const actions = countVisible(scene, /ACTION|BET|CALL|CHECK|FOLD|RAISE|ALLIN|ALL_IN/i);
  const watch = countVisible(scene, /WATCH/i);
  const seats = countVisible(scene, /SEAT|CHAIR/i);
  const portals = countVisible(scene, /PORTAL/i);
  const phaseMarkers = {
    phase86PokerCore: !!window.SVR_PHASE86_PLAYABLE_POKER_CORE_LOCK,
    phase87Watch: !!window.SVR_PHASE87_WATCH_POKER_CONTROLS_LOCK,
    phase88VrInteraction: !!window.SVR_PHASE88_VR_CARD_CHIP_INTERACTION_LOCK,
    phase108DuplicateFix: !!window.SVR_PHASE108_DUPLICATE_TABLE_REMOVAL_LOCK,
    phase109SingleTable: !!window.SVR_PHASE109_SINGLE_TABLE_POKER_FOCUS_LOCK
  };
  return {
    duplicateOverlay,
    tableObjects,
    cards,
    chips,
    actions,
    watch,
    seats,
    portals,
    phaseMarkers,
    singleTableLocked: duplicateOverlay === 0 && tableObjects > 0,
    pokerVisible: tableObjects > 0 && cards > 0 && chips > 0,
    controlsLikelyPresent: actions > 0 || watch > 0,
    ready: duplicateOverlay === 0 && tableObjects > 0 && (cards > 0 || chips > 0) && watch > 0
  };
}

function protectPokerVisible(scene){
  let protectedObjects = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/POKER|TABLE|FELT|RAIL|CARD|CHIP|ACTION|WATCH|SEAT|CHAIR/i.test(n)){
      o.userData.phase110PokerProtected = true;
      if(o.isMesh){
        o.frustumCulled = false;
        protectedObjects++;
      }
    }
  });
  return protectedObjects;
}

function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  root.visible = false;
  scene.add(root);

  cleanTitle();
  const duplicateRemoved = removeDuplicateTable(scene);
  const protectedObjects = protectPokerVisible(scene);
  const report = pokerCoreReport(scene);

  window.SVR_PHASE110_POKER_PLAYABILITY_READINESS_LOCK = {
    build: LABEL,
    active: true,
    hiddenReadinessHarness: true,
    duplicateRemoved,
    protectedObjects,
    report,
    singleTableReady: report.singleTableLocked,
    pokerVisible: report.pokerVisible,
    controlsLikelyPresent: report.controlsLikelyPresent,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE110_POKER_QA = () => pokerCoreReport(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}

install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
