import * as THREE from 'three';

export function initChips({ Bus, scene }) {
  function createChip(color, x, z, stackIndex) {
    const geo = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20);
    const mat = new THREE.MeshStandardMaterial({ color });
    const chip = new THREE.Mesh(geo, mat);
    chip.position.set(x, 0.92 + (stackIndex * 0.022), z);
    scene.add(chip);
    return chip;
  }

  window.spawnChips = () => {
    Bus.log('CHIPS: SPAWNING STACKS');
    const colors = [0xff3333, 0x3333ff, 0xffff33];
    for (let s=0; s<3; s++) {
      for (let i=0; i<8; i++) createChip(colors[s], -0.6 + s*0.3, -2.7, i);
    }
    window.playSound?.('clink');
  };

  scene.userData.createChip = createChip;
  Bus.log('CHIP STACK MODULE ONLINE');
}
