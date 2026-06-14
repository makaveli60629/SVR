import { installPhase177HandHistoryPublicFilter } from "./modules/phase177_hand_history_public_filter.js";
import { installPhase178Bounds } from "./modules/phase178_bounds.js";
import { autoInstallPhase191FloorAuthorityLock } from "./modules/phase191_floor_authority_lock.js";

const LABEL = "UPDATE-3.0-PHASE-205-MEDITATION-ROOM-POLISH-LOCK";

function sync(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_DISABLE_LEGACY_SKYLINE = true;
  window.SVR_REFINED_LOBBY_GEOMETRY = true;
  window.SVR_BACKGROUND_BUILDINGS_REMOVED = true;
  window.SVR_HAND_OVERLAY_DISABLED = true;
  window.SVR_PHASE205 = { build: LABEL, active: true, meditationRoomPolish: true, approvalSafe: true };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function cleanOldVisuals(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return;
  const old = [/PHASE176/i,/PHASE179/i,/PHASE183/i,/PHASE184/i,/PHASE185/i,/PHASE188/i,/PHASE189/i,/building/i,/skyline/i,/tower/i,/city/i,/phase123/i,/phase164/i,/phase168/i,/phase171/i,/phase173/i,/phase175/i,/picture/i,/billboard/i];
  const keep = /PHASE205|PHASE204|PHASE203|PHASE202|PHASE201|PHASE200|PHASE199|PHASE198|PHASE197|PHASE196|PHASE195|PHASE191|PHASE190|PHASE178|PHASE177|PGA|REIKI|WELLNESS|SPONSOR|STORE|SCORPION|LEGEND|Watch|Teleport|Hand|Controller|Moon|Mars|Star/i;
  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if (old.some(rx=>rx.test(name)) && !keep.test(name)) obj.visible = false;
  });
}

sync();
setTimeout(sync, 100);
setTimeout(sync, 500);
setTimeout(sync, 1500);
setInterval(()=>{ sync(); cleanOldVisuals(); }, 1500);

installPhase177HandHistoryPublicFilter();
installPhase178Bounds();
autoInstallPhase191FloorAuthorityLock();
setTimeout(cleanOldVisuals, 50);
setTimeout(cleanOldVisuals, 150);
setTimeout(cleanOldVisuals, 500);
setTimeout(cleanOldVisuals, 1000);
setTimeout(cleanOldVisuals, 3000);
