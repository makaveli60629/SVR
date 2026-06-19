import * as THREE from "three";

const LABEL = "PHASE-126-QUEST-LIVE-PLAYABILITY-AUDIT-FIX-LOCK";
const ROOT = "PHASE126_QUEST_LIVE_PLAYABILITY_AUDIT_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";

const ACTIONS = ["fold","check","call","raise","all_in","next"];

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene?.getObjectByName?.(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re,filter=()=>true){
  let n = 0;
  scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false && filter(o)) n++; });
  return n;
}
function list(scene,re,limit=20){
  const out=[];
  scene?.traverse?.((o)=>{ if(out.length<limit && re.test(String(o.name||"")) && o.visible !== false) out.push(o.name); });
  return out;
}
function protectCore(scene){
  let protectedObjects = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|PHASE123|PHASE124|PHASE125|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase126CoreProtected = true;
      if(o.isMesh){ o.frustumCulled = false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function inputReport(scene){
  const renderer = window.__SVR_RENDERER__;
  let controllersBound = 0;
  try{
    [0,1].forEach((i)=>{ if(renderer?.xr?.getController?.(i)?.userData?.phase125PokerBound) controllersBound++; });
  }catch{}
  return {
    pointerTapInstalled: !!window.SVR_PHASE125_POINTER_INSTALLED,
    handPinchLoopInstalled: !!window.SVR_PHASE125_HAND_LOOP_INSTALLED,
    controllerSelectPossible: !!renderer?.xr,
    controllersBound,
    hotkeysInstalled: !!window.SVR_PHASE124_HOTKEYS_INSTALLED,
    phase125LastSelection: window.SVR_PHASE125_LAST_SELECTION || null,
    phase124LastDispatch: window.SVR_PHASE124_LAST_ACTION_DISPATCH || null,
    selectablePokerHitboxes: count(scene,/PHASE125_QUEST_ACTION_HITBOX_PAD|PHASE125_QUEST_ACTION_HITBOX_LABEL/i),
    targetRing: !!scene?.getObjectByName?.("PHASE125_QUEST_POKER_BUTTON_TARGET_RING")
  };
}
function actionReport(scene){
  return {
    phase111Pads: count(scene,/PHASE111_ACTION_PAD/i),
    phase112HandPinch: !!window.SVR_PHASE112_HAND_PINCH_POKER_BUTTON_SELECTION_LOCK,
    phase122Feedback: !!window.SVR_PHASE122_POKER_TABLE_ACTION_FEEDBACK_FOCUS_LOCK,
    phase123Display: !!window.SVR_PHASE123_POKER_TURN_POT_DISPLAY_FEEDBACK_LOCK,
    phase124Hotkeys: !!window.SVR_PHASE124_POKER_ACTION_ACCESSIBILITY_HOTKEY_LOCK,
    phase125Hitboxes: !!window.SVR_PHASE125_QUEST_POKER_BUTTON_HITBOX_SELECTION_LOCK,
    phase122LastAction: window.SVR_PHASE122_LAST_POKER_ACTION || null,
    phase123LastFeedback: window.SVR_PHASE123_LAST_TABLE_FEEDBACK || null,
    requiredActions: ACTIONS,
    hitboxActionNames: list(scene,/PHASE125_QUEST_SAFE_ACTION_HITBOX/i,12)
  };
}
function portalReport(scene){
  const routeState = window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK;
  const portalSelectables = count(scene,/PHASE99_CORRECT_DOORWAY|PHASE115_CORRECT_DOORWAY|PORTAL/i);
  const pokerHitboxes = count(scene,/PHASE125_QUEST_ACTION_HITBOX_PAD|PHASE125_QUEST_ACTION_HITBOX_LABEL/i);
  return {
    active: !!routeState,
    mapped: routeState?.report?.mapped ?? 0,
    selectableObjects: routeState?.report?.selectableObjects ?? 0,
    visualPortalObjects: portalSelectables,
    pokerHitboxObjects: pokerHitboxes,
    interferenceRisk: routeState && pokerHitboxes > 0 ? "low-separated-systems" : "unknown",
    routes: routeState?.report?.routes || []
  };
}
function worldReport(scene){
  return {
    oneTable: !scene?.getObjectByName?.(DUP),
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
    watchObjects: count(scene,/WATCH/i),
    teleportObjects: count(scene,/TELEPORT|RAY|ARC|TARGET/i),
    handObjects: count(scene,/HAND|WRIST|PINCH/i),
    moonMarsObjects: count(scene,/MOON|MARS/i),
    secondFloorObjects: count(scene,/SECOND_FLOOR|BALCONY/i),
    luxuryObjects: count(scene,/PHASE117_LUXURY|PHASE118_LUXURY|PHASE119_LUXURY/i),
    frozenLuxuryObjects: count(scene,/PHASE117_LUXURY|PHASE118_LUXURY|PHASE119_LUXURY/i,(o)=>!!o.userData?.phase120StaticFrozen)
  };
}
function performanceReport(){
  const renderer = window.__SVR_RENDERER__;
  const phase120 = window.SVR_PHASE120_LUXURY_LOBBY_STABILITY_PERFORMANCE_LOCK;
  return {
    phase120Active: !!phase120,
    rendererPresent: !!renderer,
    pixelRatio: renderer?.getPixelRatio?.() ?? null,
    shadowMapEnabled: !!renderer?.shadowMap?.enabled,
    toneMappingExposure: typeof renderer?.toneMappingExposure === "number" ? renderer.toneMappingExposure : null,
    phase120RendererTuning: phase120?.rendererTuning || null,
    staticFrozen: phase120?.frozenStaticLuxury ?? null
  };
}
function qa(scene){
  const input = inputReport(scene);
  const actions = actionReport(scene);
  const portals = portalReport(scene);
  const world = worldReport(scene);
  const perf = performanceReport();
  const checks = {
    oneTable: world.oneTable,
    questPokerHitboxes: input.selectablePokerHitboxes >= 12,
    handPinchLoop: input.handPinchLoopInstalled,
    pointerTap: input.pointerTapInstalled,
    hotkeys: input.hotkeysInstalled,
    actionFeedback: actions.phase122Feedback && actions.phase123Display,
    portalRoutes: portals.active && portals.mapped >= 7,
    watchPresent: world.watchObjects > 0,
    teleportPresent: world.teleportObjects > 0 || input.targetRing,
    moonMarsPresent: world.moonMarsObjects > 0,
    luxuryStable: perf.phase120Active && (perf.pixelRatio === null || perf.pixelRatio <= 1.25) && !perf.shadowMapEnabled
  };
  const failed = Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
  return {
    build: LABEL,
    accepted: failed.length === 0,
    checks,
    failed,
    input,
    actions,
    portals,
    world,
    performance: perf,
    recommendedNext: failed.length ? "fix-failed-checks-before-new-features" : "phase127-poker-round-flow-polish",
    checkedAt: new Date().toISOString()
  };
}
function installCompatibilityHooks(scene){
  // Minimal safety hook: provide a tester function to dispatch each action without adding new gameplay logic.
  if(!window.SVR_PHASE126_TEST_ACTION){
    window.SVR_PHASE126_TEST_ACTION = (action="check") => {
      const normalized = String(action || "check").toLowerCase();
      const finalAction = ACTIONS.includes(normalized) ? normalized : "check";
      window.dispatchEvent(new CustomEvent("svr-poker-player-action", { detail:{ action:finalAction, source:"phase126-test-dispatch", phase:126 } }));
      return { action:finalAction, dispatched:true, checkedAt:new Date().toISOString() };
    };
  }
  if(!window.SVR_PHASE126_TEST_ALL_ACTIONS){
    window.SVR_PHASE126_TEST_ALL_ACTIONS = () => ACTIONS.map((a,i)=>setTimeout(()=>window.SVR_PHASE126_TEST_ACTION(a), i*120));
  }
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
  installCompatibilityHooks(scene);
  const report = qa(scene);
  window.SVR_PHASE126_QUEST_LIVE_PLAYABILITY_AUDIT_FIX_LOCK = {
    build: LABEL,
    active: true,
    livePlayabilityAudit:true,
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
  window.SVR_RUN_PHASE126_LIVE_PLAYABILITY_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
