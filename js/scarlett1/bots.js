import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
export class Bots{
 constructor(scene,seats){this.scene=scene;this.seats=seats;this.bots=[]}
 async spawn(){
  const l=new GLTFLoader();
  for(let i=0;i<this.seats.length;i++){
   let o;
   try{o=(await l.loadAsync("/assets/avatars/male.glb")).scene}
   catch{o=new THREE.Mesh(new THREE.CapsuleGeometry(.18,1.1,6,12),
    new THREE.MeshStandardMaterial({color:0x334455}))}
   o.position.copy(this.seats[i].position);o.rotation.y=this.seats[i].rotation.y;
   this.scene.add(o);this.bots.push(o);
  }
 }
 update(t){this.bots.forEach((b,i)=>b.position.y=.02*Math.sin(t+i))}
}
