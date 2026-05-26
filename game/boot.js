(function () {
  "use strict";

  const PHASE = 253;
  const BOOT_ID = "svr-boot-phase253";

  if (window.SVR_BOOT_PHASE_253_READY) {
    console.log("[SVR boot] Phase 253 already booted");
    return;
  }

  window.SVR_BOOT_PHASE_253_READY = true;
  window.SVR_PHASE = PHASE;
  window.SVR_PHASE_LABEL = "Phase 253";

  function log(message, data) {
    if (data !== undefined) console.log(`[SVR boot P${PHASE}] ${message}`, data);
    else console.log(`[SVR boot P${PHASE}] ${message}`);
  }

  function markDocument() {
    if (document.documentElement) document.documentElement.setAttribute("data-svr-phase", String(PHASE));
    if (document.body) document.body.setAttribute("data-svr-phase", String(PHASE));
  }

  function loadOptionalLoader() {
    const src = "modules/optional_module_loader.js";
    if (document.querySelector(`script[data-svr-boot="${BOOT_ID}"]`)) return;

    const script = document.createElement("script");
    script.src = src + "?v=phase253";
    script.async = false;
    script.setAttribute("data-svr-boot", BOOT_ID);
    script.onload = function () { log("optional module loader loaded"); };
    script.onerror = function () { console.error("[SVR boot] optional module loader failed"); };
    document.head.appendChild(script);
  }

  function boot() {
    markDocument();
    loadOptionalLoader();
    window.dispatchEvent(new CustomEvent("svr:boot-ready", {
      detail: { phase: PHASE, label: "Phase 253", time: new Date().toISOString() }
    }));
    log("ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();