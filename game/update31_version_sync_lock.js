const LABEL = "UPDATE-3.1-D-QUEST-ALIGNMENT-CONTROL-OVERLAY-FIX";

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-D",
    versionSync: true,
    questAlignmentFix: true,
    diagnosticPanelsOff: true,
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
  if(!window.SVR_UPDATE31_B_MODULE_REQUESTED){
    window.SVR_UPDATE31_B_MODULE_REQUESTED = true;
    import("./update31_lobby_structure_completion.js").catch(err=>console.error("Update 3.1-B module load failed", err));
  }
  if(!window.SVR_UPDATE31_C_MODULE_REQUESTED){
    window.SVR_UPDATE31_C_MODULE_REQUESTED = true;
    import("./update31_moon_phase_hard_lock.js").catch(err=>console.error("Update 3.1-D moon module load failed", err));
  }
}

function install(){
  stamp();
  removePanels();
  loadModules();
}

install();
[250,800,1800,3500,7000].forEach(ms=>setTimeout(install,ms));
