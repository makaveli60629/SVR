// /js/scarlett1/modules/teleport.js
// Raycast-based teleport to .teleportable surfaces.
// No visible laser, no reticle.

AFRAME.registerComponent("scarlett-teleport", {
  init() {
    this.rig = document.getElementById("rig");
    this.cam = document.getElementById("camera");
    this.right = document.getElementById("rightHand");
    this.left  = document.getElementById("leftHand");

    // Add invisible raycasters to hands
    [this.right, this.left].forEach(h => {
      if (!h) return;
      h.setAttribute("raycaster", "objects: .teleportable; far: 40; showLine: false");
    });

    // Use trigger to teleport (works on Quest)
    if (this.right) this.right.addEventListener("triggerdown", () => this.tryTeleport(this.right));
    if (this.left)  this.left.addEventListener("triggerdown", () => this.tryTeleport(this.left));

    if (window.hudLog) hudLog("Teleport ready ✅ (triggerdown, no laser)");
  },

  tryTeleport(handEl) {
    if (!this.rig || !handEl) return;

    const ray = handEl.components.raycaster;
    if (!ray) return;

    const hits = ray.intersections;
    if (!hits || hits.length === 0) return;

    const hit = hits[0];
    const p = hit.point;

    // Move rig so camera lands there
    this.rig.setAttribute("position", `${p.x} ${p.y + 1.65} ${p.z}`);
    if (this.cam) this.cam.setAttribute("position", "0 0 0");

    if (window.hudLog) hudLog(`Teleported ✅ x=${p.x.toFixed(2)} z=${p.z.toFixed(2)}`);
  }
});
