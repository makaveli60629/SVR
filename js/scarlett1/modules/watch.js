AFRAME.registerComponent("scarlett-watch-teleporter", {
  init() {
    const leftHand = document.getElementById("leftHand");
    const anchor = leftHand || document.querySelector("[camera]") || this.el;

    const watch = document.createElement("a-entity");
    watch.setAttribute("position", "0.05 0.02 -0.08");
    watch.setAttribute("rotation", "0 90 90");
    watch.setAttribute("scale", "0.18 0.18 0.18");
    anchor.appendChild(watch);

    const body = document.createElement("a-box");
    body.setAttribute("width", "1.7");
    body.setAttribute("height", "1.05");
    body.setAttribute("depth", "0.12");
    body.setAttribute("material", "color:#0b0f14; metalness:0.6; roughness:0.4; opacity:0.95; transparent:true");
    watch.appendChild(body);

    const title = document.createElement("a-text");
    title.setAttribute("value", "TELEPORT");
    title.setAttribute("align", "center");
    title.setAttribute("color", "#bff");
    title.setAttribute("width", "5");
    title.setAttribute("position", "0 0.40 0.07");
    watch.appendChild(title);

    const btns = [
      { label: "LOBBY", dest: "lobby", y: 0.12, c: "#2bd6ff" },
      { label: "SCORPION ROOM", dest: "tables", y: -0.08, c: "#00e5ff" },
      { label: "STORE", dest: "store", y: -0.28, c: "#7b61ff" },
      { label: "BALCONY", dest: "balcony", y: -0.48, c: "#b19cd9" },
    ];

    btns.forEach((b) => {
      const plate = document.createElement("a-plane");
      plate.classList.add("clickable", "portal");
      plate.setAttribute("data-dest", b.dest);
      plate.setAttribute("width", "1.48");
      plate.setAttribute("height", "0.18");
      plate.setAttribute("position", `0 ${b.y} 0.071`);
      plate.setAttribute("material", "color:#101827; opacity:0.92; transparent:true");
      watch.appendChild(plate);

      const glow = document.createElement("a-plane");
      glow.setAttribute("width", "1.56");
      glow.setAttribute("height", "0.22");
      glow.setAttribute("position", `0 ${b.y} 0.069`);
      glow.setAttribute("material", `color:${b.c}; emissive:${b.c}; emissiveIntensity:0.9; opacity:0.16; transparent:true`);
      watch.appendChild(glow);

      const txt = document.createElement("a-text");
      txt.setAttribute("value", b.label);
      txt.setAttribute("align", "center");
      txt.setAttribute("color", "#eaffff");
      txt.setAttribute("width", "5.5");
      txt.setAttribute("position", `0 ${b.y} 0.072`);
      watch.appendChild(txt);
    });

    if (window.hudLog) hudLog("Watch teleporter ✅");
  }
});
