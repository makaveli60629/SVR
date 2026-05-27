/*
 * SVR Phase 255 — Quest Locomotion / Teleport / Watch Lock
 * Runtime-safe helper. Does not replace core modules; it adds persistent control rules and diagnostics.
 */
(function(){
  const BUILD = "PHASE-255-QUEST-LOCOMOTION-TELEPORT-WATCH-LOCK";

  const state = {
    build: BUILD,
    rightStickMove: true,
    snapTurnDegrees: 45,
    teleportHoldRelease: true,
    fistTeleportFallback: true,
    watchUprightLock: true,
    blinkReduction: true,
    loadedAt: new Date().toISOString()
  };

  window.SVR_PHASE255_CONTROL_LOCK = state;

  function emit(name, detail){
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: Object.assign({ build: BUILD }, detail || {}) }));
    } catch(_) {}
  }

  // Shared intent flags used by hands/teleport/watch modules when present.
  window.SVR_CONTROL_RULES = Object.assign(window.SVR_CONTROL_RULES || {}, {
    build: BUILD,
    movement: {
      rightStickYForwardBack: true,
      rightStickXSnapTurn: true,
      snapTurnDegrees: 45,
      headsetFacingMove: true
    },
    teleport: {
      holdToAim: true,
      releaseToTeleport: true,
      allowAButton: true,
      allowGrip: true,
      allowTrigger: true,
      allowFistPinchFallback: true,
      blockInstantTeleport: true,
      reduceBlink: true
    },
    watch: {
      forceUpright: true,
      faceCamera: true,
      controllerProxyFallback: true
    }
  });

  // Give runtime modules a common signal to re-read control rules.
  emit("svr_control_rules_updated", window.SVR_CONTROL_RULES);

  // Small diagnostic panel shortcut.
  window.addEventListener("keydown", function(ev){
    if (ev.key !== "F9") return;
    ev.preventDefault();
    let p = document.getElementById("svrPhase255Controls");
    if (!p) {
      p = document.createElement("div");
      p.id = "svrPhase255Controls";
      p.style.cssText = [
        "position:fixed","left:16px","bottom:16px","z-index:100009",
        "max-width:560px","padding:14px 16px","border-radius:16px",
        "background:rgba(4,8,16,.94)","color:#eaffff",
        "border:1px solid rgba(140,255,220,.62)",
        "font:12px/1.45 ui-monospace,Consolas,monospace",
        "box-shadow:0 18px 58px rgba(0,0,0,.65)"
      ].join(";");
      document.body.appendChild(p);
    }
    p.style.display = p.style.display === "none" ? "block" : "none";
    p.textContent = "SVR Phase 255 Control Lock\n" + JSON.stringify(window.SVR_CONTROL_RULES, null, 2);
  });

  emit("svr_phase255_control_lock_ready", state);
})();
