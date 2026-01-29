import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export async function init(ctx){
  const { scene, addLine } = ctx;
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.12, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x5b2cff, emissive: 0x2a00aa, emissiveIntensity: 1.0 })
  );
  pad.position.set(3.5, 0.06, 10.5);
  pad.name = "storePad";
  scene.add(pad);
  addLine("[store] pad placed ✅");
}
