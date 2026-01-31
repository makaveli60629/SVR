
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class Bots{
  constructor(scene,seats){this.scene=scene;this.seats=seats;this.bots=[]}
  async spawn(){
    const loader=new GLTFLoader();
    for(let i=0;i<this.seats.length;i++){
      let obj;
      try{
        // alternate later; for now use male.glb and fallback if missing
        obj=(await loader.loadAsync("/assets/avatars/male.glb")).scene;
        obj.scale.set(1,1,1);
      }catch(e){
        obj=new THREE.Mesh(
          new THREE.CapsuleGeometry(.18,1.1,6,12),
          new THREE.MeshStandardMaterial({color:0x334455,roughness:.85})
        );
      }
      obj.position.copy(this.seats[i].position);
      obj.rotation.y=this.seats[i].rotation.y;
      this.scene.add(obj);
      this.bots.push(obj);
    }
  }
  update(t){this.bots.forEach((b,i)=>b.position.y=.02*Math.sin(t*1.2+i))}
}
