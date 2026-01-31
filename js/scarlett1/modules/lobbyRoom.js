AFRAME.registerComponent("scarlett-lobby-room", {
  init() {
    const room = this.el;

    // Bigger lobby scale + double wall height
    const WALL_R = 22;
    const WALL_H = 10;

    // Strong lighting (not dark)
    const amb = document.createElement("a-entity");
    amb.setAttribute("light", "type: ambient; intensity: 1.0; color: #cfefff");
    room.appendChild(amb);

    const hemi = document.createElement("a-entity");
    hemi.setAttribute("light", "type: hemisphere; intensity: 0.9; color: #ffffff; groundColor: #223");
    hemi.setAttribute("position", "0 6 0");
    room.appendChild(hemi);

    // Circular wall
    const wall = document.createElement("a-cylinder");
    wall.setAttribute("radius", WALL_R);
    wall.setAttribute("height", WALL_H);
    wall.setAttribute("position", `0 ${WALL_H/2} 0`);
    wall.setAttribute("material", "color:#081018; roughness:0.95; metalness:0.05; side:double");
    room.appendChild(wall);

    // Neon pillar ring
    const PILLARS = 12;
    for (let i=0;i<PILLARS;i++){
      const a = (i/PILLARS) * Math.PI*2;
      const x = Math.cos(a) * (WALL_R-2.5);
      const z = Math.sin(a) * (WALL_R-2.5);

      const p = document.createElement("a-cylinder");
      p.setAttribute("radius", "0.45");
      p.setAttribute("height", WALL_H-1.0);
      p.setAttribute("position", `${x} ${(WALL_H/2)} ${z}`);
      p.setAttribute("material", "color:#0b0f14; metalness:0.7; roughness:0.35");
      room.appendChild(p);

      const glow = document.createElement("a-torus");
      glow.setAttribute("radius", "0.7");
      glow.setAttribute("radius-tubular", "0.08");
      glow.setAttribute("rotation", "-90 0 0");
      glow.setAttribute("position", `${x} 0.25 ${z}`);
      glow.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:2.5; opacity:0.75; transparent:true");
      room.appendChild(glow);

      const light = document.createElement("a-entity");
      light.setAttribute("light", "type: point; intensity: 1.8; distance: 18; decay: 2; color: #7b61ff");
      light.setAttribute("position", `${x} ${WALL_H-1.2} ${z}`);
      room.appendChild(light);
    }

    // Center pit (deep) + 8-player ring table placeholder
    const pit = document.createElement("a-cylinder");
    pit.setAttribute("radius", "9");
    pit.setAttribute("height", "6");
    pit.setAttribute("position", "0 -2.8 0");
    pit.setAttribute("material", "color:#03050a; side:double; roughness:1; metalness:0");
    room.appendChild(pit);

    const pitLip = document.createElement("a-ring");
    pitLip.setAttribute("radius-inner", "9.2");
    pitLip.setAttribute("radius-outer", "10.0");
    pitLip.setAttribute("rotation", "-90 0 0");
    pitLip.setAttribute("position", "0 0.03 0");
    pitLip.setAttribute("material", "color:#0b0f14; emissive:#2bd6ff; emissiveIntensity:0.7; opacity:0.7; transparent:true");
    room.appendChild(pitLip);

    // Showcase 8-seat round table marker (you can swap to your real 8-seat module later)
    const showcase = document.createElement("a-cylinder");
    showcase.setAttribute("radius", "2.6");
    showcase.setAttribute("height", "0.25");
    showcase.setAttribute("position", "0 -5.6 0");
    showcase.setAttribute("material", "color:#101827; metalness:0.15; roughness:0.75");
    room.appendChild(showcase);

    // 4 “Door Jumbotrons” (N/E/S/W)
    const doors = [
      {x: 0, z: -(WALL_R-0.6), ry: 0,   label:"MAIN EVENT"},
      {x: (WALL_R-0.6), z: 0, ry: -90,  label:"POKER PIT"},
      {x: 0, z: (WALL_R-0.6),  ry: 180, label:"SCORPION"},
      {x: -(WALL_R-0.6), z: 0, ry: 90,  label:"STORE"},
    ];

    doors.forEach((d) => {
      const frame = document.createElement("a-plane");
      frame.setAttribute("width", "6");
      frame.setAttribute("height", "3.4");
      frame.setAttribute("position", `${d.x} 3.2 ${d.z}`);
      frame.setAttribute("rotation", `0 ${d.ry} 0`);
      frame.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:0.35; opacity:0.95; transparent:true");
      frame.setAttribute("scarlett-jumbotron", ""); // mounts video
      room.appendChild(frame);

      const txt = document.createElement("a-text");
      txt.setAttribute("value", d.label);
      txt.setAttribute("align", "center");
      txt.setAttribute("color", "#9ff");
      txt.setAttribute("width", "10");
      txt.setAttribute("position", `${d.x} 1.1 ${d.z}`);
      txt.setAttribute("rotation", `0 ${d.ry} 0`);
      room.appendChild(txt);
    });

    hudLog("Lobby created ✅");
    hudLog("Lobby upgraded ✅ (tall walls + pillars + heavy neon + bright lighting)");
  }
});
