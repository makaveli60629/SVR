// /js/scarlett1/modules/teleport.js
import { getRig } from "./utils.js";

AFRAME.registerComponent("scarlett-teleport", {
  schema: {
    maxRange: { default: 30 }
  },

  init() {
    this.marker = document.createElement("a-ring");
    this.marker.setAttribute("radius-inner", "0.16");
    this.marker.setAttribute("radius-outer", "0.28");
    this.marker.setAttribute("rotation", "-90 0 0");
    this.marker.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.25; opacity:0.75; transparent:true");
    this.marker.setAttribute("visible", "false");
    this.el.sceneEl.appendChild(this.marker);

    this.lastHit = null;

    // Trigger teleport (controllers)
    this.el.sceneEl.addEventListener("triggerdown", () => this.doTeleport());
    // Pinch teleport (hand tracking)
    this.el.sceneEl.addEventListener("pinchstarted", () => this.doTeleport());

    if (window.hudLog) hudLog("Teleport ready ✅ (triggerdown, no laser)");
  },

  tick() {
    // Prefer right hand raycaster if present
    const right = document.getElementById("rightHandHT") || document.getElementById("rightHand");
    if (!right) return;

    const rc = right.components.raycaster;
    if (!rc) { this.marker.setAttribute("visible","false"); return; }

    const hits = rc.intersections || [];
    const hit = hits.find(h => h && h.object && h.object.el && h.object.el.classList.contains("teleportable"));
    if (!hit) { this.lastHit = null; this.marker.setAttribute("visible","false"); return; }

    this.lastHit = hit;
    const p = hit.point;
    this.marker.object3D.position.set(p.x, p.y + 0.01, p.z);
    this.marker.setAttribute("visible","true");
  },

  doTeleport() {
    if (!this.lastHit) return;
    const rig = getRig();
    if (!rig) return;

    const p = this.lastHit.point;
    rig.object3D.position.set(p.x, 0, p.z); // local-floor
  }
});
