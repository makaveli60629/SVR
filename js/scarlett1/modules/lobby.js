AFRAME.registerComponent("scarlett-lobby", {
  init: function () {
    const el = this.el;

    // Neon ring
    const ring = document.createElement("a-torus");
    ring.setAttribute("radius", "1.1");
    ring.setAttribute("radius-tubular", "0.045");
    ring.setAttribute("rotation", "-90 0 0");
    ring.setAttribute("position", "0 0.03 0");
    ring.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.8");
    el.appendChild(ring);

    // Beacon
    const beacon = document.createElement("a-cylinder");
    beacon.setAttribute("radius", "0.08");
    beacon.setAttribute("height", "1.6");
    beacon.setAttribute("position", "0 0.9 -2.2");
    beacon.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.2");
    el.appendChild(beacon);

    // Lobby label
    const txt = document.createElement("a-text");
    txt.setAttribute("value", "SCARLETT1 LOBBY");
    txt.setAttribute("color", "#9ff");
    txt.setAttribute("position", "-1.1 2.1 -2.4");
    txt.setAttribute("width", "6");
    el.appendChild(txt);

    hudLog("Lobby built ✅");
  }
});
