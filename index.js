/**
 * ScarlettVR Poker — ROOT ENTRY (Permanent)
 * Loads Scarlett1 system.
 */
console.log("✅ ROOT index.js loaded", location.href);
import './js/scarlett1/index.js';



/* Music: simple background stream controls (placeholder) */
(function setupMusic(){
  const a = document.getElementById('bgMusic');
  const btnOn = document.getElementById('musicPlay');
  const btnOff = document.getElementById('musicStop');
  if (!a || !btnOn || !btnOff) return;

  const DEFAULT_STREAM = "https://icecast.radiofrance.fr/fip-hifi.aac";
  a.src = DEFAULT_STREAM;
  a.volume = 0.55;

  btnOn.addEventListener('click', async () => {
    try { await a.play(); } catch(e){ console.warn("[music] play blocked", e); }
  });
  btnOff.addEventListener('click', () => a.pause());
})();
