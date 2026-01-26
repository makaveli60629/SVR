import * as THREE from 'three';
import { createWorld, updateWorld } from './world.js';

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    playerGroup = new THREE.Group();
    playerGroup.position.set(0, 1.6, 0); 
    scene.add(playerGroup);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    playerGroup.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    createWorld(scene, camera, renderer, playerGroup);
    renderer.setAnimationLoop(tick);
}

function tick() {
    const delta = clock.getDelta();
    updateWorld(delta, playerGroup);
    renderer.render(scene, camera);
}
