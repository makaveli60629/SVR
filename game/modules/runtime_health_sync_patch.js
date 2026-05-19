// PHASE-113-HEALTH-PERF-DEMO-SYNC-PATCH-LOCK
// Game-side only. Small sync layer that links HEALTH, PERF, and DEMO status
// without replacing the lobby or touching website/site files.

const PHASE = "PHASE-113-HEALTH-PERF-DEMO-SYNC-PATCH-LOCK";
const UPDATE_MS = 900;
let lastSig = "";

function audit(){ return window.SVR_PHASE112_RUNTIME_AUDIT || window.SVR_PHASE110_RUNTIME_AUDIT || window.SVR_PHASE105_RUNTIME_AUDIT || window.SVR_PHASE98_RUNTIME_AUDIT || null; }
function perf(){ return window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR?.metrics?.() || null; }
function demo(){ return window.SVR_PHASE111_GAMEPLAY_DEMO_POLISH?.report?.() || null; }
function yes(v){ return v ? "YES" : "NO"; }
function status(){
  const a = audit();
  const p = perf();
  const d = demo();
  const missing = a?.missingGlobals?.length || 0;
  const blocked = a?.blockedApprovalTermsPresent?.length || 0;
  const routeMissing = a?.modules?.privateMissingRoutes?.length || d?.routeMissing || 0;
  const perfBad = p?.status === "LOW-PERF";
  const ok = !!a?.ok && missing === 0 && blocked === 0 && !perfBad;
  return { phase: PHASE, ok, auditPhase: a?.phase || "waiting", perfStatus: p?.status || "waiting", fps: p?.fps || 0, demoOk: d ? !!d.ok : null, missing, blocked, routeMissing, siteTouched: !!a?.siteTouched, timestamp: new Date().toISOString() };
}
function row(label, value, cls = ""){
  return `<div class="line svr-phase113-sync-row"><span class="key">${label}</span><span class="val ${cls}">${value}</span></div>`;
}
function patchHealthPanel(){
  const body = document.getElementById("svrHealthPanelBody");
  if (!body) return;
  const s = status();
  const sig = JSON.stringify(s);
  if (sig === lastSig && body.querySelector(".svr-phase113-sync-row")) return;
  lastSig = sig;
  body.querySelectorAll(".svr-phase113-sync-row").forEach(el => el.remove());
  const cls = s.ok ? "good" : "warn";
  const html = [
    row("Phase 113 sync", s.ok ? "OK" : "CHECK", cls),
    row("Audit / PERF / DEMO", `${s.auditPhase} • ${s.perfStatus} ${s.fps ? `• ${s.fps} FPS` : ""} • Demo ${s.demoOk === null ? "WAIT" : yes(s.demoOk)}`, cls),
    row("Site touched", yes(s.siteTouched), s.siteTouched ? "bad" : "good")
  ].join("");
  body.insertAdjacentHTML("afterbegin", html);
}
function syncLabel(){
  document.documentElement.dataset.svrPhase113Sync = PHASE;
  window.SVR_CURRENT_GAME_PHASE_SYNC = PHASE;
}
function loop(){
  syncLabel();
  patchHealthPanel();
  setTimeout(loop, UPDATE_MS);
}
function boot(){
  window.SVR_PHASE113_RUNTIME_HEALTH_SYNC = { phase: PHASE, status, patchHealthPanel };
  syncLabel();
  setTimeout(loop, 450);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
else boot();
