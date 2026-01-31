function parseVec3(str) {
  const [x,y,z] = str.split(" ").map(Number);
  return {x,y,z};
}

window.makeSpawnPad = function(scene, opts) {
  const pad = document.createElement("a-entity");
  pad.setAttribute("id", opts.id);
  pad.setAttribute("position", opts.position || "0 0 0");
  pad.setAttribute("rotation", opts.rotation || "0 0 0");
  pad.setAttribute("visible", opts.visible === false ? "false" : "true");
  scene.appendChild(pad);

  // Optional ring (debug)
  if (opts.visible !== false) {
    const ring = document.createElement("a-ring");
    ring.setAttribute("radius-inner", "0.35");
    ring.setAttribute("radius-outer", "0.55");
    ring.setAttribute("rotation", "-90 0 0");
    ring.setAttribute("position", "0 0.02 0");
    ring.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.6; transparent:true");
    pad.appendChild(ring);
  }
  return pad;
};

window.safeSpawnToPad = function(padId) {
  const rig = document.getElementById("rig");

  let tries = 0;
  const MAX = 40; // ~4 seconds

  const tick = () => {
    tries++;
    const pad = document.getElementById(padId);

    // Must exist + have object3D ready
    if (!rig || !pad || !pad.object3D) {
      if (tries < MAX) return setTimeout(tick, 100);
      window.hudLog && hudLog(`Spawn FAIL ❌ rig=${!!rig} pad=${padId}`);
      return;
    }

    const p = pad.object3D.position;
    const r = pad.getAttribute("rotation") || {x:0,y:0,z:0};

    rig.setAttribute("position", `${p.x} ${p.y} ${p.z}`);
    rig.setAttribute("rotation", `0 ${r.y || 0} 0`);

    window.hudLog && hudLog(`Spawned ✅ -> ${padId}`);
  };

  tick();
};

window.makePortalPad = function(scene, cfg) {
  const parent = cfg.roomId ? document.getElementById(cfg.roomId) : scene;
  if (!parent) return;

  const pad = document.createElement("a-entity");
  pad.setAttribute("id", cfg.id);
  pad.setAttribute("position", cfg.position || "0 0 0");
  parent.appendChild(pad);

  const disc = document.createElement("a-ring");
  disc.classList.add("teleportable");
  disc.setAttribute("radius-inner", "0.55");
  disc.setAttribute("radius-outer", "0.90");
  disc.setAttribute("rotation", "-90 0 0");
  disc.setAttribute("position", "0 0.02 0");
  disc.setAttribute("material", "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.4; opacity:0.55; transparent:true");
  pad.appendChild(disc);

  const t = document.createElement("a-text");
  t.setAttribute("value", cfg.label || "PORTAL");
  t.setAttribute("align", "center");
  t.setAttribute("color", "#9ff");
  t.setAttribute("width", "6");
  t.setAttribute("position", "-1.4 1.2 0");
  pad.appendChild(t);

  // Enter detection (stand in it)
  const rig = document.getElementById("rig");
  const R = 0.95;

  const loop = () => {
    requestAnimationFrame(loop);
    if (!rig || !pad.object3D || !rig.object3D) return;

    // Only active if parent room visible
    if (cfg.roomId) {
      const room = document.getElementById(cfg.roomId);
      if (!room || room.getAttribute("visible") === false) return;
    }

    const rp = rig.object3D.position;
    const pp = pad.object3D.position;
    const dx = rp.x - pp.x;
    const dz = rp.z - pp.z;
    if ((dx*dx + dz*dz) < (R*R)) {
      cfg.onEnter && cfg.onEnter();
    }
  };
  loop();

  return pad;
};
