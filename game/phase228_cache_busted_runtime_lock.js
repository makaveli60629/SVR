const LABEL = "UPDATE-3.1-H-CACHE-BUSTED-HANDS-FIST-RUNTIME-LOCK";

function stamp(){
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE228 = {
    build: LABEL,
    active: true,
    phase: "3.1-H",
    siteTouched: false,
    cacheBustedMainImports: true,
    handsWrapper: "modules/hands_phase228.js",
    movementWrapper: "modules/movement_phase228.js",
    staleModuleCacheBypassed: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-H",
    cacheBustedRuntime: true,
    handsFistTeleport: true,
    noControllerVisualModel: true,
    checkedAt: new Date().toISOString()
  });
  window.SVR_PHASE106 = Object.assign(window.SVR_PHASE106 || {}, { build: LABEL });
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}

function hideDom(){
  ["svrDiagPanel","svrUpdate31Badge","bootFallback","log","err","status","mode"].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    if(id === "svrDiagPanel" || id === "svrUpdate31Badge") el.remove();
    else { el.style.display="none"; el.style.visibility="hidden"; el.style.opacity="0"; el.style.pointerEvents="none"; }
  });
}

function cleanOldViewObjects(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return;
  const remove=[];
  const bad=/PHASE226_.*CONTROLLER|PHASE226_RIGHT_QUEST_CONTROLLER_VISIBLE_MODEL|PHASE226_LEFT_QUEST_CONTROLLER_VISIBLE_MODEL|CONTROLLER_VISIBLE_MODEL|FACE_OVERLAY|BLACK_OVERLAY|VIEW_OVERLAY|CAMERA_PANEL|SCREEN_OVERLAY|TRANSPARENT_SQUARE|DARK_SQUARE|RETICLE_PANEL|DIAG|DIAGNOSTIC|UPDATE31C_WORLD_DIAGNOSTIC|PHASE204_VISUAL|PHASE204_GUIDANCE|PHASE204_FEEDBACK|PHASE203_ACTION/i;
  scene.traverse(o=>{ if(bad.test(String(o.name||""))) remove.push(o); });
  remove.forEach(o=>{ o.visible=false; o.parent?.remove(o); });
  window.SVR_PHASE228_CLEANUP = { removed:remove.length, checkedAt:new Date().toISOString() };
}

function install(){
  stamp();
  hideDom();
  cleanOldViewObjects();
  return !!window.__SVR_SCENE__;
}

stamp();
hideDom();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>180) clearInterval(timer); },200);
setInterval(()=>{ stamp(); hideDom(); cleanOldViewObjects(); },500);
[500,1200,2500,5000,9000,14000,22000].forEach(ms=>setTimeout(install,ms));
