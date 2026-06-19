import * as THREE from "three";

const LABEL = "PHASE-107-QUEST-LIVE-QA-HARNESS-LOCK";
const ROOT = "PHASE107_QUEST_LIVE_QA_ROOT";

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
function currentPlayerFacing(){
  const safeStatus = document.getElementById("safeStatus")?.textContent || "";
  const phaseTextVisible = /PHASE|QA|LOCK/i.test(safeStatus) || Array.from(document.querySelectorAll(".pill")).some((e)=>/PHASE|QA|LOCK/i.test(e.textContent || ""));
  return {
    title: document.title,
    safeStatus,
    phaseTextVisible,
    ok: document.title === "Scarlett Poker VR" && !phaseTextVisible
  };
}
function teleportReport(){
  return {
    phase98: !!(window.SVR_PHASE98_STABLE_HAND_AIM_RELEASE_TELEPORT_LOCK || window.SVR_PHASE98_HAND_AIM_RELEASE_TELEPORT_LOCK),
    phase298Fallback: !!window.SVR_PHASE298_HAND_TELEPORT_RELEASE_COMMIT_LOCK,
    active: !!(window.SVR_PHASE98_STABLE_HAND_AIM_RELEASE_TELEPORT_LOCK || window.SVR_PHASE98_HAND_AIM_RELEASE_TELEPORT_LOCK || window.SVR_PHASE298_HAND_TELEPORT_RELEASE_COMMIT_LOCK)
  };
}
function runQa(scene, renderer){
  const required = {
    productionDemo: !!window.SVR_PHASE106_PRODUCTION_DEMO_LOCK,
    singleBoot: !!window.SVR_PHASE105_SINGLE_CLEAN_BOOT_CONSOLIDATION_LOCK,
    bootAudit: !!window.SVR_PHASE104_BOOT_INTEGRITY_CLEAN_RUNTIME_AUDIT_LOCK,
    cleanLobby: has(scene,"PHASE99_CLEAN_EXPANDED_LOBBY_REBUILD_ROOT"),
    mainFloor: has(scene,"PHASE99_EXPANDED_SOLID_MAIN_FLOOR"),
    spawn: has(scene,"PHASE99_FREE_SPAWN_CLEAR_ZONE"),
    secondFloor: has(scene,"PHASE98_SECOND_FLOOR_SAFETY_FLOOR_ROOT"),
    finalFloorQa: has(scene,"PHASE101_SECOND_FLOOR_VISIBILITY_FINAL_QA_ROOT")
  };
  const objects = {
    doorways: count(scene,/PHASE99_CORRECT_DOORWAY_/i),
    visibleSecondFloor: visibleCount(scene,/PHASE98_SECOND_FLOOR|SECOND_FLOOR|BALCONY/i),
    portals: count(scene,/PORTAL/i),
    poker: count(scene,/POKER|TABLE|CARD|CHIP|ACTION/i),
    watch: count(scene,/WATCH/i),
    moonMars: count(scene,/MOON|MARS/i)
  };
  const playerFacing = currentPlayerFacing();
  const teleport = teleportReport();
  const bootErrors = [
    ...(window.SVR_PHASE107_BOOT?.errors || []),
    ...(window.SVR_PHASE106_BOOT?.errors || []),
    ...(window.SVR_PHASE105_BOOT?.errors || []),
    ...(window.SVR_PHASE104_BOOT?.errors || [])
  ];
  const rendererReport = {
    xrAvailable: !!renderer?.xr,
    xrPresenting: !!renderer?.xr?.isPresenting,
    shadows: !!renderer?.shadowMap?.enabled,
    pixelRatio: renderer?.getPixelRatio?.() || null
  };
  const ready = Object.values(required).every(Boolean)
    && playerFacing.ok
    && objects.visibleSecondFloor > 0
    && objects.portals > 0
    && objects.poker > 0
    && teleport.active
    && bootErrors.length === 0;
  return { ready, required, objects, playerFacing, teleport, bootErrors, renderer: rendererReport, checkedAt: new Date().toISOString() };
}
function install(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  document.title = "Scarlett Poker VR";
  const report = runQa(scene, renderer);
  window.SVR_PHASE107_QUEST_LIVE_QA_HARNESS_LOCK = {
    build: LABEL,
    active: true,
    hiddenHarness: true,
    report,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE107_QUEST_QA = () => runQa(scene, renderer);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000].forEach((d)=>setTimeout(install,d));
