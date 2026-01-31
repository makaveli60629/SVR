
import * as THREE from "three";
export function createJumbotron(){
  const g=new THREE.Group();
  const frame=new THREE.Mesh(
    new THREE.BoxGeometry(6,3.5,.22),
    new THREE.MeshStandardMaterial({color:0x0b0f14,metalness:.6,roughness:.3})
  );
  g.add(frame);

  const screenMat=new THREE.MeshStandardMaterial({
    color:0x000000,
    emissive:0x1a6cff,
    emissiveIntensity:1.5,
    roughness:0.6,
    metalness:0.0
  });
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(5.4,3), screenMat);
  screen.position.z=.12;
  g.add(screen);

  // A subtle neon trim
  const trim=new THREE.Mesh(
    new THREE.TorusGeometry(1.55,0.02,12,64),
    new THREE.MeshStandardMaterial({emissive:0x7b61ff,emissiveIntensity:1.8})
  );
  trim.rotation.x=Math.PI/2;
  trim.scale.set(2.1,1,1.25);
  trim.position.z=0.14;
  g.add(trim);

  g.position.set(0,2.8,-8);
  return g;
}
