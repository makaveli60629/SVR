
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
export function buildWorld(scene){
 const floor=new THREE.Mesh(new THREE.CircleGeometry(20,64),new THREE.MeshStandardMaterial({color:0x222244}));
 floor.rotation.x=-Math.PI/2; scene.add(floor);
}
