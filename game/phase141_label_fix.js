const LABEL = "UPDATE-3.0-PHASE-171-CLEAN-INNER-OCTAGON-MOON-MARS-LOCK";
function syncLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 171 clean inner octagon: background skyline/buildings hidden, Earth removed/hidden, big textured Moon and Mars locked.";
  window.SVR_PHASE171 = { build: LABEL, purpose: "Clean inner octagon, no background buildings, Moon/Mars only" };
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
