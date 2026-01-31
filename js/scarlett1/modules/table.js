AFRAME.registerComponent("scarlett-table", {
  init: function () {
    const el = this.el;

    // --- PEDESTAL (thinner, wider, chairs sit on it) ---
    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "3.25");      // wider
    base.setAttribute("height", "0.20");      // thinner
    base.setAttribute("position", "0 0.10 0");
    base.setAttribute("material", "color:#0b0f14; metalness:0.75; roughness:0.35");
    el.appendChild(base);

    const pillar = document.createElement("a-cylinder");
    pillar.setAttribute("radius", "0.75");
    pillar.setAttribute("height", "0.95");
    pillar.setAttribute("position", "0 0.675 0");
    pillar.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
    el.appendChild(pillar);

    // --- TABLE TOP (elongated oval) ---
    const top = document.createElement("a-cylinder");
    top.setAttribute("radius", "1.08");
    top.setAttribute("height", "0.18");
    top.setAttribute("position", "0 1.22 0");
    top.setAttribute("scale", "3.15 1 1.75");
    top.setAttribute("material", "color:#101827; metalness:0.22; roughness:0.55");
    el.appendChild(top);

    // --- LEATHER TRIM (dark brown-ish) ---
    const leather = document.createElement("a-torus");
    leather.setAttribute("radius", "1.06");
    leather.setAttribute("radius-tubular", "0.075");
    leather.setAttribute("rotation", "-90 0 0");
    leather.setAttribute("position", "0 1.30 0");
    leather.setAttribute("scale", "3.10 1 1.70");
    leather.setAttribute("material", "color:#2a1b12; metalness:0.12; roughness:0.92");
    el.appendChild(leather);

    // --- FELT (slightly brighter + subtle tint) ---
    const felt = document.createElement("a-cylinder");
    felt.setAttribute("radius", "0.96");
    felt.setAttribute("height", "0.05");
    felt.setAttribute("position", "0 1.30 0");
    felt.setAttribute("scale", "2.85 1 1.55");
    felt.setAttribute("material", "color:#07111a; metalness:0.0; roughness:0.95");
    el.appendChild(felt);

    // --- INNER OVAL (main pot area) ---
    const pot = document.createElement("a-cylinder");
    pot.setAttribute("radius", "0.40");
    pot.setAttribute("height", "0.02");
    pot.setAttribute("position", "0 1.33 0");
    pot.setAttribute("scale", "3.0 1 1.55");
    pot.setAttribute("material", "color:#0b1a25; emissive:#2bd6ff; emissiveIntensity:0.25; roughness:0.9; metalness:0.0");
    el.appendChild(pot);

    // --- NEON RAIL ---
    const rail = document.createElement("a-torus");
    rail.setAttribute("radius", "1.08");
    rail.setAttribute("radius-tubular", "0.020");
    rail.setAttribute("rotation", "-90 0 0");
    rail.setAttribute("position", "0 1.35 0");
    rail.setAttribute("scale", "3.20 1 1.78");
    rail.setAttribute("material", "color:#0f1116; emissive:#2bd6ff; emissiveIntensity:2.4; opacity:0.95; transparent:true");
    el.appendChild(rail);

    // --- PASS LINES (poker “guides”) ---
    // front/back pass lines
    const pass1 = mkLine("0 1.335 1.12", "2.1", "0.08");
    const pass2 = mkLine("0 1.335 -1.12", "2.1", "0.08");
    // left/right pass lines
    const pass3 = mkLine("1.75 1.335 0", "0.08", "2.0");
    const pass4 = mkLine("-1.75 1.335 0", "0.08", "2.0");
    el.appendChild(pass1); el.appendChild(pass2); el.appendChild(pass3); el.appendChild(pass4);

    // center logo plate (simple neon badge)
    const logo = document.createElement("a-plane");
    logo.setAttribute("width", "0.9");
    logo.setAttribute("height", "0.22");
    logo.setAttribute("rotation", "-90 0 0");
    logo.setAttribute("position", "0 1.337 0.35");
    logo.setAttribute("material", "color:#0b0f14; emissive:#7b61ff; emissiveIntensity:0.35; opacity:0.85; transparent:true");
    el.appendChild(logo);

    // --- SEATS: 6-man layout (1 at each end + 2 each side) ---
    // Lift chairs onto the pedestal “platform”
    const seatY = 0.20; // sits visually on base thickness

    const seats = [
      // Ends (front/back center)
      { x: 0.0,  z: 3.05, r: 180 },
      { x: 0.0,  z: -3.05, r: 0 },

      // Left side (2)
      { x: -2.55, z: 1.10, r: 90 },
      { x: -2.55, z: -1.10, r: 90 },

      // Right side (2)
      { x: 2.55, z: 1.10, r: -90 },
      { x: 2.55, z: -1.10, r: -90 },
    ];

    seats.forEach(s => {
      const chair = document.createElement("a-entity");
      chair.setAttribute("position", `${s.x} ${seatY} ${s.z}`);
      chair.setAttribute("rotation", `0 ${s.r} 0`);
      chair.setAttribute("scarlett-chair", "");
      el.appendChild(chair);
    });

    if (window.hudLog) hudLog("Table upgraded ✅ (leather + neon + pot oval + pass lines + spaced 6 seats)");

    function mkLine(pos, w, h) {
      const p = document.createElement("a-plane");
      p.setAttribute("width", w);
      p.setAttribute("height", h);
      p.setAttribute("rotation", "-90 0 0");
      p.setAttribute("position", pos);
      p.setAttribute("material", "color:#00e5ff; opacity:0.65; transparent:true");
      return p;
    }
  }
});

AFRAME.registerComponent("scarlett-chair", {
  init: function () {
    const el = this.el;

    const bodyMat = "color:#0e1016; metalness:0.6; roughness:0.35";
    const neonMat = "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.8; opacity:0.95; transparent:true";

    // base
    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "0.38");
    base.setAttribute("height", "0.12");
    base.setAttribute("position", "0 0.06 0");
    base.setAttribute("material", bodyMat);
    el.appendChild(base);

    // stem
    const stem = document.createElement("a-cylinder");
    stem.setAttribute("radius", "0.06");
    stem.setAttribute("height", "0.52");
    stem.setAttribute("position", "0 0.32 0");
    stem.setAttribute("material", bodyMat);
    el.appendChild(stem);

    // seat
    const seat = document.createElement("a-box");
    seat.setAttribute("width", "0.70");
    seat.setAttribute("height", "0.11");
    seat.setAttribute("depth", "0.70");
    seat.setAttribute("position", "0 0.56 0");
    seat.setAttribute("material", bodyMat);
    el.appendChild(seat);

    // back
    const back = document.createElement("a-box");
    back.setAttribute("width", "0.70");
    back.setAttribute("height", "0.86");
    back.setAttribute("depth", "0.12");
    back.setAttribute("position", "0 1.02 -0.28");
    back.setAttribute("material", bodyMat);
    el.appendChild(back);

    // more neon accents (left/right + underglow)
    const glowL = document.createElement("a-box");
    glowL.setAttribute("width", "0.06");
    glowL.setAttribute("height", "0.34");
    glowL.setAttribute("depth", "0.06");
    glowL.setAttribute("position", "-0.30 1.25 -0.18");
    glowL.setAttribute("material", neonMat);
    el.appendChild(glowL);

    const glowR = document.createElement("a-box");
    glowR.setAttribute("width", "0.06");
    glowR.setAttribute("height", "0.34");
    glowR.setAttribute("depth", "0.06");
    glowR.setAttribute("position", "0.30 1.25 -0.18");
    glowR.setAttribute("material", neonMat);
    el.appendChild(glowR);

    const under = document.createElement("a-ring");
    under.setAttribute("radius-inner", "0.20");
    under.setAttribute("radius-outer", "0.35");
    under.setAttribute("rotation", "-90 0 0");
    under.setAttribute("position", "0 0.02 0");
    under.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.55; transparent:true");
    el.appendChild(under);
  }
});
