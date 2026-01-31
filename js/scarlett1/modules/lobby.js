AFRAME.registerComponent("scarlett-lobby", {
  init: function () {
    const el = this.el;

    // ----------- LIGHTING (Quest-friendly: few lights + emissive neon) ----------
    const amb = document.createElement("a-entity");
    amb.setAttribute("light", "type:ambient; intensity:0.65; color:#bfefff");
    el.appendChild(amb);

    const hemi = document.createElement("a-entity");
    hemi.setAttribute("light", "type:hemisphere; intensity:0.55; color:#cfe8ff; groundColor:#05070c");
    hemi.setAttribute("position", "0 8 0");
    el.appendChild(hemi);

    // 4 soft point lights around the lobby (not too many)
    const pts = [
      {x: 10, y: 6, z: 0},
      {x:-10, y: 6, z: 0},
      {x: 0, y: 6, z:10},
      {x: 0, y: 6, z:-10},
    ];
    pts.forEach(p=>{
      const l = document.createElement("a-entity");
      l.setAttribute("position", `${p.x} ${p.y} ${p.z}`);
      l.setAttribute("light", "type:point; intensity:0.75; distance:40; decay:2; color:#8fe9ff");
      el.appendChild(l);
    });

    // ----------- FLOOR ----------
    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    floor.setAttribute("radius", "22");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("position", "0 0 0");
    floor.setAttribute("material", "color:#070a10; roughness:1.0; metalness:0.0");
    el.appendChild(floor);

    // Neon floor ring
    const ring = document.createElement("a-ring");
    ring.setAttribute("radius-inner", "20.8");
    ring.setAttribute("radius-outer", "21.1");
    ring.setAttribute("rotation", "-90 0 0");
    ring.setAttribute("position", "0 0.02 0");
    ring.setAttribute("material", "color:#0f1116; emissive:#2bd6ff; emissiveIntensity:2.0; opacity:0.9; transparent:true");
    el.appendChild(ring);

    // ----------- WALLS (2x height request) ----------
    const wall = document.createElement("a-cylinder");
    wall.setAttribute("radius", "22");
    wall.setAttribute("height", "16"); // 2x taller feel
    wall.setAttribute("position", "0 8 0");
    wall.setAttribute("material", "color:#0b0f14; roughness:0.95; metalness:0.05; side:double");
    el.appendChild(wall);

    // “Brick-ish” ribs so you can see structure (cheap geometry)
    for (let i=0;i<24;i++){
      const rib = document.createElement("a-box");
      const ang = (i/24)*Math.PI*2;
      const r = 21.8;
      rib.setAttribute("width","0.25");
      rib.setAttribute("height","16");
      rib.setAttribute("depth","0.7");
      rib.setAttribute("position", `${Math.cos(ang)*r} 8 ${Math.sin(ang)*r}`);
      rib.setAttribute("rotation", `0 ${-(ang*180/Math.PI)} 0`);
      rib.setAttribute("material","color:#0a0d13; roughness:1; metalness:0");
      el.appendChild(rib);

      // neon strip on each rib
      const neon = document.createElement("a-box");
      neon.setAttribute("width","0.05");
      neon.setAttribute("height","10");
      neon.setAttribute("depth","0.05");
      neon.setAttribute("position", `${Math.cos(ang)*21.35} 8 ${Math.sin(ang)*21.35}`);
      neon.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.65; transparent:true");
      el.appendChild(neon);
    }

    // ----------- PILLARS (with neon caps) ----------
    const pillarPos = [
      {x: 12, z: 12}, {x:-12, z: 12}, {x:12, z:-12}, {x:-12, z:-12},
      {x: 16, z: 0},  {x:-16, z: 0},  {x:0, z: 16},  {x:0, z:-16}
    ];
    pillarPos.forEach(p=>{
      const c = document.createElement("a-cylinder");
      c.setAttribute("radius", "0.55");
      c.setAttribute("height", "14");
      c.setAttribute("position", `${p.x} 7 ${p.z}`);
      c.setAttribute("material", "color:#0b0f14; metalness:0.35; roughness:0.65");
      el.appendChild(c);

      const cap = document.createElement("a-ring");
      cap.setAttribute("radius-inner","0.55");
      cap.setAttribute("radius-outer","0.9");
      cap.setAttribute("rotation","-90 0 0");
      cap.setAttribute("position", `${p.x} 13.9 ${p.z}`);
      cap.setAttribute("material","color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.5; opacity:0.65; transparent:true");
      el.appendChild(cap);
    });

    // ----------- DEEP CENTER PIT (your centerpiece lives inside) ----------
    const PIT_RADIUS = 8.2;
    const PIT_DEPTH  = 10.0;
    const PIT_FLOOR_Y = -PIT_DEPTH;

    const pitLip = document.createElement("a-ring");
    pitLip.setAttribute("radius-inner", (PIT_RADIUS+0.2).toFixed(2));
    pitLip.setAttribute("radius-outer", (PIT_RADIUS+0.95).toFixed(2));
    pitLip.setAttribute("rotation","-90 0 0");
    pitLip.setAttribute("position","0 0.03 0");
    pitLip.setAttribute("material","color:#0b0f14; metalness:0.6; roughness:0.4; opacity:0.98; transparent:true");
    el.appendChild(pitLip);

    const pitWall = document.createElement("a-cylinder");
    pitWall.setAttribute("radius", PIT_RADIUS.toFixed(2));
    pitWall.setAttribute("height", PIT_DEPTH.toFixed(2));
    pitWall.setAttribute("position", `0 ${(PIT_FLOOR_Y/2).toFixed(2)} 0`);
    pitWall.setAttribute("material","color:#05070c; roughness:1.0; metalness:0.0; side:double");
    el.appendChild(pitWall);

    const pitFloor = document.createElement("a-circle");
    pitFloor.classList.add("teleportable");
    pitFloor.setAttribute("radius", (PIT_RADIUS-0.5).toFixed(2));
    pitFloor.setAttribute("rotation","-90 0 0");
    pitFloor.setAttribute("position", `0 ${PIT_FLOOR_Y.toFixed(2)} 0`);
    pitFloor.setAttribute("material","color:#020308; roughness:1.0; metalness:0.0");
    el.appendChild(pitFloor);

    const depthRing = document.createElement("a-ring");
    depthRing.setAttribute("radius-inner",(PIT_RADIUS-1.0).toFixed(2));
    depthRing.setAttribute("radius-outer",(PIT_RADIUS-0.7).toFixed(2));
    depthRing.setAttribute("rotation","-90 0 0");
    depthRing.setAttribute("position", `0 ${(PIT_FLOOR_Y+0.10).toFixed(2)} 0`);
    depthRing.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.8; opacity:0.55; transparent:true");
    el.appendChild(depthRing);

    // Placeholder for your 8-seat centerpiece table entity (keeps your structure)
    const showcase = document.createElement("a-entity");
    showcase.setAttribute("id","showcaseTableRoot");
    showcase.setAttribute("position", `0 ${PIT_FLOOR_Y.toFixed(2)} 0`);
    // if you already have a component for it, re-enable it here:
    // showcase.setAttribute("scarlett-lobby-showcase-table", "");
    el.appendChild(showcase);

    // ----------- “DOORS” + JUMBOTRON FRAMES (4 cardinal points) ----------
    const doors = [
      {name:"POKER PIT", x: 0, z:-20.3, r: 0},
      {name:"STORE",    x: 20.3, z: 0, r: -90},
      {name:"SCORPION", x:-20.3, z: 0, r: 90},
      {name:"BALCONY",  x: 0, z: 20.3, r: 180},
    ];

    doors.forEach(d=>{
      const frame = document.createElement("a-box");
      frame.setAttribute("width","6.2");
      frame.setAttribute("height","4.4");
      frame.setAttribute("depth","0.25");
      frame.setAttribute("position", `${d.x} 2.4 ${d.z}`);
      frame.setAttribute("rotation", `0 ${d.r} 0`);
      frame.setAttribute("material","color:#0b0f14; metalness:0.35; roughness:0.5");
      el.appendChild(frame);

      const screen = document.createElement("a-plane");
      screen.setAttribute("width","5.6");
      screen.setAttribute("height","3.4");
      screen.setAttribute("position", `${d.x} 3.3 ${d.z}`);
      screen.setAttribute("rotation", `0 ${d.r} 0`);
      screen.setAttribute("material","color:#060913; emissive:#7b61ff; emissiveIntensity:0.25; opacity:0.95; transparent:true");
      el.appendChild(screen);

      const label = document.createElement("a-text");
      label.setAttribute("value", d.name);
      label.setAttribute("align","center");
      label.setAttribute("color","#9ff");
      label.setAttribute("width","10");
      label.setAttribute("position", `${d.x} 1.0 ${d.z}`);
      label.setAttribute("rotation", `0 ${d.r} 0`);
      el.appendChild(label);

      // teleport pad at each door
      const pad = document.createElement("a-ring");
      pad.classList.add("teleportable");
      pad.setAttribute("radius-inner","0.6");
      pad.setAttribute("radius-outer","0.9");
      pad.setAttribute("rotation","-90 0 0");
      pad.setAttribute("position", `${d.x} 0.03 ${d.z}`);
      pad.setAttribute("material","color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.2; opacity:0.55; transparent:true");
      el.appendChild(pad);
    });

    if (window.hudLog) {
      hudLog("Lobby upgraded ✅ (2x walls + neon ribs + pillars + deep pit + door pads)");
    }
  }
});
