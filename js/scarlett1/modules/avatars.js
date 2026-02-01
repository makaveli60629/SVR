// SVR/js/scarlett1/modules/avatars.js
// ✅ CDN-only (GitHub Pages safe). NO bare imports.
//
// Permanent: AVATAR MODULE v1 (CDN)
//
// NOTE: Do NOT paste two modules into one file.
// This file replaces any older avatar file that imported from 'three'.

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

// Robust URL builder (works regardless of where this module lives)
function assetUrl(relFromSVRRoot) {
  // relFromSVRRoot example: 'assets/avatars/male.glb'
  // We build URL relative to the site root path (/SVR/)
  const base = `${location.origin}${location.pathname.replace(/\/index\.html.*$/, '/').replace(/\/$/, '/')}`;
  // If you're at https://.../SVR/ then base becomes https://.../SVR/
  return new URL(relFromSVRRoot, base).href;
}

const AVATAR_FILES = {
  male: assetUrl('assets/avatars/male.glb'),
  female: assetUrl('assets/avatars/female.glb'),
  ninja: assetUrl('assets/avatars/ninja.glb'),
  combat: assetUrl('assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb'),
  apocalypse_female: assetUrl('assets/avatars/futuristic_apocalypse_female_cargo_pants.glb'),
};

export function initAvatars({ scene, Bus }) {
  const loader = new GLTFLoader();
  loader.setCrossOrigin('anonymous');

  let current = null;

  function setHud(name) {
    const el = document.getElementById('av');
    if (el) el.textContent = name ? String(name).toUpperCase() : 'NONE';
  }

  function disposeObject(root) {
    if (!root) return;
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
        else o.material.dispose?.();
      }
    });
  }

  function normalizeAndPlace(root) {
    // Bounds
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // center at origin
    root.position.sub(center);

    // scale to ~1.7m tall
    const height = Math.max(size.y, size.x, size.z, 0.001);
    const scale = 1.7 / height;
    root.scale.setScalar(scale);

    // put feet at y=0
    const box2 = new THREE.Box3().setFromObject(root);
    root.position.y -= box2.min.y;

    // place near center (adjust to your table location if needed)
    root.position.set(1.6, 0.0, 1.6);
    root.rotation.y = Math.PI;
  }

  async function loadAvatar(key) {
    const url = AVATAR_FILES[key];
    if (!url) {
      Bus?.log?.(`AVATAR ERROR: Unknown key "${key}"`);
      return;
    }

    // clear existing
    if (current) {
      scene.remove(current);
      disposeObject(current);
      current = null;
    }

    Bus?.log?.(`AVATAR: LOADING ${key}…`);
    setHud(key);

    try {
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root) throw new Error('No scene in GLB');

      // Make visible even under low light
      root.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = false;
        o.receiveShadow = false;

        const apply = (mat) => {
          if (!mat) return;
          if ('emissive' in mat) {
            mat.emissive = mat.emissive || new THREE.Color(0x000000);
            mat.emissive.add(new THREE.Color(0x001000));
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.35);
          }
          mat.needsUpdate = true;
        };

        const m = o.material;
        if (Array.isArray(m)) m.forEach(apply);
        else apply(m);
      });

      normalizeAndPlace(root);
      current = root;
      scene.add(root);

      Bus?.log?.(`AVATAR: ${key} SPAWNED`);
    } catch (e) {
      setHud('NONE');
      Bus?.log?.(`AVATAR LOAD FAIL: ${e?.message || e}`);
    }
  }

  // exposed helpers (buttons call these)
  window.spawnAvatar = (key) => loadAvatar(key);
  window.clearAvatar = () => {
    if (current) {
      scene.remove(current);
      disposeObject(current);
    }
    current = null;
    setHud(null);
    Bus?.log?.('AVATAR: CLEARED');
  };

  Bus?.log?.('AVATAR MANAGER ONLINE');
}

/**
 * OPTIONAL: seat avatars around a table
 */
export function spawnSeatAvatars(scene, {
  tableY = -1.4,
  seatRadius = 4.05,
  seatCount = 8,
  avatarKeys = ['male','female','ninja','combat'],
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

  for (let i=0;i<seatCount;i++){
    const key = avatarKeys[i % avatarKeys.length];
    const path = AVATAR_FILES[key];
    const a = (i/seatCount)*Math.PI*2;

    if (!path) { addFallback(i); continue; }

    loader.load(path,
      (gltf)=>{
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root){ addFallback(i); return; }
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

/**
 * OPTIONAL: guard avatar (combat ninja) at a position
 */
export function spawnGuard(scene, {
  key = 'combat',
  position = new THREE.Vector3(0,0,0),
  lookAt = new THREE.Vector3(0,1.2,0),
  scale = 1.0
} = {}) {
  const group = new THREE.Group();
  group.name = "GuardAvatar";
  scene.add(group);

  const loader = new GLTFLoader();
  loader.setCrossOrigin('anonymous');

  const path = AVATAR_FILES[key];

  if (!path){
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
