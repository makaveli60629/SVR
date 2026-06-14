const LABEL = "UPDATE-3.0-PHASE-205-MEDITATION-ROOM-POLISH-LOCK";
function sync(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE205 = { build:LABEL, active:true, meditationRoomPolish:true, approvalSafe:true };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if ((el.textContent||"").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}
sync();
setTimeout(sync,100);
setTimeout(sync,500);
setTimeout(sync,1500);
setInterval(sync,1600);
