
import * as THREE from "three";

export function lobby(scene){
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(1.1,.04,12,80),
    new THREE.MeshStandardMaterial({color:0x111111,emissive:0x2bd6ff,emissiveIntensity:2.0})
  );
  ring.rotation.x=Math.PI/2;
  ring.position.set(0,0.02,0);
  scene.add(ring);

  const beacon=new THREE.Mesh(
    new THREE.CylinderGeometry(0.06,0.06,1.2,16),
    new THREE.MeshStandardMaterial({emissive:0x7b61ff,emissiveIntensity:2.0})
  );
  beacon.position.set(0,1.0,-1.8);
  scene.add(beacon);

  return { ring, beacon };
}
