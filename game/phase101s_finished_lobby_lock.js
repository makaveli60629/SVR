const LABEL = "PHASE-270-LIVE-BUILD-POINTER-LOCK";
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
  if (status && /PHASE-26[1-9]|Phase 26[1-9]|PHASE-101S/i.test(status.textContent || "")) status.textContent = `Ready. ${LABEL}`;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_PHASE270_LIVE_BUILD_POINTER_LOCK = {
    build: LABEL,
    active: true,
    liveBuildPointerLocked: true,
    bootCacheBusterPreserved: true,
    lateLegacyGeometrySuppressed: true,
    phase261BaselinePreserved: true,
    phase265PillarSignClearancePreserved: true,
    phase266QuestLodPreserved: true,
    phase269BootCacheBusterPreserved: true,
    noPhase84: true,
    noTruitive: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE269_BOOT_CACHE_BUSTER_SYNC_LOCK = window.SVR_PHASE270_LIVE_BUILD_POINTER_LOCK;
  window.SVR_PHASE268_FINAL_RUNTIME_CACHE_SYNC_LOCK = window.SVR_PHASE270_LIVE_BUILD_POINTER_LOCK;
  window.SVR_PHASE267_RUNTIME_LABEL_SYNC_LOCK = window.SVR_PHASE270_LIVE_BUILD_POINTER_LOCK;
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
  window.SVR_PHASE270_LIVE_BUILD_POINTER_LOCK.legacyRootRemoved = removed;
  window.SVR_RELEASE_BOOT?.("phase270-live-build-pointer-loaded");
  return true;
}

syncRuntimeLabel();
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if (install() || tries > 90) clearInterval(timer);
}, 140);
setTimeout(install, 450);
setTimeout(install, 1400);
setTimeout(install, 3000);
setTimeout(install, 6200);
