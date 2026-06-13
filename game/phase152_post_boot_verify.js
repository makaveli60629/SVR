const LABEL = "UPDATE-3.0-PHASE-171-CLEAN-INNER-OCTAGON-MOON-MARS-LOCK";
function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 171 clean inner octagon: background buildings hidden, Earth removed/hidden, big textured Moon and Mars locked.";
  window.SVR_PHASE171 = { build: LABEL, purpose: "Clean inner octagon and Moon/Mars sky" };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{ if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}
function hideBootWhenReady(){ const boot = document.getElementById("bootFallback"); if (!boot || !window.__SVR_GAME_READY__) return; boot.style.opacity = "0"; boot.style.pointerEvents = "none"; boot.style.display = "none"; }
function verifyState(){
  const boot = document.getElementById("bootFallback");
  const bootHidden = !boot || boot.style.display === "none" || boot.style.opacity === "0" || getComputedStyle(boot).display === "none";
  window.SVR_PHASE171_VERIFY = {
    label: LABEL,
    gameReady: !!window.__SVR_GAME_READY__,
    cleanInnerOctagon: !!window.__SVR_PHASE171_CLEAN_INNER_OCTAGON_LOCK__,
    cleanupSky: !!window.SVR_PHASE171_CLEAN_LOBBY_SKY,
    backgroundBuildingsHidden: window.SVR_PHASE171_CLEAN_LOBBY_SKY?.hiddenBackgroundObjects ?? "pending",
    earthHidden: window.SVR_PHASE171_CLEAN_LOBBY_SKY?.earthHidden ?? "pending",
    noVisibleBootOverlayAfterReady: !window.__SVR_GAME_READY__ || bootHidden,
    checkedAt: new Date().toISOString()
  };
}
function syncPhase171(){ setBuildLabels(); hideBootWhenReady(); verifyState(); }
syncPhase171();
setTimeout(syncPhase171, 500);
setTimeout(syncPhase171, 1500);
setTimeout(syncPhase171, 3500);
setInterval(syncPhase171, 5000);
