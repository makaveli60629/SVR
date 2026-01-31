export const Input = {
  ctx: null,
  keys: {},
  joy: { active:false, id:null, sx:0, sy:0, x:0, y:0 },
  teleportQueued: false,
  moveForwardHeld: false,
  lastSelectTime: 0,

  init(ctx){
    this.ctx = ctx;

    // Keyboard fallback
    addEventListener("keydown", e => this.keys[e.code] = true);
    addEventListener("keyup", e => this.keys[e.code] = false);

    // Touch joystick (Android) bottom-left
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
        const max = 70;

        this.joy.x = Math.max(-1, Math.min(1, dx / max));
        this.joy.y = Math.max(-1, Math.min(1, dy / max));

        window.__joy = { x:this.joy.x, y:this.joy.y, active:this.joy.active };
        e.preventDefault?.();
      };

      const up = () => {
        this.joy.active = false;
        this.joy.id = null;
        this.joy.x = 0; this.joy.y = 0;
        window.__joy = { x:0, y:0, active:false };
      };

      joyZone.addEventListener("touchstart", down, { passive:false });
      joyZone.addEventListener("touchmove", move, { passive:false });
      joyZone.addEventListener("touchend", up, { passive:true });
      joyZone.addEventListener("touchcancel", up, { passive:true });

      joyZone.addEventListener("mousedown", down);
      addEventListener("mousemove", move);
      addEventListener("mouseup", up);
    }

    // Tap teleport (Android) bottom-right
    const teleZone = document.getElementById("teleZone");
    if (teleZone) {
      teleZone.addEventListener("click", () => { this.teleportQueued = true; });
      teleZone.addEventListener("touchend", () => { this.teleportQueued = true; }, { passive:true });
    }

    // VR select events (controllers AND hand pinch both emit select)
    const onSelectStart = () => {
      this.lastSelectTime = performance.now();
      this.moveForwardHeld = true; // hold = move forward
    };
    const onSelectEnd = () => {
      const t = performance.now() - this.lastSelectTime;
      this.moveForwardHeld = false;
      // quick tap = teleport
      if (t < 240) this.teleportQueued = true;
    };

    const { controller1, controller2, hand1, hand2 } = ctx;
    [controller1, controller2, hand1, hand2].forEach(obj => {
      if (!obj) return;
      obj.addEventListener("selectstart", onSelectStart);
      obj.addEventListener("selectend", onSelectEnd);
    });

    console.log("✅ Input: armed (touch + keys + gamepad + XR pinch/trigger)");
  },

  getAxes(){
    // 1) Gamepads (Quest controllers)
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gps) {
      if (!gp || !gp.axes) continue;
      const ax = gp.axes[2] ?? gp.axes[0] ?? 0;
      const ay = gp.axes[3] ?? gp.axes[1] ?? 0;
      if (Math.abs(ax) + Math.abs(ay) > 0.01) return { x: ax, y: ay };
    }

    // 2) Touch joystick (Android)
    if (this.joy.active && (Math.abs(this.joy.x) + Math.abs(this.joy.y) > 0.01)) {
      return { x: this.joy.x, y: -this.joy.y }; // invert dy so up = forward
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
    const { rig, camera, controller1, controller2 } = this.ctx;

    const a = this.getAxes();
    const el = document.getElementById("axisdbg");
    if (el) el.textContent =
      `axes: ${a.x.toFixed(2)}, ${a.y.toFixed(2)}\n` +
      `holdMove: ${this.moveForwardHeld ? "YES" : "no"}\n` +
      `pos: ${rig.position.x.toFixed(2)}, ${rig.position.z.toFixed(2)}`;

    // Teleport: prefer controller rays in VR, else camera
    if (this.teleportQueued) {
      this.teleportQueued = false;
      const did =
        this.raycastTeleport(controller1) ||
        this.raycastTeleport(controller2) ||
        this.raycastTeleport(null);

      // fallback: small forward hop if nothing hit
      if (!did) {
        const yaw = camera.rotation.y;
        const step = 3.0;
        rig.position.x += Math.sin(yaw) * step;
        rig.position.z -= Math.cos(yaw) * step;
      }
    }

    // VR “hold to move forward” (works with pinch)
    if (this.moveForwardHeld) {
      const yaw = camera.rotation.y;
      const speed = 1.9;
      rig.position.x += Math.sin(yaw) * speed * dt;
      rig.position.z -= Math.cos(yaw) * speed * dt;
      rig.position.y = Math.max(rig.position.y, 1.6);
      return;
    }

    // Normal movement (axes)
    const mag = Math.abs(a.x) + Math.abs(a.y);
    if (mag < 0.001) return;

    const yaw = camera.rotation.y;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);

    const forward = a.y;
    const strafe  = a.x;

    const speed = 2.4;
    const vx = (strafe * cos - forward * sin) * speed * dt;
    const vz = (strafe * sin + forward * cos) * speed * dt;

    rig.position.x += vx;
    rig.position.z += vz;
    rig.position.y = Math.max(rig.position.y, 1.6);
  }
};
