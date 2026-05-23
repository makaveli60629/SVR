import * as THREE from "three";

const PHASE = "PHASE-142-TELEPORT-CRITICAL-QUEST-CONTROLLER-WATCH-MOON-MARS-LOCK";
const SKIN = new THREE.Color(0xc78a61);
const GLOVE = new THREE.Color(0x151a24);

function patchMaterial(mat, color){
  if (!mat) return;
  if ('color' in mat && mat.color) mat.color.copy(color);
  if ('roughness' in mat) mat.roughness = 0.82;
  if ('metalness' in mat) mat.metalness = 0.0;
  if ('emissive' in mat && mat.emissive) mat.emissive.setHex(0x000000);
  mat.needsUpdate = true;
}

function patchHands(){
  const scene = window.SVR_CORE_SCENE;
  if (!scene) return false;
  let touched = 0;
  scene.traverse((obj)=>{
    if (!obj?.isMesh) return;
    const n = String(obj.name || '').toLowerCase();
    const p = String(obj.parent?.name || '').toLowerCase();
    const isHand = n.includes('hand') || n.includes('wrist') || p.includes('hand') || p.includes('wrist');
    if (!isHand) return;
    const color = n.includes('joint') || n.includes('proxy') ? GLOVE : SKIN;
    if (Array.isArray(obj.material)) obj.material.forEach(m=>patchMaterial(m, color));
    else patchMaterial(obj.material, color);
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.visible = true;
    touched++;
  });
  window.SVR_PHASE142_HAND_TEXTURE_PATCH = { phase: PHASE, touched, style:'warm skin / dark glove fallback', controllerModelsVisible:false };
  return true;
}

function loop(){
  patchHands();
  setTimeout(loop, 1500);
}
loop();
