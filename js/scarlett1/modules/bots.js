// Spawns 5 bots (leaves 1 seat open for player).
// Expects seat entities with ids: seat_front, seat_back, seat_left_1, seat_left_2, seat_right_1, seat_right_2
// (These ids are created by the updated table.js I gave you.)

AFRAME.registerComponent("scarlett-bots", {
  init: function () {
    const el = this.el;

    // Leave THIS seat for the player:
    const PLAYER_SEAT_ID = "seat_front";

    // Candidate seats in priority order
    const seatIds = [
      "seat_front",
      "seat_back",
      "seat_left_1",
      "seat_left_2",
      "seat_right_1",
      "seat_right_2"
    ].filter(id => id !== PLAYER_SEAT_ID);

    // Spawn 5 bots
    seatIds.slice(0, 5).forEach((seatId, i) => {
      const seat = document.getElementById(seatId);
      if (!seat) return;

      const bot = document.createElement("a-entity");
      bot.setAttribute("id", `bot_${i+1}`);
      bot.setAttribute("position", "0 0 0");
      bot.setAttribute("rotation", "0 0 0");

      // Simple “avatar placeholder” (you can swap to GLBs later)
      const body = document.createElement("a-cylinder");
      body.setAttribute("radius", "0.20");
      body.setAttribute("height", "0.90");
      body.setAttribute("position", "0 0.45 0");
      body.setAttribute("material", "color:#0b0f14; emissive:#2bd6ff; emissiveIntensity:0.18; roughness:0.85");
      bot.appendChild(body);

      const head = document.createElement("a-sphere");
      head.setAttribute("radius", "0.16");
      head.setAttribute("position", "0 1.02 0");
      head.setAttribute("material", "color:#111; emissive:#7b61ff; emissiveIntensity:0.22; roughness:0.8");
      bot.appendChild(head);

      // Mount bot to seat (slightly forward so it “sits”)
      const seatPos = seat.object3D.position;
      const seatRot = seat.object3D.rotation;

      bot.object3D.position.set(seatPos.x, seatPos.y + 0.10, seatPos.z);
      bot.object3D.rotation.set(0, seatRot.y, 0);

      // slight forward offset in chair facing direction
      bot.object3D.translateZ(0.10);

      el.appendChild(bot);
    });

    if (window.hudLog) hudLog("Bots seated: 5 ✅ (1 seat reserved for you)");
  }
});
