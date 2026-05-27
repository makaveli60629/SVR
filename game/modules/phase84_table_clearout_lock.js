/*
 * SVR Phase 84 — Table Clearout Lock
 * Temporary game-side table clearout.
 * Hides the active lobby table package without deleting assets.
 */
export function installPhase84TableClearoutLock({ scene, camera } = {}) {
  const BUILD = "PHASE-84-TABLE-CLEAROUT-LOCK";

  const state = {
    build: BUILD,
    active: true,
    hidden: 0,
    checks: 0,
    siteTouched: false,
    mode: "temporary-table-disabled",
    updatedAt: new Date().toISOString()
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
      obj?.userData?.build,
      obj?.userData?.svrType,
      obj?.material?.name
    ].filter(Boolean).join(" "));
  }

  function isNearLobbyTable(obj) {
    if (!obj?.position) return false;
    const x = Number(obj.position.x || 0);
    const z = Number(obj.position.z || 0);
    return Math.hypot(x, z) <= 5.2;
  }

  function isTableObject(obj) {
    const name = low(obj?.name);
    const t = textOf(obj);

    const strongTerms = [
      "phase265_poker_table",
      "poker_table",
      "table_felt",
      "table felt",
      "table_rail",
      "padded_rail",
      "casino_table",
      "pass_bet_line",
      "pass line",
      "bet line",
      "svr_table_logo",
      "dealer_button",
      "dealer button",
      "gold_d",
      "community_card",
      "community card",
      "board_card",
      "hole_card",
      "readable_card",
      "playing_card",
      "card_mesh",
      "flat_chip",
      "chip_stack",
      "chip stack",
      "poker_chip",
      "denomination",
      "pot_chip",
      "pot stack",
      "hand_history",
      "winner hud",
      "showdown",
      "poker_hud",
      "ranking",
      "table_label"
    ];

    if (strongTerms.some(term => name.includes(term) || t.includes(term))) return true;

    // Hide procedural table bots only if they are in the table center zone.
    if (isNearLobbyTable(obj) && (
      name.includes("bot") ||
      t.includes("bot nova") ||
      t.includes("bot vega") ||
      t.includes("bot orbit") ||
      t.includes("bot lux") ||
      t.includes("seated npc") ||
      t.includes("procedural bot") ||
      t.includes("table bot")
    )) {
      return true;
    }

    // Hide generic table/felt/chip/card objects only near lobby center.
    if (isNearLobbyTable(obj) && (
      name.includes("table") ||
      name.includes("felt") ||
      name.includes("chip") ||
      name.includes("card") ||
      t.includes("table") ||
      t.includes("felt") ||
      t.includes("chip") ||
      t.includes("card")
    )) {
      // Do not hide storefront/portal signs just because they mention store/table text.
      if (t.includes("portal") || t.includes("storefront") || t.includes("kiosk") || t.includes("button")) return false;
      return true;
    }

    return false;
  }

  function hideObject(obj, reason) {
    if (!obj || obj.userData?.phase84Hidden) return;
    obj.visible = false;
    obj.userData = obj.userData || {};
    obj.userData.phase84Hidden = true;
    obj.userData.phase84HiddenReason = reason;
    state.hidden += 1;
  }

  function clearScene() {
    const targetScene = scene || window.SVR_SCENE || window.scene || window.g_scene;
    if (!targetScene?.traverse) return state;

    state.checks += 1;
    state.hidden = 0;

    targetScene.traverse((obj) => {
      if (!obj) return;
      if (isTableObject(obj)) hideObject(obj, "phase84-temporary-table-clearout");
    });

    // Turn off poker action layer while table is intentionally disabled.
    if (targetScene.userData) {
      targetScene.userData._pokerActions = {
        fold: () => console.warn("[SVR] Poker table temporarily disabled by Phase 84."),
        call: () => console.warn("[SVR] Poker table temporarily disabled by Phase 84."),
        raise: () => console.warn("[SVR] Poker table temporarily disabled by Phase 84."),
        allIn: () => console.warn("[SVR] Poker table temporarily disabled by Phase 84."),
        nextHand: () => console.warn("[SVR] Poker table temporarily disabled by Phase 84.")
      };
    }

    state.updatedAt = new Date().toISOString();
    window.SVR_PHASE84_TABLE_CLEAROUT = state;
    return state;
  }

  function cleanDom() {
    document.querySelectorAll("body *").forEach((el) => {
      const txt = String(el.textContent || "");
      if (txt.includes("BUILD: PHASE-")) {
        el.textContent = "BUILD: " + BUILD;
      }
    });
  }

  function tick() {
    clearScene();
    cleanDom();
    return state;
  }

  const api = { state, tick, clearScene, cleanDom };
  window.SVR_TABLE_CLEAROUT_LOCK = api;

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
    window.dispatchEvent(new CustomEvent("svr_phase84_table_clearout_ready", { detail: state }));
  } catch (_) {}

  return api;
}

