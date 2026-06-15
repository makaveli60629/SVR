const LABEL = "PHASE-237-RUNTIME-WATCHDOG-LOCK";

function stamp(){
  window.SVR_PHASE237 = {
    build: LABEL,
    active: true,
    runtimeWatchdog: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
}

function setLabel(text){
  const label = document.getElementById("svr-phase-label");
  if(label) label.textContent = text || "PHASE 237 ACTIVE • RUNTIME WATCHDOG";
  const status = document.getElementById("status");
  if(status) status.textContent = text || "Phase 237 runtime watchdog active";
}

function hideBoot(){
  const boot = document.getElementById("bootFallback");
  if(boot){
    boot.style.opacity = "0";
    boot.style.pointerEvents = "none";
    setTimeout(()=>{ boot.style.display = "none"; }, 420);
  }
}

function showError(message){
  const err = document.getElementById("err");
  if(!err) return;
  err.style.display = "block";
  err.textContent = `[${LABEL}] ${message || "Runtime issue detected"}`;
}

function checkReady(){
  const hasCanvas = !!document.querySelector("canvas");
  const hasRenderer = !!window.__SVR_RENDERER__;
  const hasScene = !!window.__SVR_SCENE__;
  if(window.__SVR_GAME_READY__ || hasCanvas || hasRenderer || hasScene){
    window.__SVR_GAME_READY__ = true;
    setLabel("PHASE 237 ACTIVE • LOBBY RUNTIME READY");
    hideBoot();
    return true;
  }
  return false;
}

window.addEventListener("error", event => {
  showError(event?.message || "window error");
});
window.addEventListener("unhandledrejection", event => {
  showError(String(event?.reason || "promise rejection"));
});

stamp();
setLabel("PHASE 237 ACTIVE • RUNTIME WATCHDOG");
let checks = 0;
const timer = setInterval(()=>{
  checks++;
  if(checkReady() || checks > 80){
    if(checks > 80 && !window.__SVR_GAME_READY__) setLabel("PHASE 237 ACTIVE • SAFE ENTRY WAITING");
    clearInterval(timer);
  }
}, 250);
setTimeout(checkReady, 1500);
setTimeout(checkReady, 3500);
