// /js/scarlett1/main.js
import "./modules/lobby.js";
import "./modules/locomotion.js";

window.hudLog = function hudLog(msg) {
  const el = document.getElementById("hud");
  if (!el) return;
  const t = new Date().toLocaleTimeString();
  el.innerHTML = `${el.innerHTML}<br/>[${t}] ${msg}`;
};

AFRAME.registerComponent("scarlett-world", {
  init() {
    hudLog("A-FRAME loaded ✅");
    hudLog("World booting…");

    // Build lobby
    const lobby = document.createElement("a-entity");
    lobby.setAttribute("id", "lobbyRoot");
    lobby.setAttribute("position", "0 0 0");
    lobby.setAttribute("scarlett-lobby", "");
    this.el.appendChild(lobby);

    // Portal click router
    this.el.addEventListener("click", (e) => {
      const target = e.target;
      if (!target?.classList?.contains("portal")) return;

      const dest = target.getAttribute("data-dest");
      const rig = document.getElementById("rig");
      if (!dest || !rig) return;

      // These are safe zones (edit later when pit/store/balcony modules exist)
      if (dest === "lobby")   rig.setAttribute("position", "0 1.6 14");
      if (dest === "tables")  rig.setAttribute("position", "0 1.6 -12");
      if (dest === "store")   rig.setAttribute("position", "12 1.6 0");
      if (dest === "balcony") rig.setAttribute("position", "0 4.2 16");

      hudLog(`Portal → ${dest.toUpperCase()} ✅`);
    });

    hudLog("World ready ✅");
    hudLog("Movement: Left stick");
    hudLog("Teleport: Aim right laser at floor → Right Trigger");
  }
});
