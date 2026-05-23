import * as THREE from "three";

const PHASE = "PHASE-130-ORBIT-SKY-PERFORMANCE-STABILITY-LOCK";

export function createViewPerformanceManager({ renderer, scene, camera, worldRoot = null, statusCb = ()=>{} } = {}){
  const state = {
    phase: PHASE,
    quality: "quest-smooth-start",
    blackEdgesFix: true,
    targetPixelRatio: 0.58,
    targetFramebufferScale: 0.58,
    foveation: 1.0,
    fps: 72,
    avgFrameMs: 13.8,
    siteTouched: false
  };
  let acc = 0;
  let samples = 0;
  let lastReport = performance.now();
  let lastCameraFix = 0;
  let appliedOnce = false;

  function setRendererScale(){
    try { renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, state.targetPixelRatio)); } catch {}
    try { renderer?.xr?.setFramebufferScaleFactor?.(state.targetFramebufferScale); } catch {}
    try { renderer?.xr?.setFoveation?.(state.foveation); } catch {}
  }

  function applyQuality(){
    setRendererScale();
    try { renderer.toneMappingExposure = 0.86; } catch {}
    try { renderer.shadowMap.enabled = false; } catch {}
    if (scene){
      scene.fog = new THREE.FogExp2(0x010105, 0.00028);
      scene.traverse?.((obj)=>{
        if (!obj) return;
        if (obj.isPointLight || obj.isSpotLight || obj.isDirectionalLight){
          if (!obj.userData._svrBaseIntensity) obj.userData._svrBaseIntensity = obj.intensity || 1;
          obj.intensity = Math.min(obj.userData._svrBaseIntensity, obj.userData._svrBaseIntensity * 0.62);
          obj.castShadow = false;
        }
        if (obj.isMesh){
          obj.castShadow = false;
          obj.receiveShadow = false;
          if (obj.material){
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m)=>{
              if (!m) return;
              if ('envMapIntensity' in m) m.envMapIntensity = Math.min(m.envMapIntensity || 0.2, 0.15);
              m.needsUpdate = true;
            });
          }
          obj.frustumCulled = obj.userData?.svrNoWorldShift ? false : obj.frustumCulled;
        }
      });
    }
    appliedOnce = true;
    window.SVR_VIEW_PERFORMANCE_MANAGER = state;
  }

  function fixBlackEdges(){
    if (!renderer?.xr?.isPresenting) return;
    const now = performance.now();
    if (now - lastCameraFix < 700) return;
    lastCameraFix = now;
    try {
      setRendererScale();
      const xrCam = renderer.xr.getCamera(camera);
      if (xrCam){
        xrCam.near = 0.08;
        xrCam.far = 2400;
        xrCam.updateProjectionMatrix?.();
        xrCam.children?.forEach?.((child)=>{
          if (child.isCamera){
            child.near = 0.08;
            child.far = 2400;
            child.updateProjectionMatrix?.();
          }
        });
      }
      camera.near = 0.08;
      camera.far = 2400;
      camera.updateProjectionMatrix?.();
    } catch {}
  }

  function update(dt){
    if (!appliedOnce) applyQuality();
    acc += Math.max(0, dt || 0);
    samples += 1;
    fixBlackEdges();
    const now = performance.now();
    if (now - lastReport > 1500){
      const avg = samples ? (acc / samples) : 0.016;
      state.avgFrameMs = +(avg * 1000).toFixed(2);
      state.fps = +(1 / Math.max(avg, 0.001)).toFixed(1);
      if (state.avgFrameMs > 18 && state.quality !== "quest-low-safe"){
        state.quality = "quest-low-safe";
        state.targetPixelRatio = 0.52;
        state.targetFramebufferScale = 0.52;
        state.foveation = 1.0;
        applyQuality();
        statusCb("Quest performance safe mode active");
      }
      if (state.avgFrameMs < 14.5 && state.quality === "quest-low-safe"){
        state.quality = "quest-smooth-start";
        state.targetPixelRatio = 0.58;
        state.targetFramebufferScale = 0.58;
        state.foveation = 1.0;
        applyQuality();
      }
      acc = 0;
      samples = 0;
      lastReport = now;
      window.SVR_VIEW_PERFORMANCE_MANAGER = state;
    }
  }

  function forceLow(){
    state.quality = "quest-low-safe";
    state.targetPixelRatio = 0.50;
    state.targetFramebufferScale = 0.50;
    state.foveation = 1.0;
    applyQuality();
  }

  applyQuality();
  return { phase: PHASE, state, update, applyQuality, forceLow };
}
