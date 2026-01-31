AFRAME.registerComponent("scarlett-lobby", {
  init() {
    const el = this.el;

    // TELEPORTABLE floor (main lobby)
    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    floor.setAttribute("radius", "34");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("material", "color:#070b10; roughness:0.95; metalness:0.05");
    el.appendChild(floor);

    // SKY (no void)
    const sky = document.createElement("a-sky");
    sky.setAttribute("color", "#03060b");
    el.appendChild(sky);

    // LIGHTING: bright + neon
    addLight(el, "hemisphere", { intensity: 0.95, color: "#d7f3ff", groundColor: "#061018" }, "0 40 0");
    addLight(el, "directional", { intensity: 1.35, color: "#ffffff" }, "18 28 16");
    addLight(el, "point", { intensity: 1.4, distance: 90, decay: 2, color: "#00e5ff" }, "0 12 0");
    addLight(el, "point", { intensity: 1.15, distance: 90, decay: 2, color: "#7b61ff" }, "-18 10 -18");

    // --- CIRCULAR WALLS (twice as high) ---
    const wallRadius = 30;
    const wallHeight = 24;
    const wallY = wallHeight / 2;

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = Math.cos(a) * wallRadius;
      const z = Math.sin(a) * wallRadius;
      const rotY = (-a * 180 / Math.PI) + 90;

      const seg = document.createElement("a-plane");
      seg.setAttribute("position", `${x} ${wallY} ${z}`);
      seg.setAttribute("rotation", `0 ${rotY} 0`);
      seg.setAttribute("width", "12");
      seg.setAttribute("height", `${wallHeight}`);
      seg.setAttribute("material", "color:#05070c; roughness:0.95; metalness:0.05; opacity:0.98; transparent:true");
      el.appendChild(seg);

      const base = document.createElement("a-plane");
      base.setAttribute("position", `${x} 0.6 ${z}`);
      base.setAttribute("rotation", `0 ${rotY} 0`);
      base.setAttribute("width", "12");
      base.setAttribute("height", "0.30");
      base.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.0; opacity:0.55; transparent:true");
      el.appendChild(base);
    }

    // --- CENTER PIT / DIVOT ---
    const pitEdge = document.createElement("a-ring");
    pitEdge.setAttribute("radius-inner", "7.7");
    pitEdge.setAttribute("radius-outer", "8.3");
    pitEdge.setAttribute("rotation", "-90 0 0");
    pitEdge.setAttribute("position", "0 0.07 0");
    pitEdge.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.6; opacity:0.55; transparent:true");
    el.appendChild(pitEdge);

    const pitFloor = document.createElement("a-circle");
    pitFloor.classList.add("teleportable");
    pitFloor.setAttribute("radius", "7.6");
    pitFloor.setAttribute("rotation", "-90 0 0");
    pitFloor.setAttribute("position", "0 -1.8 0");
    pitFloor.setAttribute("material", "color:#04060a; roughness:1.0; metalness:0.0");
    el.appendChild(pitFloor);

    const step = document.createElement("a-ring");
    step.setAttribute("radius-inner", "8.3");
    step.setAttribute("radius-outer", "9.0");
    step.setAttribute("rotation", "-90 0 0");
    step.setAttribute("position", "0 0.03 0");
    step.setAttribute("material", "color:#0b0f14; metalness:0.6; roughness:0.4; opacity:0.95; transparent:true");
    el.appendChild(step);

    // --- 8-PLAYER ROUND SHOWCASE TABLE in the PIT ---
    const showcase = document.createElement("a-entity");
    showcase.setAttribute("position", "0 -1.8 0");
    showcase.setAttribute("scarlett-lobby-showcase-table", "");
    el.appendChild(showcase);

    // --- 4 DOORS + 4 JUMBOTRONS ABOVE DOORS ---
    makeDoorWithJumbo(el, { x: 0, z: -28, ry: 0 },  "SCORPION ROOM", "tables");
    makeDoorWithJumbo(el, { x: 28, z: 0, ry: -90 }, "EVENTS", "tables");     // placeholder route
    makeDoorWithJumbo(el, { x: 0, z: 28, ry: 180 },  "VIP", "tables");       // placeholder route
    makeDoorWithJumbo(el, { x: -28, z: 0, ry: 90 },  "STORE", "store");

    // --- SPAWN PADS near doors ---
    makeSpawnPad(el, { x: 0, z: -23 }, "tables", "ENTER SCORPION ROOM");
    makeSpawnPad(el, { x: -23, z: 0 }, "store",  "ENTER STORE");
    makeSpawnPad(el, { x: 23, z: 0 },  "tables", "ENTER EVENTS");
    makeSpawnPad(el, { x: 0, z: 23 },  "tables", "ENTER VIP");

    // Lobby title
    const title = document.createElement("a-text");
    title.setAttribute("value", "SCARLETT LOBBY");
    title.setAttribute("align", "center");
    title.setAttribute("color", "#bff");
    title.setAttribute("width", "14");
    title.setAttribute("position", "0 10 -10");
    el.appendChild(title);

    if (window.hudLog) hudLog("REAL LOBBY built ✅ (circle + pit + 8-seat round + 4 doors + 4 jumbotrons)");

    // ---------- helpers ----------
    function addLight(root, type, cfg, pos) {
      const l = document.createElement("a-entity");
      const kv = Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join("; ");
      l.setAttribute("light", `type: ${type}; ${kv}`);
      l.setAttribute("position", pos);
      root.appendChild(l);
    }

    function makeDoorWithJumbo(root, pose, label, dest) {
      // Door frame
      const frame = document.createElement("a-box");
      frame.setAttribute("position", `${pose.x} 4.0 ${pose.z}`);
      frame.setAttribute("rotation", `0 ${pose.ry} 0`);
      frame.setAttribute("width", "8");
      frame.setAttribute("height", "8");
      frame.setAttribute("depth", "0.4");
      frame.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
      root.appendChild(frame);

      // Door opening (visual)
      const door = document.createElement("a-plane");
      door.setAttribute("position", `${pose.x} 3.2 ${pose.z + 0.22}`);
      door.setAttribute("rotation", `0 ${pose.ry} 0`);
      door.setAttribute("width", "6");
      door.setAttribute("height", "5.6");
      door.setAttribute("material", "color:#03060b; opacity:0.9; transparent:true");
      root.appendChild(door);

      // ✅ REAL video jumbotron above door (also portal)
      const jumbo = document.createElement("a-entity");
      jumbo.setAttribute("id", `jumbo_${label.toLowerCase().replace(/\s+/g,'_')}`);
      jumbo.classList.add("clickable", "portal");
      jumbo.setAttribute("data-dest", dest);
      jumbo.setAttribute("position", `${pose.x} 8.8 ${pose.z + 0.24}`);
      jumbo.setAttribute("rotation", `0 ${pose.ry} 0`);

      // IMPORTANT: use MP4 for Quest reliability.
      // Put these files in /assets/ or change to a direct MP4 URL.
      const demoMP4 =
        (label === "STORE") ? "./assets/demo_store.mp4" :
        (label === "SCORPION ROOM") ? "./assets/demo_scissors.mp4" :
        "./assets/demo_lobby.mp4";

      jumbo.setAttribute("scarlett-jumbotron", `src:${demoMP4}; label:${label}; muted:true; autoplay:true; width:8.5; height:2.2`);
      root.appendChild(jumbo);
    }

    function makeSpawnPad(root, pos, dest, label) {
      const pad = document.createElement("a-ring");
      pad.classList.add("clickable", "portal");
      pad.setAttribute("data-dest", dest);
      pad.setAttribute("radius-inner", "1.2");
      pad.setAttribute("radius-outer", "1.7");
      pad.setAttribute("rotation", "-90 0 0");
      pad.setAttribute("position", `${pos.x} 0.03 ${pos.z}`);
      pad.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.6; opacity:0.55; transparent:true");
      root.appendChild(pad);

      const t = document.createElement("a-text");
      t.setAttribute("value", label);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#bff");
      t.setAttribute("width", "10");
      t.setAttribute("position", `${pos.x} 1.2 ${pos.z}`);
      root.appendChild(t);
    }
  }
});


// ✅ FULL: 8-player ROUND lobby pit table (8 seats + your seat reserved + optional seated bots)
AFRAME.registerComponent("scarlett-lobby-showcase-table", {
  init() {
    const el = this.el;

    // --- Pedestal (wide, thin) ---
    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "6.9");
    base.setAttribute("height", "0.24");
    base.setAttribute("position", "0 0.12 0");
    base.setAttribute("material", "color:#0b0f14; metalness:0.75; roughness:0.35");
    el.appendChild(base);

    const pillar = document.createElement("a-cylinder");
    pillar.setAttribute("radius", "1.25");
    pillar.setAttribute("height", "1.10");
    pillar.setAttribute("position", "0 0.80 0");
    pillar.setAttribute("material", "color:#0b0f14; metalness:0.70; roughness:0.35");
    el.appendChild(pillar);

    // --- Table top (ROUND) ---
    const top = document.createElement("a-cylinder");
    top.setAttribute("radius", "3.35");
    top.setAttribute("height", "0.22");
    top.setAttribute("position", "0 1.45 0");
    top.setAttribute("material", "color:#101827; roughness:0.65; metalness:0.15");
    el.appendChild(top);

    // --- Leather rim ---
    const leather = document.createElement("a-torus");
    leather.setAttribute("radius", "3.28");
    leather.setAttribute("radius-tubular", "0.10");
    leather.setAttribute("rotation", "-90 0 0");
    leather.setAttribute("position", "0 1.58 0");
    leather.setAttribute("material", "color:#2a1b12; metalness:0.12; roughness:0.92");
    el.appendChild(leather);

    // --- Felt ---
    const felt = document.createElement("a-cylinder");
    felt.setAttribute("radius", "3.00");
    felt.setAttribute("height", "0.05");
    felt.setAttribute("position", "0 1.60 0");
    felt.setAttribute("material", "color:#07111a; roughness:0.95; metalness:0.0");
    el.appendChild(felt);

    // --- Neon ring ---
    const neon = document.createElement("a-torus");
    neon.setAttribute("radius", "3.10");
    neon.setAttribute("radius-tubular", "0.028");
    neon.setAttribute("rotation", "-90 0 0");
    neon.setAttribute("position", "0 1.64 0");
    neon.setAttribute("material", "color:#0f1116; emissive:#00e5ff; emissiveIntensity:2.0; opacity:0.85; transparent:true");
    el.appendChild(neon);

    // --- Inner pot zone ---
    const pot = document.createElement("a-cylinder");
    pot.setAttribute("radius", "0.95");
    pot.setAttribute("height", "0.02");
    pot.setAttribute("position", "0 1.67 0");
    pot.setAttribute("material", "color:#0b1a25; emissive:#7b61ff; emissiveIntensity:0.25; roughness:0.9; metalness:0.0");
    el.appendChild(pot);

    // --- 8 seats around (seat 0 reserved for you) ---
    const seatRadius = 6.1;
    const seatY = 0.20;

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * seatRadius;
      const z = Math.sin(a) * seatRadius;
      const ry = (-a * 180 / Math.PI) + 90;

      const seat = document.createElement("a-entity");
      seat.setAttribute("id", `lobby_seat_${i}`);
      seat.setAttribute("position", `${x} ${seatY} ${z}`);
      seat.setAttribute("rotation", `0 ${ry} 0`);
      seat.setAttribute("scarlett-chair", ""); // chair from table6.js
      el.appendChild(seat);
    }

    // Seat marker for YOU
    const yourSeat = document.getElementById("lobby_seat_0");
    if (yourSeat) {
      const marker = document.createElement("a-ring");
      marker.setAttribute("radius-inner", "0.26");
      marker.setAttribute("radius-outer", "0.40");
      marker.setAttribute("rotation", "-90 0 0");
      marker.setAttribute("position", "0 0.03 0");
      marker.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.0; opacity:0.55; transparent:true");
      yourSeat.appendChild(marker);

      const label = document.createElement("a-text");
      label.setAttribute("value", "YOUR SEAT");
      label.setAttribute("align", "center");
      label.setAttribute("color", "#bff");
      label.setAttribute("width", "6");
      label.setAttribute("position", "0 1.85 0");
      yourSeat.appendChild(label);
    }

    // Optional lobby bots seated (7 bots, your seat empty)
    if (window.SCARLETT_LOBBY_BOTS) {
      const models = [
        "./assets/avatars/male.glb",
        "./assets/avatars/female.glb",
        "./assets/avatars/futuristic_apocalypse_female_cargo_pants.glb",
        "./assets/avatars/male.glb",
        "./assets/avatars/female.glb",
        "./assets/avatars/ninja.glb",
        "./assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb",
      ];

      let m = 0;
      for (let i = 0; i < 8; i++) {
        if (i === 0) continue; // reserve your seat
        const seat = document.getElementById(`lobby_seat_${i}`);
        if (!seat) continue;

        const a = document.createElement("a-entity");
        a.setAttribute("gltf-model", models[m % models.length]);
        a.setAttribute("position", "0 0.06 0.05");
        a.setAttribute("rotation", "0 180 0");
        a.setAttribute("scale", "1.05 1.05 1.05");
        a.setAttribute("animation-mixer", "clip:*; loop:repeat");
        seat.appendChild(a);
        m++;
      }
    }

    if (window.hudLog) hudLog("Lobby pit table ✅ ROUND (8 seats) | seat_0 reserved");
  }
});
