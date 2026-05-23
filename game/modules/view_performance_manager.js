import * as THREE from "three";

const PHASE = "PHASE-141-QUEST-FPS-EMERGENCY-STABILITY-LOCK";

export function createViewPerformanceManager({ renderer, scene, camera, worldRoot = null, statusCb = ()=>{} } = {}){
  const isQuest = /Quest|OculusBrowser|Meta Quest|VR/i.test(navigator.userAgent || "");
  const state = {
    phase: PHASE,
    quality: "quest-emergency-start",
    blackEdgesFix: true,
    targetPixelRatio: isQuest ? 0.38 : 0.46,
    targetFramebufferScale: isQuest ? 0.38 : 0.46,
    foveation: 1.0,
    fps: 72,
    avgFrameMs: 13.8,
    worstFrameMs: 0,
    frozenFrames: 0,
    emergency: true,
    questDetected: isQuest,
    siteTouched: false
  };
  let acc = 0;
  let samples = 0;
  let worst = 0;
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
    try { renderer.toneMappingExposure = 0.72; } catch {}
    try { renderer.shadowMap.enabled = false; } catch {}
    if (scene){
      scene.fog = null;
      scene.traverse?.((obj)=>{
        if (!obj) return;
        if (obj.isPointLight || obj.isSpotLight || obj.isDirectionalLight){
          if (!obj.userData._svrBaseIntensity) obj.userData._svrBaseIntensity = obj.intensity || 1;
          obj.intensity = Math.min(obj.userData._svrBaseIntensity * 0.46, 0.9);
          obj.castShadow = false;
        }
        if (obj.isSprite){
          obj.visible = false;
        }
        if (obj.isMesh){
          obj.castShadow = false;
          obj.receiveShadow = false;
          obj.frustumCulled = obj.userData?.svrNoWorldShift ? false : obj.frustumCulled;
          if (obj.material){
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m)=>{
              if (!m) return;
              if ('envMapIntensity' in m) m.envMapIntensity = 0.05;
              if ('metalness' in m) m.metalness = Math.min(m.metalness || 0, 0.12);
              if ('roughness' in m) m.roughness = Math.max(m.roughness || 0.5, 0.72);
              m.needsUpdate = true;
            });
          }
        }
      });
    }
    appliedOnce = true;
    window.SVR_VIEW_PERFORMANCE_MANAGER = state;
  }

  function fixCameraPlanes(){
    const now = performance.now();
    if (now - lastCameraFix < 900) return;
    lastCameraFix = now;
    try {
      setRendererScale();
      const xrCam = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
      if (xrCam){
        xrCam.near = 0.08;
        xrCam.far = 180;
        xrCam.updateProjectionMatrix?.();
        xrCam.children?.forEach?.((child)=>{
          if (child.isCamera){
            child.near = 0.08;
            child.far = 180;
            child.updateProjectionMatrix?.();
          }
        });
      }
      camera.near = 0.08;
      camera.far = 180;
      camera.updateProjectionMatrix?.();
    } catch {}
  }

  function update(dt){
    if (!appliedOnce) applyQuality();
    const frameMs = Math.max(0, (dt || 0) * 1000);
    if (frameMs > 80) state.frozenFrames += 1;
    worst = Math.max(worst, frameMs);
    acc += Math.max(0, dt || 0);
    samples += 1;
    fixCameraPlanes();
    const now = performance.now();
    if (now - lastReport > 1000){
      const avg = samples ? (acc / samples) : 0.016;
      state.avgFrameMs = +(avg * 1000).toFixed(2);
      state.worstFrameMs = +worst.toFixed(2);
      state.fps = +(1 / Math.max(avg, 0.001)).toFixed(1);
      if ((state.avgFrameMs > 16.8 || state.worstFrameMs > 70) && state.quality !== "quest-ultra-safe"){
        state.quality = "quest-ultra-safe";
        state.targetPixelRatio = 0.32;
        state.targetFramebufferScale = 0.32;
        state.foveation = 1.0;
        applyQuality();
        statusCb(`FPS ${state.fps} / worst ${state.worstFrameMs}ms • Quest ultra-safe`);
      } else {
        statusCb(`FPS ${state.fps} • worst ${state.worstFrameMs}ms • ${state.quality}`);
      }
      acc = 0;
      samples = 0;
      worst = 0;
      lastReport = now;
      window.SVR_VIEW_PERFORMANCE_MANAGER = state;
    }
  }

  function forceLow(){
    state.quality = "quest-ultra-safe";
    state.targetPixelRatio = 0.32;
    state.targetFramebufferScale = 0.32;
    state.foveation = 1.0;
    applyQuality();
  }

  applyQuality();
  return { phase: PHASE, state, update, applyQuality, forceLow };
}
