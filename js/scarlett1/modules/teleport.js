AFRAME.registerComponent("scarlett-teleport", {
  init() {
    const scene = this.el.sceneEl;
    const rig = document.getElementById("rig");
    const left = document.getElementById("leftHand");
    const right = document.getElementById("rightHand");

    // Teleport ring indicator
    const ring = document.createElement("a-ring");
    ring.setAttribute("id", "teleportRing");
    ring.setAttribute("radius-inner", "0.20");
    ring.setAttribute("radius-outer", "0.34");
    ring.setAttribute("rotation", "-90 0 0");
    ring.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.7; transparent:true");
    ring.setAttribute("visible", "false");
    scene.appendChild(ring);

    const ray = new THREE.Raycaster();
    const tmp = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const floor = document.getElementById("globalFloor");

    const doTeleport = (hand) => {
      if (!rig || !hand || !floor) return;

      // cast from hand forward
      hand.object3D.getWorldPosition(tmp);
      hand.object3D.getWorldDirection(dir);
      ray.set(tmp, dir);

      const hits = ray.intersectObject(floor.object3D, true);
      if (!hits.length) return;

      const hit = hits[0].point;
      ring.setAttribute("position", `${hit.x} 0.02 ${hit.z}`);
      ring.setAttribute("visible", "true");

      rig.setAttribute("position", `${hit.x} 0 ${hit.z}`);

      setTimeout(() => ring.setAttribute("visible", "false"), 120);
      if (window.hudLog) hudLog("Teleported ✅");
    };

    // Triggerdown (controllers)
    const bind = (h) => {
      if (!h) return;
      h.addEventListener("triggerdown", () => doTeleport(h));
    };
    bind(left);
    bind(right);

    if (window.hudLog) hudLog("Teleport ready ✅ (triggerdown, no laser)");
  }
});
