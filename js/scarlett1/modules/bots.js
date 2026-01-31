AFRAME.registerComponent("scarlett-bots", {
  init: function () {
    const el = this.el;

    // Match seat positions around your table
    const seats = [
      { x:-1.2, z: 2.4, r: 180 },
      { x: 0.0, z: 2.4, r: 180 },
      { x: 1.2, z: 2.4, r: 180 },
      { x:-1.2, z:-2.4, r:   0 },
      { x: 0.0, z:-2.4, r:   0 },
      { x: 1.2, z:-2.4, r:   0 },
    ];

    seats.forEach((s,i) => {
      const bot = document.createElement("a-entity");
      bot.setAttribute("position", `${s.x} 0 ${s.z}`);
      bot.setAttribute("rotation", `0 ${s.r} 0`);
      bot.setAttribute("scarlett-bot", `seed:${Math.random()*10};`);
      el.appendChild(bot);
    });

    hudLog("Bots seated: 6 ✅");
  }
});

AFRAME.registerComponent("scarlett-bot", {
  schema: { seed: { type:"number", default: 0 } },
  init: function () {
    const el = this.el;

    const body = document.createElement("a-cylinder");
    body.setAttribute("radius", "0.18");
    body.setAttribute("height", "1.1");
    body.setAttribute("position", "0 0.95 0");
    body.setAttribute("material", "color:#0f1116; metalness:0.2; roughness:0.6");
    el.appendChild(body);

    const visor = document.createElement("a-plane");
    visor.setAttribute("width", "0.22");
    visor.setAttribute("height", "0.08");
    visor.setAttribute("position", "0 1.12 0.19");
    visor.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2");
    el.appendChild(visor);

    this.t = this.data.seed;
  },
  tick: function (t, dt) {
    // subtle bob so it looks alive
    this.t += (dt || 16) / 1000;
    const y = 0.02 * Math.sin(this.t * 1.6);
    this.el.object3D.position.y = y;
  }
});
