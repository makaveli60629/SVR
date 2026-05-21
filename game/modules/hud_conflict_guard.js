// PHASE-96-HUD-CONFLICT-GUARD
// Game-side only. Prevents overlapping poker HUD layers from fighting for input.
// Does not remove either HUD. It only gates visibility/pointer behavior safely.

const PHASE = "PHASE-96-HUD-CONFLICT-GUARD";
const UPDATE_MS = 180;

function isPreview(){
  const p = new URLSearchParams(location.search);
  return document.body.classList.contains("preview-mode") || p.has("preview") || p.get("cam") === "director";
}

function isVisible(el){
  if (!el) return false;
  const s = getComputedStyle(el);
  return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity || 1) > 0.01 && !el.classList.contains("svr-hidden");
}

function getPokerState(){
  try { return window.SVR_PLAYABLE_POKER?.getState?.() || null; } catch { return null; }
}

function injectStyle(){
  if (document.getElementById("svr-hud-conflict-guard-style")) return;
  const style = document.createElement("style");
  style.id = "svr-hud-conflict-guard-style";
  style.textContent = `
    body.svr-hud-raise-focus #svrPokerHud { transform: translateY(8px); opacity: .72; pointer-events: none; }
    body.svr-hud-raise-focus #svrPokerHud .svr-poker-hud-actions { pointer-events: none; }
    body.svr-hud-raise-focus #svrCustomRaise { z-index: 42; outline: 1px solid rgba(246,226,127,.38); }
    body.svr-hud-preview #svrPokerHud,
    body.svr-hud-preview #svrCustomRaise { display: none !important; }
    body.svr-hud-compact-bottom #svrPokerHud { bottom: 58px; }
    body.svr-hud-compact-bottom #svrCustomRaise { bottom: 228px; }
  `;
  document.head.appendChild(style);
}

function applyGuard(){
  const pokerHud = document.getElementById("svrPokerHud");
  const customRaise = document.getElementById("svrCustomRaise");
  const poker = getPokerState();
  const customVisible = isVisible(customRaise);
  const canRaise = !!poker?.awaitingPlayer && !!poker?.legal?.canRaise;
  const raiseFocus = customVisible && canRaise;

  document.body.classList.toggle("svr-hud-preview", isPreview());
  document.body.classList.toggle("svr-hud-raise-focus", raiseFocus);
  document.body.classList.toggle("svr-hud-compact-bottom", !!pokerHud && !!customRaise);

  if (pokerHud) {
    pokerHud.dataset.hudGuard = PHASE;
    pokerHud.dataset.raiseFocus = raiseFocus ? "1" : "0";
  }
  if (customRaise) {
    customRaise.dataset.hudGuard = PHASE;
    customRaise.dataset.canRaise = canRaise ? "1" : "0";
  }

  window.SVR_PHASE96_HUD_CONFLICT_GUARD = {
    phase: PHASE,
    active: true,
    pokerHudFound: !!pokerHud,
    customRaiseFound: !!customRaise,
    customRaiseVisible: customVisible,
    canRaise,
    raiseFocus,
    lastUpdate: Date.now()
  };
}

function boot(){
  injectStyle();
  applyGuard();
  setInterval(applyGuard, UPDATE_MS);
  window.addEventListener("resize", applyGuard, { passive: true });
  window.addEventListener("svr:poker-state", applyGuard, { passive: true });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
