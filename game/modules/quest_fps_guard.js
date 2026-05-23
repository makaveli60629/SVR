import * as THREE from "three";

const PHASE = "PHASE-141-QUEST-FPS-EMERGENCY-STABILITY-LOCK";

function $(id){ return document.getElementById(id); }

const state = {
  phase: PHASE,
  fps: 0,
  avgMs: 0,
  worstMs: 0,
  freezeCount: 0,
  quality: "quest-emergency-watch",
  textureFloorDisabled: false,
  handMeshesHidden: false,
  ceilingTrimReduced: false,
  startedAt: new Date().toISOString()
};

let last = performance.now();
let acc = 0;
let samples = 0;
let worst = 0;
let lastReport = performance.now();
let appliedUltra = false;
let appliedPanic = false;
let panel = null;

function ensurePanel(){
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = 'svrQuestFpsGuard';
  panel.style.cssText = 'position:fixed;left:12px;top:54px;z-index:70;padding:7px 10px;border:1px solid rgba(127,245,199,.42);border-radius:999px;background:rgba(0,0,0,.68);color:#7ff5c7;font:900 11px/1.1 system-ui;pointer-events:none;';
  panel.textContent = 'FPS guard loading';
  document.body.appendChild(panel);
  return panel;
}

function updatePanel(){
  const p = ensurePanel();
  p.textContent = `FPS ${state.fps} • worst ${state.worstMs}ms • ${state.quality}`;
}

function setRendererScale(scale){
  const renderer = window.SVR_CORE_RENDERER;
  try { renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, scale)); } catch {}
  try { renderer?.xr?.setFramebufferScaleFactor?.(scale); } catch {}
  try { renderer?.xr?.setFoveation?.(1.0); } catch {}
}

function setCameraFar(far = 120){
  const renderer = window.SVR_CORE_RENDERER;
  const camera = window.SVR_CORE_CAMERA;
  try {
    camera.near = 0.08;
    camera.far = far;
    camera.updateProjectionMatrix?.();
    const xrCam = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : null;
    if (xrCam){
      xrCam.near = 0.08;
      xrCam.far = far;
      xrCam.updateProjectionMatrix?.();
      xrCam.children?.forEach?.((child)=>{
        if (child.isCamera){ child.near = 0.08; child.far = far; child.updateProjectionMatrix?.(); }
      });
    }
  } catch {}
}

function hideHandMeshes(){
  const scene = window.SVR_CORE_SCENE;
  if (!scene || state.handMeshesHidden) return;
  scene.traverse((obj)=>{
    if (!obj) return;
    const n = String(obj.name || '').toLowerCase();
    if (n.includes('hand') && obj.isMesh){ obj.visible = false; }
    if (n.includes('joint') && obj.isMesh){ obj.visible = false; }
  });
  state.handMeshesHidden = true;
}

function reduceSceneMaterials(){
  const scene = window.SVR_CORE_SCENE;
  if (!scene) return;
  scene.traverse((obj)=>{
    if (!obj) return;
    if (obj.isLight){ obj.intensity = Math.min(obj.intensity || 0, 0.45); obj.castShadow = false; }
    if (obj.isSprite){ obj.visible = false; }
    if (obj.isMesh){
      obj.castShadow = false;
      obj.receiveShadow = false;
      if (obj.material){
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m)=>{
          if (!m) return;
          if ('transparent' in m && m.opacity < 0.14) obj.visible = false;
          if ('metalness' in m) m.metalness = 0;
          if ('roughness' in m) m.roughness = 0.85;
          if ('envMapIntensity' in m) m.envMapIntensity = 0;
          m.needsUpdate = true;
        });
      }
    }
  });
}

function disableTextureFloor(){
  const root = window.SVR_WORLD_ROOT || window.SVR_CORE_SCENE;
  if (!root || state.textureFloorDisabled) return;
  const names = ['SVR_PHASE141_TEXTURE_FLOOR_OVERLAY','SVR_PHASE140_TEXTURE_FLOOR_OVERLAY'];
  for (const name of names){
    const obj = root.getObjectByName?.(name);
    if (obj){ obj.visible = false; }
  }
  state.textureFloorDisabled = true;
}

function ultraSafe(){
  if (appliedUltra) return;
  appliedUltra = true;
  state.quality = "quest-ultra-safe";
  setRendererScale(0.30);
  setCameraFar(95);
  hideHandMeshes();
  reduceSceneMaterials();
}

function panicSafe(){
  if (appliedPanic) return;
  appliedPanic = true;
  state.quality = "quest-panic-safe-floor-off";
  setRendererScale(0.26);
  setCameraFar(70);
  hideHandMeshes();
  disableTextureFloor();
  reduceSceneMaterials();
}

function tick(now){
  const dt = Math.min((now - last) / 1000, 1.0);
  last = now;
  const ms = dt * 1000;
  acc += dt;
  samples += 1;
  worst = Math.max(worst, ms);
  if (ms > 100) state.freezeCount += 1;
  if (now - lastReport > 1000){
    const avg = samples ? acc / samples : 0.016;
    state.avgMs = +(avg * 1000).toFixed(1);
    state.worstMs = +worst.toFixed(1);
    state.fps = +(1 / Math.max(avg, 0.001)).toFixed(1);
    if (state.worstMs > 90 || state.avgMs > 22) ultraSafe();
    if (state.worstMs > 180 || state.freezeCount >= 3 || state.avgMs > 33) panicSafe();
    window.SVR_PHASE141_FPS_GUARD = state;
    updatePanel();
    acc = 0; samples = 0; worst = 0; lastReport = now;
  }
  requestAnimationFrame(tick);
}

setRendererScale(0.30);
setCameraFar(120);
ensurePanel();
window.SVR_PHASE141_FPS_GUARD = state;
requestAnimationFrame(tick);
