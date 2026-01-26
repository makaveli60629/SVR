import * as THREE from 'three';
import { createWorld, updateWorld } from './world.js';

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
    // 1. Setup Scene & Physics Clock
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    
    // 2. Player Rig (For Android Movement)
    playerGroup = new THREE.Group();
    playerGroup.position.set(0, 1.6, 0); // Eye level
    scene.add(playerGroup);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    playerGroup.add(camera);

    // 3. Professional Renderer (Battery Optimized for Android)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // 4. Initialize the World Module
    createWorld(scene, camera, renderer, playerGroup);

    // 5. VR Session Trigger
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
    
    // Feed Diagnostics to the HUD
    const fps = Math.round(1 / delta);
    const fpsVal = document.getElementById('fps-val');
    if(fpsVal) fpsVal.innerText = fps;

    const p = playerGroup.position;
    const posVal = document.getElementById('pos-val');
    if(posVal) posVal.innerText = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;

    updateWorld(delta, playerGroup);
    renderer.render(scene, camera);
}
