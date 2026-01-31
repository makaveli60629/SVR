AFRAME.registerComponent("scarlett-lobby", {
  init() {
    const el = this.el;

    // ---- SKY ----
    const sky = document.createElement("a-sky");
    sky.setAttribute("color", "#05080f");
    el.appendChild(sky);

    // ---- FLOOR ----
    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    floor.setAttribute("radius", "34");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("material", "color:#070b10; roughness:0.95; metalness:0.05");
    el.appendChild(floor);

    // ---- GLOBAL LIGHTING (BRIGHTER) ----
    addLight(el, "hemisphere", { intensity: 1.25, color: "#e6fbff", groundColor: "#0b1622" }, "0 40 0");
    addLight(el, "directional", { intensity: 1.6, color: "#ffffff" }, "18 30 16");
    addLight(el, "directional", { intensity: 0.9, color: "#b19cd9" }, "-18 22 -14");

    // big ambient-ish points
    addLight(el, "point", { intensity: 1.8, distance: 120, decay: 2, color: "#00e5ff" }, "0 14 0");
    addLight(el, "point", { intensity: 1.4, distance: 120, decay: 2, color: "#7b61ff" }, "-18 10 -18");
    addLight(el, "point", { intensity: 1.1, distance: 120, decay: 2, color: "#ffffff" }, "18 10 -18");

    // ---- WALLS (DOUBLE HEIGHT) + BRICK TEXTURE ----
    // If the texture fails to load, it will still show the base color.
    const assets = document.querySelector("a-assets");

    const brickImg = ensureAssetImage(
      assets,
      "brickTex",
      "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/brick_diffuse.jpg"
    );

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

      // brick look + neon tint
      seg.setAttribute(
        "material",
        `color:#0a0e14; src:#${brickImg.id}; repeat:6 3; roughness:0.95; metalness:0.05; opacity:0.98; transparent:true`
      );

      el.appendChild(seg);

      // base neon strip
      const base = document.createElement("a-plane");
      base.setAttribute("position", `${x} 0.6 ${z}`);
      base.setAttribute("rotation", `0 ${rotY} 0`);
      base.setAttribute("width", "12");
      base.setAttribute("height", "0.30");
      base.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.2; opacity:0.55; transparent:true");
      el.appendChild(base);
    }

    // ---- PILLARS + LIGHT ON EACH ----
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const x = Math.cos(a) * 18;
      const z = Math.sin(a) * 18;

      const p = document.createElement("a-cylinder");
      p.setAttribute("radius", "0.75");
      p.setAttribute("height", "14");
      p.setAttribute("position", `${x} 7 ${z}`);
      p.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
      el.appendChild(p);

      const band = document.createElement("a-ring");
      band.setAttribute("radius-inner", "0.72");
      band.setAttribute("radius-outer", "0.82");
      band.setAttribute("rotation", "-90 0 0");
      band.setAttribute("position", `${x} 1.2 ${z}`);
      band.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.8; opacity:0.55; transparent:true");
      el.appendChild(band);

      // ✅ Light attached near top of pillar
      const lamp = document.createElement("a-entity");
      lamp.setAttribute("light", "type: point; intensity: 1.35; distance: 22; decay: 2; color: #00e5ff");
      lamp.setAttribute("position", `${x} 11.5 ${z}`);
      el.appendChild(lamp);
    }

    // ---- CENTER PIT / DIVOT ----
    // Make sure there is NO “lid” at player head height
    const pitEdge = document.createElement("a-ring");
    pitEdge.setAttribute("radius-inner", "7.7");
    pitEdge.setAttribute("radius-outer", "8.3");
    pitEdge.setAttribute("rotation", "-90 0 0");
    pitEdge.setAttribute("position", "0 0.07 0");
    pitEdge.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.8; opacity:0.55; transparent:true");
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

    // ---- 8-SEAT ROUND SHOWCASE TABLE IN PIT ----
    const showcase = document.createElement("a-entity");
    showcase.setAttribute("position", "0 -1.8 0");
    showcase.setAttribute("scarlett-lobby-showcase-table", "");
    el.appendChild(showcase);

    // ---- DOORS + JUMBOTRONS (PORTALS) ----
    makeDoorWithJumbo(el, { x: 0, z: -28, ry: 0 },   "SCORPION ROOM", "tables");
    makeDoorWithJumbo(el, { x: 28, z: 0, ry: -90 },  "EVENTS", "tables");
    makeDoorWithJumbo(el, { x: 0, z: 28, ry: 180 },  "VIP", "tables");
    makeDoorWithJumbo(el, { x: -28, z: 0, ry: 90 },  "STORE", "store");

    // Spawn pads near doors
    makeSpawnPad(el, { x: 0, z: -23 }, "tables", "ENTER SCORPION ROOM");
    makeSpawnPad(el, { x: -23, z: 0 }, "store",  "ENTER STORE");
    makeSpawnPad(el, { x: 23, z: 0 },  "tables", "ENTER EVENTS");
    makeSpawnPad(el, { x: 0, z: 23 },  "tables", "ENTER VIP");

    // Title
    const title = document.createElement("a-text");
    title.setAttribute("value", "SCARLETT LOBBY");
    title.setAttribute("align", "center");
    title.setAttribute("color", "#bff");
    title.setAttribute("width", "14");
    title.setAttribute("position", "0 10 -10");
    el.appendChild(title);

    if (window.hudLog) hudLog("Lobby upgraded ✅ (brick walls + pillar lights + brighter)");

    // ---- Helpers ----
    function addLight(root, type, cfg, pos) {
      const l = document.createElement("a-entity");
      const kv = Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join("; ");
      l.setAttribute("light", `type: ${type}; ${kv}`);
      l.setAttribute("position", pos);
      root.appendChild(l);
    }

    function ensureAssetImage(assets, id, src) {
      let img = document.getElementById(id);
      if (img) return img;
      img = document.createElement("img");
      img.setAttribute("id", id);
      img.setAttribute("crossorigin", "anonymous");
      img.setAttribute("src", src);
      assets.appendChild(img);
      return img;
    }

    function makeDoorWithJumbo(root, pose, label, dest) {
      const frame = document.createElement("a-box");
      frame.setAttribute("position", `${pose.x} 4.0 ${pose.z}`);
      frame.setAttribute("rotation", `0 ${pose.ry} 0`);
      frame.setAttribute("width", "8");
      frame.setAttribute("height", "8");
      frame.setAttribute("depth", "0.4");
      frame.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
      root.appendChild(frame);

      const door = document.createElement("a-plane");
      door.setAttribute("position", `${pose.x} 3.2 ${pose.z + 0.22}`);
      door.setAttribute("rotation", `0 ${pose.ry} 0`);
      door.setAttribute("width", "6");
      door.setAttribute("height", "5.6");
      door.setAttribute("material", "color:#03060b; opacity:0.9; transparent:true");
      root.appendChild(door);

      const jumbo = document.createElement("a-entity");
      jumbo.setAttribute("id", `jumbo_${label.toLowerCase().replace(/\s+/g, "_")}`);
      jumbo.classList.add("clickable", "portal");
      jumbo.setAttribute("data-dest", dest);
      jumbo.setAttribute("position", `${pose.x} 8.8 ${pose.z + 0.24}`);
      jumbo.setAttribute("rotation", `0 ${pose.ry} 0`);
      jumbo.setAttribute("scarlett-jumbotron-iptv", `m3uUrl:${window.SCARLETT_M3U_URL}; label:${label}; width:8.5; height:2.2`);
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
      pad.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.7; opacity:0.55; transparent:true");
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

AFRAME.registerComponent("scarlett-lobby-showcase-table", {
  init() {
    const el = this.el;

    // platform in pit
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

    const top = document.createElement("a-cylinder");
    top.setAttribute("radius", "3.35");
    top.setAttribute("height", "0.22");
    top.setAttribute("position", "0 1.45 0");
    top.setAttribute("material", "color:#101827; roughness:0.65; metalness:0.15");
    el.appendChild(top);

    const felt = document.createElement("a-cylinder");
    felt.setAttribute("radius", "3.00");
    felt.setAttribute("height", "0.05");
    felt.setAttribute("position", "0 1.60 0");
    felt.setAttribute("material", "color:#07111a; roughness:0.95; metalness:0.0");
    el.appendChild(felt);

    const neon = document.createElement("a-torus");
    neon.setAttribute("radius", "3.10");
    neon.setAttribute("radius-tubular", "0.028");
    neon.setAttribute("rotation", "-90 0 0");
    neon.setAttribute("position", "0 1.64 0");
    neon.setAttribute("material", "color:#0f1116; emissive:#00e5ff; emissiveIntensity:2.0; opacity:0.85; transparent:true");
    el.appendChild(neon);

    // Seats
    const seatRadius = 6.2;
    const seatY = 0.32; // ✅ lifted so bots aren't buried

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * seatRadius;
      const z = Math.sin(a) * seatRadius;
      const ry = (-a * 180 / Math.PI) + 90;

      const seat = document.createElement("a-entity");
      seat.setAttribute("id", `lobby_seat_${i}`);
      seat.setAttribute("position", `${x} ${seatY} ${z}`);
      seat.setAttribute("rotation", `0 ${ry} 0`);
      seat.setAttribute("scarlett-chair", "");
      el.appendChild(seat);
    }

    // Bots (7 seats filled, seat 0 open)
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
        if (i === 0) continue;
        const seat = document.getElementById(`lobby_seat_${i}`);
        if (!seat) continue;

        const a = document.createElement("a-entity");
        a.setAttribute("gltf-model", models[m % models.length]);
        a.setAttribute("position", "0 0.15 0.05"); // ✅ lifted more
        a.setAttribute("rotation", "0 180 0");
        a.setAttribute("scale", "1.05 1.05 1.05");
        a.setAttribute("animation-mixer", "clip:*; loop:repeat");
        seat.appendChild(a);
        m++;
      }
    }

    if (window.hudLog) hudLog("Pit table corrected ✅ (bots lifted, no bury)");
  }
});
