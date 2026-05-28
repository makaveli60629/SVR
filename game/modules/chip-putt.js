import * as THREE from "three";
import { bootPrivateScene } from "./private_scene_common.js";
bootPrivateScene({ title:"PGA CHIP + PUTT", subtitle:"PRIVATE SHORT GAME ROOM", accent:0x95ff9f, build:({scene})=>{
  const green=new THREE.Mesh(new THREE.CircleGeometry(5.8,96),new THREE.MeshStandardMaterial({color:0x16713a,roughness:.9})); green.rotation.x=-Math.PI/2; green.position.z=-1.7; scene.add(green);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.03,32),new THREE.MeshBasicMaterial({color:0x050505})); cup.position.set(0,.035,-3.4); scene.add(cup);
  const flag=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.6,8),new THREE.MeshStandardMaterial({color:0xffffff})); flag.position.set(0,.83,-3.4); scene.add(flag);
  const cloth=new THREE.Mesh(new THREE.PlaneGeometry(.65,.38),new THREE.MeshBasicMaterial({color:0xff334f,side:THREE.DoubleSide})); cloth.position.set(.34,1.45,-3.4); scene.add(cloth);
}});
