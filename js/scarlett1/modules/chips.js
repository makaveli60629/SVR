import * as THREE from 'three';
export function initChips({ scene, Bus }) {
  function chip(color,x,z,h){
    const c = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06,0.06,0.02,24),
      new THREE.MeshStandardMaterial({ color, emissive: 0x111111, emissiveIntensity: 0.5 })
    );
    c.position.set(x, 1.02 + h*0.022, z);
    scene.add(c);
  }
  window.spawnChips = () => {
    Bus?.log?.('CHIPS: SPAWN');
    const colors = [0xff3333,0x3333ff,0xffff33];
    for (let s=0;s<3;s++) for(let i=0;i<10;i++) chip(colors[s], -0.9 + s*0.35, 0.9, i);
  };
  Bus?.log?.('CHIPS ONLINE');
}
