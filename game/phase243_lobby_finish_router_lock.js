const LABEL = "PHASE-247-MATERIAL-TEXTURE-LOCK";
const FINISH_LAYERS = [
  "./phase241_single_lobby_layer_cleanup_lock.js?v=phase247-single-layer-cleanup",
  "./phase244_finished_palace_lobby_build_lock.js?v=phase247-finished-lobby",
  "./phase245_lobby_organization_texture_cleanup_lock.js?v=phase247-org-texture-cleanup",
  "./phase246_pillar_storefront_alignment_lock.js?v=phase247-pillar-storefront-align",
  "./phase247_material_texture_lock.js?v=phase247-material-texture"
];

function stamp(){
  window.SVR_PHASE247 = {
    build: LABEL,
    active: true,
    router: true,
    siteTouched: false,
    materialTextureLock: true,
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
      console.warn("[SVR Phase247] finish layer import failed", url, err);
      showError(`Finish layer failed: ${url}`);
    }
  }
  window.SVR_PHASE247.loadedFinishLayers = loaded;
  return loaded;
}
async function boot(){
  stamp();
  setLabel("PHASE 247 ACTIVE • MATERIAL TEXTURE LOCK");
  await loadLayersOnce();
  let checks = 0;
  const timer = setInterval(()=>{
    checks++;
    if (hasRuntime() || checks > 100){
      if (hasRuntime()){
        window.__SVR_GAME_READY__ = true;
        setLabel("PHASE 247 ACTIVE • TEXTURED LOBBY READY");
        hideBoot();
      } else {
        setLabel("PHASE 247 ACTIVE • SAFE ENTRY WAITING");
      }
      clearInterval(timer);
    }
  }, 200);
}
window.addEventListener("error", event => showError(event?.message || "window error"));
window.addEventListener("unhandledrejection", event => showError(String(event?.reason || "promise rejection")));
boot();
