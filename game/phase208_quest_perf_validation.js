const LABEL = "UPDATE-3.0-PHASE-208-QUEST-PERFORMANCE-VALIDATION-LOCK";

let installed = false;
let frameCount = 0;
let sampleStart = performance.now();
let lastFrame = performance.now();
let minFps = Infinity;
let avgFps = 0;
let worstDeltaMs = 0;
let stableSeconds = 0;
let longFrames = 0;
let stopped = false;

function lockLabel(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE208 = window.SVR_PHASE208 || {};
  Object.assign(window.SVR_PHASE208, {
    build: LABEL,
    active: true,
    questPerformanceValidation: true,
    siteTouched: false,
    noSceneTraversalLoop: true,
    maxValidationSeconds: 90,
    checkedAt: new Date().toISOString()
  });
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function setStatus(text){
  const renderer = window.__SVR_RENDERER__;
  if (renderer?.xr?.isPresenting) return;
  const el = document.getElementById("status");
  if (el) el.textContent = text;
}

function applySafeRendererSettings(){
  const renderer = window.__SVR_RENDERER__;
  if (!renderer || window.SVR_PHASE208_RENDERER_LOCKED) return;
  window.SVR_PHASE208_RENDERER_LOCKED = true;
  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.85));
    renderer.shadowMap.enabled = false;
    renderer.xr?.setFramebufferScaleFactor?.(0.82);
  } catch (err) {
    window.SVR_PHASE208_RENDERER_ERROR = String(err?.message || err);
  }
}

function snapshot(){
  const renderer = window.__SVR_RENDERER__;
  const info = renderer?.info || null;
  window.SVR_PHASE208_STATS = {
    label: LABEL,
    active: true,
    avgFps: Math.round(avgFps),
    minFps: Number.isFinite(minFps) ? Math.round(minFps) : 0,
    worstDeltaMs: Math.round(worstDeltaMs),
    longFrames,
    stableSeconds,
    xrPresenting: !!renderer?.xr?.isPresenting,
    renderCalls: info?.render?.calls ?? null,
    triangles: info?.render?.triangles ?? null,
    geometries: info?.memory?.geometries ?? null,
    textures: info?.memory?.textures ?? null,
    stopped,
    checkedAt: new Date().toISOString()
  };
  return window.SVR_PHASE208_STATS;
}

function tick(now){
  if (stopped) return;
  frameCount++;
  const delta = now - lastFrame;
  lastFrame = now;
  if (delta > worstDeltaMs) worstDeltaMs = delta;
  if (delta > 55) longFrames++;
  const elapsed = Math.max(1, now - sampleStart);
  if (elapsed >= 1000){
    const fps = frameCount * 1000 / elapsed;
    avgFps = avgFps ? (avgFps * 0.72 + fps * 0.28) : fps;
    minFps = Math.min(minFps, fps);
    stableSeconds++;
    frameCount = 0;
    sampleStart = now;
    const stats = snapshot();
    if (!stats.xrPresenting && stableSeconds % 5 === 0){
      setStatus(`Quest validation: ${stats.avgFps}fps avg / ${stats.longFrames} long frames`);
    }
    if (stableSeconds >= 90){
      stopped = true;
      window.SVR_PHASE208.complete = true;
      snapshot();
      return;
    }
  }
  requestAnimationFrame(tick);
}

function install(){
  if (installed) return;
  installed = true;
  lockLabel();
  applySafeRendererSettings();
  const renderer = window.__SVR_RENDERER__;
  if (renderer?.xr && !window.SVR_PHASE208_XR_LISTENERS){
    window.SVR_PHASE208_XR_LISTENERS = true;
    renderer.xr.addEventListener("sessionstart", ()=>{
      document.body.classList.add("xr-active");
      applySafeRendererSettings();
      window.SVR_PHASE208.sessionStartedAt = new Date().toISOString();
      snapshot();
    });
    renderer.xr.addEventListener("sessionend", ()=>{
      window.SVR_PHASE208.sessionEndedAt = new Date().toISOString();
      snapshot();
    });
  }
  requestAnimationFrame(tick);
}

function waitForRuntime(){
  lockLabel();
  if (window.__SVR_RENDERER__ && window.__SVR_SCENE__){
    install();
    return;
  }
  setTimeout(waitForRuntime, 250);
}

waitForRuntime();
