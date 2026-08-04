const LABEL = "UPDATE-3.1-F-SINGLE-RUNTIME-QUEST-CONTROLLER-OVERLAY-LOCK";

function newerRuntimeLocked(){
  return !!window.SVR_PHASE226?.active || String(window.SVR_LOCKED_FINAL_BUILD || "").includes("UPDATE-3.1-F");
}

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-F",
    versionSync: true,
    questControllerVisual: true,
    singleRuntimeLock: true,
    diagnosticPanelsOff: true,
    legacyAutoloadDisabled: true,
    oneMoonOnly: true,
    deployPath: "direct-game-folder",
    checkedAt: new Date().toISOString()
  });
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function removePanels(){
  document.getElementById("svrUpdate31Badge")?.remove();
  document.getElementById("svrDiagPanel")?.remove();
}

function loadModules(){
  // Phase 226: disabled old 3.1-B / 3.1-C auto-imports.
  // Those modules were re-stamping older titles and adding duplicate floors/moons/world layers.
  window.SVR_UPDATE31_LEGACY_AUTOLOAD_DISABLED = true;
  window.SVR_UPDATE31_B_MODULE_REQUESTED = true;
  window.SVR_UPDATE31_C_MODULE_REQUESTED = true;
  window.SVR_UPDATE31_LEGACY_MODULES_HELD = [
    "update31_lobby_structure_completion.js",
    "update31_moon_phase_hard_lock.js"
  ];
}

function install(){
  stamp();
  removePanels();
  loadModules();
}

install();
[250,800,1800,3500,7000].forEach(ms=>setTimeout(()=>{ if(!newerRuntimeLocked()) install(); },ms));
