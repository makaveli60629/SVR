const LABEL = "PHASE-101L-QUEST-LIVE-QA-SMOKE-TEST-LOCK";

window.SVR_PHASE101L_QA = {
  build: LABEL,
  active: true,
  purpose: "Live QA smoke test for Quest/WebXR, HUD, performance, locomotion, and Phase 260 visibility.",
  siteTouched: false,
  checkedAt: new Date().toISOString(),
  checks: {}
};

function exists(path){
  try{
    return path.split(".").reduce((obj, key) => obj?.[key], window) !== undefined;
  }catch{
    return false;
  }
}

function bool(name, value, note = ""){
  window.SVR_PHASE101L_QA.checks[name] = {
    pass: !!value,
    note,
    checkedAt: new Date().toISOString()
  };
  return !!value;
}

function getScene(){ return window.__SVR_SCENE__ || null; }
function getRenderer(){ return window.__SVR_RENDERER__ || null; }
function getCamera(){ return window.__SVR_CAMERA__ || null; }

function checkCore(){
  const scene = getScene();
  const renderer = getRenderer();
  const camera = getCamera();
  bool("core.scene", !!scene, "window.__SVR_SCENE__ available");
  bool("core.renderer", !!renderer, "window.__SVR_RENDERER__ available");
  bool("core.camera", !!camera, "window.__SVR_CAMERA__ available");
  bool("core.xr", !!renderer?.xr, "renderer.xr available");
}

function checkPhaseStack(){
  bool("phase260.active", !!window.SVR_PHASE260?.active, "Phase 260 active flag");
  bool("phase260.geometry", !!window.SVR_PHASE260_GEOMETRY, "Phase 260 geometry object present");
  bool("phase101g.hudCleanup", !!window.SVR_PHASE101G_HUD_CLEANUP?.active, "HUD cleanup active");
  bool("phase101h.sceneCleanup", !!window.SVR_PHASE101H_SCENE_CLEANUP?.active, "Scene cleanup active");
  bool("phase101i.cameraPath", !!window.SVR_PHASE101I_CAMERA_PATH?.active, "Camera/path polish active");
  bool("phase101k.performance", !!window.SVR_PHASE101K_PERFORMANCE?.active, "Quest performance cleanup active");
  bool("phase101j.locomotion", !!window.SVR_PHASE101J_LOCOMOTION?.active || exists("SVR_PHASE101J_SMOKE"), "Forward-lock locomotion active or ready");
}

function checkSceneObjects(){
  const scene = getScene();
  if(!scene){
    bool("scene.phase260Root", false, "No scene yet");
    return;
  }
  const phase260Root = !!scene.getObjectByName("PHASE260_ROMAN_CANOPY_ARCHWAY_FINAL_ROOT");
  const stale257 = !!scene.getObjectByName("PHASE257_ROMAN_CANOPY_ROOT");
  const stale258 = !!scene.getObjectByName("PHASE258_ROMAN_CANOPY_SMOOTH_ROOT");
  const stale259 = !!scene.getObjectByName("PHASE259_ROMAN_CANOPY_COLONNADE_POLISH_ROOT");
  bool("scene.phase260Root", phase260Root, "Phase 260 canopy root visible/present");
  bool("scene.noPhase257Root", !stale257, "Old Phase 257 root removed");
  bool("scene.noPhase258Root", !stale258, "Old Phase 258 root removed");
  bool("scene.noPhase259Root", !stale259, "Old Phase 259 root removed");
}

function checkHud(){
  const cleanHud = document.body.classList.contains("svr-clean-hud");
  const sceneNav = document.getElementById("sceneNav");
  const phase = document.getElementById("svr-phase-label");
  const logBtn = document.getElementById("toggleLog");
  const navHidden = !sceneNav || getComputedStyle(sceneNav).display === "none" || sceneNav.getAttribute("aria-hidden") === "true";
  const phaseHidden = !phase || getComputedStyle(phase).display === "none" || phase.getAttribute("aria-hidden") === "true";
  const logHidden = !logBtn || getComputedStyle(logBtn).display === "none" || logBtn.getAttribute("aria-hidden") === "true";
  bool("hud.cleanClass", cleanHud, "svr-clean-hud body class active");
  bool("hud.navHidden", navHidden, "Bottom scene nav hidden in clean mode");
  bool("hud.phaseHidden", phaseHidden, "Top-right phase badge hidden in clean mode");
  bool("hud.debugHidden", logHidden, "Log/Joints debug controls hidden in clean mode");
}

function checkPerformance(){
  const perf = window.SVR_PHASE101K_PERFORMANCE;
  bool("perf.object", !!perf, "Performance smoke object present");
  if(perf){
    bool("perf.renderer", !!perf.renderer || !perf.flags?.quest, "Renderer pressure settings recorded for Quest/XR");
    bool("perf.scene", !!perf.scene || !perf.flags?.quest, "Scene pressure summary recorded for Quest/XR");
    bool("perf.frames", !!perf.frames, "Frame probe running");
  }
}

function checkLocomotion(){
  const smoke = window.SVR_PHASE101J_SMOKE;
  const loco = window.SVR_PHASE101J_LOCOMOTION;
  bool("locomotion.object", !!loco || !!smoke, "Locomotion smoke object exists after runtime update");
  if(loco) bool("locomotion.forwardLock", !!loco.teleportRayForwardLock, "Teleport ray forward lock flag");
  if(smoke){
    bool("locomotion.rayForwardLock", !!smoke.rayForwardLock, "Runtime ray-forward lock active");
    bool("locomotion.headForwardMove", !!smoke.headForwardMove, "Head/camera-forward movement active");
  }
}

function summarize(){
  const checks = window.SVR_PHASE101L_QA.checks;
  const entries = Object.entries(checks);
  const passed = entries.filter(([, v]) => v.pass).length;
  const failed = entries.filter(([, v]) => !v.pass).map(([k]) => k);
  const total = entries.length;
  window.SVR_PHASE101L_QA.summary = {
    total,
    passed,
    failed,
    status: failed.length ? "needs-review" : "ready-for-quest-live-test",
    checkedAt: new Date().toISOString()
  };
  return window.SVR_PHASE101L_QA.summary;
}

function runQa(){
  checkCore();
  checkPhaseStack();
  checkSceneObjects();
  checkHud();
  checkPerformance();
  checkLocomotion();
  summarize();
  window.SVR_PHASE101L_QA.checkedAt = new Date().toISOString();
}

runQa();
setTimeout(runQa, 500);
setTimeout(runQa, 1400);
setTimeout(runQa, 3200);
setTimeout(runQa, 6500);
setTimeout(runQa, 11000);

window.SVR_RUN_PHASE101L_QA = runQa;
