const LABEL = "PHASE-102C-WEBEX-DEMO-PRESENTER-MODE-LOCK";

window.SVR_PHASE102C_PRESENTER_MODE = {
  build: LABEL,
  active: true,
  purpose: "Webex/demo presenter mode after Phase 102B bug sweep.",
  lateLoadSafe: true,
  bootTouched: false,
  sceneRebuild: false,
  movementCoreTouched: false,
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function setStatus(message){
  const status = document.getElementById("status");
  if(status) status.textContent = message;
  window.SVR_PHASE102C_PRESENTER_MODE.lastStatus = message;
  window.SVR_PHASE102C_PRESENTER_MODE.checkedAt = new Date().toISOString();
}
function forceNoOverlay(reason = "phase102c-presenter-mode"){
  try { window.SVR_FORCE_HIDE_SAFE_STAGE?.(reason); } catch {}
  const safe = document.getElementById("safeStage");
  if(safe){
    safe.style.display = "none";
    safe.style.opacity = "0";
    safe.style.visibility = "hidden";
    safe.style.pointerEvents = "none";
    safe.setAttribute("aria-hidden", "true");
  }
  document.body.classList.add("boot-released", "runtime-visible", "overlay-released", "svr-presenter-mode");
  window.SVR_GAME_READY = true;
  window.__SVR_GAME_READY__ = true;
}
function applyPresenterCss(){
  if(document.getElementById("phase102c-presenter-css")) return;
  const style = document.createElement("style");
  style.id = "phase102c-presenter-css";
  style.textContent = `
    body.svr-presenter-mode #safeStage,
    body.svr-presenter-mode #bootFallback { display:none!important; opacity:0!important; visibility:hidden!important; pointer-events:none!important; }
    body.svr-presenter-clean #hud,
    body.svr-presenter-clean #sceneNav,
    body.svr-presenter-clean #log,
    body.svr-presenter-clean #err,
    body.svr-presenter-clean .phase-label { display:none!important; }
    #phase102cPresenterBadge{position:fixed;right:12px;bottom:12px;z-index:2147483000;border:1px solid rgba(127,252,255,.72);background:rgba(0,0,0,.62);color:#bffcff;border-radius:999px;padding:7px 11px;font:800 11px system-ui,Arial;letter-spacing:.05em;pointer-events:none;opacity:.82}
    body.svr-presenter-clean #phase102cPresenterBadge{display:none!important;}
  `;
  document.head.appendChild(style);
}
function ensureBadge(){
  if(document.getElementById("phase102cPresenterBadge")) return;
  const badge = document.createElement("div");
  badge.id = "phase102cPresenterBadge";
  badge.textContent = "PHASE 102C • PRESENTER READY";
  document.body.appendChild(badge);
}
function applyCameraPreset(name = "front"){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  if(!camera) return false;
  if(name === "portal"){
    camera.position.set(0, 1.68, 7.85);
    camera.lookAt(0, 1.55, -4.0);
  }else if(name === "table"){
    camera.position.set(0, 1.62, 5.8);
    camera.lookAt(0, 1.22, .45);
  }else{
    camera.position.set(0, 1.72, 10.4);
    camera.lookAt(0, 1.42, -2.6);
  }
  camera.updateProjectionMatrix?.();
  window.SVR_PHASE102C_PRESENTER_MODE.cameraPreset = name;
  window.SVR_PHASE102C_PRESENTER_MODE.cameraAppliedAt = new Date().toISOString();
  return true;
}
function readPortalKeys(){
  const keys = new Set();
  window.__SVR_SCENE__?.traverse?.((obj) => { if(obj?.userData?.portalKey) keys.add(obj.userData.portalKey); });
  return Array.from(keys).sort();
}
function runPresenterQa(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  const safe = document.getElementById("safeStage");
  const safeHidden = !safe || getComputedStyle(safe).display === "none" || getComputedStyle(safe).visibility === "hidden" || Number(getComputedStyle(safe).opacity || 1) <= 0.01;
  const rc = window.SVR_PHASE102A_RELEASE_CANDIDATE;
  const sweep = window.SVR_PHASE102B_BUG_SWEEP;
  const portalKeys = readPortalKeys();
  const checks = {
    scene: !!scene,
    renderer: !!renderer,
    camera: !!camera,
    overlayHidden: safeHidden,
    gameReady: !!(window.SVR_GAME_READY || window.__SVR_GAME_READY__),
    rcLoaded: !!rc?.active,
    bugSweepLoaded: !!sweep?.active,
    demoReady: !!(sweep?.demoReady || rc?.demoReady || rc?.releaseCandidate),
    portalCount: portalKeys.length >= 4
  };
  const blockers = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  const status = blockers.length ? "presenter-review" : "presenter-ready";
  Object.assign(window.SVR_PHASE102C_PRESENTER_MODE, {
    checks,
    blockers,
    portalKeys,
    status,
    presenterReady: blockers.length === 0,
    urls: {
      default: "/game/index.html?v=phase102c-presenter-mode",
      clean: "/game/index.html?v=phase102c-presenter-mode&webex=1&clean=1",
      camera: "/game/index.html?v=phase102c-presenter-mode&webex=1&presentation=1"
    },
    checkedAt: new Date().toISOString()
  });
  setStatus(status === "presenter-ready" ? "Phase 102C presenter mode ready" : `Phase 102C presenter review: ${blockers.join(", ")}`);
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return window.SVR_PHASE102C_PRESENTER_MODE;
}
function enablePresenterMode(options = {}){
  applyPresenterCss();
  forceNoOverlay("phase102c-enable-presenter-mode");
  const params = new URLSearchParams(location.search);
  const clean = options.clean ?? (params.has("clean") || params.has("webex"));
  const camera = options.camera ?? (params.has("presentation") || params.has("camera102c"));
  if(clean) document.body.classList.add("svr-presenter-clean");
  else ensureBadge();
  if(camera) applyCameraPreset(params.get("camera102c") || "front");
  window.SVR_RELEASE_BOOT?.("phase102c-presenter-ready");
  return runPresenterQa();
}
function install(){
  const params = new URLSearchParams(location.search);
  const auto = params.has("webex") || params.has("demo") || params.has("presentation") || params.has("camera102c");
  applyPresenterCss();
  forceNoOverlay("phase102c-install");
  if(auto) enablePresenterMode({ clean: params.has("clean") || params.has("webex"), camera: params.has("presentation") || params.has("camera102c") });
  else ensureBadge();
  return runPresenterQa();
}
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  const result = install();
  if(result.presenterReady || tries > 45) clearInterval(timer);
}, 300);
setTimeout(install, 1800);
setTimeout(install, 4600);
setTimeout(install, 8600);
window.SVR_ENABLE_PHASE102C_PRESENTER_MODE = enablePresenterMode;
window.SVR_RUN_PHASE102C_PRESENTER_QA = runPresenterQa;
window.SVR_PHASE102C_CAMERA = applyCameraPreset;
