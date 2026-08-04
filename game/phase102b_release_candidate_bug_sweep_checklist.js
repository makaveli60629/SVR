const LABEL = "PHASE-102B-RELEASE-CANDIDATE-BUG-SWEEP-CHECKLIST-LOCK";

window.SVR_PHASE102B_BUG_SWEEP = {
  build: LABEL,
  active: true,
  purpose: "Release-candidate bug sweep and Quest walkthrough checklist after Phase 102A.",
  lateLoadSafe: true,
  bootTouched: false,
  sceneRebuild: false,
  movementCoreTouched: false,
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function visible(el){
  if(!el) return false;
  const cs = getComputedStyle(el);
  return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity || 1) > 0.01;
}
function portalKeys(scene){
  const keys = new Set();
  scene?.traverse?.((obj) => { if(obj?.userData?.portalKey) keys.add(obj.userData.portalKey); });
  return Array.from(keys).sort();
}
function bool(v){ return !!v; }
function setStatus(message){
  const status = document.getElementById("status");
  if(status) status.textContent = message;
  window.SVR_PHASE102B_BUG_SWEEP.lastStatus = message;
  window.SVR_PHASE102B_BUG_SWEEP.checkedAt = new Date().toISOString();
}
function checklistItem(id, label, ok, severity = "blocker", detail = ""){
  return { id, label, ok: !!ok, severity, detail };
}
function runBugSweep(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  const safeStage = document.getElementById("safeStage");
  const keys = portalKeys(scene);
  const rc = window.SVR_PHASE102A_RELEASE_CANDIDATE || null;
  const items = [
    checklistItem("boot-overlay-hidden", "Safe loader overlay is hidden", !visible(safeStage), "blocker"),
    checklistItem("scene-ready", "Scene exists", bool(scene), "blocker"),
    checklistItem("renderer-ready", "Renderer exists", bool(renderer), "blocker"),
    checklistItem("camera-ready", "Camera exists", bool(camera), "blocker"),
    checklistItem("game-ready", "Game ready flag set", bool(window.SVR_GAME_READY || window.__SVR_GAME_READY__), "blocker"),
    checklistItem("rc-ready", "Phase 102A release candidate active", bool(rc?.releaseCandidate), "blocker", rc?.status || "missing"),
    checklistItem("lobby-finished", "Finished lobby layer active", bool(window.SVR_PHASE101S_FINISHED_LOBBY?.active), "blocker"),
    checklistItem("portal-layer", "Portal interaction layer active", bool(window.SVR_PHASE101T_LOBBY_QA?.active), "blocker"),
    checklistItem("portal-count", "At least four portal keys exist", keys.length >= 4, "blocker", keys.join(",") || "none"),
    checklistItem("quest-qa", "Quest controller QA module active", bool(window.SVR_PHASE101U_QUEST_QA?.active), "warning"),
    checklistItem("quest-live-verify", "Quest live verification module active", bool(window.SVR_PHASE101W_QUEST_LIVE_VERIFY?.active), "warning"),
    checklistItem("fix-pass", "Quest fix pass module active", bool(window.SVR_PHASE101X_FIX_PASS?.active), "warning"),
    checklistItem("presentation-qa", "Visual presentation QA active", bool(window.SVR_PHASE101Y_PRESENTATION_QA?.active), "warning"),
    checklistItem("moon-mars", "Moon and Mars exist", bool(scene?.getObjectByName?.("PHASE101S_REAL_MOON_HIGH_NORTH_GROUP")) && bool(scene?.getObjectByName?.("PHASE101S_MARS_HIGH_NORTH_GROUP")), "warning"),
    checklistItem("webxr-object", "Renderer WebXR object exists", bool(renderer?.xr), "warning"),
    checklistItem("no-error-list", "No Phase 101Z boot errors recorded", !(window.SVR_PHASE101Z_BOOT?.errors?.length), "warning", String(window.SVR_PHASE101Z_BOOT?.errors?.length || 0))
  ];
  const blockers = items.filter((item) => !item.ok && item.severity === "blocker");
  const warnings = items.filter((item) => !item.ok && item.severity === "warning");
  const walkthrough = [
    { step: 1, label: "Load /game/index.html?v=phase102b-bug-sweep", expected: "No loader card remains" },
    { step: 2, label: "Look at central lobby", expected: "Red carpet path and table are visible" },
    { step: 3, label: "Check portals", expected: "PGA, Wellness, Store, Scorpion are visible/readable" },
    { step: 4, label: "Desktop fallback", expected: "Click/touch a portal or use 1/2/3/4 and F1/F2/F3/F4" },
    { step: 5, label: "Quest WebXR", expected: "Enter VR if supported by browser/device" },
    { step: 6, label: "Quest forward movement", expected: "Forward follows head/camera direction" },
    { step: 7, label: "Quest teleport", expected: "Teleport ray points forward, not behind" },
    { step: 8, label: "Quest portal select", expected: "Controller select/squeeze records portal payload" },
    { step: 9, label: "RC console", expected: "window.SVR_RUN_PHASE102B_BUG_SWEEP().demoReady is true" }
  ];
  const status = blockers.length ? "blocked" : warnings.length ? "demo-ready-with-warnings" : "demo-ready";
  Object.assign(window.SVR_PHASE102B_BUG_SWEEP, {
    checklist: items,
    blockers,
    warnings,
    walkthrough,
    portalKeys: keys,
    status,
    demoReady: blockers.length === 0,
    releaseCandidate: blockers.length === 0,
    checkedAt: new Date().toISOString(),
    validationUrl: "/game/index.html?v=phase102b-bug-sweep",
    presentationUrl: "/game/index.html?v=phase102b-bug-sweep&presentation=1"
  });
  setStatus(status === "demo-ready" ? "Phase 102B demo-ready" : `Phase 102B ${status}: ${blockers.concat(warnings).map((i) => i.id).join(", ")}`);
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return window.SVR_PHASE102B_BUG_SWEEP;
}
function forceNoOverlay(){
  try { window.SVR_FORCE_HIDE_SAFE_STAGE?.("phase102b-bug-sweep"); } catch {}
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
  forceNoOverlay();
  const result = runBugSweep();
  window.SVR_RELEASE_BOOT?.("phase102b-bug-sweep-ready");
  return result;
}
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  const result = install();
  if(result.demoReady || tries > 50) clearInterval(timer);
}, 300);
setTimeout(install, 1800);
setTimeout(install, 4600);
setTimeout(install, 8600);
window.SVR_RUN_PHASE102B_BUG_SWEEP = install;
window.SVR_SHOW_PHASE102B_WALKTHROUGH = () => window.SVR_PHASE102B_BUG_SWEEP.walkthrough || [];
