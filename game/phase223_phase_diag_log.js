import * as THREE from "three";

const LABEL = "UPDATE-3.1-B-LOBBY-STRUCTURE-COMPLETION-LOCK";
const logStore = window.SVR_DIAG_LOG = window.SVR_DIAG_LOG || [];
const MAX_LOGS = 30;
let panelMesh = null;
let panelCanvas = null;
let panelCtx = null;
let panelTexture = null;

function addLog(level, msg){
  logStore.push({ t:new Date().toLocaleTimeString(), level, msg:String(msg||"").slice(0,260) });
  while(logStore.length > MAX_LOGS) logStore.shift();
  window.SVR_LAST_DIAG = logStore[logStore.length-1];
  drawDom();
  drawWorld();
}

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_CURRENT_BUILD = LABEL;
  window.SVR_CURRENT_UPDATE = "3.1";
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE223 = { build:LABEL, active:true, phaseDisplay:true, diagLog:true, update31Synced:true };
  window.SVR_UPDATE31 = Object.assign(window.SVR_UPDATE31 || {}, { build:LABEL, active:true, phase:"3.1-B", diagnosticSynced:true });
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
  document.addEventListener("keydown", e=>{
    if(String(e.key).toLowerCase()==="d"){
      const p = ensureDom();
      p.style.display = p.style.display === "none" ? "block" : "none";
    }
  });
}

function ensureDom(){
  let p = document.getElementById("svrDiagPanel");
  if(p) return p;
  p = document.createElement("div");
  p.id = "svrDiagPanel";
  p.style.cssText = "position:fixed;left:10px;bottom:10px;z-index:2147483647;width:min(560px,calc(100vw - 20px));max-height:45vh;overflow:auto;background:rgba(2,4,12,.88);color:#eaf8ff;border:1px solid #7ffcff;border-radius:12px;padding:10px;font:12px ui-monospace,Consolas,monospace";
  document.body.appendChild(p);
  return p;
}

function drawDom(){
  const p = ensureDom();
  const mods = ["211","212","213","214","215","207","216","217","218","219","220","222","223","31B"].filter(x=>x==="31B"?window.SVR_UPDATE31:window[`SVR_PHASE${x}`]).join(" ");
  const rows = logStore.slice(-10).reverse().map(r=>`<div><b>[${r.level}]</b> ${r.t} ${escape(r.msg)}</div>`).join("");
  p.innerHTML = `<b style="color:#7ffcff">SVR DIAG</b><button style="float:right" onclick="this.parentElement.style.display='none'">hide</button><br><b>PHASE:</b> ${LABEL}<br><b>MODULES:</b> ${mods||"waiting"}<br><b>POS:</b> ${posText()}<br><b>ERRORS:</b> ${logStore.filter(x=>x.level==="ERROR").length} <b>WARN:</b> ${logStore.filter(x=>x.level==="WARN").length}<hr>${rows||"No captured errors."}`;
}

function escape(s){ return String(s).replace(/[&<>]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])); }
function posText(){
  const cam = window.__SVR_CAMERA__;
  if(!cam) return "camera waiting";
  const p = cam.position;
  return `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
}

function ensureWorld(){
  const scene = window.__SVR_SCENE__;
  if(!scene || panelMesh) return;
  panelCanvas = document.createElement("canvas");
  panelCanvas.width = 1024; panelCanvas.height = 512;
  panelCtx = panelCanvas.getContext("2d");
  panelTexture = new THREE.CanvasTexture(panelCanvas);
  panelTexture.colorSpace = THREE.SRGBColorSpace;
  panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8,2.4), new THREE.MeshBasicMaterial({map:panelTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panelMesh.name = "UPDATE31B_WORLD_DIAGNOSTIC_PANEL_NOT_CAMERA_ATTACHED";
  panelMesh.position.set(-7.4,2.55,-6.2);
  panelMesh.rotation.y = Math.PI*.16;
  scene.add(panelMesh);
}

function drawWorld(){
  ensureWorld();
  if(!panelCtx || !panelTexture) return;
  const c=panelCanvas, ctx=panelCtx;
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle="rgba(2,4,12,.92)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle="#7ffcff"; ctx.lineWidth=8; ctx.strokeRect(8,8,c.width-16,c.height-16);
  ctx.fillStyle="#7ffcff"; ctx.font="900 36px Consolas"; ctx.fillText("SVR DIAG",34,58);
  ctx.fillStyle="#ffffff"; ctx.font="700 24px Consolas"; ctx.fillText(LABEL,34,98);
  ctx.fillStyle="#ffd98a"; ctx.fillText(`Errors ${logStore.filter(x=>x.level==="ERROR").length}  Warnings ${logStore.filter(x=>x.level==="WARN").length}`,34,136);
  ctx.fillStyle="#9fffd0"; ctx.fillText(`Position ${posText()}`,34,174);
  let y=222;
  logStore.slice(-6).reverse().forEach(r=>{ ctx.fillStyle=r.level==="ERROR"?"#ff8d8d":r.level==="WARN"?"#ffd98a":"#9fffd0"; ctx.fillText(`[${r.level}] ${r.msg.slice(0,72)}`,34,y); y+=42; });
  panelTexture.needsUpdate = true;
}

function install(){
  stamp(); hook(); drawDom(); drawWorld();
  if(!window.SVR_PHASE223_BOOT_LOGGED){ window.SVR_PHASE223_BOOT_LOGGED=true; addLog("INFO","Update 3.1-B diagnostic active"); }
}

install();
setInterval(install,1500);
[250,800,1800,3500,7000].forEach(ms=>setTimeout(install,ms));
