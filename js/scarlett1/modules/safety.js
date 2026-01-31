// /js/scarlett1/modules/safety.js
// Forces a safe spawn and removes "in-your-face" planes/text for the first few seconds.

AFRAME.registerComponent("scarlett-safety-governor", {
  schema: {
    seconds: { default: 6 },
    // SAFE SPAWN: outside pit looking inward
    spawnPos: { default: "0 1.7 18" },
    spawnRot: { default: "0 180 0" },
    // remove objects within this distance of camera if they look like UI
    killRadius: { default: 1.25 }
  },

  init() {
    this.start = performance.now();
    this.doneSpawn = false;
    this.lastKill = 0;

    // try to force immediately
    setTimeout(() => this.forceSpawn("init"), 50);
    setTimeout(() => this.forceSpawn("init+250ms"), 250);
    setTimeout(() => this.forceSpawn("init+750ms"), 750);

    if (window.hudLog) hudLog("Safety Governor armed ✅ (spawn lock + face-clean)");
  },

  tick(time, dt) {
    const elapsed = (performance.now() - this.start) / 1000;
    if (elapsed > this.data.seconds) return;

    // Keep forcing spawn during the safety window (in case another module keeps overriding it)
    this.forceSpawn(`tick ${elapsed.toFixed(2)}s`);

    // Kill face blockers every 250ms during safety window
    if (time - this.lastKill > 250) {
      this.lastKill = time;
      this.killFaceBlockers();
    }
  },

  forceSpawn(reason) {
    const rig = document.getElementById("rig");
    if (!rig) return;

    // Force rig position and rotation
    rig.setAttribute("position", this.data.spawnPos);
    rig.setAttribute("rotation", this.data.spawnRot);

    // Also force camera local position to zero (sometimes modules offset camera under rig)
    const cam = document.getElementById("camera");
    if (cam) cam.setAttribute("position", "0 0 0");

    if (!this.doneSpawn) {
      this.doneSpawn = true;
      if (window.hudLog) hudLog(`Spawn forced ✅ (${reason}) -> ${this.data.spawnPos}`);
    }
  },

  killFaceBlockers() {
    const cam = document.getElementById("camera");
    if (!cam) return;

    const camObj = cam.object3D;
    camObj.updateMatrixWorld(true);
    const camPos = new THREE.Vector3();
    camObj.getWorldPosition(camPos);

    // Look for anything within radius that is likely a UI panel:
    // - a-plane, a-text, or mesh with PlaneGeometry
    // - ids/classes containing hud/boot/panel/sign/message
    const radius = this.data.killRadius;

    const candidates = [];
    this.el.sceneEl.object3D.traverse((obj) => {
      if (!obj) return;

      // ignore camera itself
      if (obj === camObj) return;

      // distance check
      const p = new THREE.Vector3();
      obj.getWorldPosition(p);
      const dist = p.distanceTo(camPos);
      if (dist > radius) return;

      // geometry/UI heuristics
      const hasPlaneGeo =
        obj.geometry &&
        (obj.geometry.type === "PlaneGeometry" || obj.geometry.type === "PlaneBufferGeometry");

      const name = (obj.name || "").toLowerCase();
      const looksLikeUIName = /hud|boot|panel|overlay|sign|message|notice|label/.test(name);

      // material check (often flat/unlit)
      const mat = obj.material;
      const isFlat =
        mat && (mat.type === "MeshBasicMaterial" || (mat.emissive && mat.emissiveIntensity > 0));

      if (hasPlaneGeo || looksLikeUIName || isFlat) {
        candidates.push({ obj, dist, name });
      }
    });

    // Remove the nearest few offenders to be safe
    candidates.sort((a, b) => a.dist - b.dist);
    const toRemove = candidates.slice(0, 6);

    toRemove.forEach(({ obj, dist, name }) => {
      // Remove A-Frame entity if possible
      const el = obj.el;
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
        if (window.hudLog) hudLog(`Removed face-blocker ✅ (${dist.toFixed(2)}m) ${el.tagName} id=${el.id || "?"}`);
      } else if (obj.parent) {
        obj.parent.remove(obj);
        if (window.hudLog) hudLog(`Removed object3D blocker ✅ (${dist.toFixed(2)}m) name=${name || "?"}`);
      }
    });
  }
});
