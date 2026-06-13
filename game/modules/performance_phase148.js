import * as THREE from "three";

export function createPhase148QuestPerfPass({ renderer, scene, log = console.log } = {}){
  const ua = (navigator.userAgent || "").toLowerCase();
  const questOrMobile = /quest|oculus|android|mobile|vr/i.test(ua);
  const maxPixelRatio = questOrMobile ? 0.72 : Math.min(window.devicePixelRatio || 1, 1.0);
  const optionalTickStride = questOrMobile ? 2 : 1;
  let optionalTickFrame = 0;

  function applyRendererSettings(){
    if (!renderer) return;
    renderer.setPixelRatio(maxPixelRatio);
    renderer.shadowMap.enabled = false;
    renderer.info.autoReset = true;
    try {
      if (renderer.xr && typeof renderer.xr.setFramebufferScaleFactor === "function" && questOrMobile){
        renderer.xr.setFramebufferScaleFactor(0.82);
      }
      if (renderer.xr && typeof renderer.xr.setFoveation === "function" && questOrMobile){
        renderer.xr.setFoveation(1.0);
      }
    } catch (err){
      log("[Phase148] XR perf setting skipped", err?.message || err);
    }
  }

  function lockSceneForQuest(){
    if (!scene) return;
    let meshCount = 0;
    let lightCount = 0;
    scene.traverse((obj)=>{
      if (obj.isMesh){
        meshCount++;
        obj.frustumCulled = true;
        obj.castShadow = false;
        obj.receiveShadow = false;
        if (obj.material){
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat)=>{
            if (!mat) return;
            mat.precision = "mediump";
            if (mat.map) mat.map.anisotropy = questOrMobile ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy?.() || 1);
          });
        }
      }
      if (obj.isLight){
        lightCount++;
        obj.castShadow = false;
      }
    });
    scene.userData._phase148Perf = { questOrMobile, maxPixelRatio, optionalTickStride, meshCount, lightCount };
    window.SVR_PHASE148_PERF = scene.userData._phase148Perf;
    log(`[Phase148] Quest performance pass locked. mobile=${questOrMobile} pixelRatio=${maxPixelRatio} meshes=${meshCount} lights=${lightCount}`);
  }

  function optionalTickAllowed(){
    optionalTickFrame++;
    return optionalTickStride <= 1 || (optionalTickFrame % optionalTickStride) === 0;
  }

  applyRendererSettings();

  return {
    questOrMobile,
    maxPixelRatio,
    optionalTickAllowed,
    lockSceneForQuest,
    onXRSessionStart: applyRendererSettings
  };
}
