export function buildLobby(THREE, scene) {
  const root = new THREE.Group();

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.045, 12, 96),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.02, 0);
  root.add(ring);

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.6, 18),
    new THREE.MeshBasicMaterial({ color: 0x7b61ff })
  );
  beacon.position.set(0, 0.9, -2.2);
  root.add(beacon);

  scene.add(root);
  return root;
}
