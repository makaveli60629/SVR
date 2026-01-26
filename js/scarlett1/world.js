import * as THREE from 'three';

export function createWorld(scene, camera, renderer, playerGroup) {
    // 1. Casino Lighting
    const ambient = new THREE.AmbientLight(0x404040, 2); 
    scene.add(ambient);

    const tableLight = new THREE.PointLight(0x00ff00, 1, 10);
    tableLight.position.set(0, 2.5, -3);
    scene.add(tableLight);

    // 2. The First Poker Table (Prototype Geometry)
    const tableGeo = new THREE.CylinderGeometry(2, 2, 0.2, 32);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x004400 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 0.9, -3); // Placed directly in front of player
    scene.add(table);

    // 3. Grid Floor (Essential for spatial debugging)
    const grid = new THREE.GridHelper(20, 20, 0x00ff00, 0x111111);
    scene.add(grid);

    console.log("WORLD_LOADED: SCARLETT ONE BOOTED");
}

export function updateWorld(delta, playerGroup) {
    // This function will soon handle chip physics and card dealing
}
