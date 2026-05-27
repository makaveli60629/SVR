(function(){
  window.SVR_PHASE253_FORWARD_RESTORE_MANIFEST = {
    build: "PHASE-253-FORWARD-RESTORE-LOCOMOTION-KIOSK-POKER-LOCK",
    phase: 253,
    publicPageTouched: false,
    source: "Phase 252 forward backup",
    locks: [
      "No Phase 86 rollback",
      "Right-stick forward/back movement",
      "45-degree snap turn",
      "Hold/release teleport",
      "Watch upright diagnostic preserved",
      "Store kiosk interactive panel",
      "Private room routes",
      "Right-to-left card dealing",
      "Flat chips on felt",
      "Moon and Mars visible high above skyline"
    ]
  };
  window.dispatchEvent(new CustomEvent('svr_phase253_manifest_ready', { detail: window.SVR_PHASE253_FORWARD_RESTORE_MANIFEST }));
})();
