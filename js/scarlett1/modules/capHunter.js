
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/**
 * capHunter.js — finds AND hides the mesh that's capping the pit.
 * This is stronger than autoUncoverPit:
 * - No name-based skipping
 * - Checks common cap geometry types
 * - Can run repeatedly for a short window to catch late-added meshes
 *
 * Usage:
 *   const cap = createCapHunter(scene, { pitRadius: 6.6 });
 *   // In your loop (for ~3s after build):
 *   cap.update(dt);
 *
 * Or one-shot:
 *   cap.scanAndHide();
 */
export function createCapHunter(scene, opts = {}) {
  const pitRadius = opts.pitRadius ?? 6.6;
  const center = opts.center ?? new THREE.Vector3(0, 0, 0);
  const yMin = opts.yMin ?? -1.2;
  const yMax = opts.yMax ??  1.2;

  const test = new THREE.Vector3(center.x, 0, center.z);
  const box = new THREE.Box3();
  const wpos = new THREE.Vector3();
  const size = new THREE.Vector3();

  let elapsed = 0;
  const runFor = opts.runForSeconds ?? 4.0; // keep hunting for caps for first few seconds
  let totalHidden = 0;

  function isCapCandidate(mesh, boundsSize) {
    const g = mesh.geometry;
    const type = g?.type || "";
    const likelyType =
      type.includes("Plane") ||
      type.includes("Circle") ||
      type.includes("Ring") ||
      type.includes("Cylinder") ||
      type.includes("Box");

    // Very thin + wide is often a cap
    const thin = boundsSize.y < 0.35;
    const wideEnough = (boundsSize.x > pitRadius * 1.6) || (boundsSize.z > pitRadius * 1.6);

    // Some caps are thicker (box platforms), so allow wideEnough OR likelyType near floor
    return (wideEnough && (thin || likelyType)) || (likelyType && thin);
  }

  function scanAndHide() {
    const hits = [];
    scene.traverse((obj) => {
      if (!obj.isMesh) return;
      if (!obj.visible) return;
      if (!obj.geometry) return;

      obj.getWorldPosition(wpos);
      if (wpos.y < yMin || wpos.y > yMax) return;

      try {
        box.setFromObject(obj);
      } catch {
        return;
      }

      if (!box.containsPoint(test)) return;

      box.getSize(size);
      if (!isCapCandidate(obj, size)) return;

      // HIDE IT
      obj.visible = false;
      totalHidden++;

      hits.push({
        name: obj.name || "(unnamed)",
        type: obj.geometry?.type || "(no-geo-type)",
        y: Number(wpos.y).toFixed(3),
        size: { x: Number(size.x).toFixed(2), y: Number(size.y).toFixed(2), z: Number(size.z).toFixed(2) }
      });
    });

    if (hits.length) {
      console.log("🧹 [capHunter] HID cap candidate meshes:", hits);
    } else {
      console.log("🧹 [capHunter] No cap candidates this scan.");
    }
    return hits;
  }

  function update(dt) {
    elapsed += dt;
    if (elapsed > runFor) return false; // stop
    // Run a scan about 10 times per second
    if (Math.floor(elapsed * 10) !== Math.floor((elapsed - dt) * 10)) {
      scanAndHide();
    }
    return true;
  }

  return { scanAndHide, update, get totalHidden(){ return totalHidden; } };
}
