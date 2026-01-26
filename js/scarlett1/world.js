import * as THREE from 'three';
import { OculusHandModel } from 'three/addons/objects/OculusHandModel.js';

let hand1, hand2;
let turnLock = false;
const texturePath = 'assets/textures/';

export function createWorld(scene, camera, renderer, playerGroup) {
    // 1. LIGHTING
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const spotlight = new THREE.PointLight(0x00ff00, 2);
    spotlight.position.set(0, 10, 0);
    scene.add(spotlight);

    // 2. THE GRID (The "Dev Side" Floor)
    const grid = new THREE.GridHelper(200, 200, 0x00ff00, 0x111111);
    scene.add(grid);

    // 3. HAND MODELS (Oculus Hand Tracking)
    hand1 = renderer.xr.getHand(0);
    hand1.add(new OculusHandModel(hand1));
    playerGroup.add(hand1);

    hand2 = renderer.xr.getHand(1);
    hand2.add(new OculusHandModel(hand2));
    playerGroup.add(hand2);

    // 4. TEST OBJECTS (So you know the world is alive)
    const monolithGeo = new THREE.BoxGeometry(2, 20, 2);
    const monolithMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: true });
    const monolith = new THREE.Mesh(monolithGeo, monolithMat);
    monolith.position.set(0, 10, -10);
    scene.add(monolith);
}

export function updateWorld(delta, playerGroup) {
    if (!hand1 || !hand1.visible) return;

    const speed = 5.0;
    const pos = hand1.position;

    // JOYSTICK MOVEMENT (Hand Forward/Back)
    if (pos.z < -0.2) { 
        playerGroup.translateZ(-speed * delta); // Move Forward
    } else if (pos.z > 0.2) { 
        playerGroup.translateZ(speed * delta); // Move Backward
    }

    // SNAP TURN (Hand Left/Right)
    if (!turnLock) {
        if (pos.x > 0.2) {
            playerGroup.rotation.y -= Math.PI / 4;
            turnLock = true;
            setTimeout(() => turnLock = false, 500);
        } else if (pos.x < -0.2) {
            playerGroup.rotation.y += Math.PI / 4;
            turnLock = true;
            setTimeout(() => turnLock = false, 500);
        }
    }
}
