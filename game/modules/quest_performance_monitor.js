// PHASE-110-QUEST-PERFORMANCE-REGRESSION-PASS-LOCK
// Game-side only. Lightweight runtime frame monitor for Quest/browser regression checks.
// It exposes public metrics, updates low-performance mode only after sustained drops,
// and avoids touching website or /site files.

const PHASE = "PHASE-110-QUEST-PERFORMANCE-REGRESSION-PASS-LOCK";
const SAMPLE_WINDOW = 90;
const WARN_MS = 42;
const LOW_MS = 50;
const RECOVER_MS = 34;
const HUD_MS = 1000;

const samples = [];
let lastNow = 0;
let avgMs = 16.7;
let fps = 60;
let worstMs = 16.7;
let lowFrames = 0;
let goodFrames = 0;
let lowPerf = false;
let panel = null;
let body = null;
let lastHud = 0;

function isPreview(){
  const params = new URLSearchParams(location.search);
  return document.body.classList.contains("preview-mode") || params.has("preview") || params.get("cam") === "director";
}
function detectXR(){ return !!document.body.classList.contains("xr-presenting") || !!navigator.xr; }
function updateStats(ms){
  samples.push(ms);
  if (samples.length > SAMPLE_WINDOW) samples.shift();
  const sum = samples.reduce((a,b)=>a+b,0);
  avgMs = sum / Math.max(1, samples.length);
  worstMs = samples.reduce((a,b)=>Math.max(a,b), 0);
  fps = avgMs > 0 ? Math.round(1000 / avgMs) : 0;
  if (avgMs > LOW_MS || worstMs > 90){ lowFrames += 1; goodFrames = 0; }
  else if (avgMs < RECOVER_MS){ goodFrames += 1; lowFrames = Math.max(0, lowFrames - 1); }
  if (!lowPerf && lowFrames > 40) lowPerf = true;
  if (lowPerf && goodFrames > 120) lowPerf = false;
  document.body.classList.toggle("svr-low-perf", lowPerf);
}
function status(){
  if (lowPerf) return "LOW-PERF";
  if (avgMs > WARN_MS) return "WATCH";
  return "OK";
}
function metrics(){
  return {
    phase: PHASE,
    fps,
    avgFrameMs: Number(avgMs.toFixed(2)),
    worstFrameMs: Number(worstMs.toFixed(2)),
    sampleCount: samples.length,
    status: status(),
    lowPerf,
    xrCapable: detectXR(),
    siteTouched: false,
    timestamp: new Date().toISOString()
  };
}
function injectStyle(){
  if (document.getElementById("svr-quest-perf-style")) return;
  const style = document.createElement("style");
  style.id = "svr-quest-perf-style";
  style.textContent = `
    #svrQuestPerf { position:fixed; right:12px; bottom:66px; z-index:42; min-width:132px; border:1px solid rgba(127,245,199,.42); border-radius:999px; padding:7px 11px; background:rgba(3,8,14,.68); color:#eafff4; font:800 11px/1.15 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; pointer-events:auto; cursor:pointer; box-shadow:0 10px 28px rgba(0,0,0,.38); user-select:none; }
    #svrQuestPerf.warn { border-color:rgba(246,226,127,.75); color:#f6e27f; }
    #svrQuestPerf.bad { border-color:rgba(255,107,127,.78); color:#ffb8c2; }
    #svrQuestPerfBody { position:fixed; right:12px; bottom:106px; z-index:42; width:min(360px,calc(100vw - 24px)); border:1px solid rgba(180,140,255,.42); border-radius:16px; padding:12px; background:linear-gradient(135deg,rgba(4,8,16,.90),rgba(22,9,42,.92)); color:#f6f3ff; font:12px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; display:none; box-shadow:0 16px 46px rgba(0,0,0,.46); }
    #svrQuestPerfBody.open { display:block; }
    #svrQuestPerfBody .row { display:flex; justify-content:space-between; gap:12px; border-top:1px solid rgba(255,255,255,.08); padding:6px 0; }
    #svrQuestPerfBody .key { color:rgba(246,243,255,.66); }
    #svrQuestPerfBody .val { font-weight:900; text-align:right; }
    body.preview-mode #svrQuestPerf, body.preview-mode #svrQuestPerfBody { display:none!important; }
    body.svr-low-perf #svrQuestPerf, body.svr-low-perf #svrQuestPerfBody { box-shadow:none; backdrop-filter:none; }
  `;
  document.head.appendChild(style);
}
function makePanel(){
  if (panel || isPreview()) return;
  injectStyle();
  panel = document.createElement("button");
  panel.id = "svrQuestPerf";
  panel.type = "button";
  panel.textContent = "PERF WAIT";
  body = document.createElement("section");
  body.id = "svrQuestPerfBody";
  body.innerHTML = "<strong>Quest Performance</strong>";
  document.body.append(panel, body);
  panel.addEventListener("click", ()=>body.classList.toggle("open"));
}
function renderHud(){
  if (!panel || !body) return;
  const m = metrics();
  panel.classList.toggle("warn", m.status === "WATCH");
  panel.classList.toggle("bad", m.status === "LOW-PERF");
  panel.textContent = `PERF ${m.status} • ${m.fps} FPS`;
  body.innerHTML = `
    <strong>Quest Performance</strong>
    <div class="row"><span class="key">Phase</span><span class="val">${PHASE}</span></div>
    <div class="row"><span class="key">Status</span><span class="val">${m.status}</span></div>
    <div class="row"><span class="key">FPS estimate</span><span class="val">${m.fps}</span></div>
    <div class="row"><span class="key">Avg frame</span><span class="val">${m.avgFrameMs} ms</span></div>
    <div class="row"><span class="key">Worst frame</span><span class="val">${m.worstFrameMs} ms</span></div>
    <div class="row"><span class="key">Low-perf mode</span><span class="val">${m.lowPerf ? "YES" : "NO"}</span></div>
    <div class="row"><span class="key">XR capable</span><span class="val">${m.xrCapable ? "YES" : "NO"}</span></div>
  `;
}
function frame(now){
  requestAnimationFrame(frame);
  if (!lastNow){ lastNow = now; return; }
  const ms = Math.min(180, Math.max(0, now - lastNow));
  lastNow = now;
  updateStats(ms);
  if (now - lastHud > HUD_MS){ lastHud = now; renderHud(); }
  window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR = { phase: PHASE, metrics, forceLowPerf: (on)=>{ lowPerf = !!on; document.body.classList.toggle("svr-low-perf", lowPerf); } };
}
function boot(){
  makePanel();
  window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR = { phase: PHASE, metrics, forceLowPerf: (on)=>{ lowPerf = !!on; document.body.classList.toggle("svr-low-perf", lowPerf); } };
  requestAnimationFrame(frame);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
else boot();
