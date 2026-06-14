const LABEL = "UPDATE-3.1-D-QUEST-ALIGNMENT-CONTROL-OVERLAY-FIX";
const logStore = window.SVR_DIAG_LOG = window.SVR_DIAG_LOG || [];
const MAX_LOGS = 30;

function addLog(level, msg){
  logStore.push({ t:new Date().toLocaleTimeString(), level, msg:String(msg||"").slice(0,260) });
  while(logStore.length > MAX_LOGS) logStore.shift();
  window.SVR_LAST_DIAG = logStore[logStore.length-1];
}
function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE223 = { build:LABEL, active:true, diagnosticCaptureOnly:true, visiblePanels:false, supersededBy:"3.1-D" };
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, { build:LABEL, active:true, phase:"3.1-D", diagnosticPanelsOff:true, questAlignmentFix:true });
  document.title = `SVR Poker • ${LABEL}`;
}
function hook(){
  if(window.SVR_PHASE223_ERROR_HOOKED) return;
  window.SVR_PHASE223_ERROR_HOOKED = true;
  const oldError = console.error.bind(console);
  const oldWarn = console.warn.bind(console);
  console.error = (...a)=>{ oldError(...a); addLog("ERROR", a.map(x=>x?.message||x?.stack||x).join(" ")); };
  console.warn = (...a)=>{ oldWarn(...a); addLog("WARN", a.map(x=>x?.message||x?.stack||x).join(" ")); };
  window.addEventListener("error", e=>addLog("ERROR", e.message || "window error"));
  window.addEventListener("unhandledrejection", e=>addLog("ERROR", e.reason?.message || e.reason || "promise rejection"));
}
function removePanels(){
  document.getElementById("svrDiagPanel")?.remove();
  const scene = window.__SVR_SCENE__;
  if(scene){
    const remove=[];
    scene.traverse(o=>{ if(/DIAG|DIAGNOSTIC|UPDATE31C_WORLD_DIAGNOSTIC_PANEL/i.test(String(o.name||""))) remove.push(o); });
    remove.forEach(o=>o.parent?.remove(o));
  }
}
function install(){
  stamp(); hook(); removePanels();
  if(!window.SVR_PHASE223_BOOT_LOGGED){ window.SVR_PHASE223_BOOT_LOGGED=true; addLog("INFO","Update 3.1-D diagnostic capture only; visible panels off"); }
}
install();
[250,800,1800,3500,7000].forEach(ms=>setTimeout(install,ms));
