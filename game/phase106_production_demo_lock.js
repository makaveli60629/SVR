import * as THREE from "three";

const LABEL = "PHASE-106-PRODUCTION-DEMO-LOCK";
const ROOT = "PHASE106_PRODUCTION_DEMO_ROOT";

function setCleanTitle(){
  document.title = "Scarlett Poker VR";
  document.body.dataset.playerFacingBuild = "SCARLETT-POKER-VR-PRODUCTION-DEMO";
  const status = document.getElementById("safeStatus");
  if(status) status.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}

function runChecks(scene){
  const has = (name)=>!!scene?.getObjectByName?.(name);
  const checks = {
    cleanLobby: has("PHASE99_CLEAN_EXPANDED_LOBBY_REBUILD_ROOT"),
    mainFloor: has("PHASE99_EXPANDED_SOLID_MAIN_FLOOR"),
    spawn: has("PHASE99_FREE_SPAWN_CLEAR_ZONE"),
    secondFloor: has("PHASE98_SECOND_FLOOR_SAFETY_FLOOR_ROOT"),
    finalFloorQa: has("PHASE101_SECOND_FLOOR_VISIBILITY_FINAL_QA_ROOT"),
    bootAudit: !!window.SVR_PHASE104_BOOT_INTEGRITY_CLEAN_RUNTIME_AUDIT_LOCK,
    singleBoot: !!window.SVR_PHASE105_SINGLE_CLEAN_BOOT_CONSOLIDATION_LOCK
  };
  return { checks, ready: Object.values(checks).every(Boolean), title: document.title };
}

function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  setCleanTitle();
  const report = runChecks(scene);
  window.SVR_PHASE106_PRODUCTION_DEMO_LOCK = {
    build: LABEL,
    active: true,
    demoBaselineLocked: true,
    playerFacingName: "Scarlett Poker VR",
    report,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE106_DEMO_AUDIT = () => runChecks(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}

install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
