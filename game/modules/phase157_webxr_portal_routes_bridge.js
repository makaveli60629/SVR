import "./phase156_webxr_lobby_shell_modules.js";

const PHASE = "PHASE-157-WEBXR-PRIVATE-SCENE-ROUTES-LOBBY-POLISH-LOCK";
const ROUTES = {
  REIKI: "./private-scene.html?scene=reiki",
  PGA: "./private-scene.html?scene=pga",
  SCORPION: "./private-scene.html?scene=scorpion",
  STORE: "../site/store.html",
  LOUNGE: "./private-scene.html?scene=lounge",
  SEAT: "#seat"
};

window.SVR_BUILD_PHASE = PHASE;
window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
window.SVR_PHASE157_PORTAL_ROUTES = {
  phase: PHASE,
  base: "Imports and preserves Phase 156 lobby shell, modules, hands, sky, official logo, and locomotion.",
  routeMode: "Portal selection routes to lightweight private-scene pages except STORE, which routes to site store.",
  routes: ROUTES,
  noMusic: true,
  noWatch: true,
  worldMoved: false,
  referenceSpaceMutated: false,
  nextBuild: "PHASE-158-LOBBY-POLISH-WATCH-REINTRODUCTION"
};

const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
function setStatus(text){ if(statusEl) statusEl.textContent = text; }
function setMode(text){ if(modeEl) modeEl.textContent = text; }

const routeHud = document.createElement("div");
routeHud.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:120;max-width:calc(100vw - 24px);padding:9px 12px;border:1px solid rgba(180,140,255,.95);border-radius:14px;background:rgba(0,0,0,.84);color:#e6d7ff;font:900 12px/1.35 system-ui;white-space:pre-wrap;pointer-events:none;box-shadow:0 12px 34px rgba(0,0,0,.55)";
routeHud.textContent = "PHASE 157 ROUTES READY\nAim at a portal and release trigger/fist to route.";
document.body.appendChild(routeHud);

setTimeout(()=>{
  setStatus("Phase 157 routes ready");
  setMode("Private scene routes online");
  const buildPill = [...document.querySelectorAll(".pill")].find(el => /BUILD:/.test(el.textContent || ""));
  if(buildPill) buildPill.textContent = "BUILD: PHASE-157";
}, 600);

let lastPortalKey = "";
let pendingTimer = null;
function safePortalKey(p){ return p ? `${p.name}|${p.route}|${p.at || ""}` : ""; }
function clearPending(){ if(pendingTimer){ clearTimeout(pendingTimer); pendingTimer = null; } }
function routePortal(portal){
  const name = String(portal?.name || "").toUpperCase();
  const url = ROUTES[name];
  if(!name || !url) return;
  clearPending();
  if(url === "#seat"){
    routeHud.textContent = `PHASE 157 ROUTES READY\n${name} selected. Staying in lobby at table seat module.`;
    setStatus("Seat module selected");
    setMode("Lobby seat active");
    window.SVR_PHASE157_LAST_ROUTE = { name, url, at:new Date().toISOString(), action:"stay-in-lobby" };
    return;
  }
  routeHud.textContent = `PHASE 157 PORTAL SELECTED\n${name} → ${url}\nRouting in 1.2 seconds...`;
  setStatus(`Routing to ${name}`);
  setMode("Private scene route armed");
  window.SVR_PHASE157_LAST_ROUTE = { name, url, at:new Date().toISOString(), action:"navigate-pending" };
  pendingTimer = setTimeout(()=>{
    window.SVR_PHASE157_LAST_ROUTE = { name, url, at:new Date().toISOString(), action:"navigate" };
    window.location.href = url;
  }, 1200);
}

setInterval(()=>{
  const portal = window.SVR_PHASE156_LAST_PORTAL;
  const key = safePortalKey(portal);
  if(key && key !== lastPortalKey){
    lastPortalKey = key;
    routePortal(portal);
  }
}, 180);

window.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    clearPending();
    routeHud.textContent = "PHASE 157 ROUTE CANCELLED\nPortal auto-route cancelled.";
    setStatus("Route cancelled");
  }
});
