/**
 * index.js — ROOT ENTRY (PERMANENT)
 * This is the ONLY JS loaded by index.html
 * It boots diagnostics + spine.
 */

import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

// ---- DIAGNOSTICS BOOT ----
const diag = initDiagnostics({
  build: 'SCARLETT_SPINE_PERMANENT_S1_WORLD_INIT',
  href: location.href,
  ua: navigator.userAgent
});

diag.log('[boot] index.js loaded ✅');
diag.log('[boot] starting spine…');

// ---- START SPINE ----
(async () => {
  try {
    await Spine.start({ diag });

    // expose controls for HUD buttons
    window.SCARLETT = {
      enterVR: Spine.enterVR,
      resetSpawn: Spine.resetSpawn,
      getReport: Spine.getReport
    };

    diag.log('[boot] spine ready ✅');
  } catch (e) {
    diag.error('[fatal] spine failed: ' + (e?.message || String(e)));
    console.error(e);
  }
})();
