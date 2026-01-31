AFRAME.registerComponent("scarlett-portal-router", {
  init() {
    window.scarlettTeleport = (destName) => {
      const dest = document.getElementById(`dest_${destName}`);
      const rig = document.getElementById("rig");
      if (!dest || !rig) {
        if (window.hudLog) hudLog(`Teleport FAIL ❌ dest_${destName}`);
        return;
      }
      const p = dest.object3D.position;
      rig.setAttribute("position", `${p.x} ${p.y + 1.6} ${p.z}`);
      if (window.hudLog) hudLog(`Teleport ✅ -> ${destName}`);
    };

    const onClick = (e) => {
      let node = e.target;
      for (let i = 0; i < 8 && node; i++) {
        const dest = node.getAttribute && node.getAttribute("data-dest");
        if (dest) {
          window.scarlettTeleport(dest);
          return;
        }
        node = node.parentNode;
      }
    };

    this.el.addEventListener("click", onClick);
    this.el.sceneEl.addEventListener("click", onClick);

    if (window.hudLog) hudLog("Portal router ready ✅");
  }
});
