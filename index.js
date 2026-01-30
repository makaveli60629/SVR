/**
 * /index.js — PERMANENT ROOT ENTRY
 * Fixes:
 *  - exposes window.SCARLETT for your inline HTML buttons
 *  - boots diagnostics + spine
 */

import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

const diag = initDiagnostics({
  build: 'SCARLETT_SPINE_PERMANENT_S1_WORLD_INIT',
  href: location.href,
  ua: navigator.userAgent,
});

diag.log('[boot] html loaded ✅');
diag.log('[boot] index.js loaded ✅');
diag.log('[boot] starting spine…');

// IMPORTANT: your HTML buttons use window.SCARLETT?.enterVR(), etc.
window.SCARLETT = {
  enterVR: () => Spine.enterVR(),
  resetSpawn: () => Spine.resetSpawn(),
  getReport: () => Spine.getReport(),
};

(async () => {
  try {
    await Spine.start({ diag });
    diag.log('[boot] spine started ✅');
  } catch (e) {
    diag.error('[boot] spine failed: ' + (e?.message || String(e)));
  }
})();
