import * as THREE from 'three';

/**
 * Module 23: Spectator Railing
 * Visual + spatial anchor at the pit lip.
 * (Collision-ready later: add simple collider checks in locomotion if desired.)
 */
export function createRailing(scene, {
  radius = 4.5,
  y = 1.25,
  centerX = 0,
  centerZ = 0,
  posts = 12
} = {}) {
  const railGroup = new THREE.Group();
  railGroup.name = "SPECTATOR_RAILING";

  // Hand rail
  const railGeo = new THREE.TorusGeometry(radius, 0.045, 18, 140);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 1.0,
    roughness: 0.12,
    emissive: 0x00ff00,
    emissiveIntensity: 0.22
  });

  const rail = new THREE.Mesh(railGeo, railMat);
  rail.rotation.x = Math.PI / 2;
  rail.position.set(centerX, y, centerZ);
  railGroup.add(rail);

  // Support posts
  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, y, 14),
      railMat
    );
    post.position.set(
      centerX + Math.cos(a) * radius,
      y / 2,
      centerZ + Math.sin(a) * radius
    );
    railGroup.add(post);
  }

  scene.add(railGroup);
  return railGroup;
}
