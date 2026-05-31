// PHASE-174-REMOVE-DUPLICATE-GREEN-TABLETOP
// Removes the extra green felt/table-top surface visible in the lobby preview.
// Keeps cards, chips, seats, portals, private scenes, and the actual poker table base intact.
import * as THREE from "three";

const PHASE = "PHASE-174-REMOVE-DUPLICATE-GREEN-TABLETOP";

if (!window.__SVR_PHASE174_REMOVE_DUPLICATE_GREEN_TABLETOP__) {
  window.__SVR_PHASE174_REMOVE_DUPLICATE_GREEN_TABLETOP__ = true;

  function getMeshWorldInfo(mesh){
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    try {
      mesh.updateMatrixWorld(true);
      box.setFromObject(mesh);
      box.getSize(size);
      box.getCenter(center);
    } catch (_err) {
      size.set(0,0,0); center.set(999,999,999);
    }
    return { box, size, center, area: size.x * size.z };
  }

  function materialLooksGreen(mesh){
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    return mats.some((mat)=>{
      if (!mat) return false;
      const c = mat.color;
      if (c && c.g > c.r * 1.12 && c.g >= c.b * 0.72) return true;
      if (mat.map && /felt|table|green/i.test(String(mat.map.name || mat.map.source?.data?.src || ""))) return true;
      return false;
    });
  }

  function isCentralFlatTableSurface(mesh){
    if (!mesh?.isMesh || !mesh.geometry) return false;
    const name = `${mesh.name || ""} ${mesh.parent?.name || ""}`.toLowerCase();
    if (/card|chip|pot|button|label|tag|ring|chair|seat|portal|wall|floor|carpet|rug|plaque|sign|screen|planet|moon|mars/.test(name)) return false;
    const { size, center, area } = getMeshWorldInfo(mesh);
    if (!Number.isFinite(area)) return false;
    if (area < 1.35 || area > 22) return false;
    if (center.y < 0.55 || center.y > 1.18) return false;
    if (Math.abs(center.x) > 2.6 || Math.abs(center.z) > 2.2) return false;
    if (size.y > 0.34) return false;
    const type = mesh.geometry.type || "";
    const flatGeometry = /ShapeGeometry|PlaneGeometry|CircleGeometry|ExtrudeGeometry|BoxGeometry|BufferGeometry/.test(type);
    return flatGeometry && materialLooksGreen(mesh);
  }

  function removeDuplicateGreenTableTop(scene){
    if (!scene || scene.userData.phase174GreenTableTopRemoved) return false;
    scene.userData.phase174GreenTableTopRemoved = true;

    const candidates = [];
    scene.traverse((obj)=>{
      if (!isCentralFlatTableSurface(obj)) return;
      const info = getMeshWorldInfo(obj);
      candidates.push({ mesh: obj, ...info });
    });

    if (!candidates.length) {
      window.SVR_PHASE174_REMOVE_DUPLICATE_GREEN_TABLETOP = { phase: PHASE, removed: 0, note: "No duplicate green tabletop candidates found" };
      return true;
    }

    // Preserve the lowest/smallest playable felt-like surface if there is only one.
    // If there are duplicates, remove upper/larger green overlays first.
    candidates.sort((a,b)=>{
      const yDelta = b.center.y - a.center.y;
      if (Math.abs(yDelta) > 0.018) return yDelta;
      return b.area - a.area;
    });

    let removed = 0;
    const keepOne = candidates.length <= 1;
    candidates.forEach((item, idx)=>{
      const shouldRemove = keepOne ? true : idx < candidates.length - 1 || item.area > 2.8;
      if (!shouldRemove) return;
      item.mesh.userData.phase174RemovedDuplicateGreenTableTop = true;
      item.mesh.visible = false;
      item.mesh.renderOrder = -999;
      if (item.mesh.material) {
        const mats = Array.isArray(item.mesh.material) ? item.mesh.material : [item.mesh.material];
        mats.forEach((mat)=>{ if (mat) { mat.transparent = true; mat.opacity = 0; mat.depthWrite = false; } });
      }
      removed++;
    });

    const status = document.getElementById("status");
    if (status) status.textContent = `Phase 174: removed duplicate green tabletop (${removed})`;
    window.SVR_PHASE174_REMOVE_DUPLICATE_GREEN_TABLETOP = {
      phase: PHASE,
      removed,
      candidates: candidates.map((c)=>({ name: c.mesh.name || c.mesh.parent?.name || "unnamed", y: Number(c.center.y.toFixed(3)), area: Number(c.area.toFixed(3)) })),
      protected: ["site", "cards", "chips", "seats", "private-scenes"]
    };
    console.log(`[${PHASE}] complete`, window.SVR_PHASE174_REMOVE_DUPLICATE_GREEN_TABLETOP);
    return true;
  }

  function boot(){
    const tryHook = ()=>removeDuplicateGreenTableTop(window.SVR_GAME?.scene);
    if (!tryHook()) {
      let attempts = 0;
      const id = setInterval(()=>{
        attempts++;
        if (tryHook() || attempts > 120) clearInterval(id);
      }, 250);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
}
