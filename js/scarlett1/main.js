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

  // Simple thumbstick locomotion (XR only)
  AFRAME.registerComponent("svr-thumbstick-move", {
    schema: { speed: { default: 1.6 } },
    init: function () {
      this.axis = [0, 0];
      const rig = this.el;
      const right = document.getElementById("rightHand");
      if (!right) return;

      right.addEventListener("axismove", (e) => {
        const a = e.detail.axis || [];
        // Usually: a[2]=x, a[3]=y on Quest
        this.axis[0] = a[2] || 0;
        this.axis[1] = a[3] || 0;
      });

      hudLog("XR locomotion ready (thumbstick) ✅");
    },
    tick: function (t, dt) {
      // Only move while in VR
      const scene = this.el.sceneEl;
      if (!scene || !scene.is("vr-mode")) return;

      const ms = (dt || 16) / 1000;
      const x = this.axis[0];
      const y = this.axis[1];
      if (Math.abs(x) < 0.08 && Math.abs(y) < 0.08) return;

      const cam = document.getElementById("camera");
      if (!cam) return;

      const dir = new THREE.Vector3();
      cam.object3D.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();

      const rightVec = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

      const speed = this.data.speed;
      const move = new THREE.Vector3();
      move.addScaledVector(dir, -y * speed * ms);
      move.addScaledVector(rightVec, x * speed * ms);

      this.el.object3D.position.add(move);
    }
  });

  function createInWorldButtonAttachToCamera(cameraEl, pit, lobby, btn) {
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
    hudLog("VR Pit panel attached to camera ✅ (always visible)");
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
    hudLog("Quest SAFE XR mode ✅ (no movement-controls on rig)");

    scene.addEventListener("loaded", () => {
      hudSetTop("Scene loaded ✅");
      hudLog("Android: top-right button works.");
      hudLog("Quest: VR panel will appear when VR starts.");

      // Wire DOM button if present (Android)
      if (btn) {
        btn.addEventListener("click", () => togglePit(pit, lobby, btn, null));
      }

      // XR events
      scene.addEventListener("enter-vr", () => {
        hudLog("enter-vr event ✅");

        // Add locomotion only AFTER XR starts (prevents loader hang)
        rig.setAttribute("svr-thumbstick-move", "speed: 1.7");

        // Create VR panel (clickable) attached to camera
        createInWorldButtonAttachToCamera(cameraEl, pit, lobby, btn);
      });

      // XR watchdog: if user presses Enter VR and it hangs, we’ll see no enter-vr event.
      // We log a message so you know it’s XR handshake/caching, not your world.
      let vrRequested = false;
      const vrBtn = document.querySelector(".a-enter-vr-button");
      if (vrBtn) {
        vrBtn.addEventListener("click", () => {
          vrRequested = true;
          hudLog("VR requested… if it hangs, clear Quest cache once.");
          setTimeout(() => {
            if (vrRequested && !scene.is("vr-mode")) {
              hudLog("VR HANG DETECTED: likely Quest cache / XR handshake.");
              hudLog("Fix: Quest Browser → Clear Cache, then reload.");
            }
          }, 2500);
        });
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => safe(boot));
})();
