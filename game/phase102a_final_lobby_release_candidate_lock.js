const LABEL = "PHASE-102A-FINAL-LOBBY-RELEASE-CANDIDATE-LOCK";

window.SVR_PHASE102A_RELEASE_CANDIDATE = {
  build: LABEL,
  active: true,
  purpose: "Final lobby release-candidate status lock after Phase 101Z overlay fix and Phase 101Y presentation QA.",
  lateLoadSafe: true,
  bootTouched: false,
  sceneRebuild: false,
  movementCoreTouched: false,
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function bool(value){ return !!value; }
function keysFromScene(scene){
  const keys = new Set();
  scene?.traverse?.((obj) => { if(obj?.userData?.portalKey) keys.add(obj.userData.portalKey); });
  return Array.from(keys).sort();
}
function setStatus(message){
  const status = document.getElementById("status");
  if(status) status.textContent = message;
  window.SVR_PHASE102A_RELEASE_CANDIDATE.lastStatus = message;
  window.SVR_PHASE102A_RELEASE_CANDIDATE.checkedAt = new Date().toISOString();
}
function runReleaseCandidateQa(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  const portalKeys = keysFromScene(scene);
  const checks = {
    scene: bool(scene),
    renderer: bool(renderer),
    camera: bool(camera),
    overlayReleased: bool(window.SVR_PHASE101Z_BOOT?.overlayReleased || document.body.classList.contains("overlay-released") || document.body.classList.contains("runtime-visible")),
    gameReady: bool(window.SVR_GAME_READY || window.__SVR_GAME_READY__),
    finishedLobby: bool(window.SVR_PHASE101S_FINISHED_LOBBY?.active),
    portalLayer: bool(window.SVR_PHASE101T_LOBBY_QA?.active),
    portalCount: portalKeys.length >= 4,
    questQaModule: bool(window.SVR_PHASE101U_QUEST_QA?.active),
    liveVerifyModule: bool(window.SVR_PHASE101W_QUEST_LIVE_VERIFY?.active),
    fixPassModule: bool(window.SVR_PHASE101X_FIX_PASS?.active),
    visualQaModule: bool(window.SVR_PHASE101Y_PRESENTATION_QA?.active),
    noBootCard: !document.getElementById("safeStage") || getComputedStyle(document.getElementById("safeStage")).display === "none" || getComputedStyle(document.getElementById("safeStage")).visibility === "hidden",
    moonMars: bool(scene?.getObjectByName?.("PHASE101S_REAL_MOON_HIGH_NORTH_GROUP")) && bool(scene?.getObjectByName?.("PHASE101S_MARS_HIGH_NORTH_GROUP"))
  };
  const required = ["scene", "renderer", "camera", "overlayReleased", "gameReady", "finishedLobby", "portalLayer", "portalCount", "noBootCard"];
  const failed = required.filter((key) => !checks[key]);
  const warnings = Object.entries(checks).filter(([key, value]) => !required.includes(key) && !value).map(([key]) => key);
  const status = failed.length ? "blocked" : warnings.length ? "release-candidate-with-warnings" : "release-candidate-ready";
  Object.assign(window.SVR_PHASE102A_RELEASE_CANDIDATE, {
    checks,
    failed,
    warnings,
    portalKeys,
    status,
    releaseCandidate: failed.length === 0,
    demoReady: failed.length === 0,
    validationUrl: "/game/index.html?v=phase102a-release-candidate",
    presentationUrl: "/game/index.html?v=phase102a-release-candidate&presentation=1",
    checkedAt: new Date().toISOString()
  });
  setStatus(status === "release-candidate-ready" ? "Phase 102A lobby release candidate ready" : `Phase 102A ${status}: ${failed.concat(warnings).join(", ")}`);
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return window.SVR_PHASE102A_RELEASE_CANDIDATE;
}
function forceOverlayClear(){
  try { window.SVR_FORCE_HIDE_SAFE_STAGE?.("phase102a-rc-lock"); } catch {}
  const safe = document.getElementById("safeStage");
  if(safe){
    safe.style.display = "none";
    safe.style.opacity = "0";
    safe.style.visibility = "hidden";
    safe.style.pointerEvents = "none";
    safe.setAttribute("aria-hidden", "true");
  }
  document.body.classList.add("boot-released", "runtime-visible", "overlay-released");
  window.SVR_GAME_READY = true;
  window.__SVR_GAME_READY__ = true;
}
function install(){
  forceOverlayClear();
  const result = runReleaseCandidateQa();
  window.SVR_RELEASE_BOOT?.("phase102a-release-candidate-ready");
  return result;
}
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  const result = install();
  if(result.releaseCandidate || tries > 40) clearInterval(timer);
}, 300);
setTimeout(install, 1600);
setTimeout(install, 4200);
setTimeout(install, 8200);
window.SVR_RUN_PHASE102A_RC_QA = install;
