// /js/scarlett1/modules/lobby.js
AFRAME.registerComponent("scarlett-lobby-room", {
  init() {
    const el = this.el;

    // === FLOOR ===
    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    floor.setAttribute("radius", "22");
    floor.setAttribute("rotation", "-90 0 0");
    floor.setAttribute("position", "0 0 0");
    floor.setAttribute("material", "color:#05070c; roughness:1; metalness:0");
    el.appendChild(floor);

    // === WALLS (2x height) ===
    const wall = document.createElement("a-cylinder");
    wall.setAttribute("radius", "22");
    wall.setAttribute("height", "14");
    wall.setAttribute("position", "0 7 0");
    wall.setAttribute("material", "color:#0b0f14; roughness:0.95; metalness:0.05; side:double");
    el.appendChild(wall);

    // Brick-ish vertical panels (visual texture)
    for (let i=0; i<16; i++) {
      const a = (i/16) * Math.PI*2;
      const x = Math.cos(a) * 21.7;
      const z = Math.sin(a) * 21.7;
      const p = document.createElement("a-box");
      p.setAttribute("width", "2.2");
      p.setAttribute("height", "10.5");
      p.setAttribute("depth", "0.3");
      p.setAttribute("position", `${x} 5.25 ${z}`);
      p.setAttribute("rotation", `0 ${(-a*180/Math.PI)+90} 0`);
      p.setAttribute("material", "color:#0f172a; roughness:0.9; metalness:0.05; opacity:0.9; transparent:true");
      el.appendChild(p);

      // neon strip
      const strip = document.createElement("a-box");
      strip.setAttribute("width", "0.08");
      strip.setAttribute("height", "10.2");
      strip.setAttribute("depth", "0.12");
      strip.setAttribute("position", `${x} 5.2 ${z}`);
      strip.setAttribute("rotation", `0 ${(-a*180/Math.PI)+90} 0`);
      strip.setAttribute("material", `color:${i%2===0?"#2bd6ff":"#7b61ff"}; emissive:${i%2===0?"#2bd6ff":"#7b61ff"}; emissiveIntensity:1.6; opacity:0.85; transparent:true`);
      el.appendChild(strip);

      // pillar light (extra brightness)
      const pl = document.createElement("a-light");
      pl.setAttribute("type", "point");
      pl.setAttribute("intensity", "0.65");
      pl.setAttribute("distance", "20");
      pl.setAttribute("decay", "1.3");
      pl.setAttribute("color", i%2===0 ? "#2bd6ff" : "#7b61ff");
      pl.setAttribute("position", `${x} 5.5 ${z}`);
      el.appendChild(pl);
    }

    // === DEEP PIT (CENTER DIVOT) ===
    const PIT_RADIUS = 9.0;
    const PIT_DEPTH  = 9.5;
    const PIT_FLOOR_Y = -PIT_DEPTH;

    const lip = document.createElement("a-ring");
    lip.setAttribute("radius-inner", (PIT_RADIUS+0.2).toFixed(2));
    lip.setAttribute("radius-outer", (PIT_RADIUS+1.0).toFixed(2));
    lip.setAttribute("rotation", "-90 0 0");
    lip.setAttribute("position", "0 0.03 0");
    lip.setAttribute("material", "color:#0b0f14; metalness:0.6; roughness:0.35; opacity:0.98; transparent:true");
    el.appendChild(lip);

    const pitWall = document.createElement("a-cylinder");
    pitWall.setAttribute("radius", PIT_RADIUS.toFixed(2));
    pitWall.setAttribute("height", PIT_DEPTH.toFixed(2));
    pitWall.setAttribute("position", `0 ${(PIT_FLOOR_Y/2).toFixed(2)} 0`);
    pitWall.setAttribute("material", "color:#02040a; roughness:1; metalness:0; side:double");
    el.appendChild(pitWall);

    const pitFloor = document.createElement("a-circle");
    pitFloor.classList.add("teleportable");
    pitFloor.setAttribute("radius", (PIT_RADIUS-0.6).toFixed(2));
    pitFloor.setAttribute("rotation", "-90 0 0");
    pitFloor.setAttribute("position", `0 ${PIT_FLOOR_Y.toFixed(2)} 0`);
    pitFloor.setAttribute("material", "color:#00040a; roughness:1; metalness:0");
    el.appendChild(pitFloor);

    const pitNeon = document.createElement("a-ring");
    pitNeon.setAttribute("radius-inner", (PIT_RADIUS-1.0).toFixed(2));
    pitNeon.setAttribute("radius-outer", (PIT_RADIUS-0.7).toFixed(2));
    pitNeon.setAttribute("rotation", "-90 0 0");
    pitNeon.setAttribute("position", `0 ${(PIT_FLOOR_Y+0.08).toFixed(2)} 0`);
    pitNeon.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.8; opacity:0.6; transparent:true");
    el.appendChild(pitNeon);

    // === CENTERPIECE TABLE (8 seats, round) inside pit ===
    const center = document.createElement("a-entity");
    center.setAttribute("position", `0 ${PIT_FLOOR_Y.toFixed(2)} 0`);
    center.setAttribute("scarlett-round8-table", "");
    el.appendChild(center);

    // === 4 "DOOR" PORTALS + JUMBOTRONS ABOVE ===
    const portals = [
      { id:"poker", label:"POKER TABLES", a:0,   room:"room_poker" },
      { id:"store", label:"STORE",       a:90,  room:"room_store" },
      { id:"balc",  label:"BALCONY",     a:180, room:"room_balcony" },
      { id:"scorp", label:"SCORPION",    a:270, room:"room_poker" } // placeholder route
    ];

    portals.forEach(p => {
      const rad = 20.5;
      const ang = p.a * Math.PI/180;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;

      // door pad
      const pad = document.createElement("a-ring");
      pad.classList.add("clickable","teleportable");
      pad.setAttribute("id", `portal_${p.id}`);
      pad.setAttribute("radius-inner", "1.2");
      pad.setAttribute("radius-outer", "1.7");
      pad.setAttribute("rotation", "-90 0 0");
      pad.setAttribute("position", `${x} 0.03 ${z}`);
      pad.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.2; opacity:0.7; transparent:true");
      el.appendChild(pad);

      pad.addEventListener("click", () => {
        if (window.SCARLETT && window.SCARLETT.setRoom) window.SCARLETT.setRoom(p.room);
      });

      // label
      const t = document.createElement("a-text");
      t.setAttribute("value", p.label);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#e8faff");
      t.setAttribute("width", "8");
      t.setAttribute("position", `${x} 1.0 ${z}`);
      t.setAttribute("rotation", `0 ${-p.a+180} 0`);
      el.appendChild(t);

      // jumbotron above door
      const j = document.createElement("a-plane");
      j.setAttribute("width", "6");
      j.setAttribute("height", "3.4");
      j.setAttribute("position", `${x} 5.4 ${z}`);
      j.setAttribute("rotation", `0 ${-p.a+180} 0`);
      j.setAttribute("material", "color:#000; emissive:#2bd6ff; emissiveIntensity:0.35; opacity:0.95; transparent:true");
      el.appendChild(j);

      const jt = document.createElement("a-text");
      jt.setAttribute("value", "JUMBOTRON");
      jt.setAttribute("align", "center");
      jt.setAttribute("color", "#9ff");
      jt.setAttribute("width", "10");
      jt.setAttribute("position", `${x} 5.4 ${z+0.02*Math.sign(z||1)}`);
      jt.setAttribute("rotation", `0 ${-p.a+180} 0`);
      el.appendChild(jt);
    });

    if (window.hudLog) hudLog("Lobby created ✅");
    if (window.hudLog) hudLog("Deep pit created ✅");
  }
});

// 8-seat round table (centerpiece demo)
AFRAME.registerComponent("scarlett-round8-table", {
  init() {
    const el = this.el;

    // pedestal
    const base = document.createElement("a-cylinder");
    base.setAttribute("radius", "5.0");
    base.setAttribute("height", "0.20");
    base.setAttribute("position", "0 0.10 0");
    base.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
    el.appendChild(base);

    const pillar = document.createElement("a-cylinder");
    pillar.setAttribute("radius", "0.9");
    pillar.setAttribute("height", "1.15");
    pillar.setAttribute("position", "0 0.78 0");
    pillar.setAttribute("material", "color:#0b0f14; metalness:0.65; roughness:0.35");
    el.appendChild(pillar);

    const top = document.createElement("a-cylinder");
    top.setAttribute("radius", "2.55");
    top.setAttribute("height", "0.18");
    top.setAttribute("position", "0 1.45 0");
    top.setAttribute("material", "color:#101827; metalness:0.2; roughness:0.6");
    el.appendChild(top);

    const rail = document.createElement("a-torus");
    rail.setAttribute("radius", "2.55");
    rail.setAttribute("radius-tubular", "0.045");
    rail.setAttribute("rotation", "-90 0 0");
    rail.setAttribute("position", "0 1.54 0");
    rail.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:2.0; opacity:0.85; transparent:true");
    el.appendChild(rail);

    const felt = document.createElement("a-circle");
    felt.setAttribute("radius", "2.25");
    felt.setAttribute("rotation", "-90 0 0");
    felt.setAttribute("position", "0 1.55 0");
    felt.setAttribute("material", "color:#07111a; roughness:1; metalness:0");
    el.appendChild(felt);

    // 8 seats
    const seatY = 0.20;
    const seatR = 4.6;
    for (let i=0; i<8; i++) {
      const a = (i/8) * Math.PI*2;
      const x = Math.cos(a) * seatR;
      const z = Math.sin(a) * seatR;

      const chair = document.createElement("a-entity");
      chair.setAttribute("position", `${x} ${seatY} ${z}`);
      chair.setAttribute("rotation", `0 ${(-a*180/Math.PI)+90} 0`);
      chair.setAttribute("scarlett-chair", "");
      el.appendChild(chair);
    }
  }
});
