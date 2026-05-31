// PHASE-173-CAM3-FLOOR-STABILITY-LOCK
// Fixes blinking/shimmering floor artifacts in website CAM 3 preview.
// Preview-only: does not alter Quest/VR gameplay, lobby routing, Reiki, PGA, or Scorpion logic.
import * as THREE from "three";

const PHASE = "PHASE-173-CAM3-FLOOR-STABILITY-LOCK";

if (!window.__SVR_PHASE173_CAM3_FLOOR_STABILITY__) {
  window.__SVR_PHASE173_CAM3_FLOOR_STABILITY__ = true;

  const params = new URLSearchParams(location.search);
  const PREVIEW = params.has("preview") || params.has("live") || params.get("cam") === "director" || window.self !== window.top;

  function isFlatLowSurface(obj){
    if (!obj?.isMesh || !obj.geometry) return false;
    const y = obj.position?.y ?? 999;
    if (y > 0.12) return false;
    const p = obj.geometry.parameters || {};
    const type = obj.geometry.type || "";
    const name = `${obj.name || ""} ${obj.parent?.name || ""}`.toLowerCase();
    if (/floor|carpet|rug|ring|pad|tile|grid|mat|orbit/.test(name)) return true;
    if (/PlaneGeometry|CircleGeometry|RingGeometry/.test(type)) return true;
    if (Number(p.height || 0) < 0.03 && Number(p.width || p.radius || 0) > 2) return true;
    return false;
  }

  function stabilizePreviewFloor(scene){
    if (!PREVIEW || !scene || scene.userData.phase173Cam3FloorStable) return false;
    scene.userData.phase173Cam3FloorStable = true;

    let hidden = 0;
    scene.traverse((obj)=>{
      if (!isFlatLowSurface(obj)) return;
      // Keep portals and non-floor UI untouched.
      const n = `${obj.name || ""} ${obj.parent?.name || ""}`.toLowerCase();
      if (/portal|button|label|sign|plaque|wall|screen/.test(n)) return;
      obj.userData.phase173HiddenForCam3 = true;
      obj.visible = false;
      hidden++;
    });

    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x07070c,
      transparent: false,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide
    });
    const cleanFloor = new THREE.Mesh(new THREE.CircleGeometry(19.4, 96), floorMat);
    cleanFloor.name = "PHASE173_CAM3_CLEAN_MATTE_FLOOR";
    cleanFloor.rotation.x = -Math.PI / 2;
    cleanFloor.position.set(0, 0.006, 0);
    cleanFloor.renderOrder = -20;
    scene.add(cleanFloor);

    const accentMat = new THREE.MeshBasicMaterial({
      color: 0x8d62ff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide
    });
    const accentRing = new THREE.Mesh(new THREE.RingGeometry(7.6, 7.68, 128), accentMat);
    accentRing.name = "PHASE173_CAM3_SINGLE_STABLE_ACCENT_RING";
    accentRing.rotation.x = -Math.PI / 2;
    accentRing.position.set(0, 0.018, 0);
    scene.add(accentRing);

    const status = document.getElementById("status");
    if (status) status.textContent = `Phase 173 CAM3 floor stable (${hidden} shimmer surfaces hidden)`;
    window.SVR_PHASE173_CAM3_FLOOR_STABILITY = { phase: PHASE, preview: true, hiddenSurfaces: hidden, floor: "single-matte-preview-floor" };
    console.log(`[${PHASE}] preview floor stabilized`, { hidden });
    return true;
  }

  function boot(){
    if (!PREVIEW) return;
    const tryHook = ()=>stabilizePreviewFloor(window.SVR_GAME?.scene);
    if (!tryHook()) {
      let attempts = 0;
      const id = setInterval(()=>{
        attempts++;
        if (tryHook() || attempts > 80) clearInterval(id);
      }, 250);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
}
