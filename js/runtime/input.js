export const Input = {
  ctx: null,

  keys: {},
  joy: { active:false, id:null, sx:0, sy:0, x:0, y:0 },

  teleportQueued: false,
  moveForwardHeld: false,
  lastSelectTime: 0,

  // smoothed axes
  ax: 0,
  ay: 0,

  // visuals
  reticle: null,
  leftGrip: null,
  rightGrip: null,
  leftHandJoints: null,
  rightHandJoints: null,

  init(ctx){
    this.ctx = ctx;

    addEventListener("keydown", e => this.keys[e.code] = true);
    addEventListener("keyup", e => this.keys[e.code] = false);

    // Touch joystick (Android)
    const joyZone = document.getElementById("joyZone");
    if (joyZone) {
      const down = (e) => {
        const t = e.changedTouches ? e.changedTouches[0] : e;
        this.joy.active = true;
        this.joy.id = t.identifier ?? "mouse";
        this.joy.sx = t.clientX;
        this.joy.sy = t.clientY;
        this.joy.x = 0; this.joy.y = 0;
      };

      const move = (e) => {
        if (!this.joy.active) return;
        let t = null;
        if (e.changedTouches) {
          for (const tt of e.changedTouches) if (tt.identifier === this.joy.id) t = tt;
        } else t = e;
        if (!t) return;

        const dx = t.clientX - this.joy.sx;
        const dy = t.clientY - this.joy.sy;
        const max = 86;

        this.joy.x = Math.max(-1, Math.min(1, dx / max));
        this.joy.y = Math.max(-1, Math.min(1, dy / max));
        e.preventDefault?.();
      };

      const up = () => {
        this.joy.active = false;
        this.joy.id = null;
        this.joy.x = 0; this.joy.y = 0;
      };

      joyZone.addEventListener("touchstart", down, { passive:false });
      joyZone.addEventListener("touchmove", move, { passive:false });
      joyZone.addEventListener("touchend", up, { passive:true });
      joyZone.addEventListener("touchcancel", up, { passive:true });

      joyZone.addEventListener("mousedown", down);
      addEventListener("mousemove", move);
      addEventListener("mouseup", up);
    }

    // Tap teleport (Android)
    const teleZone = document.getElementById("teleZone");
    if (teleZone) {
      teleZone.addEventListener("click", () => { this.teleportQueued = true; });
      teleZone.addEventListener("touchend", () => { this.teleportQueued = true; }, { passive:true });
    }

    // XR: hold select = move forward, tap = teleport
    const onSelectStart = () => {
      this.lastSelectTime = performance.now();
      this.moveForwardHeld = true;
    };
    const onSelectEnd = () => {
      const t = performance.now() - this.lastSelectTime;
      this.moveForwardHeld = false;
      if (t < 240) this.teleportQueued = true;
    };

    const { controller1, controller2 } = ctx;
    [controller1, controller2].forEach(obj => {
      if (!obj) return;
      obj.addEventListener("selectstart", onSelectStart);
      obj.addEventListener("selectend", onSelectEnd);
    });

    // Build visuals: reticle + simple controller grips + hand joints (if available)
    this.buildVisuals();

    console.log("✅ Input: Quest sticks + gravity snap + reticle + hands");
  },

  // -------------------------
  // VISUALS
  // -------------------------
  buildVisuals(){
    const { THREE, scene, controller1, controller2, renderer } = this.ctx;

    // Teleport reticle (visible circle on floor where you're aiming)
    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.32, 40),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent:true, opacity:0.85, side:THREE.DoubleSide })
    );
    this.reticle.rotation.x = -Math.PI/2;
    this.reticle.visible = false;
    scene.add(this.reticle);

    // Simple “plastic” controller grip models (always visible if controllers exist)
    const gripMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.35, metalness: 0.05, emissive: 0x000000 });
    const gripGeo = new THREE.CapsuleGeometry(0.035, 0.09, 6, 10);

    this.leftGrip = new THREE.Mesh(gripGeo, gripMat);
    this.rightGrip = new THREE.Mesh(gripGeo, gripMat);
    this.leftGrip.rotation.x = Math.PI/2;
    this.rightGrip.rotation.x = Math.PI/2;

    if (controller1) controller1.add(this.leftGrip);
    if (controller2) controller2.add(this.rightGrip);

    // Hand tracking joint spheres if WebXR hands are available
    // We attach them when session starts (Quest Browser).
    const tryAttachHands = () => {
      const session = renderer?.xr?.getSession?.();
      if (!session) return;

      // Find hands from inputSources
      const sources = session.inputSources || [];
      for (const src of sources) {
        if (!src.hand) continue;
        const handedness = src.handedness; // "left" or "right"

        const jointGroup = new THREE.Group();
        const jointMat = new THREE.MeshStandardMaterial({
          color: 0xffffff, roughness: 0.25, metalness: 0.0,
          emissive: 0x222222, emissiveIntensity: 0.3
        });
        const jointGeo = new THREE.SphereGeometry(0.007, 10, 10);

        // 25 joints typical; we create meshes by joint name
        const jointMeshes = {};
        for (const [name] of src.hand.entries()) {
          const m = new THREE.Mesh(jointGeo, jointMat);
          jointMeshes[name] = m;
          jointGroup.add(m);
        }

        if (handedness === "left") {
          this.leftHandJoints = { src, group: jointGroup, meshes: jointMeshes };
          this.ctx.scene.add(jointGroup);
        } else if (handedness === "right") {
          this.rightHandJoints = { src, group: jointGroup, meshes: jointMeshes };
          this.ctx.scene.add(jointGroup);
        }
      }
    };

    // Attempt immediately and also when XR session starts
    tryAttachHands();
    this.ctx.renderer?.xr?.addEventListener?.("sessionstart", tryAttachHands);
  },

  updateHandJoints(){
    const { renderer, THREE } = this.ctx;
    const session = renderer?.xr?.getSession?.();
    if (!session) return;

    // We need XRFrame to read joint poses; Three gives it via renderer.xr.getFrame()
    // Some builds expose renderer.xr.getFrame(); if not, we just keep grips.
    const frame = renderer.xr.getFrame?.();
    const refSpace = renderer.xr.getReferenceSpace?.();
    if (!frame || !refSpace) return;

    const updateOne = (handObj) => {
      if (!handObj?.src?.hand) return;
      for (const [name, joint] of handObj.src.hand.entries()) {
        const pose = frame.getJointPose?.(joint, refSpace);
        if (!pose) continue;
        const m = handObj.meshes[name];
        if (!m) continue;
        m.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
      }
    };

    updateOne(this.leftHandJoints);
    updateOne(this.rightHandJoints);
  },

  // -------------------------
  // MATH / INPUT
  // -------------------------
  deadzone(v, dz=0.15){
    if (Math.abs(v) < dz) return 0;
    const s = (Math.abs(v) - dz) / (1 - dz);
    return Math.sign(v) * Math.min(1, s);
  },

  getWorldForward(){
    const { THREE, camera } = this.ctx;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    const len = Math.hypot(dir.x, dir.z);
    if (len < 1e-6) return new THREE.Vector3(0,0,-1);
    dir.x /= len; dir.z /= len;
    return dir;
  },

  // Quest controllers: read axes from controller1/2 gamepads first, fallback to navigator.getGamepads
  getControllerAxes(){
    const readGp = (gp) => {
      if (!gp || !gp.axes) return null;

      const candidates = [
        { x: gp.axes[0] ?? 0, y: gp.axes[1] ?? 0 },
        { x: gp.axes[2] ?? 0, y: gp.axes[3] ?? 0 },
        // some mappings:
        { x: gp.axes[1] ?? 0, y: gp.axes[0] ?? 0 },
        { x: gp.axes[3] ?? 0, y: gp.axes[2] ?? 0 },
      ];

      let best = { x:0, y:0, m:0 };
      for (const c of candidates){
        const m = Math.abs(c.x) + Math.abs(c.y);
        if (m > best.m) best = { x:c.x, y:c.y, m };
      }
      if (best.m < 0.04) return null;
      return { x: best.x, y: best.y };
    };

    const c1 = this.ctx.controller1;
    const c2 = this.ctx.controller2;

    const a1 = readGp(c1?.gamepad);
    const a2 = readGp(c2?.gamepad);

    // pick stronger
    const m1 = a1 ? Math.abs(a1.x)+Math.abs(a1.y) : 0;
    const m2 = a2 ? Math.abs(a2.x)+Math.abs(a2.y) : 0;

    if (m1 >= m2 && a1) return a1;
    if (a2) return a2;

    // fallback navigator
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    let best = { x:0, y:0, m:0 };
    for (const gp of gps){
      const a = readGp(gp);
      if (!a) continue;
      const m = Math.abs(a.x)+Math.abs(a.y);
      if (m > best.m) best = { ...a, m };
    }
    if (best.m > 0.04) return { x: best.x, y: best.y };
    return null;
  },

  getRawAxes(){
    // 1) Quest controllers
    const qa = this.getControllerAxes();
    if (qa) return { x: qa.x, y: -qa.y }; // invert Y so up = forward

    // 2) Touch joystick
    if (this.joy.active && (Math.abs(this.joy.x) + Math.abs(this.joy.y) > 0.02)) {
      return { x: this.joy.x, y: -this.joy.y };
    }

    // 3) Keyboard
    const k = this.keys;
    return {
      x: (k.KeyD?1:0) - (k.KeyA?1:0),
      y: (k.KeyW?1:0) - (k.KeyS?1:0),
    };
  },

  // Teleport raycast + reticle
  raycastTeleport(fromObj){
    const { THREE, camera, teleportSurfaces } = this.ctx;
    if (!teleportSurfaces || teleportSurfaces.length === 0) return null;

    const raycaster = new THREE.Raycaster();
    const origin = new THREE.Vector3();
    const dir = new THREE.Vector3();

    if (fromObj) {
      fromObj.getWorldPosition(origin);
      fromObj.getWorldDirection(dir);
    } else {
      camera.getWorldPosition(origin);
      camera.getWorldDirection(dir);
    }

    raycaster.set(origin, dir.normalize());
    const hits = raycaster.intersectObjects(teleportSurfaces, true);
    if (!hits || hits.length === 0) return null;
    return hits[0];
  },

  // “Gravity” snap: cast down from rig to walk surfaces and set rig.y accordingly
  snapToGround(){
    const { THREE, rig, walkSurfaces, camera } = this.ctx;
    const surfaces = walkSurfaces && walkSurfaces.length ? walkSurfaces : this.ctx.teleportSurfaces;
    if (!surfaces || !surfaces.length) return;

    const raycaster = new THREE.Raycaster();
    const origin = new THREE.Vector3(rig.position.x, rig.position.y + 1.0, rig.position.z);
    const dir = new THREE.Vector3(0,-1,0);
    raycaster.set(origin, dir);

    const hits = raycaster.intersectObjects(surfaces, true);
    if (!hits || !hits.length) return;

    // eye height used by your rig
    const eye = 1.7;
    const groundY = hits[0].point.y;
    rig.position.y = groundY + eye;
  },

  update(dt){
    const { rig, controller1, controller2 } = this.ctx;

    // Update hand joints if available
    this.updateHandJoints();

    // Reticle update (always show if ray hits)
    const h = this.raycastTeleport(controller1) || this.raycastTeleport(controller2) || this.raycastTeleport(null);
    if (h) {
      this.reticle.visible = true;
      this.reticle.position.set(h.point.x, h.point.y + 0.01, h.point.z);
    } else {
      this.reticle.visible = false;
    }

    // Teleport
    if (this.teleportQueued) {
      this.teleportQueued = false;

      if (h) {
        rig.position.set(h.point.x, Math.max(1.7, h.point.y + 1.7), h.point.z);
      } else {
        // fallback hop forward
        const f = this.getWorldForward();
        rig.position.x += f.x * 2.6;
        rig.position.z += f.z * 2.6;
      }
      this.snapToGround();
      return;
    }

    // Hold-to-move forward (trigger/pinch hold)
    if (this.moveForwardHeld) {
      const f = this.getWorldForward();
      const speed = 2.2;
      rig.position.x += f.x * speed * dt;
      rig.position.z += f.z * speed * dt;
      this.snapToGround();
      return;
    }

    // Axes move (stick/keys/touch) + smoothing
    const raw = this.getRawAxes();
    const tx = this.deadzone(raw.x, 0.15);
    const ty = this.deadzone(raw.y, 0.15);

    const k = 1 - Math.pow(0.001, dt);
    this.ax += (tx - this.ax) * k;
    this.ay += (ty - this.ay) * k;

    const mag = Math.abs(this.ax) + Math.abs(this.ay);
    if (mag < 0.002) {
      this.snapToGround();
      return;
    }

    const { THREE } = this.ctx;
    const f = this.getWorldForward();
    const r = new THREE.Vector3(-f.z, 0, f.x);

    const speed = 2.5;
    const vx = (r.x * this.ax + f.x * this.ay) * speed * dt;
    const vz = (r.z * this.ax + f.z * this.ay) * speed * dt;

    rig.position.x += vx;
    rig.position.z += vz;

    // “gravity”
    this.snapToGround();
  }
};
