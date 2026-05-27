/*
 * SVR Phase 261 — VR Interaction Repair Lock
 * Safe bridge for kiosk, portals, watch, cards, and chips.
 * Loads after game ready; does not block boot.
 */
(function(){
  const BUILD = "PHASE-265-BOOT-VISIBLE-LOBBY-SHELL-LOCK";

  const state = {
    build: BUILD,
    ready: true,
    scanned: 0,
    selected: 0,
    lastSelect: null,
    siteTouched: false,
    loadedAt: new Date().toISOString()
  };

  window.SVR_PHASE261_INTERACTION = state;

  function emit(name, detail){
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: Object.assign({ build: BUILD }, detail || {}) }));
    } catch(_) {}
  }

  function nameOf(obj){
    return String(obj?.name || obj?.userData?.label || "").toLowerCase();
  }

  function classify(obj){
    const n = nameOf(obj);
    const u = obj?.userData || {};

    if (u.phase261Type) return u.phase261Type;
    if (u.interactionType) return u.interactionType;
    if (u.isChip || u.chip || n.includes("chip") || n.includes("$1") || n.includes("$5") || n.includes("$25") || n.includes("$100") || n.includes("$500")) return "chip";
    if (u.isCard || u.card || n.includes("card")) return "card";
    if (n.includes("kiosk") || n.includes("store")) return "kiosk";
    if (n.includes("reiki")) return "reiki";
    if (n.includes("pga") || n.includes("drive")) return "pga";
    if (n.includes("chip") && n.includes("putt")) return "chip-putt";
    if (n.includes("scorpion")) return "scorpion";
    if (n.includes("smoker")) return "smoker";
    if (n.includes("watch")) return "watch";
    return null;
  }

  function mark(obj, type){
    if (!obj || !obj.userData) return false;
    obj.userData.svrInteractive = true;
    obj.userData.phase261Type = type || classify(obj) || "generic";
    obj.userData.phase261 = true;
    return true;
  }

  function scan(scene){
    if (!scene || !scene.traverse) return 0;
    let count = 0;

    scene.traverse(obj => {
      const type = classify(obj);
      if (!type) return;
      if (mark(obj, type)) count++;
    });

    state.scanned = count;
    emit("svr_phase261_scan_done", { count });
    return count;
  }

  function route(type){
    if (type === "reiki") location.href = "./reiki.html";
    else if (type === "pga") location.href = "./pga-drive.html";
    else if (type === "chip-putt") location.href = "./chip-putt.html";
    else if (type === "scorpion") location.href = "./scorpion.html";
    else if (type === "smoker") location.href = "./smoker-lounge.html";
    else if (type === "store-room") location.href = "./store-room.html";
  }

  function select(obj, source){
    const type = classify(obj);
    if (!type) return false;

    state.selected++;
    state.lastSelect = { type, source: source || "unknown", name: obj?.name || "", at: new Date().toISOString() };
    emit("svr_phase261_select", state.lastSelect);

    if (type === "kiosk") {
      if (window.SVR_STORE_EQUIP_API?.open) window.SVR_STORE_EQUIP_API.open();
      else window.dispatchEvent(new CustomEvent("svr_store_kiosk_select", { detail: { source: source || "unknown" } }));
      return true;
    }

    if (type === "chip") {
      if (window.SVR_CHIP_PHYSICS?.grab) window.SVR_CHIP_PHYSICS.grab(obj);
      emit("svr_chip_select_request", { object: obj?.name || "chip", source });
      return true;
    }

    if (type === "card") {
      emit("svr_card_select_request", { object: obj?.name || "card", source });
      return true;
    }

    if (type === "watch") {
      emit("svr_watch_select_request", { source });
      return true;
    }

    if (["reiki","pga","chip-putt","scorpion","smoker","store-room"].includes(type)) {
      route(type);
      return true;
    }

    return false;
  }

  function installDesktopRay(){
    if (window.__SVR_PHASE261_DESKTOP_RAY) return;
    window.__SVR_PHASE261_DESKTOP_RAY = true;

    window.addEventListener("click", ev => {
      try {
        const THREE = window.THREE;
        const scene = window.SVR_SCENE;
        const camera = window.SVR_CAMERA;
        const renderer = window.SVR_RENDERER;
        if (!THREE || !scene || !camera || !renderer) return;

        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((ev.clientX - rect.left) / rect.width) * 2 - 1,
          -((ev.clientY - rect.top) / rect.height) * 2 + 1
        );

        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);

        const targets = [];
        scene.traverse(o => { if (o?.userData?.svrInteractive && o.visible !== false) targets.push(o); });

        const hits = ray.intersectObjects(targets, true);
        if (!hits.length) return;

        let obj = hits[0].object;
        while (obj && !obj.userData?.svrInteractive && obj.parent) obj = obj.parent;
        if (obj) select(obj, "desktop-ray");
      } catch(error) {
        console.warn("[SVR Phase261 desktop select skipped]", error);
      }
    }, true);
  }

  const api = {
    state,
    scan,
    mark,
    select,
    apply(){
      return scan(window.SVR_SCENE || window.scene || window.__SVR_SCENE__);
    },
    openKiosk(){
      if (window.SVR_STORE_EQUIP_API?.open) window.SVR_STORE_EQUIP_API.open();
      else window.dispatchEvent(new CustomEvent("svr_store_kiosk_select", { detail: { source: "phase261-api" } }));
    }
  };

  window.SVR_INTERACTION_REPAIR = api;

  window.addEventListener("svr_game_ready", () => {
    setTimeout(() => {
      api.apply();
      installDesktopRay();
    }, 700);
  });

  window.addEventListener("svr_vr_select_object", ev => {
    if (ev.detail?.object) select(ev.detail.object, ev.detail.source || "vr-select");
  });

  window.addEventListener("svr_vr_interaction_intent", ev => {
    const type = ev.detail?.type;
    if (type === "kiosk" || type === "store") api.openKiosk();
    else route(type);
  });

  window.addEventListener("keydown", ev => {
    if (ev.key === "F7") {
      ev.preventDefault();
      alert("Phase 261 interactive objects: " + api.apply());
    }
    if (ev.key && ev.key.toLowerCase() === "o" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      api.openKiosk();
    }
  });

  emit("svr_phase261_interaction_repair_ready", state);
})();




