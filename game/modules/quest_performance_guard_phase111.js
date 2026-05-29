import * as THREE from "three";

const PHASE111 = "PHASE-111-QUEST-PERFORMANCE-GUARD";
let lastScene = null;
let optimized = false;

function isQuestLike(){
  return /Quest|OculusBrowser|MetaQuest|VR/i.test(navigator.userAgent || "");
}

function optimizeObject(obj){
  if (!obj) return;
  if (obj.isLight){
    obj.castShadow = false;
    if (obj.intensity > 1.6) obj.intensity *= 0.62;
    if (obj.distance && obj.distance > 90) obj.distance = 90;
  }
  if (obj.isMesh){
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.frustumCulled = true;
    const n = String(obj.name || "").toLowerCase();
    if (/floor|wall|table|portal|sign|hub/.test(n)) obj.frustumCulled = false;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat)=>{
      if (!mat) return;
      mat.needsUpdate = true;
      if (mat.transparent && mat.opacity < 0.08) obj.visible = false;
    });
  }
}

function optimizeScene(scene){
  if (!scene || optimized) return;
  optimized = true;
  let count = 0;
  scene.traverse((obj)=>{ optimizeObject(obj); count++; });
  if (isQuestLike()){
    const overlay = document.getElementById("svr-hub-position-table");
    if (overlay) overlay.style.display = "none";
  }
  console.log(`[${PHASE111}] optimized objects: ${count}`);
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrQuestPerf111){
  THREE.WebGLRenderer.prototype.__svrQuestPerf111 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    optimizeScene(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ optimizeScene(lastScene); }, 5000);
