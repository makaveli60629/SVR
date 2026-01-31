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

  locomotionGroup: null,
  rayLine: null,
  reticle: null,
  feetRing: null,

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
    console.log("✅ Input ready (laser fixed: world->local)");
  },

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

  pickAim() {
    const { THREE, controller1, controller2 } = this.ctx;
    const cam = this.getXRCamera();
    const tmp = new THREE.Vector3();

    const ok = (c) => {
      if (!c) return false;
      c.getWorldPosition(tmp);
      return (Math.abs(tmp.x) + Math.abs(tmp.y) + Math.abs(tmp.z)) > 0.001;
    };

    if (ok(controller1)) return controller1;
    if (ok(controller2)) return controller2;
    return cam;
  },

  getForward() {
    const { THREE } = this.ctx;
    const cam = this.getXRCamera();
    const d = new THREE.Vector3();
    cam.getWorldDirection(d);
    d.y = 0;
    const l = Math.hypot(d.x, d.z) || 1;
    d.x /= l;
    d.z /= l;
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

  buildViz() {
    const { THREE, scene } = this.ctx;

    // Feet ring (world) glued to rig
    this.feetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.20, 0.40, 44),
      new THREE.MeshBasicMaterial({
        color: 0x00c8ff,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      })
    );
    this.feetRing.rotation.x = -Math.PI / 2;
    scene.add(this.feetRing);

    // Locomotion group (we position/rotate it to XR camera each frame)
    this.locomotionGroup = new THREE.Group();
    scene.add(this.locomotionGroup);

    // Ray line geometry (LOCAL to locomotionGroup — we write local coords!)
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -3),
    ]);
    this.rayLine = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color: 0x00ffff })
    );
    this.locomotionGroup.add(this.rayLine);

    // Reticle is world-space at hit point
    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.18, 40),
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

  rayTeleportFrom(fromObj) {
    const { THREE, teleportSurfaces } = this.ctx;
    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();

    fromObj.getWorldPosition(o);
    fromObj.getWorldDirection(d);
    ray.set(o, d.normalize());

    const hits = ray.intersectObjects(teleportSurfaces, true);
    return hits?.[0] || null;
  },

  updateFeetRing() {
    const { rig } = this.ctx;
    this.feetRing.position.set(rig.position.x, rig.position.y - 1.68, rig.position.z);
  },

  attachLocomotionToXRCamera() {
    const cam = this.getXRCamera();
    cam.getWorldPosition(this.locomotionGroup.position);
    cam.getWorldQuaternion(this.locomotionGroup.quaternion);
  },

  // ✅ FIX: Write RAY in locomotionGroup LOCAL coordinates
  updateViz(hit, fromObj) {
    const { THREE } = this.ctx;

    const oW = new THREE.Vector3();
    const dW = new THREE.Vector3();
    fromObj.getWorldPosition(oW);
    fromObj.getWorldDirection(dW);

    const endW = hit ? hit.point.clone() : oW.clone().add(dW.multiplyScalar(3.0));

    // Convert world points to locomotionGroup local space
    const oL = this.locomotionGroup.worldToLocal(oW.clone());
    const eL = this.locomotionGroup.worldToLocal(endW.clone());

    const arr = this.rayLine.geometry.attributes.position.array;
    arr[0] = oL.x; arr[1] = oL.y; arr[2] = oL.z;
    arr[3] = eL.x; arr[4] = eL.y; arr[5] = eL.z;
    this.rayLine.geometry.attributes.position.needsUpdate = true;

    if (hit) {
      this.reticle.visible = true;
      this.reticle.position.copy(hit.point);
      this.reticle.position.y += 0.02;
    } else {
      this.reticle.visible = false;
    }
  },

  update(dt) {
    const { rig, controller1, controller2 } = this.ctx;
    this.snapT = Math.max(0, this.snapT - dt);

    this.attachLocomotionToXRCamera();
    this.updateFeetRing();

    const aim = this.pickAim();
    const hit = this.rayTeleportFrom(aim);
    this.updateViz(hit, aim);

    if (this.teleportQueued) {
      this.teleportQueued = false;
      if (hit) {
        rig.position.set(hit.point.x, hit.point.y + 1.7, hit.point.z);
        this.snapGround();
      }
      return;
    }

    if (this.holdingSelect) {
      const f = this.getForward();
      rig.position.x += f.x * 2.0 * dt;
      rig.position.z += f.z * 2.0 * dt;
      this.snapGround();
      return;
    }

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
