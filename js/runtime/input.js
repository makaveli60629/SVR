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
        const max = 86; // less twitch

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

    // XR select hold = move forward, tap = teleport
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

    console.log("✅ Input fixed: world-forward movement + stick detection + smoothing");
  },

  deadzone(v, dz=0.12){
    if (Math.abs(v) < dz) return 0;
    const s = (Math.abs(v) - dz) / (1 - dz);
    return Math.sign(v) * Math.min(1, s);
  },

  // Gets headset forward (world), flattened to XZ, normalized.
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

  // Read BOTH sticks (Quest mappings vary) and choose the stronger one.
  getGamepadAxes(){
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    let best = { x:0, y:0, m:0 };

    for (const gp of gps) {
      if (!gp || !gp.axes) continue;

      // candidate pairs
      const pairs = [
        { x: gp.axes[0] ?? 0, y: gp.axes[1] ?? 0 }, // common left stick
        { x: gp.axes[2] ?? 0, y: gp.axes[3] ?? 0 }, // common right stick
      ];

      for (const p of pairs){
        const m = Math.abs(p.x) + Math.abs(p.y);
        if (m > best.m){
          best = { x: p.x, y: p.y, m };
        }
      }
    }

    if (best.m < 0.02) return null;
    return { x: best.x, y: best.y };
  },

  getRawAxes(){
    // 1) Gamepad (Quest sticks)
    const gp = this.getGamepadAxes();
    if (gp) return { x: gp.x, y: gp.y };

    // 2) Touch joystick
    if (this.joy.active && (Math.abs(this.joy.x) + Math.abs(this.joy.y) > 0.02)) {
      return { x: this.joy.x, y: -this.joy.y };
    }

    // 3) Keys
    const k = this.keys;
    return {
      x: (k.KeyD?1:0) - (k.KeyA?1:0),
      y: (k.KeyW?1:0) - (k.KeyS?1:0),
    };
  },

  raycastTeleport(fromObj){
    const { THREE, camera, rig, teleportSurfaces } = this.ctx;
    if (!teleportSurfaces || teleportSurfaces.length === 0) return false;

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
    if (!hits || hits.length === 0) return false;

    const p = hits[0].point;
    rig.position.set(p.x, Math.max(1.7, p.y + 1.7), p.z);
    return true;
  },

  update(dt){
    const { rig, controller1, controller2, THREE } = this.ctx;

    // Teleport
    if (this.teleportQueued) {
      this.teleportQueued = false;
      const did =
        this.raycastTeleport(controller1) ||
        this.raycastTeleport(controller2) ||
        this.raycastTeleport(null);

      if (!did) {
        // fallback hop forward along world-forward
        const f = this.getWorldForward();
        rig.position.x += f.x * 3.0;
        rig.position.z += f.z * 3.0;
      }
    }

    // HOLD-to-move forward (trigger/pinch hold)
    if (this.moveForwardHeld) {
      const f = this.getWorldForward();
      const speed = 2.15;
      rig.position.x += f.x * speed * dt;
      rig.position.z += f.z * speed * dt;
      rig.position.y = Math.max(rig.position.y, 1.6);
      return;
    }

    // Axes move (stick/keys/touch) with smoothing
    const raw = this.getRawAxes();
    const tx = this.deadzone(raw.x, 0.12);
    const ty = this.deadzone(raw.y, 0.12);

    const k = 1 - Math.pow(0.001, dt);
    this.ax += (tx - this.ax) * k;
    this.ay += (ty - this.ay) * k;

    const mag = Math.abs(this.ax) + Math.abs(this.ay);
    if (mag < 0.001) return;

    // Move relative to world-forward + world-right
    const f = this.getWorldForward();
    const r = new THREE.Vector3(-f.z, 0, f.x); // right = rotate forward 90°

    const speed = 2.35;
    const vx = (r.x * this.ax + f.x * this.ay) * speed * dt;
    const vz = (r.z * this.ax + f.z * this.ay) * speed * dt;

    rig.position.x += vx;
    rig.position.z += vz;
    rig.position.y = Math.max(rig.position.y, 1.6);
  }
};
