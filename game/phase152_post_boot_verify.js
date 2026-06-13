const LABEL = "UPDATE-3.0-PHASE-155-SKYLINE-AD-RING-MOON-GLOW-LOCK";

function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 155 skyline ad ring and moving moon glow lock. Post-boot verification preserved without any visible overlay.";
  window.SVR_PHASE152 = {
    build: LABEL,
    purpose: "post-boot verification without adding any visible overlay",
    preserves: ["extra-thin silver poles", "hidden glass beam overlay", "high small textured moon and Mars", "aligned skyline ad ring", "moving moon glow", "logo-color hologram pod button", "Quest hands", "teleport", "watch"]
  };
  window.SVR_PHASE155 = {
    build: LABEL,
    purpose: "align tall wide ad buildings around the full lobby and animate moon glow with the raised moon"
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
    phase154Refined: !!window.SVR_PHASE154_REFINED,
    phase155Refined: !!window.SVR_PHASE155_REFINED,
    movingMoonGlow: !!window.SVR_PHASE155_MOON_GLOW_MOVES,
    hologramPodButton: !!window.SVR_PHASE154_POD_BUTTON,
    noVisibleBootOverlayAfterReady: !window.__SVR_GAME_READY__ || bootHidden,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE155_VERIFY = window.SVR_PHASE152_VERIFY;
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
