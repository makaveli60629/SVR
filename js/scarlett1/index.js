import * as THREE from 'three';
import { createWorld, updateWorld } from './world.js';

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
    // 1. Scene & Physics Timing
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    
    // 2. Player Rig (Positioned at eye-level 1.6m)
    playerGroup = new THREE.Group();
    playerGroup.position.set(0, 1.6, 0); 
    scene.add(playerGroup);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    playerGroup.add(camera);

    // 3. Renderer (Mobile Battery Optimized)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // 4. Build the World
    createWorld(scene, camera, renderer, playerGroup);

    // 5. VR Button Activation
    const vrBtn = document.getElementById('entervr');
    if(vrBtn) {
        vrBtn.onclick = () => {
            navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['hand-tracking', 'local-floor']
            }).then(session => renderer.xr.setSession(session));
        };
    }

    renderer.setAnimationLoop(tick);
}

function tick() {
    const delta = clock.getDelta();
    
    // Sync HUD Diagnostics
    const fpsVal = document.getElementById('fps-val');
    if(fpsVal) fpsVal.innerText = Math.round(1 / delta);

    const posVal = document.getElementById('pos-val');
    if(posVal) {
        const p = playerGroup.position;
        posVal.innerText = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
    }

    updateWorld(delta, playerGroup);
    renderer.render(scene, camera);
}
