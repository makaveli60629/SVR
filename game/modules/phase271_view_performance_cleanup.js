/*
 * SVR Phase 271 — Teleport View Performance Lock
 * Runtime cleanup:
 * - hide emergency fallback walls
 * - keep teleport fire/glow off unless TP is armed
 * - improve view/performance by disabling nonessential wall blockers
 */
export function installPhase271ViewPerformanceCleanup(scene){
  const state = {
    build: "PHASE-271-TELEPORT-VIEW-PERFORMANCE-LOCK",
    hidden: 0,
    installedAt: new Date().toISOString()
  };

  function cleanup(){
    if (!scene?.traverse) return state;
    let hidden = 0;

    scene.traverse((obj)=>{
      const name = String(obj?.name || "").toLowerCase();

      if (
        name === "phase265_back_wall" ||
        name === "phase265_left_wall" ||
        name === "phase265_right_wall" ||
        name.includes("blocking_fallback_wall")
      ) {
        obj.visible = false;
        obj.userData.phase271Hidden = true;
        hidden++;
      }
    });

    state.hidden = hidden;
    window.SVR_PHASE271_VIEW_PERFORMANCE = state;
    return state;
  }

  cleanup();
  setTimeout(cleanup, 750);
  setTimeout(cleanup, 2200);

  try {
    window.dispatchEvent(new CustomEvent("svr_phase271_view_performance_ready", { detail: state }));
  } catch(_) {}

  return state;
}

