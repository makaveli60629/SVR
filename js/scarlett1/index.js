import * as THREE from 'three';
import { createWorld, updateWorld } from './world.js';

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
    // 1. Initialize Scene & Clock
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    
    // 2. Setup Player Rig (Centered for Android)
    playerGroup = new THREE.Group();
    playerGroup.position.set(0, 1.6, 0); // Eye-level height
    scene.add(playerGroup);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    playerGroup.add(camera);

    // 3. Renderer (Optimized for Mobile Battery)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // 4. Connect the World Module
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
    
    // Push FPS and Position to your UI
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
