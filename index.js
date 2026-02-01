// SVR root entry: GUARANTEED BOOT + HUD logging + cache nuke
const $ = (id)=>document.getElementById(id);
const logEl = $("log");
const statusEl = $("status");

function log(msg){
  try{
    logEl.textContent += String(msg) + "\n";
    logEl.parentElement.scrollTop = logEl.parentElement.scrollHeight;
  }catch(e){}
  console.log(msg);
}
function setStatus(t){ try{ statusEl.textContent = t; }catch(e){} }

setStatus("boot…");
log("=== SCARLETT DIAGNOSTICS ===");
log("href=" + location.href);
log("ua=" + navigator.userAgent);
log("secureContext=" + String(window.isSecureContext));
log("navigator.xr=" + (!!navigator.xr));

window.addEventListener("error", (e)=>{
  log("❌ window.error: " + (e?.message || e));
  if (e?.error?.stack) log(e.error.stack);
});
window.addEventListener("unhandledrejection", (e)=>{
  log("❌ unhandledrejection: " + (e?.reason?.message || e?.reason || e));
  if (e?.reason?.stack) log(e.reason.stack);
});

$("btnReload").onclick = ()=> location.reload(true);

// NUKE CACHE: unregister SW + clear caches + reload
$("btnNuke").onclick = async ()=>{
  log("🧨 NUKE CACHE: starting…");
  try{
    if ("serviceWorker" in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs){
        await r.unregister();
      }
      log("✅ service workers unregistered");
    }
    if ("caches" in window){
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
      log("✅ caches cleared: " + keys.length);
    }
  }catch(err){
    log("⚠️ nuke failed: " + (err?.message || err));
  }
  log("🔁 reloading…");
  location.reload(true);
};

$("btnSpawn").onclick = ()=> {
  window.__SVR_RESET_SPAWN?.();
  log("▶ Reset Spawn pressed");
};
$("btnVR").onclick = ()=> {
  window.__SVR_ENTER_VR?.();
  log("▶ Enter VR pressed");
};

async function main(){
  setStatus("loading…");
  log("… loading ./js/runtime/spine.js");
  const mod = await import("./js/runtime/spine.js?v=SVR_BOOT_001");
  if (!mod?.Spine?.start) throw new Error("Spine.start missing export");
  log("✅ Spine module loaded");

  await mod.Spine.start();
  setStatus("ready ✅");
  log("✅ boot complete");
}

main().catch((e)=>{
  setStatus("boot failed ❌");
  log("❌ boot failed: " + (e?.message || e));
  if (e?.stack) log(e.stack);
});
