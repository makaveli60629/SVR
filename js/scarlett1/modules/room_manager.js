// /js/scarlett1/modules/room_manager.js
AFRAME.registerComponent("scarlett-room-manager", {
  init() {
    this.rooms = {};
    this.active = null;

    window.SCARLETT = window.SCARLETT || {};
    window.SCARLETT.setRoom = (id) => this.setRoom(id);

    this.el.addEventListener("scarlett-rooms-ready", () => {
      // Default room
      this.setRoom("room_lobby");
    });
  },

  registerRoom(id, el) {
    this.rooms[id] = el;
  },

  setRoom(id) {
    Object.entries(this.rooms).forEach(([rid, rel]) => {
      rel.setAttribute("visible", rid === id);
    });
    this.active = id;
    if (window.hudLog) hudLog(`Room → ${id.replace("room_","")} ✅`);
  }
});
