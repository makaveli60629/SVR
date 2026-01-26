import * as THREE from 'three';

export function initStore({ Bus, scene }) {
  const panel = document.getElementById('storePanel');

  // 3D marker that shows equipped asset
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x004422, emissiveIntensity: 0.6 })
  );
  marker.position.set(0, 1.25, -1.4);
  marker.visible = false;
  marker.name = 'EQUIPPED_MARKER';
  scene.add(marker);

  window.toggleStore = () => {
    if (!panel) return;
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    const settings = document.getElementById('settingsPanel');
    if (!open && settings) settings.style.display = 'none';
    Bus.log(open ? 'STORE CLOSED' : 'OPENING STORE...');
  };

  window.equipAsset = (id) => {
    marker.visible = true;
    const map = { male: 0x00aaff, female: 0xff44aa, ninja: 0xaaff00 };
    marker.material.color.setHex(map[id] ?? 0x00ff88);
    Bus.log(`ASSET EQUIPPED: ${String(id).toUpperCase()}`);
    window.playSound?.('click');
  };

  Bus.log('ASSET STORE ONLINE');
}
