/*  SCARLETT1 SAFE BOOT main.js  (NO IMPORTS)
    Purpose: eliminate “nothing loads” failures.
    - No module imports
    - Strong HUD logging + error capture
    - Builds lobby + pit + lighting
    - Teleport + Smooth move
*/

(function () {
  // ---------- HUD ----------
  const hudEl = () => document.getElementById("hud");
  window.hudLog = function (msg) {
    const el = hudEl();
    if (!el) return;
    const now = new Date();
    const t = now.toLocaleTimeString();
    el.textContent += `\n[${t}] ${msg}`;
  };

  // Catch errors and show on screen (critical on Quest)
  window.addEventListener("error", (e) => {
    window.hudLog(`❌ ERROR: ${e.message || e.type}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    window.hudLog(`❌ PROMISE: ${e.reason?.message || e.reason || "unknown"}`);
  });

  // ---------- A-Frame guard ----------
  if (!window.AFRAME) {
    const el = hudEl();
    if (el) el.textContent += "\n❌ AFRAME missing (CDN not loaded)";
    return;
  }

  // ---------- Helpers ----------
  function q(id) { return document.getElementById(id); }

  function setAttr(el, name, value) {
    try { el.setAttribute(name, value); } catch (_) {}
  }

  function makeLight(scene) {
    // Make it BRIGHT (your current issue)
    const amb = document.createElement("a-entity");
    setAttr(amb, "light", "type: ambient; intensity: 1.15; color: #ffffff");
    scene.appendChild(amb);

    const hemi = document.createElement("a-entity");
    setAttr(hemi, "light", "type: hemisphere; intensity: 1.0; color: #ffffff; groundColor: #334455");
    setAttr(hemi, "position", "0 20 0");
    scene.appendChild(hemi);

    // 8 pillar-point lights around circle
    const R = 14;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const lx = Math.cos(a) * R;
      const lz = Math.sin(a) * R;

      const p = document.createElement("a-entity");
      setAttr(p, "light", "type: point; intensity: 1.4; distance: 60; decay: 2; color: #c8ffff");
      setAttr(p, "position", `${lx} 6 ${lz}`);
      scene.appendChild(p);
    }

    // Spotlight toward center
    const spot = document.createElement("a-entity");
    setAttr(spot, "light", "type: spot; intensity: 2.2; angle: 38; penumbra: 0.4; distance: 80; color: #ffffff");
    setAttr(spot, "position", "0 18 10");
    setAttr(spot, "rotation", "-60 0 0");
    scene.appendChild(spot);

    hudLog("Lighting loaded ✅ (bright)");
  }

  function makeLobby(scene) {
    // Sky so it’s not black void
    const sky = document.createElement("a-sky");
    setAttr(sky, "color", "#01040a");
    scene.appendChild(sky);

    // Outer lobby ring floor
    const ring = document.createElement("a-ring");
    ring.classList.add("teleportable");
    setAttr(ring, "radius-inner", "10.5");
    setAttr(ring, "radius-outer", "18.0");
    setAttr(ring, "rotation", "-90 0 0");
    setAttr(ring, "position", "0 0.01 0");
    setAttr(ring, "material", "color:#07111a; roughness:1; metalness:0;");
    scene.appendChild(ring);

    // Walls (twice as high)
    const wall = document.createElement("a-cylinder");
    setAttr(wall, "radius", "18.2");
    setAttr(wall, "height", "12"); // 2x height feel
    setAttr(wall, "position", "0 6 0");
    setAttr(wall, "material", "color:#05070c; side:double; roughness:1; metalness:0;");
    scene.appendChild(wall);

    // Pillars + neon
    const PR = 16.2;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const x = Math.cos(a) * PR;
      const z = Math.sin(a) * PR;

      const pillar = document.createElement("a-cylinder");
      setAttr(pillar, "radius", "0.35");
      setAttr(pillar, "height", "10");
      setAttr(pillar, "position", `${x} 5 ${z}`);
      setAttr(pillar, "material", "color:#0b0f14; metalness:0.6; roughness:0.35");
      scene.appendChild(pillar);

      const neon = document.createElement("a-torus");
      setAttr(neon, "radius", "0.55");
      setAttr(neon, "radius-tubular", "0.06");
      setAttr(neon, "rotation", "90 0 0");
      setAttr(neon, "position", `${x} 2 ${z}`);
      setAttr(neon, "material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:2.2; opacity:0.9; transparent:true");
      scene.appendChild(neon);
    }

    // Center neon ring
    const centerNeon = document.createElement("a-torus");
    setAttr(centerNeon, "radius", "8.2");
    setAttr(centerNeon, "radius-tubular", "0.08");
    setAttr(centerNeon, "rotation", "-90 0 0");
    setAttr(centerNeon, "position", "0 0.03 0");
    setAttr(centerNeon, "material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:2.0; opacity:0.8; transparent:true");
    scene.appendChild(centerNeon);

    // Label (NOT attached to camera — will not block your face)
    const t = document.createElement("a-text");
    setAttr(t, "value", "SCARLETT LOBBY");
    setAttr(t, "align", "center");
    setAttr(t, "color", "#9ff");
    setAttr(t, "width", "12");
    setAttr(t, "position", "0 3 -8");
    scene.appendChild(t);

    hudLog("Lobby created ✅");
  }

  function makeDeepPit(scene) {
    const PIT_RADIUS = 8.0;
    const PIT_DEPTH = 10.0;
    const PIT_FLOOR_Y = -PIT_DEPTH;

    // Pit lip
    const pitLip = document.createElement("a-ring");
    setAttr(pitLip, "radius-inner", (PIT_RADIUS + 0.2).toFixed(2));
    setAttr(pitLip, "radius-outer", (PIT_RADIUS + 0.9).toFixed(2));
    setAttr(pitLip, "rotation", "-90 0 0");
    setAttr(pitLip, "position", "0 0.02 0");
    setAttr(pitLip, "material", "color:#0b0f14; metalness:0.7; roughness:0.35;");
    scene.appendChild(pitLip);

    // Inner wall (open top)
    const pitWall = document.createElement("a-cylinder");
    setAttr(pitWall, "radius", PIT_RADIUS.toFixed(2));
    setAttr(pitWall, "height", PIT_DEPTH.toFixed(2));
    setAttr(pitWall, "position", `0 ${(PIT_FLOOR_Y / 2).toFixed(2)} 0`);
    setAttr(pitWall, "material", "color:#020308; side:double; roughness:1; metalness:0;");
    scene.appendChild(pitWall);

    // Pit floor
    const pitFloor = document.createElement("a-circle");
    pitFloor.classList.add("teleportable");
    setAttr(pitFloor, "radius", (PIT_RADIUS - 0.4).toFixed(2));
    setAttr(pitFloor, "rotation", "-90 0 0");
    setAttr(pitFloor, "position", `0 ${PIT_FLOOR_Y.toFixed(2)} 0`);
    setAttr(pitFloor, "material", "color:#05070c; roughness:1; metalness:0;");
    scene.appendChild(pitFloor);

    // Simple 8-seat “showcase table placeholder” in pit (so you SEE something)
    const table = document.createElement("a-cylinder");
    setAttr(table, "radius", "2.2");
    setAttr(table, "height", "0.22");
    setAttr(table, "position", `0 ${(PIT_FLOOR_Y + 1.0).toFixed(2)} 0`);
    setAttr(table, "material", "color:#101827; roughness:0.9; metalness:0.05");
    scene.appendChild(table);

    const felt = document.createElement("a-circle");
    setAttr(felt, "radius", "1.95");
    setAttr(felt, "rotation", "-90 0 0");
    setAttr(felt, "position", `0 ${(PIT_FLOOR_Y + 1.12).toFixed(2)} 0`);
    setAttr(felt, "material", "color:#07111a; roughness:1; metalness:0;");
    scene.appendChild(felt);

    hudLog("Deep pit created ✅");
  }

  function ensureSafeSpawn() {
    const rig = q("rig");
    const cam = q("camera");
    if (!rig || !cam) return;

    // Spawn on lobby ring (safe)
    rig.object3D.position.set(0, 0, 16);
    rig.object3D.rotation.set(0, 0, 0);

    hudLog("Spawned ✅ (lobby safe)");
  }

  function enableTeleportAndMove() {
    const rig = q("rig");
    const left = q("leftHand");
    const right = q("rightHand");
    if (!rig || !left || !right) return;

    function teleportFrom(hand) {
      const rc = hand.components.raycaster;
      if (!rc) return;
      const hits = rc.intersections || [];
      if (!hits.length) return;
      const hit = hits[0];
      const p = hit.point;
      // Move rig to point (keep y)
      rig.object3D.position.set(p.x, 0, p.z);
      hudLog(`Teleported ✅ (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
    }

    // Teleport on triggerdown
    left.addEventListener("triggerdown", () => teleportFrom(left));
    right.addEventListener("triggerdown", () => teleportFrom(right));

    // Smooth move on left thumbstick
    let vx = 0, vz = 0;
    left.addEventListener("thumbstickmoved", (e) => {
      const x = e.detail.x || 0;
      const y = e.detail.y || 0;
      // y forward/back, x strafe
      vx = x;
      vz = y;
    });

    // Per-frame movement
    const scene = document.querySelector("a-scene");
    scene.addEventListener("loaded", () => {
      scene.addEventListener("tick", () => {
        // small deadzone
        const dx = Math.abs(vx) < 0.12 ? 0 : vx;
        const dz = Math.abs(vz) < 0.12 ? 0 : vz;
        if (!dx && !dz) return;

        // Move relative to camera yaw
        const cam = q("camera");
        if (!cam) return;
        const yaw = cam.object3D.rotation.y;

        const speed = 0.06; // Quest friendly
        const sx = (Math.cos(yaw) * dx - Math.sin(yaw) * dz) * speed;
        const sz = (Math.sin(yaw) * dx + Math.cos(yaw) * dz) * speed;

        rig.object3D.position.x += sx;
        rig.object3D.position.z += sz;
      });
    });

    hudLog("Teleport + smooth move ready ✅");
  }

  // ---------- App Component ----------
  AFRAME.registerComponent("scarlett-app", {
    init: function () {
      const scene = this.el.sceneEl;
      hudLog("A-FRAME loaded ✅");
      hudLog("Scarlett1 booting…");

      // Build world
      makeLight(scene);
      makeLobby(scene);
      makeDeepPit(scene);

      // Controls
      ensureSafeSpawn();
      enableTeleportAndMove();

      // Confirm VR events
      scene.addEventListener("enter-vr", () => hudLog("Entered VR ✅"));
      scene.addEventListener("exit-vr", () => hudLog("Exited VR ✅"));

      hudLog("Boot complete ✅ (if you see lobby + pit, we’re good)");
    }
  });

  // Final proof main.js executed
  hudLog("main.js loaded ✅");
})();
