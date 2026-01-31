const hud = document.getElementById("log") || document.getElementById("hud");
let lines = [];

export function hudSetTop(msg) {
  if (!hud) return;
  lines[0] = String(msg);
  hud.textContent = lines.filter(Boolean).join("\n");
}

export function hudLog(msg) {
  if (!hud) return;
  lines.push(String(msg));
  if (lines.length > 20) lines.shift();
  hud.textContent = lines.filter(Boolean).join("\n");
}
