// Update 9.8: global dt fallback for modules that expect dt
(function(){
  try{
    let last = performance.now();
    window.__scarlettDT = 0.016;
    function tick(){
      const now = performance.now();
      window.__scarlettDT = Math.min(0.05, Math.max(0.0, (now-last)/1000));
      last = now;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }catch(e){}
})();

/**
 * SCARLETTVR POKER — PERMANENT ENTRY (Phase 4)
 */
import { Scarlett1 } from './js/scarlett1/index.js';
console.log("🚀 SCARLETT: Phase 4 boot");
Scarlett1.start();
