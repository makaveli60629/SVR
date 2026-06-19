import * as THREE from "three";

const LABEL = "PHASE-105-SINGLE-CLEAN-BOOT-CONSOLIDATION-LOCK";
const ROOT = "PHASE105_SINGLE_CLEAN_BOOT_ROOT";

function playerFacingClean(){
  document.title = "Scarlett Poker VR";
  document.body.dataset.playerFacingBuild = "SCARLETT-POKER-VR-CLEAN-LOBBY";
  const s = document.getElementById("safeStatus");
  if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((e)=>{ e.textContent = "SCARLETT POKER VR"; });
  document.querySelectorAll("#log,#err,#sceneNav,.phase-label").forEach((e)=>{ e.style.display="none"; e.style.opacity="0"; e.style.pointerEvents="none"; });
}
function protectSecondFloor(scene){
  let count = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/PHASE98_SECOND_FLOOR|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase105SecondFloorProtected = true;
      if(o.isMesh){ o.frustumCulled = false; count++; }
    }
  });
  return count;
}
function protectCore(scene){
  let count = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/PHASE99|PORTAL|WATCH|CARD|CHIP|ACTION|TELEPORT|RAY|ARC|TARGET|MOON|MARS|POKER|TABLE/i.test(n)){
      o.userData.phase105CoreProtected = true;
      if(o.isMesh){ o.frustumCulled = false; count++; }
    }
  });
  return count;
}
function install(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  playerFacingClean();
  const secondFloor = protectSecondFloor(scene);
  const core = protectCore(scene);
  renderer.shadowMap.enabled = false;
  renderer.toneMappingExposure = Math.min(renderer.toneMappingExposure || 1, .96);
  window.SVR_PHASE105_SINGLE_CLEAN_BOOT_CONSOLIDATION_LOCK = {
    build: LABEL,
    active: true,
    singleCleanBoot: true,
    redundantQaRemovedFromPlayerBoot: true,
    playerFacingPhaseText:false,
    secondFloor,
    core,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 50) clearInterval(timer); }, 250);
[700,1600,3000,6000].forEach((d)=>setTimeout(install,d));
