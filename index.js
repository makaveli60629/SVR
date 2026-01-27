// UPDATE_9_12_DT_SINGLE_SOURCE: single dt source to avoid TDZ/redeclare issues
(function(){
  try{
    window.__scarlett = window.__scarlett || {};
    if (typeof window.__scarlett.dt !== 'number') window.__scarlett.dt = 0.016;
    let last = performance.now();
    function tick(){
      const now = performance.now();
      const d = (now - last) / 1000;
      last = now;
      // clamp for stability
      window.__scarlett.dt = Math.min(0.05, Math.max(0.0, d || 0.016));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }catch(e){}
})();

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
