// /js/scarlett1/modules/tablesRoom.js

AFRAME.registerComponent("scarlett-tables-room", {
  init() {
    const el = this.el;

    ensureDest("dest_tables", "0 0 -120"); // tables room far away

    // TELEPORTABLE FLOOR
    const floor = document.createElement("a-plane");
    floor.classList.add("teleportable");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("width", "60");
    floor.setAttribute("height", "60");
    floor.setAttribute("material", "color:#05070c; roughness:0.95; metalness:0.05");
    el.appendChild(floor);

    // LIGHTS
    addLight(el, "hemisphere", { intensity: 0.85, color: "#d7f3ff", groundColor: "#05070c" }, "0 20 0");
    addLight(el, "point", { intensity: 1.2, distance: 55, decay: 2, color: "#00e5ff" }, "0 6 8");
    addLight(el, "point", { intensity: 1.1, distance: 55, decay: 2, color: "#7b61ff" }, "-10 5 -8");

    // Room walls
    makeRoom(el);

    // Your main pit (table + bots + ninjas)
    const pit = document.createElement("a-entity");
    pit.setAttribute("position", "0 0 0");
    pit.setAttribute("scarlett-pit", "");
    el.appendChild(pit);

    // Return ring to Lobby
    makeReturnRing(el, { x: 0, z: 12, dest: "lobby", label: "RETURN TO LOBBY" });

    if (window.hudLog) hudLog("Tables Room built ✅ (pit + return ring)");
    
    function ensureDest(id, pos) {
      if (document.getElementById(id)) return;
      const d = document.createElement("a-entity");
      d.setAttribute("id", id);
      d.setAttribute("position", pos);
      el.appendChild(d);
    }

    function addLight(root, type, cfg, pos) {
      const l = document.createElement("a-entity");
      const kv = Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join("; ");
      l.setAttribute("light", `type: ${type}; ${kv}`);
      l.setAttribute("position", pos);
      root.appendChild(l);
    }

    function makeRoom(root) {
      makeWall(root, { x: 0, y: 7, z: -18, ry: 0, w: 42, h: 16 }, "#03060b");
      makeWall(root, { x: 0, y: 7, z: 18, ry: 180, w: 42, h: 16 }, "#03060b");
      makeWall(root, { x: -21, y: 7, z: 0, ry: 90, w: 36, h: 16 }, "#02040a");
      makeWall(root, { x: 21, y: 7, z: 0, ry: -90, w: 36, h: 16 }, "#02040a");
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

    function makeReturnRing(root, cfg) {
      const ring = document.createElement("a-ring");
      ring.classList.add("clickable", "portal");
      ring.setAttribute("data-dest", cfg.dest);
      ring.setAttribute("radius-inner", "0.95");
      ring.setAttribute("radius-outer", "1.35");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("position", `${cfg.x} 0.03 ${cfg.z}`);
      ring.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.5; opacity:0.55; transparent:true");
      root.appendChild(ring);

      const t = document.createElement("a-text");
      t.setAttribute("value", cfg.label);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#bff");
      t.setAttribute("width", "6");
      t.setAttribute("position", `${cfg.x} 1.2 ${cfg.z}`);
      root.appendChild(t);
    }
  }
});
