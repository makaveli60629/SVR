// js/scarlett1/os.js - HUD + diagnostics (PERMANENT)
export const ScarlettOS = {
  init() {
    this.hud = document.getElementById('fps-counter');
    this.last = performance.now();
    this.frames = 0;

    setInterval(() => {
      const rig = document.querySelector('#rig');
      if (!rig || !this.hud) return;

      const p = rig.getAttribute('position') || { x: 0, y: 0, z: 0 };

      const now = performance.now();
      this.frames++;
      const dt = now - this.last;
      let fps = 60;
      if (dt >= 500) {
        fps = Math.round((this.frames * 1000) / dt);
        this.frames = 0;
        this.last = now;
      }

      this.hud.innerText = `FPS: ${fps} | RIG XYZ: ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}`;
    }, 120);

    console.log('SCARLETT1: OS online');
  }
};
