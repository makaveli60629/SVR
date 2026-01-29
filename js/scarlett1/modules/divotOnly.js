
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { makeCasinoFloorTexture } from './floorTexture.js';

/**
 * divotOnly.js — "NUKE & DIVOT ONLY" mode
 * User request: remove table/chairs/pedestal/pit dressing; leave a clean deep divot/hole.
 *
 * This is the guaranteed way to defeat the "cap":
 * - We REMOVE all meshes from the scene (except optional keep list)
 * - Then we rebuild ONLY a floor ring + deep cylinder divot
 *
 * Usage (recommended):
 *   import { nukeToDivotOnly } from './modules/divotOnly.js';
 *   nukeToDivotOnly(scene, { radius: 7.5, depth: 18.0 });
 *
 * Call this AFTER your normal world build (at the end), so it wipes everything.
 */
export function nukeToDivotOnly(scene, opts = {}) {
  const radius = opts.radius ?? 7.5;
  const depth  = opts.depth  ?? 18.0;
  const floorRadius = opts.floorRadius ?? 22.0;

  // 1) PURGE all meshes / groups in the scene
  const keepNames = new Set((opts.keepNames ?? ["Player", "Rig", "Camera", "XR", "Hands"]).map(s => s.toLowerCase()));
  const toRemove = [];

  scene.traverse((obj) => {
    if (obj === scene) return;
    const n = (obj.name || "").toLowerCase();
    if (keepNames.has(n)) return;
    if (obj.isMesh || obj.isGroup || obj.isObject3D) {
      // We'll remove almost everything except lights & camera rigs
      if (obj.isLight) return;
      if (obj.isCamera) return;
      // If it's a parent of a camera, keep it
      if (obj.children && obj.children.some(c => c.isCamera)) return;
      toRemove.push(obj);
    }
  });

  // Remove deepest-first to avoid parent/child double removes
  toRemove.sort((a,b)=>b.children.length-a.children.length);
  for (const obj of toRemove) {
    if (obj.parent) obj.parent.remove(obj);
  }

  // 2) Ensure lighting exists
  if (!scene.__divotLightingAdded) {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x101018, 1.6));
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(8, 16, 6);
    scene.add(key);
    scene.__divotLightingAdded = true;
  }

  // 3) Build ONLY the divot (floor ring + deep cylinder wall + bottom)
  const group = new THREE.Group();
  group.name = "DIVOT_ONLY";
  scene.add(group);

  const tex = makeCasinoFloorTexture();

  // Floor ring (hole in the middle)
  const ringGeo = new THREE.RingGeometry(radius + 0.05, floorRadius, 220, 1);
  ringGeo.rotateX(-Math.PI/2);

  const ringMat = new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff,
    roughness: 0.95,
    side: THREE.DoubleSide
  });

  const floorRing = new THREE.Mesh(ringGeo, ringMat);
  floorRing.position.y = -0.10;
  group.add(floorRing);

  // Divot wall
  const wallHeight = depth + 1.2;
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, wallHeight, 220, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 1.0, side: THREE.DoubleSide })
  );
  wall.position.y = -0.18 - wallHeight/2; // top lip near floor
  group.add(wall);

  // Bottom
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.3, 180),
    new THREE.MeshStandardMaterial({ color: 0x040409, roughness: 1.0 })
  );
  bottom.position.y = -0.18 - wallHeight + 0.18;
  group.add(bottom);

  // Rim glow (optional but helps read hole)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius + 0.06, 0.16, 18, 240),
    new THREE.MeshStandardMaterial({
      color: 0x0b2b6f,
      emissive: 0x0b2b6f,
      emissiveIntensity: 2.3,
      roughness: 0.6
    })
  );
  rim.position.y = -0.05;
  rim.rotation.x = Math.PI/2;
  group.add(rim);

  // Depth fog (makes it feel deeper)
  if (opts.enableFog !== false) {
    scene.fog = new THREE.Fog(0x050509, 2.0, Math.max(18.0, depth + 6.0));
  }

  console.log("🕳️ [divotOnly] Nuked scene to divot-only:", { radius, depth });
  return { group, radius, depth };
}
