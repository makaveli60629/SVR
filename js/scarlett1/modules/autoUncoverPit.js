
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/**
 * autoUncoverPit.js — FORCE remove any mesh "cap" covering the pit opening.
 *
 * Usage:
 *   autoUncoverPit(scene, { pitRadius: 6.6 });
 *
 * What it does:
 * - Traverses scene meshes
 * - Finds meshes whose bounding box contains world (0, y, 0) near the floor
 * - If mesh spans across the pit radius, it gets hidden (visible=false)
 * - Logs what it hid
 */
export function autoUncoverPit(scene, opts = {}) {
  const pitRadius = opts.pitRadius ?? 6.6;
  const center = opts.center ?? new THREE.Vector3(0, 0, 0);
  const yMin = opts.yMin ?? -0.6;
  const yMax = opts.yMax ??  0.6;

  const removed = [];

  const box = new THREE.Box3();
  const wpos = new THREE.Vector3();
  const test = new THREE.Vector3(center.x, 0, center.z);

  scene.traverse((obj) => {
    if (!obj.isMesh) return;
    if (!obj.geometry) return;

    // Skip obvious pit parts if named
    const n = (obj.name || "").toLowerCase();
    if (n.includes("pit") || n.includes("pedestal") || n.includes("table") || n.includes("rim")) return;

    obj.getWorldPosition(wpos);
    if (wpos.y < yMin || wpos.y > yMax) return;

    try {
      box.setFromObject(obj);
    } catch {
      return;
    }

    if (!box.containsPoint(test)) return;

    const size = new THREE.Vector3();
    box.getSize(size);

    const spansPit = (size.x > pitRadius * 1.8) || (size.z > pitRadius * 1.8);
    if (!spansPit) return;

    obj.visible = false;
    removed.push({
      name: obj.name || "(unnamed)",
      y: Number(wpos.y).toFixed(3),
      sizeX: Number(size.x).toFixed(2),
      sizeZ: Number(size.z).toFixed(2),
    });
  });

  if (removed.length) {
    console.log("🕳️ [autoUncoverPit] Hid pit caps:", removed);
  } else {
    console.log("🕳️ [autoUncoverPit] No pit caps detected to hide.");
  }

  return removed;
}
