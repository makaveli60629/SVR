// /js/scarlett1/modules/lobby.js

AFRAME.registerComponent("scarlett-lobby", {
  init() {
    const el = this.el;

    // ======= ROOM SIZE (2× walls) =======
    const ROOM_W = 40;   // was ~20 (2×)
    const ROOM_D = 40;   // was ~20 (2×)
    const ROOM_H = 10;   // taller

    // ======= FLOOR (neon grid-ish feel) =======
    const floor = document.createElement("a-plane");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("width", ROOM_W);
    floor.setAttribute("height", ROOM_D);
    floor.setAttribute("material", "color:#05070b; metalness:0.1; roughness:0.9");
    floor.setAttribute("position", "0 0 0");
    el.appendChild(floor);

    // Under-floor glow ring
    const floorGlow = document.createElement("a-ring");
    floorGlow.setAttribute("rotation", "-90 0 0");
    floorGlow.setAttribute("radius-inner", "6.8");
    floorGlow.setAttribute("radius-outer", "7.6");
    floorGlow.setAttribute("position", "0 0.01 0");
    floorGlow.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.2; opacity:0.35; transparent:true");
    el.appendChild(floorGlow);

    // ======= CEILING + LIGHT PANELS =======
    const ceiling = document.createElement("a-plane");
    ceiling.setAttribute("rotation", "90 0 0");
    ceiling.setAttribute("width", ROOM_W);
    ceiling.setAttribute("height", ROOM_D);
    ceiling.setAttribute("position", `0 ${ROOM_H} 0`);
    ceiling.setAttribute("material", "color:#020308; roughness:1; metalness:0.0");
    el.appendChild(ceiling);

    // neon ceiling panels
    const panel1 = neonPanel(10, 2.2, "0 9.8 0", "#7b61ff");
    const panel2 = neonPanel(10, 2.2, "0 9.8 -10", "#00e5ff");
    const panel3 = neonPanel(10, 2.2, "0 9.8 10", "#ff2bd6");
    el.appendChild(panel1); el.appendChild(panel2); el.appendChild(panel3);

    // ======= WALLS (2×) =======
    // Back wall
    el.appendChild(wall(ROOM_W, ROOM_H, `0 ${ROOM_H/2} ${-ROOM_D/2}`, "0 0 0"));
    // Front wall
    el.appendChild(wall(ROOM_W, ROOM_H, `0 ${ROOM_H/2} ${ROOM_D/2}`, "0 180 0"));
    // Left wall
    el.appendChild(wall(ROOM_D, ROOM_H, `${-ROOM_W/2} ${ROOM_H/2} 0`, "0 90 0"));
    // Right wall
    el.appendChild(wall(ROOM_D, ROOM_H, `${ROOM_W/2} ${ROOM_H/2} 0`, "0 -90 0"));

    // ======= LIGHTING (MORE + BETTER) =======
    const hemi = document.createElement("a-entity");
    hemi.setAttribute("light", "type: hemisphere; intensity: 0.65; color: #bfe9ff; groundColor:#06080c");
    hemi.setAttribute("position", "0 8 0");
    el.appendChild(hemi);

    const key = document.createElement("a-entity");
    key.setAttribute("light", "type: directional; intensity: 0.9; color:#ffffff; castShadow:false");
    key.setAttribute("position", "6 9 6");
    el.appendChild(key);

    // Four corner point lights
    [
      {x:-14,y:6,z:-14,c:"#00e5ff"},
      {x: 14,y:6,z:-14,c:"#7b61ff"},
      {x:-14,y:6,z: 14,c:"#ff2bd6"},
      {x: 14,y:6,z: 14,c:"#00ff9a"},
    ].forEach(p=>{
      const L=document.createElement("a-entity");
      L.setAttribute("light", `type: point; intensity: 0.9; distance: 40; color:${p.c}`);
      L.setAttribute("position", `${p.x} ${p.y} ${p.z}`);
      el.appendChild(L);
    });

    // ======= NEON PILLARS (beauty + structure) =======
    // 8 pillars around the center
    const pillarPos = [
      [-12, -12], [0, -12], [12, -12],
      [-12, 0],             [12, 0],
      [-12, 12],  [0, 12],  [12, 12]
    ];
    pillarPos.forEach(([x,z]) => el.appendChild(neonPillar(x, z, ROOM_H)));

    // ======= CENTER LOBBY RING + SIGNAGE =======
    const ring = document.createElement("a-torus");
    ring.setAttribute("radius", "4.2");
    ring.setAttribute("radius-tubular", "0.12");
    ring.setAttribute("rotation", "-90 0 0");
    ring.setAttribute("position", "0 0.03 0");
    ring.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.8; metalness:0.2; roughness:0.6");
    el.appendChild(ring);

    const title = document.createElement("a-text");
    title.setAttribute("value", "SCARLETT1 LOBBY");
    title.setAttribute("align", "center");
    title.setAttribute("color", "#9ff");
    title.setAttribute("width", "14");
    title.setAttribute("position", "0 3.4 -14");
    el.appendChild(title);

    const subtitle = document.createElement("a-text");
    subtitle.setAttribute("value", "Training • Tables • Store • Balcony");
    subtitle.setAttribute("align", "center");
    subtitle.setAttribute("color", "#b19cd9");
    subtitle.setAttribute("width", "16");
    subtitle.setAttribute("position", "0 2.7 -14");
    el.appendChild(subtitle);

    // ======= PORTALS (clickable panels) =======
    // Tables (Poker Pit / real tables area)
    el.appendChild(portalPanel("ENTER TABLES", "-6 1.8 -10", "#00e5ff", "tables"));
    // Store
    el.appendChild(portalPanel("ENTER STORE", "0 1.8 -10", "#7b61ff", "store"));
    // Balcony
    el.appendChild(portalPanel("ENTER BALCONY", "6 1.8 -10", "#ff2bd6", "balcony"));
    // Back to Lobby (if you teleport back here)
    el.appendChild(portalPanel("RETURN LOBBY", "0 1.5 10", "#00ff9a", "lobby"));

    // ======= EXTRA NEON TRIM ALONG WALL BASE =======
    el.appendChild(wallTrim(ROOM_W, `0 0.15 ${-ROOM_D/2+0.02}`, "#00e5ff"));
    el.appendChild(wallTrim(ROOM_W, `0 0.15 ${ROOM_D/2-0.02}`, "#7b61ff"));
    el.appendChild(wallTrim(ROOM_D, `${-ROOM_W/2+0.02} 0.15 0`, "#ff2bd6", true));
    el.appendChild(wallTrim(ROOM_D, `${ROOM_W/2-0.02} 0.15 0`, "#00ff9a", true));

    if (window.hudLog) hudLog("Lobby beautified ✅ (2× room, neon pillars, lighting upgrade, portals)");
  }
});

function wall(w, h, pos, rot) {
  const p = document.createElement("a-plane");
  p.setAttribute("width", w);
  p.setAttribute("height", h);
  p.setAttribute("position", pos);
  p.setAttribute("rotation", rot);
  p.setAttribute("material", "color:#070a10; metalness:0.15; roughness:0.95");
  return p;
}

function neonPanel(w, h, pos, color) {
  const p = document.createElement("a-plane");
  p.setAttribute("width", w);
  p.setAttribute("height", h);
  p.setAttribute("position", pos);
  p.setAttribute("rotation", "90 0 0");
  p.setAttribute("material", `color:#0b0f14; emissive:${color}; emissiveIntensity:1.4; opacity:0.7; transparent:true`);
  return p;
}

function neonPillar(x, z, roomH) {
  const g = document.createElement("a-entity");
  g.setAttribute("position", `${x} 0 ${z}`);

  const core = document.createElement("a-cylinder");
  core.setAttribute("radius", "0.55");
  core.setAttribute("height", `${roomH-1.2}`);
  core.setAttribute("position", `0 ${(roomH-1.2)/2} 0`);
  core.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
  g.appendChild(core);

  const band1 = neonBand(0.62, 0.14, `0 1.2 0`, "#00e5ff");
  const band2 = neonBand(0.62, 0.14, `0 3.6 0`, "#7b61ff");
  const band3 = neonBand(0.62, 0.14, `0 6.0 0`, "#ff2bd6");
  g.appendChild(band1); g.appendChild(band2); g.appendChild(band3);

  const cap = document.createElement("a-cylinder");
  cap.setAttribute("radius", "0.75");
  cap.setAttribute("height", "0.22");
  cap.setAttribute("position", `0 ${roomH-1.1} 0`);
  cap.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
  g.appendChild(cap);

  // tiny top light
  const L = document.createElement("a-entity");
  L.setAttribute("light", "type: point; intensity: 0.55; distance: 18; color:#00e5ff");
  L.setAttribute("position", `0 ${roomH-1.0} 0`);
  g.appendChild(L);

  return g;
}

function neonBand(radius, height, pos, color) {
  const b = document.createElement("a-cylinder");
  b.setAttribute("radius", `${radius}`);
  b.setAttribute("height", `${height}`);
  b.setAttribute("position", pos);
  b.setAttribute("material", `color:#0b0f14; emissive:${color}; emissiveIntensity:1.7; opacity:0.85; transparent:true`);
  return b;
}

function portalPanel(label, pos, neon, dest) {
  const panel = document.createElement("a-plane");
  panel.classList.add("clickable", "portal");
  panel.setAttribute("data-dest", dest);
  panel.setAttribute("width", "4.2");
  panel.setAttribute("height", "1.2");
  panel.setAttribute("position", pos);
  panel.setAttribute("material", `color:#0b0f14; emissive:${neon}; emissiveIntensity:1.2; opacity:0.85; transparent:true`);
  panel.setAttribute("animation__pulse", `property: material.emissiveIntensity; dir:alternate; dur:1100; loop:true; to:2.2`);

  const t = document.createElement("a-text");
  t.setAttribute("value", label);
  t.setAttribute("align", "center");
  t.setAttribute("color", "#dff");
  t.setAttribute("width", "10");
  t.setAttribute("position", "0 0 0.01");
  panel.appendChild(t);

  return panel;
}

function wallTrim(len, pos, color, rotateY=false) {
  const t = document.createElement("a-plane");
  t.setAttribute("width", len);
  t.setAttribute("height", "0.25");
  t.setAttribute("position", pos);
  t.setAttribute("rotation", rotateY ? "0 90 0" : "0 0 0");
  t.setAttribute("material", `color:#0b0f14; emissive:${color}; emissiveIntensity:1.6; opacity:0.65; transparent:true`);
  return t;
}
