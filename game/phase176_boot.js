import "./update31_version_sync_lock.js";
import { installPhase177HandHistoryPublicFilter } from "./modules/phase177_hand_history_public_filter.js";
import { installPhase178Bounds } from "./modules/phase178_bounds.js";
import { autoInstallPhase191FloorAuthorityLock } from "./modules/phase191_floor_authority_lock.js";

const LABEL = "UPDATE-3.1-G-HANDS-FIST-TELEPORT-ARC-REALIGN-LOCK";

function sync(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_DISABLE_LEGACY_SKYLINE = true;
  window.SVR_REFINED_LOBBY_GEOMETRY = true;
  window.SVR_BACKGROUND_BUILDINGS_REMOVED = true;
  window.SVR_HAND_OVERLAY_DISABLED = true;
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE227 = Object.assign(window.SVR_PHASE227 || {}, { build: LABEL, active: true, bootSynced: true });
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, { build: LABEL, active: true, phase: "3.1-G", bootSynced: true, handsFistTeleport: true });
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function cleanOldVisuals(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return;
  const old = [/PHASE176/i,/PHASE179/i,/PHASE183/i,/PHASE184/i,/PHASE185/i,/PHASE188/i,/PHASE189/i,/building/i,/skyline/i,/tower/i,/city/i,/phase123/i,/phase164/i,/phase168/i,/phase171/i,/phase173/i,/phase175/i,/picture/i,/billboard/i,/PHASE204_VISUAL_GUIDE/i,/PHASE204_GUIDANCE/i,/PHASE204_FEEDBACK/i,/DIAGNOSTIC/i,/DIAG/i];
  const keep = /UPDATE31G|UPDATE31F|UPDATE31E|UPDATE31D|PHASE227|PHASE226|PHASE225|PHASE224|PHASE222|PHASE220|PHASE219|PHASE218|PHASE217|PHASE216|PHASE215|PHASE214|PHASE213|PHASE212|PHASE211|PHASE208|PHASE207|PHASE206|PHASE205|PHASE204|PHASE203|PHASE202|PHASE201|PHASE200|PHASE199|PHASE198|PHASE197|PHASE196|PHASE195|PHASE191|PHASE190|PHASE178|PHASE177|PGA|REIKI|WELLNESS|SPONSOR|STORE|SCORPION|LEGEND|Watch|Teleport|Hand|Controller|Moon|Mars|Star/i;
  const toHide = [];
  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if (old.some(rx=>rx.test(name)) && !keep.test(name)) toHide.push(obj);
  });
  toHide.forEach(obj=>{ obj.visible = false; });
}

sync();
setTimeout(sync, 100);
setTimeout(sync, 500);
setTimeout(sync, 1500);

installPhase177HandHistoryPublicFilter();
installPhase178Bounds();
autoInstallPhase191FloorAuthorityLock();
setTimeout(cleanOldVisuals, 50);
setTimeout(cleanOldVisuals, 250);
setTimeout(cleanOldVisuals, 900);
setTimeout(cleanOldVisuals, 2200);
