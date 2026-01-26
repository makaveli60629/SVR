import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Safe GLB loader:
 * - Works on GitHub Pages (same-origin relative URLs)
 * - Returns a THREE.Group, already centered & scaled to fit a target size
 */
export async function loadGLB(url, { targetHeight = 0.35 } = {}) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene || gltf.scenes?.[0];
  if (!root) throw new Error('GLB has no scene');

  // Normalize
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const height = Math.max(0.0001, size.y);
  const s = targetHeight / height;
  root.scale.setScalar(s);

  // Recompute + center at origin
  const box2 = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  box2.getCenter(center);
  root.position.sub(center);

  const group = new THREE.Group();
  group.add(root);
  return group;
}
