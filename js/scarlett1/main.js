import "./modules/spawnpads.js";
import "./modules/vr_eye_fix.js";
import "./modules/teleport.js";

import "./modules/lobby.js";

window.hudLog = function hudLog(msg) {
  const el = document.getElementById("hud");
  if (!el) return;
  const t = new Date().toLocaleTimeString();
  el.innerHTML = `${el.innerHTML}<br/>[${t}] ${msg}`;
};

AFRAME.registerComponent("scarlett-world", {
  init() {
    const world = document.getElementById("worldRoot");

    hudLog("A-FRAME loaded ✅");
    hudLog("Scarlett1 booting…");

    // Spawn system = single source of truth
    this.el.sceneEl.setAttribute("scarlett-spawn-system", "defaultPad: pad_lobby_safe; lockSeconds: 3.2");

    // Fix right-eye-only artifacts (reticles/panels/laser visuals)
    this.el.sceneEl.setAttribute("scarlett-vr-eye-fix", "");

    // Teleport (no visible laser/reticle)
    this.el.sceneEl.setAttribute("scarlett-teleport", "");

    // Rooms (start with lobby)
    const lobby = document.createElement("a-entity");
    lobby.setAttribute("id", "room_lobby");
    lobby.setAttribute("position", "0 0 0");
    lobby.setAttribute("scarlett-lobby", "");
    world.appendChild(lobby);

    hudLog("Lobby created ✅");
  }
});
