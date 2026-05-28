(function () {
  "use strict";

  const PHASE = 250;

  const modules = [
    "modules/moon_mars_locomotion.js",
    "modules/svr_phase250_core.js"
  ];

  const state = {
    phase: PHASE,
    loaded: [],
    failed: [],
    startedAt: new Date().toISOString()
  };

  function log(message, data) {
    if (data !== undefined) {
      console.log(`[SVR optional loader P${PHASE}] ${message}`, data);
    } else {
      console.log(`[SVR optional loader P${PHASE}] ${message}`);
    }
  }

  function alreadyLoaded(src) {
    return !!document.querySelector(`script[data-svr-module="${src}"]`);
  }

  function loadScript(src) {
    return new Promise(function (resolve) {
      if (alreadyLoaded(src)) {
        state.loaded.push(src);
        resolve({ src, ok: true, cached: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src + (src.includes("?") ? "&" : "?") + "v=phase250";
      script.async = false;
      script.defer = false;
      script.setAttribute("data-svr-module", src);

      script.onload = function () {
        state.loaded.push(src);
        log("loaded " + src);
        resolve({ src, ok: true });
      };

      script.onerror = function () {
        const fail = { src, ok: false, error: "load failed" };
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

    window.dispatchEvent(new CustomEvent("svr:optional-modules-ready", {
      detail: state
    }));

    log("complete", state);
    return state;
  }

  window.SVROptionalModuleLoader = {
    init,
    state,
    modules
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();