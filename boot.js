// boot.js (ROOT) — BOOT TOOLS ONLY (PERMANENT)
// IMPORTANT: MUST NOT import spine/world/app.

const logEl = document.getElementById("log");
const log = (s) => { if (logEl) logEl.textContent += `\n${s}`; };

function cacheBust(url){
  const u = new URL(url, location.href);
  u.searchParams.set("v", String(Date.now()));
  return u.toString();
}

window.addEventListener("error", (e) => log(`\n[error] ${e.message || e.type}`));
window.addEventListener("unhandledrejection", (e) => log(`\n[reject] ${String(e.reason)}`));

log(`starting…`);
log(`href=${location.href}`);
log(`ua=${navigator.userAgent}`);

document.getElementById("btnReload")?.addEventListener("click", () => {
  log(`\n[action] reload`);
  location.reload();
});

document.getElementById("btnImport")?.addEventListener("click", () => {
  const target = cacheBust("./index.html");
  log(`\n[action] import spine -> ${target}`);
  location.href = target;
});

document.getElementById("btnNuke")?.addEventListener("click", async () => {
  log(`\n== NUKE START ==`);
  try{
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      log(`SW registrations: ${regs.length}`);
      for (const r of regs) { try { await r.unregister(); } catch {} }
    } else log(`SW: not supported`);

    if ("caches" in window) {
      const keys = await caches.keys();
      log(`cache storages: ${keys.length}`);
      for (const k of keys) { try { await caches.delete(k); } catch {} }
    } else log(`caches: not supported`);

    log(`== NUKE DONE ==`);
    log(`(no auto reload — press Reload or Import Spine)`);
  } catch(err){
    log(`\n[NUKE ERROR] ${err?.message || String(err)}`);
  }
});
