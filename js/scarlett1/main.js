// Scarlett1 Main (A-Frame, CDN-safe)
(function () {
  const btn = document.getElementById("btnPit");
  const pit = document.getElementById("pitRoot");
  const lobby = document.getElementById("lobbyRoot");

  hudSetTop("Scarlett1 A-Frame booting…");
  hudLog("A-Frame loaded ✅");
  hudLog("Quest ready ✅ (no three/addons imports)");

  // Always show a proof message after scene starts
  const scene = document.querySelector("a-scene");
  scene.addEventListener("loaded", () => {
    hudSetTop("Scene loaded ✅");
    hudLog("Press Enter Poker Pit to spawn table + seats + bots + jumbotron.");
  });

  btn.addEventListener("click", () => {
    const isPit = pit.getAttribute("visible") === true || pit.getAttribute("visible") === "true";
    if (!isPit) {
      pit.setAttribute("visible", "true");
      lobby.setAttribute("visible", "false");
      hudSetTop("Poker Pit ✅");
      hudLog("Pit ON (table + seats + bots + jumbotron)");
      btn.textContent = "Back To Lobby";
    } else {
      pit.setAttribute("visible", "false");
      lobby.setAttribute("visible", "true");
      hudSetTop("Lobby ✅");
      hudLog("Lobby ON");
      btn.textContent = "Enter Poker Pit";
    }
  });
})();
