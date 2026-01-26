// js/scarlett1/init.js - SCARLETT1 ENTRY (PERMANENT)
import { ScarlettOS } from './os.js';
import { world } from './world.js';
import './guards.js'; // registers guard-bot component

// Public API for HUD buttons (kept stable)
window.Scarlett1 = { world };

window.addEventListener('load', () => {
  ScarlettOS.init();
  // Ensure cards exist on boot
  document.addEventListener('DOMContentLoaded', () => world.dealFlop());
});
