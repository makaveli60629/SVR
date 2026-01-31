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

    // Hands always visible
    this.el.sceneEl.setAttribute("scarlett-hands-always", "");

    // Watch teleporter
    this.el.sceneEl.setAttribute("scarlett-watch-teleporter", "");

    // Dest markers
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

    // ✅ FORCE SAFE SPAWN (outside pit, facing center)
    setTimeout(() => {
      const rig = document.getElementById("rig");
      if (rig) {
        rig.setAttribute("position", "0 1.65 18");   // outside pit
        rig.setAttribute("rotation", "0 180 0");     // face pit
      }
      hudLog("Spawn set ✅ (outside pit)");
    }, 50);

    // ✅ KILL “THING IN FACE” (remove any UI planes accidentally attached to camera)
    setTimeout(() => {
      const cam = document.getElementById("camera");
      if (!cam) return;

      // remove any accidental children planes/text stuck on camera
      [...cam.children].forEach(ch => {
        const tag = (ch.tagName || "").toLowerCase();
        const isPanel =
          tag.includes("a-plane") ||
          tag.includes("a-text") ||
          (ch.getAttribute && ch.getAttribute("geometry") && ("" + ch.getAttribute("geometry")).includes("plane"));

        const name = (ch.getAttribute && (ch.getAttribute("id") || ch.getAttribute("class") || "")) || "";
        if (isPanel || /panel|hud|overlay|boot|sign/i.test(name)) {
          ch.parentNode && ch.parentNode.removeChild(ch);
        }
      });

      // also remove a known "boot" screen entity if someone created it
      const boot = document.getElementById("bootPanel");
      if (boot && boot.parentNode) boot.parentNode.removeChild(boot);

      hudLog("Face overlay cleanup ✅");
    }, 300);

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
