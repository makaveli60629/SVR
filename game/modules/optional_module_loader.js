(function () {
  "use strict";

  const PHASE = 253;

  const modules = [
    "modules/moon_mars_locomotion.js",
    "modules/hand_controller_navigation.js",
    "modules/hub_user_friendly.js",
    "modules/watch.js",
    "modules/profile_avatar_bridge.js",
    "modules/poker_table_polish.js",
    "modules/svr_module_health.js",
    "modules/svr_phase250_core.js"
  ];

  const state = {
    phase: PHASE,
    loaded: [],
    failed: [],
    skipped: [],
    startedAt: new Date().toISOString(),
    finishedAt: ""
  };

  function log(message, data) {
    if (data !== undefined) console.log(`[SVR optional loader P${PHASE}] ${message}`, data);
    else console.log(`[SVR optional loader P${PHASE}] ${message}`);
  }

  function alreadyLoaded(src) {
    return !!document.querySelector(`script[data-svr-module="${src}"]`);
  }

  function loadScript(src) {
    return new Promise(function (resolve) {
      if (alreadyLoaded(src)) {
        state.skipped.push(src);
        resolve({ src, ok: true, cached: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src + (src.includes("?") ? "&" : "?") + "v=phase253";
      script.async = false;
      script.defer = false;
      script.setAttribute("data-svr-module", src);

      script.onload = function () {
        state.loaded.push(src);
        log("loaded " + src);
        resolve({ src, ok: true });
      };

      script.onerror = function () {
        const fail = { src, ok: false, error: "load failed", time: new Date().toISOString() };
        state.failed.push(fail);
        console.warn(`[SVR optional loader P${PHASE}] failed ${src}`);
        resolve(fail);
      };

      document.head.appendChild(script);
    });
  }

  async function init() {
    window.SVROptionalLoaderState = state;

    for (const src of modules) {
      await loadScript(src);
    }

    state.finishedAt = new Date().toISOString();

    window.dispatchEvent(new CustomEvent("svr:optional-modules-ready", { detail: state }));
    log("complete", state);
    return state;
  }

  window.SVROptionalModuleLoader = { init, state, modules };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();