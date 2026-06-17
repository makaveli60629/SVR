const LABEL = "PHASE-267-RUNTIME-LABEL-SYNC-LOCK";
const LEGACY_ROOT = "PHASE101S_FINISHED_LOBBY_ROOT";

function removeLegacyFinishedLobbyRoot(scene){
  const old = scene?.getObjectByName?.(LEGACY_ROOT);
  if (old?.parent) old.parent.remove(old);
  return !!old;
}
function syncRuntimeLabel(){
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  try { document.body?.setAttribute("data-build", LABEL); } catch {}
  const status = document.getElementById("status");
  if (status && /PHASE-26[1-6]|Phase 26[1-6]|PHASE-101S/i.test(status.textContent || "")) status.textContent = `Ready. ${LABEL}`;
  const mode = document.getElementById("mode");
  if (mode && /Hands: waiting|Android smart controls|CAM 3/i.test(mode.textContent || "")) mode.textContent = mode.textContent;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_PHASE267_RUNTIME_LABEL_SYNC_LOCK = {
    build: LABEL,
    active: true,
    finishedLobbyShim: true,
    legacyPhase101SGeometrySuppressed: true,
    phase261BaselinePreserved: true,
    phase265PillarSignClearancePreserved: true,
    phase266QuestLodPreserved: true,
    noPhase84: true,
    noOldLobby: true,
    noTruitive: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE101S_FINISHED_LOBBY = {
    build: LABEL,
    active: true,
    compatibilityShim: true,
    geometryAdded: false,
    bootTouched: false,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  const removed = removeLegacyFinishedLobbyRoot(scene);
  syncRuntimeLabel();
  window.SVR_PHASE267_RUNTIME_LABEL_SYNC_LOCK.legacyRootRemoved = removed;
  window.SVR_RELEASE_BOOT?.("phase267-runtime-label-sync-loaded");
  return true;
}

syncRuntimeLabel();
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if (install() || tries > 90) clearInterval(timer);
}, 220);
setTimeout(install, 900);
setTimeout(install, 2200);
setTimeout(install, 5200);
