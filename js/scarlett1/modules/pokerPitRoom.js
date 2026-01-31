AFRAME.registerComponent("scarlett-pokerpit-room", {
  init() {
    const room = this.el;

    // Lighting
    const amb = document.createElement("a-entity");
    amb.setAttribute("light", "type: ambient; intensity: 1.2; color:#e8ffff");
    room.appendChild(amb);

    const key = document.createElement("a-entity");
    key.setAttribute("light", "type: directional; intensity: 1.0; color:#ffffff");
    key.setAttribute("position", "3 7 2");
    room.appendChild(key);

    // Room shell
    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    floor.setAttribute("radius", "22");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("position", "0 0 0");
    floor.setAttribute("material", "color:#070b10; roughness:1; metalness:0");
    room.appendChild(floor);

    const wall = document.createElement("a-cylinder");
    wall.setAttribute("radius", "22");
    wall.setAttribute("height", "9");
    wall.setAttribute("position", "0 4.5 0");
    wall.setAttribute("material", "color:#0b1220; roughness:0.95; metalness:0.05; side:double");
    room.appendChild(wall);

    // 6-seat oval table (simple now; you can paste your scarlett-table component later)
    const pedestal = document.createElement("a-cylinder");
    pedestal.setAttribute("radius", "4.2");
    pedestal.setAttribute("height", "0.25");
    pedestal.setAttribute("position", "0 0.12 0");
    pedestal.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
    room.appendChild(pedestal);

    const top = document.createElement("a-cylinder");
    top.setAttribute("radius", "1.1");
    top.setAttribute("height", "0.20");
    top.setAttribute("scale", "3.3 1 1.85");
    top.setAttribute("position", "0 1.25 0");
    top.setAttribute("material", "color:#101827; roughness:0.7; metalness:0.1");
    room.appendChild(top);

    const rail = document.createElement("a-torus");
    rail.setAttribute("radius", "1.08");
    rail.setAttribute("radius-tubular", "0.03");
    rail.setAttribute("rotation", "-90 0 0");
    rail.setAttribute("scale", "3.35 1 1.90");
    rail.setAttribute("position", "0 1.33 0");
    rail.setAttribute("material", "color:#0f1116; emissive:#2bd6ff; emissiveIntensity:2.2; opacity:0.85; transparent:true");
    room.appendChild(rail);

    // 6 chairs spaced correctly
    const seats = [
      {x: 0.0,  z: 4.3,  ry: 180},
      {x: 0.0,  z: -4.3, ry: 0},
      {x: -3.6, z: 1.5,  ry: 90},
      {x: -3.6, z: -1.5, ry: 90},
      {x: 3.6,  z: 1.5,  ry: -90},
      {x: 3.6,  z: -1.5, ry: -90},
    ];

    seats.forEach(s => {
      const c = document.createElement("a-box");
      c.setAttribute("width","0.8");
      c.setAttribute("height","0.9");
      c.setAttribute("depth","0.8");
      c.setAttribute("position", `${s.x} 0.45 ${s.z}`);
      c.setAttribute("rotation", `0 ${s.ry} 0`);
      c.setAttribute("material","color:#0e1016; metalness:0.5; roughness:0.35");
      room.appendChild(c);

      const glow = document.createElement("a-ring");
      glow.setAttribute("radius-inner","0.28");
      glow.setAttribute("radius-outer","0.45");
      glow.setAttribute("rotation","-90 0 0");
      glow.setAttribute("position", `${s.x} 0.02 ${s.z}`);
      glow.setAttribute("material","color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.4; opacity:0.55; transparent:true");
      room.appendChild(glow);
    });

    hudLog("Poker pit room ✅ (6-seat oval table)");
  }
});
