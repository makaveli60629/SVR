import { autoInstallPhase176LobbyArenaBroadcast } from "./modules/phase176_lobby_arena_broadcast.js";
import { installPhase177HandHistoryPublicFilter } from "./modules/phase177_hand_history_public_filter.js";
import { installPhase178Bounds } from "./modules/phase178_bounds.js";
import { autoInstallPhase179CenterpieceGuidance } from "./modules/phase179_centerpiece_guidance.js";
import { autoInstallPhase180TableSelector } from "./modules/phase180_table_selector.js";

const LABEL = "UPDATE-3.0-PHASE-180-TABLE-SELECTOR-LOCK";
function sync(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE180 = { build: LABEL, active: true };
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
installPhase178Bounds();
autoInstallPhase179CenterpieceGuidance();
autoInstallPhase180TableSelector();
