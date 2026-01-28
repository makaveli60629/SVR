// /js/scarlett1/modules/maleAvatar.js
// SCARLETT • FULL MALE (procedural full-body placeholder)
// No external models. Works on Android/Quest immediately.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export function spawnMaleFull(scene, {
  position = new THREE.Vector3(1.6, 0.0, 0.6),
  rotationY = Math.PI,
  scale = 1.0,
  name = "MALE_FULL"
} = {}) {
  const g = new THREE.Group();
  g.name = name;

  // Materials
  const skin = new THREE.MeshStandardMaterial({ color: 0xd6b08c, roughness: 0.9 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x1b2a55, roughness: 0.85 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x20242e, roughness: 0.9 });
  const shoes = new THREE.MeshStandardMaterial({ color: 0x0e1118, roughness: 0.95 });

  // Helper: rounded-ish capsule using cylinder + spheres
  const capsule = (r, h, mat) => {
    const grp = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 18), mat);
    const top = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat);
    const bot = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat);
    top.position.y = h / 2;
    bot.position.y = -h / 2;
    grp.add(cyl, top, bot);
    return grp;
  };

  // --- BODY ---
  // Torso (shirt)
  const torso = capsule(0.20, 0.52, shirt);
  torso.position.set(0, 1.25, 0);
  g.add(torso);

  // Hips (pants)
  const hips = capsule(0.19, 0.20, pants);
  hips.position.set(0, 0.93, 0);
  g.add(hips);

  // Head (skin)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), skin);
  head.position.set(0, 1.62, 0);
  g.add(head);

  // Neck (skin)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.10, 14), skin);
  neck.position.set(0, 1.48, 0);
  g.add(neck);

  // --- ARMS ---
  const upperArmL = capsule(0.07, 0.26, shirt);
  upperArmL.position.set(0.30, 1.32, 0);
  upperArmL.rotation.z = 0.15;
  g.add(upperArmL);

  const foreArmL = capsule(0.06, 0.24, skin);
  foreArmL.position.set(0.40, 1.10, 0.02);
  foreArmL.rotation.z = 0.20;
  g.add(foreArmL);

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), skin);
  handL.position.set(0.46, 0.95, 0.03);
  g.add(handL);

  const upperArmR = capsule(0.07, 0.26, shirt);
  upperArmR.position.set(-0.30, 1.32, 0);
  upperArmR.rotation.z = -0.15;
  g.add(upperArmR);

  const foreArmR = capsule(0.06, 0.24, skin);
  foreArmR.position.set(-0.40, 1.10, 0.02);
  foreArmR.rotation.z = -0.20;
  g.add(foreArmR);

  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), skin);
  handR.position.set(-0.46, 0.95, 0.03);
  g.add(handR);

  // --- LEGS ---
  const thighL = capsule(0.085, 0.34, pants);
  thighL.position.set(0.12, 0.65, 0);
  g.add(thighL);

  const shinL = capsule(0.075, 0.34, pants);
  shinL.position.set(0.12, 0.30, 0.02);
  g.add(shinL);

  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.22), shoes);
  shoeL.position.set(0.12, 0.08, 0.08);
  g.add(shoeL);

  const thighR = capsule(0.085, 0.34, pants);
  thighR.position.set(-0.12, 0.65, 0);
  g.add(thighR);

  const shinR = capsule(0.075, 0.34, pants);
  shinR.position.set(-0.12, 0.30, 0.02);
  g.add(shinR);

  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.22), shoes);
  shoeR.position.set(-0.12, 0.08, 0.08);
  g.add(shoeR);

  // Ground anchor (so feet rest on y=0)
  g.position.copy(position);
  g.rotation.y = rotationY;
  g.scale.setScalar(scale);

  // Slight shadow help (only if shadows enabled later)
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  scene.add(g);
  return g;
}
