const LABEL = "UPDATE-3.0-PHASE-173-SINGLE-OCTAGON-WALL-LOCOMOTION-AUDIT-LOCK";
function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 173 active.";
  window.SVR_PHASE173 = { build: LABEL };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}
function hideBoot(){
  const boot = document.getElementById("bootFallback");
  if (!boot || !window.__SVR_GAME_READY__) return;
  boot.style.opacity = "0";
  boot.style.pointerEvents = "none";
  boot.style.display = "none";
}
function verifyState(){
  window.SVR_PHASE173_VERIFY = {
    label: LABEL,
    gameReady: !!window.__SVR_GAME_READY__,
    singleWall: window.SVR_PHASE173_SINGLE_WALL || null,
    locomotionAudit: window.SVR_PHASE173_LOCOMOTION_AUDIT || null,
    sponsorSchedule: window.SVR_PHASE172C_SPONSOR_SCHEDULE || null,
    checkedAt: new Date().toISOString()
  };
}
function sync(){ setBuildLabels(); hideBoot(); verifyState(); }
sync();
setTimeout(sync, 500);
setTimeout(sync, 1500);
setTimeout(sync, 3500);
setInterval(sync, 5000);
