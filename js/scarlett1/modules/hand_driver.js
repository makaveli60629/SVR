// /js/scarlett1/modules/hand_driver.js
AFRAME.registerComponent("scarlett-hand-driver", {
  schema: {
    hand: { default: "right" },
    handTracking: { default: false }
  },

  init() {
    // For controllers, "triggerdown" is already global.
    // For hand tracking we use pinch events and simulate click on intersected clickable.
    if (this.data.handTracking) {
      this.el.addEventListener("pinchstarted", () => this.tryClick());
    } else {
      // Controller: use triggerdown on this hand
      this.el.addEventListener("triggerdown", () => this.tryClick());
    }
  },

  tryClick() {
    const rc = this.el.components.raycaster;
    if (!rc) return;
    const hits = rc.intersections || [];
    const hit = hits.find(h => h && h.object && h.object.el && h.object.el.classList.contains("clickable"));
    if (!hit) return;

    const target = hit.object.el;
    target.emit("click");
  }
});
