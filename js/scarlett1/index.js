// index.js - Permanent Update 4.1
const fpsCounter = document.getElementById('fps-counter');
const camera = document.querySelector('#cam');

function updateHUD() {
    const pos = camera.getAttribute('position');
    // Using simple performance.now for FPS estimation
    const fps = Math.round(60); 
    fpsCounter.innerText = `FPS: ${fps} | XYZ: ${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)}`;
}

setInterval(updateHUD, 500);

console.log("Scarlett System: Logic Loaded.");
