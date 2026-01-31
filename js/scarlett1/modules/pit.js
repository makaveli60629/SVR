AFRAME.registerComponent("scarlett-pit", {
  init: function () {
    const el = this.el;

    // Main table bundle
    const tableBundle = document.createElement("a-entity");
    tableBundle.setAttribute("id", "mainTableBundle");
    tableBundle.setAttribute("position", "0 0 0");
    tableBundle.setAttribute("scarlett-table", "");
    el.appendChild(tableBundle);

    // Bots (5 only, 1 seat reserved)
    const bots = document.createElement("a-entity");
    bots.setAttribute("id", "botsRoot");
    bots.setAttribute("scarlett-bots", "");
    el.appendChild(bots);

    // Reserved seat marker (front seat)
    const marker = document.createElement("a-ring");
    marker.setAttribute("id", "playerSeatMarker");
    marker.setAttribute("radius-inner", "0.22");
    marker.setAttribute("radius-outer", "0.36");
    marker.setAttribute("rotation", "-90 0 0");
    marker.setAttribute(
      "material",
      "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.0; opacity:0.65; transparent:true"
    );
    marker.classList.add("seatSpot");
    el.appendChild(marker);

    // Place marker at seat_front once available
    setTimeout(() => {
      const seat = document.getElementById("seat_front");
      if (!seat) return;
      const p = seat.object3D.position;
      marker.setAttribute("position", `${p.x} 0.03 ${p.z}`);
      if (window.hudLog) hudLog("Your seat reserved ✅ (front seat)");
    }, 250);

    // Jumbotron entity (attached here so it definitely exists in pit mode)
    const jumbo = document.createElement("a-entity");
    jumbo.setAttribute("id", "scarlettJumboRoot");
    jumbo.setAttribute("scarlett-jumbotron", "playlist:https://raw.githubusercontent.com/jromero88/iptv/master/channels/us.m3u; preferName:CBS");
    el.appendChild(jumbo);

    // Ninja display pedestals (tries GLBs if present, otherwise shows “statues”)
    const display = document.createElement("a-entity");
    display.setAttribute("id", "ninjaDisplayRoot");
    display.setAttribute("position", "0 0 0");
    el.appendChild(display);

    // Two pedestals near the table
    makeNinjaPedestal(display, { x: -6.8, z: 1.2, r: 55 }, [
      "./assets/combat_ninja.glb",
      "./assets/CombatNinja.glb",
      "./assets/ninja_combat.glb",
      "./assets/ninja.glb"
    ], "Combat Ninja");

    makeNinjaPedestal(display, { x: -6.8, z: -1.8, r: 55 }, [
      "./assets/ninja.glb",
      "./assets/Ninja.glb",
      "./assets/stealth_ninja.glb",
      "./assets/fighter_ninja.glb"
    ], "Ninja");

    if (window.hudLog) hudLog("Tables built ✅ | Bots seated ✅ | Ninja displays ✅ | Jumbotron attached ✅");
  }
});

// Creates a pedestal + attempts to load one of the GLBs in order.
// If none load, shows a neon “statue” placeholder.
function makeNinjaPedestal(root, pose, candidateUrls, label) {
  const group = document.createElement("a-entity");
  group.setAttribute("position", `${pose.x} 0 ${pose.z}`);
  group.setAttribute("rotation", `0 ${pose.r} 0`);
  root.appendChild(group);

  // pedestal
  const ped = document.createElement("a-cylinder");
  ped.setAttribute("radius", "0.85");
  ped.setAttribute("height", "0.22");
  ped.setAttribute("position", "0 0.11 0");
  ped.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
  group.appendChild(ped);

  const glow = document.createElement("a-ring");
  glow.setAttribute("radius-inner", "0.55");
  glow.setAttribute("radius-outer", "0.82");
  glow.setAttribute("rotation", "-90 0 0");
  glow.setAttribute("position", "0 0.12 0");
  glow.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.4; opacity:0.55; transparent:true");
  group.appendChild(glow);

  // label
  const t = document.createElement("a-text");
  t.setAttribute("value", label);
  t.setAttribute("align", "center");
  t.setAttribute("color", "#9ff");
  t.setAttribute("width", "4");
  t.setAttribute("position", "0 1.9 0");
  group.appendChild(t);

  // container for model
  const holder = document.createElement("a-entity");
  holder.setAttribute("position", "0 0.22 0");
  holder.setAttribute("rotation", "0 180 0");
  group.appendChild(holder);

  // Try load GLBs in order
  tryLoadFirstGLB(holder, candidateUrls, () => {
    // fallback statue
    const statue = document.createElement("a-cone");
    statue.setAttribute("radius-bottom", "0.35");
    statue.setAttribute("radius-top", "0.06");
    statue.setAttribute("height", "1.6");
    statue.setAttribute("position", "0 0.8 0");
    statue.setAttribute("material", "color:#0b0f14; emissive:#2bd6ff; emissiveIntensity:0.35; roughness:0.8");
    holder.appendChild(statue);

    if (window.hudLog) hudLog(`${label}: GLB not found (showing placeholder). Put your file in /assets/ as combat_ninja.glb or ninja.glb`);
  });
}

function tryLoadFirstGLB(holder, urls, onFail) {
  let idx = 0;

  function attempt() {
    if (idx >= urls.length) { onFail(); return; }

    const url = urls[idx++];
    const model = document.createElement("a-entity");
    model.setAttribute("gltf-model", url);
    model.setAttribute("position", "0 0 0");
    model.setAttribute("scale", "1 1 1");

    let settled = false;

    model.addEventListener("model-loaded", () => {
      if (settled) return;
      settled = true;

      // Make it a good display size
      model.setAttribute("scale", "1.2 1.2 1.2");
      if (window.hudLog) hudLog(`Loaded GLB ✅ ${url}`);
    });

    model.addEventListener("model-error", () => {
      if (settled) return;
      settled = true;
      model.remove();
      attempt();
    });

    holder.appendChild(model);

    // Safety timeout
    setTimeout(() => {
      if (settled) return;
      settled = true;
      model.remove();
      attempt();
    }, 1600);
  }

  attempt();
}
