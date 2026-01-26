// js/scarlett1/init.js
// PERMANENT: Scarlett1 module entrypoint. No Spine edits required.
// Exposes a single global: window.scarlettModule

import { createScarlettModule } from './modules/index.js';

// Create module now; lazy-init does scene lookups safely on first init()
window.scarlettModule = createScarlettModule();

// Auto-init when the page finishes loading (safe no-op if scene not ready yet)
window.addEventListener('load', () => {
  try { window.scarlettModule.init(); } catch (e) { console.warn('[scarlettModule] init error', e); }
});
