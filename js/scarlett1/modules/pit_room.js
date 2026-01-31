// /js/scarlett1/modules/pit_room.js
AFRAME.registerComponent("scarlett-poker-room", {
  init() {
    const el = this.el;

    // Room shell
    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    floor.setAttribute("radius", "18");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("material", "color:#04060b; roughness:1; metalness:0");
    el.appendChild(floor);

    const wall = document.createElement("a-cylinder");
    wall.setAttribute("radius", "18");
    wall.setAttribute("height", "10");
    wall.setAttribute("position", "0 5 0");
    wall.setAttribute("material", "color:#0b0f14; roughness:0.95; metalness:0.05; side:double");
    el.appendChild(wall);

    // Neon ceiling ring
    const ceil = document.createElement("a-ring");
    ceil.setAttribute("radius-inner", "6");
    ceil.setAttribute("radius-outer", "6.25");
    ceil.setAttribute("rotation", "90 0 0");
    ceil.setAttribute("position", "0 9.4 0");
    ceil.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.8; opacity:0.65; transparent:true");
    el.appendChild(ceil);

    // Table bundle
    const table = document.createElement("a-entity");
    table.setAttribute("position", "0 0 0");
    table.setAttribute("scarlett-table", "");
    el.appendChild(table);

    // Bots (5)
    const bots = document.createElement("a-entity");
    bots.setAttribute("position", "0 0 0");
    bots.setAttribute("scarlett-bots", "");
    el.appendChild(bots);

    // Door back to lobby
    const back = document.createElement("a-ring");
    back.classList.add("clickable","teleportable");
    back.setAttribute("radius-inner", "1.1");
    back.setAttribute("radius-outer", "1.55");
    back.setAttribute("rotation", "-90 0 0");
    back.setAttribute("position", "0 0.03 15.2");
    back.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.7; transparent:true");
    el.appendChild(back);

    const t = document.createElement("a-text");
    t.setAttribute("value", "BACK TO LOBBY");
    t.setAttribute("align", "center");
    t.setAttribute("color", "#e8faff");
    t.setAttribute("width", "8");
    t.setAttribute("position", "0 1.1 15.2");
    el.appendChild(t);

    back.addEventListener("click", () => window.SCARLETT && window.SCARLETT.setRoom && window.SCARLETT.setRoom("room_lobby"));

    // Ninja displays (using your uploaded files if present)
    makePedestal(el, "-12 0 -4", "combat_ninja", "./assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb", "#2bd6ff");
    makePedestal(el, "-12 0 -8", "ninja", "./assets/avatars/ninja.glb", "#7b61ff");

    // Seated avatars (male/female) for demo
    makeSeated(el, "2.55 0.2 1.10", "0 -90 0", "./assets/avatars/male.glb");
    makeSeated(el, "-2.55 0.2 -1.10", "0 90 0", "./assets/avatars/female.glb");

    // One walking avatar (simple loop)
    makeWalker(el, "9 0 0", "./assets/avatars/futuristic_apocalypse_female_cargo_pants.glb");

    if (window.hudLog) hudLog("Poker room created ✅ (oval 6-player)");
  }
});

function makePedestal(root, pos, label, glb, neon) {
  const g = document.createElement("a-entity");
  g.setAttribute("position", pos);
  root.appendChild(g);

  const ped = document.createElement("a-cylinder");
  ped.setAttribute("radius", "0.9");
  ped.setAttribute("height", "0.25");
  ped.setAttribute("position", "0 0.125 0");
  ped.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
  g.appendChild(ped);

  const ring = document.createElement("a-ring");
  ring.setAttribute("radius-inner", "0.55");
  ring.setAttribute("radius-outer", "0.86");
  ring.setAttribute("rotation", "-90 0 0");
  ring.setAttribute("position", "0 0.13 0");
  ring.setAttribute("material", `color:${neon}; emissive:${neon}; emissiveIntensity:1.4; opacity:0.55; transparent:true`);
  g.appendChild(ring);

  const text = document.createElement("a-text");
  text.setAttribute("value", label.toUpperCase());
  text.setAttribute("align", "center");
  text.setAttribute("color", "#9ff");
  text.setAttribute("width", "5");
  text.setAttribute("position", "0 1.9 0");
  g.appendChild(text);

  const model = document.createElement("a-entity");
  model.setAttribute("gltf-model", glb);
  model.setAttribute("position", "0 0.25 0");
  model.setAttribute("rotation", "0 180 0");
  model.setAttribute("scale", "1.2 1.2 1.2");
  model.addEventListener("model-error", () => {
    // placeholder
    const ph = document.createElement("a-cone");
    ph.setAttribute("radius-bottom","0.35");
    ph.setAttribute("radius-top","0.06");
    ph.setAttribute("height","1.6");
    ph.setAttribute("position","0 0.9 0");
    ph.setAttribute("material", `color:#0b0f14; emissive:${neon}; emissiveIntensity:0.35; roughness:0.8`);
    g.appendChild(ph);
  });
  g.appendChild(model);
}

function makeSeated(root, pos, rot, glb) {
  const a = document.createElement("a-entity");
  a.setAttribute("position", pos);
  a.setAttribute("rotation", rot);
  a.setAttribute("gltf-model", glb);
  a.setAttribute("scale", "1.0 1.0 1.0");
  a.setAttribute("position", pos);
  a.addEventListener("model-error", () => a.setAttribute("visible","false"));
  root.appendChild(a);
}

function makeWalker(root, pos, glb) {
  const a = document.createElement("a-entity");
  a.setAttribute("position", pos);
  a.setAttribute("gltf-model", glb);
  a.setAttribute("scale", "1.0 1.0 1.0");
  a.setAttribute("animation", "property: position; dir: alternate; dur: 6000; easing: linear; loop: true; to: -9 0 0");
  a.addEventListener("model-error", () => a.setAttribute("visible","false"));
  root.appendChild(a);
}
