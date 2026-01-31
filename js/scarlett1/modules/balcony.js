// /js/scarlett1/modules/balcony.js
AFRAME.registerComponent("scarlett-balcony-room", {
  init() {
    const el = this.el;

    // Elevated platform
    const platform = document.createElement("a-cylinder");
    platform.classList.add("teleportable");
    platform.setAttribute("radius", "14");
    platform.setAttribute("height", "0.3");
    platform.setAttribute("position", "0 6 0");
    platform.setAttribute("material", "color:#0b0f14; roughness:0.85; metalness:0.15");
    el.appendChild(platform);

    const deck = document.createElement("a-circle");
    deck.classList.add("teleportable");
    deck.setAttribute("radius", "13.2");
    deck.setAttribute("rotation", "-90 0 0");
    deck.setAttribute("position", "0 6.16 0");
    deck.setAttribute("material", "color:#070a12; roughness:1; metalness:0");
    el.appendChild(deck);

    // Rail
    const rail = document.createElement("a-torus");
    rail.setAttribute("radius", "13.2");
    rail.setAttribute("radius-tubular", "0.08");
    rail.setAttribute("rotation", "-90 0 0");
    rail.setAttribute("position", "0 7.0 0");
    rail.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.6; opacity:0.55; transparent:true");
    el.appendChild(rail);

    // Lights
    for (let i=0; i<8; i++) {
      const a = (i/8) * Math.PI*2;
      const x = Math.cos(a) * 10.5;
      const z = Math.sin(a) * 10.5;

      const p = document.createElement("a-light");
      p.setAttribute("type","point");
      p.setAttribute("intensity","0.95");
      p.setAttribute("distance","24");
      p.setAttribute("decay","1.4");
      p.setAttribute("color", i%2===0 ? "#2bd6ff" : "#7b61ff");
      p.setAttribute("position", `${x} 7.4 ${z}`);
      el.appendChild(p);
    }

    const label = document.createElement("a-text");
    label.setAttribute("value","BALCONY VIEW");
    label.setAttribute("align","center");
    label.setAttribute("color","#9ff");
    label.setAttribute("width","10");
    label.setAttribute("position","0 8.4 -6");
    el.appendChild(label);

    // Back to lobby
    const back = document.createElement("a-ring");
    back.classList.add("clickable","teleportable");
    back.setAttribute("radius-inner","1.1");
    back.setAttribute("radius-outer","1.55");
    back.setAttribute("rotation","-90 0 0");
    back.setAttribute("position","0 6.2 11.5");
    back.setAttribute("material","color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.2; opacity:0.7; transparent:true");
    el.appendChild(back);

    const t = document.createElement("a-text");
    t.setAttribute("value","BACK TO LOBBY");
    t.setAttribute("align","center");
    t.setAttribute("color","#e8faff");
    t.setAttribute("width","8");
    t.setAttribute("position","0 7.2 11.5");
    el.appendChild(t);

    back.addEventListener("click", () => window.SCARLETT && window.SCARLETT.setRoom && window.SCARLETT.setRoom("room_lobby"));

    if (window.hudLog) hudLog("Balcony room created ✅");
  }
});
