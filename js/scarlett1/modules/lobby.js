AFRAME.registerComponent("scarlett-lobby", {
  init() {
    const el = this.el;

    // ---------- SKY ----------
    const sky = document.createElement("a-sky");
    sky.setAttribute("color", "#02030a");
    el.appendChild(sky);

    // ---------- FLOOR (teleportable) ----------
    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    floor.setAttribute("radius", "34");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("position", "0 0 0");
    floor.setAttribute("material", "color:#05080f; roughness:0.98; metalness:0.02");
    el.appendChild(floor);

    // ---------- LIGHTING (BIG BOOST) ----------
    addLight(el, "hemisphere", { intensity: 1.8, color: "#f4feff", groundColor: "#07101a" }, "0 50 0");
    addLight(el, "directional", { intensity: 2.1, color: "#ffffff" }, "25 45 20");
    addLight(el, "point", { intensity: 2.2, distance: 220, decay: 2, color: "#00e5ff" }, "0 18 0");
    addLight(el, "point", { intensity: 1.9, distance: 220, decay: 2, color: "#7b61ff" }, "-18 14 -18");
    addLight(el, "point", { intensity: 1.2, distance: 220, decay: 2, color: "#ffffff" }, "18 14 -18");

    // ---------- WALL (circular) ----------
    const WALL_RADIUS = 30;
    const WALL_H = 18; // 2x height
    const wall = document.createElement("a-cylinder");
    wall.setAttribute("radius", WALL_RADIUS.toFixed(2));
    wall.setAttribute("height", WALL_H.toFixed(2));
    wall.setAttribute("position", `0 ${(WALL_H/2).toFixed(2)} 0`);
    wall.setAttribute("material", "color:#070b12; roughness:0.95; metalness:0.05; side:double");
    el.appendChild(wall);

    // ---------- NEON WALL BAND (doesn't block doors) ----------
    // We skip the 4 doorway angles (0/90/180/270) so nothing overlays doors/jumbotrons.
    const bandY = 10.5;
    const seg = 36;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const deg = (a * 180 / Math.PI + 360) % 360;

      const nearDoor =
        nearAngle(deg, 0, 14) || nearAngle(deg, 90, 14) || nearAngle(deg, 180, 14) || nearAngle(deg, 270, 14);
      if (nearDoor) continue;

      const x = Math.cos(a) * WALL_RADIUS;
      const z = Math.sin(a) * WALL_RADIUS;
      const rotY = (-a * 180 / Math.PI) + 90;

      const band = document.createElement("a-plane");
      band.setAttribute("position", `${x.toFixed(2)} ${bandY} ${z.toFixed(2)}`);
      band.setAttribute("rotation", `0 ${rotY.toFixed(2)} 0`);
      band.setAttribute("width", "5.2");
      band.setAttribute("height", "0.40");
      band.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.65; opacity:0.55; transparent:true");
      el.appendChild(band);

      const sconce = document.createElement("a-entity");
      sconce.setAttribute("light", "type: point; intensity: 0.95; distance: 18; decay: 2; color: #00e5ff");
      sconce.setAttribute("position", `${x.toFixed(2)} ${(bandY+0.35).toFixed(2)} ${z.toFixed(2)}`);
      el.appendChild(sconce);
    }

    // ---------- PILLARS (spread to wall radius) ----------
    const pillarCount = 12;
    const pillarR = 24.5;     // closer to wall
    for (let i = 0; i < pillarCount; i++) {
      const a = (i / pillarCount) * Math.PI * 2;
      const x = Math.cos(a) * pillarR;
      const z = Math.sin(a) * pillarR;

      // Avoid doorway lanes (don’t block paths)
      const deg = (a * 180 / Math.PI + 360) % 360;
      const lane =
        nearAngle(deg, 0, 18) || nearAngle(deg, 90, 18) || nearAngle(deg, 180, 18) || nearAngle(deg, 270, 18);
      if (lane) continue;

      const p = document.createElement("a-cylinder");
      p.setAttribute("radius", "0.85");
      p.setAttribute("height", WALL_H.toFixed(2));
      p.setAttribute("position", `${x.toFixed(2)} ${(WALL_H/2).toFixed(2)} ${z.toFixed(2)}`);
      p.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
      el.appendChild(p);

      // Neon bands on pillar
      [2.0, 6.5, 11.0, 15.5].forEach((yy, idx) => {
        const ring = document.createElement("a-ring");
        ring.setAttribute("radius-inner", "0.78");
        ring.setAttribute("radius-outer", "0.94");
        ring.setAttribute("rotation", "-90 0 0");
        ring.setAttribute("position", `${x.toFixed(2)} ${yy.toFixed(2)} ${z.toFixed(2)}`);
        ring.setAttribute(
          "material",
          `color:${idx % 2 ? "#7b61ff" : "#00e5ff"}; emissive:${idx % 2 ? "#7b61ff" : "#00e5ff"}; emissiveIntensity:1.8; opacity:0.60; transparent:true`
        );
        el.appendChild(ring);
      });

      // Light on each pillar
      const pl = document.createElement("a-entity");
      pl.setAttribute("light", "type: point; intensity: 0.95; distance: 22; decay: 2; color: #7b61ff");
      pl.setAttribute("position", `${x.toFixed(2)} 8.8 ${z.toFixed(2)}`);
      el.appendChild(pl);
    }

    // ---------- DEEP CENTER PIT (NO LID / NO CLIP) ----------
    const PIT_RADIUS = 8.0;
    const PIT_DEPTH  = 12.0;   // deeper than before
    const PIT_FLOOR_Y = -PIT_DEPTH;

    const pitLip = document.createElement("a-ring");
    pitLip.setAttribute("radius-inner", (PIT_RADIUS + 0.20).toFixed(2));
    pitLip.setAttribute("radius-outer", (PIT_RADIUS + 0.90).toFixed(2));
    pitLip.setAttribute("rotation", "-90 0 0");
    pitLip.setAttribute("position", "0 0.03 0");
    pitLip.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35; opacity:0.98; transparent:true");
    el.appendChild(pitLip);

    const pitWall = document.createElement("a-cylinder");
    pitWall.setAttribute("radius", PIT_RADIUS.toFixed(2));
    pitWall.setAttribute("height", PIT_DEPTH.toFixed(2));
    pitWall.setAttribute("position", `0 ${(PIT_FLOOR_Y/2).toFixed(2)} 0`);
    pitWall.setAttribute("material", "color:#05070c; roughness:1.0; metalness:0.0; side:double");
    el.appendChild(pitWall);

    const pitFloor = document.createElement("a-circle");
    pitFloor.classList.add("teleportable");
    pitFloor.setAttribute("radius", (PIT_RADIUS - 0.4).toFixed(2));
    pitFloor.setAttribute("rotation", "-90 0 0");
    pitFloor.setAttribute("position", `0 ${PIT_FLOOR_Y.toFixed(2)} 0`);
    pitFloor.setAttribute("material", "color:#020308; roughness:1.0; metalness:0.0");
    el.appendChild(pitFloor);

    const depthRing = document.createElement("a-ring");
    depthRing.setAttribute("radius-inner", (PIT_RADIUS - 0.9).toFixed(2));
    depthRing.setAttribute("radius-outer", (PIT_RADIUS - 0.6).toFixed(2));
    depthRing.setAttribute("rotation", "-90 0 0");
    depthRing.setAttribute("position", `0 ${(PIT_FLOOR_Y + 0.08).toFixed(2)} 0`);
    depthRing.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.8; opacity:0.55; transparent:true");
    el.appendChild(depthRing);

    // ---------- SAFE SPAWN PADS ----------
    // NOTE: rotation "0 0 0" makes you face into lobby; change to 180 if you want reverse.
    window.makeSpawnPad(el, {
      id: "pad_lobby_safe",
      position: "0 0 18",
      rotation: "0 0 0",
      visible: false
    });

    // Optional visible pad on the floor near spawn (off by default)
    // If you want it visible, set visible:true above.

    // ---------- Simple lobby label ----------
    const txt = document.createElement("a-text");
    txt.setAttribute("value", "SCARLETT1 LOBBY");
    txt.setAttribute("color", "#9ff");
    txt.setAttribute("position", "-4.2 6.2 22");
    txt.setAttribute("width", "14");
    el.appendChild(txt);

    if (window.hudLog) hudLog("Lobby upgraded ✅ (deep pit + heavy neon + bright lighting)");

    // -------- helpers --------
    function addLight(root, type, cfg, pos) {
      const l = document.createElement("a-entity");
      const kv = Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join("; ");
      l.setAttribute("light", `type: ${type}; ${kv}`);
      l.setAttribute("position", pos);
      root.appendChild(l);
    }

    function nearAngle(deg, target, tol) {
      const d = Math.abs(((deg - target + 540) % 360) - 180);
      return d < tol;
    }
  }
});
