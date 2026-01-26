import * as THREE from 'three';

export function createWorld(scene) {
  // 1. LIGHTING (Safety Overdrive)
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(5, 10, 5);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // 2. THE SUNKEN PIT (Visible Architecture)
  const floorGeo = new THREE.RingGeometry(3, 20, 32);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x001100, emissiveIntensity: 1.0 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 1.0;
  scene.add(floor);

  // 3. THE NEON RIM (Visual Anchor)
  const rimGeo = new THREE.TorusGeometry(3, 0.03, 16, 100);
  const rimMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // visible even if lights fail
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.01;
  scene.add(rim);

  // 4. THE TABLE (Centered in Pit)
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 0.2, 32),
    new THREE.MeshStandardMaterial({ color: 0x004400, emissive: 0x001100, emissiveIntensity: 1.0 })
  );
  table.position.set(0, 0.85, 0);
  scene.add(table);

  // 5. THE SKYBOX (Corrected Side)
  const sky = new THREE.Mesh(
    new THREE.BoxGeometry(100, 100, 100),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide })
  );
  scene.add(sky);

  // Debug helper so you NEVER get "nothing"
  scene.add(new THREE.AxesHelper(2));
}
