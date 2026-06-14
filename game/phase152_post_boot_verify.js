const LABEL = "UPDATE-3.0-PHASE-187-OFFICIAL-LOBBY-STABILIZER-LOCK";
function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 187 official lobby verifier active.";
  window.SVR_PHASE187 = Object.assign(window.SVR_PHASE187 || {}, { build: LABEL, verifier: true });
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
  window.SVR_PHASE187_VERIFY = {
    label: LABEL,
    gameReady: !!window.__SVR_GAME_READY__,
    officialLook: window.SVR_PHASE185_OFFICIAL_LOOK || null,
    deploySync: window.SVR_PHASE186_DEPLOY_SYNC || null,
    checkedAt: new Date().toISOString()
  };
}
function sync(){ setBuildLabels(); hideBoot(); verifyState(); }
sync();
setTimeout(sync, 500);
setTimeout(sync, 1500);
setTimeout(sync, 3500);
setInterval(sync, 5000);
