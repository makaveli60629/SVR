import * as THREE from "three";

const LABEL = "PHASE-103-RUNTIME-ERROR-CLEANUP-CLEAN-LAUNCH-LOCK";
const ROOT = "PHASE103_RUNTIME_ERROR_CLEANUP_CLEAN_LAUNCH_ROOT";

function install(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  root.visible = false;
  scene.add(root);

  if(document.title !== "Scarlett Poker VR") document.title = "Scarlett Poker VR";
  const safeStatus = document.getElementById("safeStatus");
  if(safeStatus && /PHASE|QA|LOCK/i.test(safeStatus.textContent || "")) safeStatus.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ if(/PHASE|QA|LOCK/i.test(el.textContent || "")) el.textContent = "SCARLETT POKER VR"; });

  let secondFloorVisible = 0;
  let protectedObjects = 0;
  scene.traverse((o)=>{
    const n = String(o.name || "");
    if(/PHASE98_SECOND_FLOOR|SECOND_FLOOR_SAFE_SURFACE|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase103SecondFloorProtected = true;
      if(o.isMesh){ o.frustumCulled = false; secondFloorVisible++; }
    }
    if(/PHASE99|PHASE98_SECOND_FLOOR|PHASE101_SECOND_FLOOR|POKER|TABLE|PORTAL|WATCH|CARD|CHIP|ACTION|TELEPORT|RAY|ARC|TARGET|MOON|MARS/i.test(n)){
      o.userData.phase103CleanLaunchProtected = true;
      protectedObjects++;
    }
  });

  renderer.shadowMap.enabled = false;
  renderer.toneMappingExposure = Math.min(renderer.toneMappingExposure || 1, .96);

  window.SVR_PHASE103_RUNTIME_ERROR_CLEANUP_CLEAN_LAUNCH_LOCK = {
    build: LABEL,
    active: true,
    fixes: ["Phase101 THREE import", "Phase102 THREE import", "player-facing phase text removed", "second-floor visibility protected"],
    cleanLaunch: true,
    secondFloorVisible,
    protectedObjects,
    noVisiblePhaseText: true,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    privateScenesTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 60) clearInterval(timer); }, 250);
[700,1600,3000,6000,10000].forEach((d)=>setTimeout(install,d));
