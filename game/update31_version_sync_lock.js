const LABEL = "UPDATE-3.1-C-MOON-PHASE-HARD-LOCK";

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-C",
    versionSync: true,
    moonPhaseHardLock: true,
    oneMoonOnly: true,
    deployPath: "direct-game-folder",
    checkedAt: new Date().toISOString()
  });
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function showBadge(){
  let badge = document.getElementById("svrUpdate31Badge");
  if(!badge){
    badge = document.createElement("div");
    badge.id = "svrUpdate31Badge";
    badge.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:2147483646;background:rgba(8,5,18,.82);color:#eaf8ff;border:1px solid rgba(255,217,138,.82);border-radius:10px;padding:8px 10px;font:11px ui-monospace,Consolas,monospace;pointer-events:none;max-width:390px";
    document.body.appendChild(badge);
  }
  const diag = window.SVR_DIAG_LOG || [];
  badge.innerHTML = `<b style="color:#ffd98a">UPDATE 3.1-C</b><br>${LABEL}<br><span style="color:#7ffcff">one Moon + phase hard lock</span><br>diag entries: ${diag.length}`;
}

function loadModules(){
  if(!window.SVR_UPDATE31_B_MODULE_REQUESTED){
    window.SVR_UPDATE31_B_MODULE_REQUESTED = true;
    import("./update31_lobby_structure_completion.js").catch(err=>console.error("Update 3.1-B module load failed", err));
  }
  if(!window.SVR_UPDATE31_C_MODULE_REQUESTED){
    window.SVR_UPDATE31_C_MODULE_REQUESTED = true;
    import("./update31_moon_phase_hard_lock.js").catch(err=>console.error("Update 3.1-C module load failed", err));
  }
}

function install(){
  stamp();
  showBadge();
  loadModules();
  if(!window.SVR_UPDATE31_C_LOGGED){
    window.SVR_UPDATE31_C_LOGGED = true;
    console.warn(`[SVR] ${LABEL}: one Moon and phase hard lock active`);
  }
}

install();
setInterval(install, 700);
[250,800,1800,3500,7000].forEach(ms=>setTimeout(install,ms));
