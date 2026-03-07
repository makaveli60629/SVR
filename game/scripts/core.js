import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161/build/three.module.js";

import { createTable } from "./table.js";
import { initSeats } from "./seat-system.js";

import { initHands } from "../systems/hands.js";
import { initTeleport } from "../systems/teleport.js";
import { initPoker } from "../systems/poker.js";

//
// Scene
//

const scene = new THREE.Scene();

//
// Camera
//

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth/window.innerHeight,
0.1,
1000
);

camera.position.set(0,10,16);

//
// Renderer
//

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);

document.body.appendChild(renderer.domElement);

//
// Lighting
//

const ambient = new THREE.AmbientLight(0xffffff,1);
scene.add(ambient);

const light = new THREE.PointLight(0xffffff,3);
light.position.set(10,20,10);
scene.add(light);

//
// Floor
//

const floor = new THREE.Mesh(

new THREE.PlaneGeometry(200,200),

new THREE.MeshStandardMaterial({color:0x111111})

);

floor.rotation.x = -Math.PI/2;

scene.add(floor);

//
// World
//

createTable(scene);
initSeats(scene);

//
// Systems
//

initHands(scene);
initTeleport(scene,camera);
initPoker(scene);

//
// Loop
//

function animate(){

requestAnimationFrame(animate);

renderer.render(scene,camera);

}

animate();

//
// Resize
//

window.addEventListener("resize",()=>{

camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();

renderer.setSize(window.innerWidth,window.innerHeight);

});
