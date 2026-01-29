import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { makeCasinoFloorTexture } from './floorTexture.js';

export function nukeToDivotOnly(scene, opts = {}) {
  const radius = opts.radius ?? 8.0;
  const depth  = opts.depth  ?? 22.0;
  const floorRadius = opts.floorRadius ?? 60.0;

  // Remove everything except cameras/lights
  const toRemove = [];
  scene.traverse((o)=>{
    if (o === scene) return;
    if (o.isLight || o.isCamera) return;
    if (o.children && o.children.some(c=>c.isCamera)) return;
    toRemove.push(o);
  });
  toRemove.sort((a,b)=>(b.children?.length||0)-(a.children?.length||0));
  for (const o of toRemove) o.parent?.remove(o);

  // Lighting baseline
  scene.add(new THREE.HemisphereLight(0xffffff, 0x101018, 1.6));
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(8, 16, 6);
  scene.add(key);

  const group = new THREE.Group();
  group.name = "DIVOT_ONLY";
  scene.add(group);

  const tex = makeCasinoFloorTexture();

  const ringGeo = new THREE.RingGeometry(radius + 0.05, floorRadius, 220, 1);
  ringGeo.rotateX(-Math.PI/2);
  const ringMat = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.95, side: THREE.DoubleSide });
  const floorRing = new THREE.Mesh(ringGeo, ringMat);
  floorRing.position.y = -0.10;
  group.add(floorRing);

  const wallH = depth + 1.2;
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, wallH, 220, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 1.0, side: THREE.DoubleSide })
  );
  wall.position.y = -0.18 - wallH/2;
  group.add(wall);

  const bottom = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 180).rotateX(-Math.PI/2),
    new THREE.MeshStandardMaterial({ color: 0x040409, roughness: 1.0 })
  );
  bottom.position.y = -0.18 - wallH + 0.18;
  group.add(bottom);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius + 0.06, 0.16, 18, 240),
    new THREE.MeshStandardMaterial({ color: 0x0b2b6f, emissive: 0x0b2b6f, emissiveIntensity: 2.3, roughness: 0.6 })
  );
  rim.position.y = -0.05;
  rim.rotation.x = Math.PI/2;
  group.add(rim);

  scene.fog = new THREE.Fog(0x050509, 3.0, Math.max(30, wallH + 10));

  console.log("🕳️ [divotOnly] active", { radius, depth });
  return { group, radius, depth };
}
