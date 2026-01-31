// /js/scarlett1/modules/watch.js
// Wrist teleporter menu: Lobby / Tables / Store / Balcony

AFRAME.registerComponent("scarlett-watch-teleporter", {
  init() {
    const el = this.el;

    // Put the watch on LEFT hand controller if it exists, otherwise attach to camera
    const leftHand =
      document.querySelector("#leftHand") ||
      document.querySelector("[hand-controls='hand: left']") ||
      document.querySelector("[oculus-touch-controls='hand: left']");

    const anchor = leftHand || document.querySelector("[camera]") || el;

    const watch = document.createElement("a-entity");
    watch.setAttribute("position", "0.05 0.02 -0.08");
    watch.setAttribute("rotation", "0 90 90");
    watch.setAttribute("scale", "0.18 0.18 0.18");
    anchor.appendChild(watch);

    // Watch body
    const body = document.createElement("a-box");
    body.setAttribute("width", "1.6");
    body.setAttribute("height", "1.0");
    body.setAttribute("depth", "0.12");
    body.setAttribute("material", "color:#0b0f14; metalness:0.6; roughness:0.4; opacity:0.95; transparent:true");
    watch.appendChild(body);

    // Glow frame
    const glow = document.createElement("a-box");
    glow.setAttribute("width", "1.66");
    glow.setAttribute("height", "1.06");
    glow.setAttribute("depth", "0.14");
    glow.setAttribute("position", "0 0 -0.01");
    glow.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:0.9; opacity:0.18; transparent:true");
    watch.appendChild(glow);

    // Title
    const title = document.createElement("a-text");
    title.setAttribute("value", "SCARLETT TELEPORT");
    title.setAttribute("align", "center");
    title.setAttribute("color", "#bff");
    title.setAttribute("width", "5");
    title.setAttribute("position", "0 0.38 0.07");
    watch.appendChild(title);

    // Buttons
    const btns = [
      { label: "LOBBY", dest: "lobby", y: 0.10, c: "#2bd6ff" },
      { label: "TABLES", dest: "tables", y: -0.10, c: "#00e5ff" },
      { label: "STORE", dest: "store", y: -0.30, c: "#7b61ff" },
      { label: "BALCONY", dest: "balcony", y: -0.50, c: "#b19cd9" },
    ];

    btns.forEach((b) => {
      const plate = document.createElement("a-plane");
      plate.classList.add("clickable", "portal");
      plate.setAttribute("data-dest", b.dest);
      plate.setAttribute("width", "1.35");
      plate.setAttribute("height", "0.18");
      plate.setAttribute("position", `0 ${b.y} 0.071`);
      plate.setAttribute("material", "color:#101827; opacity:0.92; transparent:true");
      watch.appendChild(plate);

      const txt = document.createElement("a-text");
      txt.setAttribute("value", b.label);
      txt.setAttribute("align", "center");
      txt.setAttribute("color", "#eaffff");
      txt.setAttribute("width", "3.5");
      txt.setAttribute("position", `0 ${b.y} 0.072`);
      watch.appendChild(txt);

      const underGlow = document.createElement("a-plane");
      underGlow.setAttribute("width", "1.42");
      underGlow.setAttribute("height", "0.22");
      underGlow.setAttribute("position", `0 ${b.y} 0.069`);
      underGlow.setAttribute("material", `color:${b.c}; emissive:${b.c}; emissiveIntensity:0.9; opacity:0.16; transparent:true`);
      watch.appendChild(underGlow);
    });

    if (window.hudLog) hudLog("Watch teleporter ready ✅ (click buttons)");
  }
});
