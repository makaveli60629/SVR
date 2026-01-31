export const Input = {
  ctx: null,
  keys: {},
  joy: { active:false, id:null, sx:0, sy:0, x:0, y:0 },
  teleportQueued: false,

  init(ctx){
    this.ctx = ctx;

    // Keyboard fallback
    addEventListener("keydown", e => this.keys[e.code] = true);
    addEventListener("keyup", e => this.keys[e.code] = false);

    // Touch Joystick (bottom-left)
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

        // global visibility (useful for debugging)
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

    // Tap-to-teleport (bottom-right): tap = jump forward
    const teleZone = document.getElementById("teleZone");
    if (teleZone) {
      teleZone.addEventListener("click", () => { this.teleportQueued = true; });
      teleZone.addEventListener("touchend", () => { this.teleportQueued = true; }, { passive:true });
    }

    console.log("✅ Input: armed (gamepad + touch + keys + tap-teleport)");
  },

  getAxes(){
    // 1) Gamepads (Quest / controller)
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

  update(dt){
    const { rig, camera } = this.ctx;
    const a = this.getAxes();

    // Debug axes on screen
    const el = document.getElementById("axisdbg");
    if (el) el.textContent = `axes: ${a.x.toFixed(2)}, ${a.y.toFixed(2)}\nrig: ${rig.position.x.toFixed(2)}, ${rig.position.z.toFixed(2)}`;

    // Teleport forward
    if (this.teleportQueued) {
      this.teleportQueued = false;
      const yaw = camera.rotation.y;
      const step = 3.2;
      rig.position.x += Math.sin(yaw) * step;
      rig.position.z -= Math.cos(yaw) * step;
    }

    // Move rig
    const mag = Math.abs(a.x) + Math.abs(a.y);
    if (mag < 0.001) return;

    // Move relative to yaw
    const yaw = camera.rotation.y;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);

    const forward = a.y;
    const strafe = a.x;

    const speed = 2.3; // m/s
    const vx = (strafe * cos - forward * sin) * speed * dt;
    const vz = (strafe * sin + forward * cos) * speed * dt;

    rig.position.x += vx;
    rig.position.z += vz;

    // Keep head above floor baseline
    rig.position.y = Math.max(rig.position.y, 1.6);
  }
};
