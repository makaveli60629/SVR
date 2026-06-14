import { installPhase177HandHistoryPublicFilter } from "./modules/phase177_hand_history_public_filter.js";
import { installPhase178Bounds } from "./modules/phase178_bounds.js";
import { autoInstallPhase180TableSelector } from "./modules/phase180_table_selector.js";
import { autoInstallPhase185OfficialLobbyLook } from "./modules/phase185_official_lobby_look.js";
import { installPhase186DeploySyncCleanup } from "./modules/phase186_deploy_sync_cleanup.js";
import { autoInstallPhase189SkyFloorHardlock } from "./modules/phase189_sky_floor_hardlock.js";
import { autoInstallPhase191FloorAuthorityLock } from "./modules/phase191_floor_authority_lock.js";
import { autoInstallPhase192LobbyVisualCleanup } from "./modules/phase192_lobby_visual_cleanup.js";

const LABEL = "UPDATE-3.0-PHASE-192-LOBBY-VISUAL-CLEANUP-LOCK";

function sync(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE190 = { build: "UPDATE-3.0-PHASE-190-QUEST-CONTROLLER-FORWARD-TELEPORT-LOCK", active: true, questControllerForwardTeleportLock: true };
  window.SVR_PHASE191 = { build: "UPDATE-3.0-PHASE-191-DUPLICATE-FLOOR-AUTHORITY-LOCK", active: true, duplicateFloorAuthorityLock: true };
  window.SVR_PHASE192 = { build: LABEL, active: true, lobbyVisualCleanup: true };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function hideSupersededVisuals(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return;
  const patterns = [/PHASE176_LOBBY_ARENA/i,/PHASE176_JUMBOTRON/i,/CENTER_SPECTATOR_RING/i,/CENTER_FEATURED_TABLE_STAGE/i,/PHASE176_RING_LABEL/i,/PHASE179_CENTERPIECE/i,/PHASE183_ROMAN_MEZZANINE/i,/PHASE184_LOBBY_EXPERIENCE/i,/building/i,/skyline/i,/tower/i,/city/i,/adbuilding/i,/bannerbuilding/i,/phase123/i,/phase164/i,/phase173/i,/phase175/i,/picture/i,/billboard/i];
  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if (patterns.some(rx=>rx.test(name)) && !/PHASE192|PHASE191|PHASE190|PHASE189|PHASE185|PHASE187|PHASE181|PHASE180|PHASE178|PHASE177|PGA|REIKI|WELLNESS|SPONSOR|STORE|SCORPION|LEGEND|Watch|Teleport|Hand|Controller|Moon|Mars/i.test(name)) obj.visible = false;
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
installPhase186DeploySyncCleanup();
autoInstallPhase189SkyFloorHardlock();
autoInstallPhase191FloorAuthorityLock();
autoInstallPhase192LobbyVisualCleanup();
setTimeout(hideSupersededVisuals, 1000);
setTimeout(hideSupersededVisuals, 3000);
