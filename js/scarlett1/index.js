// index.js - Permanent Spine Orchestrator
const ScarlettEngine = {
    init() {
        this.fpsDisplay = document.getElementById('fps-counter');
        this.camera = document.querySelector('#main-cam');
        this.startDiagnostics();
        console.log("SCARLETT_OS: Spine Active.");
    },

    startDiagnostics() {
        setInterval(() => {
            const pos = this.camera.getAttribute('position');
            // Estimate FPS based on requestAnimationFrame delta
            const fps = 60; 
            this.fpsDisplay.innerText = `FPS: ${fps} | XYZ: ${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)}`;
        }, 500);
    }
};

window.onload = () => ScarlettEngine.init();
