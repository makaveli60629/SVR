AFRAME.registerComponent("scarlett-locomotion", {
  schema: {
    speed: { default: 3.2 },
    dead: { default: 0.14 },
    invertX: { default: true },
    snapTurn: { default: true },
    snapDeg: { default: 25 }
  },

  init() {
    this.moveX = 0;
    this.moveY = 0;
    this.turnX = 0;
    this.lastSnap = 0;

    this.rig = this.el;
    this.cam = document.getElementById("cam");
    this.left = document.getElementById("leftHand");
    this.right = document.getElementById("rightHand");

    // Teleport ring
    this.tpRing = document.createElement("a-ring");
    this.tpRing.setAttribute("radius-inner", "0.18");
    this.tpRing.setAttribute("radius-outer", "0.28");
    this.tpRing.setAttribute("rotation", "-90 0 0");
    this.tpRing.setAttribute("position", "0 -999 0");
    this.tpRing.setAttribute("material", "color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.2; opacity:0.6; transparent:true");
    this.tpRing.setAttribute("visible", "false");
    this.rig.sceneEl.appendChild(this.tpRing);

    if (this.left) {
      this.left.addEventListener("thumbstickmoved", (e) => {
        this.moveX = e.detail.x || 0;
        this.moveY = e.detail.y || 0;
      });
      this.left.addEventListener("thumbstickup", () => { this.moveX = 0; this.moveY = 0; });
    }

    if (this.right) {
      this.right.addEventListener("thumbstickmoved", (e) => { this.turnX = e.detail.x || 0; });
      this.right.addEventListener("thumbstickup", () => { this.turnX = 0; });

      this.right.addEventListener("triggerdown", () => {
        const hit = this._rayHitFloor();
        if (!hit) return;
        const p = hit.point;
        const y = this.rig.object3D.position.y;
        this.rig.object3D.position.set(p.x, y, p.z);
        if (window.hudLog) hudLog(`Teleported ✅ (${p.x.toFixed(2)}, ${p.z.toFixed(2)})`);
      });
    }

    if (window.hudLog) hudLog("Locomotion ✅");
  },

  tick(t, dt) {
    const dts = Math.min(dt / 1000, 0.05);

    // teleport ring update
    const hit = this._rayHitFloor();
    if (hit) {
      const p = hit.point;
      this.tpRing.setAttribute("visible", "true");
      this.tpRing.setAttribute("position", `${p.x} 0.02 ${p.z}`);
    } else {
      this.tpRing.setAttribute("visible", "false");
    }

    // move
    let x = this.moveX, y = this.moveY;
    if (Math.abs(x) < this.data.dead) x = 0;
    if (Math.abs(y) < this.data.dead) y = 0;
    if (this.data.invertX) x = -x;

    if (x || y) {
      const speed = this.data.speed;
      const camObj = (this.cam ? this.cam.object3D : this.rig.object3D);

      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camObj.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camObj.quaternion);
      fwd.y = 0; right.y = 0;
      fwd.normalize(); right.normalize();

      const delta = new THREE.Vector3();
      delta.addScaledVector(fwd, (-y) * speed * dts);
      delta.addScaledVector(right, (x) * speed * dts);
      this.rig.object3D.position.add(delta);
    }

    // snap turn
    if (this.data.snapTurn) {
      if (Math.abs(this.turnX) > 0.65 && (t - this.lastSnap) > 250) {
        const dir = this.turnX > 0 ? -1 : 1;
        this.rig.object3D.rotation.y += (dir * this.data.snapDeg) * (Math.PI / 180);
        this.lastSnap = t;
      }
    }
  },

  _rayHitFloor() {
    const rc = this.right && this.right.components && this.right.components.raycaster;
    if (!rc) return null;
    const hits = rc.intersections;
    if (!hits || !hits.length) return null;
    for (const h of hits) {
      if (h.object?.el?.classList?.contains("teleportable")) return h;
    }
    return hits[0];
  }
});
