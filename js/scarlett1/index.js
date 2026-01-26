// /js/scarlett1/index.js - Permanent Spine Orchestrator (SCARLETT1)
const ScarlettEngine = {
  init() {
    this.fpsDisplay = document.getElementById('fps-counter');
    this.camera = document.querySelector('#main-cam');
    this.startDiagnostics();
    console.log('SCARLETT_OS: Spine Active (scarlett1).');
  },

  startDiagnostics() {
    setInterval(() => {
      if (!this.camera || !this.fpsDisplay) return;
      const pos = this.camera.getAttribute('position') || { x: 0, y: 0, z: 0 };
      // Placeholder FPS (real FPS component can be added later)
      const fps = 60;
      this.fpsDisplay.innerText = `FPS: ${fps} | XYZ: ${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)}`;
    }, 500);
  }
};

window.addEventListener('load', () => ScarlettEngine.init());
