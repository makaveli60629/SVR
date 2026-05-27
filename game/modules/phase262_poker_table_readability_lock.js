/*
 * SVR Phase 262 — Poker Right-Deal Table Readability Lock
 * Runtime-safe visual alignment/readability layer.
 */
(function(){
  const BUILD = "PHASE-262-POKER-RIGHT-DEAL-TABLE-READABILITY-LOCK";

  const state = {
    build: BUILD,
    dealDirection: "right-to-left",
    dealerStartsLeft: true,
    cardY: 0.845,
    chipY: 0.82,
    cardScale: 1.18,
    communityCardRaise: 0.035,
    loadedAt: new Date().toISOString(),
    siteTouched: false
  };

  window.SVR_POKER_TABLE_LOCK = state;

  function emit(name, detail){
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: Object.assign({ build: BUILD }, detail || {}) }));
    } catch(_) {}
  }

  function nameOf(obj){
    return String(obj?.name || obj?.userData?.label || "").toLowerCase();
  }

  function isCard(obj){
    const n = nameOf(obj);
    const u = obj?.userData || {};
    return u.isCard || u.card || n.includes("card") || n.includes("community") || n.includes("hole");
  }

  function isChip(obj){
    const n = nameOf(obj);
    const u = obj?.userData || {};
    return u.isChip || u.chip || n.includes("chip") || n.includes("$1") || n.includes("$5") || n.includes("$25") || n.includes("$100") || n.includes("$500");
  }

  function alignPoker(scene){
    if (!scene || !scene.traverse) return { cards: 0, chips: 0 };

    let cards = 0;
    let chips = 0;

    scene.traverse(obj => {
      if (!obj) return;

      if (isCard(obj)) {
        cards++;
        obj.userData.isCard = true;
        obj.userData.dealDirection = "right-to-left";
        obj.userData.readabilityLocked = true;

        if (Number.isFinite(obj.position.y)) {
          obj.position.y = Math.max(obj.position.y, state.cardY);
        }

        if (obj.scale && obj.userData.phase262Scaled !== true) {
          obj.scale.multiplyScalar(state.cardScale);
          obj.userData.phase262Scaled = true;
        }
      }

      if (isChip(obj)) {
        chips++;
        obj.userData.isChip = true;
        obj.userData.grabbable = true;
        obj.position.y = state.chipY;
        obj.rotation.x = Math.PI / 2;
      }
    });

    const result = { cards, chips };
    emit("svr_phase262_poker_aligned", result);
    return result;
  }

  function lockDealDirection(){
    window.SVR_DEAL_RULES = Object.assign(window.SVR_DEAL_RULES || {}, {
      build: BUILD,
      visualDirection: "right-to-left",
      dealerStartsLeft: true,
      permanent: true,
      note: "Dealer deals first to player on dealer left, visual motion proceeds right-to-left around table."
    });

    emit("svr_deal_rules_locked", window.SVR_DEAL_RULES);
  }

  const api = {
    state,
    alignPoker,
    lockDealDirection,
    apply(){
      lockDealDirection();
      return alignPoker(window.SVR_SCENE || window.scene || window.__SVR_SCENE__);
    }
  };

  window.SVR_POKER_TABLE_READABILITY = api;

  window.addEventListener("svr_game_ready", () => {
    setTimeout(() => api.apply(), 700);
    setTimeout(() => api.apply(), 2200);
  });

  window.addEventListener("svr_world_ready", ev => {
    if (ev.detail?.scene) alignPoker(ev.detail.scene);
  });

  window.addEventListener("keydown", ev => {
    if (ev.key !== "F6") return;
    ev.preventDefault();
    alert("Phase 262 poker align:\n" + JSON.stringify(api.apply(), null, 2));
  });

  lockDealDirection();
  emit("svr_phase262_poker_table_ready", state);
})();
