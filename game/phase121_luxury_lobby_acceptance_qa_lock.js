import * as THREE from "three";

const LABEL = "PHASE-121-LUXURY-LOBBY-ACCEPTANCE-QA-LOCK";
const ROOT = "PHASE121_LUXURY_LOBBY_ACCEPTANCE_QA_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re,filter=()=>true){
  let n = 0;
  scene?.traverse?.((o)=>{ if(re.test(String(o.name || "")) && o.visible !== false && filter(o)) n++; });
  return n;
}
function exists(scene,name){ return !!scene?.getObjectByName?.(name); }
function frozenCount(scene){
  let n = 0;
  scene?.traverse?.((o)=>{ if(o.userData?.phase120StaticFrozen) n++; });
  return n;
}
function protectCore(scene){
  let protectedObjects = 0;
  scene?.traverse?.((o)=>{
    const name = String(o.name || "");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(name)){
      o.visible = true;
      o.userData.phase121CoreProtected = true;
      if(o.isMesh){ o.frustumCulled = false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function luxuryLayerReport(scene){
  return {
    phase117: {
      active: !!window.SVR_PHASE117_LUXURY_LOBBY_VISUAL_POLISH_LOCK,
      carpet: exists(scene,"PHASE117_LUXURY_CENTER_RED_CARPET_MAIN_RUNNER"),
      wallPanels: count(scene,/PHASE117_LUXURY_DARK_MARBLE_WALL_PANEL/i),
      chandelier: exists(scene,"PHASE117_LUXURY_TABLE_CHANDELIER_GLOW")
    },
    phase118: {
      active: !!window.SVR_PHASE118_LUXURY_DEPTH_WAYFINDING_POLISH_LOCK,
      ceiling: exists(scene,"PHASE118_LUXURY_COFFEE_BLACK_CEILING_PANEL"),
      wayfinders: count(scene,/PHASE118_LUXURY_WAYFINDER_[A-Z]/i),
      wallBars: count(scene,/PHASE118_LUXURY_.*WALL_LIGHT_BAR/i)
    },
    phase119: {
      active: !!window.SVR_PHASE119_LUXURY_LOBBY_FINAL_COMPOSITION_DIRECTORY_LOCK,
      directoryBoards: count(scene,/PHASE119_LUXURY_.*DIRECTORY.*BOARD/i),
      vipPosts: count(scene,/PHASE119_LUXURY_VIP_STANCHION_POST/i),
      vipRopes: count(scene,/PHASE119_LUXURY_VIP_RED_ROPE/i),
      wingLabels: count(scene,/PHASE119_LUXURY_WING_LABEL/i),
      compass: exists(scene,"PHASE119_LUXURY_SPAWN_COMPASS_RING")
    },
    phase120: {
      active: !!window.SVR_PHASE120_LUXURY_LOBBY_STABILITY_PERFORMANCE_LOCK,
      staticFrozen: frozenCount(scene),
      rendererTuning: window.SVR_PHASE120_LUXURY_LOBBY_STABILITY_PERFORMANCE_LOCK?.rendererTuning || null
    }
  };
}
function routeReport(scene){
  const routeState = window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK;
  return {
    active: !!routeState,
    marked: routeState?.marked ?? 0,
    routes: routeState?.report?.routes || [],
    selectableObjects: routeState?.report?.selectableObjects ?? count(scene,/SIGN_AFFIXED_IN_WALL|SOLID_PORTAL_THRESHOLD_FLOOR|CORRECT_DOORWAY/i),
    ready: !!routeState && (routeState?.report?.mapped ?? 0) >= 7
  };
}
function pokerReport(scene){
  return {
    oneTable: !scene?.getObjectByName?.(DUP),
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
    actionObjects: count(scene,/ACTION|PHASE111_ACTION_PAD|PHASE112/i),
    watchObjects: count(scene,/WATCH/i),
    handTeleportObjects: count(scene,/HAND|TELEPORT|RAY|ARC|TARGET/i),
    moonMarsObjects: count(scene,/MOON|MARS/i),
    secondFloorObjects: count(scene,/SECOND_FLOOR|BALCONY/i)
  };
}
function acceptance(scene){
  const luxury = luxuryLayerReport(scene);
  const routes = routeReport(scene);
  const poker = pokerReport(scene);
  const checks = {
    oneTable: poker.oneTable,
    luxuryCarpet: luxury.phase117.carpet,
    luxuryChandelier: luxury.phase117.chandelier,
    ceiling: luxury.phase118.ceiling,
    wayfinders: luxury.phase118.wayfinders >= 7,
    directory: luxury.phase119.directoryBoards >= 3,
    vip: luxury.phase119.vipPosts >= 8 && luxury.phase119.vipRopes >= 6,
    routes: routes.ready,
    pokerPresent: poker.pokerObjects > 0 && poker.actionObjects > 0,
    watchPresent: poker.watchObjects > 0,
    staticFrozen: luxury.phase120.staticFrozen > 0
  };
  const failed = Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
  return {
    build: LABEL,
    checks,
    failed,
    luxury,
    routes,
    poker,
    accepted: failed.length === 0,
    checkedAt: new Date().toISOString()
  };
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
  const protectedObjects = protectCore(scene);
  const report = acceptance(scene);
  window.SVR_PHASE121_LUXURY_LOBBY_ACCEPTANCE_QA_LOCK = {
    build: LABEL,
    active: true,
    acceptanceLock: true,
    removedDuplicateTable,
    protectedObjects,
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
  window.SVR_RUN_PHASE121_ACCEPTANCE_QA = () => acceptance(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); }, 300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
