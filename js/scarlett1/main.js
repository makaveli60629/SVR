/* SCARLETT1 COMPLETE SAFE BUILD (ONE FILE)
   - Lobby (circular, tall walls, neon pillars)
   - Deep Center Pit (for showcase)
   - Poker Pit Room (6-seat oval table)
   - Store Room + balcony
   - Portals + Safe Spawns (NEVER spawn in pit)
   - Teleport (trigger) + Move (movement-controls + fallback)
   - Overkill lighting (Quest-visible)
   - HUD audit + error trap
*/

(() => {
  // ---------------- HUD + ERROR TRAP ----------------
  const hud = () => document.getElementById("hud");
  window.hudLog = (msg) => {
    const el = hud();
    if (!el) return;
    const t = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"});
    el.textContent += `\n[${t}] ${msg}`;
  };

  window.addEventListener("error", (e) => hudLog(`❌ ERROR: ${e.message || e.type}`));
  window.addEventListener("unhandledrejection", (e) => hudLog(`❌ PROMISE: ${e.reason?.message || e.reason || "unknown"}`));

  if (!window.AFRAME) {
    const el = hud(); if (el) el.textContent += "\n❌ A-Frame missing (CDN not loaded)";
    return;
  }

  const q = (id) => document.getElementById(id);
  const set = (el, k, v) => { try { el.setAttribute(k, v); } catch(_){} };

  // ---------------- GLOBAL CONSTANTS ----------------
  const ROOM_OFFSET = 60; // rooms spaced apart
  const SPAWN_LOBBY = { x: 0, y: 0, z: 18, rotY: 180 };   // SAFE (outside pit)
  const SPAWN_POKER = { x: ROOM_OFFSET, y: 0, z: 18, rotY: 180 };
  const SPAWN_STORE = { x: -ROOM_OFFSET, y: 0, z: 18, rotY: 180 };

  // ---------------- SPAWN (HARD GUARANTEE) ----------------
  function hardSpawn(pos) {
    const rig = q("rig");
    if (!rig || !rig.object3D) { hudLog("Spawn FAIL: rig missing"); return; }

    rig.object3D.position.set(pos.x, pos.y, pos.z);
    rig.object3D.rotation.set(0, THREE.MathUtils.degToRad(pos.rotY || 0), 0);

    // Also force camera local
    const cam = q("camera");
    if (cam) cam.setAttribute("position", "0 1.6 0");

    hudLog(`Spawned ✅ x=${pos.x} z=${pos.z}`);
  }

  // ---------------- LIGHTING (OVERKILL) ----------------
  function addOverkillLights(scene, cx=0, cz=0) {
    // Ambient
    const amb = document.createElement("a-entity");
    set(amb, "light", "type: ambient; intensity: 2.0; color: #ffffff");
    scene.appendChild(amb);

    // Hemisphere
    const hemi = document.createElement("a-entity");
    set(hemi, "light", "type: hemisphere; intensity: 1.6; color: #ffffff; groundColor: #223344");
    set(hemi, "position", `${cx} 25 ${cz}`);
    scene.appendChild(hemi);

    // Directional key
    const dir = document.createElement("a-entity");
    set(dir, "light", "type: directional; intensity: 2.2; color: #ffffff");
    set(dir, "position", `${cx+6} 18 ${cz+10}`);
    set(dir, "rotation", "-50 0 0");
    scene.appendChild(dir);

    // Ring of point lights
    const R = 16;
    for (let i=0;i<10;i++){
      const a = (i/10) * Math.PI*2;
      const x = cx + Math.cos(a)*R;
      const z = cz + Math.sin(a)*R;
      const p = document.createElement("a-entity");
      set(p, "light", "type: point; intensity: 2.6; distance: 90; decay: 2; color: #ccffff");
      set(p, "position", `${x} 6 ${z}`);
      scene.appendChild(p);
    }

    hudLog("Lighting: OVERKILL ✅");
  }

  // ---------------- PORTAL PAD ----------------
  function makePortal(scene, cfg) {
    const pad = document.createElement("a-entity");
    pad.setAttribute("id", cfg.id);
    pad.setAttribute("position", cfg.position);
    scene.appendChild(pad);

    const ring = document.createElement("a-ring");
    ring.classList.add("teleportable");
    set(ring, "radius-inner", "0.55");
    set(ring, "radius-outer", "0.95");
    set(ring, "rotation", "-90 0 0");
    set(ring, "position", "0 0.02 0");
    set(ring, "material", `color:#7b61ff; emissive:#7b61ff; emissiveIntensity:2.0; opacity:0.65; transparent:true`);
    pad.appendChild(ring);

    const txt = document.createElement("a-text");
    set(txt, "value", cfg.label);
    set(txt, "align", "center");
    set(txt, "color", "#9ff");
    set(txt, "width", "7");
    set(txt, "position", "-1.3 1.2 0");
    pad.appendChild(txt);

    // enter detection
    let locked = false;
    const rig = q("rig");
    const rad = 0.95;

    function loop(){
      requestAnimationFrame(loop);
      if (locked) return;
      if (!rig || !rig.object3D || !pad.object3D) return;

      const rp = rig.object3D.position;
      const pp = pad.object3D.position;
      const dx = rp.x - pp.x;
      const dz = rp.z - pp.z;
      if ((dx*dx + dz*dz) < (rad*rad)) {
        locked = true;
        cfg.onEnter();
        setTimeout(()=> locked=false, 900);
      }
    }
    loop();
  }

  // ---------------- TELEPORT + MOVE ----------------
  function enableControls(scene) {
    const rig = q("rig");
    const cam = q("camera");
    if (!rig || !cam) return;

    // A-Frame built-in movement-controls (works well on Quest)
    // Requires: camera is inside rig
    rig.setAttribute("movement-controls", "enabled: true; speed: 0.12");
    cam.setAttribute("wasd-controls", "enabled: true; acceleration: 55");

    // Controller teleport on trigger (fallback)
    const left = q("leftHand");
    const right = q("rightHand");

    const floor = q("globalFloor") || document.querySelector(".teleportable");
    if (left) left.setAttribute("raycaster", "objects: .teleportable; far: 35; showLine: false");
    if (right) right.setAttribute("raycaster", "objects: .teleportable; far: 35; showLine: false");

    const ring = document.createElement("a-ring");
    ring.setAttribute("radius-inner", "0.20");
    ring.setAttribute("radius-outer", "0.34");
    ring.setAttribute("rotation", "-90 0 0");
    ring.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:2.0; opacity:0.75; transparent:true");
    ring.setAttribute("visible","false");
    scene.appendChild(ring);

    function doTeleport(hand){
      const rc = hand?.components?.raycaster;
      if (!rc) return;
      const hits = rc.intersections || [];
      if (!hits.length) return;
      const p = hits[0].point;
      rig.object3D.position.set(p.x, 0, p.z);
      ring.setAttribute("position", `${p.x} 0.02 ${p.z}`);
      ring.setAttribute("visible","true");
      setTimeout(()=> ring.setAttribute("visible","false"), 120);
      hudLog("Teleport ✅");
    }

    if (left) left.addEventListener("triggerdown", ()=>doTeleport(left));
    if (right) right.addEventListener("triggerdown", ()=>doTeleport(right));

    // Manual fallback move (if movement-controls doesn’t engage)
    let vx=0, vz=0;
    const speed = 0.06;

    function bindThumb(h){
      if (!h) return;
      h.addEventListener("thumbstickmoved", (e)=>{
        vx = e.detail.x || 0;
        vz = e.detail.y || 0;
      });
    }
    bindThumb(left);
    bindThumb(right);

    scene.addEventListener("tick", ()=>{
      const dx = Math.abs(vx)<0.15 ? 0 : vx;
      const dz = Math.abs(vz)<0.15 ? 0 : vz;
      if (!dx && !dz) return;

      // move relative to camera yaw
      const yaw = cam.object3D.rotation.y;
      const sx = (Math.cos(yaw)*dx - Math.sin(yaw)*dz) * speed;
      const sz = (Math.sin(yaw)*dx + Math.cos(yaw)*dz) * speed;

      rig.object3D.position.x += sx;
      rig.object3D.position.z += sz;
    });

    hudLog("Controls ✅ movement + teleport");
  }

  // ---------------- BUILD: LOBBY ----------------
  function buildLobby(scene) {
    const cx=0, cz=0;

    // Outer wall + floor ring
    const ring = document.createElement("a-ring");
    ring.classList.add("teleportable");
    set(ring, "radius-inner","10.5");
    set(ring, "radius-outer","18.0");
    set(ring, "rotation","-90 0 0");
    set(ring, "position", `${cx} 0.01 ${cz}`);
    set(ring, "material","color:#07111a; roughness:1; metalness:0");
    scene.appendChild(ring);

    const wall = document.createElement("a-cylinder");
    set(wall, "radius","18.2");
    set(wall, "height","14");        // taller walls
    set(wall, "position", `${cx} 7 ${cz}`);
    set(wall, "material","color:#05070c; side:double; roughness:1; metalness:0");
    scene.appendChild(wall);

    // Pillars + neon strips
    const PR = 16.0;
    for (let i=0;i<12;i++){
      const a = (i/12)*Math.PI*2;
      const x = cx + Math.cos(a)*PR;
      const z = cz + Math.sin(a)*PR;

      const p = document.createElement("a-cylinder");
      set(p, "radius","0.45");
      set(p, "height","12");
      set(p, "position", `${x} 6 ${z}`);
      set(p, "material","color:#0b0f14; metalness:0.65; roughness:0.35");
      scene.appendChild(p);

      const neon = document.createElement("a-box");
      set(neon, "width","0.18");
      set(neon, "height","10.5");
      set(neon, "depth","0.18");
      set(neon, "position", `${x} 6 ${z}`);
      set(neon, "material","color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.6; opacity:0.35; transparent:true");
      scene.appendChild(neon);
    }

    // Deep center pit (showcase)
    const PIT_R=8, PIT_D=10, PIT_F=-PIT_D;
    const pitLip = document.createElement("a-ring");
    set(pitLip, "radius-inner",(PIT_R+0.2));
    set(pitLip, "radius-outer",(PIT_R+1.0));
    set(pitLip, "rotation","-90 0 0");
    set(pitLip, "position", `${cx} 0.02 ${cz}`);
    set(pitLip, "material","color:#0b0f14; emissive:#2bd6ff; emissiveIntensity:0.8; opacity:0.65; transparent:true");
    scene.appendChild(pitLip);

    const pitWall = document.createElement("a-cylinder");
    set(pitWall, "radius", PIT_R);
    set(pitWall, "height", PIT_D);
    set(pitWall, "position", `${cx} ${(PIT_F/2)} ${cz}`);
    set(pitWall, "material","color:#020308; side:double; roughness:1; metalness:0");
    scene.appendChild(pitWall);

    const pitFloor = document.createElement("a-circle");
    pitFloor.classList.add("teleportable");
    set(pitFloor, "radius", PIT_R-0.4);
    set(pitFloor, "rotation","-90 0 0");
    set(pitFloor, "position", `${cx} ${PIT_F} ${cz}`);
    set(pitFloor, "material","color:#05070c; roughness:1; metalness:0");
    scene.appendChild(pitFloor);

    // Showcase 8-seat table placeholder in pit
    const table = document.createElement("a-cylinder");
    set(table,"radius","2.6");
    set(table,"height","0.25");
    set(table,"position", `${cx} ${PIT_F+1.1} ${cz}`);
    set(table,"material","color:#101827; roughness:0.8; metalness:0.1");
    scene.appendChild(table);

    // 4 “door/jumbotron” placeholders (no video yet—just panels)
    const doors = [
      {x: cx, z: cz-(18.0-0.6), ry:0,   label:"MAIN EVENT"},
      {x: cx+(18.0-0.6), z: cz, ry:-90, label:"POKER PIT"},
      {x: cx, z: cz+(18.0-0.6), ry:180, label:"SCORPION"},
      {x: cx-(18.0-0.6), z: cz, ry:90,  label:"STORE"},
    ];
    doors.forEach(d=>{
      const panel = document.createElement("a-plane");
      set(panel,"width","6");
      set(panel,"height","3.2");
      set(panel,"position", `${d.x} 3.2 ${d.z}`);
      set(panel,"rotation", `0 ${d.ry} 0`);
      set(panel,"material","color:#0b0f14; emissive:#00e5ff; emissiveIntensity:0.35; opacity:0.9; transparent:true");
      scene.appendChild(panel);

      const txt = document.createElement("a-text");
      set(txt,"value", d.label);
      set(txt,"align","center");
      set(txt,"color","#9ff");
      set(txt,"width","10");
      set(txt,"position", `${d.x} 1.1 ${d.z}`);
      set(txt,"rotation", `0 ${d.ry} 0`);
      scene.appendChild(txt);
    });

    // Portals (stand in these pads)
    makePortal(scene, { id:"portal_pokerpit", position:`${cx+12} 0 ${cz}`, label:"GO POKER PIT", onEnter:()=>showRoom("pokerpit") });
    makePortal(scene, { id:"portal_store",   position:`${cx-12} 0 ${cz}`, label:"GO STORE",     onEnter:()=>showRoom("store") });

    hudLog("Lobby ✅ built");
  }

  // ---------------- BUILD: POKER PIT ROOM ----------------
  function buildPokerRoom(scene) {
    const cx=ROOM_OFFSET, cz=0;

    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    set(floor,"radius","22");
    set(floor,"rotation","-90 0 0");
    set(floor,"position", `${cx} 0 ${cz}`);
    set(floor,"material","color:#070b10; roughness:1; metalness:0");
    scene.appendChild(floor);

    const wall = document.createElement("a-cylinder");
    set(wall,"radius","22");
    set(wall,"height","10");
    set(wall,"position", `${cx} 5 ${cz}`);
    set(wall,"material","color:#0b1220; side:double; roughness:1; metalness:0");
    scene.appendChild(wall);

    // Table pedestal
    const ped = document.createElement("a-cylinder");
    set(ped,"radius","4.4");
    set(ped,"height","0.25");
    set(ped,"position", `${cx} 0.12 ${cz}`);
    set(ped,"material","color:#0b0f14; metalness:0.7; roughness:0.35");
    scene.appendChild(ped);

    // Oval top
    const top = document.createElement("a-cylinder");
    set(top,"radius","1.1");
    set(top,"height","0.20");
    set(top,"scale","3.3 1 1.85");
    set(top,"position", `${cx} 1.25 ${cz}`);
    set(top,"material","color:#101827; roughness:0.75; metalness:0.1");
    scene.appendChild(top);

    // Neon rail
    const rail = document.createElement("a-torus");
    set(rail,"radius","1.08");
    set(rail,"radius-tubular","0.03");
    set(rail,"rotation","-90 0 0");
    set(rail,"scale","3.35 1 1.90");
    set(rail,"position", `${cx} 1.33 ${cz}`);
    set(rail,"material","color:#0f1116; emissive:#2bd6ff; emissiveIntensity:2.4; opacity:0.85; transparent:true");
    scene.appendChild(rail);

    // Seats
    const seats = [
      {x: 0.0,  z: 4.3,  ry: 180},
      {x: 0.0,  z: -4.3, ry: 0},
      {x: -3.6, z: 1.5,  ry: 90},
      {x: -3.6, z: -1.5, ry: 90},
      {x: 3.6,  z: 1.5,  ry: -90},
      {x: 3.6,  z: -1.5, ry: -90},
    ];
    seats.forEach((s,i)=>{
      const c = document.createElement("a-box");
      set(c,"width","0.85");
      set(c,"height","0.95");
      set(c,"depth","0.85");
      set(c,"position", `${cx+s.x} 0.48 ${cz+s.z}`);
      set(c,"rotation", `0 ${s.ry} 0`);
      set(c,"material","color:#0e1016; metalness:0.55; roughness:0.35");
      scene.appendChild(c);

      const glow = document.createElement("a-ring");
      set(glow,"radius-inner","0.28");
      set(glow,"radius-outer","0.45");
      set(glow,"rotation","-90 0 0");
      set(glow,"position", `${cx+s.x} 0.02 ${cz+s.z}`);
      set(glow,"material","color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.8; opacity:0.55; transparent:true");
      scene.appendChild(glow);
    });

    // Back portal to lobby
    makePortal(scene, { id:"portal_back_lobby_1", position:`${cx} 0 ${cz+14}`, label:"BACK TO LOBBY", onEnter:()=>showRoom("lobby") });

    hudLog("Poker Pit Room ✅ built");
  }

  // ---------------- BUILD: STORE ROOM + BALCONY ----------------
  function buildStoreRoom(scene) {
    const cx=-ROOM_OFFSET, cz=0;

    const floor = document.createElement("a-circle");
    floor.classList.add("teleportable");
    set(floor,"radius","24");
    set(floor,"rotation","-90 0 0");
    set(floor,"position", `${cx} 0 ${cz}`);
    set(floor,"material","color:#070b10; roughness:1; metalness:0");
    scene.appendChild(floor);

    const wall = document.createElement("a-cylinder");
    set(wall,"radius","24");
    set(wall,"height","10");
    set(wall,"position", `${cx} 5 ${cz}`);
    set(wall,"material","color:#0a1422; side:double; roughness:1; metalness:0");
    scene.appendChild(wall);

    // Balcony platform
    const balcony = document.createElement("a-box");
    set(balcony,"width","18");
    set(balcony,"height","0.35");
    set(balcony,"depth","18");
    set(balcony,"position", `${cx} 6.2 ${cz}`);
    set(balcony,"material","color:#0b0f14; metalness:0.65; roughness:0.4");
    scene.appendChild(balcony);

    // Displays
    for (let i=0;i<6;i++){
      const x = cx - 10 + i*4;
      const stand = document.createElement("a-box");
      set(stand,"width","2.6");
      set(stand,"height","1.3");
      set(stand,"depth","1.2");
      set(stand,"position", `${x} 0.65 ${cz-8}`);
      set(stand,"material","color:#0b0f14; metalness:0.7; roughness:0.35");
      scene.appendChild(stand);

      const glow = document.createElement("a-plane");
      set(glow,"width","2.6");
      set(glow,"height","0.35");
      set(glow,"position", `${x} 1.45 ${cz-8.61}`);
      set(glow,"material","color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.4; opacity:0.75; transparent:true");
      scene.appendChild(glow);
    }

    const sign = document.createElement("a-text");
    set(sign,"value","SCARLETT STORE");
    set(sign,"align","center");
    set(sign,"color","#9ff");
    set(sign,"width","12");
    set(sign,"position", `${cx-3.5} 8.6 ${cz-10}`);
    scene.appendChild(sign);

    makePortal(scene, { id:"portal_back_lobby_2", position:`${cx} 0 ${cz+14}`, label:"BACK TO LOBBY", onEnter:()=>showRoom("lobby") });

    hudLog("Store Room ✅ built");
  }

  // ---------------- ROOM TOGGLE ----------------
  function showRoom(which) {
    if (which === "lobby") hardSpawn(SPAWN_LOBBY);
    if (which === "pokerpit") hardSpawn(SPAWN_POKER);
    if (which === "store") hardSpawn(SPAWN_STORE);
    hudLog(`ROOM ✅ ${which.toUpperCase()}`);
  }

  // ---------------- AUDIT REPORT ----------------
  function audit(scene) {
    const rig = q("rig");
    const cam = q("camera");
    const left = q("leftHand");
    const right = q("rightHand");
    const handsL = q("leftRealHand");
    const handsR = q("rightRealHand");

    const lines = [];
    lines.push("=== SCARLETT1 AUDIT ===");
    lines.push(`scene.loaded: ${scene.hasLoaded}`);
    lines.push(`rig: ${!!rig}  camera: ${!!cam}`);
    lines.push(`controllers: L=${!!left} R=${!!right}`);
    lines.push(`hands: L=${!!handsL} R=${!!handsR}`);
    lines.push(`movement-controls on rig: ${rig?.hasAttribute("movement-controls")}`);
    lines.push(`wasd-controls on camera: ${cam?.hasAttribute("wasd-controls")}`);
    lines.push("=======================");

    lines.forEach(hudLog);
  }

  // ---------------- BOOT ----------------
  AFRAME.registerComponent("scarlett-app", {
    init: function () {
      const scene = this.el.sceneEl;

      hudLog("A-FRAME loaded ✅");
      hudLog("Building complete world…");

      // Make it not-black void
      const sky = document.createElement("a-sky");
      sky.setAttribute("color", "#02040a");
      scene.appendChild(sky);

      // Overkill lights for each room center
      addOverkillLights(scene, 0, 0);
      addOverkillLights(scene, ROOM_OFFSET, 0);
      addOverkillLights(scene, -ROOM_OFFSET, 0);

      // Build rooms
      buildLobby(scene);
      buildPokerRoom(scene);
      buildStoreRoom(scene);

      // Controls
      enableControls(scene);

      // HARD spawn lobby (never pit)
      hardSpawn(SPAWN_LOBBY);

      scene.addEventListener("enter-vr", () => hudLog("ENTER VR ✅"));
      scene.addEventListener("exit-vr", () => hudLog("EXIT VR ✅"));

      setTimeout(() => audit(scene), 900);
      hudLog("BOOT COMPLETE ✅ (walk to portal pads)");
      hudLog("Portal pads: GO POKER PIT (right) | GO STORE (left)");
    }
  });

  hudLog("main.js loaded ✅");
})();
