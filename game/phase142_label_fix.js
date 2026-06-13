const LABEL = "UPDATE-3.0-PHASE-142-FULL-LOBBY-REMODEL-VISIBLE-PLANETS-LOCK";
function syncLabels(){
  document.title = `ScarlettVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}
syncLabels();
setTimeout(syncLabels, 500);
setTimeout(syncLabels, 1500);
setInterval(syncLabels, 4000);
