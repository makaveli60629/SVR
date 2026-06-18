import * as THREE from "three";

const LABEL = "PHASE-89-QUEST-PERFORMANCE-STABILITY-LOCK";
const SAMPLE_MS = 1000;
const LIGHT_CAP = 18;
const DRAW_OBJECT_SOFT_CAP = 900;
let installed = false;
let lastSample = performance.now();
let frames = 0;
let fps = 72;
let lastOptimizeAt = 0;

function matList(obj){
  if (!obj?.material) return [];
  return Array.isArray(obj.material) ? obj.material : [obj.material];
}

function lightweightMaterialPass(scene){
  let adjusted = 0;
  scene.traverse((obj)=>{
    if (!obj?.material) return;
    const n = String(obj.name || "").toUpperCase();
    matList(obj).forEach((m)=>{
      if (!m) return;
      if (/PORTAL|PANEL|SCREEN|BOARD|LABEL|WATCH|CARD|CHIP|JUMBOTRON/.test(n)){
        m.depthWrite = false;
        m.needsUpdate = true;
        adjusted++;
      }
      if (m.map){
        m.map.anisotropy = Math.min(m.map.anisotropy || 1, 2);
        m.map.needsUpdate = true;
      }
    });
  });
  return adjusted;
}

function freezeStaticMeshes(scene){
  let frozen = 0;
  scene.traverse((obj)=>{
    if (!obj?.isMesh || obj.userData?.phase89Dynamic) return;
    const n = String(obj.name || "").toUpperCase();
    if (/HAND|WATCH|CARD|CHIP|PORTAL|PLAYER|BOT|MOON|MARS|SPRITE|ARC|TARGET|RING|ACTION|HUD/.test(n)) return;
    obj.matrixAutoUpdate = false;
    obj.updateMatrix?.();
    frozen++;
  });
  return frozen;
}

function limitLights(scene){
  const lights=[];
  scene.traverse((obj)=>{ if (obj?.isLight) lights.push(obj); });
  let disabled = 0;
  lights.forEach((l,i)=>{
    if (i >= LIGHT_CAP && !/MOON|MARS|SUN|AMBIENT|HEMI/i.test(l.name || "")){
      if (l.visible !== false) disabled++;
      l.visible = false;
      l.userData.phase89DisabledExtraLight = true;
    }
    if (l.shadow) l.castShadow = false;
  });
  return { total: lights.length, disabled };
}

function capDuplicateRuntimeRoots(scene){
  const seen = new Map();
  let hidden = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "");
    if (!/^PHASE(85|86|88|84|297|295|296)_/.test(n)) return;
    const key = n.replace(/_\d+$/,"");
    if (!seen.has(key)) { seen.set(key,obj); return; }
    if (obj.visible !== false){ hidden++; obj.visible = false; obj.userData.phase89HiddenDuplicateRuntimeRoot = true; }
  });
  return hidden;
}

function countScene(scene){
  let objects = 0, visible = 0, meshes = 0, triangles = 0;
  scene.traverse((obj)=>{
    objects++;
    if (obj.visible !== false) visible++;
    if (obj.isMesh){
      meshes++;
      const g = obj.geometry;
      if (g?.index) triangles += Math.floor(g.index.count / 3);
      else if (g?.attributes?.position) triangles += Math.floor(g.attributes.position.count / 3);
    }
  });
  return { objects, visible, meshes, triangles };
}

function rendererPass(renderer){
  if (!renderer) return {};
  renderer.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, renderer.xr?.isPresenting ? 1.25 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  return { shadowMap:false, pixelRatio: renderer.getPixelRatio?.() || null };
}

function optimize(reason="scheduled"){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if (!scene || !renderer) return false;
  const now = performance.now();
  if (now - lastOptimizeAt < 900 && reason !== "initial") return true;
  lastOptimizeAt = now;
  const sceneStats = countScene(scene);
  const materialAdjusted = lightweightMaterialPass(scene);
  const frozen = freezeStaticMeshes(scene);
  const lights = limitLights(scene);
  const duplicatesHidden = capDuplicateRuntimeRoots(scene);
  const rendererStats = rendererPass(renderer);
  window.SVR_PHASE89_QUEST_PERFORMANCE_STABILITY_LOCK = {
    build: LABEL,
    active: true,
    reason,
    fps: Math.round(fps),
    sceneStats,
    materialAdjusted,
    frozenStaticMeshes: frozen,
    lights,
    duplicatesHidden,
    rendererStats,
    drawObjectSoftCap: DRAW_OBJECT_SOFT_CAP,
    siteTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    locomotionTouched:false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}

function frameSample(){
  frames++;
  const now = performance.now();
  if (now - lastSample >= SAMPLE_MS){
    fps = (frames * 1000) / Math.max(now - lastSample, 1);
    frames = 0;
    lastSample = now;
    if (fps < 58 || (window.SVR_PHASE89_QUEST_PERFORMANCE_STABILITY_LOCK?.sceneStats?.visible || 0) > DRAW_OBJECT_SOFT_CAP) optimize("adaptive-fps-or-scene-cap");
  }
  requestAnimationFrame(frameSample);
}

function install(){
  if (installed) return optimize("repeat");
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if (!scene || !renderer) return false;
  installed = true;
  optimize("initial");
  requestAnimationFrame(frameSample);
  window.addEventListener("webglcontextlost",()=>{ window.SVR_PHASE89_WEBGL_LOST = { build:LABEL, at:new Date().toISOString() }; });
  window.addEventListener("webglcontextrestored",()=>{ setTimeout(()=>optimize("webgl-restored"),250); });
  return true;
}

install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if (install() || tries > 180) clearInterval(timer); },250);
[800,1800,3600,7200,12000,20000].forEach((delay)=>setTimeout(()=>optimize(`late-${delay}`),delay));
