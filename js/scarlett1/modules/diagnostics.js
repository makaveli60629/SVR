(function () {
  const hud = document.getElementById("hud");
  let lines = [];

  window.hudSetTop = function (msg) {
    if (!hud) return;
    lines[0] = String(msg);
    hud.textContent = lines.filter(Boolean).join("\n");
  };

  window.hudLog = function (msg) {
    if (!hud) return;
    lines.push(String(msg));
    if (lines.length > 22) lines.splice(1, 1);
    hud.textContent = lines.filter(Boolean).join("\n");
  };

  window.addEventListener("error", (e) => hudLog("ERR: " + e.message));
  window.addEventListener("unhandledrejection", (e) => hudLog("REJ: " + (e.reason?.message || e.reason)));
})();
