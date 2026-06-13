const LABEL = "UPDATE-3.0-PHASE-152-POST-BOOT-VERIFY-NO-OVERLAY-LOCK";

function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 152 post boot verification. Phase 150 visual hard refine and Phase 151 runtime label consistency preserved.";
  window.SVR_PHASE152 = {
    build: LABEL,
    purpose: "post-boot verification without adding any visible overlay",
    preserves: ["extra-thin silver poles", "hidden glass beam overlay", "visible moon and Mars", "clean skyline", "Quest hands", "teleport", "watch"]
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
  window.SVR_PHASE152_VERIFY = {
    label: LABEL,
    gameReady: !!window.__SVR_GAME_READY__,
    phase150Refined: !!window.SVR_PHASE150_REFINED,
    phase149Refined: !!window.SVR_PHASE149_REFINED,
    noVisibleBootOverlayAfterReady: !window.__SVR_GAME_READY__ || bootHidden,
    checkedAt: new Date().toISOString()
  };
}

function syncPhase152(){
  setBuildLabels();
  hideBootWhenReady();
  verifyState();
}

syncPhase152();
setTimeout(syncPhase152, 500);
setTimeout(syncPhase152, 1500);
setTimeout(syncPhase152, 3500);
setInterval(syncPhase152, 5000);
