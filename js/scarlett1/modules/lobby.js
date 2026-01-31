AFRAME.registerComponent("scarlett-lobby", {
  init: function () {
    const el = this.el;

    // Neon ring on floor
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

    // Clickable in-world button (NOT on your face)
    const btn = document.createElement("a-entity");
    btn.setAttribute("id", "lobbyEnterTablesBtn");
    btn.setAttribute("position", "0 1.35 -2.05");
    btn.setAttribute("rotation", "0 0 0");
    btn.classList.add("clickable"); // your raycaster can target this if you enable it

    const bg = document.createElement("a-plane");
    bg.setAttribute("width", "1.55");
    bg.setAttribute("height", "0.32");
    bg.setAttribute("material", "color:#0b0f14; opacity:0.78; transparent:true");
    btn.appendChild(bg);

    const label = document.createElement("a-text");
    label.setAttribute("value", "ENTER POKER TABLES");
    label.setAttribute("align", "center");
    label.setAttribute("color", "#9ff");
    label.setAttribute("width", "3.4");
    label.setAttribute("position", "0 0 0.01");
    btn.appendChild(label);

    const outline = document.createElement("a-ring");
    outline.setAttribute("radius-inner", "0.66");
    outline.setAttribute("radius-outer", "0.70");
    outline.setAttribute("position", "0 0 0.012");
    outline.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.35; opacity:0.7; transparent:true");
    btn.appendChild(outline);

    // We can’t rely on click unless cursor exists.
    // So we also make it triggerable via a helper global hook.
    btn.addEventListener("click", () => {
      if (window.enterPokerTables) window.enterPokerTables();
      if (window.hudLog) hudLog("Lobby button clicked ✅");
    });

    el.appendChild(btn);

    if (window.hudLog) hudLog("Lobby built ✅ (in-world ENTER button added)");
  }
});
