const LABEL = "UPDATE-3.1-H-CACHE-BUSTED-HANDS-FIST-RUNTIME-LOCK";

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-H",
    cacheBustedModules: true,
    handsFistRuntime: true,
    oldModuleCacheBypassed: true,
    checkedAt: new Date().toISOString()
  });
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function hidePanels(){
  document.getElementById("svrUpdate31Badge")?.remove();
  document.getElementById("svrDiagPanel")?.remove();
}

function install(){
  stamp();
  hidePanels();
  window.SVR_UPDATE31_LEGACY_AUTOLOAD_DISABLED = true;
  window.SVR_UPDATE31_B_MODULE_REQUESTED = true;
  window.SVR_UPDATE31_C_MODULE_REQUESTED = true;
}

install();
[250,800,1800,3500,7000].forEach(ms=>setTimeout(install,ms));
