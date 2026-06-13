const LABEL = "UPDATE-3.0-PHASE-164-LEGENDS-STATUES-COMPACT-LOBBY-WALLS-LOCK";
function setBuildLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 164 Legends statues and compact lobby walls lock.";
  window.SVR_PHASE164 = { build: LABEL, purpose: "Legends statues and compact walls" };
  document.title = `ScarlettVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{ if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}
function hideBootWhenReady(){ const boot = document.getElementById("bootFallback"); if (!boot || !window.__SVR_GAME_READY__) return; boot.style.opacity = "0"; boot.style.pointerEvents = "none"; boot.style.display = "none"; }
function verifyState(){
  const boot = document.getElementById("bootFallback");
  const bootHidden = !boot || boot.style.display === "none" || boot.style.opacity === "0" || getComputedStyle(boot).display === "none";
  window.SVR_PHASE164_VERIFY = { label: LABEL, gameReady: !!window.__SVR_GAME_READY__, legendsStatues: !!window.SVR_PHASE164_LEGENDS_STATUES, compactLobbyWalls: !!window.SVR_PHASE164_COMPACT_LOBBY_WALLS, realisticStorefronts: !!window.SVR_PHASE163_REALISTIC_STOREFRONTS, noVisibleBootOverlayAfterReady: !window.__SVR_GAME_READY__ || bootHidden, checkedAt: new Date().toISOString() };
}
function syncPhase164(){ setBuildLabels(); hideBootWhenReady(); verifyState(); }
syncPhase164();
setTimeout(syncPhase164, 500);
setTimeout(syncPhase164, 1500);
setTimeout(syncPhase164, 3500);
setInterval(syncPhase164, 5000);
