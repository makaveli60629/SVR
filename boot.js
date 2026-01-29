// boot.js (ROOT) — BOOT TOOLS ONLY (PERMANENT)
// Purpose: Debug HUD + Reload + Import Spine + NUKE caches/SW
// IMPORTANT: This file MUST NOT import the app/spine/world.

const logEl = document.getElementById("log");
const log = (s) => {
  if (!logEl) return;
  logEl.textContent += `\n${s}`;
};

function cacheBust(url) {
  const u = new URL(url, location.href);
  u.searchParams.set("v", String(Date.now()));
  return u.toString();
}

// Show all uncaught errors on the HUD (super important on Android)
window.addEventListener("error", (e) => {
  log(`\n[error] ${e.message || e.type}`);
});

window.addEventListener("unhandledrejection", (e) => {
  log(`\n[reject] ${String(e.reason)}`);
});

log(`starting…`);
log(`href=${location.href}`);
log(`ua=${navigator.userAgent}`);

const btnReload = document.getElementById("btnReload");
const btnImport = document.getElementById("btnImport");
const btnNuke   = document.getElementById("btnNuke");

if (btnReload) {
  btnReload.onclick = () => {
    log(`\n[action] reload`);
    location.reload();
  };
}

if (btnImport) {
  btnImport.onclick = () => {
    // Navigate to ROOT index.html (Spine entry) with cache-bust
    const target = cacheBust("./index.html");
    log(`\n[action] import spine -> ${target}`);
    location.href = target;
  };
}

if (btnNuke) {
  btnNuke.onclick = async () => {
    log(`\n== NUKE START ==`);
    try {
      // Service Workers
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        log(`SW registrations: ${regs.length}`);
        for (const r of regs) {
          try { await r.unregister(); } catch {}
        }
      } else {
        log(`SW: not supported`);
      }

      // Cache Storage
      if ("caches" in window) {
        const keys = await caches.keys();
        log(`cache storages: ${keys.length}`);
        for (const k of keys) {
          try { await caches.delete(k); } catch {}
        }
      } else {
        log(`caches: not supported`);
      }

      // Best-effort: clear storage (some browsers block this)
      if (navigator.storage?.estimate) {
        try {
          const est = await navigator.storage.estimate();
          log(`storage estimate: ${(est.usage/1024/1024).toFixed(1)}MB used`);
        } catch {}
      }

      log(`== NUKE DONE ==`);
      log(`(no auto reload — press Reload or Import Spine)`);
    } catch (err) {
      log(`\n[NUKE ERROR] ${err?.message || String(err)}`);
    }
  };
}
