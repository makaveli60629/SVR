import * as THREE from "three";
export function lobby(scene){
 const r=new THREE.Mesh(new THREE.TorusGeometry(1.1,.04,12,64),
  new THREE.MeshStandardMaterial({emissive:0x2bd6ff,emissiveIntensity:2}));
 r.rotation.x=Math.PI/2;scene.add(r);return r;
}
