// /js/scarlett1/modules/spawnpads.js
// Pads control ALL spawns.

(function () {
  const PAD_ATTR = "scarlett-spawnpad";

  window.makeSpawnPad = function makeSpawnPad(parent, opts) {
    const {
      id,
      position = "0 0 0",
      rotation = "0 0 0",
      label = "",
      visible = false
    } = opts;

    const pad = document.createElement("a-entity");
    pad.setAttribute("id", id);
    pad.setAttribute("position", position);
    pad.setAttribute("rotation", rotation);
    pad.setAttribute(PAD_ATTR, "");
    parent.appendChild(pad);

    const ring = document.createElement("a-ring");
    ring.classList.add("teleportable");
    ring.setAttribute("radius-inner", "0.9");
    ring.setAttribute("radius-outer", "1.25");
    ring.setAttribute("rotation", "-90 0 0");
    ring.setAttribute("position", "0 0.03 0");
    ring.setAttribute("material",
      "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.4; opacity:0.55; transparent:true"
    );
    ring.setAttribute("visible", visible ? "true" : "false");
    pad.appendChild(ring);

    if (label) {
      const t = document.createElement("a-text");
      t.setAttribute("value", label);
      t.setAttribute("align", "center");
      t.setAttribute("color", "#bff");
      t.setAttribute("width", "8");
      t.setAttribute("position", "0 1.15 0");
      t.setAttribute("visible", visible ? "true" : "false");
      pad.appendChild(t);
    }

    return pad;
  };

  window.spawnToPad = function spawnToPad(padId, reason = "") {
    const rig = document.getElementById("rig");
    const cam = document.getElementById("camera");
    const pad = document.getElementById(padId);
    if (!rig || !pad) {
      if (window.hudLog) hudLog(`spawnToPad FAIL ❌ rig=${!!rig} pad=${padId}`);
      return false;
    }

    const p = pad.object3D.getWorldPosition(new THREE.Vector3());
    const r = pad.getAttribute("rotation") || { x: 0, y: 0, z: 0 };

    rig.setAttribute("position", `${p.x} ${p.y + 1.65} ${p.z}`);
    rig.setAttribute("rotation", `${r.x || 0} ${r.y || 0} ${r.z || 0}`);
    if (cam) cam.setAttribute("position", "0 0 0");

    if (window.hudLog) hudLog(`Spawned ✅ -> ${padId}${reason ? " (" + reason + ")" : ""}`);
    return true;
  };

  AFRAME.registerComponent("scarlett-spawn-system", {
    schema: {
      defaultPad: { default: "pad_lobby_safe" },
      lockSeconds: { default: 2.5 }
    },
    init() {
      this.t0 = performance.now();
      this.did = false;

      this.el.sceneEl.addEventListener("loaded", () => {
        setTimeout(() => {
          window.spawnToPad(this.data.defaultPad, "default");
          this.did = true;
        }, 150);
      });
    },
    tick() {
      if (!this.did) return;
      const elapsed = (performance.now() - this.t0) / 1000;
      if (elapsed > this.data.lockSeconds) return;

      // If some module forces you near pit center, pull you back to safe pad.
      const rig = document.getElementById("rig");
      if (!rig) return;
      const pos = rig.getAttribute("position") || { x: 0, y: 0, z: 0 };
      const nearPit = Math.hypot(pos.x || 0, pos.z || 0) < 7.5;
      if (nearPit) window.spawnToPad(this.data.defaultPad, "anti-pit-lock");
    }
  });
})();
