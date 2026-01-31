// /js/scarlett1/modules/boot_console.js
// Tiny HUD logger that never touches camera entities (prevents right-eye UI artifacts).
(function () {
  const hud = () => document.getElementById("hudBoot");

  function ts() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour12: true });
  }

  window.hudLog = function hudLog(msg) {
    const el = hud();
    if (!el) return;
    const line = `[${ts()}] ${msg}`;
    el.textContent = (el.textContent ? (el.textContent + "\n") : "") + line;
  };

  // Basic boot line
  window.addEventListener("DOMContentLoaded", () => {
    const el = hud();
    if (el) el.textContent = "boot…";
  });
})();
