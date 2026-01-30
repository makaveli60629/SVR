// index.js — PERMANENT ROOT ENTRY (GitHub Pages safe)
// Loads diagnostics + starts the permanent spine.
// ONLY EDIT /js/scarlett1/* for world content.

import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

const BUILD = 'SCARLETT_ROOT_ENTRY_V1';

function $(id){ return document.getElementById(id); }

function setDiagText(t){
  const el = $('diag');
  if (el) el.textContent = String(t || '');
}

function ensureHudButtons(diag){
  // Make buttons work even if your HTML uses inline onclicks or not.
  // We expose a stable API on window.SCARLETT.
  window.SCARLETT = {
    enterVR: async () => {
      try { await Spine.enterVR(); diag.log('[ui] enterVR'); }
      catch (e) { diag.error('[ui] enterVR failed: ' + (e?.message || e)); }
    },
    resetSpawn: () => {
      try { Spine.resetSpawn(); }
      catch (e) { diag.error('[ui] resetSpawn failed: ' + (e?.message || e)); }
    },
    getReport: () => {
      try { return Spine.getReport(); }
      catch (e) { return 'report error: ' + (e?.message || e); }
    },
    copyReport: async () => {
      try {
        const txt = Spine.getReport();
        await navigator.clipboard.writeText(txt);
        diag.log('[ui] report copied ✅');
      } catch (e) {
        diag.warn('[ui] copy failed (clipboard blocked): ' + (e?.message || e));
      }
    },
    hardReload: () => {
      // Most reliable on mobile.
      location.href = location.pathname + '?v=' + Date.now();
    },
    purgeCache: async () => {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        diag.log('[ui] caches purged ✅');
      } catch (e) {
        diag.warn('[ui] purgeCache failed: ' + (e?.message || e));
      }
    },
  };

  // Optional: auto-bind if buttons exist without inline onclick
  const bind = (selector, fn) => {
    const el = document.querySelector(selector);
    if (el) el.addEventListener('click', fn);
  };

  bind('[data-action="enter-vr"]', window.SCARLETT.enterVR);
  bind('[data-action="reset-spawn"]', window.SCARLETT.resetSpawn);
  bind('[data-action="copy-report"]', window.SCARLETT.copyReport);
  bind('[data-action="hard-reload"]', window.SCARLETT.hardReload);
  bind('[data-action="purge-cache"]', window.SCARLETT.purgeCache);
}

async function boot(){
  // show something immediately
  setDiagText(`[plain] module index.js loaded ✅\n(starting...)`);

  const diag = initDiagnostics({
    build: BUILD,
    href: location.href,
    ua: navigator.userAgent
  });

  diag.log('[diag] diagnostics ready ✅');

  // Start the spine (this loads /js/scarlett1/world.js)
  try {
    await Spine.start({ diag });
    diag.log('[boot] spine started ✅');
  } catch (e) {
    diag.error('[boot] spine start failed: ' + (e?.message || e));
    throw e;
  }

  // Expose button actions
  ensureHudButtons(diag);

  // Helpful info for debugging
  diag.log('[env] secureContext=' + (window.isSecureContext ? 'true' : 'false'));
  diag.log('[env] xrSupported=' + (('xr' in navigator) ? 'true' : 'false'));
}

boot().catch((e)=>{
  // Make sure you ALWAYS see something even on mobile.
  const msg = e?.message || String(e);
  setDiagText(`[fatal] index.js boot failed:\n${msg}`);
  console.error(e);
});
