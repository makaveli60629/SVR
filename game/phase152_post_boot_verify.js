const LABEL = "UPDATE-3.0-PHASE-161-WELLNESS-HUB-LUXURY-STOREFRONT-LOCK";

function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 161 Wellness Hub luxury storefront lock.";
  window.SVR_PHASE161 = { build: LABEL, purpose: "verify Wellness Hub luxury storefront" };
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
  window.SVR_PHASE161_VERIFY = {
    label: LABEL,
    gameReady: !!window.__SVR_GAME_READY__,
    wellnessLuxury: !!window.SVR_PHASE161_WELLNESS_LUXURY,
    orbitalPlanets: !!window.SVR_PHASE160_ORBITAL_PLANETS,
    vibezGeometry: !!window.SVR_PHASE159_VIBEZ_GEOMETRY,
    noVisibleBootOverlayAfterReady: !window.__SVR_GAME_READY__ || bootHidden,
    checkedAt: new Date().toISOString()
  };
}

function syncPhase161(){
  setBuildLabels();
  hideBootWhenReady();
  verifyState();
}

syncPhase161();
setTimeout(syncPhase161, 500);
setTimeout(syncPhase161, 1500);
setTimeout(syncPhase161, 3500);
setInterval(syncPhase161, 5000);
