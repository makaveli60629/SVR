import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-223-PHASE-DISPLAY-DIAG-ERROR-LOG-LOCK";
const MAX = 24;
const logStore = window.SVR_DIAG_LOG = window.SVR_DIAG_LOG || [];

function now(){ return new Date().toLocaleTimeString(); }
function push(level, msg, detail=""){
  const text = String(msg || "").slice(0, 260);
  const row = { t: now(), level, text, detail: String(detail || "").slice(0, 400) };
  logStore.push(row);
  while(logStore.length > MAX) logStore.shift();
  window.SVR_LAST_DIAG = row;
  renderDom();
  updateSceneTexture();
}

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE223 = {
    build: LABEL,
    active: true,
    phaseDisplay: true,
    diagLog: true,
    catchesErrors: true,
    scenePanel: true,
    domPanel: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
}

function makeDom(){
  let panel = document.getElementById("svrDiagPanel");
  if(panel) return panel;
  panel = document.createElement("div");
  panel.id = "svrDiagPanel";
  panel.style.cssText = [
    "position:fixed","left:10px","bottom:10px","z-index:2147483647","width:min(520px,calc(100vw - 20px))","max-height:42vh","overflow:hidden",
    "background:rgba(2,4,12,.86)","color:#eaf8ff","border:1px solid rgba(127,252,255,.72)","box-shadow:0 0 18px rgba(127,252,255,.22)",
    "border-radius:12px","font:12px/1.35 ui-monospace,Consolas,monospace","padding:10px","pointer-events:auto","display:block","visibility:visible","opacity:1"
  ].join(";");
  document.body.appendChild(panel);
  return panel;
}

function renderDom(){
  const panel = makeDom();
  const modules = ["211","212","213","214","215","207","216","217","218","219","220","222","223"].filter(p=>{
    if(p==="207") return window.SVR_PHASE207 || window.SVR_PHASE207_CITY_INSTALLED;
    return window[`SVR_PHASE${p}`] || window[`SVR_PHASE${p}_CITY_DEPTH_INSTALLED`] || window[`SVR_PHASE${p}_MOON_SKY_ANCHOR_INSTALLED`];
  }).join(" ");
  const rows = logStore.slice(-10).reverse().map(r=>{
    const color = r.level === "ERROR" ? "#ff8d8d" : r.level === "WARN" ? "#ffd98a" : "#9fffd0";
    return `<div style="border-top:1px solid rgba(255,255,255,.08);padding-top:3px;margin-top:3px"><b style="color:${color}">[${r.level}]</b> ${r.t} ${escapeHtml(r.text)}</div>`;
  }).join("") || `<div style="color:#9fffd0">No captured errors yet.</div>`;
  panel.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:6px">
      <b style="color:#7ffcff">SVR DIAG</b>
      <button id="svrDiagHide" style="background:#111827;color:#fff;border:1px solid #7ffcff;border-radius:8px;padding:2px 8px">hide</button>
    </div>
    <div><b>PHASE:</b> ${LABEL}</div>
    <div><b>MODULES:</b> ${modules || "waiting"}</div>
    <div><b>ERRORS:</b> ${logStore.filter(x=>x.level==="ERROR").length} <b>WARN:</b> ${logStore.filter(x=>x.level==="WARN").length}</div>
    <div style="margin-top:6px">${rows}</div>
  `;
  const hide = document.getElementById("svrDiagHide");
  if(hide) hide.onclick = ()=>{ panel.style.display="none"; window.SVR_DIAG_VISIBLE=false; };
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m])); }

function hookErrors(){
  if(window.SVR_PHASE223_ERROR_HOOKED) return;
  window.SVR_PHASE223_ERROR_HOOKED = true;
  const oldError = console.error.bind(console);
  const oldWarn = console.warn.bind(console);
  console.error = (...args)=>{ oldError(...args); push("ERROR", args.map(a=>a?.stack || a?.message || a).join(" ")); };
  console.warn = (...args)=>{ oldWarn(...args); push("WARN", args.map(a=>a?.stack || a?.message || a).join(" ")); };
  window.addEventListener("error", e=>push("ERROR", e.message || "window error", `${e.filename||""}:${e.lineno||0}:${e.colno||0}`));
  window.addEventListener("unhandledrejection", e=>push("ERROR", "unhandled promise rejection", e.reason?.stack || e.reason?.message || e.reason));
  document.addEventListener("keydown", e=>{
    if(String(e.key).toLowerCase()==="d"){
      const p = makeDom();
      const show = p.style.display === "none";
      p.style.display = show ? "block" : "none";
      window.SVR_DIAG_VISIBLE = show;
      renderDom();
    }
  });
}

let diagCanvas, diagCtx, diagTexture, diagMesh;
function makeScenePanel(){
  const scene = window.__SVR_SCENE__;
  if(!scene || diagMesh) return !!diagMesh;
  diagCanvas = document.createElement("canvas");
  diagCanvas.width = 1024;
  diagCanvas.height = 512;
  diagCtx = diagCanvas.getContext("2d");
  diagTexture = new THREE.CanvasTexture(diagCanvas);
  diagTexture.colorSpace = THREE.SRGBColorSpace;
  diagMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.6,2.3), new THREE.MeshBasicMaterial({ map:diagTexture, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  diagMesh.name = "PHASE223_WORLD_DIAGNOSTIC_PANEL_NOT_CAMERA_ATTACHED";
  diagMesh.position.set(-7.2,2.55,-6.2);
  diagMesh.rotation.y = Math.PI * .16;
  diagMesh.renderOrder = 90;
  scene.add(diagMesh);
  updateSceneTexture();
  return true;
}

function updateSceneTexture(){
  if(!diagCtx || !diagTexture) return;
  const ctx = diagCtx, w = diagCanvas.width, h = diagCanvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "rgba(2,4,12,.92)"; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = "#7ffcff"; ctx.lineWidth = 8; ctx.strokeRect(8,8,w-16,h-16);
  ctx.fillStyle = "#7ffcff"; ctx.font = "900 38px Consolas,monospace"; ctx.fillText("SVR PHASE / DIAG", 34, 58);
  ctx.fillStyle = "#ffffff"; ctx.font = "700 25px Consolas,monospace"; ctx.fillText(LABEL, 34, 98);
  ctx.fillStyle = "#ffd98a"; ctx.fillText(`Errors: ${logStore.filter(x=>x.level==="ERROR").length}   Warnings: ${logStore.filter(x=>x.level==="WARN").length}`, 34, 134);
  ctx.fillStyle = "#9fffd0"; ctx.font = "600 22px Consolas,monospace"; ctx.fillText(`Scene: ${window.__SVR_SCENE__ ? "ready" : "waiting"}   Renderer: ${window.__SVR_RENDERER__ ? "ready" : "waiting"}`, 34, 168);
  let y = 214;
  logStore.slice(-8).reverse().forEach(r=>{
    ctx.fillStyle = r.level === "ERROR" ? "#ff8d8d" : r.level === "WARN" ? "#ffd98a" : "#9fffd0";
    ctx.fillText(`[${r.level}] ${r.t}`, 34, y);
    ctx.fillStyle = "#ffffff";
    const text = r.text.length > 82 ? r.text.slice(0,82) + "..." : r.text;
    ctx.fillText(text, 34, y+28);
    y += 58;
  });
  if(logStore.length===0){ ctx.fillStyle="#9fffd0"; ctx.fillText("No captured errors yet. Press D to hide/show DOM panel.",34,224); }
  diagTexture.needsUpdate = true;
}

function install(){
  stamp();
  hookErrors();
  renderDom();
  makeScenePanel();
  updateSceneTexture();
  if(!window.SVR_PHASE223_BOOT_LOGGED){ window.SVR_PHASE223_BOOT_LOGGED = true; push("INFO", "Phase display and diagnostic log active"); }
  return true;
}

install();
setInterval(install, 1500);
[250,800,1800,3500,7000].forEach(ms=>setTimeout(install,ms));
