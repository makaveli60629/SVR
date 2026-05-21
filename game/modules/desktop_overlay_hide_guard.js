// PHASE-97-DESKTOP-OVERLAY-HIDE-GUARD
// Game-side only. Adds a desktop-only Hide UI / Show UI control.
// Does not affect immersive VR. Does not remove modules.

const PHASE = "PHASE-97-DESKTOP-OVERLAY-HIDE-GUARD";
const STORAGE_KEY = "svr_desktop_overlay_hidden_v1";

function isVRPresenting(){
  try { return !!window.SVR_RENDERER?.xr?.isPresenting; } catch { return false; }
}

function shouldDisable(){
  const p = new URLSearchParams(location.search);
  return p.has("preview") || p.get("cam") === "director" || document.body.classList.contains("preview-mode");
}

function injectStyle(){
  if (document.getElementById("svr-desktop-overlay-hide-style")) return;
  const style = document.createElement("style");
  style.id = "svr-desktop-overlay-hide-style";
  style.textContent = `
    #svrDesktopHideUiBtn,
    #svrDesktopShowUiBtn {
      position: fixed;
      z-index: 2147483200;
      border: 1px solid rgba(246,226,127,.75);
      background: rgba(5,8,16,.82);
      color: #fff;
      border-radius: 999px;
      padding: 9px 13px;
      font: 900 12px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
      letter-spacing: .06em;
      cursor: pointer;
      box-shadow: 0 10px 28px rgba(0,0,0,.45);
      pointer-events: auto;
      user-select: none;
    }
    #svrDesktopHideUiBtn { right: 14px; top: 112px; }
    #svrDesktopShowUiBtn { right: 14px; top: 14px; display: none; background: rgba(35,10,58,.92); border-color: rgba(127,245,199,.75); }
    body.svr-desktop-ui-hidden #hud,
    body.svr-desktop-ui-hidden #sceneNav,
    body.svr-desktop-ui-hidden #hardHoloButton,
    body.svr-desktop-ui-hidden #svrPokerHud,
    body.svr-desktop-ui-hidden #svrCustomRaise,
    body.svr-desktop-ui-hidden #svrRuntimeHealthPanel,
    body.svr-desktop-ui-hidden #svrRuntimeHealth,
    body.svr-desktop-ui-hidden #log {
      display: none !important;
    }
    body.svr-desktop-ui-hidden #hardHoloOverlay.open {
      display: flex !important;
    }
    body.svr-desktop-ui-hidden #svrDesktopHideUiBtn { display: none !important; }
    body.svr-desktop-ui-hidden #svrDesktopShowUiBtn { display: block !important; }
    body.svr-desktop-ui-hidden #err { display: block; }
    body.preview-mode #svrDesktopHideUiBtn,
    body.preview-mode #svrDesktopShowUiBtn { display: none !important; }
  `;
  document.head.appendChild(style);
}

function setHidden(hidden, reason = "manual"){
  if (isVRPresenting() || shouldDisable()) hidden = false;
  document.body.classList.toggle("svr-desktop-ui-hidden", !!hidden);
  try { localStorage.setItem(STORAGE_KEY, hidden ? "1" : "0"); } catch {}
  window.SVR_PHASE97_DESKTOP_OVERLAY_HIDE_GUARD = {
    phase: PHASE,
    active: true,
    hidden: !!hidden,
    reason,
    vrPresenting: isVRPresenting(),
    updatedAt: Date.now(),
    note: "Desktop overlay can be hidden until needed. VR display is not affected."
  };
}

function makeButtons(){
  if (document.getElementById("svrDesktopHideUiBtn")) return;

  const hide = document.createElement("button");
  hide.id = "svrDesktopHideUiBtn";
  hide.type = "button";
  hide.textContent = "HIDE UI";
  hide.title = "Hide desktop overlay controls until needed";
  hide.addEventListener("click", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    setHidden(true, "hide-button");
  });

  const show = document.createElement("button");
  show.id = "svrDesktopShowUiBtn";
  show.type = "button";
  show.textContent = "SHOW UI";
  show.title = "Show desktop overlay controls";
  show.addEventListener("click", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    setHidden(false, "show-button");
  });

  document.body.appendChild(hide);
  document.body.appendChild(show);
}

function restoreSavedState(){
  let hidden = false;
  try { hidden = localStorage.getItem(STORAGE_KEY) === "1"; } catch {}
  setHidden(hidden, "restore");
}

function bindKeys(){
  window.addEventListener("keydown", (e)=>{
    if (e.repeat) return;
    if (e.code === "KeyU" && !e.ctrlKey && !e.metaKey && !e.altKey){
      const hidden = !document.body.classList.contains("svr-desktop-ui-hidden");
      setHidden(hidden, "keyboard-u");
    }
  }, true);
}

function boot(){
  injectStyle();
  makeButtons();
  restoreSavedState();
  bindKeys();
  window.addEventListener("vrdisplaypresentchange", ()=>setHidden(false, "vr-display-change"), { passive: true });
  window.addEventListener("resize", ()=>{
    if (isVRPresenting()) setHidden(false, "resize-vr-presenting");
  }, { passive: true });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
