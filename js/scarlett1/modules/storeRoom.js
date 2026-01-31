AFRAME.registerComponent("scarlett-store-room", {
  init() {
    const el = this.el;

    // Floor (lower)
    const floor = document.createElement("a-plane");
    floor.classList.add("teleportable");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("width", "70");
    floor.setAttribute("height", "70");
    floor.setAttribute("material", "color:#05070c; roughness:0.95; metalness:0.05");
    el.appendChild(floor);

    // Lighting
    addLight(el, "hemisphere", { intensity: 0.9, color: "#d7f3ff", groundColor: "#05070c" }, "0 30 0");
    addLight(el, "point", { intensity: 1.2, distance: 90, decay: 2, color: "#7b61ff" }, "0 8 0");
    addLight(el, "point", { intensity: 1.1, distance: 90, decay: 2, color: "#00e5ff" }, "-12 8 10");

    // Walls / big store hall
    makeWall(el, { x: 0, y: 8, z: -22, ry: 0, w: 60, h: 18 }, "#02040a");
    makeWall(el, { x: 0, y: 8, z: 22, ry: 180, w: 60, h: 18 }, "#02040a");
    makeWall(el, { x: -30, y: 8, z: 0, ry: 90, w: 44, h: 18 }, "#01030a");
    makeWall(el, { x: 30, y: 8, z: 0, ry: -90, w: 44, h: 18 }, "#01030a");

    // Store displays (pedestals)
    for (let i = 0; i < 6; i++) {
      const px = -14 + (i % 3) * 14;
      const pz = -10 + Math.floor(i / 3) * 16;
      makePedestal(el, px, pz, i);
    }

    // BALCONY PLATFORM (upper level)
    const balcony = document.createElement("a-box");
    balcony.classList.add("teleportable");
    balcony.setAttribute("width", "28");
    balcony.setAttribute("height", "0.6");
    balcony.setAttribute("depth", "18");
    balcony.setAttribute("position", "0 6.8 0");
    balcony.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
    el.appendChild(balcony);

    // Balcony rail neon
    const rail = document.createElement("a-ring");
    rail.setAttribute("radius-inner", "9.0");
    rail.setAttribute("radius-outer", "9.25");
    rail.setAttribute("rotation", "-90 0 0");
    rail.setAttribute("position", "0 7.2 0");
    rail.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.6; opacity:0.45; transparent:true");
    el.appendChild(rail);

    // Return rings
    makeReturn(el, { x: 0, z: 14, dest: "lobby", label: "RETURN TO LOBBY" });
    makeReturn(el, { x: 0, z: -14, dest: "balcony", label: "GO TO BALCONY" });

    // Label
    const title = document.createElement("a-text");
    title.setAttribute("value", "STORE");
    title.setAttribute("align", "center");
    title.setAttribute("color", "#bff");
    title.setAttribute("width", "12");
    title.setAttribute("position", "0 9 -10");
    el.appendChild(title);

    if (window.hudLog) hudLog("Store built ✅ (balcony + displays + returns)");

    function addLight(root, type, cfg, pos) {
      const l = document.createElement("a-entity");
      const kv = Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join("; ");
      l.setAttribute("light", `type: ${type}; ${kv}`);
      l.setAttribute("position", pos);
      root.appendChild(l);
    }

    function makeWall(root, cfg, col) {
      const w = document.createElement("a-plane");
      w.setAttribute("position", `${cfg.x} ${cfg.y} ${cfg.z}`);
      w.setAttribute("rotation", `0 ${cfg.ry} 0`);
      w.setAttribute("width", `${cfg.w}`);
      w.setAttribute("height", `${cfg.h}`);
      w.setAttribute("material", `color:${col}; roughness:0.95; metalness:0.05; opacity:0.98; transparent:true`);
      root.appendChild(w);
    }

    function makePedestal(root, x, z, idx) {
      const p = document.createElement("a-cylinder");
      p.setAttribute("radius", "1.2");
      p.setAttribute("height", "0.35");
      p.setAttribute("position", `${x} 0.175 ${z}`);
      p.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
      root.appendChild(p);

      const glow = document.createElement("a-ring");
      glow.setAttribute("radius-inner", "0.9");
      glow.setAttribute("radius-outer", "1.15");
      glow.setAttribute("rotation", "-90 0 0");
      glow.setAttribute("position", `${x} 0.36 ${z}`);
      glow.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.4; opacity:0.45; transparent:true");
      root.appendChild(glow);

      const t = document.createElement("a-text");
      t.setAttribute("value", `ITEM ${idx + 1}`);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#bff");
      t.setAttribute("width", "6");
      t.setAttribute("position", `${x} 1.3 ${z}`);
      root.appendChild(t);
    }

    function makeReturn(root, cfg) {
      const ring = document.createElement("a-ring");
      ring.classList.add("clickable", "portal");
      ring.setAttribute("data-dest", cfg.dest);
      ring.setAttribute("radius-inner", "1.25");
      ring.setAttribute("radius-outer", "1.75");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("position", `${cfg.x} 0.03 ${cfg.z}`);
      ring.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.4; opacity:0.55; transparent:true");
      root.appendChild(ring);

      const t = document.createElement("a-text");
      t.setAttribute("value", cfg.label);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#bff");
      t.setAttribute("width", "10");
      t.setAttribute("position", `${cfg.x} 1.25 ${cfg.z}`);
      root.appendChild(t);
    }
  }
});
