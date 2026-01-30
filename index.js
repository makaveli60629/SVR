/**
 * /index.js — PERMANENT ENTRY
 * No bare imports. GitHub Pages safe.
 */
import { Spine } from "./spine.js";

const diag = document.getElementById("diag");
const log = (msg) => {
  if (diag) {
    diag.textContent += "\n" + msg;
    diag.scrollTop = diag.scrollHeight;
  }
  console.log(msg);
};

log("[boot] JS LOADED ✅ (module tag ran)");

try {
  await Spine.start({ log });
  log("[boot] spine started ✅");
} catch (e) {
  log("[boot] spine failed ❌ " + (e?.message || e));
  console.error(e);
}

document.getElementById("btnEnterVR")?.addEventListener("click", () => window.SCARLETT?.enterVR?.());
document.getElementById("btnReset")?.addEventListener("click", () => window.SCARLETT?.resetSpawn?.());
document.getElementById("btnCopy")?.addEventListener("click", async () => {
  const txt = window.SCARLETT?.getReport?.() || "";
  try {
    await navigator.clipboard.writeText(txt);
    log("[ui] report copied ✅");
  } catch {
    log("[ui] clipboard blocked ❌ (Android sometimes blocks). Long-press to select in HUD instead.");
  }
});
document.getElementById("btnHard")?.addEventListener("click", () => location.reload());
