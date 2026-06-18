const LABEL = "PHASE-102-USER-FRIENDLY-FAST-LAUNCH-NO-PHASE-TEXT-LOCK";
const ROOT = "PHASE102_USER_FRIENDLY_FAST_LAUNCH_ROOT";

function hidePhaseText(){
  let changed = 0;
  const selectors = ["#safeStatus", ".pill", ".phase-label", "#hud", "#log", "#err", "#sceneNav"];
  selectors.forEach((sel)=>{
    document.querySelectorAll(sel).forEach((el)=>{
      if(sel === "#safeStatus"){
        el.textContent = "Loading Scarlett Poker VR lobby...";
        changed++;
        return;
      }
      if(sel === ".pill"){
        el.textContent = "SCARLETT POKER VR";
        changed++;
        return;
      }
      if([".phase-label", "#log", "#err", "#sceneNav"].includes(sel)){
        el.style.display = "none";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        changed++;
      }
    });
  });
  document.title = "Scarlett Poker VR";
  document.body.dataset.playerFacingBuild = "SCARLETT-POKER-VR-CLEAN-LOBBY";
  return changed;
}
function enforceNoVisiblePhaseLabels(scene){
  let hidden = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/PHASE\s*\d+|PHASE\d+|QA_PANEL|AUDIT_PANEL|DEBUG|TEMP/i.test(n) && !/PHASE99_CORRECT_DOORWAY|PHASE98_SECOND_FLOOR|PHASE99_EXPANDED|PHASE99_SOLID|PHASE99_FREE_SPAWN|PHASE99_FIRST_TIME|PHASE99_TABLE|PHASE99_CONTINUOUS/.test(n)){
      if(!/POKER|TABLE|CARD|CHIP|WATCH|HAND|TELEPORT|PORTAL|MOON|MARS|PLAYER|BOT/i.test(n)){
        o.visible = false;
        o.userData.phase102PlayerFacingHidden = true;
        hidden++;
      }
    }
  });
  return hidden;
}
function protectFinalLayout(scene){
  let protectedItems = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/PHASE99|PHASE98_SECOND_FLOOR|PHASE101_SECOND_FLOOR|POKER|TABLE|PORTAL|WATCH|CARD|CHIP|ACTION|TELEPORT|RAY|ARC|TARGET|MOON|MARS/i.test(n)){
      o.userData.phase102FinalLayoutProtected = true;
      if(/PHASE98_SECOND_FLOOR|SECOND_FLOOR|BALCONY|PHASE99_EXPANDED|PHASE99_SOLID|PHASE99_CORRECT_DOORWAY/.test(n)) o.visible = true;
      if(o.isMesh){
        o.frustumCulled = false;
        protectedItems++;
      }
    }
  });
  return protectedItems;
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  root.visible = false;
  scene.add(root);
  const uiChanged = hidePhaseText();
  const hiddenLabels = enforceNoVisiblePhaseLabels(scene);
  const protectedItems = protectFinalLayout(scene);
  window.SVR_PHASE102_USER_FRIENDLY_FAST_LAUNCH_LOCK = {
    build: LABEL,
    active: true,
    playerFacingName: "Scarlett Poker VR",
    noPhaseTextOnPlayerOverlay: true,
    quickLoadPreserved: true,
    cleanLobbyProtected: true,
    secondFloorVisibleProtected: true,
    handTeleportProtected: true,
    uiChanged,
    hiddenLabels,
    protectedItems,
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
const timer = setInterval(()=>{ tries++; if(install() || tries > 80) clearInterval(timer); }, 250);
[700,1600,3200,6400,10000].forEach((d)=>setTimeout(install,d));
