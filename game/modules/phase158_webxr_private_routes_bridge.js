import "./phase156_webxr_lobby_shell_modules.js";

const PHASE = "PHASE-158-WEBXR-PRIVATE-SCENE-ROOMS-ONE-BY-ONE-LOCK";
const ROUTES = {
  REIKI: "./private-scene.html?scene=reiki&v=phase158-private-rooms",
  PGA: "./private-scene.html?scene=pga&v=phase158-private-rooms",
  SCORPION: "./private-scene.html?scene=scorpion&v=phase158-private-rooms",
  STORE: "../site/store.html",
  LOUNGE: "./private-scene.html?scene=lounge&v=phase158-private-rooms",
  SEAT: "#seat"
};

window.SVR_BUILD_PHASE = PHASE;
window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
window.SVR_PHASE158_PRIVATE_ROUTES = {
  phase: PHASE,
  base: "Imports Phase 156 lobby shell and routes into Phase 158 WebXR private rooms.",
  routes: ROUTES,
  noMusic: true,
  noWatch: true,
  nextBuild: "PHASE-159-SCORPION-ROOM-GAMEPLAY-FIRST"
};

const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
function setStatus(text){ if(statusEl) statusEl.textContent = text; }
function setMode(text){ if(modeEl) modeEl.textContent = text; }

const routeHud = document.createElement("div");
routeHud.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:120;max-width:calc(100vw - 24px);padding:9px 12px;border:1px solid rgba(180,140,255,.95);border-radius:14px;background:rgba(0,0,0,.84);color:#e6d7ff;font:900 12px/1.35 system-ui;white-space:pre-wrap;pointer-events:none;box-shadow:0 12px 34px rgba(0,0,0,.55)";
routeHud.textContent = "PHASE 158 PRIVATE ROOMS READY\nAim at a portal and release trigger/fist to enter the room.";
document.body.appendChild(routeHud);
setTimeout(()=>{
  setStatus("Phase 158 private rooms ready");
  setMode("WebXR private rooms online");
  const buildPill = [...document.querySelectorAll(".pill")].find(el => /BUILD:/.test(el.textContent || ""));
  if(buildPill) buildPill.textContent = "BUILD: PHASE-158";
}, 600);

let lastPortalKey = "";
let pendingTimer = null;
function clearPending(){ if(pendingTimer){ clearTimeout(pendingTimer); pendingTimer = null; } }
function safePortalKey(p){ return p ? `${p.name}|${p.route}|${p.at || ""}` : ""; }
function routePortal(portal){
  const name = String(portal?.name || "").toUpperCase();
  const url = ROUTES[name];
  if(!name || !url) return;
  clearPending();
  if(url === "#seat"){
    routeHud.textContent = `PHASE 158 PRIVATE ROOMS READY\n${name} selected. Staying in lobby.`;
    setStatus("Seat module selected");
    setMode("Lobby seat active");
    return;
  }
  routeHud.textContent = `PHASE 158 ROOM SELECTED\n${name} → ${url}\nRouting in 1.0 second...`;
  setStatus(`Routing to ${name}`);
  setMode("Private room route armed");
  window.SVR_PHASE158_LAST_ROUTE = { name, url, at:new Date().toISOString(), action:"navigate-pending" };
  pendingTimer = setTimeout(()=>{
    window.SVR_PHASE158_LAST_ROUTE = { name, url, at:new Date().toISOString(), action:"navigate" };
    window.location.href = url;
  }, 1000);
}
setInterval(()=>{
  const portal = window.SVR_PHASE156_LAST_PORTAL;
  const key = safePortalKey(portal);
  if(key && key !== lastPortalKey){ lastPortalKey = key; routePortal(portal); }
}, 180);
window.addEventListener("keydown", e=>{ if(e.key === "Escape"){ clearPending(); routeHud.textContent = "PHASE 158 ROUTE CANCELLED"; setStatus("Route cancelled"); }});
