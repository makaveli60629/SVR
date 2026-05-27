/*
 * SVR Game Update 2.0 — Stability Lock
 * Safe runtime cleanup:
 * - one lobby view
 * - hide fallback shell walls
 * - hide duplicate fallback table layer when real table exists
 * - keep fire/glow off unless teleport is armed
 * - suppress runtime/debug clutter from normal view
 */
export function installSVRGameUpdate2Lock({ scene, renderer, camera } = {}) {
  const BUILD = "PHASE-282-GAME-UPDATE-2-STABILITY-LOCK";

  const state = {
    build: BUILD,
    phase: 282,
    installed: true,
    hidden: 0,
    moved: 0,
    glowHidden: 0,
    checks: 0,
    siteTouched: false,
    installedAt: new Date().toISOString()
  };

  function low(value) {
    return String(value || "").toLowerCase();
  }

  function textOf(obj) {
    return low([
      obj?.name,
      obj?.type,
      obj?.userData?.name,
      obj?.userData?.tag,
      obj?.userData?.role,
      obj?.material?.name
    ].filter(Boolean).join(" "));
  }

  function hideObject(obj, reason) {
    if (!obj) return;
    obj.visible = false;
    obj.userData = obj.userData || {};
    obj.userData.svrUpdate2Hidden = true;
    obj.userData.svrHiddenReason = reason;
    state.hidden += 1;
  }

  function hasRealTable(targetScene) {
    let found = false;
    targetScene?.traverse?.((obj) => {
      const t = textOf(obj);
      if (
        obj.visible !== false &&
        !t.includes("phase265") &&
        !t.includes("fallback") &&
        (
          t.includes("poker_table") ||
          t.includes("table_felt") ||
          t.includes("svr_table") ||
          t.includes("table.glb")
        )
      ) {
        found = true;
      }
    });
    return found;
  }

  function glowOff(obj) {
    if (!obj) return;
    obj.visible = false;
    if (obj.userData?.light) obj.userData.light.intensity = 0;
    if (obj.userData?.palmOrb?.material) obj.userData.palmOrb.material.opacity = 0;
    if (obj.userData?.flame?.material) obj.userData.flame.material.opacity = 0;
    if (obj.userData?.lightning?.material) obj.userData.lightning.material.opacity = 0;
    state.glowHidden += 1;
  }

  function sideFromName(name) {
    const n = low(name);
    if (n.includes("left")) return "left";
    if (n.includes("right")) return "right";
    return "unknown";
  }

  function cleanupScene() {
    const targetScene = scene || window.SVR_SCENE || window.scene || window.g_scene;
    if (!targetScene?.traverse) return state;

    state.checks += 1;
    state.hidden = 0;
    state.moved = 0;
    state.glowHidden = 0;

    const realTable = hasRealTable(targetScene);
    const tpState = window.SVR_HAND_TELEPORT_STATE || {};
    const teleportActive = !!tpState.active;
    const activeHand = tpState.activeHand || "none";

    targetScene.traverse((obj) => {
      if (!obj) return;

      const name = low(obj.name);
      const t = textOf(obj);

      if (
        name === "phase265_back_wall" ||
        name === "phase265_left_wall" ||
        name === "phase265_right_wall" ||
        t.includes("blocking_fallback_wall") ||
        t.includes("fallback wall")
      ) {
        hideObject(obj, "update2-hide-blocking-fallback-wall");
      }

      if (realTable && name.startsWith("phase265_")) {
        if (
          name.includes("poker_table") ||
          name.includes("readable_card") ||
          name.includes("flat_chip") ||
          name.includes("svr_table_logo") ||
          name.includes("pass_bet_line")
        ) {
          hideObject(obj, "update2-hide-duplicate-fallback-table-layer");
        }
      }

      if (name.includes("fire_lightning_hand_glow")) {
        const side = sideFromName(name);
        const shouldShow = teleportActive && (
          activeHand === "none" ||
          activeHand === side ||
          side === "unknown"
        );
        if (!shouldShow) glowOff(obj);
      }

      if (obj.position && (
        t.includes("hand_history") ||
        t.includes("hand history") ||
        t.includes("showdown") ||
        t.includes("winner hud") ||
        t.includes("ranking") ||
        t.includes("debug hud") ||
        t.includes("optional module loader")
      )) {
        obj.position.x = obj.position.x < 0 ? -6.8 : 6.8;
        obj.position.y = Math.max(obj.position.y, 5.6);
        obj.position.z = -10.8;
        obj.userData.svrUpdate2MovedOutOfSpawnView = true;
        state.moved += 1;
      }
    });

    state.updatedAt = new Date().toISOString();
    window.SVR_GAME_UPDATE_2_LOCK_STATE = state;
    return state;
  }

  function cleanDom() {
    const status = document.getElementById("status");
    const err = document.getElementById("err");
    const recovery = document.getElementById("bootRecovery");
    const optionalPanel = document.getElementById("svr-optional-module-loader-panel");

    document.querySelectorAll("body *").forEach((el) => {
      const txt = String(el.textContent || "");
      if (txt.includes("BUILD: PHASE-")) {
        el.textContent = "BUILD: " + BUILD;
      }
    });

    if (status && /runtime shield|error|recovered/i.test(status.textContent || "") && (scene || window.SVR_SCENE)) {
      status.textContent = "Ready. Enter VR.";
    }

    if (err) err.style.display = "none";
    if (recovery) recovery.style.display = "none";
    if (optionalPanel) optionalPanel.style.display = "none";
  }

  function tick() {
    cleanupScene();
    cleanDom();
    return state;
  }

  const api = { state, tick, cleanupScene, cleanDom };
  window.SVR_GAME_UPDATE_2_LOCK = api;

  window.addEventListener("svr_game_ready", () => {
    setTimeout(tick, 100);
    setTimeout(tick, 800);
    setTimeout(tick, 2200);
    setTimeout(tick, 5000);
  });

  setTimeout(tick, 250);
  setTimeout(tick, 1200);
  setInterval(tick, 5000);

  try {
    window.dispatchEvent(new CustomEvent("svr_game_update_2_lock_ready", { detail: state }));
  } catch (_) {}

  return api;
}

