const LABEL = "UPDATE-3.0-PHASE-187-OFFICIAL-LOBBY-STABILIZER-LOCK";

function syncLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 187 official lobby stabilizer active. Old Phase 173/175 visual installers disabled.";
  window.SVR_PHASE187 = { build: LABEL, oldVisualInstallersDisabled: true };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
  const status = document.getElementById("status");
  if (status && /PHASE-|Phase |UPDATE-/i.test(status.textContent || "")) status.textContent = `Ready. ${LABEL}`;
}

syncLabels();
setTimeout(syncLabels, 500);
setTimeout(syncLabels, 1500);
setInterval(syncLabels, 4000);
