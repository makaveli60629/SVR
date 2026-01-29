import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

/**
 * Spawn avatars from /assets/avatars/*.glb
 * - Designed for GitHub Pages (absolute/relative paths work).
 * - Falls back to simple capsules if GLB fails.
 */
export function spawnSeatAvatars(scene, {
  tableY = -1.4,
  seatRadius = 4.05,
  seatCount = 8,
  avatarPaths = [],
  scale = 1.0,
} = {}) {
  const group = new THREE.Group();
  group.name = "SeatAvatars";
  scene.add(group);

  const loader = new GLTFLoader();
  loader.setCrossOrigin('anonymous');

  const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x22222a, roughness: 0.7 });
  const capsuleGeo = new THREE.CapsuleGeometry(0.22, 0.9, 8, 16);

  function addFallback(i){
    const a = (i/seatCount)*Math.PI*2;
    const m = new THREE.Mesh(capsuleGeo, fallbackMat);
    m.position.set(Math.cos(a)*seatRadius, tableY + 0.55, Math.sin(a)*seatRadius);
    m.lookAt(0, tableY + 0.55, 0);
    group.add(m);
  }

  // If no paths supplied, just fallback all
  if (!avatarPaths || avatarPaths.length === 0){
    for (let i=0;i<seatCount;i++) addFallback(i);
    return { group };
  }

  for (let i=0;i<seatCount;i++){
    const path = avatarPaths[i % avatarPaths.length];
    const a = (i/seatCount)*Math.PI*2;

    loader.load(path,
      (gltf)=>{
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root){ addFallback(i); return; }

        // normalize: add shadow + basic scaling
        root.traverse((o)=>{
          if (o.isMesh){
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });

        root.scale.setScalar(scale);
        root.position.set(Math.cos(a)*seatRadius, tableY, Math.sin(a)*seatRadius);
        root.lookAt(0, tableY + 1.0, 0);
        group.add(root);
      },
      undefined,
      ()=> addFallback(i)
    );
  }

  return { group };
}

export function spawnGuard(scene, {
  path,
  position = new THREE.Vector3(0,0,0),
  lookAt = new THREE.Vector3(0,1.2,0),
  scale = 1.0
} = {}) {
  const group = new THREE.Group();
  group.name = "GuardAvatar";
  scene.add(group);

  const loader = new GLTFLoader();
  loader.setCrossOrigin('anonymous');

  if (!path){
    // fallback capsule
    const m = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 0.9, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.75 })
    );
    m.position.copy(position).add(new THREE.Vector3(0,0.55,0));
    group.add(m);
    return { group };
  }

  loader.load(path, (gltf)=>{
    const root = gltf.scene || gltf.scenes?.[0];
    if (!root) return;
    root.traverse((o)=>{
      if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }
    });
    root.scale.setScalar(scale);
    root.position.copy(position);
    root.lookAt(lookAt);
    group.add(root);
  });

  return { group };
}
