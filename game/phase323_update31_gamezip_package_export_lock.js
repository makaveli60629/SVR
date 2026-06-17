const LABEL="PHASE-323-UPDATE-3-1-GAMEZIP-PACKAGE-EXPORT-LOCK";
const STYLE_ID="svr-phase323-package-style";
const PANEL_ID="svr-phase323-package-panel";
let installed=false;
const COMMAND="Compress-Archive -Path .\\game\\* -DestinationPath .\\game.zip -Force";
const VERIFY="tar -tf game.zip | Select-Object -First 12";
function status(t){const e=document.getElementById("status");if(e)e.textContent=t;}
function prep(){return window.SVR_UPDATE31_FINAL_PACK_PREP_STATE||window.SVR_PHASE322_UPDATE31_FINAL_MANIFEST_PACK_PREP_STATE||{};}
function makeState(){
  const p=prep();
  const ready=!!p.readyForZipPrep;
  const state={build:LABEL,active:true,readyForGameZip:ready,sourceBuild:p.build||"pending",zipName:"game.zip",rootRule:"game/index.html must become index.html at the zip root",command:COMMAND,verifyCommand:VERIFY,copyToUpdateCommand:"Copy-Item .\\game.zip .\\update\\game.zip -Force",commitCommand:"git add game.zip update/game.zip game/version.json update/version.json game/docs && git commit -m \"Update 3.1 game package\" && git push",phase324Chained:true,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_PHASE323_UPDATE31_GAMEZIP_PACKAGE_EXPORT_STATE=state;
  window.SVR_UPDATE31_GAMEZIP_PACKAGE_EXPORT_STATE=state;
  return state;
}
function style(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`#${PANEL_ID}{position:fixed;right:10px;top:calc(92px + env(safe-area-inset-top,0px));z-index:99995;width:min(92vw,390px);border:1px solid rgba(255,217,138,.72);border-radius:16px;background:rgba(3,4,10,.78);color:#e8f4ff;font:700 12px/1.25 system-ui,Arial,sans-serif;padding:10px;box-shadow:0 0 22px rgba(255,217,138,.14);pointer-events:auto}#${PANEL_ID} .t{font-size:13px;color:#ffd98a;font-weight:950;margin-bottom:6px}#${PANEL_ID} code{display:block;white-space:normal;background:rgba(255,255,255,.06);border-radius:8px;padding:6px;margin:5px 0;color:#fff}#${PANEL_ID} button{border:1px solid rgba(127,252,255,.72);border-radius:10px;background:rgba(127,252,255,.12);color:#e8f4ff;font-weight:900;padding:7px 9px}#${PANEL_ID} .ready{color:#8dffb4}#${PANEL_ID} .hold{color:#ffd98a}@media(max-width:720px){#${PANEL_ID}{right:8px;left:8px;top:auto;bottom:8px;width:auto}}`;document.head.appendChild(s);
}
async function copyPlan(){const st=makeState();const text=[st.command,st.verifyCommand,st.copyToUpdateCommand,st.commitCommand].join("\n");try{await navigator.clipboard.writeText(text);status("Update 3.1 package commands copied");}catch(e){prompt("Copy package commands",text);}return st;}
function draw(){style();const st=makeState();let p=document.getElementById(PANEL_ID);if(!p){p=document.createElement("div");p.id=PANEL_ID;document.body.appendChild(p);}p.innerHTML=`<div class="t">UPDATE 3.1 GAME.ZIP EXPORT</div><div class="${st.readyForGameZip?'ready':'hold'}">${st.readyForGameZip?'READY':'WAITING ON QA READY STATE'}</div><code>${st.command}</code><code>${st.copyToUpdateCommand}</code><button type="button" id="svr-phase323-copy">Copy Commands</button>`;p.querySelector("#svr-phase323-copy")?.addEventListener("click",copyPlan);return st;}
function audit(){const st=draw();try{window.dispatchEvent(new CustomEvent("svr-update31-gamezip-package-export",{detail:st}));}catch{}status(st.readyForGameZip?"Update 3.1 game.zip export ready":"Update 3.1 package export waiting on QA");return st;}
function install(){
  if(installed)return true;installed=true;
  window.addEventListener("svr-update31-final-prep",()=>setTimeout(audit,120));
  window.SVR_PHASE323_COPY_UPDATE31_PACKAGE_COMMANDS=copyPlan;
  window.SVR_PHASE323_AUDIT_UPDATE31_GAMEZIP_EXPORT=audit;
  window.SVR_PHASE323_UPDATE31_GAMEZIP_PACKAGE_EXPORT_LOCK={build:LABEL,active:true,source:"SVR_UPDATE31_FINAL_PACK_PREP_STATE",zipName:"game.zip",phase324Chained:true,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;audit();return true;
}
install();setInterval(audit,3000);
import("./phase324_update31_version_sync_recovery_lock.js?v=phase324-version-sync").catch(e=>{window.SVR_PHASE324_IMPORT_ERROR=String(e?.message||e);});
