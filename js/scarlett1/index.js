// SCARLETT ONE — SVR Permanent Engine
// RULES: Hands-only. Do NOT touch HTML. World logic lives in world.js.

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { createWorld, updateWorld } from './world.js';

let scene, camera, renderer, clock, playerGroup;

function el(id) { return document.getElementById(id); }
function setText(id, txt) { const e = el(id); if (e) e.innerText = txt; }

export function initEngine() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // Player rig (camera + hands move together)
    playerGroup = new THREE.Group();
    scene.add(playerGroup);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.05,
        2000
    );
    playerGroup.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // IMPORTANT: XR OFF until user presses ENTER VR
    renderer.xr.enabled = false;

    document.body.appendChild(renderer.domElement);

    // 🔑 WORLD INIT — pass THREE explicitly
    createWorld(THREE, scene, camera, renderer, playerGroup);

    // ENTER VR (hands-only)
    const btn = el('entervr');
    if (btn) {
        btn.addEventListener('click', async () => {
            try {
                if (!navigator.xr) {
                    console.warn('WebXR not available');
                    return;
                }

                renderer.xr.enabled = true;

                const session = await navigator.xr.requestSession('immersive-vr', {
                    optionalFeatures: [
                        'hand-tracking',
                        'local-floor',
                        'bounded-floor',
                        'layers'
                    ]
                });

                session.addEventListener('end', () => {
                    renderer.xr.enabled = false;
                });

                renderer.xr.setSession(session);
            } catch (err) {
                console.error('XR Error:', err);
            }
        });
    }

    window.addEventListener('resize', onResize);
    renderer.setAnimationLoop(tick);

    setText('status', 'LINKED');
    console.log('[Engine] init complete');
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function tick() {
    const delta = Math.max(1e-6, clock.getDelta());
    const fps = Math.round(1 / delta);

    setText('fps-val', fps);

    const p = playerGroup.position;
    setText('pos-val', `${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);

    updateWorld(delta, playerGroup);
    renderer.render(scene, camera);
}
