const LABEL = "UPDATE-3.0-PHASE-162-ALL-HUB-LUXURY-STOREFRONTS-HUD-LOCK";

function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 162 all hub luxury storefronts and premium holographic HUD lock.";
  window.SVR_PHASE162 = { build: LABEL, purpose: "verify all-hub luxury storefronts and tactile HUD panels" };
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
  window.SVR_PHASE162_VERIFY = {
    label: LABEL,
    gameReady: !!window.__SVR_GAME_READY__,
    allHubLuxury: !!window.SVR_PHASE162_ALL_HUBS_LUXURY,
    premiumHubHud: !!window.SVR_PHASE162_PREMIUM_HUB_HUD,
    wellnessLuxury: !!window.SVR_PHASE161_WELLNESS_LUXURY,
    orbitalPlanets: !!window.SVR_PHASE160_ORBITAL_PLANETS,
    vibezGeometry: !!window.SVR_PHASE159_VIBEZ_GEOMETRY,
    noVisibleBootOverlayAfterReady: !window.__SVR_GAME_READY__ || bootHidden,
    checkedAt: new Date().toISOString()
  };
}

function syncPhase162(){
  setBuildLabels();
  hideBootWhenReady();
  verifyState();
}

syncPhase162();
setTimeout(syncPhase162, 500);
setTimeout(syncPhase162, 1500);
setTimeout(syncPhase162, 3500);
setInterval(syncPhase162, 5000);
