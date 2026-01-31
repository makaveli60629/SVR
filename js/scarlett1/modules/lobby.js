// /js/scarlett1/modules/lobby.js

AFRAME.registerComponent("scarlett-lobby", {
  init: function () {
    const el = this.el;

    // ---------- SKY (so no black void) ----------
    const sky = document.createElement("a-sky");
    sky.setAttribute("color", "#03060b");
    el.appendChild(sky);

    // ---------- LIGHTING (bright, readable in Quest) ----------
    const hemi = document.createElement("a-entity");
    hemi.setAttribute("light", "type: hemisphere; intensity: 0.85; color: #bfe9ff; groundColor: #071018");
    hemi.setAttribute("position", "0 30 0");
    el.appendChild(hemi);

    const key = document.createElement("a-entity");
    key.setAttribute("light", "type: directional; intensity: 1.15; color: #ffffff; castShadow: false");
    key.setAttribute("position", "10 18 12");
    el.appendChild(key);

    const fill = document.createElement("a-entity");
    fill.setAttribute("light", "type: point; intensity: 1.2; distance: 60; decay: 2; color: #7b61ff");
    fill.setAttribute("position", "-10 6 -8");
    el.appendChild(fill);

    const accent = document.createElement("a-entity");
    accent.setAttribute("light", "type: point; intensity: 1.1; distance: 50; decay: 2; color: #00e5ff");
    accent.setAttribute("position", "10 5 8");
    el.appendChild(accent);

    // ---------- MAIN FLOOR (TELEPORTABLE) ----------
    const floor = document.createElement("a-plane");
    floor.classList.add("teleportable");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("width", "60");
    floor.setAttribute("height", "60");
    floor.setAttribute("color", "#070b10");
    floor.setAttribute("material", "roughness:0.95; metalness:0.05");
    el.appendChild(floor);

    // Outer ring glow
    const floorRing = document.createElement("a-ring");
    floorRing.setAttribute("radius-inner", "10.8");
    floorRing.setAttribute("radius-outer", "11.2");
    floorRing.setAttribute("rotation", "-90 0 0");
    floorRing.setAttribute("position", "0 0.02 0");
    floorRing.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.2; opacity:0.55; transparent:true");
    el.appendChild(floorRing);

    // ---------- LOBBY WALLS (2x size) ----------
    // Simple big room: four walls around origin
    const room = document.createElement("a-entity");
    room.setAttribute("position", "0 0 0");
    el.appendChild(room);

    makeWall(room, { x: 0, y: 6, z: -18, ry: 0,  w: 40, h: 14 }, "#05070c");
    makeWall(room, { x: 0, y: 6, z:  18, ry: 180,w: 40, h: 14 }, "#05070c");
    makeWall(room, { x: -20, y: 6, z: 0, ry: 90, w: 36, h: 14 }, "#04060a");
    makeWall(room, { x:  20, y: 6, z: 0, ry: -90,w: 36, h: 14 }, "#04060a");

    // Ceiling trim glow ring
    const ceiling = document.createElement("a-ring");
    ceiling.setAttribute("radius-inner", "17.2");
    ceiling.setAttribute("radius-outer", "17.35");
    ceiling.setAttribute("rotation", "90 0 0");
    ceiling.setAttribute("position", "0 13.6 0");
    ceiling.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.2; opacity:0.45; transparent:true");
    el.appendChild(ceiling);

    // ---------- NEON PILLARS ----------
    const pillarPositions = [
      { x: -12, z: -10 }, { x: 12, z: -10 },
      { x: -12, z:  10 }, { x: 12, z:  10 },
      { x: 0,   z: -14 }, { x: 0,  z:  14 }
    ];
    pillarPositions.forEach((p, i) => makeNeonPillar(el, p.x, p.z, i));

    // ---------- CENTERPIECE (simple pedestal) ----------
    const center = document.createElement("a-cylinder");
    center.setAttribute("radius", "2.2");
    center.setAttribute("height", "0.22");
    center.setAttribute("position", "0 0.11 0");
    center.setAttribute("material", "color:#0b0f14; metalness:0.75; roughness:0.35");
    el.appendChild(center);

    const centerGlow = document.createElement("a-ring");
    centerGlow.setAttribute("radius-inner", "1.6");
    centerGlow.setAttribute("radius-outer", "2.1");
    centerGlow.setAttribute("rotation", "-90 0 0");
    centerGlow.setAttribute("position", "0 0.12 0");
    centerGlow.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.5; opacity:0.55; transparent:true");
    el.appendChild(centerGlow);

    // ---------- TITLE ----------
    const title = document.createElement("a-text");
    title.setAttribute("value", "SCARLETT1 LOBBY");
    title.setAttribute("align", "center");
    title.setAttribute("color", "#9ff");
    title.setAttribute("width", "10");
    title.setAttribute("position", "0 4.4 -6");
    el.appendChild(title);

    // ---------- PORTALS (CLICK TO TELEPORT) ----------
    // IMPORTANT: these are the buttons your main.js click handler uses.
    // data-dest must match: lobby / tables / store / balcony
    const portalsRoot = document.createElement("a-entity");
    portalsRoot.setAttribute("id", "portalsRoot");
    portalsRoot.setAttribute("position", "0 0 -6");
    el.appendChild(portalsRoot);

    makePortal(portalsRoot, {
      label: "ENTER TABLES ROOM",
      dest: "tables",
      x: -6, y: 2.2, z: 0,
      color: "#00e5ff"
    });

    makePortal(portalsRoot, {
      label: "ENTER STORE",
      dest: "store",
      x: 0, y: 2.2, z: 0,
      color: "#7b61ff"
    });

    makePortal(portalsRoot, {
      label: "ENTER BALCONY",
      dest: "balcony",
      x: 6, y: 2.2, z: 0,
      color: "#2bd6ff"
    });

    // Small “return to lobby” portal sign near spawn point (optional)
    const returnHint = document.createElement("a-text");
    returnHint.setAttribute("value", "Tip: Teleport ring appears on floor when aiming right laser");
    returnHint.setAttribute("align", "center");
    returnHint.setAttribute("color", "#7fe");
    returnHint.setAttribute("width", "8");
    returnHint.setAttribute("position", "0 1.3 6");
    el.appendChild(returnHint);

    if (window.hudLog) hudLog("Lobby built ✅  | Portals ready ✅  | Floor teleportable ✅");

    // ----------------- Helpers -----------------
    function makeWall(root, cfg, col) {
      const w = document.createElement("a-plane");
      w.setAttribute("position", `${cfg.x} ${cfg.y} ${cfg.z}`);
      w.setAttribute("rotation", `0 ${cfg.ry} 0`);
      w.setAttribute("width", `${cfg.w}`);
      w.setAttribute("height", `${cfg.h}`);
      w.setAttribute("material", `color:${col}; roughness:0.95; metalness:0.05; opacity:0.98; transparent:true`);
      root.appendChild(w);

      // neon edge strip at bottom
      const edge = document.createElement("a-plane");
      edge.setAttribute("position", `${cfg.x} 0.6 ${cfg.z}`);
      edge.setAttribute("rotation", `0 ${cfg.ry} 0`);
      edge.setAttribute("width", `${cfg.w}`);
      edge.setAttribute("height", "0.18");
      edge.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:0.9; opacity:0.55; transparent:true");
      root.appendChild(edge);
    }

    function makeNeonPillar(root, x, z, idx) {
      const g = document.createElement("a-entity");
      g.setAttribute("position", `${x} 0 ${z}`);
      root.appendChild(g);

      const p = document.createElement("a-cylinder");
      p.setAttribute("radius", "0.35");
      p.setAttribute("height", "10.8");
      p.setAttribute("position", "0 5.4 0");
      p.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
      g.appendChild(p);

      const band = document.createElement("a-ring");
      band.setAttribute("radius-inner", "0.30");
      band.setAttribute("radius-outer", "0.38");
      band.setAttribute("rotation", "0 0 0");
      band.setAttribute("position", "0 2.4 0");
      band.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.2; opacity:0.65; transparent:true");
      g.appendChild(band);

      const band2 = document.createElement("a-ring");
      band2.setAttribute("radius-inner", "0.30");
      band2.setAttribute("radius-outer", "0.38");
      band2.setAttribute("rotation", "0 0 0");
      band2.setAttribute("position", "0 8.4 0");
      band2.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.2; opacity:0.55; transparent:true");
      g.appendChild(band2);

      // subtle pillar point light
      const light = document.createElement("a-entity");
      light.setAttribute("light", "type: point; intensity: 0.55; distance: 18; decay: 2; color: #00e5ff");
      light.setAttribute("position", "0 6 0");
      g.appendChild(light);
    }

    function makePortal(root, cfg) {
      const portal = document.createElement("a-entity");
      portal.classList.add("clickable", "portal");
      portal.setAttribute("data-dest", cfg.dest);
      portal.setAttribute("position", `${cfg.x} ${cfg.y} ${cfg.z}`);
      portal.setAttribute("rotation", "0 0 0");
      root.appendChild(portal);

      const plate = document.createElement("a-plane");
      plate.setAttribute("width", "4.4");
      plate.setAttribute("height", "1.2");
      plate.setAttribute("material", "color:#0b0f14; opacity:0.85; transparent:true");
      portal.appendChild(plate);

      const glow = document.createElement("a-plane");
      glow.setAttribute("width", "4.6");
      glow.setAttribute("height", "1.35");
      glow.setAttribute("position", "0 0 -0.01");
      glow.setAttribute("material", `color:${cfg.color}; emissive:${cfg.color}; emissiveIntensity:1.1; opacity:0.18; transparent:true`);
      portal.appendChild(glow);

      const ring = document.createElement("a-ring");
      ring.setAttribute("radius-inner", "0.48");
      ring.setAttribute("radius-outer", "0.62");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("position", "0 -1.6 0.02");
      ring.setAttribute("material", `color:${cfg.color}; emissive:${cfg.color}; emissiveIntensity:1.3; opacity:0.55; transparent:true`);
      portal.appendChild(ring);

      const text = document.createElement("a-text");
      text.setAttribute("value", cfg.label);
      text.setAttribute("align", "center");
      text.setAttribute("color", "#cfffff");
      text.setAttribute("width", "8");
      text.setAttribute("position", "0 0 0.02");
      portal.appendChild(text);

      // small helper text
      const sub = document.createElement("a-text");
      sub.setAttribute("value", "(click / trigger)");
      sub.setAttribute("align", "center");
      sub.setAttribute("color", "#7fe");
      sub.setAttribute("width", "6");
      sub.setAttribute("position", "0 -0.45 0.02");
      portal.appendChild(sub);
    }
  }
});
