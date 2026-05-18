// PHASE-97-RUNTIME-HEALTH-PANEL-LOCK
// Game-side only. Adds a lightweight in-game health panel so the current runtime
// audit can be checked without opening the browser console. No website/site edits.

const PHASE = "PHASE-97-RUNTIME-HEALTH-PANEL-LOCK";
const UPDATE_MS = 1000;
let root = null;
let body = null;
let statusDot = null;
let toggle = null;
let lastSig = "";

function isPreview(){
  const params = new URLSearchParams(location.search);
  return document.body.classList.contains("preview-mode") || params.has("preview") || params.get("cam") === "director";
}

function injectStyle(){
  if (document.getElementById("svr-health-panel-style")) return;
  const style = document.createElement("style");
  style.id = "svr-health-panel-style";
  style.textContent = `
    #svrHealthPanelToggle {
      position: fixed;
      left: 12px;
      bottom: 66px;
      z-index: 46;
      border: 1px solid rgba(127,245,199,.48);
      border-radius: 999px;
      padding: 7px 11px;
      background: rgba(3,8,14,.72);
      color: #eafff4;
      font: 800 11px/1 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      pointer-events: auto;
      cursor: pointer;
      box-shadow: 0 10px 30px rgba(0,0,0,.42);
    }
    #svrHealthPanelToggle .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
      background: #7ff5c7;
      box-shadow: 0 0 12px rgba(127,245,199,.75);
    }
    #svrHealthPanelToggle.svr-warn .dot { background: #f6e27f; box-shadow: 0 0 12px rgba(246,226,127,.75); }
    #svrHealthPanelToggle.svr-bad .dot { background: #ff6b7f; box-shadow: 0 0 12px rgba(255,107,127,.75); }
    #svrHealthPanel {
      position: fixed;
      left: 12px;
      bottom: 108px;
      z-index: 45;
      width: min(430px, calc(100vw - 24px));
      max-height: min(62vh, 520px);
      overflow: auto;
      border: 1px solid rgba(180,140,255,.46);
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(4,8,16,.91), rgba(24,9,42,.92));
      color: #f5f2ff;
      box-shadow: 0 18px 50px rgba(0,0,0,.48);
      backdrop-filter: blur(10px);
      padding: 12px;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      pointer-events: auto;
      display: none;
      contain: layout paint style;
    }
    #svrHealthPanel.svr-open { display: block; }
    #svrHealthPanel h3 { margin: 0 0 8px; font-size: 14px; letter-spacing: .10em; text-transform: uppercase; color: #7ff5c7; }
    #svrHealthPanel .line { display:flex; justify-content:space-between; gap:12px; border-top:1px solid rgba(255,255,255,.08); padding:6px 0; font-size:12px; }
    #svrHealthPanel .key { color:rgba(245,242,255,.68); }
    #svrHealthPanel .val { text-align:right; font-weight:800; color:#fff; word-break:break-word; }
    #svrHealthPanel .good { color:#7ff5c7; }
    #svrHealthPanel .warn { color:#f6e27f; }
    #svrHealthPanel .bad { color:#ff6b7f; }
    body.preview-mode #svrHealthPanel,
    body.preview-mode #svrHealthPanelToggle { display:none !important; }
    body.svr-low-perf #svrHealthPanel,
    body.svr-low-perf #svrHealthPanelToggle { backdrop-filter:none; box-shadow:0 8px 20px rgba(0,0,0,.38); }
  `;
  document.head.appendChild(style);
}

function makePanel(){
  injectStyle();
  toggle = document.createElement("button");
  toggle.id = "svrHealthPanelToggle";
  toggle.type = "button";
  toggle.innerHTML = `<span class="dot"></span>HEALTH`;
  document.body.appendChild(toggle);

  root = document.createElement("section");
  root.id = "svrHealthPanel";
  root.setAttribute("aria-label", "SVR runtime health panel");
  root.innerHTML = `<h3>SVR Runtime Health</h3><div id="svrHealthPanelBody"></div>`;
  body = root.querySelector("#svrHealthPanelBody");
  document.body.appendChild(root);

  statusDot = toggle.querySelector(".dot");
  toggle.addEventListener("click", (event)=>{
    event.preventDefault();
    event.stopPropagation();
    root.classList.toggle("svr-open");
  });
}

function audit(){
  return window.SVR_PHASE96_RUNTIME_AUDIT || window.SVR_PHASE94_RUNTIME_AUDIT || window.SVR_PHASE93_RUNTIME_AUDIT || null;
}
function yesNo(v){ return v ? "YES" : "NO"; }
function safeList(list){ return Array.isArray(list) && list.length ? list.map(item => typeof item === "string" ? item : item.label || item.key || JSON.stringify(item)).join(", ") : "none"; }
function clsForAudit(a){
  if (!a) return "svr-warn";
  if (a.ok) return "";
  if ((a.blockedApprovalTermsPresent || []).length || (a.missingGlobals || []).length) return "svr-bad";
  return "svr-warn";
}
function statusText(a){
  if (!a) return "WAITING";
  return a.ok ? "OK" : "CHECK";
}
function render(){
  if (isPreview()) return;
  if (!root) makePanel();
  const a = audit();
  const modules = a?.modules || {};
  const cls = clsForAudit(a);
  toggle.classList.toggle("svr-warn", cls === "svr-warn");
  toggle.classList.toggle("svr-bad", cls === "svr-bad");
  toggle.childNodes[toggle.childNodes.length - 1].textContent = ` ${statusText(a)}`;
  const sig = JSON.stringify(a || {});
  if (sig === lastSig) return;
  lastSig = sig;
  const okClass = a?.ok ? "good" : "warn";
  body.innerHTML = `
    <div class="line"><span class="key">Panel phase</span><span class="val">${PHASE}</span></div>
    <div class="line"><span class="key">Audit phase</span><span class="val">${a?.phase || "waiting"}</span></div>
    <div class="line"><span class="key">Status</span><span class="val ${okClass}">${a?.ok ? "OK" : "CHECK"}</span></div>
    <div class="line"><span class="key">Site touched</span><span class="val ${a?.siteTouched ? "bad" : "good"}">${yesNo(a?.siteTouched)}</span></div>
    <div class="line"><span class="key">Missing modules</span><span class="val ${(a?.missingGlobals || []).length ? "bad" : "good"}">${safeList(a?.missingGlobals)}</span></div>
    <div class="line"><span class="key">Missing routes</span><span class="val ${(a?.missingSceneButtons || []).length ? "warn" : "good"}">${safeList(a?.missingSceneButtons)}</span></div>
    <div class="line"><span class="key">Blocked approval terms</span><span class="val ${(a?.blockedApprovalTermsPresent || []).length ? "bad" : "good"}">${safeList(a?.blockedApprovalTermsPresent)}</span></div>
    <div class="line"><span class="key">Stale labels</span><span class="val ${(a?.stalePhaseLabels || []).length ? "warn" : "good"}">${safeList(a?.stalePhaseLabels)}</span></div>
    <div class="line"><span class="key">Poker</span><span class="val ${modules.poker ? "good" : "bad"}">${modules.poker ? `${modules.pokerStreet || "ready"} / pot $${modules.pokerPot ?? 0}` : "missing"}</span></div>
    <div class="line"><span class="key">HUD / FX</span><span class="val">HUD ${yesNo(modules.pokerHud)} • Table ${yesNo(modules.tableFx)} • NPC ${yesNo(modules.npcFx)} • Feedback ${yesNo(modules.feedbackFx)}</span></div>
    <div class="line"><span class="key">Low perf mode</span><span class="val ${modules.lowPerf ? "warn" : "good"}">${yesNo(modules.lowPerf)}</span></div>
    <div class="line"><span class="key">Last audit</span><span class="val">${a?.timestamp || "waiting"}</span></div>
  `;
}
function boot(){
  if (window.SVR_PHASE97_RUNTIME_HEALTH_PANEL) return;
  makePanel();
  window.SVR_PHASE97_RUNTIME_HEALTH_PANEL = { phase: PHASE, render, open: () => root?.classList.add("svr-open"), close: () => root?.classList.remove("svr-open") };
  const loop = () => {
    render();
    setTimeout(loop, UPDATE_MS);
  };
  setTimeout(loop, 400);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
