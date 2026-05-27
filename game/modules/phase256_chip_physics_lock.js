/*
 * SVR Phase 256 — True Chip Grab Physics Lock
 * Lightweight Quest-safe chip physics prep:
 * - clamps chips to felt
 * - marks chips as grabbable
 * - gives chips simple velocity/drop behavior
 * - avoids heavy physics engine until final performance test
 */
(function(){
  const BUILD = "PHASE-256-TRUE-CHIP-GRAB-PHYSICS-LOCK";

  const state = {
    build: BUILD,
    enabled: true,
    feltY: 0.82,
    chipRadius: 0.075,
    chipHeight: 0.018,
    gravity: -4.8,
    damping: 0.88,
    throwEnabled: true,
    loadedAt: new Date().toISOString(),
    tracked: 0
  };

  window.SVR_CHIP_PHYSICS_LOCK = state;

  function emit(name, detail){
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: Object.assign({ build: BUILD }, detail || {}) }));
    } catch(_) {}
  }

  function isChip(obj){
    if (!obj) return false;
    const n = String(obj.name || "").toLowerCase();
    const ud = obj.userData || {};
    return ud.isChip || ud.chip || n.includes("chip") || n.includes("$1") || n.includes("$5") || n.includes("$25") || n.includes("$100") || n.includes("$500");
  }

  function markChip(obj){
    if (!obj || !obj.userData) return;
    obj.userData.isChip = true;
    obj.userData.grabbable = true;
    obj.userData.physicsChip = true;
    obj.userData.velocity = obj.userData.velocity || { x: 0, y: 0, z: 0 };
    obj.userData.homeY = state.feltY;
    obj.userData.phase256 = true;

    // Keep chips flat. Most chip meshes should lie like discs.
    obj.rotation.x = Math.PI / 2;
    obj.rotation.z = obj.rotation.z || 0;

    // Clamp obvious float/sink problems.
    if (Number.isFinite(obj.position.y)) {
      obj.position.y = Math.max(state.feltY, Math.min(obj.position.y, state.feltY + 0.08));
    }
  }

  function scan(scene){
    if (!scene || !scene.traverse) return 0;
    let count = 0;
    scene.traverse(obj => {
      if (isChip(obj)) {
        markChip(obj);
        count++;
      }
    });
    state.tracked = count;
    emit("svr_chip_physics_scan", { tracked: count });
    return count;
  }

  function tick(scene, dt){
    if (!state.enabled || !scene || !scene.traverse) return;
    const step = Math.min(Math.max(dt || 0.016, 0.001), 0.033);

    scene.traverse(obj => {
      if (!obj?.userData?.physicsChip) return;

      const v = obj.userData.velocity || { x: 0, y: 0, z: 0 };

      if (obj.userData.grabbed) {
        v.x = 0; v.y = 0; v.z = 0;
        obj.userData.velocity = v;
        return;
      }

      // Lightweight gravity/drop. If chip is above felt, let it fall.
      if (obj.position.y > state.feltY + 0.002 || Math.abs(v.y) > 0.001) {
        v.y += state.gravity * step;
        obj.position.x += v.x * step;
        obj.position.y += v.y * step;
        obj.position.z += v.z * step;
        v.x *= state.damping;
        v.z *= state.damping;

        if (obj.position.y <= state.feltY) {
          obj.position.y = state.feltY;
          v.y = 0;
          v.x *= 0.55;
          v.z *= 0.55;
        }
      } else {
        obj.position.y = state.feltY;
      }

      // Keep flat after movement.
      obj.rotation.x = Math.PI / 2;
      obj.userData.velocity = v;
    });
  }

  // Public API for future VR hand/controller grab modules.
  const api = {
    state,
    scan,
    tick,
    markChip,
    grab(obj){
      if (!obj) return false;
      markChip(obj);
      obj.userData.grabbed = true;
      emit("svr_chip_grabbed", { name: obj.name || "chip" });
      return true;
    },
    release(obj, velocity){
      if (!obj) return false;
      markChip(obj);
      obj.userData.grabbed = false;
      obj.userData.velocity = velocity || { x: 0, y: 0, z: 0 };
      emit("svr_chip_released", { name: obj.name || "chip", velocity: obj.userData.velocity });
      return true;
    }
  };

  window.SVR_CHIP_PHYSICS = api;

  // Hook world ready / scene references when available.
  function autoScan(){
    const scene = window.SVR_SCENE || window.scene || (window.SVR_MAIN_RUNTIME_STATE && window.SVR_MAIN_RUNTIME_STATE.scene);
    if (scene) scan(scene);
  }

  window.addEventListener("svr_game_ready", () => setTimeout(autoScan, 500));
  window.addEventListener("svr_world_ready", ev => {
    if (ev.detail && ev.detail.scene) scan(ev.detail.scene);
  });

  emit("svr_chip_physics_ready", state);
})();
