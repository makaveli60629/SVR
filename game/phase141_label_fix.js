const LABEL = "UPDATE-3.0-PHASE-148-QUEST-FPS-RENDER-OPTIMIZATION-LOCK";
function syncLabels(){
  document.title = `ScarlettVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
  const status = document.getElementById("status");
  if (status && /PHASE-14[0-8]|PHASE-13[0-9]|Phase 14[0-8]|Phase 13[0-9]/i.test(status.textContent || "")) status.textContent = `Ready. ${LABEL}`;
}
syncLabels();
setTimeout(syncLabels, 500);
setTimeout(syncLabels, 1500);
setInterval(syncLabels, 4000);
