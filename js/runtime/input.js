// /js/runtime/input.js
// Movement + teleport + lasers that ALWAYS attach to controllers when available.
// NOTE: controller2 is treated as RIGHT hand (Quest standard).
export const Input = {
  ctx: null,

  moveSpeed: 2.2,
  turnSpeed: 2.2,

  teleportQueued: false,
  lastSelectTime: 0,
  holdingSelect: false,

  feetRing: null,
  reticle: null,

  rayCam: null,
  rayC1: null,
  rayC2: null,

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

    ctx.controller1?.addEventListener('selectstart', onSelectStart);
    ctx.controller1?.addEventListener('selectend', onSelectEnd);
    ctx.controller2?.addEventListener('selectstart', onSelectStart);
    ctx.controller2?.addEventListener('selectend', onSelectEnd);

    this.buildViz();
    this.ctx.log?.('✅ Input initialized');
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

  poseOk(obj) {
    if (!obj) return false;
    const v = new this.ctx.THREE.Vector3();
    obj.getWorldPosition(v);
    return v.lengthSq() > 0.000001;
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
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -len),
    ]);
    const line = new THREE.Line(geom, new THREE.LineBasicMaterial({ color: 0x00ffff }));
    g.add(line);
    return g;
  },

  buildViz() {
    const { THREE, scene, controller1, controller2 } = this.ctx;

    this.feetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.42, 44),
      new THREE.MeshBasicMaterial({ color: 0x00c8ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
    );
    this.feetRing.rotation.x = -Math.PI / 2;
    scene.add(this.feetRing);

    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.18, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    this.reticle.rotation.x = -Math.PI / 2;
    this.reticle.visible = false;
    scene.add(this.reticle);

    this.rayCam = this.makeLaser();
    scene.add(this.rayCam);

    this.rayC1 = this.makeLaser();
    this.rayC2 = this.makeLaser();

    if (controller1) controller1.add(this.rayC1);
    if (controller2) controller2.add(this.rayC2);
  },

  updateFeetRing() {
    const { rig } = this.ctx;
    this.feetRing.position.set(rig.position.x, 0.02, rig.position.z);
  },

  getAim() {
    const { controller1, controller2 } = this.ctx;
    // Prefer RIGHT hand
    if (this.poseOk(controller2)) return { type: 'c2', obj: controller2 };
    if (this.poseOk(controller1)) return { type: 'c1', obj: controller1 };
    return { type: 'cam', obj: this.getXRCamera() };
  },

  raycast(obj) {
    const { THREE, teleportSurfaces } = this.ctx;
    if (!teleportSurfaces?.length) return null;

    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();

    obj.getWorldPosition(o);
    obj.getWorldDirection(d);

    ray.set(o, d.normalize());
    return ray.intersectObjects(teleportSurfaces, true)[0] || null;
  },

  snapGround() {
    const { THREE, rig, walkSurfaces } = this.ctx;
    if (!walkSurfaces?.length) return;

    const ray = new THREE.Raycaster();
    ray.set(new THREE.Vector3(rig.position.x, 4.0, rig.position.z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObjects(walkSurfaces, true)[0];
    if (hit) rig.position.y = hit.point.y + 1.7;
  },

  getBestGamepad() {
    const pads = navigator.getGamepads?.() || [];
    for (const p of pads) if (p && p.connected && p.axes && p.axes.length >= 4) return p;
    for (const p of pads) if (p && p.connected && p.axes && p.axes.length >= 2) return p;
    return null;
  },

  update(dt) {
    const { rig } = this.ctx;
    this.updateFeetRing();

    const aim = this.getAim();

    this.rayCam.visible = aim.type === 'cam';
    this.rayC1.visible = aim.type === 'c1';
    this.rayC2.visible = aim.type === 'c2';

    if (aim.type === 'cam') {
      const p = new this.ctx.THREE.Vector3();
      const q = new this.ctx.THREE.Quaternion();
      aim.obj.getWorldPosition(p);
      aim.obj.getWorldQuaternion(q);
      this.rayCam.position.copy(p);
      this.rayCam.quaternion.copy(q);
    }

    const hit = this.raycast(aim.obj);
    if (hit) {
      this.reticle.visible = true;
      this.reticle.position.copy(hit.point);
      this.reticle.position.y += 0.02;
    } else {
      this.reticle.visible = false;
    }

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

    const gp = this.getBestGamepad();
    if (!gp) return;

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
