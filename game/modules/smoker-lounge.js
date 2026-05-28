import * as THREE from "three";
import { bootPrivateScene } from "./private_scene_common.js";
bootPrivateScene({ title:"SMOKER LOUNGE", subtitle:"PRIVATE SOCIAL LOUNGE", accent:0xffb86b, build:({scene})=>{
  const mat=new THREE.MeshStandardMaterial({color:0x2a1720,roughness:.55,metalness:.1});
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2; const chair=new THREE.Mesh(new THREE.BoxGeometry(.85,.45,.75),mat); chair.position.set(Math.cos(a)*2.6,.25,Math.sin(a)*2.6-.8); chair.rotation.y=-a; scene.add(chair);} 
  const board=new THREE.Mesh(new THREE.BoxGeometry(4,1.6,.08),new THREE.MeshStandardMaterial({color:0x19121e,emissive:0xff8a2b,emissiveIntensity:.12})); board.position.set(0,1.8,-4); scene.add(board);
}});
