import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const AVATAR_FILES = {
  male: './assets/avatars/male.glb',
  female: './assets/avatars/female.glb',
  ninja: './assets/avatars/ninja.glb',
  combat: './assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb',
  // optional extra (not wired to button, but available)
  apocalypse_female: './assets/avatars/futuristic_apocalypse_female_cargo_pants.glb',
};

export function initAvatars({ scene, Bus }) {
  const loader = new GLTFLoader();
  let current = null;

  function setHud(name) {
    const el = document.getElementById('av');
    if (el) el.textContent = name ? name.toUpperCase() : 'NONE';
  }

  function normalizeAndPlace(root) {
    // Compute bounds
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Move to origin (center)
    root.position.sub(center);

    // Scale to human size (~1.7m tall). Use Y as height proxy; fallback to max axis.
    const height = Math.max(size.y, Math.max(size.x, size.z), 0.001);
    const scale = 1.7 / height;
    root.scale.setScalar(scale);

    // After scaling, recompute and move feet to y=0
    const box2 = new THREE.Box3().setFromObject(root);
    const min = box2.min.clone();
    root.position.y -= min.y;

    // Place avatar standing near table, not inside camera
    root.position.set(1.6, 0.0, 1.6);
    root.rotation.y = Math.PI; // face toward center
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
      current.traverse(o => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
          else o.material.dispose?.();
        }
      });
      current = null;
    }

    Bus?.log?.(`AVATAR: LOADING ${key}…`);
    setHud(key);

    try {
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root) throw new Error('No scene in GLB');

      // Safe materials: ensure visible even in low light (tiny emissive)
      root.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = false;
        o.receiveShadow = false;
        const m = o.material;
        const apply = (mat) => {
          if (!mat) return;
          if ('emissive' in mat) {
            mat.emissive = mat.emissive || new THREE.Color(0x000000);
            mat.emissive.add(new THREE.Color(0x001000));
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.4);
          }
          mat.needsUpdate = true;
        };
        if (Array.isArray(m)) m.forEach(apply); else apply(m);
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

  window.spawnAvatar = (key) => loadAvatar(key);
  window.clearAvatar = () => {
    if (current) scene.remove(current);
    current = null;
    setHud(null);
    Bus?.log?.('AVATAR: CLEARED');
  };

  Bus?.log?.('AVATAR MANAGER ONLINE');
}
