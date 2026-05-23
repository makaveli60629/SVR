const PHASE = "PHASE-145-GRAPHICS-CONTRAST-NO-MUSIC-TELEPORT-ALIGNMENT-LOCK";

const state = {
  phase: PHASE,
  fps: 0,
  avgMs: 0,
  worstMs: 0,
  freezeCount: 0,
  quality: "clarity-monitor",
  textureFloorDisabled: false,
  startedAt: new Date().toISOString()
};

let last = performance.now();
let acc = 0;
let samples = 0;
let worst = 0;
let lastReport = performance.now();
let panel = null;

function ensurePanel(){
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = 'svrQuestFpsGuard';
  panel.style.cssText = 'position:fixed;left:12px;top:54px;z-index:70;padding:7px 10px;border:1px solid rgba(246,226,127,.70);border-radius:999px;background:rgba(0,0,0,.78);color:#f6e27f;font:900 12px/1.1 system-ui;pointer-events:none;';
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
  try { renderer?.xr?.setFoveation?.(0.45); } catch {}
}

function setCameraFar(far = 220){
  const renderer = window.SVR_CORE_RENDERER;
  const camera = window.SVR_CORE_CAMERA;
  try {
    camera.near = 0.06;
    camera.far = far;
    camera.updateProjectionMatrix?.();
    const xrCam = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : null;
    if (xrCam){
      xrCam.near = 0.06;
      xrCam.far = far;
      xrCam.updateProjectionMatrix?.();
      xrCam.children?.forEach?.((child)=>{
        if (child.isCamera){ child.near = 0.06; child.far = far; child.updateProjectionMatrix?.(); }
      });
    }
  } catch {}
}

function applyClarityBaseline(){
  setRendererScale(0.58);
  setCameraFar(220);
  window.SVR_PHASE145_FPS_GUARD = state;
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
    if (state.worstMs > 140 || state.freezeCount >= 3){
      state.quality = "freeze-detected-keep-visuals";
      setRendererScale(0.50);
      setCameraFar(180);
    }
    window.SVR_PHASE145_FPS_GUARD = state;
    updatePanel();
    acc = 0; samples = 0; worst = 0; lastReport = now;
  }
  requestAnimationFrame(tick);
}

applyClarityBaseline();
ensurePanel();
requestAnimationFrame(tick);
