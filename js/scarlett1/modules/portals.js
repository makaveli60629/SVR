// /js/scarlett1/modules/portals.js
// Universal portal click -> teleport router.
// Works with controllers + mouse + hand raycaster clicks.

AFRAME.registerComponent("scarlett-portal-router", {
  init() {
    // Expose a global teleport function so watch + portals share it
    window.scarlettTeleport = (destName) => {
      const id = `dest_${destName}`;
      const dest = document.getElementById(id);
      const rig = document.getElementById("rig") || document.getElementById("playerRig") || document.querySelector("[camera]")?.closest("a-entity");
      if (!dest || !rig) {
        if (window.hudLog) hudLog(`Teleport FAIL ❌ dest=${id} rig=${!!rig}`);
        return;
      }

      const p = dest.object3D.position;
      rig.setAttribute("position", `${p.x} ${p.y} ${p.z}`);
      if (window.hudLog) hudLog(`Teleport ✅ -> ${destName}`);
    };

    // Click handler for anything with class "portal"
    const onClick = (e) => {
      const target = e.target;
      if (!target) return;

      // Walk up parent chain looking for data-dest
      let node = target;
      for (let i = 0; i < 6 && node; i++) {
        const dest = node.getAttribute && node.getAttribute("data-dest");
        if (dest) {
          window.scarlettTeleport(dest);
          return;
        }
        node = node.parentNode;
      }
    };

    this.el.addEventListener("click", onClick);

    // Support trigger-based "raycaster-intersected" click patterns
    // (Most setups will still emit click; this is just extra insurance.)
    this.el.sceneEl.addEventListener("click", onClick);

    if (window.hudLog) hudLog("Portal router ready ✅ (window.scarlettTeleport + .portal clicks)");
  }
});
