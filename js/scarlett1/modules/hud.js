window.hudLog = function(msg) {
  const el = document.getElementById("hud");
  if (!el) return;
  const t = new Date();
  const stamp = t.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"});
  el.textContent += `\n[${stamp}] ${msg}`;
};
