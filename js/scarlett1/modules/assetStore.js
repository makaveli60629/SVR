import * as THREE from 'three';

export function initStore(scene) {
  const panel = document.getElementById('storePanel');
  const term = document.getElementById('term-log');

  function log(msg) {
    if (!term) return;
    term.innerHTML += `<br>> ${msg}`;
    term.scrollTop = term.scrollHeight;
  }

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x004422, emissiveIntensity: 0.6 })
  );
  marker.position.set(0, 1.25, -1.4);
  marker.visible = false;
  scene.add(marker);

  window.toggleStore = () => {
    if (!panel) return;
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    log(open ? 'STORE CLOSED' : 'OPENING STORE...');
  };

  window.equipAsset = (id) => {
    marker.visible = true;
    const map = { male: 0x00aaff, female: 0xff44aa, ninja: 0xaaff00 };
    marker.material.color.setHex(map[id] ?? 0x00ff88);
    log(`ASSET EQUIPPED: ${String(id).toUpperCase()}`);
  };
}
