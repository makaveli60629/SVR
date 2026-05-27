/*
 * SVR Phase 260 — Runtime Shield Safe Interaction Loader
 * Loads interaction modules dynamically after the core game gets ready.
 * One failed optional module must not black-screen the lobby.
 */
(function(){
  const BUILD = "PHASE-267-JS-NEWLINE-BOOT-RENDER-REPAIR-LOCK";
  const TAG = "phase267-js-newline-boot-repair";

  const modules = [
    "./phase255_control_lock.js",
    "./phase256_chip_physics_lock.js",
    "./phase257_alignment_lock.js",
    "./phase258_kiosk_equip_lock.js",
    "./phase259_vr_interaction_lock.js"
  ,
    "./phase261_interaction_repair.js"];

  const state = {
    build: BUILD,
    status: "waiting-for-game-ready",
    loaded: [],
    failed: [],
    startedAt: new Date().toISOString(),
    finishedAt: null,
    siteTouched: false
  };

  window.SVR_SAFE_INTERACTION_LOADER = state;

  function emit(name, detail){
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: Object.assign({ build: BUILD }, detail || {}) }));
    } catch(_) {}
  }

  async function loadOne(path){
    try {
      const url = new URL(path + "?v=" + TAG, import.meta.url).href;
      await import(url);
      state.loaded.push(path);
      emit("svr_safe_interaction_loaded", { module: path });
    } catch (error) {
      const msg = String(error && (error.stack || error.message) || error);
      state.failed.push({ module: path, error: msg });
      console.warn("[SVR safe interaction module skipped]", path, error);
      emit("svr_safe_interaction_failed", { module: path, error: msg });
    }
  }

  async function loadAll(){
    if (state.status === "loading" || state.status === "done") return;
    state.status = "loading";

    for (const path of modules) {
      await loadOne(path);
    }

    state.status = state.failed.length ? "partial" : "ok";
    state.finishedAt = new Date().toISOString();

    // Re-apply known alignment/interaction scans after all optional modules load.
    setTimeout(() => {
      try { if (window.SVR_ALIGNMENT?.apply) window.SVR_ALIGNMENT.apply(); } catch(e) {}
      try { if (window.SVR_CHIP_PHYSICS?.scan && window.SVR_SCENE) window.SVR_CHIP_PHYSICS.scan(window.SVR_SCENE); } catch(e) {}
      try { if (window.SVR_VR_INTERACTION?.apply) window.SVR_VR_INTERACTION.apply(); } catch(e) {}
    }, 500);

    emit("svr_safe_interaction_loader_done", {
      status: state.status,
      loaded: state.loaded,
      failed: state.failed
    });
  }

  window.SVR_SAFE_INTERACTION_LOADER_API = { state, loadAll };

  window.addEventListener("svr_game_ready", () => {
    setTimeout(loadAll, 300);
  });

  // Fallback: if ready signal was already sent before this module attached.
  setTimeout(() => {
    const guardReady = window.SVR_BOOT_GUARD && window.SVR_BOOT_GUARD.ready && window.SVR_BOOT_GUARD.ready();
    if (guardReady || document.readyState === "complete") loadAll();
  }, 2500);

  emit("svr_phase260_safe_loader_ready", state);
})();








