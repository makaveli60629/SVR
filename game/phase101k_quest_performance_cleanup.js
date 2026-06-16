import "./phase101l_quest_live_qa_smoke_test.js?v=phase101l-quest-live-qa-smoke-test";

const LABEL = "PHASE-101K-QUEST-PERFORMANCE-CLEANUP-LOCK";

window.SVR_PHASE101K_PERFORMANCE = {
  build: LABEL,
  active: true,
  purpose: "Quest/WebXR frame stability pass without redesigning the lobby.",
  siteTouched: false,
  qaSmokeTest: true,
  checkedAt: new Date().toISOString()
};

function uaFlags(){
  const ua = navigator.userAgent || "";
  return {
    quest: /Quest|Oculus/i.test(ua),
    android: /Android/i.test(ua),
    mobile: /Mobile/i.test(ua),
    xr: !!window.__SVR_RENDERER__?.xr?.isPresenting
  };
}

function isQuestLike(){
  const f = uaFlags();
  return f.quest || f.xr;
}

function reduceRendererPressure(){
  const renderer = window.__SVR_RENDERER__;
  if(!renderer || !isQuestLike()) return false;
  try{
    renderer.setPixelRatio(0.62);
    renderer.shadowMap.enabled = false;
    renderer.sortObjects = false;
    renderer.toneMappingExposure = 0.84;
    if(renderer.xr && typeof renderer.xr.setFramebufferScaleFactor === "function") renderer.xr.setFramebufferScaleFactor(0.68);
    if(renderer.xr && typeof renderer.xr.setFoveation === "function") renderer.xr.setFoveation(1.0);
    window.SVR_PHASE101K_PERFORMANCE.renderer = {
      pixelRatio: 0.62,
      framebufferScale: 0.68,
      foveation: 1.0,
      shadows: false,
      toneMappingExposure: 0.84
    };
    return true;
  }catch(err){
    window.SVR_PHASE101K_PERFORMANCE.rendererError = String(err?.message || err);
    return false;
  }
}

function tuneMaterial(obj){
  const mats = obj?.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
  for(const mat of mats){
    if(!mat) continue;
    mat.precision = "mediump";
    if(mat.map){
      mat.map.anisotropy = 1;
      mat.map.generateMipmaps = true;
    }
    if(mat.emissiveMap) mat.emissiveMap.anisotropy = 1;
    if(mat.normalMap) mat.normalScale?.set?.(0.55, 0.55);
    if(mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.58);
    if(mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.48);
  }
}

function shouldHideOnQuest(name){
  if(!name) return false;
  return /DEBUG|HELPER|JOINT|PARTIAL_RUNTIME|FLOOR_MARKER/i.test(name)
    || /PHASE101I_SIDE_PANEL_VISUAL_SOFTENER/i.test(name)
    || /STAR_FIELD/i.test(name)
    || /SPRITE|PARTICLE_DUST|DUST|SPARK/i.test(name);
}

function reduceScenePressure(){
  const scene = window.__SVR_SCENE__;
  if(!scene || !isQuestLike()) return false;
  let meshes = 0, hidden = 0, lights = 0, materials = 0;
  scene.traverse((obj) => {
    const name = String(obj?.name || "");
    if(obj.isMesh || obj.isPoints || obj.isLine){
      meshes++;
      obj.frustumCulled = true;
      obj.castShadow = false;
      obj.receiveShadow = false;
      if(shouldHideOnQuest(name)){
        obj.visible = false;
        hidden++;
      }
      if(obj.material){
        const count = Array.isArray(obj.material) ? obj.material.length : 1;
        materials += count;
        tuneMaterial(obj);
      }
    }
    if(obj.isLight){
      lights++;
      obj.castShadow = false;
      if(obj.intensity > 1.0) obj.intensity *= 0.68;
      if(obj.distance && obj.distance > 30) obj.distance = 30;
    }
  });
  window.SVR_PHASE101K_PERFORMANCE.scene = { meshes, hidden, lights, materials, checkedAt: new Date().toISOString() };
  return true;
}

function countFrame(dt){
  const perf = window.SVR_PHASE101K_PERFORMANCE;
  if(!perf.frames) perf.frames = { count: 0, slow: 0, worstMs: 0, avgMs: 0 };
  const ms = Math.min(250, Math.max(0, dt * 1000));
  perf.frames.count++;
  perf.frames.worstMs = Math.max(perf.frames.worstMs || 0, Number(ms.toFixed(1)));
  perf.frames.avgMs = Number((((perf.frames.avgMs || ms) * 0.94) + ms * 0.06).toFixed(1));
  if(ms > 42) perf.frames.slow++;
  perf.checkedAt = new Date().toISOString();
}

function installFrameProbe(){
  if(window.__SVR_PHASE101K_FRAME_PROBE__) return;
  window.__SVR_PHASE101K_FRAME_PROBE__ = true;
  let last = performance.now();
  function tick(){
    const now = performance.now();
    countFrame((now - last) / 1000);
    last = now;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function run(){
  reduceRendererPressure();
  reduceScenePressure();
  installFrameProbe();
  window.SVR_PHASE101K_PERFORMANCE.flags = uaFlags();
  window.SVR_PHASE101K_PERFORMANCE.checkedAt = new Date().toISOString();
}

run();
setTimeout(run, 600);
setTimeout(run, 1600);
setTimeout(run, 3600);
setTimeout(run, 7000);
window.addEventListener("resize", () => setTimeout(run, 250));
