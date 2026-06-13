const LABEL = "UPDATE-3.0-PHASE-163-REALISTIC-LOBBY-STOREFRONT-ALIGNMENT-LOCK";
function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 163 realistic aligned storefront lock.";
  window.SVR_PHASE163 = { build: LABEL, purpose: "compact realistic storefront ring" };
  document.title = `ScarlettVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{ if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}
function hideBootWhenReady(){ const boot = document.getElementById("bootFallback"); if (!boot || !window.__SVR_GAME_READY__) return; boot.style.opacity = "0"; boot.style.pointerEvents = "none"; boot.style.display = "none"; }
function verifyState(){
  const boot = document.getElementById("bootFallback");
  const bootHidden = !boot || boot.style.display === "none" || boot.style.opacity === "0" || getComputedStyle(boot).display === "none";
  window.SVR_PHASE163_VERIFY = { label: LABEL, gameReady: !!window.__SVR_GAME_READY__, realisticStorefronts: !!window.SVR_PHASE163_REALISTIC_STOREFRONTS, noVisibleBootOverlayAfterReady: !window.__SVR_GAME_READY__ || bootHidden, checkedAt: new Date().toISOString() };
}
function syncPhase163(){ setBuildLabels(); hideBootWhenReady(); verifyState(); }
syncPhase163();
setTimeout(syncPhase163, 500);
setTimeout(syncPhase163, 1500);
setTimeout(syncPhase163, 3500);
setInterval(syncPhase163, 5000);
