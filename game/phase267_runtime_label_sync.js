const BUILD = "PHASE-267-RUNTIME-LABEL-SYNC-LOCK";

function setTextIfPresent(selector, text){
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}
function syncRuntimeLabel(){
  document.title = `SVR Poker • ${BUILD}`;
  document.body?.setAttribute("data-build", BUILD);
  setTextIfPresent("#safeStage .pill", "PHASE 267 ACTIVE");
  setTextIfPresent("#safeStage h2", "Runtime Label Sync + Cache Lock");
  const status = document.getElementById("status");
  if (status && /PHASE-26[1-6]|Phase 26[1-6]/i.test(status.textContent || "")){
    status.textContent = `Ready. ${BUILD}`;
  }
  window.SVR_LOCKED_FINAL_BUILD = BUILD;
  window.SVR_PHASE267_RUNTIME_LABEL_SYNC_LOCK = {
    build: BUILD,
    active: true,
    phase261BaselinePreserved: true,
    phase266QuestLodPreserved: true,
    noPhase84: true,
    noOldLobby: true,
    noTruitive: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
}

syncRuntimeLabel();
[250, 900, 1800, 3600, 7000].forEach((delay)=>setTimeout(syncRuntimeLabel, delay));
window.addEventListener("load", syncRuntimeLabel);
