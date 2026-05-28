import * as THREE from "three";
import { bootPrivateScene } from "./private_scene_common.js";
bootPrivateScene({ title:"PGA DRIVE RANGE", subtitle:"PRIVATE DRIVING RANGE • STAND HERE / AIM AT BALL", accent:0x7ff5c7, build:({scene})=>{
  const turf=new THREE.Mesh(new THREE.PlaneGeometry(7,22),new THREE.MeshStandardMaterial({color:0x145c32,roughness:.85})); turf.rotation.x=-Math.PI/2; turf.position.z=-4; scene.add(turf);
  const mat=new THREE.Mesh(new THREE.BoxGeometry(2.2,.04,1.25),new THREE.MeshStandardMaterial({color:0xcaa32b,roughness:.55,emissive:0x332400,emissiveIntensity:.18})); mat.position.set(0,.025,2.05); scene.add(mat);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.12,32,16),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.25})); ball.position.set(0,.14,.72); scene.add(ball);
  for(const z of [-4,-8,-12]){ const target=new THREE.Mesh(new THREE.RingGeometry(.7,1.05,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,side:THREE.DoubleSide})); target.rotation.x=-Math.PI/2; target.position.set(0,.035,z); scene.add(target); }
}});
