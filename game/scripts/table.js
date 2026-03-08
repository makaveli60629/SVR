import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161/build/three.module.js";

export function createTable(scene){

const table = new THREE.Mesh(

new THREE.CylinderGeometry(5,5,0.6,64),

new THREE.MeshStandardMaterial({color:0x0b5d0b})

);

table.position.y = 0.5;

scene.add(table);

}
