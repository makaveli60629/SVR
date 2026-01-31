AFRAME.registerComponent("scarlett-hand-pinch-teleport", {
  init() {
    const scene = this.el.sceneEl;
    const rig = document.getElementById("rig");
    const leftHand = document.getElementById("leftRealHand");
    const rightHand = document.getElementById("rightRealHand");
    const floor = document.getElementById("globalFloor");

    const ray = new THREE.Raycaster();
    const tmp = new THREE.Vector3();
    const dir = new THREE.Vector3();

    const pinchTeleport = (hand) => {
      if (!rig || !hand || !floor) return;

      hand.object3D.getWorldPosition(tmp);
      hand.object3D.getWorldDirection(dir);
      ray.set(tmp, dir);

      const hits = ray.intersectObject(floor.object3D, true);
      if (!hits.length) return;

      const hit = hits[0].point;
      rig.setAttribute("position", `${hit.x} 0 ${hit.z}`);
      window.hudLog && hudLog("Pinch teleport ✅");
    };

    const bind = (h) => {
      if (!h) return;
      h.addEventListener("pinchstarted", () => pinchTeleport(h));
      h.addEventListener("pinchstart", () => pinchTeleport(h));
    };

    bind(leftHand);
    bind(rightHand);

    window.hudLog && hudLog("Hands ready ✅ (hand-tracking requested)");
  }
});
