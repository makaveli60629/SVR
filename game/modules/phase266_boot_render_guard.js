/*
 * SVR Phase 266 — Early Render World Timeout Lock
 * Starts a render loop immediately so the visible lobby shell draws before world/model loading finishes.
 */
import * as THREE from "three";

const BUILD = "PHASE-270-ASSET-PATH-LOADER-SMOOTH-LOCK";

export function startPhase266EarlyRenderLoop({ renderer, scene, camera, statusCb } = {}){
  if (!renderer || !scene || !camera) return null;

  if (window.SVR_PHASE266_EARLY_RENDER?.started) {
    return window.SVR_PHASE266_EARLY_RENDER;
  }

  const state = {
    build: BUILD,
    started: true,
    worldReady: false,
    frames: 0,
    startedAt: new Date().toISOString(),
    stoppedAt: null
  };

  function safeStatus(text){
    try { if (typeof statusCb === "function") statusCb(text); } catch(_) {}
  }

  renderer.setAnimationLoop(() => {
    try {
      state.frames++;

      if (!renderer.xr.isPresenting) {
        scene.userData._camera = camera;
      } else {
        scene.userData._camera = renderer.xr.getCamera(camera);
      }

      renderer.render(scene, camera);
    } catch(error) {
      console.warn("[SVR Phase266 early render skipped frame]", error);
    }
  });

  state.markWorldReady = function(world){
    state.worldReady = true;
    state.worldReadyAt = new Date().toISOString();
    state.world = !!world;
    safeStatus("World ready. Full runtime loading…");
  };

  state.stop = function(){
    state.stoppedAt = new Date().toISOString();
  };

  window.SVR_PHASE266_EARLY_RENDER = state;

  try {
    window.dispatchEvent(new CustomEvent("svr_phase266_early_render_started", { detail: state }));
  } catch(_) {}

  safeStatus("Visible lobby shell rendering…");
  return state;
}

export function createPhase266FallbackWorld(scene, reason = "timeout"){
  const fallback = {
    build: BUILD,
    fallback: true,
    reason: String(reason && (reason.message || reason) || "timeout"),
    roomClamp: 6.2,
    tableCenter: { x: 0, y: 0.82, z: 0 },
    joinRadius: 2.8,
    previewOrbitRadius: 7.5,
    seats: [
      { label: "Player Front", x: 0, z: 2.15 },
      { label: "Bot Left 1", x: -1.95, z: 1.05 },
      { label: "Bot Left 2", x: -2.15, z: -0.75 },
      { label: "Dealer Side", x: 0, z: -2.05 },
      { label: "Bot Right 2", x: 2.15, z: -0.75 },
      { label: "Bot Right 1", x: 1.95, z: 1.05 }
    ],
    sceneTargets: {
      lobby: { pos: { x: 0, z: 4.8 }, look: { x: 0, z: 0 } },
      table: { pos: { x: 0, z: 2.35 }, look: { x: 0, z: 0 } },
      seat: { pos: { x: 0, z: 2.15 }, look: { x: 0, z: 0 } },
      reiki: { pos: { x: -3.3, z: -4.6 }, look: { x: -3.3, z: -5.6 } },
      pga: { pos: { x: 0, z: -4.6 }, look: { x: 0, z: -5.6 } },
      scorpion: { pos: { x: 3.3, z: -4.6 }, look: { x: 3.3, z: -5.6 } },
      sponsor: { pos: { x: 4.6, z: -1.4 }, look: { x: 0, z: 0 } },
      legends: { pos: { x: 3.8, z: -2.6 }, look: { x: 0, z: 0 } }
    }
  };

  if (scene) {
    scene.userData.phase266FallbackWorld = fallback;
  }

  window.SVR_PHASE266_FALLBACK_WORLD = fallback;

  try {
    window.dispatchEvent(new CustomEvent("svr_phase266_fallback_world_ready", { detail: fallback }));
  } catch(_) {}

  return fallback;
}







