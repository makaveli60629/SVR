import { installPhase177HandHistoryPublicFilter } from "./modules/phase177_hand_history_public_filter.js";
import { installPhase178Bounds } from "./modules/phase178_bounds.js";
import { autoInstallPhase180TableSelector } from "./modules/phase180_table_selector.js";
import { autoInstallPhase185OfficialLobbyLook } from "./modules/phase185_official_lobby_look.js";

const LABEL = "UPDATE-3.0-PHASE-185-OFFICIAL-LOBBY-LOOK-LOCK";

function sync(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE185 = { build: LABEL, active: true, officialLobbyLook: true };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function hideSupersededVisuals(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return;
  const patterns = [/PHASE176_LOBBY_ARENA/i,/PHASE176_JUMBOTRON/i,/CENTER_SPECTATOR_RING/i,/CENTER_FEATURED_TABLE_STAGE/i,/PHASE176_RING_LABEL/i,/PHASE179_CENTERPIECE/i,/PHASE183_ROMAN_MEZZANINE/i,/PHASE184_LOBBY_EXPERIENCE/i];
  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if (patterns.some(rx=>rx.test(name))) obj.visible = false;
  });
}

sync();
setTimeout(sync, 500);
setTimeout(sync, 1500);
setInterval(()=>{ sync(); hideSupersededVisuals(); }, 4000);

installPhase177HandHistoryPublicFilter();
installPhase178Bounds();
autoInstallPhase180TableSelector();
autoInstallPhase185OfficialLobbyLook();
setTimeout(hideSupersededVisuals, 1000);
setTimeout(hideSupersededVisuals, 3000);
