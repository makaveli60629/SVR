const LABEL = "PHASE-271-RUNTIME-HEALTH-AUDIT-LOCK";
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
  if (status) status.textContent = `Ready. ${LABEL}`;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_PHASE271_RUNTIME_HEALTH_AUDIT_LOCK = {
    build: LABEL,
    active: true,
    runtimeHealthAudit: true,
    liveBuildPointerLocked: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE270_LIVE_BUILD_POINTER_LOCK = window.SVR_PHASE271_RUNTIME_HEALTH_AUDIT_LOCK;
}
function install(){
  const scene = window.__SVR_SCENE__;
  syncRuntimeLabel();
  if (scene){
    const removed = removeLegacyFinishedLobbyRoot(scene);
    window.SVR_PHASE271_RUNTIME_HEALTH_AUDIT_LOCK.legacyRootRemoved = removed;
  }
  window.SVR_RELEASE_BOOT?.("phase271-runtime-health-audit-loaded");
  return !!scene;
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
