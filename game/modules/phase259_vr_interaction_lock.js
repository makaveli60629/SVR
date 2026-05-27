/*
 * SVR Phase 259 — VR Interaction Everything Lock
 * Adds a shared VR interaction/ray/select layer:
 * - Quest controller trigger/select
 * - hand pinch/select event bridge
 * - ray hit testing
 * - kiosk + portal + chip/card hooks
 * - desktop fallback remains intact
 */
(function(){
  const BUILD = "PHASE-259-VR-INTERACTION-EVERYTHING-LOCK";

  const state = {
    build: BUILD,
    enabled: true,
    rayLength: 10,
    interactiveCount: 0,
    lastHit: null,
    lastSelect: null,
    siteTouched: false,
    loadedAt: new Date().toISOString()
  };

  window.SVR_VR_INTERACTION_LOCK = state;

  function emit(name, detail){
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: Object.assign({ build: BUILD }, detail || {}) }));
    } catch(_) {}
  }

  function lowerName(obj){
    return String(obj?.name || obj?.userData?.label || "").toLowerCase();
  }

  function classify(obj){
    const name = lowerName(obj);
    const u = obj?.userData || {};

    if (u.interactionType) return u.interactionType;
    if (u.isChip || u.chip || name.includes("chip") || name.includes("$1") || name.includes("$5") || name.includes("$25") || name.includes("$100")) return "chip";
    if (u.isCard || u.card || name.includes("card")) return "card";
    if (name.includes("store") || name.includes("kiosk")) return "kiosk";
    if (name.includes("reiki")) return "portal:reiki";
    if (name.includes("pga") || name.includes("drive") || name.includes("chip-putt")) return "portal:pga";
    if (name.includes("scorpion")) return "portal:scorpion";
    if (name.includes("smoker")) return "portal:smoker";
    if (name.includes("watch")) return "watch";
    return null;
  }

  function markInteractive(obj, type){
    if (!obj || !obj.userData) return false;
    obj.userData.svrInteractive = true;
    obj.userData.interactionType = type || classify(obj) || "generic";
    obj.userData.phase259 = true;
    return true;
  }

  function scan(scene){
    if (!scene || !scene.traverse) return 0;
    let count = 0;

    scene.traverse(obj => {
      const type = classify(obj);
      if (!type) return;
      if (markInteractive(obj, type)) count++;
    });

    state.interactiveCount = count;
    emit("svr_vr_interaction_scan", { count });
    return count;
  }

  function selectObject(obj, source){
    if (!obj) return false;

    const type = obj.userData?.interactionType || classify(obj);
    if (!type) return false;

    state.lastSelect = {
      name: obj.name || "",
      type,
      source: source || "unknown",
      at: new Date().toISOString()
    };

    emit("svr_vr_object_selected", state.lastSelect);

    // Kiosk
    if (type === "kiosk") {
      if (window.SVR_STORE_EQUIP_API?.open) {
        window.SVR_STORE_EQUIP_API.open();
        return true;
      }
      emit("svr_store_kiosk_select", { source });
      return true;
    }

    // Chips/cards
    if (type === "chip") {
      if (window.SVR_CHIP_PHYSICS?.grab) {
        window.SVR_CHIP_PHYSICS.grab(obj);
      }
      emit("svr_chip_select_request", { name: obj.name || "chip", source });
      return true;
    }

    if (type === "card") {
      emit("svr_card_select_request", { name: obj.name || "card", source });
      return true;
    }

    // Portals
    if (type === "portal:reiki") {
      window.location.href = "./reiki.html";
      return true;
    }

    if (type === "portal:pga") {
      window.location.href = "./pga-drive.html";
      return true;
    }

    if (type === "portal:scorpion") {
      window.location.href = "./scorpion.html";
      return true;
    }

    if (type === "portal:smoker") {
      window.location.href = "./smoker-lounge.html";
      return true;
    }

    // Watch bridge
    if (type === "watch") {
      emit("svr_watch_select_request", { source });
      return true;
    }

    return false;
  }

  function getIntersections(scene, origin, direction){
    if (!window.THREE || !scene) return [];
    const raycaster = new window.THREE.Raycaster(origin, direction.normalize(), 0.05, state.rayLength);
    const targets = [];
    scene.traverse(obj => {
      if (obj?.userData?.svrInteractive && obj.visible !== false) targets.push(obj);
    });
    return raycaster.intersectObjects(targets, true);
  }

  function installDesktopFallback(){
    if (window.__SVR_PHASE259_DESKTOP_INSTALLED) return;
    window.__SVR_PHASE259_DESKTOP_INSTALLED = true;

    window.addEventListener("click", ev => {
      const scene = window.SVR_SCENE || window.scene || window.__SVR_SCENE__;
      const camera = window.SVR_CAMERA || null;
      const renderer = window.SVR_RENDERER || null;
      if (!scene || !camera || !renderer || !window.THREE) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new window.THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new window.THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const targets = [];
      scene.traverse(obj => {
        if (obj?.userData?.svrInteractive && obj.visible !== false) targets.push(obj);
      });

      const hits = raycaster.intersectObjects(targets, true);
      if (!hits.length) return;

      let obj = hits[0].object;
      while (obj && !obj.userData?.svrInteractive && obj.parent) obj = obj.parent;
      if (obj) selectObject(obj, "desktop-click");
    }, true);
  }

  const api = {
    state,
    scan,
    markInteractive,
    selectObject,
    apply(){
      const scene = window.SVR_SCENE || window.scene || window.__SVR_SCENE__;
      return scan(scene);
    }
  };

  window.SVR_VR_INTERACTION = api;

  window.addEventListener("svr_game_ready", () => {
    setTimeout(() => {
      api.apply();
      installDesktopFallback();
    }, 700);
  });

  window.addEventListener("svr_world_ready", ev => {
    if (ev.detail?.scene) scan(ev.detail.scene);
  });

  // Generic bridge for controller/hand modules to call.
  window.addEventListener("svr_vr_select_object", ev => {
    if (ev.detail?.object) selectObject(ev.detail.object, ev.detail.source || "vr-select");
  });

  // If another module sends only a type, route it safely.
  window.addEventListener("svr_vr_interaction_intent", ev => {
    const type = ev.detail?.type;
    if (type === "kiosk" && window.SVR_STORE_EQUIP_API?.open) window.SVR_STORE_EQUIP_API.open();
    if (type === "reiki") window.location.href = "./reiki.html";
    if (type === "pga") window.location.href = "./pga-drive.html";
    if (type === "store") window.location.href = "./store-room.html";
    if (type === "scorpion") window.location.href = "./scorpion.html";
  });

  window.addEventListener("keydown", ev => {
    if (ev.key !== "F7") return;
    ev.preventDefault();
    const count = api.apply();
    alert("SVR Phase 259 VR interaction scan: " + count + " interactive objects.");
  });

  emit("svr_phase259_vr_interaction_ready", state);
})();
