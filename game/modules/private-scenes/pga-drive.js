import { bootPrivateScene } from '../private_scene_common.js';
const { scene, ring, renderer, camera } = bootPrivateScene({ title: 'SVR PGA Drive', subtitle: 'Private driving range scaffold • stance mat / ball target', accent: 0x54ff95 });
if ('pga-drive.html' === 'pga-drive.html' || 'pga-drive.html' === 'range.html') {
  // Lightweight stance mat + ball marker; real swing physics belongs in the next range_logic lock.
  const THREE = await import('three');
  const mat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.035, 1.25), new THREE.MeshStandardMaterial({ color: 0xd6a829, emissive: 0x5c3a00, emissiveIntensity: .35 }));
  mat.position.set(0, .035, 1.55); scene.add(mat);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.115, 32, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .35 }));
  ball.position.set(0, .16, -.85); scene.add(ball);
}
renderer.setAnimationLoop(() => { ring.rotation.z += 0.002; renderer.render(scene, camera); });
