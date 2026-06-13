const LABEL = "UPDATE-3.0-PHASE-172A-SPONSOR-MODULE-ARCHITECTURE-LOCK";
function syncLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 172A sponsor architecture: no-code sponsor intake packet, approved sponsor JSON, and game-side sponsor display module.";
  window.SVR_PHASE172A = { build: LABEL, purpose: "Sponsor intake and approved sponsor module loader" };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
  const status = document.getElementById("status");
  if (status && /PHASE-|Phase /i.test(status.textContent || "")) status.textContent = `Ready. ${LABEL}`;
}
syncLabels();
setTimeout(syncLabels, 500);
setTimeout(syncLabels, 1500);
setInterval(syncLabels, 4000);
