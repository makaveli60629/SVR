AFRAME.registerComponent("scarlett-table", {
  init: function () {
    const el = this.el;

    // =========================
    // PEDESTAL (bigger + cleaner)
    // =========================
    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "3.85");        // BIGGER so chairs never overlap table edge
    base.setAttribute("height", "0.18");        // thin platform
    base.setAttribute("position", "0 0.09 0");
    base.setAttribute("material", "color:#0b0f14; metalness:0.75; roughness:0.35");
    el.appendChild(base);

    const baseGlow = document.createElement("a-ring");
    baseGlow.setAttribute("radius-inner", "3.55");
    baseGlow.setAttribute("radius-outer", "3.78");
    baseGlow.setAttribute("rotation", "-90 0 0");
    baseGlow.setAttribute("position", "0 0.11 0");
    baseGlow.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.35; transparent:true");
    el.appendChild(baseGlow);

    const pillar = document.createElement("a-cylinder");
    pillar.setAttribute("radius", "0.82");
    pillar.setAttribute("height", "1.05");
    pillar.setAttribute("position", "0 0.705 0");
    pillar.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
    el.appendChild(pillar);

    const pillarGlow = document.createElement("a-cylinder");
    pillarGlow.setAttribute("radius", "0.90");
    pillarGlow.setAttribute("height", "1.00");
    pillarGlow.setAttribute("position", "0 0.705 0");
    pillarGlow.setAttribute("material", "color:#0b0f14; emissive:#7b61ff; emissiveIntensity:0.35; opacity:0.35; transparent:true");
    el.appendChild(pillarGlow);

    // =========================
    // TABLE TOP (tight geometry)
    // =========================
    // One oval "core"
    const top = document.createElement("a-cylinder");
    top.setAttribute("radius", "1.12");
    top.setAttribute("height", "0.16");
    top.setAttribute("position", "0 1.26 0");
    top.setAttribute("scale", "3.05 1 1.72"); // tightened proportions
    top.setAttribute("material", "color:#101827; metalness:0.18; roughness:0.55");
    el.appendChild(top);

    // Leather ring sits perfectly around felt edge
    const leather = document.createElement("a-torus");
    leather.setAttribute("radius", "1.10");
    leather.setAttribute("radius-tubular", "0.078");
    leather.setAttribute("rotation", "-90 0 0");
    leather.setAttribute("position", "0 1.33 0");
    leather.setAttribute("scale", "3.02 1 1.70");
    leather.setAttribute("material", "color:#2a1b12; metalness:0.08; roughness:0.95");
    el.appendChild(leather);

    // Outer neon ring right next to leather (you asked for this)
    const leatherNeonOuter = document.createElement("a-torus");
    leatherNeonOuter.setAttribute("radius", "1.14");
    leatherNeonOuter.setAttribute("radius-tubular", "0.018");
    leatherNeonOuter.setAttribute("rotation", "-90 0 0");
    leatherNeonOuter.setAttribute("position", "0 1.345 0");
    leatherNeonOuter.setAttribute("scale", "3.06 1 1.74");
    leatherNeonOuter.setAttribute("material", "color:#0f1116; emissive:#2bd6ff; emissiveIntensity:2.6; opacity:0.9; transparent:true");
    el.appendChild(leatherNeonOuter);

    // Felt surface
    const felt = document.createElement("a-cylinder");
    felt.setAttribute("radius", "0.985");
    felt.setAttribute("height", "0.035");
    felt.setAttribute("position", "0 1.335 0");
    felt.setAttribute("scale", "2.78 1 1.50");
    felt.setAttribute("material", "color:#07111a; metalness:0.0; roughness:0.98");
    el.appendChild(felt);

    // =========================
    // PASS LINE (oval ring)
    // =========================
    // You said: leather oval, then INSIDE that a smaller neon oval = pass line
    const passLine = document.createElement("a-torus");
    passLine.setAttribute("radius", "0.90");
    passLine.setAttribute("radius-tubular", "0.014");
    passLine.setAttribute("rotation", "-90 0 0");
    passLine.setAttribute("position", "0 1.347 0");
    passLine.setAttribute("scale", "2.75 1 1.46"); // smaller than felt edge, inside leather
    passLine.setAttribute("material", "color:#0f1116; emissive:#00e5ff; emissiveIntensity:2.2; opacity:0.95; transparent:true");
    el.appendChild(passLine);

    // Inner oval pot zone
    const pot = document.createElement("a-cylinder");
    pot.setAttribute("radius", "0.40");
    pot.setAttribute("height", "0.016");
    pot.setAttribute("position", "0 1.346 0");
    pot.setAttribute("scale", "3.0 1 1.55");
    pot.setAttribute("material", "color:#0b1a25; emissive:#2bd6ff; emissiveIntensity:0.22; roughness:0.9; metalness:0.0");
    el.appendChild(pot);

    // Center logo plate (simple)
    const logo = document.createElement("a-plane");
    logo.setAttribute("width", "0.95");
    logo.setAttribute("height", "0.24");
    logo.setAttribute("rotation", "-90 0 0");
    logo.setAttribute("position", "0 1.348 0.35");
    logo.setAttribute("material", "color:#0b0f14; emissive:#7b61ff; emissiveIntensity:0.35; opacity:0.85; transparent:true");
    el.appendChild(logo);

    // Neon underglow under the table rim
    const rimGlow = document.createElement("a-ring");
    rimGlow.setAttribute("radius-inner", "1.02");
    rimGlow.setAttribute("radius-outer", "1.10");
    rimGlow.setAttribute("rotation", "-90 0 0");
    rimGlow.setAttribute("position", "0 1.25 0");
    rimGlow.setAttribute("scale", "3.00 1 1.70");
    rimGlow.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:0.9; opacity:0.18; transparent:true");
    el.appendChild(rimGlow);

    // =========================
    // SEATS (aligned, no sinking)
    // =========================
    // Chairs sit on pedestal (base height 0.18 => top at ~0.18)
    // We'll place chair base just above that.
    const seatY = 0.19;

    // Spacing tuned to new pedestal + table scale
    const seats = [
      // Ends (front/back)
      { x: 0.0,  z: 3.45, r: 180, id:"seat_front" }, // reserve this seat for player later if you want
      { x: 0.0,  z: -3.45, r: 0,   id:"seat_back"  },

      // Left side (2)
      { x: -3.05, z: 1.25, r: 90,  id:"seat_left_1" },
      { x: -3.05, z: -1.25, r: 90, id:"seat_left_2" },

      // Right side (2)
      { x: 3.05, z: 1.25, r: -90,  id:"seat_right_1" },
      { x: 3.05, z: -1.25, r: -90, id:"seat_right_2" },
    ];

    seats.forEach(s => {
      const chair = document.createElement("a-entity");
      chair.setAttribute("id", s.id);
      chair.setAttribute("position", `${s.x} ${seatY} ${s.z}`);
      chair.setAttribute("rotation", `0 ${s.r} 0`);
      chair.setAttribute("scarlett-chair", "");
      el.appendChild(chair);
    });

    if (window.hudLog) hudLog("Table v2 ✅ (bigger pedestal, correct pass-line oval, aligned seats, neon trim)");
  }
});

AFRAME.registerComponent("scarlett-chair", {
  init: function () {
    const el = this.el;

    const bodyMat = "color:#0e1016; metalness:0.65; roughness:0.32";
    const neonBlue = "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.6; opacity:0.95; transparent:true";
    const neonPurp = "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.4; opacity:0.9; transparent:true";

    // Base plate
    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "0.42");
    base.setAttribute("height", "0.10");
    base.setAttribute("position", "0 0.05 0");
    base.setAttribute("material", bodyMat);
    el.appendChild(base);

    // Base underglow ring
    const under = document.createElement("a-ring");
    under.setAttribute("radius-inner", "0.22");
    under.setAttribute("radius-outer", "0.40");
    under.setAttribute("rotation", "-90 0 0");
    under.setAttribute("position", "0 0.01 0");
    under.setAttribute("material", neonBlue + "; opacity:0.55");
    el.appendChild(under);

    // Stem
    const stem = document.createElement("a-cylinder");
    stem.setAttribute("radius", "0.06");
    stem.setAttribute("height", "0.58");
    stem.setAttribute("position", "0 0.34 0");
    stem.setAttribute("material", bodyMat);
    el.appendChild(stem);

    // Stem neon tube
    const stemGlow = document.createElement("a-cylinder");
    stemGlow.setAttribute("radius", "0.085");
    stemGlow.setAttribute("height", "0.52");
    stemGlow.setAttribute("position", "0 0.34 0");
    stemGlow.setAttribute("material", neonPurp + "; opacity:0.28");
    el.appendChild(stemGlow);

    // Seat
    const seat = document.createElement("a-box");
    seat.setAttribute("width", "0.74");
    seat.setAttribute("height", "0.11");
    seat.setAttribute("depth", "0.72");
    seat.setAttribute("position", "0 0.62 0");
    seat.setAttribute("material", bodyMat);
    el.appendChild(seat);

    // Back
    const back = document.createElement("a-box");
    back.setAttribute("width", "0.74");
    back.setAttribute("height", "0.92");
    back.setAttribute("depth", "0.12");
    back.setAttribute("position", "0 1.10 -0.30");
    back.setAttribute("material", bodyMat);
    el.appendChild(back);

    // Side neon accents
    const glowL = document.createElement("a-box");
    glowL.setAttribute("width", "0.06");
    glowL.setAttribute("height", "0.42");
    glowL.setAttribute("depth", "0.06");
    glowL.setAttribute("position", "-0.32 1.28 -0.18");
    glowL.setAttribute("material", neonPurp);
    el.appendChild(glowL);

    const glowR = document.createElement("a-box");
    glowR.setAttribute("width", "0.06");
    glowR.setAttribute("height", "0.42");
    glowR.setAttribute("depth", "0.06");
    glowR.setAttribute("position", "0.32 1.28 -0.18");
    glowR.setAttribute("material", neonPurp);
    el.appendChild(glowR);
  }
});
