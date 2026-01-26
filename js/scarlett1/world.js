import * as THREE from 'three';

export function createWorld(scene, camera, renderer, playerGroup) {
    // 1. Casino Ambience Lighting
    const ambient = new THREE.AmbientLight(0x404040, 2); 
    scene.add(ambient);

    const neonTableLight = new THREE.PointLight(0x00ff00, 1, 10);
    neonTableLight.position.set(0, 2.5, -3);
    scene.add(neonTableLight);

    // 2. The Poker Table (Geometry Prototype)
    const tableGeo = new THREE.CylinderGeometry(2, 2, 0.2, 32);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x004400, roughness: 0.9 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 0.9, -3); // Eye-level height for seated play
    scene.add(table);

    // 3. Grid Helper (For Android spatial testing)
    const grid = new THREE.GridHelper(20, 20, 0x00ff00, 0x111111);
    scene.add(grid);

    console.log("SCARLETT_ONE_WORLD: ASSETS DEPLOYED");
}

export function updateWorld(delta, playerGroup) {
    // Future Event Chips: Card Dealing & Chip Physics
}
