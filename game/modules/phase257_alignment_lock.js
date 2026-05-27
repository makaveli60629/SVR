/*
 * SVR Phase 257 — Alignment Portal Kiosk Table Lock
 * Purpose:
 * - correct store kiosk visibility
 * - keep portal targets organized
 * - clamp chip/card/table alignment markers
 * - lock Moon/Mars sky placement rules
 */
(function(){
  const BUILD = "PHASE-257-ALIGNMENT-PORTAL-KIOSK-TABLE-LOCK";

  const rules = {
    build: BUILD,
    lobby: {
      preserveOriginalLobby: true,
      noShellRollback: true
    },
    kiosk: {
      visible: true,
      notBehindSponsorWall: true,
      preferredPosition: { x: -4.8, y: 1.35, z: -2.6 },
      preferredLookAt: { x: 0, y: 1.25, z: 0 },
      minButtonHeight: 0.22,
      minReadableDistance: 2.0
    },
    portals: {
      reikiRoom: "./reiki.html",
      pgaDrive: "./pga-drive.html",
      chipPutt: "./chip-putt.html",
      storeRoom: "./store-room.html",
      smokerLounge: "./smoker-lounge.html",
      scorpion: "./scorpion.html"
    },
    table: {
      feltY: 0.82,
      chipY: 0.82,
      cardY: 0.835,
      passLineVisible: true,
      dealDirection: "right-to-left",
      frontChairRemovedForPlayerAccess: true
    },
    sky: {
      moonHighAboveSkyline: true,
      marsHighAboveSkyline: true,
      avoidBuildingIntersection: true
    },
    controls: {
      preservePhase255Locomotion: true,
      preservePhase256ChipPrep: true
    },
    siteTouched: false
  };

  window.SVR_ALIGNMENT_LOCK = rules;

  function emit(name, detail){
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: Object.assign({ build: BUILD }, detail || {}) }));
    } catch(_) {}
  }

  function isChip(obj){
    const n = String(obj?.name || "").toLowerCase();
    const u = obj?.userData || {};
    return u.isChip || u.chip || n.includes("chip") || n.includes("$1") || n.includes("$5") || n.includes("$25") || n.includes("$100") || n.includes("$500");
  }

  function isCard(obj){
    const n = String(obj?.name || "").toLowerCase();
    const u = obj?.userData || {};
    return u.isCard || u.card || n.includes("card");
  }

  function alignScene(scene){
    if (!scene || !scene.traverse) return { chips: 0, cards: 0, kiosk: 0, planets: 0 };

    let chips = 0;
    let cards = 0;
    let kiosk = 0;
    let planets = 0;

    scene.traverse(obj => {
      if (!obj) return;
      const name = String(obj.name || "").toLowerCase();

      if (isChip(obj)) {
        chips++;
        obj.userData.isChip = true;
        obj.userData.grabbable = true;
        obj.position.y = rules.table.chipY;
        obj.rotation.x = Math.PI / 2;
      }

      if (isCard(obj)) {
        cards++;
        obj.userData.isCard = true;
        if (Number.isFinite(obj.position.y)) obj.position.y = Math.max(obj.position.y, rules.table.cardY);
      }

      if (name.includes("store") && name.includes("kiosk")) {
        kiosk++;
        obj.position.set(rules.kiosk.preferredPosition.x, rules.kiosk.preferredPosition.y, rules.kiosk.preferredPosition.z);
        obj.lookAt(rules.kiosk.preferredLookAt.x, rules.kiosk.preferredLookAt.y, rules.kiosk.preferredLookAt.z);
        obj.visible = true;
      }

      if (name.includes("moon") || name.includes("mars")) {
        planets++;
        obj.visible = true;
        if (name.includes("moon")) {
          obj.position.y = Math.max(obj.position.y, 18);
          obj.position.z = Math.min(obj.position.z, -24);
        }
        if (name.includes("mars")) {
          obj.position.y = Math.max(obj.position.y, 17);
          obj.position.z = Math.min(obj.position.z, -28);
        }
      }
    });

    const result = { chips, cards, kiosk, planets };
    emit("svr_alignment_applied", result);
    return result;
  }

  const api = {
    rules,
    alignScene,
    apply(){
      const scene = window.SVR_SCENE || window.scene || window.__SVR_SCENE__;
      return alignScene(scene);
    }
  };

  window.SVR_ALIGNMENT = api;

  window.addEventListener("svr_game_ready", () => {
    setTimeout(() => api.apply(), 600);
    setTimeout(() => api.apply(), 2000);
  });

  window.addEventListener("svr_world_ready", ev => {
    if (ev.detail?.scene) alignScene(ev.detail.scene);
  });

  window.addEventListener("keydown", ev => {
    if (ev.key !== "F8") return;
    ev.preventDefault();
    const result = api.apply();
    alert("SVR Phase 257 alignment applied:\n" + JSON.stringify(result, null, 2));
  });

  emit("svr_phase257_alignment_ready", rules);
})();
