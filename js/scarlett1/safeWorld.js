import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function initSafeWorld(ctx){
  const { scene, camera, renderer, log } = ctx;

  // Basic lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 6);
  scene.add(dir);

  // Simple floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 96),
    new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 1.0 })
  );
  floor.rotation.x = -Math.PI/2;
  floor.name = "SAFE_FLOOR";
  scene.add(floor);

  // Simple reference ring so you can see scale
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.5, 2.7, 96),
    new THREE.MeshBasicMaterial({ color: 0x8a2be2, transparent: true, opacity: 0.7 })
  );
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.01;
  scene.add(ring);

  // Camera start
  camera.position.set(0, 1.6, 6);
  camera.lookAt(0, 1.3, 0);

  log('[boot] SAFE world built ✅');

  // Updates list (for animation loop)
  return {
    updates: [
      (dt)=>{
        const t = performance.now()*0.001;
        ring.material.opacity = 0.55 + Math.sin(t*2.0)*0.12;
      }
    ]
  };
}
