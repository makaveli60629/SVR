export const Input = {
  ctx: null,

  moveSpeed: 2.2,
  turnSpeed: 2.2,

  teleportQueued: false,
  lastSelectTime: 0,
  holdingSelect: false,

  feetRing: null,
  reticle: null,

  // ONE laser only (always attached to "aim parent")
  laser: null,
  laserLen: 7.0,
  laserParent: null,

  init(ctx) {
    this.ctx = ctx;

    const onSelectStart = () => {
      this.lastSelectTime = performance.now();
      this.holdingSelect = true;
    };
    const onSelectEnd = () => {
      const t = performance.now() - this.lastSelectTime;
      this.holdingSelect = false;
      if (t < 260) this.teleportQueued = true;
    };

    ctx.controller1?.addEventListener("selectstart", onSelectStart);
    ctx.controller1?.addEventListener("selectend", onSelectEnd);
    ctx.controller2?.addEventListener("selectstart", onSelectStart);
    ctx.controller2?.addEventListener("selectend", onSelectEnd);

    this.buildViz();
    console.log("✅ Input initialized (single laser attached to aim)");
  },

  deadzone(v, dz = 0.14) {
    if (Math.abs(v) < dz) return 0;
    return Math.sign(v) * (Math.abs(v) - dz) / (1 - dz);
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

  // Controller pose is "ok" only if it is non-zero and not NaN
  poseOk(obj) {
    if (!obj) return false;
    const v = new this.ctx.THREE.Vector3();
    obj.getWorldPosition(v);
    return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z) && v.lengthSq() > 1e-6;
  },

  getForward() {
    const { THREE } = this.ctx;
    const cam = this.getXRCamera();
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    return dir;
  },

  makeLaser(len = 7) {
    const { THREE } = this.ctx;
    const g = new THREE.Group();
    g.name = "laser";

    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -len),
    ]);

    const line = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color: 0x00ffff })
    );

    g.add(line);
    return g;
  },

  buildViz() {
    const { THREE, scene } = this.ctx;

    // Feet ring
    this.feetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.42, 44),
      new THREE.MeshBasicMaterial({
        color: 0x00c8ff,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      })
    );
    this.feetRing.rotation.x = -Math.PI / 2;
    scene.add(this.feetRing);

    // Reticle
    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.18, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      })
    );
    this.reticle.rotation.x = -Math.PI / 2;
    this.reticle.visible = false;
    scene.add(this.reticle);

    // Single laser (NOT added to scene forever)
    this.laser = this.makeLaser(this.laserLen);
    this.laser.visible = true;

    // We'll attach it during update() to right controller / camera.
    this.laserParent = null;
  },

  updateFeetRing() {
    const { rig } = this.ctx;
    // keep feet ring on "ground plane" reference
    this.feetRing.position.set(rig.position.x, 0.02, rig.position.z);
  },

  // Choose RIGHT controller as priority (Quest often has controller2 as right, but not always)
  getRightController() {
    const { controller1, controller2 } = this.ctx;

    // If handedness exists, use it
    const h1 = controller1?.userData?.handedness;
    const h2 = controller2?.userData?.handedness;

    if (h1 === "right" && this.poseOk(controller1)) return controller1;
    if (h2 === "right" && this.poseOk(controller2)) return controller2;

    // otherwise prefer controller2, then controller1 (matches your old behavior)
    if (this.poseOk(controller2)) return controller2;
    if (this.poseOk(controller1)) return controller1;

    return null;
  },

  // Aim object = right controller if available else XR camera
  getAimObj() {
    const right = this.getRightController();
    if (right) return right;
    return this.getXRCamera();
  },

  // Attach laser to aim object (so it NEVER stays in world origin)
  ensureLaserAttached(aimObj) {
    if (!this.laser) return;

    // If parent already correct, do nothing
    if (this.laserParent === aimObj) return;

    // Detach from old parent
    if (this.laserParent && this.laserParent.remove) {
      this.laserParent.remove(this.laser);
    }

    // Attach to new parent
    if (aimObj && aimObj.add) {
      aimObj.add(this.laser);
      this.laser.position.set(0, 0, 0);
      this.laser.rotation.set(0, 0, 0);
      this.laser.visible = true;
      this.laserParent = aimObj;
    }
  },

  raycast(fromObj) {
    const { THREE, teleportSurfaces } = this.ctx;
    if (!teleportSurfaces?.length) return null;

    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();

    fromObj.getWorldPosition(o);
    fromObj.getWorldDirection(d);

    if (d.lengthSq() < 1e-6) d.set(0, 0, -1);

    ray.set(o, d.normalize());
    return ray.intersectObjects(teleportSurfaces, true)[0] || null;
  },

  snapGround() {
    const { THREE, rig, walkSurfaces } = this.ctx;
    if (!walkSurfaces?.length) return;

    const ray = new THREE.Raycaster();
    ray.set(
      new THREE.Vector3(rig.position.x, 4.0, rig.position.z),
      new THREE.Vector3(0, -1, 0)
    );

    const hit = ray.intersectObjects(walkSurfaces, true)[0];
    if (hit) rig.position.y = hit.point.y + 1.7;
  },

  // Safer gamepad picker (Quest sometimes reports multiple pads)
  getBestGamepad() {
    const pads = navigator.getGamepads?.() || [];

    // Prefer connected pads with 4 axes
    for (const p of pads) {
      if (p && p.connected && p.axes && p.axes.length >= 4) return p;
    }
    // fallback any pad with 2 axes
    for (const p of pads) {
      if (p && p.connected && p.axes && p.axes.length >= 2) return p;
    }
    return null;
  },

  update(dt) {
    const { rig } = this.ctx;

    this.updateFeetRing();

    // 1) Aim
    const aimObj = this.getAimObj();

    // 2) Laser always attached to aim object (fixes "stuck in middle")
    this.ensureLaserAttached(aimObj);

    // 3) Reticle
    const hit = this.raycast(aimObj);
    if (hit) {
      this.reticle.visible = true;
      this.reticle.position.copy(hit.point);
      this.reticle.position.y += 0.02;
    } else {
      this.reticle.visible = false;
    }

    // 4) Teleport
    if (this.teleportQueued) {
      this.teleportQueued = false;
      if (hit) {
        rig.position.set(hit.point.x, hit.point.y + 1.7, hit.point.z);
        this.snapGround();
      }
      return;
    }

    // 5) Hold trigger = walk forward
    if (this.holdingSelect) {
      const f = this.getForward();
      rig.position.x += f.x * 2.0 * dt;
      rig.position.z += f.z * 2.0 * dt;
      this.snapGround();
      return;
    }

    // 6) Stick locomotion
    const gp = this.getBestGamepad();
    if (!gp) return;

    // axes[0],axes[1] = left stick
    // axes[2]        = right stick X (turn)
    const lx = this.deadzone(gp.axes[0] || 0);
    const ly = this.deadzone(-(gp.axes[1] || 0));
    const rx = this.deadzone(gp.axes[2] || 0);

    const f = this.getForward();
    const r = new this.ctx.THREE.Vector3(-f.z, 0, f.x);

    rig.position.x += (r.x * lx + f.x * ly) * this.moveSpeed * dt;
    rig.position.z += (r.z * lx + f.z * ly) * this.moveSpeed * dt;
    rig.rotation.y -= rx * this.turnSpeed * dt;

    this.snapGround();
  },
};
