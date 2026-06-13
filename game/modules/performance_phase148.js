import * as THREE from "three";

export function createPhase148QuestPerfPass({ renderer, scene, log = console.log } = {}){
  const ua = (navigator.userAgent || "").toLowerCase();
  const questOrMobile = /quest|oculus|android|mobile|vr/i.test(ua);
  const android = /android/i.test(ua);
  const quest = /quest|oculus/i.test(ua);
  const desktop = !questOrMobile;

  const qualitySteps = questOrMobile
    ? [0.72, 0.66, 0.60, 0.54, 0.50]
    : [Math.min(window.devicePixelRatio || 1, 1.0), 0.9, 0.8];
  let qualityIndex = 0;
  let maxPixelRatio = qualitySteps[qualityIndex];
  let optionalTickStride = questOrMobile ? 2 : 1;
  let optionalTickFrame = 0;
  let lastDegradeAt = 0;
  let freezeStrike = 0;
  let stableFrameCount = 0;
  let adaptiveLocked = false;
  let lastStatusAt = 0;

  function applyRendererSettings(){
    if (!renderer) return;
    renderer.setPixelRatio(maxPixelRatio);
    renderer.shadowMap.enabled = false;
    renderer.info.autoReset = true;
    renderer.sortObjects = false;
    try {
      renderer.toneMappingExposure = questOrMobile ? 0.92 : 1.0;
      if (renderer.xr && typeof renderer.xr.setFramebufferScaleFactor === "function" && questOrMobile){
        renderer.xr.setFramebufferScaleFactor(quest ? 0.76 : 0.70);
      }
      if (renderer.xr && typeof renderer.xr.setFoveation === "function" && questOrMobile){
        renderer.xr.setFoveation(1.0);
      }
    } catch (err){
      log("[Phase166] XR perf setting skipped", err?.message || err);
    }
  }

  function tuneMaterial(mat){
    if (!mat) return;
    mat.precision = "mediump";
    mat.needsUpdate = false;
    if (mat.map){
      mat.map.anisotropy = questOrMobile ? 1 : Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
      mat.map.generateMipmaps = true;
    }
    if (mat.emissiveMap && questOrMobile) mat.emissiveMap.anisotropy = 1;
    if (questOrMobile && mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.42);
    if (questOrMobile && mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.72);
  }

  function lockSceneForQuest(){
    if (!scene) return;
    let meshCount = 0;
    let lightCount = 0;
    let hiddenHelperCount = 0;
    scene.traverse((obj)=>{
      if (obj.isMesh){
        meshCount++;
        obj.frustumCulled = true;
        obj.castShadow = false;
        obj.receiveShadow = false;
        if (questOrMobile && /debug|helper|joint/i.test(obj.name || "")){
          obj.visible = false;
          hiddenHelperCount++;
        }
        if (obj.material){
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(tuneMaterial);
        }
      }
      if (obj.isLight){
        lightCount++;
        obj.castShadow = false;
        if (questOrMobile && obj.intensity > 1.4) obj.intensity *= 0.72;
      }
    });
    scene.userData._phase148Perf = { questOrMobile, android, quest, desktop, maxPixelRatio, optionalTickStride, meshCount, lightCount, hiddenHelperCount };
    window.SVR_PHASE148_PERF = scene.userData._phase148Perf;
    log(`[Phase166] Freeze guard locked. mobile=${questOrMobile} pixelRatio=${maxPixelRatio} stride=${optionalTickStride} meshes=${meshCount} lights=${lightCount}`);
  }

  function optionalTickAllowed(){
    optionalTickFrame++;
    return optionalTickStride <= 1 || (optionalTickFrame % optionalTickStride) === 0;
  }

  function degradeQuality(reason = "frame spike", statusCb = null){
    const now = performance.now();
    if (now - lastDegradeAt < 1400) return false;
    lastDegradeAt = now;

    if (qualityIndex < qualitySteps.length - 1){
      qualityIndex++;
      maxPixelRatio = qualitySteps[qualityIndex];
      applyRendererSettings();
    }
    optionalTickStride = Math.min(optionalTickStride + 1, questOrMobile ? 5 : 3);
    adaptiveLocked = true;
    scene.userData._phase166FreezeGuard = { qualityIndex, maxPixelRatio, optionalTickStride, reason, at: Date.now() };
    window.SVR_PHASE166_FREEZE_GUARD = scene.userData._phase166FreezeGuard;
    log(`[Phase166] Adaptive freeze guard: ${reason}; pixelRatio=${maxPixelRatio}; stride=${optionalTickStride}`);
    if (statusCb && now - lastStatusAt > 2200){
      lastStatusAt = now;
      statusCb(`Freeze guard adjusted quality • ${reason}`);
    }
    return true;
  }

  function reportFrame(dt, statusCb = null){
    if (!questOrMobile) return;
    const ms = dt * 1000;
    if (ms > 58){
      freezeStrike += 2;
      stableFrameCount = 0;
    } else if (ms > 42){
      freezeStrike += 1;
      stableFrameCount = 0;
    } else {
      stableFrameCount++;
      if (stableFrameCount > 90) freezeStrike = Math.max(0, freezeStrike - 1);
    }
    if (freezeStrike >= 3){
      degradeQuality(`${Math.round(ms)}ms frame`, statusCb);
      freezeStrike = 0;
    }
  }

  function emergencyLowMode(reason = "manual emergency low mode", statusCb = null){
    qualityIndex = qualitySteps.length - 1;
    maxPixelRatio = qualitySteps[qualityIndex];
    optionalTickStride = questOrMobile ? 5 : 3;
    applyRendererSettings();
    adaptiveLocked = true;
    log(`[Phase166] Emergency low mode: ${reason}`);
    if (statusCb) statusCb("Emergency low mode enabled");
  }

  applyRendererSettings();

  return {
    questOrMobile,
    android,
    quest,
    desktop,
    get maxPixelRatio(){ return maxPixelRatio; },
    get optionalTickStride(){ return optionalTickStride; },
    get adaptiveLocked(){ return adaptiveLocked; },
    optionalTickAllowed,
    lockSceneForQuest,
    reportFrame,
    emergencyLowMode,
    onXRSessionStart: applyRendererSettings
  };
}
