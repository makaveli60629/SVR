const LABEL = "UPDATE-3.0-PHASE-135-EXPANDED-LOBBY-WALL-ALIGNMENT-LOCK";
function syncLabels(){
  document.title = `ScarlettVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}
syncLabels();
setTimeout(syncLabels, 800);
setTimeout(syncLabels, 1800);
setInterval(syncLabels, 4000);
