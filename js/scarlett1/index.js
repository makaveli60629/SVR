import * as THREE from 'three';
import { createWorld, updateWorld } from './world.js';

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    
    // PLAYER RIG - The physical presence in VR
    playerGroup = new THREE.Group();
    scene.add(playerGroup);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    playerGroup.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Initialize the logic from world.js
    createWorld(scene, camera, renderer, playerGroup);

    // VR Entry Hook
    const btn = document.getElementById('entervr');
    btn.addEventListener('click', () => {
        navigator.xr.requestSession('immersive-vr', {
            optionalFeatures: ['hand-tracking', 'local-floor']
        }).then(session => renderer.xr.setSession(session));
    });

    renderer.setAnimationLoop(renderLoop);
}

function renderLoop() {
    const delta = clock.getDelta();
    
    // Update Diagnostic UI
    document.getElementById('fps-val').innerText = Math.round(1 / delta);
    const p = playerGroup.position;
    document.getElementById('pos-val').innerText = `${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`;
    document.getElementById('rot-val').innerText = `${Math.round(playerGroup.rotation.y * (180/Math.PI))}°`;

    updateWorld(delta, playerGroup);
    renderer.render(scene, camera);
}
