// /js/scarlett1/modules/store.js
AFRAME.registerComponent("scarlett-store-room", {
  init() {
    const el = this.el;

    const floor = document.createElement("a-plane");
    floor.classList.add("teleportable");
    floor.setAttribute("width", "30");
    floor.setAttribute("height", "30");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("material", "color:#070a12; roughness:1; metalness:0");
    el.appendChild(floor);

    const wall = document.createElement("a-box");
    wall.setAttribute("width", "30");
    wall.setAttribute("height", "10");
    wall.setAttribute("depth", "30");
    wall.setAttribute("position", "0 5 0");
    wall.setAttribute("material", "color:#0b0f14; side:back; roughness:0.95; metalness:0.05");
    el.appendChild(wall);

    const sign = document.createElement("a-text");
    sign.setAttribute("value", "STORE");
    sign.setAttribute("align", "center");
    sign.setAttribute("color", "#9ff");
    sign.setAttribute("width", "12");
    sign.setAttribute("position", "0 8.4 -14.2");
    el.appendChild(sign);

    // Shelves left/right
    for (let i=0; i<5; i++) {
      const z = -10 + i*5;
      makeShelf(el, "-12 1.0 "+z, "#2bd6ff");
      makeShelf(el, "12 1.0 "+z, "#7b61ff");
    }

    // Neon frame
    const frame = document.createElement("a-box");
    frame.setAttribute("width","26");
    frame.setAttribute("height","9");
    frame.setAttribute("depth","0.1");
    frame.setAttribute("position","0 4.5 -14.8");
    frame.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.0; opacity:0.18; transparent:true");
    el.appendChild(frame);

    // Back to lobby pad
    const back = document.createElement("a-ring");
    back.classList.add("clickable","teleportable");
    back.setAttribute("radius-inner","1.1");
    back.setAttribute("radius-outer","1.55");
    back.setAttribute("rotation","-90 0 0");
    back.setAttribute("position","0 0.03 13.5");
    back.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.7; transparent:true");
    el.appendChild(back);

    const t = document.createElement("a-text");
    t.setAttribute("value","BACK TO LOBBY");
    t.setAttribute("align","center");
    t.setAttribute("color","#e8faff");
    t.setAttribute("width","8");
    t.setAttribute("position","0 1.1 13.5");
    el.appendChild(t);

    back.addEventListener("click", () => window.SCARLETT && window.SCARLETT.setRoom && window.SCARLETT.setRoom("room_lobby"));

    if (window.hudLog) hudLog("Store room created ✅");
  }
});

function makeShelf(root, pos, neon) {
  const g = document.createElement("a-entity");
  g.setAttribute("position", pos);
  root.appendChild(g);

  const shelf = document.createElement("a-box");
  shelf.setAttribute("width","3.2");
  shelf.setAttribute("height","2.2");
  shelf.setAttribute("depth","0.8");
  shelf.setAttribute("position","0 1.1 0");
  shelf.setAttribute("material","color:#101827; roughness:0.85; metalness:0.1");
  g.appendChild(shelf);

  const glow = document.createElement("a-box");
  glow.setAttribute("width","3.3");
  glow.setAttribute("height","2.3");
  glow.setAttribute("depth","0.06");
  glow.setAttribute("position","0 1.1 0.43");
  glow.setAttribute("material",`color:${neon}; emissive:${neon}; emissiveIntensity:0.9; opacity:0.18; transparent:true`);
  g.appendChild(glow);

  // item pedestals
  for (let i=0; i<3; i++) {
    const p = document.createElement("a-cylinder");
    p.setAttribute("radius","0.25");
    p.setAttribute("height","0.08");
    p.setAttribute("position", `${-0.9 + i*0.9} 0.12 0.1`);
    p.setAttribute("material",`color:#0b0f14; emissive:${neon}; emissiveIntensity:0.2; opacity:0.95; transparent:true`);
    g.appendChild(p);
  }

  const light = document.createElement("a-light");
  light.setAttribute("type","point");
  light.setAttribute("intensity","0.7");
  light.setAttribute("distance","16");
  light.setAttribute("color", neon);
  light.setAttribute("position","0 2.4 0.7");
  g.appendChild(light);
}
