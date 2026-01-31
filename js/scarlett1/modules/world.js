// /js/scarlett1/modules/world.js
AFRAME.registerComponent("scarlett-world", {
  init() {
    const scene = this.el.sceneEl;

    // Attach global systems
    scene.setAttribute("scarlett-lighting", "");
    this.el.setAttribute("scarlett-room-manager", "");

    // Rooms root
    const roomsRoot = document.createElement("a-entity");
    roomsRoot.setAttribute("id", "roomsRoot");
    this.el.appendChild(roomsRoot);

    // LOBBY
    const lobby = document.createElement("a-entity");
    lobby.setAttribute("id", "room_lobby");
    lobby.setAttribute("scarlett-lobby-room", "");
    roomsRoot.appendChild(lobby);

    // POKER TABLE ROOM (6 seats)
    const poker = document.createElement("a-entity");
    poker.setAttribute("id", "room_poker");
    poker.setAttribute("visible", "false");
    poker.setAttribute("scarlett-poker-room", "");
    roomsRoot.appendChild(poker);

    // STORE
    const store = document.createElement("a-entity");
    store.setAttribute("id", "room_store");
    store.setAttribute("visible", "false");
    store.setAttribute("scarlett-store-room", "");
    roomsRoot.appendChild(store);

    // BALCONY
    const balcony = document.createElement("a-entity");
    balcony.setAttribute("id", "room_balcony");
    balcony.setAttribute("visible", "false");
    balcony.setAttribute("scarlett-balcony-room", "");
    roomsRoot.appendChild(balcony);

    // Register rooms
    const rm = this.el.components["scarlett-room-manager"];
    rm.registerRoom("room_lobby", lobby);
    rm.registerRoom("room_poker", poker);
    rm.registerRoom("room_store", store);
    rm.registerRoom("room_balcony", balcony);

    // Spawn pad (safe)
    this.spawnToSafePad();

    // signal rooms ready
    this.el.emit("scarlett-rooms-ready");

    if (window.hudLog) hudLog("Scarlett1 booting…");
  },

  spawnToSafePad() {
    const rig = document.getElementById("rig");
    if (!rig) return;

    // Put rig at a safe position (outside pit)
    rig.object3D.position.set(0, 0, 14);
    rig.object3D.rotation.set(0, 0, 0);

    if (window.hudLog) hudLog("Spawned ✅ (lobby safe)");
  }
});
