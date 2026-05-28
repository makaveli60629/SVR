import * as THREE from "three";
import { bootPrivateScene } from "./private_scene_common.js";
bootPrivateScene({ title:"SCORPION ROOM", subtitle:"PRIVATE ENCLOSED POKER ROOM", accent:0xd3a13b, build:({scene})=>{
  const table=new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.35,.22,72),new THREE.MeshStandardMaterial({color:0x08382d,roughness:.65,metalness:.05})); table.position.y=.82; scene.add(table);
  const rail=new THREE.Mesh(new THREE.TorusGeometry(2.35,.13,12,96),new THREE.MeshStandardMaterial({color:0x171018,roughness:.5})); rail.position.y=.96; rail.rotation.x=Math.PI/2; scene.add(rail);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2; const c=new THREE.Mesh(new THREE.BoxGeometry(.65,.55,.65),new THREE.MeshStandardMaterial({color:0x202533,roughness:.7})); c.position.set(Math.cos(a)*3.25,.3,Math.sin(a)*3.25); c.lookAt(0,.3,0); scene.add(c);} 
}});
