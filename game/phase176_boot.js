import { autoInstallPhase176LobbyArenaBroadcast } from "./modules/phase176_lobby_arena_broadcast.js";
import { installPhase177HandHistoryPublicFilter } from "./modules/phase177_hand_history_public_filter.js";

const LABEL = "UPDATE-3.0-PHASE-177-HISTORY-FILTER-LOCK";
function sync(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE177 = { build: LABEL, active: true };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}
sync();
setTimeout(sync,500);
setTimeout(sync,1500);
setInterval(sync,4000);
autoInstallPhase176LobbyArenaBroadcast();
installPhase177HandHistoryPublicFilter();
