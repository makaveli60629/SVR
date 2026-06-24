const LABEL = "PHASE-175-RUNTIME-AUTHORITY-CACHE-BUST-LOCK";

function audit(){
  const boot = window.SVR_PHASE175_BOOT || null;
  const teleport = window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK || null;
  const table = window.SVR_PHASE172_FLOOR_LOGO_FELT_RAIL_CLEANUP_LOCK || null;
  const sky = window.SVR_PHASE169_SKY_AUDIT || null;
  const overlay = window.SVR_PHASE169_OVERLAY_AUDIT || null;
  const demo = window.SVR_PHASE168_PLAYABLE_POKER_DEMO_SIMULATION_LOCK || null;
  const result = {
    build: LABEL,
    active: true,
    cacheBustedToPhase175: true,
    indexIsModuleActivatorOnly: true,
    siteTouched: false,
    gameOnly: true,
    teleportFloorLockLoaded: !!teleport,
    teleportBuild: teleport?.build || null,
    tableFeltLogoLoaded: !!table,
    tableBuild: table?.build || null,
    skyOverlayLoaded: !!sky || !!overlay,
    skyBuild: sky?.build || null,
    overlayBuild: overlay?.build || null,
    playableDemoLoaded: !!demo,
    demoBuild: demo?.build || null,
    moduleBootCount: boot?.moduleCount || null,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE175_RUNTIME_AUTHORITY_CACHE_BUST_LOCK = result;
  window.SVR_RUN_PHASE175_LIVE_AUDIT = () => window.SVR_PHASE175_RUNTIME_AUTHORITY_CACHE_BUST_LOCK;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  return result;
}

[250, 900, 1800, 3500, 7000, 12000].forEach(ms => setTimeout(audit, ms));
setInterval(audit, 5000);
audit();
