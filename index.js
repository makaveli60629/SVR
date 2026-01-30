/**
 * /index.js — PERMANENT ROOT ENTRY
 * - Starts diagnostics
 * - Boots Spine
 * - Wires HUD buttons
 *
 * IMPORTANT: NO "three" bare imports in this file.
 */

import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

const diag = initDiagnostics({
  build: 'SCARLETT_SPINE_PERMANENT_S1_WORLD_INIT',
  href: location.href,
  ua: navigator.userAgent,
});

diag.log('[boot] html loaded ✅');
diag.log('(starting...)');

function $(id){ return document.getElementById(id); }

function bind(id, fn){
  const el = $(id);
  if (!el) { diag.warn(`[hud] missing #${id}`); return; }
  el.addEventListener('click', async () => {
    try { await fn(); }
    catch (e) { diag.error(e?.message || String(e)); }
  });
}

// ---- HUD actions ----
bind('btnEnterVR', async () => {
  diag.log('[hud] Enter VR');
  await Spine.enterVR();
});

bind('btnReset', async () => {
  Spine.resetSpawn();
});

bind('btnCopy', async () => {
  const report = Spine.getReport();
  try {
    await navigator.clipboard.writeText(report);
    diag.log('[hud] report copied ✅');
  } catch {
    // fallback prompt if clipboard blocked
    prompt('Copy report:', report);
    diag.log('[hud] report prompt shown');
  }
});

bind('btnReload', async () => {
  diag.log('[hud] hard reload...');
  location.reload(true);
});

// Optional: if you have a purge cache button in HTML, wire it safely
bind('btnPurge', async () => {
  diag.log('[hud] purge cache...');
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  diag.log('[hud] cache purged ✅');
  location.reload();
});

// Hide HUD if button exists
bind('btnHide', async () => {
  const hud = $('dev-hud') || $('hud') || document.querySelector('#dev-hud, #hud');
  if (hud) {
    hud.style.display = (hud.style.display === 'none') ? '' : 'none';
    diag.log('[hud] toggled');
  }
});

// ---- Boot Spine ----
(async () => {
  try {
    diag.log('[boot] starting spine…');
    await Spine.start({ diag });
    diag.log('[boot] spine started ✅');
  } catch (e) {
    diag.error('[boot] spine failed: ' + (e?.message || String(e)));
  }
})();
