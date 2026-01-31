// Scarlett1 Main (A-Frame, Quest-safe, no crashes)
(function () {
  function safe(fn) {
    try { fn(); } catch (e) {
      if (window.hudLog) window.hudLog("ERR: " + (e.message || e));
      console.error(e);
    }
  }

  function boot() {
    const scene = document.querySelector("a-scene");
    const pit = document.getElementById("pitRoot");
    const lobby = document.getElementById("lobbyRoot");
    const btn = document.getElementById("btnPit");

    if (!scene) {
      setTimeout(boot, 50);
      return;
    }

    hudSetTop("Scarlett1 A-Frame booting…");
    hudLog("A-Frame loaded ✅");
    hudLog("Quest ready ✅ (CDN only)");

    // Ensure scene is actually ready before wiring anything (Quest needs this)
    scene.addEventListener("loaded", () => {
      hudSetTop("Scene loaded ✅");

      // If DOM button exists (Android / flat), wire it
      if (btn) {
        hudLog("Found DOM Pit button ✅");
        btn.addEventListener("click", () => togglePit(pit, lobby, btn));
      } else {
        hudLog("DOM Pit button not found (VR). Creating in-world button…");
        createInWorldButton(scene, pit, lobby);
      }
    });
  }

  function togglePit(pit, lobby, btn) {
    const isPit = pit.getAttribute("visible") === true || pit.getAttribute("visible") === "true";

    if (!isPit) {
      pit.setAttribute("visible", "true");
      lobby.setAttribute("visible", "false");
      hudSetTop("Poker Pit ✅");
      hudLog("Pit ON (table + seats + bots + jumbotron)");
      if (btn) btn.textContent = "Back To Lobby";
    } else {
      pit.setAttribute("visible", "false");
      lobby.setAttribute("visible", "true");
      hudSetTop("Lobby ✅");
      hudLog("Lobby ON");
      if (btn) btn.textContent = "Enter Poker Pit";
    }
  }

  // Creates a clickable VR button inside the world (laser-clickable)
  function createInWorldButton(scene, pit, lobby) {
    // Make sure rig exists
    const rig = document.getElementById("rig");
    const parent = rig || scene;

    // Panel
    const panel = document.createElement("a-entity");
    panel.setAttribute("id", "vrPitPanel");
    panel.setAttribute("position", "0 1.45 -1.25");  // in front of player
    panel.setAttribute("rotation", "0 0 0");

    const bg = document.createElement("a-plane");
    bg.setAttribute("width", "0.95");
    bg.setAttribute("height", "0.22");
    bg.setAttribute("material", "color:#0b0f14; opacity:0.75; transparent:true");
    panel.appendChild(bg);

    const label = document.createElement("a-text");
    label.setAttribute("value", "ENTER POKER PIT");
    label.setAttribute("align", "center");
    label.setAttribute("color", "#9ff");
    label.setAttribute("width", "2.4");
    label.setAttribute("position", "0 0 0.01");
    panel.appendChild(label);

    // Make clickable for laser-controls
    panel.setAttribute("class", "clickable");
    panel.setAttribute("raycastable", "true");

    panel.addEventListener("click", () => {
      const isPit = pit.getAttribute("visible") === true || pit.getAttribute("visible") === "true";
      if (!isPit) {
        label.setAttribute("value", "BACK TO LOBBY");
      } else {
        label.setAttribute("value", "ENTER POKER PIT");
      }
      togglePit(pit, lobby, null);
    });

    parent.appendChild(panel);

    // Ensure raycaster is targeting clickable things
    // (Quest laser-controls usually adds raycaster; this makes it reliable)
    const left = rig?.querySelector('[laser-controls][hand="left"]');
    const right = rig?.querySelector('[laser-controls][hand="right"]');
    [left, right].forEach(ctrl => {
      if (!ctrl) return;
      ctrl.setAttribute("raycaster", "objects: .clickable; far: 30");
    });

    hudLog("In-world VR Pit button ✅ (laser-click it)");
  }

  // Start after DOM is ready (fixes null button on Quest)
  window.addEventListener("DOMContentLoaded", () => safe(boot));
})();
