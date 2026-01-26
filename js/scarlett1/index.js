import * as THREE from 'three';
import { createWorld, updateWorld } from './world.js';

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    
    playerGroup = new THREE.Group();
    scene.add(playerGroup);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    playerGroup.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    createWorld(scene, camera, renderer, playerGroup);

    // VR Interaction Trigger
    document.getElementById('entervr').onclick = () => {
        navigator.xr.requestSession('immersive-vr', {
            optionalFeatures: ['hand-tracking', 'local-floor']
        }).then(session => renderer.xr.setSession(session));
    };

    renderer.setAnimationLoop(tick);
}

function tick() {
    const delta = clock.getDelta();
    
    // Update Diagnostic HUD on screen
    document.getElementById('fps-val').innerText = Math.round(1 / delta);
    const p = playerGroup.position;
    document.getElementById('pos-val').innerText = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;

    updateWorld(delta, playerGroup);
    renderer.render(scene, camera);
}
