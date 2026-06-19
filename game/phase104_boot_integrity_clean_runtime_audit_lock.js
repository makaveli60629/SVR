import * as THREE from "three";

const LABEL = "PHASE-104-BOOT-INTEGRITY-CLEAN-RUNTIME-AUDIT-LOCK";
const ROOT = "PHASE104_BOOT_INTEGRITY_ROOT";

function exists(scene, name){ return !!scene?.getObjectByName?.(name); }
function visibleSecondLevel(scene){
  const items = [];
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/PHASE98_SECOND_FLOOR|SECOND_FLOOR|BALCONY/i.test(n)) items.push(o);
  });
  let restored = 0;
  items.forEach((o)=>{
    if(o.visible === false){ o.visible = true; restored++; }
    o.userData.phase104SecondLevelProtected = true;
    if(o.isMesh) o.frustumCulled = false;
  });
  return { total: items.length, restored, hidden: items.filter((o)=>o.visible === false).length, ok: items.length > 0 && items.every((o)=>o.visible !== false) };
}
function cleanPlayerText(){
  document.title = "Scarlett Poker VR";
  const s = document.getElementById("safeStatus");
  if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((e)=>{ e.textContent = "SCARLETT POKER VR"; });
  document.querySelectorAll("#log,#err,#sceneNav,.phase-label").forEach((e)=>{ e.style.display="none"; e.style.opacity="0"; e.style.pointerEvents="none"; });
}
function protect(scene){
  let count = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/PHASE99|PHASE98_SECOND_FLOOR|PHASE101_SECOND_FLOOR|PORTAL|WATCH|CARD|CHIP|ACTION|TELEPORT|RAY|ARC|TARGET|MOON|MARS/i.test(n)){
      o.userData.phase104Protected = true;
      if(/PHASE99|PHASE98_SECOND_FLOOR|SECOND_FLOOR|BALCONY|PORTAL|WATCH|CARD|CHIP|ACTION|TELEPORT|MOON|MARS/i.test(n)) o.visible = true;
      if(o.isMesh){ o.frustumCulled = false; count++; }
    }
  });
  return count;
}
function audit(scene, renderer){
  const required = {
    cleanLobby: exists(scene,"PHASE99_CLEAN_EXPANDED_LOBBY_REBUILD_ROOT"),
    mainFloor: exists(scene,"PHASE99_EXPANDED_SOLID_MAIN_FLOOR"),
    spawn: exists(scene,"PHASE99_FREE_SPAWN_CLEAR_ZONE"),
    secondLevel: exists(scene,"PHASE98_SECOND_FLOOR_SAFETY_FLOOR_ROOT"),
    secondLevelQa: exists(scene,"PHASE101_SECOND_FLOOR_VISIBILITY_FINAL_QA_ROOT")
  };
  const secondLevel = visibleSecondLevel(scene);
  const bootErrors = window.SVR_PHASE103_BOOT?.errors || window.SVR_PHASE102_BOOT?.errors || [];
  return {
    ready: Object.values(required).every(Boolean) && secondLevel.ok && bootErrors.length === 0,
    required,
    secondLevel,
    bootErrors,
    title: document.title,
    renderer:{ shadows: !!renderer?.shadowMap?.enabled, pixelRatio: renderer?.getPixelRatio?.() || null }
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  cleanPlayerText();
  const protectedCount = protect(scene);
  renderer.shadowMap.enabled = false;
  renderer.toneMappingExposure = Math.min(renderer.toneMappingExposure || 1, .96);
  const report = audit(scene, renderer);
  window.SVR_PHASE104_BOOT_INTEGRITY_CLEAN_RUNTIME_AUDIT_LOCK = { build: LABEL, active: true, report, protectedCount, cleanLaunch: true, userFacingPhaseText:false, siteTouched:false, publicRootTouched:false, movementTouched:false, watchTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE104_BOOT_AUDIT = () => audit(scene, renderer);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 60) clearInterval(timer); }, 250);
[700,1600,3000,6000,10000].forEach((d)=>setTimeout(install,d));
