AFRAME.registerComponent("scarlett-store-room", {
  init() {
    const room = this.el;

    const amb = document.createElement("a-entity");
    amb.setAttribute("light", "type: ambient; intensity: 1.3; color:#f0ffff");
    room.appendChild(amb);

    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    floor.setAttribute("radius", "24");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("material", "color:#070b10; roughness:1; metalness:0");
    room.appendChild(floor);

    // Walls
    const wall = document.createElement("a-cylinder");
    wall.setAttribute("radius", "24");
    wall.setAttribute("height", "10");
    wall.setAttribute("position", "0 5 0");
    wall.setAttribute("material", "color:#0a1422; roughness:0.95; metalness:0.05; side:double");
    room.appendChild(wall);

    // Balcony (square-ish platform)
    const balcony = document.createElement("a-box");
    balcony.setAttribute("width", "18");
    balcony.setAttribute("height", "0.35");
    balcony.setAttribute("depth", "18");
    balcony.setAttribute("position", "0 6.2 0");
    balcony.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.4");
    room.appendChild(balcony);

    // Rails
    const rail = document.createElement("a-torus");
    rail.setAttribute("radius","7.5");
    rail.setAttribute("radius-tubular","0.10");
    rail.setAttribute("rotation","-90 0 0");
    rail.setAttribute("position","0 6.5 0");
    rail.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.4; transparent:true");
    room.appendChild(rail);

    // Displays
    for (let i=0;i<6;i++){
      const x = -10 + i*4;
      const stand = document.createElement("a-box");
      stand.setAttribute("width","2.6");
      stand.setAttribute("height","1.3");
      stand.setAttribute("depth","1.2");
      stand.setAttribute("position", `${x} 0.65 -8`);
      stand.setAttribute("material","color:#0b0f14; metalness:0.7; roughness:0.35");
      room.appendChild(stand);

      const glow = document.createElement("a-plane");
      glow.setAttribute("width","2.6");
      glow.setAttribute("height","0.35");
      glow.setAttribute("position", `${x} 1.45 -8.61`);
      glow.setAttribute("material","color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.3; opacity:0.75; transparent:true");
      room.appendChild(glow);
    }

    const sign = document.createElement("a-text");
    sign.setAttribute("value","SCARLETT STORE");
    sign.setAttribute("align","center");
    sign.setAttribute("color","#9ff");
    sign.setAttribute("width","12");
    sign.setAttribute("position","-3.5 8.6 -10");
    room.appendChild(sign);

    hudLog("Store room ✅ (displays + balcony)");
  }
});
