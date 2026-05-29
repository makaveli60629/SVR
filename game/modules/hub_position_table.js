import * as THREE from "three";

const PHASE103 = "PHASE-103-DESKTOP-HUB-POSITION-TABLE-FIX";
const pos = new THREE.Vector3();
const dir = new THREE.Vector3();
let latestScene = null;
let latestCamera = null;
let latestRenderer = null;
let overlay = null;
let tbody = null;
let coordLine = null;
let headingLine = null;
let nearestLine = null;
let copyButton = null;
let visible = true;
let lastCopyText = "";

function fmt(n){ return Number.isFinite(n) ? n.toFixed(2) : "0.00"; }
function meters(n){ return Number.isFinite(n) ? `${n.toFixed(2)}m` : "--"; }
function headingFromDir(v){
  const angle = Math.atan2(v.x, v.z) * 180 / Math.PI;
  const normalized = (angle + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return { deg: normalized, label: "South / front" };
  if (normalized < 67.5) return { deg: normalized, label: "South-East" };
  if (normalized < 112.5) return { deg: normalized, label: "East / right" };
  if (normalized < 157.5) return { deg: normalized, label: "North-East" };
  if (normalized < 202.5) return { deg: normalized, label: "North / back" };
  if (normalized < 247.5) return { deg: normalized, label: "North-West" };
  if (normalized < 292.5) return { deg: normalized, label: "West / left" };
  return { deg: normalized, label: "South-West" };
}

function buildOverlay(){
  if (overlay) return;
  overlay = document.createElement("div");
  overlay.id = "svr-hub-position-table";
  overlay.innerHTML = `
    <div class="svr-pos-head"><strong>HUB POSITION TABLE</strong><span>${PHASE103}</span></div>
    <div class="svr-pos-grid">
      <div><b>Current position</b><span id="svr-pos-coord">Waiting for camera…</span></div>
      <div><b>Facing</b><span id="svr-pos-heading">--</span></div>
      <div><b>Nearest portal</b><span id="svr-pos-nearest">--</span></div>
    </div>
    <table><thead><tr><th>Portal / object</th><th>X</th><th>Y</th><th>Z</th><th>Distance</th></tr></thead><tbody></tbody></table>
    <div class="svr-pos-actions"><button id="svr-copy-position">Copy current placement note</button><span>Press <b>P</b> to hide/show. Use X/Z for portal placement.</span></div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #svr-hub-position-table{position:fixed;right:14px;top:70px;width:min(420px,calc(100vw - 28px));z-index:30;color:#eafff4;background:rgba(0,7,12,.72);border:1px solid rgba(127,245,199,.52);border-radius:16px;box-shadow:0 20px 70px rgba(0,0,0,.48);backdrop-filter:blur(10px);font:12px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;overflow:hidden;pointer-events:auto;}
    body.preview-mode #svr-hub-position-table{display:none!important;}
    #svr-hub-position-table .svr-pos-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;background:rgba(16,255,190,.10);border-bottom:1px solid rgba(127,245,199,.28)}
    #svr-hub-position-table .svr-pos-head strong{font-size:13px;letter-spacing:.06em;color:#fff;}#svr-hub-position-table .svr-pos-head span{font-size:10px;color:rgba(234,255,244,.70);text-align:right;}
    #svr-hub-position-table .svr-pos-grid{display:grid;grid-template-columns:1fr;gap:6px;padding:10px 12px;border-bottom:1px solid rgba(127,245,199,.18)}#svr-hub-position-table .svr-pos-grid div{display:flex;justify-content:space-between;gap:12px;}#svr-hub-position-table b{color:#9effee;}
    #svr-hub-position-table table{width:100%;border-collapse:collapse;}#svr-hub-position-table th,#svr-hub-position-table td{padding:6px 8px;border-bottom:1px solid rgba(127,245,199,.12);text-align:right;white-space:nowrap;}#svr-hub-position-table th:first-child,#svr-hub-position-table td:first-child{text-align:left;max-width:160px;overflow:hidden;text-overflow:ellipsis;}#svr-hub-position-table th{font-size:11px;color:#9effee;background:rgba(0,0,0,.24);}#svr-hub-position-table td{color:#effff9;}
    #svr-hub-position-table .svr-pos-actions{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:10px 12px;}#svr-hub-position-table button{background:rgba(127,245,199,.16);border:1px solid rgba(127,245,199,.50);color:#fff;border-radius:999px;padding:6px 9px;cursor:pointer;font:12px system-ui;}#svr-hub-position-table button:hover{background:rgba(127,245,199,.25);}#svr-hub-position-table .svr-pos-actions span{color:rgba(234,255,244,.72);font-size:11px;text-align:right;}
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  tbody = overlay.querySelector("tbody");
  coordLine = overlay.querySelector("#svr-pos-coord");
  headingLine = overlay.querySelector("#svr-pos-heading");
  nearestLine = overlay.querySelector("#svr-pos-nearest");
  copyButton = overlay.querySelector("#svr-copy-position");
  copyButton?.addEventListener("click", async ()=>{try{await navigator.clipboard.writeText(lastCopyText);copyButton.textContent="Copied";setTimeout(()=>copyButton.textContent="Copy current placement note",900);}catch{console.log(lastCopyText);copyButton.textContent="Logged";setTimeout(()=>copyButton.textContent="Copy current placement note",900);}});
  window.addEventListener("keydown", (e)=>{if(e.code!=="KeyP"||e.repeat)return;visible=!visible;overlay.style.display=visible?"block":"none";});
}

function getScene(){ return latestScene || window.__SVR_HUB_DEBUG?.scene || window.__SVR_GAME_SCENE || null; }
function getCamera(){
  const scene = getScene();
  const renderer = latestRenderer || window.__SVR_HUB_DEBUG?.renderer || null;
  const baseCam = latestCamera || window.__SVR_HUB_DEBUG?.camera || scene?.userData?._camera || window.__SVR_GAME_CAMERA || null;
  if (renderer?.xr?.isPresenting && baseCam) return renderer.xr.getCamera(baseCam);
  return baseCam;
}
function collectPortals(scene){
  const rows=[]; if(!scene?.traverse)return rows;
  scene.traverse((obj)=>{if(!obj?.position)return;const name=String(obj.name||"");const key=obj.userData?.portalKey;const isPortal=key||/^PORTAL_/.test(name);if(!isPortal)return;const p=new THREE.Vector3();obj.getWorldPosition(p);rows.push({name:key?`PORTAL_${key}`:name,x:p.x,y:p.y,z:p.z,d:p.distanceTo(pos)});});
  rows.sort((a,b)=>a.d-b.d);return rows.slice(0,8);
}
function updateOverlay(){
  if(!visible)return; buildOverlay();
  const scene=getScene(); const cam=getCamera();
  if(!scene||!cam){coordLine.textContent="Waiting for scene/camera…";return;}
  cam.updateWorldMatrix?.(true,false); cam.getWorldPosition(pos); cam.getWorldDirection(dir);
  const heading=headingFromDir(dir);
  coordLine.textContent=`X ${fmt(pos.x)} / Y ${fmt(pos.y)} / Z ${fmt(pos.z)}`;
  headingLine.textContent=`${heading.label} (${heading.deg.toFixed(0)}°)`;
  const rows=collectPortals(scene); const nearest=rows[0];
  nearestLine.textContent=nearest?`${nearest.name} • ${meters(nearest.d)}`:"No portal objects detected yet";
  lastCopyText=`PLACE PORTAL HERE: X ${fmt(pos.x)}, Y ${fmt(pos.y)}, Z ${fmt(pos.z)} | Facing ${heading.label} ${heading.deg.toFixed(0)}°`;
  tbody.innerHTML=rows.map(r=>`<tr><td>${r.name}</td><td>${fmt(r.x)}</td><td>${fmt(r.y)}</td><td>${fmt(r.z)}</td><td>${meters(r.d)}</td></tr>`).join("")||`<tr><td colspan="5">Walk in the lobby. Portal coordinates will appear here.</td></tr>`;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrHubPositionTablePatched){
  THREE.WebGLRenderer.prototype.__svrHubPositionTablePatched=true;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){latestScene=scene;latestCamera=camera;latestRenderer=this;window.__SVR_HUB_DEBUG={scene,camera,renderer:this};return originalRender.call(this,scene,camera);};
  const originalSceneAdd=THREE.Scene.prototype.add;
  if(!THREE.Scene.prototype.__svrHubPositionScenePatched){THREE.Scene.prototype.__svrHubPositionScenePatched=true;THREE.Scene.prototype.add=function(...objects){latestScene=this;window.__SVR_GAME_SCENE=this;return originalSceneAdd.apply(this,objects);};}
  buildOverlay(); setInterval(updateOverlay,160); console.log(`[${PHASE103}] desktop hub position table fixed`);
}
