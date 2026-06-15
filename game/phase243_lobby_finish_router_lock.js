const LABEL = "PHASE-243-LOBBY-FINISH-ROUTER-CACHE-CLEAN-LOCK";
const FINISH_LAYERS = [
  "./phase240_grand_palace_reference_lobby_lock.js?v=phase243-grand-palace-single",
  "./phase241_single_lobby_layer_cleanup_lock.js?v=phase243-single-layer-cleanup"
];

function stamp(){
  window.SVR_PHASE243 = {
    build: LABEL,
    active: true,
    router: true,
    siteTouched: false,
    removesPhase237Entry: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
}
function setLabel(text){
  const label = document.getElementById("svr-phase-label");
  if(label) label.textContent = text;
  const status = document.getElementById("status");
  if(status) status.textContent = text;
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
function hasRuntime(){
  return !!(window.__SVR_GAME_READY__ || window.__SVR_SCENE__ || window.__SVR_RENDERER__ || document.querySelector("canvas"));
}
async function loadLayersOnce(){
  const loaded = [];
  for (const url of FINISH_LAYERS){
    try {
      await import(url);
      loaded.push(url);
    } catch (err){
      console.warn("[SVR Phase243] finish layer import failed", url, err);
      showError(`Finish layer failed: ${url}`);
    }
  }
  window.SVR_PHASE243.loadedFinishLayers = loaded;
  return loaded;
}
async function boot(){
  stamp();
  setLabel("PHASE 243 ACTIVE • LOBBY FINISH ROUTER");
  await loadLayersOnce();
  let checks = 0;
  const timer = setInterval(()=>{
    checks++;
    if (hasRuntime() || checks > 100){
      if (hasRuntime()){
        window.__SVR_GAME_READY__ = true;
        setLabel("PHASE 243 ACTIVE • FINISHED LOBBY READY");
        hideBoot();
      } else {
        setLabel("PHASE 243 ACTIVE • SAFE ENTRY WAITING");
      }
      clearInterval(timer);
    }
  }, 200);
}
window.addEventListener("error", event => showError(event?.message || "window error"));
window.addEventListener("unhandledrejection", event => showError(String(event?.reason || "promise rejection")));
boot();
