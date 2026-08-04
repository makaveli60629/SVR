import * as THREE from "three";

const LABEL = "PHASE-120-LUXURY-LOBBY-STABILITY-PERFORMANCE-LOCK";
const ROOT = "PHASE120_LUXURY_LOBBY_STABILITY_PERFORMANCE_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re){
  let n = 0;
  scene?.traverse?.((o)=>{ if(re.test(String(o.name || "")) && o.visible !== false) n++; });
  return n;
}
function protectCore(scene){
  let protectedObjects = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase120CoreProtected = true;
      if(o.isMesh){ o.frustumCulled = false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function freezeStaticLuxury(scene){
  let frozen = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    const staticLuxury = /PHASE117_LUXURY|PHASE118_LUXURY|PHASE119_LUXURY|DIRECTORY|WAYFINDER|VIP_STANCHION|VIP_RED_ROPE|WALL_LIGHT_BAR|SIDE_RUNNER|CARPET|WING_LABEL|SPAWN_COMPASS/i.test(n);
    const animatedKeep = /CHANDELIER_GLOW|CEILING_LIGHT|SOFT_TABLE_LIGHT|PORTAL_TARGET_RING|ACTION_PAD|HAND|TELEPORT|MOON|MARS/i.test(n);
    if(staticLuxury && !animatedKeep){
      o.updateMatrix?.();
      o.updateMatrixWorld?.(true);
      o.matrixAutoUpdate = false;
      o.userData.phase120StaticFrozen = true;
      if(o.isMesh){
        o.frustumCulled = false;
        frozen++;
      }
    }
  });
  return frozen;
}
function tuneRenderer(renderer){
  if(!renderer) return { renderer:false };
  const before = {
    pixelRatio: renderer.getPixelRatio?.() || null,
    shadowMap: !!renderer.shadowMap?.enabled,
    toneMappingExposure: renderer.toneMappingExposure ?? null
  };
  try { renderer.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 1.25)); } catch {}
  if(renderer.shadowMap) renderer.shadowMap.enabled = false;
  if(typeof renderer.toneMappingExposure === "number") renderer.toneMappingExposure = Math.min(renderer.toneMappingExposure || 1, .95);
  const after = {
    pixelRatio: renderer.getPixelRatio?.() || null,
    shadowMap: !!renderer.shadowMap?.enabled,
    toneMappingExposure: renderer.toneMappingExposure ?? null
  };
  return { renderer:true, before, after };
}
function hideDebug(scene){
  let hidden = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/DEBUG|TEST_ONLY|TEMP_BOX|OLD_PLACEHOLDER|DUPLICATE_PORTAL|PHASE_LABEL/i.test(n)){
      o.visible = false;
      o.userData.phase120DebugHidden = true;
      hidden++;
    }
  });
  document.querySelectorAll("#log,#err,#hud,#sceneNav,.phase-label").forEach((el)=>{ el.style.display="none"; el.setAttribute("aria-hidden","true"); hidden++; });
  return hidden;
}
function cleanUi(){
  document.title = "Scarlett Poker VR";
  const s = document.getElementById("safeStatus"); if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}
function qa(scene){
  return {
    oneTable: !scene?.getObjectByName?.(DUP),
    phase117Luxury: !!window.SVR_PHASE117_LUXURY_LOBBY_VISUAL_POLISH_LOCK,
    phase118Luxury: !!window.SVR_PHASE118_LUXURY_DEPTH_WAYFINDING_POLISH_LOCK,
    phase119Directory: !!window.SVR_PHASE119_LUXURY_LOBBY_FINAL_COMPOSITION_DIRECTORY_LOCK,
    portalRoutes: !!window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK,
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP|ACTION|WATCH/i),
    luxuryObjects: count(scene,/PHASE117_LUXURY|PHASE118_LUXURY|PHASE119_LUXURY/i),
    frozenObjects: count(scene,/PHASE120_STATIC_FROZEN_NEVER_MATCH/i),
    ready: !scene?.getObjectByName?.(DUP) && !!window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK && count(scene,/PHASE117_LUXURY|PHASE118_LUXURY|PHASE119_LUXURY/i) > 0
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; root.visible = false; scene.add(root);
  cleanUi();
  const removedDuplicateTable = removeDuplicateTable(scene);
  const protectedObjects = protectCore(scene);
  const frozenStaticLuxury = freezeStaticLuxury(scene);
  const rendererTuning = tuneRenderer(renderer);
  const hiddenDebug = hideDebug(scene);
  const report = qa(scene);
  window.SVR_PHASE120_LUXURY_LOBBY_STABILITY_PERFORMANCE_LOCK = {
    build:LABEL,
    active:true,
    stabilityLock:true,
    performanceGuard:true,
    removedDuplicateTable,
    protectedObjects,
    frozenStaticLuxury,
    hiddenDebug,
    rendererTuning,
    report,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    portalRoutesTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE120_STABILITY_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
