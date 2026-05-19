// PHASE-111-GAMEPLAY-DEMO-POLISH-LOCK
// Game-side only. Adds a non-invasive demo readiness panel and quick-check flow.
// It does not touch the website or /site files.

const PHASE = "PHASE-111-GAMEPLAY-DEMO-POLISH-LOCK";
let root = null;
let body = null;
let button = null;
let lastSig = "";

function isPreview(){
  const p = new URLSearchParams(location.search);
  return document.body.classList.contains("preview-mode") || p.has("preview") || p.get("cam") === "director";
}
function val(v){ return v ? "YES" : "NO"; }
function good(v){ return v ? "good" : "bad"; }
function audit(){ return window.SVR_PHASE110_RUNTIME_AUDIT || window.SVR_PHASE105_RUNTIME_AUDIT || window.SVR_PHASE98_RUNTIME_AUDIT || null; }
function perf(){ return window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR?.metrics?.() || null; }
function poker(){ return window.SVR_PLAYABLE_POKER?.getState?.() || null; }
function routes(){ return window.SVR_PHASE104_PRIVATE_ROUTE_GUARD?.audit || null; }
function createStyle(){
  if (document.getElementById("svr-demo-polish-style")) return;
  const s = document.createElement("style");
  s.id = "svr-demo-polish-style";
  s.textContent = `
    #svrDemoBtn{position:fixed;left:50%;bottom:66px;transform:translateX(-50%);z-index:47;border:1px solid rgba(246,226,127,.62);border-radius:999px;background:rgba(5,8,16,.76);color:#f6e27f;padding:8px 13px;font:900 11px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.42)}
    #svrDemoPanel{position:fixed;left:50%;bottom:108px;transform:translateX(-50%);z-index:47;width:min(520px,calc(100vw - 24px));max-height:min(68vh,590px);overflow:auto;border:1px solid rgba(246,226,127,.44);border-radius:18px;background:linear-gradient(135deg,rgba(5,8,16,.92),rgba(26,12,44,.94));color:#f6f3ff;padding:12px;box-shadow:0 18px 52px rgba(0,0,0,.52);font:12px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;display:none;contain:layout paint style}
    #svrDemoPanel.open{display:block}#svrDemoPanel h3{margin:0 0 8px;color:#f6e27f;font-size:14px;letter-spacing:.12em;text-transform:uppercase}.svr-demo-row{display:flex;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,.08);padding:6px 0}.svr-demo-key{color:rgba(246,243,255,.68)}.svr-demo-val{font-weight:900;text-align:right}.good{color:#7ff5c7}.warn{color:#f6e27f}.bad{color:#ff6b7f}.svr-demo-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.svr-demo-actions button{border:1px solid rgba(127,245,199,.42);border-radius:999px;background:rgba(127,245,199,.08);color:#eafff4;padding:7px 10px;font-weight:900;cursor:pointer}body.preview-mode #svrDemoBtn,body.preview-mode #svrDemoPanel{display:none!important}body.svr-low-perf #svrDemoBtn,body.svr-low-perf #svrDemoPanel{box-shadow:none;backdrop-filter:none}`;
  document.head.appendChild(s);
}
function make(){
  if (root || isPreview()) return;
  createStyle();
  button = document.createElement("button");
  button.id = "svrDemoBtn";
  button.type = "button";
  button.textContent = "DEMO READY";
  root = document.createElement("section");
  root.id = "svrDemoPanel";
  root.innerHTML = `<h3>SVR Demo Readiness</h3><div id="svrDemoBody"></div>`;
  body = root.querySelector("#svrDemoBody");
  document.body.append(button, root);
  button.addEventListener("click", ()=>root.classList.toggle("open"));
  document.addEventListener("keydown", e=>{ if(e.code === "KeyD" && e.shiftKey){ e.preventDefault(); root.classList.toggle("open"); }});
}
function row(k,v,c=""){ return `<div class="svr-demo-row"><span class="svr-demo-key">${k}</span><span class="svr-demo-val ${c}">${v}</span></div>`; }
function report(){
  const a = audit();
  const p = perf();
  const ps = poker();
  const r = routes();
  const missing = a?.missingGlobals?.length || 0;
  const blocked = a?.blockedApprovalTermsPresent?.length || 0;
  const routeMissing = r?.missingRoutes?.length || 0;
  const ok = !!a?.ok && missing === 0 && blocked === 0;
  return { a,p,ps,r,missing,blocked,routeMissing,ok };
}
function render(){
  if (!root) make();
  if (!body) return;
  const q = report();
  const sig = JSON.stringify({ a:q.a?.timestamp, p:q.p?.fps, s:q.ps?.street, pot:q.ps?.pot, r:q.routeMissing, m:q.missing, b:q.blocked, ok:q.ok });
  if (sig === lastSig) return;
  lastSig = sig;
  button.textContent = q.ok ? "DEMO OK" : "DEMO CHECK";
  button.classList.toggle("bad", !q.ok);
  body.innerHTML = [
    row("Phase", PHASE),
    row("Audit", q.a?.phase || "waiting", q.a?.ok ? "good" : "warn"),
    row("Site touched", val(q.a?.siteTouched), q.a?.siteTouched ? "bad" : "good"),
    row("Missing modules", q.missing || "none", q.missing ? "bad" : "good"),
    row("Approval blocked terms", q.blocked || "none", q.blocked ? "bad" : "good"),
    row("Private route missing", q.routeMissing || "none", q.routeMissing ? "warn" : "good"),
    row("Poker", q.ps ? `${String(q.ps.street || "ready").toUpperCase()} • Pot $${q.ps.pot || 0}` : "waiting", q.ps ? "good" : "warn"),
    row("Performance", q.p ? `${q.p.status} • ${q.p.fps} FPS` : "waiting", q.p?.status === "LOW-PERF" ? "bad" : q.p?.status === "WATCH" ? "warn" : "good"),
    row("Cards", val(window.SVR_PHASE101_VISUAL_CARD_MESH_SYNC), good(window.SVR_PHASE101_VISUAL_CARD_MESH_SYNC)),
    row("Chips", val(window.SVR_PHASE102_CHIP_MOTION_FX), good(window.SVR_PHASE102_CHIP_MOTION_FX)),
    row("Watch locks", val(window.SVR_PHASE108_WATCH_POKER_DISABLED_STATES), good(window.SVR_PHASE108_WATCH_POKER_DISABLED_STATES)),
    `<div class="svr-demo-actions"><button id="svrDemoOpenHealth">Open HEALTH</button><button id="svrDemoOpenPerf">Open PERF</button><button id="svrDemoNextHand">Next Hand</button></div>`
  ].join("");
  body.querySelector("#svrDemoOpenHealth")?.addEventListener("click", ()=>window.SVR_PHASE110_RUNTIME_HEALTH_PANEL?.open?.() || window.SVR_PHASE105_RUNTIME_HEALTH_PANEL?.open?.());
  body.querySelector("#svrDemoOpenPerf")?.addEventListener("click", ()=>document.getElementById("svrQuestPerfBody")?.classList.toggle("open"));
  body.querySelector("#svrDemoNextHand")?.addEventListener("click", ()=>window.SVR_PLAYABLE_POKER?.nextHand?.());
}
function boot(){
  make();
  window.SVR_PHASE111_GAMEPLAY_DEMO_POLISH = { phase: PHASE, report, open: ()=>root?.classList.add("open"), close: ()=>root?.classList.remove("open") };
  setInterval(render, 1000);
  setTimeout(render, 600);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
else boot();
