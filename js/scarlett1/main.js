import "./modules/locomotion.js";
import "./modules/portals.js";
import "./modules/hands.js";
import "./modules/watch.js";

import "./modules/jumbotron.js";   // ✅ NEW

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

// ✅ Turn ON lobby seated bots (7 bots seated, your seat open)
window.SCARLETT_LOBBY_BOTS = true;

AFRAME.registerComponent("scarlett-world", {
  init() {
    hudLog("A-FRAME loaded ✅");
    hudLog("Scarlett1 booting…");

    // Force hands visible
    this.el.sceneEl.setAttribute("scarlett-hands-always", "");

    // Watch teleporter (works anywhere)
    this.el.sceneEl.setAttribute("scarlett-watch-teleporter", "");

    // --- DESTINATION MARKERS (teleport targets) ---
    addDest(this.el, "dest_lobby", "0 0 0");
    addDest(this.el, "dest_tables", "0 0 -140");
    addDest(this.el, "dest_store", "-140 0 0");
    addDest(this.el, "dest_balcony", "-140 7 0");

    // --- ROOMS ---
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
    hudLog("Teleport ring: aim at floor + Right Trigger");
    hudLog("Portals/pads: click/trigger on rings/pads");
  }
});

function addDest(root, id, pos) {
  if (document.getElementById(id)) return;
  const d = document.createElement("a-entity");
  d.setAttribute("id", id);
  d.setAttribute("position", pos);
  root.appendChild(d);
  }
