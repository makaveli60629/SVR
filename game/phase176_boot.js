import { installPhase177HandHistoryPublicFilter } from "./modules/phase177_hand_history_public_filter.js";
import { installPhase178Bounds } from "./modules/phase178_bounds.js";
import { autoInstallPhase179CenterpieceGuidance } from "./modules/phase179_centerpiece_guidance.js";
import { autoInstallPhase180TableSelector } from "./modules/phase180_table_selector.js";
import { autoInstallPhase183RomanMezzanineAds } from "./modules/phase183_roman_mezzanine_ads.js";
import { autoInstallPhase184LobbyExperiencePolish } from "./modules/phase184_lobby_experience_polish.js";

const LABEL = "UPDATE-3.0-PHASE-184-LOBBY-POLISH-LOCK";

function sync(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE184 = { build: LABEL, active: true };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function removeArenaShell(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return;
  const patterns = [/PHASE176_LOBBY_ARENA/i, /PHASE176_JUMBOTRON/i, /CENTER_SPECTATOR_RING/i, /CENTER_FEATURED_TABLE_STAGE/i, /PHASE176_RING_LABEL/i];
  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if (patterns.some(rx=>rx.test(name))) obj.visible = false;
  });
}

sync();
setTimeout(sync, 500);
setTimeout(sync, 1500);
setInterval(()=>{ sync(); removeArenaShell(); }, 4000);

installPhase177HandHistoryPublicFilter();
installPhase178Bounds();
autoInstallPhase179CenterpieceGuidance();
autoInstallPhase180TableSelector();
autoInstallPhase183RomanMezzanineAds();
autoInstallPhase184LobbyExperiencePolish();
setTimeout(removeArenaShell, 1000);
setTimeout(removeArenaShell, 3000);
