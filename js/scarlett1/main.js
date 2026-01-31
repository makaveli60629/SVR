import "./modules/hud.js";
import "./modules/spawnPads.js";
import "./modules/teleport.js";
import "./modules/handPinchTeleport.js";
import "./modules/lobbyRoom.js";
import "./modules/pokerPitRoom.js";
import "./modules/storeRoom.js";
import "./modules/jumbotron.js";

AFRAME.registerComponent("scarlett-app", {
  init() {
    hudLog("A-FRAME loaded ✅");

    const scene = this.el.sceneEl;

    // Build rooms
    this.lobby = document.createElement("a-entity");
    this.lobby.setAttribute("id", "room_lobby");
    this.lobby.setAttribute("scarlett-lobby-room", "");
    scene.appendChild(this.lobby);

    this.pokerPit = document.createElement("a-entity");
    this.pokerPit.setAttribute("id", "room_pokerpit");
    this.pokerPit.setAttribute("visible", "false");
    this.pokerPit.setAttribute("scarlett-pokerpit-room", "");
    scene.appendChild(this.pokerPit);

    this.store = document.createElement("a-entity");
    this.store.setAttribute("id", "room_store");
    this.store.setAttribute("visible", "false");
    this.store.setAttribute("scarlett-store-room", "");
    scene.appendChild(this.store);

    // Make pads (safe spawn + portals)
    makeSpawnPad(scene, {
      id: "pad_lobby_safe",
      position: "0 0 18",
      rotation: "0 180 0",
      visible: false
    });

    // Door pads in lobby (stand on them -> teleports)
    makePortalPad(scene, {
      id: "pad_to_pokerpit",
      position: "12 0 0",
      label: "POKER PIT",
      onEnter: () => this.showRoom("pokerpit")
    });

    makePortalPad(scene, {
      id: "pad_to_store",
      position: "-12 0 0",
      label: "STORE",
      onEnter: () => this.showRoom("store")
    });

    makePortalPad(scene, {
      id: "pad_to_lobby_from_pokerpit",
      position: "0 0 18",
      label: "BACK TO LOBBY",
      onEnter: () => this.showRoom("lobby"),
      roomId: "room_pokerpit"
    });

    makePortalPad(scene, {
      id: "pad_to_lobby_from_store",
      position: "0 0 18",
      label: "BACK TO LOBBY",
      onEnter: () => this.showRoom("lobby"),
      roomId: "room_store"
    });

    // Teleport controls (trigger + optional pinch)
    scene.setAttribute("scarlett-teleport", "");
    scene.setAttribute("scarlett-hand-pinch-teleport", "");

    // IMPORTANT: safeSpawn waits until pad.object3D is ready (fixes “spawn failed”)
    safeSpawnToPad("pad_lobby_safe");

    hudLog("Scarlett1 booting…");
  },

  showRoom(which) {
    const setVis = (id, v) => {
      const r = document.getElementById(id);
      if (r) r.setAttribute("visible", v ? "true" : "false");
    };

    setVis("room_lobby", which === "lobby");
    setVis("room_pokerpit", which === "pokerpit");
    setVis("room_store", which === "store");

    // Spawn you safely inside each room
    const pad =
      which === "lobby" ? "pad_lobby_safe" :
      which === "pokerpit" ? "pad_to_lobby_from_pokerpit" :
      "pad_to_lobby_from_store";

    safeSpawnToPad(pad);

    hudLog(`Room: ${which.toUpperCase()} ✅`);
  }
});
