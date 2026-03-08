import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161/build/three.module.js";

export function initSeats(scene){

const seats = [

[0,0,7],
[6,0,4],
[6,0,-4],
[0,0,-7],
[-6,0,-4],
[-6,0,4]

];

seats.forEach(pos=>{

const seat = new THREE.Mesh(

new THREE.BoxGeometry(1.2,0.6,1.2),

new THREE.MeshStandardMaterial({color:0x333333})

);

seat.position.set(pos[0],0.3,pos[2]);

scene.add(seat);

});

}
