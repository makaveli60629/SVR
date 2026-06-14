const LABEL = "UPDATE-3.1-A-VERSION-SYNC-LOCK";

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, {
    build: LABEL,
    active: true,
    phase: "3.1-A",
    versionSync: true,
    deployPath: "direct-game-folder",
    requiredFiles: [
      "game/index.html",
      "game/phase176_boot.js",
      "game/phase223_phase_diag_log.js",
      "game/docs/BUILD_VERSION.json",
      "update/version.json"
    ],
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
    badge.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:2147483646;background:rgba(8,5,18,.82);color:#eaf8ff;border:1px solid rgba(255,217,138,.82);border-radius:10px;padding:8px 10px;font:11px ui-monospace,Consolas,monospace;box-shadow:0 0 16px rgba(255,217,138,.18);pointer-events:none;max-width:360px";
    document.body.appendChild(badge);
  }
  const diag = window.SVR_DIAG_LOG || [];
  badge.innerHTML = `<b style="color:#ffd98a">UPDATE 3.1-A</b><br>${LABEL}<br><span style="color:#7ffcff">version sync active</span><br>diag entries: ${diag.length}`;
}

function install(){
  stamp();
  showBadge();
  if(!window.SVR_UPDATE31_LOGGED){
    window.SVR_UPDATE31_LOGGED = true;
    console.warn(`[SVR] ${LABEL}: version sync marker active`);
  }
}

install();
setInterval(install, 1200);
[250,800,1800,3500,7000].forEach(ms=>setTimeout(install,ms));
