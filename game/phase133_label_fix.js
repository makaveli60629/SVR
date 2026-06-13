const PHASE133 = "UPDATE-3.0-PHASE-133-REIKI-INTERACTIVE-HOLOGRAM-LOCK";
function syncPhase133Labels(){
  document.title = `ScarlettVR Poker • ${PHASE133}`;
  document.querySelectorAll(".pill").forEach((el)=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${PHASE133}`;
  });
  const status = document.getElementById("status");
  if (status && /PHASE-13[01]|Phase 13[01]/i.test(status.textContent || "")) status.textContent = `Ready. ${PHASE133}`;
}
syncPhase133Labels();
setTimeout(syncPhase133Labels, 800);
setTimeout(syncPhase133Labels, 1800);
setInterval(syncPhase133Labels, 4000);
