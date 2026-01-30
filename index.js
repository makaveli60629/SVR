/**
 * index.js — PERMANENT BOOT
 * Loads diagnostics + spine
 */
import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

const diag = initDiagnostics({
  build: 'SCARLETT_SPINE_PERMANENT_S1_WORLD_INIT',
  href: location.href,
  ua: navigator.userAgent
});

function $(id){ return document.getElementById(id); }

(async function boot(){
  try {
    diag.log('[boot] entry');

    // Wire HUD buttons
    $('btn-enter-vr')?.addEventListener('click', ()=>Spine.enterVR().catch(e=>diag.warn(String(e))));
    $('btn-reset')?.addEventListener('click', ()=>Spine.resetSpawn());
    $('btn-hide')?.addEventListener('click', ()=>{
      const hud = document.getElementById('dev-hud');
      hud?.classList.toggle('hud--hidden');
    });
    $('btn-copy')?.addEventListener('click', async ()=>{
      const text = Spine.getReport();
      try { await navigator.clipboard.writeText(text); diag.log('[hud] report copied ✅'); }
      catch { diag.warn('[hud] clipboard blocked'); }
    });
    $('btn-reload')?.addEventListener('click', ()=>{
      // Hard reload: bypass cache (best effort)
      location.href = location.pathname + '?v=' + Date.now();
    });
    $('btn-tools')?.addEventListener('click', ()=>{
      // Simple SW nuke + cache clear (best effort)
      (async ()=>{
        diag.log('[tools] nuke cache start…');
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) await r.unregister();
            diag.log('[tools] service workers unregistered ✅');
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k=>caches.delete(k)));
            diag.log('[tools] caches deleted ✅');
          }
        } catch (e) {
          diag.warn('[tools] nuke failed: ' + (e?.message||e));
        }
        location.href = location.pathname + '?v=' + Date.now();
      })();
    });

    await Spine.start({ diag });
    diag.log('[boot] ready ✅');
  } catch (e) {
    diag.error('[boot] failed: ' + (e?.message || e));
  }
})();
