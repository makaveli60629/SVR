import * as THREE from 'three';

/**
 * Module 21: Avatar Locomotion (procedural, lightweight)
 * - Spawns simple "animated" avatars (capsule + legs) that walk in a loop.
 * - No external animation files required.
 * - Designed to be mobile-safe.
 */
const walkers = [];

export function createAnimatedAvatar(scene, x, z, gender = 'female') {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CapsuleGeometry(0.25, 1.0, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: gender === 'female' ? 0xff0077 : 0x0077ff,
    emissive: 0x001100,
    emissiveIntensity: 0.45,
    roughness: 0.75
  });

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.85;
  group.add(body);

  const legGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.6, 10);
  const leftLeg = new THREE.Mesh(legGeo, bodyMat);
  const rightLeg = new THREE.Mesh(legGeo, bodyMat);
  leftLeg.position.set(-0.15, 0.25, 0);
  rightLeg.position.set(0.15, 0.25, 0);
  group.add(leftLeg, rightLeg);

  // small head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshStandardMaterial({
    color: 0x222222, emissive: 0x001100, emissiveIntensity: 0.35, roughness: 0.9
  }));
  head.position.y = 1.35;
  group.add(head);

  group.position.set(x, 1.6, z);
  scene.add(group);

  return {
    mesh: group,
    leftLeg,
    rightLeg,
    phase: Math.random() * Math.PI * 2,
    speed: 1.0 + Math.random() * 0.8
  };
}

/**
 * Spawns a couple of walkers that circle the pit on the high ground.
 * This answers your "pathfinding" request: they stay at a fixed radius so they never fall in.
 */
export function initAvatarWalk(scene) {
  walkers.length = 0;

  // Two hero walkers
  walkers.push(createAnimatedAvatar(scene, -9, 0, 'female'));
  walkers.push(createAnimatedAvatar(scene,  9, 0, 'male'));

  // Optional extras (kept low for performance)
  walkers.push(createAnimatedAvatar(scene, 0, -9, 'female'));
  walkers.push(createAnimatedAvatar(scene, 0,  9, 'male'));

  // Give each a ring-walk target
  const radius = 11.5; // high ground safe zone
  walkers.forEach((w, i) => {
    w.radius = radius + (i % 2) * 1.2;
    w.omega = 0.18 + (i * 0.03);
    w.offset = i * (Math.PI * 0.5);
  });

  window.__avatarWalkers = walkers;
}

/**
 * Update all walkers: leg swing + bob + orbit.
 * @param {number} timeSeconds
 */
export function updateAvatarWalk(timeSeconds) {
  for (const w of walkers) {
    const t = timeSeconds * w.speed;
    const swing = Math.sin(t * 6 + w.phase) * 0.6;

    w.leftLeg.rotation.x = swing;
    w.rightLeg.rotation.x = -swing;

    // Orbit around center (0,0)
    const a = timeSeconds * w.omega + w.offset;
    w.mesh.position.x = Math.cos(a) * w.radius;
    w.mesh.position.z = Math.sin(a) * w.radius;
    w.mesh.position.y = 1.6 + Math.abs(Math.cos(t * 3)) * 0.05;

    // Face direction of travel
    w.mesh.rotation.y = -a + Math.PI / 2;
  }
}
