AFRAME.registerComponent("scarlett-tables-room", {
  init() {
    const el = this.el;

    // TELEPORTABLE floor
    const floor = document.createElement("a-plane");
    floor.classList.add("teleportable");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("width", "70");
    floor.setAttribute("height", "70");
    floor.setAttribute("material", "color:#03060b; roughness:0.95; metalness:0.05");
    el.appendChild(floor);

    // Lighting (bright)
    addLight(el, "hemisphere", { intensity: 0.9, color: "#d7f3ff", groundColor: "#05070c" }, "0 30 0");
    addLight(el, "point", { intensity: 1.4, distance: 90, decay: 2, color: "#00e5ff" }, "0 8 12");
    addLight(el, "point", { intensity: 1.2, distance: 90, decay: 2, color: "#7b61ff" }, "-16 8 -12");

    // Room walls (dark neon)
    makeRoom(el);

    // Main 6-seat table bundle
    const bundle = document.createElement("a-entity");
    bundle.setAttribute("id", "mainTableBundle");
    bundle.setAttribute("position", "0 0 0");
    bundle.setAttribute("scarlett-table", "");
    el.appendChild(bundle);

    // Create dealer + deal visible cards
    const dealer = document.createElement("a-entity");
    dealer.setAttribute("id", "dealer");
    dealer.setAttribute("scarlett-card-dealer", "players: 6");
    bundle.appendChild(dealer);

    setTimeout(() => {
      const d = dealer.components["scarlett-card-dealer"];
      if (d) d.dealHoleCards(bundle);
    }, 700);

    // Seated avatars (5 bots seated, your front seat reserved)
    spawnSeatedBots(bundle);

    // A couple walkers in room (for life)
    spawnWalkers(el);

    // Return to Lobby ring
    makeReturn(el, { x: 0, z: 14, dest: "lobby", label: "RETURN TO LOBBY" });

    // AUTO-SEAT YOU when you enter this room:
    // When teleporting here, we move your rig to the front seat position.
    // We hook into teleport by checking rig position periodically.
    autoSeatPlayer();

    if (window.hudLog) hudLog("Scorpion Room ✅ (table + bots + cards + auto-seat)");

    // ---------- helpers ----------
    function addLight(root, type, cfg, pos) {
      const l = document.createElement("a-entity");
      const kv = Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join("; ");
      l.setAttribute("light", `type: ${type}; ${kv}`);
      l.setAttribute("position", pos);
      root.appendChild(l);
    }

    function makeRoom(root) {
      makeWall(root, { x: 0, y: 8, z: -22, ry: 0, w: 55, h: 18 }, "#02040a");
      makeWall(root, { x: 0, y: 8, z: 22, ry: 180, w: 55, h: 18 }, "#02040a");
      makeWall(root, { x: -27.5, y: 8, z: 0, ry: 90, w: 44, h: 18 }, "#01030a");
      makeWall(root, { x: 27.5, y: 8, z: 0, ry: -90, w: 44, h: 18 }, "#01030a");
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
      edge.setAttribute("height", "0.26");
      edge.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.0; opacity:0.50; transparent:true");
      root.appendChild(edge);
    }

    function makeReturn(root, cfg) {
      const ring = document.createElement("a-ring");
      ring.classList.add("clickable", "portal");
      ring.setAttribute("data-dest", cfg.dest);
      ring.setAttribute("radius-inner", "1.25");
      ring.setAttribute("radius-outer", "1.75");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("position", `${cfg.x} 0.03 ${cfg.z}`);
      ring.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.6; opacity:0.55; transparent:true");
      root.appendChild(ring);

      const t = document.createElement("a-text");
      t.setAttribute("value", cfg.label);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#bff");
      t.setAttribute("width", "8");
      t.setAttribute("position", `${cfg.x} 1.25 ${cfg.z}`);
      root.appendChild(t);
    }

    function spawnSeatedBots(bundle) {
      const models = [
        "./assets/avatars/male.glb",
        "./assets/avatars/female.glb",
        "./assets/avatars/futuristic_apocalypse_female_cargo_pants.glb",
        "./assets/avatars/male.glb",
        "./assets/avatars/female.glb",
        "./assets/avatars/ninja.glb",
      ];

      const seatIds = ["seat_back","seat_l1","seat_l2","seat_r1","seat_r2"]; // 5 bots
      seatIds.forEach((id, i) => {
        const seat = document.getElementById(id);
        if (!seat) return;

        const a = document.createElement("a-entity");
        a.setAttribute("gltf-model", models[i % models.length]);
        a.setAttribute("position", "0 0.06 0.05");
        a.setAttribute("rotation", "0 180 0");
        a.setAttribute("scale", "1.05 1.05 1.05");
        a.setAttribute("animation-mixer", "clip:*; loop:repeat");
        seat.appendChild(a);
      });
    }

    function spawnWalkers(root) {
      const w1 = document.createElement("a-entity");
      w1.setAttribute("gltf-model", "./assets/avatars/ninja.glb");
      w1.setAttribute("scale", "1.05 1.05 1.05");
      w1.setAttribute("position", "-8 0 -6");
      w1.setAttribute("scarlett-walk-path", "radius:10; speed:0.7; y:0");
      root.appendChild(w1);

      const w2 = document.createElement("a-entity");
      w2.setAttribute("gltf-model", "./assets/avatars/male.glb");
      w2.setAttribute("scale", "1.05 1.05 1.05");
      w2.setAttribute("position", "8 0 6");
      w2.setAttribute("scarlett-walk-path", "radius:12; speed:0.55; y:0");
      root.appendChild(w2);
    }

    function autoSeatPlayer() {
      const rig = document.getElementById("rig");
      const dest = document.getElementById("dest_tables");
      const seatFront = document.getElementById("seat_front");
      if (!rig || !dest) return;

      // Poll: if the rig is near the tables destination, snap them into the front seat
      setInterval(() => {
        if (!seatFront) return;
        const rp = rig.object3D.position;
        const dp = dest.object3D.position;

        const dx = rp.x - dp.x;
        const dz = rp.z - dp.z;
        const dist = Math.sqrt(dx*dx + dz*dz);

        if (dist < 4.0) {
          // Put player at front seat (slightly back so view is good)
          const sp = seatFront.object3D.getWorldPosition(new THREE.Vector3());
          rig.setAttribute("position", `${sp.x} ${sp.y + 1.6} ${sp.z + 0.25}`);
          // Face table center
          rig.setAttribute("rotation", "0 180 0");
        }
      }, 1200);
    }
  }
});

// Simple walking loop component for walkers
AFRAME.registerComponent("scarlett-walk-path", {
  schema: { radius: { default: 10 }, speed: { default: 0.6 }, y: { default: 0 } },
  init() { this.t0 = performance.now() / 1000; },
  tick() {
    const t = performance.now() / 1000 - this.t0;
    const r = this.data.radius;
    const a = t * this.data.speed;

    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const yaw = (-a * 180 / Math.PI) - 90;

    this.el.setAttribute("position", `${x} ${this.data.y} ${z}`);
    this.el.setAttribute("rotation", `0 ${yaw} 0`);
  }
});
