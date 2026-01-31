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

    // --- Neon ring (signature) ---
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
    const seatRadius = 6.1;   // distance from center
    const seatY = 0.20;       // chairs sit on pedestal
    const seats = [];

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * seatRadius;
      const z = Math.sin(a) * seatRadius;
      const ry = (-a * 180 / Math.PI) + 90;

      const seat = document.createElement("a-entity");
      seat.setAttribute("id", `lobby_seat_${i}`);
      seat.setAttribute("position", `${x} ${seatY} ${z}`);
      seat.setAttribute("rotation", `0 ${ry} 0`);
      seat.setAttribute("scarlett-chair", ""); // uses your same chair component
      el.appendChild(seat);

      seats.push(seat);
    }

    // --- Seat markers (front seat reserved for you) ---
    // We'll mark seat_0 as YOUR seat (you can change which one later).
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

    // --- Optional: lobby seated avatars (7 bots, leave your seat empty) ---
    // If you want this ON, set window.SCARLETT_LOBBY_BOTS = true in main.js
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
});    el.appendChild(felt);

    // neon ring
    const neon = document.createElement("a-torus");
    neon.setAttribute("radius", "2.95");
    neon.setAttribute("radius-tubular", "0.02");
    neon.setAttribute("rotation", "-90 0 0");
    neon.setAttribute("position", "0 1.28 0");
    neon.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:2.0; opacity:0.85; transparent:true");
    el.appendChild(neon);

    // 8 “bots” around (placeholder statues in lobby)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * 5.0;
      const z = Math.sin(a) * 5.0;
      const b = document.createElement("a-box");
      b.setAttribute("width", "0.5");
      b.setAttribute("height", "1.3");
      b.setAttribute("depth", "0.35");
      b.setAttribute("position", `${x} 0.85 ${z}`);
      b.setAttribute("rotation", `0 ${(-a*180/Math.PI)+90} 0`);
      b.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:0.10; roughness:0.9");
      el.appendChild(b);
    }
  }
});
