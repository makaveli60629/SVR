const LABEL = "PHASE-242-LOBBY-FINISH-RUNTIME-ROUTER-LOCK";
const IMPORTS = [
  "./phase240_grand_palace_reference_lobby_lock.js?v=phase242-router-grand-palace",
  "./phase241_single_lobby_layer_cleanup_lock.js?v=phase242-router-single-layer-cleanup"
];

function stamp(){
  window.SVR_PHASE242 = {
    build: LABEL,
    active: true,
    runtimeRouter: true,
    replacesPhase237Label: true,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
}

function setLabel(text){
  const label = document.getElementById("svr-phase-label");
  if(label) label.textContent = text || "PHASE 242 ACTIVE • LOBBY FINISH ROUTER";
  const status = document.getElementById("status");
  if(status) status.textContent = text || "Phase 242 lobby finish router active";
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

async function loadFinishLayers(){
  const loaded = [];
  for (const url of IMPORTS){
    try {
      await import(url);
      loaded.push(url);
    } catch (err){
      console.warn("[SVR Phase242] optional finish layer import failed", url, err);
    }
  }
  window.SVR_PHASE242.loadedFinishLayers = loaded;
  return loaded;
}

function checkReady(){
  const hasCanvas = !!document.querySelector("canvas");
  const hasRenderer = !!window.__SVR_RENDERER__;
  const hasScene = !!window.__SVR_SCENE__;
  if(window.__SVR_GAME_READY__ || hasCanvas || hasRenderer || hasScene){
    window.__SVR_GAME_READY__ = true;
    setLabel("PHASE 242 ACTIVE • LOBBY FINISH READY");
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
setLabel("PHASE 242 ACTIVE • LOBBY FINISH ROUTER");
loadFinishLayers().then(()=>setTimeout(checkReady, 250));
let checks = 0;
const timer = setInterval(()=>{
  checks++;
  if(checkReady() || checks > 80){
    if(checks > 80 && !window.__SVR_GAME_READY__) setLabel("PHASE 242 ACTIVE • SAFE ENTRY WAITING");
    clearInterval(timer);
  }
}, 250);
setTimeout(checkReady, 1500);
setTimeout(checkReady, 3500);
