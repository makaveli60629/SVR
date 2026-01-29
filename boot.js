const logEl = document.getElementById("log");
const log = (s) => { logEl.textContent += `\n${s}`; };

function cacheBust(url){
  const u = new URL(url, location.href);
  u.searchParams.set("v", String(Date.now()));
  return u.toString();
}

// Show *all* uncaught errors on the HUD (super important on Android)
window.addEventListener("error", (e) => {
  log(`\n[error] ${e.message || e.type}`);
});
window.addEventListener("unhandledrejection", (e) => {
  log(`\n[reject] ${String(e.reason)}`);
});

log(`starting…`);
log(`href=${location.href}`);
log(`ua=${navigator.userAgent}`);

document.getElementById("btnReload").onclick = () => {
  log(`\n[action] reload`);
  location.reload();
};

document.getElementById("btnImport").onclick = () => {
  // IMPORTANT: no auto reload loops; we only navigate when YOU press this.
  const target = cacheBust("./index.html");
  log(`\n[action] import spine -> ${target}`);
  location.href = target;
};

document.getElementById("btnNuke").onclick = async () => {
  log(`\n== NUKE START ==`);
  try{
    // Service Workers
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      log(`SW registrations: ${regs.length}`);
      for (const r of regs) await r.unregister();
    } else {
      log(`SW: not supported`);
    }

    // Cache Storage
    if ("caches" in window) {
      const keys = await caches.keys();
      log(`cache storages: ${keys.length}`);
      for (const k of keys) await caches.delete(k);
    } else {
      log(`caches: not supported`);
    }

    log(`== NUKE DONE ==`);
    log(`(no auto reload — press Reload or Import Spine)`);
  } catch(err){
    log(`\n[NUKE ERROR] ${err?.message || String(err)}`);
  }
};
