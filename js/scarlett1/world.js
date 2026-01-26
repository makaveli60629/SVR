import * as THREE from 'three';

export function createWorld(scene) {
  // Beautified but safe (fog + emissive)
  scene.fog = new THREE.FogExp2(0x000000, 0.08);

  // Strong safety lights
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(5, 10, 5);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  // Sunken pit + high ground
  const high = new THREE.Mesh(
    new THREE.RingGeometry(4, 30, 64),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9, emissive: 0x001100, emissiveIntensity: 0.8 })
  );
  high.rotation.x = -Math.PI/2;
  high.position.y = 1.6;
  scene.add(high);

  const pit = new THREE.Mesh(
    new THREE.CircleGeometry(4, 64),
    new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0, emissive: 0x000800, emissiveIntensity: 0.6 })
  );
  pit.rotation.x = -Math.PI/2;
  pit.position.y = 0.0;
  pit.position.z = 0.0;
  scene.add(pit);

  // Neon rim (always visible)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(4.02, 0.04, 16, 140),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  rim.rotation.x = Math.PI/2;
  rim.position.y = 1.62;
  scene.add(rim);

  // Poker table center
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 0.3, 40),
    new THREE.MeshStandardMaterial({ color: 0x003300, roughness: 0.6, emissive: 0x001000, emissiveIntensity: 0.9 })
  );
  table.position.set(0, 0.95, 0);
  scene.add(table);
  scene.userData.table = table;

  // Simple chairs (8)
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x001100, emissiveIntensity: 0.5 });
  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const x = Math.cos(a)*3.4;
    const z = Math.sin(a)*3.4;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.15,0.6), chairMat);
    seat.position.set(x,0.55,z);
    seat.rotation.y = -a + Math.PI;
    scene.add(seat);
  }

  // Floating jumbotrons (emissive panels)
  const jumboMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.6, side: THREE.DoubleSide });
  function jumbotron(x,z,ry){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6,3.5), jumboMat);
    m.position.set(x,4.5,z);
    m.rotation.y = ry;
    scene.add(m);
  }
  jumbotron(0,-12,0);
  jumbotron(12,0,-Math.PI/2);

  // Skybox (inside-visible)
  const sky = new THREE.Mesh(
    new THREE.BoxGeometry(140,140,140),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide })
  );
  scene.add(sky);

  // Orientation helpers
  scene.add(new THREE.GridHelper(80, 80, 0x00ff00, 0x111111));
  scene.add(new THREE.AxesHelper(3));
}

export function updateWorld(dt, playerGroup, camera) {
  // reserved for future animations
}
