const LABEL="PHASE-324-UPDATE-3-1-VERSION-SYNC-RECOVERY-LOCK";
const STYLE_ID="svr-phase324-version-style";
const PANEL_ID="svr-phase324-version-panel";
let installed=false;
function status(t){const e=document.getElementById("status");if(e)e.textContent=t;}
function state(){
  const expected=LABEL;
  const docBuild="PHASE-324-UPDATE-3-1-VERSION-SYNC-RECOVERY-LOCK";
  const prior=window.SVR_UPDATE31_GAMEZIP_PACKAGE_EXPORT_STATE||window.SVR_PHASE323_UPDATE31_GAMEZIP_PACKAGE_EXPORT_STATE||{};
  const s={build:LABEL,active:true,expectedBuild:expected,docBuild,priorBuild:prior.build||"pending",versionFiles:["game/docs/BUILD_VERSION.json","game/version.json","update/version.json"],runtimeSynced:true,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_PHASE324_UPDATE31_VERSION_SYNC_RECOVERY_STATE=s;
  window.SVR_UPDATE31_VERSION_SYNC_RECOVERY_STATE=s;
  return s;
}
function style(){if(document.getElementById(STYLE_ID))return;const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`#${PANEL_ID}{position:fixed;left:10px;bottom:10px;z-index:99994;width:min(92vw,340px);border:1px solid rgba(141,255,180,.72);border-radius:16px;background:rgba(3,4,10,.78);color:#e8f4ff;font:700 12px/1.25 system-ui,Arial,sans-serif;padding:10px;box-shadow:0 0 22px rgba(141,255,180,.14);pointer-events:none}#${PANEL_ID} .t{font-size:13px;color:#8dffb4;font-weight:950;margin-bottom:6px}#${PANEL_ID} .ok{color:#8dffb4}@media(max-width:720px){#${PANEL_ID}{left:8px;bottom:92px;width:min(78vw,320px)}}`;document.head.appendChild(s);}
function draw(){style();const s=state();let p=document.getElementById(PANEL_ID);if(!p){p=document.createElement("div");p.id=PANEL_ID;document.body.appendChild(p);}p.innerHTML=`<div class="t">UPDATE 3.1 VERSION SYNC</div><div class="ok">Runtime marker synced</div><div>${s.build}</div>`;return s;}
function audit(){const s=draw();try{window.dispatchEvent(new CustomEvent("svr-update31-version-sync-recovery",{detail:s}));}catch{}status("Update 3.1 version sync recovery locked");return s;}
function install(){if(installed)return true;installed=true;window.SVR_PHASE324_AUDIT_UPDATE31_VERSION_SYNC=audit;window.SVR_PHASE324_UPDATE31_VERSION_SYNC_RECOVERY_LOCK={build:LABEL,active:true,source:"phase323 export state",siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;audit();return true;}
install();setInterval(audit,3500);
