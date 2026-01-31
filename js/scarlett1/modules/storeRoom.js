AFRAME.registerComponent("scarlett-store-room", {
  init() {
    const el = this.el;

    // Sky / ambient
    const sky = document.createElement("a-sky");
    sky.setAttribute("color", "#03050a");
    el.appendChild(sky);

    // Main floor
    const floor = document.createElement("a-plane");
    floor.classList.add("teleportable");
    floor.setAttribute("width", "60");
    floor.setAttribute("height", "60");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("position", "0 0 0");
    floor.setAttribute("material", "color:#070b10; roughness:0.95; metalness:0.05");
    el.appendChild(floor);

    // Lighting (BRIGHT)
    addLight(el, "hemisphere", { intensity: 1.7, color: "#f4feff", groundColor: "#06101a" }, "0 30 0");
    addLight(el, "point", { intensity: 2.4, distance: 120, decay: 2, color: "#00e5ff" }, "0 10 0");
    addLight(el, "point", { intensity: 1.8, distance: 120, decay: 2, color: "#7b61ff" }, "-10 9 -10");
    addLight(el, "point", { intensity: 1.2, distance: 120, decay: 2, color: "#ffffff" }, "10 9 -10");

    // Walls (store box)
    makeWallBox(el, 26, 10);

    // Entry arch + STORE sign (near pad/door)
    const entry = document.createElement("a-entity");
    entry.setAttribute("position", "0 0 22");
    el.appendChild(entry);

    const arch = document.createElement("a-box");
    arch.setAttribute("width", "18");
    arch.setAttribute("height", "8");
    arch.setAttribute("depth", "1");
    arch.setAttribute("position", "0 4 0");
    arch.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
    entry.appendChild(arch);

    const archHole = document.createElement("a-box");
    archHole.setAttribute("width", "12");
    archHole.setAttribute("height", "6");
    archHole.setAttribute("depth", "1.2");
    archHole.setAttribute("position", "0 3 0.1");
    archHole.setAttribute("material", "color:#03060b; opacity:0.01; transparent:true"); // visual hole illusion
    entry.appendChild(archHole);

    const sign = document.createElement("a-text");
    sign.setAttribute("value", "STORE");
    sign.setAttribute("align", "center");
    sign.setAttribute("color", "#bff");
    sign.setAttribute("width", "18");
    sign.setAttribute("position", "0 7.2 0.55");
    entry.appendChild(sign);

    const signGlow = document.createElement("a-plane");
    signGlow.setAttribute("width", "10");
    signGlow.setAttribute("height", "1.0");
    signGlow.setAttribute("position", "0 7.2 0.52");
    signGlow.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.8; opacity:0.45; transparent:true");
    entry.appendChild(signGlow);

    // Spawn pad in store room (entry)
    if (window.makeSpawnPad) {
      window.makeSpawnPad(el, {
        id: "pad_store_entry",
        position: "0 0 18",
        rotation: "0 180 0",
        visible: false
      });
    }

    // Display cases left/right of entry
    makeDisplayCase(el, { x: -14, z: 18 }, "FEATURED");
    makeDisplayCase(el, { x: 14,  z: 18 }, "NEW");

    // Long side shelves
    makeShelfLine(el, { x: -22, z: 0, ry: 90 }, 5);
    makeShelfLine(el, { x: 22,  z: 0, ry: -90 }, 5);

    // Center kiosks
    makeKiosk(el, { x: -6, z: 4 }, "SKINS");
    makeKiosk(el, { x: 6,  z: 4 }, "CHIPS");
    makeKiosk(el, { x: 0,  z: -6 }, "VIP");

    // Balcony overhead (square balcony that overlooks store entry)
    const balcony = document.createElement("a-entity");
    balcony.setAttribute("position", "0 6.5 8");
    el.appendChild(balcony);

    const balconyFloor = document.createElement("a-box");
    balconyFloor.classList.add("teleportable");
    balconyFloor.setAttribute("width", "22");
    balconyFloor.setAttribute("height", "0.5");
    balconyFloor.setAttribute("depth", "14");
    balconyFloor.setAttribute("position", "0 0 0");
    balconyFloor.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
    balcony.appendChild(balconyFloor);

    // Balcony rails (neon)
    makeRail(balcony, { x: 0, z: 7.2, w: 22, ry: 0 });
    makeRail(balcony, { x: 0, z: -7.2, w: 22, ry: 180 });
    makeRail(balcony, { x: 11.2, z: 0, w: 14, ry: -90 });
    makeRail(balcony, { x: -11.2, z: 0, w: 14, ry: 90 });

    // Stairs up to balcony (simple ramp)
    const ramp = document.createElement("a-box");
    ramp.classList.add("teleportable");
    ramp.setAttribute("width", "6");
    ramp.setAttribute("height", "0.5");
    ramp.setAttribute("depth", "18");
    ramp.setAttribute("position", "-14 3.2 6");
    ramp.setAttribute("rotation", "-18 0 0");
    ramp.setAttribute("material", "color:#0b0f14; metalness:0.5; roughness:0.45");
    el.appendChild(ramp);

    // Back-to-lobby pad
    if (window.makeSpawnPad) {
      window.makeSpawnPad(el, {
        id: "pad_store_to_lobby",
        position: "0 0 -18",
        rotation: "0 0 0",
        visible: false
      });
    }

    // Label / ambience
    const txt = document.createElement("a-text");
    txt.setAttribute("value", "SCARLETT STORE");
    txt.setAttribute("color", "#9ff");
    txt.setAttribute("width", "14");
    txt.setAttribute("position", "-7 9 -22");
    el.appendChild(txt);

    if (window.hudLog) hudLog("Store upgraded ✅ (displays + shelves + balcony + bright lights)");

    // ------------- helpers -------------
    function addLight(root, type, cfg, pos) {
      const l = document.createElement("a-entity");
      const kv = Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join("; ");
      l.setAttribute("light", `type: ${type}; ${kv}`);
      l.setAttribute("position", pos);
      root.appendChild(l);
    }

    function makeWallBox(root, half, h) {
      const y = h / 2;
      const wallMat = "color:#0a0e14; roughness:0.95; metalness:0.05";
      const walls = [
        { x: 0, z: -half, ry: 0,  w: half * 2, hh: h },
        { x: 0, z: half,  ry: 180,w: half * 2, hh: h },
        { x: -half, z: 0, ry: 90, w: half * 2, hh: h },
        { x: half,  z: 0, ry: -90,w: half * 2, hh: h },
      ];
      walls.forEach(W => {
        const p = document.createElement("a-plane");
        p.setAttribute("position", `${W.x} ${y} ${W.z}`);
        p.setAttribute("rotation", `0 ${W.ry} 0`);
        p.setAttribute("width", W.w);
        p.setAttribute("height", W.hh);
        p.setAttribute("material", wallMat);
        root.appendChild(p);

        // neon base strip
        const strip = document.createElement("a-plane");
        strip.setAttribute("position", `${W.x} 0.6 ${W.z}`);
        strip.setAttribute("rotation", `0 ${W.ry} 0`);
        strip.setAttribute("width", W.w);
        strip.setAttribute("height", "0.32");
        strip.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.2; opacity:0.50; transparent:true");
        root.appendChild(strip);
      });
    }

    function makeDisplayCase(root, at, title) {
      const g = document.createElement("a-entity");
      g.setAttribute("position", `${at.x} 0 ${at.z}`);
      root.appendChild(g);

      const base = document.createElement("a-box");
      base.setAttribute("width", "7");
      base.setAttribute("height", "1");
      base.setAttribute("depth", "2.4");
      base.setAttribute("position", "0 0.5 0");
      base.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
      g.appendChild(base);

      const glass = document.createElement("a-box");
      glass.setAttribute("width", "6.6");
      glass.setAttribute("height", "2.8");
      glass.setAttribute("depth", "2.0");
      glass.setAttribute("position", "0 2.0 0");
      glass.setAttribute("material", "color:#0f1116; opacity:0.18; transparent:true; roughness:0.2; metalness:0.0");
      g.appendChild(glass);

      const neon = document.createElement("a-ring");
      neon.setAttribute("radius-inner", "1.0");
      neon.setAttribute("radius-outer", "1.35");
      neon.setAttribute("rotation", "-90 0 0");
      neon.setAttribute("position", "0 0.06 0");
      neon.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.8; opacity:0.55; transparent:true");
      g.appendChild(neon);

      const t = document.createElement("a-text");
      t.setAttribute("value", title);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#bff");
      t.setAttribute("width", "10");
      t.setAttribute("position", "0 3.6 0");
      g.appendChild(t);

      // light over display
      const lamp = document.createElement("a-entity");
      lamp.setAttribute("light", "type: spot; intensity: 1.5; angle: 30; penumbra: 0.4; distance: 22; color: #ffffff");
      lamp.setAttribute("position", "0 6.5 0");
      lamp.setAttribute("rotation", "-90 0 0");
      g.appendChild(lamp);
    }

    function makeShelfLine(root, at, count) {
      const g = document.createElement("a-entity");
      g.setAttribute("position", `${at.x} 0 ${at.z}`);
      g.setAttribute("rotation", `0 ${at.ry} 0`);
      root.appendChild(g);

      for (let i = 0; i < count; i++) {
        const s = document.createElement("a-box");
        s.setAttribute("width", "16");
        s.setAttribute("height", "0.6");
        s.setAttribute("depth", "2.3");
        s.setAttribute("position", `0 ${1.0 + i * 1.35} 0`);
        s.setAttribute("material", "color:#0b0f14; metalness:0.55; roughness:0.35");
        g.appendChild(s);

        const strip = document.createElement("a-plane");
        strip.setAttribute("width", "16");
        strip.setAttribute("height", "0.18");
        strip.setAttribute("position", `0 ${1.22 + i * 1.35} 1.18`);
        strip.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.15; opacity:0.55; transparent:true");
        g.appendChild(strip);
      }
    }

    function makeKiosk(root, at, title) {
      const g = document.createElement("a-entity");
      g.setAttribute("position", `${at.x} 0 ${at.z}`);
      root.appendChild(g);

      const base = document.createElement("a-cylinder");
      base.setAttribute("radius", "1.6");
      base.setAttribute("height", "0.5");
      base.setAttribute("position", "0 0.25 0");
      base.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
      g.appendChild(base);

      const top = document.createElement("a-cylinder");
      top.setAttribute("radius", "1.4");
      top.setAttribute("height", "0.18");
      top.setAttribute("position", "0 1.05 0");
      top.setAttribute("material", "color:#07111a; roughness:0.95; metalness:0.0");
      g.appendChild(top);

      const ring = document.createElement("a-torus");
      ring.setAttribute("radius", "1.45");
      ring.setAttribute("radius-tubular", "0.03");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("position", "0 1.15 0");
      ring.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.6; opacity:0.6; transparent:true");
      g.appendChild(ring);

      const t = document.createElement("a-text");
      t.setAttribute("value", title);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#bff");
      t.setAttribute("width", "8");
      t.setAttribute("position", "0 2.1 0");
      g.appendChild(t);

      const lamp = document.createElement("a-entity");
      lamp.setAttribute("light", "type: point; intensity: 1.25; distance: 16; decay: 2; color: #ffffff");
      lamp.setAttribute("position", "0 4 0");
      g.appendChild(lamp);
    }

    function makeRail(parent, cfg) {
      const rail = document.createElement("a-box");
      rail.setAttribute("width", cfg.w);
      rail.setAttribute("height", "1.2");
      rail.setAttribute("depth", "0.25");
      rail.setAttribute("position", `${cfg.x} 1.0 ${cfg.z}`);
      rail.setAttribute("rotation", `0 ${cfg.ry} 0`);
      rail.setAttribute("material", "color:#0b0f14; emissive:#7b61ff; emissiveIntensity:0.9; opacity:0.85; transparent:true");
      parent.appendChild(rail);

      const glow = document.createElement("a-plane");
      glow.setAttribute("width", cfg.w);
      glow.setAttribute("height", "0.25");
      glow.setAttribute("position", `${cfg.x} 0.25 ${cfg.z}`);
      glow.setAttribute("rotation", `0 ${cfg.ry} 0`);
      glow.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.2; opacity:0.45; transparent:true");
      parent.appendChild(glow);
    }
  }
});
