(function () {
  "use strict";

  const PHASE = 250;
  const PHASE_LABEL = "Phase 250";
  const BUILD_TAG = "SVR-PHASE-250";
  const BOOT_EVENT = "svr:phase250-ready";

  const state = {
    phase: PHASE,
    label: PHASE_LABEL,
    buildTag: BUILD_TAG,
    ready: false,
    modules: {},
    errors: [],
    startedAt: new Date().toISOString()
  };

  function log(message, data) {
    if (data !== undefined) {
      console.log(`[SVR ${PHASE_LABEL}] ${message}`, data);
    } else {
      console.log(`[SVR ${PHASE_LABEL}] ${message}`);
    }
  }

  function warn(message, data) {
    if (data !== undefined) {
      console.warn(`[SVR ${PHASE_LABEL}] ${message}`, data);
    } else {
      console.warn(`[SVR ${PHASE_LABEL}] ${message}`);
    }
  }

  function recordError(scope, error) {
    const item = {
      scope,
      message: error && error.message ? error.message : String(error),
      time: new Date().toISOString()
    };
    state.errors.push(item);
    console.error(`[SVR ${PHASE_LABEL}] ${scope}`, error);
  }

  function ensureHud() {
    let hud = document.getElementById("svr-phase250-hud");
    if (hud) return hud;

    hud = document.createElement("div");
    hud.id = "svr-phase250-hud";
    hud.setAttribute("data-svr-phase", String(PHASE));
    hud.style.position = "fixed";
    hud.style.left = "12px";
    hud.style.bottom = "12px";
    hud.style.zIndex = "99999";
    hud.style.padding = "10px 12px";
    hud.style.border = "1px solid rgba(0,255,255,0.35)";
    hud.style.borderRadius = "12px";
    hud.style.background = "rgba(0,0,0,0.62)";
    hud.style.color = "#d8ffff";
    hud.style.font = "12px/1.35 system-ui, Segoe UI, Arial";
    hud.style.boxShadow = "0 0 24px rgba(0,255,255,0.18)";
    hud.style.pointerEvents = "none";
    hud.innerHTML = `<strong>SVR ${PHASE_LABEL}</strong><br>Moon / Mars locomotion online`;
    document.body.appendChild(hud);
    return hud;
  }

  function updateHud(extra) {
    const hud = ensureHud();
    const locomotion = window.SVRMoonMarsLocomotion;
    const sceneName = locomotion && locomotion.getSceneName ? locomotion.getSceneName() : "auto";
    const mode = locomotion && locomotion.getMode ? locomotion.getMode() : "smooth";
    hud.innerHTML = `<strong>SVR ${PHASE_LABEL}</strong><br>Scene: ${sceneName}<br>Locomotion: ${mode}${extra ? `<br>${extra}` : ""}`;
  }

  function safeInitModule(name, init) {
    try {
      const result = init();
      state.modules[name] = {
        ok: true,
        result: result || true,
        time: new Date().toISOString()
      };
      log(`${name} ready`);
      return result;
    } catch (error) {
      state.modules[name] = {
        ok: false,
        error: error && error.message ? error.message : String(error),
        time: new Date().toISOString()
      };
      recordError(name, error);
      return null;
    }
  }

  function patchConsoleMarker() {
    window.SVR_PHASE = PHASE;
    window.SVR_PHASE_LABEL = PHASE_LABEL;
    window.SVR_BUILD_TAG = BUILD_TAG;
    window.SVR_PHASE250_STATE = state;
  }

  function ensureSceneMarkers() {
    const body = document.body || document.documentElement;
    body.setAttribute("data-svr-phase", String(PHASE));
    body.setAttribute("data-svr-build", BUILD_TAG);

    const scene = document.querySelector("a-scene");
    if (scene) {
      scene.setAttribute("data-svr-phase", String(PHASE));
      scene.setAttribute("data-svr-build", BUILD_TAG);
    }
  }

  function init() {
    if (state.ready) return state;

    patchConsoleMarker();
    ensureSceneMarkers();

    safeInitModule("hud", function () {
      ensureHud();
      updateHud("Ready");
      return true;
    });

    safeInitModule("moonMarsLocomotion", function () {
      if (window.SVRMoonMarsLocomotion && typeof window.SVRMoonMarsLocomotion.init === "function") {
        return window.SVRMoonMarsLocomotion.init({
          phase: PHASE,
          hudUpdate: updateHud
        });
      }
      warn("SVRMoonMarsLocomotion not loaded yet. Loader will retry.");
      return false;
    });

    state.ready = true;

    window.dispatchEvent(new CustomEvent(BOOT_EVENT, {
      detail: state
    }));

    log("Phase 250 core ready", state);
    return state;
  }

  function retryLocomotion() {
    if (window.SVRMoonMarsLocomotion && typeof window.SVRMoonMarsLocomotion.init === "function") {
      safeInitModule("moonMarsLocomotionRetry", function () {
        return window.SVRMoonMarsLocomotion.init({
          phase: PHASE,
          hudUpdate: updateHud
        });
      });
    }
  }

  window.SVRPhase250 = {
    init,
    state,
    updateHud,
    recordError,
    retryLocomotion
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("load", function () {
    setTimeout(retryLocomotion, 350);
  });
})();