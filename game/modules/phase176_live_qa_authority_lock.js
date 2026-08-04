const LABEL = "PHASE-176-LIVE-QA-AUTHORITY-LOCK";

let lastAudit = null;

function nowIso(){ return new Date().toISOString(); }

function hideOverlayNodes(){
  const selectors = [
    "#bootFallback",
    "#svrPhaseBadge",
    ".phase-label",
    ".black-overlay",
    ".square-overlay",
    ".face-overlay",
    ".vignette",
    ".iris",
    ".fade",
    ".oculus-overlay",
    "[data-overlay]",
    "[data-svr-overlay]"
  ];
  let hidden = 0;
  for(const selector of selectors){
    document.querySelectorAll(selector).forEach(el => {
      if(el.id === "svr-phase169-position-panel") return;
      el.style.display = "none";
      el.style.opacity = "0";
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
      hidden++;
    });
  }
  document.body?.classList?.add("svr-phase176-clean-view", "svr-xr-clean-view");
  return hidden;
}

function runAudit(){
  const overlayHidden = hideOverlayNodes();
  const teleport = window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK || null;
  const table = window.SVR_PHASE172_FLOOR_LOGO_FELT_RAIL_CLEANUP_LOCK || null;
  const sky = window.SVR_PHASE169_SKY_AUDIT || null;
  const overlay = window.SVR_PHASE169_OVERLAY_AUDIT || null;
  const phase175 = window.SVR_PHASE175_RUNTIME_AUTHORITY_CACHE_BUST_LOCK || null;
  const position = window.SVR_PHASE169_DEMO_QA_POSITION_SKY_OVERLAY_MODULE_LOCK || null;

  lastAudit = {
    build: LABEL,
    active: true,
    gameOnly: true,
    siteTouched: false,
    moduleAuthority: "index loads modules only",
    overlayHidden,
    teleportLoaded: !!teleport,
    teleportBuild: teleport?.build || null,
    teleportFloorLocked: !!teleport?.floorLocked,
    teleportStable: !!teleport?.stableHandTeleport,
    tableLoaded: !!table,
    tableBuild: table?.build || null,
    tableAligned: !!table?.tableAligned,
    floorLogoLoaded: !!table?.floorLogoAligned,
    skyLoaded: !!sky || !!overlay,
    skyBuild: sky?.build || overlay?.build || null,
    positionPanelLoaded: !!position,
    phase175Loaded: !!phase175,
    phase175Build: phase175?.build || null,
    checkedAt: nowIso()
  };

  window.SVR_PHASE176_LIVE_QA_AUTHORITY_LOCK = lastAudit;
  window.SVR_RUN_PHASE176_LIVE_QA_AUDIT = () => window.SVR_PHASE176_LIVE_QA_AUTHORITY_LOCK || lastAudit;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  return lastAudit;
}

[250, 900, 1800, 3200, 6500, 10000].forEach(ms => setTimeout(runAudit, ms));
setInterval(runAudit, 4000);
runAudit();
