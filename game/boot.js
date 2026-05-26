(function () {
  "use strict";

  const PHASE = 250;
  const BOOT_ID = "svr-boot-phase250";

  if (window.SVR_BOOT_PHASE_250_READY) {
    console.log("[SVR boot] Phase 250 already booted");
    return;
  }

  window.SVR_BOOT_PHASE_250_READY = true;

  function log(message, data) {
    if (data !== undefined) {
      console.log(`[SVR boot P${PHASE}] ${message}`, data);
    } else {
      console.log(`[SVR boot P${PHASE}] ${message}`);
    }
  }

  function loadOptionalLoader() {
    const src = "modules/optional_module_loader.js";

    if (document.querySelector(`script[data-svr-boot="${BOOT_ID}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.src = src + "?v=phase250";
    script.async = false;
    script.setAttribute("data-svr-boot", BOOT_ID);

    script.onload = function () {
      log("optional module loader loaded");
    };

    script.onerror = function () {
      console.error("[SVR boot] optional module loader failed");
    };

    document.head.appendChild(script);
  }

  function markDocument() {
    if (document.documentElement) {
      document.documentElement.setAttribute("data-svr-phase", String(PHASE));
    }

    if (document.body) {
      document.body.setAttribute("data-svr-phase", String(PHASE));
    }
  }

  function boot() {
    markDocument();
    loadOptionalLoader();
    log("ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();