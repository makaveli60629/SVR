(function () {
  function safe(fn) {
    try { fn(); } catch (e) {
      if (window.hudLog) window.hudLog("ERR: " + (e.message || e));
      console.error(e);
    }
  }

  function togglePit(pit, lobby, btn, labelEl) {
    const isPit = pit.getAttribute("visible") === true || pit.getAttribute("visible") === "true";

    if (!isPit) {
      pit.setAttribute("visible", "true");
      lobby.setAttribute("visible", "false");
      hudSetTop("Poker Pit ✅");
      hudLog("Pit ON (table + seats + bots + jumbotron)");
      if (btn) btn.textContent = "Back To Lobby";
      if (labelEl) labelEl.setAttribute("value", "BACK TO LOBBY");
    } else {
      pit.setAttribute("visible", "false");
      lobby.setAttribute("visible", "true");
      hudSetTop("Lobby ✅");
      hudLog("Lobby ON");
      if (btn) btn.textContent = "Enter Poker Pit";
      if (labelEl) labelEl.setAttribute("value", "ENTER POKER PIT");
    }
  }

  // --- XR Thumbstick Move + Turn (Quest-safe) ---
  // Uses controller axismove events and moves the rig in world-space.
  AFRAME.registerComponent("svr-xr-locomotion", {
    schema: {
      moveSpeed: { default: 2.0 },   // meters/sec
      turnSpeed: { default: 1.8 },   // radians/sec
      deadzone:  { default: 0.12 },
      smoothTurn:{ default: true }   // smooth yaw; set false later for snap
    },

    init: function () {
      // axis data
      this.leftAxis  = [0, 0];
      this.rightAxis = [0, 0];

      this._tmpDir   = new THREE.Vector3();
      this._tmpRight = new THREE.Vector3();
      this._up       = new THREE.Vector3(0, 1, 0);

      const left  = document.getElementById("leftHand");
      const right = document.getElementById("rightHand");

      // On Quest:
      // - left stick commonly used for move (x,y)
      // - right stick commonly used for turn (x) (and sometimes move)
      if (left) {
        left.addEventListener("axismove", (e) => {
          const a = e.detail.axis || [];
          // many controllers: x=a[2], y=a[3]
          this.leftAxis[0] = a[2] || 0;
          this.leftAxis[1] = a[3] || 0;
        });
      }

      if (right) {
        right.addEventListener("axismove", (e) => {
          const a = e.detail.axis || [];
          this.rightAxis[0] = a[2] || 0;
          this.rightAxis[1] = a[3] || 0;
        });
      }

      hudLog("XR locomotion armed ✅ (left stick move, right stick turn)");
    },

    tick: function (t, dt) {
      const scene = this.el.sceneEl;
      if (!scene || !scene.is("vr-mode")) return;

      const ms = (dt || 16) / 1000;

      // READ AXES
      let mx = this.leftAxis[0];
      let my = this.leftAxis[1];

      // If left axis not reporting on a device, fall back to right axis for movement
      if (Math.abs(mx) < 0.0001 && Math.abs(my) < 0.0001) {
        mx = this.rightAxis[0];
        my = this.rightAxis[1];
      }

      // TURN (right stick X)
      const tx = this.rightAxis[0];

      // DEADZONE
      const dz = this.data.deadzone;
      if (Math.abs(mx) < dz) mx = 0;
      if (Math.abs(my) < dz) my = 0;

      let turn = tx;
      if (Math.abs(turn) < dz) turn = 0;

      // --- APPLY TURN ---
      if (turn !== 0) {
        const yawDelta = (-turn) * this.data.turnSpeed * ms;
        this.el.object3D.rotation.y += yawDelta;
      }

      // --- APPLY MOVE (relative to camera forward) ---
      if (mx === 0 && my === 0) return;

      const cam = document.getElementById("camera");
      if (!cam) return;

      // camera forward (world)
      cam.object3D.getWorldDirection(this._tmpDir);
      this._tmpDir.y = 0;
      this._tmpDir.normalize();

      // right vector
      this._tmpRight.crossVectors(this._tmpDir, this._up).normalize();

      const speed = this.data.moveSpeed;

      // Note: forward is -my (Quest stick up is negative)
      this.el.object3D.position.addScaledVector(this._tmpDir, (-my) * speed * ms);
      this.el.object3D.position.addScaledVector(this._tmpRight, (mx) * speed * ms);
    }
  });

  function createInWorldButtonAttachToCamera(cameraEl, pit, lobby, btn) {
    // prevent duplicates
    if (document.getElementById("vrPitPanel")) return;

    const panel = document.createElement("a-entity");
    panel.setAttribute("id", "vrPitPanel");
    panel.setAttribute("position", "0 -0.15 -0.85");

    const bg = document.createElement("a-plane");
    bg.setAttribute("width", "1.05");
    bg.setAttribute("height", "0.25");
    bg.setAttribute("material", "color:#0b0f14; opacity:0.78; transparent:true");
    panel.appendChild(bg);

    const label = document.createElement("a-text");
    label.setAttribute("value", "ENTER POKER PIT");
    label.setAttribute("align", "center");
    label.setAttribute("color", "#9ff");
    label.setAttribute("width", "2.6");
    label.setAttribute("position", "0 0 0.01");
    panel.appendChild(label);

    panel.classList.add("clickable");
    panel.addEventListener("click", () => togglePit(pit, lobby, btn, label));

    cameraEl.appendChild(panel);
    hudLog("VR Pit panel ✅");
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

    hudSetTop("Scarlett1 A-Frame booting…");
    hudLog("A-Frame loaded ✅");
    hudLog("Quest SAFE XR mode ✅");

    scene.addEventListener("loaded", () => {
      hudSetTop("Scene loaded ✅");
      hudLog("Android: HTML button works.");
      hudLog("Quest: VR panel + locomotion activates on enter-vr.");

      if (btn) btn.addEventListener("click", () => togglePit(pit, lobby, btn, null));

      scene.addEventListener("enter-vr", () => {
        hudLog("enter-vr ✅");

        // Attach locomotion AFTER VR starts (prevents loader hang)
        rig.setAttribute("svr-xr-locomotion", "moveSpeed:2.1; turnSpeed:1.9; deadzone:0.12");

        // VR pit panel always visible
        createInWorldButtonAttachToCamera(cameraEl, pit, lobby, btn);

        hudLog("Move: LEFT stick. Turn: RIGHT stick.");
      });
    });
  }

  window.addEventListener("DOMContentLoaded", () => safe(boot));
})();
