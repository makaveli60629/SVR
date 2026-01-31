import "./modules/safety.js";      // ✅ ADD FIRST (critical)
import "./modules/locomotion.js";
import "./modules/portals.js";
import "./modules/hands.js";
import "./modules/watch.js";

import "./modules/jumbotron.js";

import "./modules/cards.js";
import "./modules/table6.js";
import "./modules/lobby.js";
import "./modules/tablesRoom.js";
import "./modules/storeRoom.js";

window.hudLog = function hudLog(msg) {
  const el = document.getElementById("hud");
  if (!el) return;
  const t = new Date().toLocaleTimeString();
  el.innerHTML = `${el.innerHTML}<br/>[${t}] ${msg}`;
};

window.SCARLETT_LOBBY_BOTS = true;
window.SCARLETT_M3U_URL = "https://raw.githubusercontent.com/jromero88/iptv/master/channels/us.m3u";

AFRAME.registerComponent("scarlett-world", {
  init() {
    hudLog("A-FRAME loaded ✅");
    hudLog("Scarlett1 booting…");

    // ✅ SAFETY GOVERNOR ON SCENE (forces spawn + kills face blockers)
    this.el.sceneEl.setAttribute("scarlett-safety-governor", "");

    // Hands always visible
    this.el.sceneEl.setAttribute("scarlett-hands-always", "");
    // Watch teleporter
    this.el.sceneEl.setAttribute("scarlett-watch-teleporter", "");

    // Dest markers (we will keep lobby at 0,0,0 — but safety forces initial spawn away from pit)
    addDest(this.el, "dest_lobby", "0 0 0");
    addDest(this.el, "dest_tables", "0 0 -140");
    addDest(this.el, "dest_store", "-140 0 0");
    addDest(this.el, "dest_balcony", "-140 7 0");

    // Rooms
    const lobby = document.createElement("a-entity");
    lobby.setAttribute("id", "room_lobby");
    lobby.setAttribute("position", "0 0 0");
    lobby.setAttribute("scarlett-lobby", "");
    this.el.appendChild(lobby);

    const tables = document.createElement("a-entity");
    tables.setAttribute("id", "room_tables");
    tables.setAttribute("position", "0 0 -140");
    tables.setAttribute("scarlett-tables-room", "");
    this.el.appendChild(tables);

    const store = document.createElement("a-entity");
    store.setAttribute("id", "room_store");
    store.setAttribute("position", "-140 0 0");
    store.setAttribute("scarlett-store-room", "");
    this.el.appendChild(store);

    hudLog("Rooms created ✅");
  }
});

function addDest(root, id, pos) {
  if (document.getElementById(id)) return;
  const d = document.createElement("a-entity");
  d.setAttribute("id", id);
  d.setAttribute("position", pos);
  root.appendChild(d);
}
