const LABEL = "UPDATE-3.0-PHASE-160-ORBITAL-PLANETS-STARFIELD-LOCK";

function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 160 orbital planets and starfield lock. Post-boot verification preserved without adding any visible overlay.";
  window.SVR_PHASE160 = {
    build: LABEL,
    purpose: "verify bigger separated orbital planets and reshaped non-pattern starfield"
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
  window.SVR_PHASE160_VERIFY = {
    label: LABEL,
    gameReady: !!window.__SVR_GAME_READY__,
    orbitalPlanets: !!window.SVR_PHASE160_ORBITAL_PLANETS,
    starfield: !!window.SVR_PHASE160_STARFIELD,
    vibezGeometry: !!window.SVR_PHASE159_VIBEZ_GEOMETRY,
    reikiDebrand: !!window.SVR_PHASE158_REIKI_DEBRAND_LOCK,
    noVisibleBootOverlayAfterReady: !window.__SVR_GAME_READY__ || bootHidden,
    checkedAt: new Date().toISOString()
  };
}

function syncPhase160(){
  setBuildLabels();
  hideBootWhenReady();
  verifyState();
}

syncPhase160();
setTimeout(syncPhase160, 500);
setTimeout(syncPhase160, 1500);
setTimeout(syncPhase160, 3500);
setInterval(syncPhase160, 5000);
