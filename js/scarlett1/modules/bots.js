AFRAME.registerComponent("scarlett-bots", {
  init: function () {
    // 5 bots, leave seat_front open for player
    const seats = ["seat_back","seat_left1","seat_left2","seat_right1","seat_right2"];
    seats.forEach((seatId, i) => this.spawnBot(seatId, i));
    if (window.hudLog) hudLog("Bots seated ✅ (5 bots, 1 seat reserved)");
  },

  spawnBot: function (seatId, idx) {
    const seat = document.getElementById(seatId);
    if (!seat) {
      setTimeout(() => this.spawnBot(seatId, idx), 120);
      return;
    }

    const bot = document.createElement("a-entity");
    bot.setAttribute("id", "bot_" + idx);
    bot.setAttribute("position", seat.getAttribute("position"));
    bot.setAttribute("rotation", seat.getAttribute("rotation"));

    // simple “avatar” placeholder (replace with your GLBs later)
    const body = document.createElement("a-cylinder");
    body.setAttribute("radius","0.20");
    body.setAttribute("height","1.15");
    body.setAttribute("position","0 0.78 0");
    body.setAttribute("material","color:#0b0f14; emissive:#2bd6ff; emissiveIntensity:0.12; roughness:0.85");
    bot.appendChild(body);

    const head = document.createElement("a-sphere");
    head.setAttribute("radius","0.18");
    head.setAttribute("position","0 1.45 0");
    head.setAttribute("material","color:#0b0f14; emissive:#7b61ff; emissiveIntensity:0.10; roughness:0.85");
    bot.appendChild(head);

    const name = document.createElement("a-text");
    name.setAttribute("value", "BOT " + (idx+1));
    name.setAttribute("align","center");
    name.setAttribute("color","#9ff");
    name.setAttribute("width","4");
    name.setAttribute("position","0 1.75 0");
    bot.appendChild(name);

    this.el.appendChild(bot);
  }
});