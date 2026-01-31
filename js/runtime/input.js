export const Input = {
  ctx: null,
  keys: {},
  joy: { active:false, id:null, sx:0, sy:0, x:0, y:0 },

  init(ctx){
    this.ctx = ctx;

    // ✅ Keys fallback (desktop debugging)
    addEventListener("keydown", e => this.keys[e.code] = true);
    addEventListener("keyup", e => this.keys[e.code] = false);

    // ✅ Touch joystick (Android) — uses #joyZone
    const zone = document.getElementById("joyZone");
    if (zone) {
      const onDown = (e) => {
        const t = (e.changedTouches ? e.changedTouches[0] : e);
        this.joy.active = true;
        this.joy.id = t.identifier ?? "mouse";
        this.joy.sx = t.clientX;
        this.joy.sy = t.clientY;
        this.joy.x = 0; this.joy.y = 0;
      };
      const onMove = (e) => {
        if (!this.joy.active) return;
        let t = null;
        if (e.changedTouches) {
          for (const tt of e.changedTouches) if (tt.identifier === this.joy.id) t = tt;
        } else t = e;
        if (!t) return;

        const dx = (t.clientX - this.joy.sx);
        const dy = (t.clientY - this.joy.sy);
        const max = 70; // pixels
        const nx = Math.max(-1, Math.min(1, dx / max));
        const ny = Math.max(-1, Math.min(1, dy / max));
        this.joy.x = nx;
        this.joy.y = ny;
        e.preventDefault?.();
      };
      const onUp = (e) => {
        this.joy.active = false;
        this.joy.id = null;
        this.joy.x = 0; this.joy.y = 0;
      };

      zone.addEventListener("touchstart", onDown, { passive:false });
      zone.addEventListener("touchmove", onMove, { passive:false });
      zone.addEventListener("touchend", onUp, { passive:true });
      zone.addEventListener("touchcancel", onUp, { passive:true });

      zone.addEventListener("mousedown", onDown);
      addEventListener("mousemove", onMove);
      addEventListener("mouseup", onUp);
    }

    console.log("✅ Input armed (gamepad + touch + keys)");
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
    if (this.joy.active && (Math.abs(this.joy.x)+Math.abs(this.joy.y) > 0.01)) {
      return { x: this.joy.x, y: -this.joy.y }; // invert so up = forward
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

    // If no input, skip
    if (Math.abs(a.x) + Math.abs(a.y) < 0.001) return;

    // Move relative to camera yaw
    const yaw = camera.rotation.y;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);

    const forward = a.y;     // + forward
    const strafe  = a.x;     // + right

    const speed = 2.1;       // meters/sec
    const vx = (strafe * cos - forward * sin) * speed * dt;
    const vz = (strafe * sin + forward * cos) * speed * dt;

    // ✅ noClip option if you want to test
    rig.position.x += vx;
    rig.position.z += vz;

    // Keep player above floor baseline
    rig.position.y = Math.max(rig.position.y, 1.6);
  }
};
