export function buildJumbotron(THREE) {
  const g = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 3.7, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x0b0f14, roughness: 0.30, metalness: 0.60 })
  );
  g.add(frame);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(5.7, 3.1),
    new THREE.MeshBasicMaterial({ color: 0x12273a })
  );
  screen.position.z = 0.13;
  g.add(screen);

  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 3.9, 0.10),
    new THREE.MeshBasicMaterial({ color: 0x2bd6ff, transparent: true, opacity: 0.12 })
  );
  glow.position.z = 0.18;
  g.add(glow);

  return g;
}
