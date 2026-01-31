
import * as THREE from "three";
export function createJumbotron(){
 const g=new THREE.Group();
 const frame=new THREE.Mesh(
  new THREE.BoxGeometry(6,3.5,.2),
  new THREE.MeshStandardMaterial({color:0x0b0f14,metalness:.6,roughness:.3})
 );
 g.add(frame);
 const screenMat=new THREE.MeshStandardMaterial({
  color:0x000000,
  emissive:0x113355,
  emissiveIntensity:1.6
 });
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(5.4,3),screenMat);
 screen.position.z=.11;
 g.add(screen);
 g.position.set(0,2.8,-8);
 return g;
}
