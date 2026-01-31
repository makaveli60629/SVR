export const Input = {
  ctx: null,

  moveSpeed: 2.1,
  snapTurn: true,
  snapAngle: Math.PI / 6,
  snapCooldown: 0.28,
  snapT: 0,

  teleportQueued: false,
  lastSelectTime: 0,
  holdingSelect: false,

  // visuals
  rayRoot: null,     // a small group we "pose" to the active aim
  rayLine: null,     // child of rayRoot (LOCAL geometry)
  reticle: null,     // world-space at hit point
  feetRing: null,    // world-space at rig feet

  init(ctx) {
    this.ctx = ctx;

    const onSelectStart = () => {
      this.lastSelectTime = performance.now();
      this.holdingSelect = true;
    };
    const onSelectEnd = () => {
      const t = performance.now() - this.lastSelectTime;
      this.holdingSelect = false;
      if (t < 260) this.teleportQueued = true; // tap = teleport
    };

    ctx.controller1?.addEventListener("selectstart", onSelectStart);
    ctx.controller1?.addEventListener("selectend", onSelectEnd);
    ctx.controller2?.addEventListener("selectstart", onSelectStart);
    ctx.controller2?.addEventListener("selectend", onSelectEnd);

    this.buildViz();
    console.log("✅ Input ready (ray posed to active aim)");
  },

  // ---- helpers
  deadzone(v, dz = 0.18) {
    if (Math.abs(v) < dz) return 0;
    const s = (Math.abs(v) - dz) / (1 - dz);
    return Math.sign(v) * Math.min(1, s);
  },

  getXRCamera() {
    const { renderer, camera } = this.ctx;
    try {
      const xrCam = renderer.xr.getCamera(camera);
      return xrCam?.cameras?.[0] || xrCam || camera;
    } catch {
      return camera;
    }
  },

  // controller pose is valid if it's not at/near origin
  controllerOk(c) {
    if (!c) return false;
    const p = this._tmpV || (this._tmpV = new this.ctx.THREE.Vector3());
    c.getWorldPosition(p);
    return (Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.z)) > 0.001;
  },

  pickAim() {
    const { controller1, controller2 } = this.ctx;
    if (this.controllerOk(controller1)) return controller1;
    if (this.controllerOk(controller2)) return controller2;
    return this.getXRCamera();
  },

  getForward() {
    const { THREE } = this.ctx;
    const cam = this.getXRCamera();
    const d = new THREE.Vector3();
    cam.getWorldDirection(d);
    d.y = 0;
    const l = Math.hypot(d.x, d.z) || 1;
    d.x /= l; d.z /= l;
    return d;
  },

  getGamepad(c) {
    const gp = c?.gamepad;
    return gp && gp.axes ? gp : null;
  },

  pickStick(gp, idx) {
    if (!gp) return { x: 0, y: 0 };
    const pairs = [
      { x: gp.axes[0] || 0, y: gp.axes[1] || 0 },
      { x: gp.axes[2] || 0, y: gp.axes[3] || 0 },
    ];
    const p = pairs[idx] || pairs[0];
    return { x: p.x, y: -(p.y) };
  },

  // ---- build visuals
  buildViz() {
    const { THREE, scene } = this.ctx;

    // Feet ring
    this.feetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.20, 0.40, 44),
      new THREE.MeshBasicMaterial({
        color: 0x00c8ff,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      })
    );
    this.feetRing.rotation.x = -Math.PI / 2;
    scene.add(this.feetRing);

    // Ray root (we set its world pose to the aim each frame)
    this.rayRoot = new THREE.Group();
    scene.add(this.rayRoot);

    // Ray line (LOCAL to rayRoot)
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -6),
    ]);
    this.rayLine = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color: 0x00ffff })
    );
    this.rayRoot.add(this.rayLine);

    // Reticle
    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.18, 40),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
      })
    );
    this.reticle.rotation.x = -Math.PI / 2;
    this.reticle.visible = false;
    scene.add(this.reticle);
  },

  updateFeetRing() {
    const { rig } = this.ctx;
    this.feetRing.position.set(rig.position.x, rig.position.y - 1.68, rig.position.z);
  },

  // Pose rayRoot to aim (world pose)
  poseRayToAim(aimObj) {
    const { THREE } = this.ctx;
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    aimObj.getWorldPosition(p);
    aimObj.getWorldQuaternion(q);
    this.rayRoot.position.copy(p);
    this.rayRoot.quaternion.copy(q);
  },

  rayTeleportFrom(aimObj) {
    const { THREE, teleportSurfaces } = this.ctx;

    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();
    aimObj.getWorldPosition(o);
    aimObj.getWorldDirection(d);
    ray.set(o, d.normalize());

    const hits = ray.intersectObjects(teleportSurfaces, true);
    return hits?.[0] || null;
  },

  updateReticle(hit) {
    if (hit) {
      this.reticle.visible = true;
      this.reticle.position.copy(hit.point);
      this.reticle.position.y += 0.02;
    } else {
      this.reticle.visible = false;
    }
  },

  snapGround() {
    const { THREE, rig, walkSurfaces } = this.ctx;
    if (!walkSurfaces?.length) return;

    const ray = new THREE.Raycaster();
    ray.set(
      new THREE.Vector3(rig.position.x, rig.position.y + 1.6, rig.position.z),
      new THREE.Vector3(0, -1, 0)
    );
    const hits = ray.intersectObjects(walkSurfaces, true);
    if (!hits?.length) return;
    rig.position.y = hits[0].point.y + 1.7;
  },

  update(dt) {
    const { rig, controller1, controller2 } = this.ctx;
    this.snapT = Math.max(0, this.snapT - dt);

    this.updateFeetRing();

    const aim = this.pickAim();

    // ✅ THIS is the laser fix: rayRoot follows aim pose every frame
    this.poseRayToAim(aim);

    const hit = this.rayTeleportFrom(aim);
    this.updateReticle(hit);

    // Tap trigger = teleport
    if (this.teleportQueued) {
      this.teleportQueued = false;
      if (hit) {
        rig.position.set(hit.point.x, hit.point.y + 1.7, hit.point.z);
        this.snapGround();
      }
      return;
    }

    // Hold trigger = walk forward
    if (this.holdingSelect) {
      const f = this.getForward();
      rig.position.x += f.x * 2.0 * dt;
      rig.position.z += f.z * 2.0 * dt;
      this.snapGround();
      return;
    }

    // Thumbsticks (best effort)
    const gp = this.getGamepad(controller1) || this.getGamepad(controller2);
    const a0 = this.pickStick(gp, 0);
    const a1 = this.pickStick(gp, 1);

    const m0 = Math.abs(a0.x) + Math.abs(a0.y);
    const m1 = Math.abs(a1.x) + Math.abs(a1.y);

    const move = (m0 >= m1) ? a0 : a1;
    const turn = (m0 >= m1) ? a1 : a0;

    const mx = this.deadzone(move.x, 0.18);
    const my = this.deadzone(move.y, 0.18);
    const tx = this.deadzone(turn.x, 0.25);

    const f = this.getForward();
    const r = new this.ctx.THREE.Vector3(-f.z, 0, f.x);

    rig.position.x += (r.x * mx + f.x * my) * this.moveSpeed * dt;
    rig.position.z += (r.z * mx + f.z * my) * this.moveSpeed * dt;

    if (this.snapTurn && this.snapT <= 0 && Math.abs(tx) > 0.55) {
      rig.rotation.y -= Math.sign(tx) * this.snapAngle;
      this.snapT = this.snapCooldown;
    }

    this.snapGround();
  }
};
