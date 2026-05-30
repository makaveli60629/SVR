import * as THREE from "three";

const PHASE161 = "PHASE-161-PERFORMANCE-GRAPHICS-GUARD";
let lastScene = null;
let optimized = false;
let lastSweep = 0;

function isQuestLike(){
  return /Quest|OculusBrowser|MetaQuest|VR/i.test(navigator.userAgent || "");
}

function optimizeRenderer(renderer){
  if(!renderer || renderer.__svrPhase161Perf) return;
  renderer.__svrPhase161Perf = true;
  try{
    const cap = isQuestLike() ? 1.05 : 1.35;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    renderer.shadowMap.enabled = false;
    renderer.info.autoReset = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    console.log(`[${PHASE161}] renderer pixel ratio capped`, cap);
  }catch(err){ console.warn(`[${PHASE161}] renderer optimize skipped`, err?.message || err); }
}

function optimizeMaterial(mat){
  if(!mat || mat.__svrPhase161Opt) return;
  mat.__svrPhase161Opt = true;
  mat.needsUpdate = true;
  if(Number.isFinite(mat.roughness)) mat.roughness = Math.max(mat.roughness, .45);
  if(Number.isFinite(mat.metalness)) mat.metalness = Math.min(mat.metalness, .25);
  if(mat.transparent && mat.opacity < .055) mat.opacity = .055;
  if(mat.emissiveIntensity && mat.emissiveIntensity > .75) mat.emissiveIntensity = .75;
}

function optimizeObject(obj){
  if(!obj) return;
  if(obj.isLight){
    obj.castShadow = false;
    if(obj.intensity > 1.65) obj.intensity *= .58;
    if(obj.distance && obj.distance > 95) obj.distance = 95;
  }
  if(obj.isMesh){
    obj.castShadow = false;
    obj.receiveShadow = false;
    const n = String(obj.name || "").toLowerCase();
    obj.frustumCulled = !(/floor|wall|table|portal|sign|hub|planet|moon|mars|watch|hand/.test(n));
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach(optimizeMaterial);
  }
}

function optimizeScene(scene){
  if(!scene) return;
  const now = performance.now();
  if(optimized && now - lastSweep < 4800) return;
  optimized = true;
  lastSweep = now;
  let count = 0;
  scene.traverse((obj)=>{ optimizeObject(obj); count++; });
  if(isQuestLike()){
    const overlay = document.getElementById("svr-hub-position-table");
    if(overlay) overlay.style.display = "none";
  }
  console.log(`[${PHASE161}] optimized objects: ${count}`);
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrQuestPerf161){
  THREE.WebGLRenderer.prototype.__svrQuestPerf161 = true;
  THREE.WebGLRenderer.prototype.render = function(scene,camera){
    lastScene = scene || lastScene;
    optimizeRenderer(this);
    optimizeScene(lastScene);
    return originalRender.call(this,scene,camera);
  };
}

setInterval(()=>{ optimizeScene(lastScene); },5000);
console.log(`[${PHASE161}] loaded`);
