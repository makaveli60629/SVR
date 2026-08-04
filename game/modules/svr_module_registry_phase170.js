const PHASE = "UPDATE-3.0-PHASE-170-MODULE-REGISTRY-DIAGNOSTIC-LOCK";

const params = new URLSearchParams(location.search);
const diagnosticsOn = params.has("debug") || params.has("diag") || params.has("phase170");
const isAndroid = /Android/i.test(navigator.userAgent || "");
const isQuest = /Quest|Oculus/i.test(navigator.userAgent || "");
const isDesktop = !isAndroid && !isQuest;

const MODULES = {
  freezeGuard: { status:"locked", heavy:false, description:"Adaptive frame-spike protection from Phase 166." },
  androidSmartControls: { status:isAndroid ? "active" : "standby", heavy:false, description:"Android-only touch sticks." },
  questTeleport: { status:"locked", heavy:false, description:"Fist arms purple hand teleport, pinch executes teleport." },
  controllerLocomotion: { status:"locked", heavy:false, description:"Right stick forward/back, right stick snap-turn, trigger/grip teleport." },
  expandedOctagonLobby: { status:"active", heavy:true, description:"Expanded solid octagon shell and four Tier 1 pillars." },
  hubPods: { status:"active", heavy:true, description:"PGA, Sponsor, Wellness, Store, Scorpion, Legends pods." },
  commandCenter: { status:"active", heavy:true, description:"Ads, notifications, events, leaderboards." },
  pokerDemo: { status:"active", heavy:true, description:"Left-to-right dealing order locked." },
  wristWatch: { status:"active", heavy:false, description:"Wrist controls and navigation." },
  backgroundBuildings: { status:"disabled", heavy:true, description:"Generic background buildings must remain hidden." },
  nathanNpc: { status:"optional", heavy:true, description:"NPC walker should be disabled first during freeze isolation if needed." }
};

const toggles = {
  lite: params.has("lite"),
  noPods: params.has("noPods"),
  noCommand: params.has("noCommand"),
  noPoker: params.has("noPoker"),
  noReiki: params.has("noReiki"),
  noNpc: params.has("noNpc") || params.has("lite"),
  noFx: params.has("noFx") || params.has("lite")
};

const state = {
  phase: PHASE,
  platform: isQuest ? "Quest" : isAndroid ? "Android" : isDesktop ? "Desktop" : "Unknown",
  modules: MODULES,
  toggles,
  diagnosticsOn,
  ready: false,
  fps: 0,
  lastFrameMs: 0,
  frameSpikeCount: 0,
  checks: {}
};

window.SVR_MODULES = MODULES;
window.SVR_PHASE170_REGISTRY = state;
window.SVR_PHASE170_TOGGLES = toggles;

let overlay = null;
let overlayBody = null;
let last = performance.now();
let frames = 0;
let fpsLast = last;

function yes(v){ return v ? "PASS" : "WAIT"; }
function checkRuntime(){
  state.ready = !!window.__SVR_GAME_READY__;
  state.checks = {
    gameReady: yes(window.__SVR_GAME_READY__),
    freezeGuard: yes(window.__SVR_PHASE166_FREEZE_LOCK__ || window.SVR_PHASE166_FREEZE_GUARD),
    androidLock: isAndroid ? yes(window.__SVR_ANDROID_SMART_LOCK__) : "N/A",
    expandedLobby: yes(window.SVR_PHASE169_EXPANDED_LOBBY || window.__SVR_PHASE168_SOLID_OCTAGON_LOCK__),
    dealOrder: yes(Array.isArray(window.SVR_PHASE169_DEAL_ORDER) && window.SVR_PHASE169_DEAL_ORDER.length > 0),
    backgroundBuildings: (window.SVR_PHASE169_EXPANDED_LOBBY?.oldBackgroundBuildingsHidden ?? 0) > 0 ? "HIDDEN" : "VERIFY",
    questTeleport: isQuest ? "TEST HANDS" : "N/A"
  };
}
function createOverlay(){
  if (!diagnosticsOn || overlay) return;
  overlay = document.createElement("div");
  overlay.id = "svrPhase170Diagnostics";
  overlay.style.cssText = [
    "position:fixed", "right:10px", "top:72px", "z-index:9999", "width:min(360px,calc(100vw - 20px))",
    "max-height:58vh", "overflow:auto", "background:rgba(0,0,0,.72)", "color:#eaffff",
    "border:1px solid rgba(126,255,242,.45)", "border-radius:16px", "padding:10px 12px",
    "font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace", "box-shadow:0 12px 40px rgba(0,0,0,.55)", "backdrop-filter:blur(8px)", "pointer-events:auto"
  ].join(";");
  const head = document.createElement("div");
  head.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px";
  head.innerHTML = `<strong style="color:#7ffcff">PHASE 170 MODULE REGISTRY</strong>`;
  const close = document.createElement("button");
  close.textContent = "hide";
  close.style.cssText = "background:#111827;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:4px 8px;cursor:pointer";
  close.onclick = ()=>{ overlay.style.display = "none"; };
  head.appendChild(close);
  overlayBody = document.createElement("div");
  overlay.appendChild(head);
  overlay.appendChild(overlayBody);
  document.body.appendChild(overlay);
}
function renderOverlay(){
  if (!overlayBody) return;
  checkRuntime();
  const moduleRows = Object.entries(MODULES).map(([k,v])=>`${k}: ${v.status}${v.heavy ? " • heavy" : ""}`).join("\n");
  const checks = Object.entries(state.checks).map(([k,v])=>`${k}: ${v}`).join("\n");
  overlayBody.textContent = `Build: ${PHASE}\nPlatform: ${state.platform}\nFPS: ${state.fps}\nLast frame: ${state.lastFrameMs.toFixed(1)}ms\nSpikes: ${state.frameSpikeCount}\n\nChecks:\n${checks}\n\nToggles:\n${JSON.stringify(toggles, null, 2)}\n\nModules:\n${moduleRows}`;
}
function loop(now){
  state.lastFrameMs = now - last;
  if (state.lastFrameMs > 65) state.frameSpikeCount++;
  last = now;
  frames++;
  if (now - fpsLast > 1000){
    state.fps = Math.round(frames * 1000 / (now - fpsLast));
    frames = 0;
    fpsLast = now;
    renderOverlay();
  }
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e)=>{
  if (e.code === "F9"){
    createOverlay();
    if (overlay) overlay.style.display = overlay.style.display === "none" ? "block" : "none";
  }
});

createOverlay();
checkRuntime();
requestAnimationFrame(loop);
console.log(`[Phase170] Module registry active. Diagnostics ${diagnosticsOn ? "visible" : "hidden"}. Add ?phase170=1 or press F9 to show.`);
