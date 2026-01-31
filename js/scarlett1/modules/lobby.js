// /js/scarlett1/modules/lobby.js

AFRAME.registerComponent("scarlett-lobby", {
  init: function () {
    const el = this.el;

    // Room spawn marker (IMPORTANT)
    // Destination markers are placed in world.js (recommended),
    // but we also allow them here if missing.
    ensureDest("dest_lobby", "0 0 0");

    // SKY
    const sky = document.createElement("a-sky");
    sky.setAttribute("color", "#03060b");
    el.appendChild(sky);

    // LIGHTS
    addLight(el, "hemisphere", { intensity: 0.9, color: "#cfefff", groundColor: "#061018" }, "0 25 0");
    addLight(el, "directional", { intensity: 1.15, color: "#ffffff" }, "10 18 12");
    addLight(el, "point", { intensity: 1.25, distance: 60, decay: 2, color: "#00e5ff" }, "0 6 8");
    addLight(el, "point", { intensity: 1.1, distance: 55, decay: 2, color: "#7b61ff" }, "-10 5 -8");

    // FLOOR (teleportable)
    const floor = document.createElement("a-plane");
    floor.classList.add("teleportable");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("width", "70");
    floor.setAttribute("height", "70");
    floor.setAttribute("material", "color:#070b10; roughness:0.95; metalness:0.05");
    el.appendChild(floor);

    // LOBBY ROOM (2x walls)
    makeRoom(el);

    // ---------- CENTERPIECE (REAL LOBBY CORE) ----------
    // Outer platform
    const coreBase = document.createElement("a-cylinder");
    coreBase.setAttribute("radius", "6.0");
    coreBase.setAttribute("height", "0.35");
    coreBase.setAttribute("position", "0 0.175 0");
    coreBase.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
    el.appendChild(coreBase);

    // Neon ring around centerpiece
    const coreRing = document.createElement("a-ring");
    coreRing.setAttribute("radius-inner", "5.55");
    coreRing.setAttribute("radius-outer", "5.95");
    coreRing.setAttribute("rotation", "-90 0 0");
    coreRing.setAttribute("position", "0 0.36 0");
    coreRing.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.6; opacity:0.55; transparent:true");
    el.appendChild(coreRing);

    // DIVOT (the “hole” look)
    const divot = document.createElement("a-cylinder");
    divot.setAttribute("radius", "2.2");
    divot.setAttribute("height", "0.12");
    divot.setAttribute("position", "0 0.30 0");
    divot.setAttribute("material", "color:#05080d; roughness:1.0; metalness:0.0");
    el.appendChild(divot);

    const divotGlow = document.createElement("a-ring");
    divotGlow.setAttribute("radius-inner", "1.95");
    divotGlow.setAttribute("radius-outer", "2.22");
    divotGlow.setAttribute("rotation", "-90 0 0");
    divotGlow.setAttribute("position", "0 0.31 0");
    divotGlow.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.1; opacity:0.45; transparent:true");
    el.appendChild(divotGlow);

    // LOBBY PIT DEMO (box bots playing) – simple visual now
    const pitDemo = document.createElement("a-entity");
    pitDemo.setAttribute("position", "0 0.35 0");
    pitDemo.setAttribute("scarlett-lobby-pit-demo", "");
    el.appendChild(pitDemo);

    // ---------- PORTAL RINGS FROM LOBBY ----------
    // These are “circles on the floor” that actually work (they are .portal + data-dest)
    makePortalRing(el, { x: -12, z: -10, dest: "tables", label: "TABLES ROOM" });
    makePortalRing(el, { x: 0,   z: -12, dest: "store",  label: "STORE" });
    makePortalRing(el, { x: 12,  z: -10, dest: "balcony",label: "BALCONY" });

    // Title sign
    const title = document.createElement("a-text");
    title.setAttribute("value", "SCARLETT1 MAIN LOBBY");
    title.setAttribute("align", "center");
    title.setAttribute("color", "#bff");
    title.setAttribute("width", "12");
    title.setAttribute("position", "0 4.4 -8");
    el.appendChild(title);

    if (window.hudLog) hudLog("Lobby: centerpiece+divot+pit demo ✅ | portal rings ✅");

    // ---------- helpers ----------
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
      makeWall(root, { x: 0, y: 7, z: -22, ry: 0,   w: 50, h: 16 }, "#05070c");
      makeWall(root, { x: 0, y: 7, z:  22, ry: 180, w: 50, h: 16 }, "#05070c");
      makeWall(root, { x: -25, y: 7, z: 0, ry: 90,  w: 44, h: 16 }, "#04060a");
      makeWall(root, { x:  25, y: 7, z: 0, ry: -90, w: 44, h: 16 }, "#04060a");

      // Pillars
      [
        { x: -14, z: -12 }, { x: 14, z: -12 },
        { x: -14, z:  12 }, { x: 14, z:  12 },
      ].forEach((p) => makeNeonPillar(root, p.x, p.z));
    }

    function makeWall(root, cfg, col) {
      const w = document.createElement("a-plane");
      w.setAttribute("position", `${cfg.x} ${cfg.y} ${cfg.z}`);
      w.setAttribute("rotation", `0 ${cfg.ry} 0`);
      w.setAttribute("width", `${cfg.w}`);
      w.setAttribute("height", `${cfg.h}`);
      w.setAttribute("material", `color:${col}; roughness:0.95; metalness:0.05; opacity:0.98; transparent:true`);
      root.appendChild(w);

      const edge = document.createElement("a-plane");
      edge.setAttribute("position", `${cfg.x} 0.7 ${cfg.z}`);
      edge.setAttribute("rotation", `0 ${cfg.ry} 0`);
      edge.setAttribute("width", `${cfg.w}`);
      edge.setAttribute("height", "0.22");
      edge.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:0.9; opacity:0.5; transparent:true");
      root.appendChild(edge);
    }

    function makeNeonPillar(root, x, z) {
      const g = document.createElement("a-entity");
      g.setAttribute("position", `${x} 0 ${z}`);
      root.appendChild(g);

      const p = document.createElement("a-cylinder");
      p.setAttribute("radius", "0.42");
      p.setAttribute("height", "12.0");
      p.setAttribute("position", "0 6 0");
      p.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
      g.appendChild(p);

      const band = document.createElement("a-ring");
      band.setAttribute("radius-inner", "0.36");
      band.setAttribute("radius-outer", "0.46");
      band.setAttribute("position", "0 3 0");
      band.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.1; opacity:0.55; transparent:true");
      g.appendChild(band);

      const band2 = document.createElement("a-ring");
      band2.setAttribute("radius-inner", "0.36");
      band2.setAttribute("radius-outer", "0.46");
      band2.setAttribute("position", "0 9 0");
      band2.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.1; opacity:0.45; transparent:true");
      g.appendChild(band2);

      const l = document.createElement("a-entity");
      l.setAttribute("light", "type: point; intensity: 0.55; distance: 20; decay: 2; color: #00e5ff");
      l.setAttribute("position", "0 6 0");
      g.appendChild(l);
    }

    function makePortalRing(root, cfg) {
      const ring = document.createElement("a-ring");
      ring.classList.add("clickable", "portal");
      ring.setAttribute("data-dest", cfg.dest);
      ring.setAttribute("radius-inner", "0.9");
      ring.setAttribute("radius-outer", "1.25");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("position", `${cfg.x} 0.03 ${cfg.z}`);
      ring.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.4; opacity:0.55; transparent:true");
      root.appendChild(ring);

      const t = document.createElement("a-text");
      t.setAttribute("value", cfg.label);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#bff");
      t.setAttribute("width", "6");
      t.setAttribute("position", `${cfg.x - 1.6} 1.1 ${cfg.z}`);
      root.appendChild(t);
    }
  }
});

// Simple “lobby pit” demo: a small box table + 6 box bots moving hands
AFRAME.registerComponent("scarlett-lobby-pit-demo", {
  init() {
    const el = this.el;

    const t = document.createElement("a-box");
    t.setAttribute("width", "2.8");
    t.setAttribute("height", "0.22");
    t.setAttribute("depth", "1.8");
    t.setAttribute("position", "0 0.45 0");
    t.setAttribute("material", "color:#07111a; roughness:0.95; metalness:0.05");
    el.appendChild(t);

    const rim = document.createElement("a-torus");
    rim.setAttribute("radius", "0.95");
    rim.setAttribute("radius-tubular", "0.05");
    rim.setAttribute("rotation", "-90 0 0");
    rim.setAttribute("position", "0 0.58 0");
    rim.setAttribute("scale", "1.8 1 1.1");
    rim.setAttribute("material", "color:#2a1b12; roughness:0.85; metalness:0.1");
    el.appendChild(rim);

    // 6 box bots around it
    const seats = [
      { x: 0, z: 1.5 }, { x: 0, z: -1.5 },
      { x: 1.7, z: 0.6 }, { x: 1.7, z: -0.6 },
      { x: -1.7, z: 0.6 }, { x: -1.7, z: -0.6 },
    ];
    seats.forEach((s, i) => {
      const b = document.createElement("a-box");
      b.setAttribute("width", "0.35");
      b.setAttribute("height", "0.9");
      b.setAttribute("depth", "0.25");
      b.setAttribute("position", `${s.x} 0.55 ${s.z}`);
      b.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:0.12; roughness:0.9");
      el.appendChild(b);

      // tiny “hand” bob animation
      b.setAttribute("animation", `property: position; dir: alternate; dur: ${800 + i*60}; loop: true; to: ${s.x} 0.62 ${s.z}`);
    });
  }
});
