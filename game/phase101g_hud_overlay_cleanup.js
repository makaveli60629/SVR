const LABEL = "PHASE-101G-HUD-OVERLAY-CLEANUP-LOCK";

window.SVR_PHASE101G_HUD_CLEANUP = {
  build: LABEL,
  active: true,
  purpose: "Remove duplicate desktop/WebXR overlays and keep one clean presentation HUD.",
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function isDebugMode(){
  const qs = new URLSearchParams(location.search || "");
  return qs.has("debug") || qs.has("hud") || qs.get("showHud") === "1";
}

function setHidden(el, hidden){
  if(!el) return;
  el.style.display = hidden ? "none" : "";
  el.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function compactHud(){
  const hud = document.getElementById("hud");
  const phase = document.getElementById("svr-phase-label");
  const nav = document.getElementById("sceneNav");
  const log = document.getElementById("log");
  const err = document.getElementById("err");
  const status = document.getElementById("status");
  const mode = document.getElementById("mode");
  const toggleLog = document.getElementById("toggleLog");
  const toggleJoints = document.getElementById("toggleJoints");

  const debug = isDebugMode();
  document.body.classList.toggle("svr-debug-hud", debug);
  document.body.classList.toggle("svr-clean-hud", !debug);

  if(status) status.textContent = "SVR Ready";
  if(mode) mode.textContent = "Presentation";

  if(!debug){
    setHidden(nav, true);
    setHidden(phase, true);
    setHidden(log, true);
    setHidden(err, true);
    setHidden(toggleLog, true);
    setHidden(toggleJoints, true);
    if(hud){
      hud.style.left = "10px";
      hud.style.top = "10px";
      hud.style.right = "auto";
      hud.style.bottom = "auto";
      hud.style.gap = "6px";
      hud.style.pointerEvents = "none";
      hud.querySelectorAll("button").forEach(btn => setHidden(btn, true));
    }
  }else{
    setHidden(nav, false);
    setHidden(phase, false);
    setHidden(toggleLog, false);
    setHidden(toggleJoints, false);
    if(hud) hud.style.pointerEvents = "auto";
  }

  window.SVR_PHASE101G_HUD_CLEANUP.debug = debug;
  window.SVR_PHASE101G_HUD_CLEANUP.checkedAt = new Date().toISOString();
}

function suppressWebXRUnsupportedBadge(){
  if(isDebugMode()) return;
  const nodes = Array.from(document.querySelectorAll("body *"));
  for(const node of nodes){
    if(!node || node.id === "app" || node.closest?.("#app")) continue;
    const text = (node.textContent || "").trim().toUpperCase();
    if(text === "VR NOT SUPPORTED" || text.includes("VR NOT SUPPORTED")){
      node.style.display = "none";
      node.setAttribute("aria-hidden", "true");
      window.SVR_PHASE101G_HUD_CLEANUP.webxrBadgeHidden = true;
    }
  }
}

function installStyle(){
  if(document.getElementById("phase101g-hud-style")) return;
  const style = document.createElement("style");
  style.id = "phase101g-hud-style";
  style.textContent = `
    body.svr-clean-hud #sceneNav,
    body.svr-clean-hud #svr-phase-label,
    body.svr-clean-hud #toggleLog,
    body.svr-clean-hud #toggleJoints,
    body.svr-clean-hud #log,
    body.svr-clean-hud #err { display:none !important; }
    body.svr-clean-hud #hud { z-index:40 !important; pointer-events:none !important; opacity:.78; }
    body.svr-clean-hud #hud .hud-pill { font-size:11px !important; padding:5px 9px !important; background:rgba(0,0,0,.42) !important; }
    body.svr-clean-hud #hud .hud-pill:nth-child(n+3) { display:none !important; }
    body.xr-active #hud,
    body.xr-active #sceneNav,
    body.xr-active #svr-phase-label,
    body.preview-mode #hud,
    body.preview-mode #sceneNav,
    body.preview-mode #svr-phase-label { display:none !important; }
  `;
  document.head.appendChild(style);
}

installStyle();
compactHud();
setTimeout(compactHud, 250);
setTimeout(compactHud, 1000);
setTimeout(suppressWebXRUnsupportedBadge, 350);
setTimeout(suppressWebXRUnsupportedBadge, 1200);

const observer = new MutationObserver(() => {
  compactHud();
  suppressWebXRUnsupportedBadge();
});
observer.observe(document.body, { childList: true, subtree: true, characterData: true });

window.addEventListener("keydown", (e) => {
  if(e.code === "KeyH" && e.shiftKey){
    const url = new URL(location.href);
    if(isDebugMode()){
      url.searchParams.delete("debug");
      url.searchParams.delete("hud");
      url.searchParams.delete("showHud");
    }else{
      url.searchParams.set("hud", "1");
    }
    location.href = url.toString();
  }
});
