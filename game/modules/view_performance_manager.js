import * as THREE from "three";

const PHASE = "PHASE-129-VIEW-PERFORMANCE-SPAWN-TELEPORT-MODULE-LOCK";

export function createViewPerformanceManager({ renderer, scene, camera, worldRoot = null, statusCb = ()=>{} } = {}){
  const state = {
    phase: PHASE,
    quality: "quest-stable",
    blackEdgesFix: true,
    targetPixelRatio: 0.72,
    targetFramebufferScale: 0.72,
    fps: 72,
    avgFrameMs: 13.8,
    siteTouched: false
  };
  let acc = 0;
  let samples = 0;
  let lastReport = performance.now();
  let lastCameraFix = 0;

  function applyQuality(){
    try { renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, state.targetPixelRatio)); } catch {}
    try { renderer?.xr?.setFramebufferScaleFactor?.(state.targetFramebufferScale); } catch {}
    try { renderer.toneMappingExposure = 0.92; } catch {}
    if (scene){
      scene.fog = new THREE.FogExp2(0x010105, 0.00055);
      scene.traverse?.((obj)=>{
        if (!obj) return;
        if (obj.isPointLight || obj.isSpotLight || obj.isDirectionalLight){
          if (!obj.userData._svrBaseIntensity) obj.userData._svrBaseIntensity = obj.intensity || 1;
          obj.intensity = Math.min(obj.userData._svrBaseIntensity, obj.userData._svrBaseIntensity * 0.82);
        }
        if (obj.isMesh && obj.material){
          obj.frustumCulled = obj.userData?.svrNoWorldShift ? false : obj.frustumCulled;
        }
      });
    }
    window.SVR_VIEW_PERFORMANCE_MANAGER = state;
  }

  function fixBlackEdges(){
    if (!renderer?.xr?.isPresenting) return;
    const now = performance.now();
    if (now - lastCameraFix < 1000) return;
    lastCameraFix = now;
    try {
      const xrCam = renderer.xr.getCamera(camera);
      if (xrCam){
        xrCam.near = 0.06;
        xrCam.far = 2200;
        xrCam.updateProjectionMatrix?.();
      }
      camera.near = 0.06;
      camera.far = 2200;
      camera.updateProjectionMatrix?.();
    } catch {}
  }

  function update(dt){
    acc += Math.max(0, dt || 0);
    samples += 1;
    fixBlackEdges();
    const now = performance.now();
    if (now - lastReport > 1800){
      const avg = samples ? (acc / samples) : 0.016;
      state.avgFrameMs = +(avg * 1000).toFixed(2);
      state.fps = +(1 / Math.max(avg, 0.001)).toFixed(1);
      if (state.avgFrameMs > 20 && state.quality !== "low-safe"){
        state.quality = "low-safe";
        state.targetPixelRatio = 0.62;
        state.targetFramebufferScale = 0.62;
        applyQuality();
        statusCb("Performance safe mode enabled");
      }
      if (state.avgFrameMs < 15.5 && state.quality === "low-safe"){
        state.quality = "quest-stable";
        state.targetPixelRatio = 0.72;
        state.targetFramebufferScale = 0.72;
        applyQuality();
      }
      acc = 0;
      samples = 0;
      lastReport = now;
      window.SVR_VIEW_PERFORMANCE_MANAGER = state;
    }
  }

  function forceLow(){
    state.quality = "low-safe";
    state.targetPixelRatio = 0.62;
    state.targetFramebufferScale = 0.62;
    applyQuality();
  }

  applyQuality();
  return { phase: PHASE, state, update, applyQuality, forceLow };
}
