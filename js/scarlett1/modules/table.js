AFRAME.registerComponent("scarlett-table", {
  init: function () {
    const el = this.el;

    // We build table using A-Frame primitives (Quest safe)
    // Pedestal base
    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "1.9");
    base.setAttribute("height", "0.35");
    base.setAttribute("position", "0 0.175 0");
    base.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
    el.appendChild(base);

    const pillar = document.createElement("a-cylinder");
    pillar.setAttribute("radius", "0.9");
    pillar.setAttribute("height", "0.85");
    pillar.setAttribute("position", "0 0.775 0");
    pillar.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
    el.appendChild(pillar);

    // Table top (oval illusion: scaled cylinder)
    const top = document.createElement("a-cylinder");
    top.setAttribute("radius", "1.05");
    top.setAttribute("height", "0.16");
    top.setAttribute("position", "0 1.18 0");
    top.setAttribute("scale", "2.8 1 1.55");
    top.setAttribute("material", "color:#121a24; metalness:0.25; roughness:0.55");
    el.appendChild(top);

    // Felt
    const felt = document.createElement("a-cylinder");
    felt.setAttribute("radius", "0.92");
    felt.setAttribute("height", "0.04");
    felt.setAttribute("position", "0 1.26 0");
    felt.setAttribute("scale", "2.55 1 1.35");
    felt.setAttribute("material", "color:#070b10; metalness:0.0; roughness:0.95");
    el.appendChild(felt);

    // Neon rail (thin ring)
    const rail = document.createElement("a-torus");
    rail.setAttribute("radius", "1.02");
    rail.setAttribute("radius-tubular", "0.018");
    rail.setAttribute("rotation", "-90 0 0");
    rail.setAttribute("position", "0 1.30 0");
    rail.setAttribute("scale", "2.78 1 1.53");
    rail.setAttribute("material", "color:#0f1116; emissive:#2bd6ff; emissiveIntensity:2.2");
    el.appendChild(rail);

    // Pass line
    const pass = document.createElement("a-plane");
    pass.setAttribute("width", "2.3");
    pass.setAttribute("height", "0.22");
    pass.setAttribute("rotation", "-90 0 0");
    pass.setAttribute("position", "0 1.28 1.05");
    pass.setAttribute("material", "color:#00e5ff; opacity:0.75; transparent:true");
    el.appendChild(pass);

    // Seats (6)
    const seats = [
      { x:-1.2, z: 2.4, r: 180 },
      { x: 0.0, z: 2.4, r: 180 },
      { x: 1.2, z:  2.4, r: 180 },
      { x:-1.2, z:-2.4, r:   0 },
      { x: 0.0, z:-2.4, r:   0 },
      { x: 1.2, z:-2.4, r:   0 },
    ];

    seats.forEach(s => {
      const chair = document.createElement("a-entity");
      chair.setAttribute("position", `${s.x} 0 ${s.z}`);
      chair.setAttribute("rotation", `0 ${s.r} 0`);
      chair.setAttribute("scarlett-chair", "");
      el.appendChild(chair);
    });

    hudLog("Table + 6 seats built ✅");
  }
});

AFRAME.registerComponent("scarlett-chair", {
  init: function () {
    const el = this.el;

    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "0.34");
    base.setAttribute("height", "0.12");
    base.setAttribute("position", "0 0.06 0");
    base.setAttribute("material", "color:#0e1016; metalness:0.6; roughness:0.35");
    el.appendChild(base);

    const stem = document.createElement("a-cylinder");
    stem.setAttribute("radius", "0.06");
    stem.setAttribute("height", "0.48");
    stem.setAttribute("position", "0 0.30 0");
    stem.setAttribute("material", "color:#0e1016; metalness:0.6; roughness:0.35");
    el.appendChild(stem);

    const seat = document.createElement("a-box");
    seat.setAttribute("width", "0.62");
    seat.setAttribute("height", "0.10");
    seat.setAttribute("depth", "0.62");
    seat.setAttribute("position", "0 0.52 0");
    seat.setAttribute("material", "color:#0e1016; metalness:0.55; roughness:0.35");
    el.appendChild(seat);

    const back = document.createElement("a-box");
    back.setAttribute("width", "0.62");
    back.setAttribute("height", "0.78");
    back.setAttribute("depth", "0.12");
    back.setAttribute("position", "0 0.95 -0.25");
    back.setAttribute("material", "color:#0e1016; metalness:0.55; roughness:0.35");
    el.appendChild(back);

    const glowL = document.createElement("a-box");
    glowL.setAttribute("width", "0.05");
    glowL.setAttribute("height", "0.28");
    glowL.setAttribute("depth", "0.05");
    glowL.setAttribute("position", "-0.26 1.20 -0.18");
    glowL.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.5");
    el.appendChild(glowL);

    const glowR = glowL.cloneNode();
    glowR.setAttribute("position", "0.26 1.20 -0.18");
    el.appendChild(glowR);
  }
});
