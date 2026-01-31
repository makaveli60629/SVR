(function () {
  function safe(fn) {
    try { fn(); } catch (e) {
      if (window.hudLog) window.hudLog("ERR: " + (e.message || e));
      console.error(e);
    }
  }

  // --------- PIT / LOBBY TOGGLE ----------
  function setMode(mode, pit, lobby, btn, labelEl) {
    const isPit = (mode === "pit");

    pit.setAttribute("visible", isPit ? "true" : "false");
    lobby.setAttribute("visible", isPit ? "false" : "true");

    if (btn) btn.textContent = isPit ? "Back To Lobby" : "Enter Poker Pit";
    if (labelEl) labelEl.setAttribute("value", isPit ? "BACK TO LOBBY" : "ENTER POKER PIT");

    if (window.hudSetTop) hudSetTop(isPit ? "Poker Pit ✅" : "Lobby ✅");
    if (window.hudLog) hudLog(isPit ? "Pit ON" : "Lobby ON");

    // Show VR panel only in lobby (so it's not in your face in pit)
    const panel = document.getElementById("vrPitPanel");
    if (panel) panel.setAttribute("visible", isPit ? "false" : "true");

    // Show teleport pads only in pit (optional)
    const pads = document.getElementById("teleportPads");
    if (pads) pads.setAttribute("visible", isPit ? "true" : "false");
  }

  function toggleMode(pit, lobby, btn, labelEl) {
    const isPit = pit.getAttribute("visible") === true || pit.getAttribute("visible") === "true";
    setMode(isPit ? "lobby" : "pit", pit, lobby, btn, labelEl);
  }

  // --------- XR LOCOMOTION (FIXED INVERSION) ----------
  // Left stick: move (forward/back + strafe)
  // Right stick: smooth yaw turn (left/right)
  AFRAME.registerComponent("svr-xr-locomotion", {
    schema: {
      moveSpeed: { default: 2.1 },
      turnSpeed: { default: 1.9 },
      deadzone:  { default: 0.12 }
    },

    init: function () {
      this.leftAxis  = [0, 0];
      this.rightAxis = [0, 0];

      this._fwd   = new THREE.Vector3();
      this._right = new THREE.Vector3();
      this._up    = new THREE.Vector3(0, 1, 0);

      const left  = document.getElementById("leftHand");
      const right = document.getElementById("rightHand");

      if (left) {
        left.addEventListener("axismove", (e) => {
          const a = e.detail.axis || [];
          // Quest typical: x=a[2], y=a[3]
          this.leftAxis[0] = a[2] || 0; // strafe
          this.leftAxis[1] = a[3] || 0; // forward/back
        });
      }

      if (right) {
        right.addEventListener("axismove", (e) => {
          const a = e.detail.axis || [];
          this.rightAxis[0] = a[2] || 0; // turn
          this.rightAxis[1] = a[3] || 0;
        });
      }

      hudLog("XR locomotion ✅ (fixed inversion)");
    },

    tick: function (t, dt) {
      const scene = this.el.sceneEl;
      if (!scene || !scene.is("vr-mode")) return;

      const ms = (dt || 16) / 1000;
      const dz = this.data.deadzone;

      // Movement (LEFT stick)
      let mx = this.leftAxis[0];
      let my = this.leftAxis[1];

      if (Math.abs(mx) < dz) mx = 0;
      if (Math.abs(my) < dz) my = 0;

      // Turn (RIGHT stick X)
      let turn = this.rightAxis[0];
      if (Math.abs(turn) < dz) turn = 0;

      // Apply smooth turn
      if (turn !== 0) {
        const yawDelta = (-turn) * this.data.turnSpeed * ms;
        this.el.object3D.rotation.y += yawDelta;
      }

      if (mx === 0 && my === 0) return;

      // Direction based on camera forward
      const cam = document.getElementById("camera");
      if (!cam) return;

      cam.object3D.getWorldDirection(this._fwd);
      this._fwd.y = 0;
      this._fwd.normalize();

      this._right.crossVectors(this._fwd, this._up).normalize();

      // ✅ FIXED INVERSION:
      // - Forward should be forward: use (+my) instead of (-my)
      // - Left/right should be correct: use (+mx) but invert if needed.
      const speed = this.data.moveSpeed;

      this.el.object3D.position.addScaledVector(this._fwd, (my) * speed * ms);
      this.el.object3D.position.addScaledVector(this._right, (mx) * speed * ms);
    }
  });

  // --------- TELEPORT PADS + TELEPORT CLICK ----------
  // We make a few pads around pit. Click pad with laser to teleport rig there.
  AFRAME.registerComponent("svr-teleport-pad", {
    schema: { x:{default:0}, y:{default:0}, z:{default:0} },
    init: function () {
      this.el.classList.add("clickable");
      this.el.addEventListener("click", () => {
        const rig = document.getElementById("rig");
        if (!rig) return;
        rig.setAttribute("position", `${this.data.x} ${this.data.y} ${this.data.z}`);
        hudLog(`Teleported to: ${this.data.x.toFixed(1)}, ${this.data.z.toFixed(1)} ✅`);
      });
    }
  });

  function buildTeleportPads(scene) {
    if (document.getElementById("teleportPads")) return;

    const pads = document.createElement("a-entity");
    pads.setAttribute("id", "teleportPads");
    pads.setAttribute("visible", "false"); // only in pit

    // Positions around the table (adjust anytime)
    const points = [
      { x: 0,   y: 0, z: 6.0  }, // front
      { x: 0,   y: 0, z: -6.0 }, // back
      { x: 6.0, y: 0, z: 0    }, // right
      { x:-6.0, y: 0, z: 0    }, // left
      { x: 0,   y: 0, z: 3.8  }, // closer front
    ];

    points.forEach((p) => {
      const ring = document.createElement("a-ring");
      ring.setAttribute("radius-inner", "0.35");
      ring.setAttribute("radius-outer", "0.55");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("position", `${p.x} 0.02 ${p.z}`);
      ring.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.85; transparent:true");
      ring.setAttribute("svr-teleport-pad", `x:${p.x}; y:${p.y}; z:${p.z}`);
      pads.appendChild(ring);
    });

    scene.appendChild(pads);
    hudLog("Teleport pads ready ✅ (laser-click rings)");
  }

  // --------- VR PIT PANEL (NOT IN YOUR FACE) ----------
  function createVrPanel(cameraEl, pit, lobby, btn) {
    if (document.getElementById("vrPitPanel")) return;

    const panel = document.createElement("a-entity");
    panel.setAttribute("id", "vrPitPanel");
    // moved farther + slightly lower so it’s not “in your face”
    panel.setAttribute("position", "0 -0.35 -1.25");
    panel.setAttribute("visible", "true");

    const bg = document.createElement("a-plane");
    bg.setAttribute("width", "1.05");
    bg.setAttribute("height", "0.25");
    bg.setAttribute("material", "color:#0b0f14; opacity:0.65; transparent:true");
    panel.appendChild(bg);

    const label = document.createElement("a-text");
    label.setAttribute("value", "ENTER POKER PIT");
    label.setAttribute("align", "center");
    label.setAttribute("color", "#9ff");
    label.setAttribute("width", "2.6");
    label.setAttribute("position", "0 0 0.01");
    panel.appendChild(label);

    panel.classList.add("clickable");
    panel.addEventListener("click", () => toggleMode(pit, lobby, btn, label));

    cameraEl.appendChild(panel);
    hudLog("VR panel ready ✅ (only shows in lobby)");
  }

  function boot() {
    const scene = document.querySelector("a-scene");
    const pit = document.getElementById("pitRoot");
    const lobby = document.getElementById("lobbyRoot");
    const btn = document.getElementById("btnPit");
    const rig = document.getElementById("rig");
    const cameraEl = document.getElementById("camera");

    if (!scene || !pit || !lobby || !rig || !cameraEl) {
      setTimeout(boot, 60);
      return;
    }

    hudSetTop("Scarlett1 booting…");
    hudLog("A-Frame loaded ✅");

    scene.addEventListener("loaded", () => {
      hudSetTop("Scene loaded ✅");

      // DOM button (Android)
      if (btn) btn.addEventListener("click", () => toggleMode(pit, lobby, btn, null));

      // Build teleport pads now (hidden until pit)
      buildTeleportPads(scene);

      // Start in lobby
      setMode("lobby", pit, lobby, btn, null);

      scene.addEventListener("enter-vr", () => {
        hudLog("enter-vr ✅");

        // Enable locomotion after XR starts
        rig.setAttribute("svr-xr-locomotion", "moveSpeed:2.1; turnSpeed:1.9; deadzone:0.12");

        // VR panel (only lobby)
        createVrPanel(cameraEl, pit, lobby, btn);

        hudLog("Move: LEFT stick. Turn: RIGHT stick. Teleport: click floor rings.");
      });
    });
  }

  window.addEventListener("DOMContentLoaded", () => safe(boot));
})();
