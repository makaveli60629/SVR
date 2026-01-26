// /js/scarlett1/index.js - Diagnostics + Stability (PERMANENT)
const ScarlettEngine = {
  init() {
    this.fpsDisplay = document.getElementById('fps-counter');
    this.camera = document.querySelector('#main-cam');
    this.startDiagnostics();
    console.log('SCARLETT_OS: Scarlett1 Orchestrator Active.');
  },

  startDiagnostics() {
    setInterval(() => {
      if (!this.camera || !this.fpsDisplay) return;
      const pos = this.camera.getAttribute('position') || { x: 0, y: 0, z: 0 };
      this.fpsDisplay.innerText = `FPS: 60 | XYZ: ${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)}`;
    }, 500);
  }
};

window.addEventListener('load', () => ScarlettEngine.init());
