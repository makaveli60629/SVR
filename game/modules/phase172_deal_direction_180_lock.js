// PHASE-172-DEAL-DIRECTION-180-LOCK
// Fixes the visual card session direction so the table reads left-to-right from the player/front view.
// It does not touch the website, lobby layout, Reiki, PGA, or private room routing.
(function(){
  const PHASE = "PHASE-172-DEAL-DIRECTION-180-LOCK";
  if (window.__SVR_PHASE172_DEAL_DIRECTION__) return;
  window.__SVR_PHASE172_DEAL_DIRECTION__ = true;

  const params = new URLSearchParams(location.search);
  const isPreview = params.has("preview") || params.get("cam") === "director" || window.self !== window.top;

  function setStatus(text){
    const s = document.getElementById("status");
    if (s && !isPreview) s.textContent = text;
  }

  function isCardMesh(obj){
    if (!obj || !obj.isMesh || !obj.userData) return false;
    if (!Object.prototype.hasOwnProperty.call(obj.userData, "card")) return false;
    const g = obj.geometry;
    const params = g?.parameters || {};
    const w = Number(params.width || 0);
    const h = Number(params.height || 0);
    return Math.abs(w - 0.24) < 0.16 && Math.abs(h - 0.34) < 0.22;
  }

  function mirrorCardSession(scene){
    let count = 0;
    scene.traverse((obj)=>{
      if (!isCardMesh(obj)) return;
      // Mirror across the center table axis. This flips the perceived dealing lane
      // so what was reading right-to-left now reads left-to-right from the front seat.
      if (!obj.userData.phase172OriginalXSet) {
        obj.userData.phase172OriginalXSet = true;
        obj.userData.phase172LastRawX = obj.position.x;
      }
      // If the poker animation just wrote a positive/negative X target, mirror it once per frame.
      if (!obj.userData.phase172Mirroring) {
        obj.userData.phase172Mirroring = true;
        obj.position.x = -obj.position.x;
        obj.userData.phase172Mirroring = false;
      }
      obj.userData.phase172DealDirection = "left-to-right-front-view";
      count++;
    });
    return count;
  }

  function hook(scene){
    if (!scene || scene.userData.phase172DealDirectionHooked) return true;
    scene.userData.phase172DealDirectionHooked = true;
    let scans = 0;
    const prevWorld = scene.userData._tickWorld;
    scene.userData._tickWorld = (dt)=>{
      if (prevWorld) prevWorld(dt);
      // Keep mirroring while cards animate. Limit is high enough for recurring demo hands.
      if (scans < 200000) {
        scans++;
        mirrorCardSession(scene);
      }
    };
    window.SVR_PHASE172_DEAL_DIRECTION = {
      phase: PHASE,
      mode: "card-session-180-left-to-right-lock",
      protected: ["site", "lobby-layout", "reiki", "pga", "private-scenes"]
    };
    setStatus("Phase 172: card session flipped 180 / left-to-right deal lock");
    console.log(`[${PHASE}] loaded`);
    return true;
  }

  function boot(){
    const tryHook = ()=>hook(window.SVR_GAME?.scene);
    if (!tryHook()) {
      let attempts = 0;
      const id = setInterval(()=>{
        attempts++;
        if (tryHook() || attempts > 80) clearInterval(id);
      }, 250);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
