AFRAME.registerComponent("scarlett-table", {
  init: function () {
    const el = this.el;

    // --- PEDESTAL ---
    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "3.45");
    base.setAttribute("height", "0.20");
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
    top.setAttribute("scale", "3.25 1 1.85");
    top.setAttribute("material", "color:#101827; metalness:0.22; roughness:0.55");
    el.appendChild(top);

    // --- LEATHER TRIM ---
    const leather = document.createElement("a-torus");
    leather.setAttribute("radius", "1.06");
    leather.setAttribute("radius-tubular", "0.075");
    leather.setAttribute("rotation", "-90 0 0");
    leather.setAttribute("position", "0 1.30 0");
    leather.setAttribute("scale", "3.20 1 1.80");
    leather.setAttribute("material", "color:#2a1b12; metalness:0.12; roughness:0.92");
    el.appendChild(leather);

    // --- FELT ---
    const felt = document.createElement("a-cylinder");
    felt.setAttribute("radius", "0.96");
    felt.setAttribute("height", "0.05");
    felt.setAttribute("position", "0 1.30 0");
    felt.setAttribute("scale", "2.95 1 1.62");
    felt.setAttribute("material", "color:#07111a; metalness:0.0; roughness:0.95");
    el.appendChild(felt);

    // --- INNER POT OVAL ---
    const pot = document.createElement("a-cylinder");
    pot.setAttribute("radius", "0.40");
    pot.setAttribute("height", "0.02");
    pot.setAttribute("position", "0 1.33 0");
    pot.setAttribute("scale", "3.1 1 1.6");
    pot.setAttribute("material", "color:#0b1a25; emissive:#2bd6ff; emissiveIntensity:0.25; roughness:0.9; metalness:0.0");
    el.appendChild(pot);

    // --- NEON PASS LINE (oval) ---
    const pass = document.createElement("a-torus");
    pass.setAttribute("radius", "0.98");
    pass.setAttribute("radius-tubular", "0.018");
    pass.setAttribute("rotation", "-90 0 0");
    pass.setAttribute("position", "0 1.345 0");
    pass.setAttribute("scale", "3.05 1 1.68");
    pass.setAttribute("material", "color:#0f1116; emissive:#00e5ff; emissiveIntensity:2.2; opacity:0.95; transparent:true");
    el.appendChild(pass);

    // --- SEATS (6 layout: 1 front/back + 2 each side) ---
    const seatY = 0.20;
    const seats = [
      { id:"seat_front", x: 0.0,  z: 3.30, r: 180 },
      { id:"seat_back",  x: 0.0,  z: -3.30, r: 0 },
      { id:"seat_l1",    x: -2.85, z: 1.25, r: 90 },
      { id:"seat_l2",    x: -2.85, z: -1.25, r: 90 },
      { id:"seat_r1",    x: 2.85, z: 1.25, r: -90 },
      { id:"seat_r2",    x: 2.85, z: -1.25, r: -90 },
    ];

    seats.forEach(s => {
      const chair = document.createElement("a-entity");
      chair.setAttribute("id", s.id);
      chair.setAttribute("position", `${s.x} ${seatY} ${s.z}`);
      chair.setAttribute("rotation", `0 ${s.r} 0`);
      chair.setAttribute("scarlett-chair", "");
      el.appendChild(chair);
    });

    if (window.hudLog) hudLog("6-seat table built ✅");
  }
});

AFRAME.registerComponent("scarlett-chair", {
  init: function () {
    const el = this.el;
    const bodyMat = "color:#0e1016; metalness:0.6; roughness:0.35";
    const neonMat = "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.9; opacity:0.95; transparent:true";

    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "0.38");
    base.setAttribute("height", "0.12");
    base.setAttribute("position", "0 0.06 0");
    base.setAttribute("material", bodyMat);
    el.appendChild(base);

    const stem = document.createElement("a-cylinder");
    stem.setAttribute("radius", "0.06");
    stem.setAttribute("height", "0.55");
    stem.setAttribute("position", "0 0.33 0");
    stem.setAttribute("material", bodyMat);
    el.appendChild(stem);

    const seat = document.createElement("a-box");
    seat.setAttribute("width", "0.72");
    seat.setAttribute("height", "0.11");
    seat.setAttribute("depth", "0.72");
    seat.setAttribute("position", "0 0.58 0");
    seat.setAttribute("material", bodyMat);
    el.appendChild(seat);

    const back = document.createElement("a-box");
    back.setAttribute("width", "0.72");
    back.setAttribute("height", "0.90");
    back.setAttribute("depth", "0.12");
    back.setAttribute("position", "0 1.05 -0.30");
    back.setAttribute("material", bodyMat);
    el.appendChild(back);

    // neon underglow
    const under = document.createElement("a-ring");
    under.setAttribute("radius-inner", "0.20");
    under.setAttribute("radius-outer", "0.35");
    under.setAttribute("rotation", "-90 0 0");
    under.setAttribute("position", "0 0.02 0");
    under.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.55; transparent:true");
    el.appendChild(under);

    // side neon struts
    const glowL = document.createElement("a-box");
    glowL.setAttribute("width", "0.06");
    glowL.setAttribute("height", "0.36");
    glowL.setAttribute("depth", "0.06");
    glowL.setAttribute("position", "-0.31 1.27 -0.18");
    glowL.setAttribute("material", neonMat);
    el.appendChild(glowL);

    const glowR = document.createElement("a-box");
    glowR.setAttribute("width", "0.06");
    glowR.setAttribute("height", "0.36");
    glowR.setAttribute("depth", "0.06");
    glowR.setAttribute("position", "0.31 1.27 -0.18");
    glowR.setAttribute("material", neonMat);
    el.appendChild(glowR);
  }
});
