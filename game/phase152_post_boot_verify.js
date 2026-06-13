const LABEL = "UPDATE-3.0-PHASE-159-VIBEZ-GEOMETRY-STOREFRONT-LOCK";

function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 159 VIBEZ geometry storefront lock. Post-boot verification preserved without adding any visible overlay.";
  window.SVR_PHASE159 = {
    build: LABEL,
    purpose: "verify VIBEZ geometry storefront, Reiki debrand, and sponsor registry lock without visible overlay"
  };
  document.title = `ScarlettVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function hideBootWhenReady(){
  const boot = document.getElementById("bootFallback");
  if (!boot || !window.__SVR_GAME_READY__) return;
  boot.style.opacity = "0";
  boot.style.pointerEvents = "none";
  boot.style.display = "none";
}

function verifyState(){
  const boot = document.getElementById("bootFallback");
  const bootHidden = !boot || boot.style.display === "none" || boot.style.opacity === "0" || getComputedStyle(boot).display === "none";
  window.SVR_PHASE159_VERIFY = {
    label: LABEL,
    gameReady: !!window.__SVR_GAME_READY__,
    vibezGeometry: !!window.SVR_PHASE159_VIBEZ_GEOMETRY,
    reikiDebrand: !!window.SVR_PHASE158_REIKI_DEBRAND_LOCK,
    hubSponsorRegistry: !!window.SVR_PHASE157_HUB_SPONSOR_REGISTRY,
    noVisibleBootOverlayAfterReady: !window.__SVR_GAME_READY__ || bootHidden,
    checkedAt: new Date().toISOString()
  };
}

function syncPhase159(){
  setBuildLabels();
  hideBootWhenReady();
  verifyState();
}

syncPhase159();
setTimeout(syncPhase159, 500);
setTimeout(syncPhase159, 1500);
setTimeout(syncPhase159, 3500);
setInterval(syncPhase159, 5000);
