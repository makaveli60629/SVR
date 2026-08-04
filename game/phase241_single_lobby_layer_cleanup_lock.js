import * as THREE from "three";

const BUILD = "PHASE-241-SINGLE-LOBBY-LAYER-CLEANUP-LOCK";
const DUPLICATE_ROOTS = [
  "PHASE238_ROMAN_CANOPY_LOBBY_ARCH_ROOT",
  "PHASE239_ROMAN_CANOPY_PILLAR_SMOOTHING_ROOT"
];

function waitForScene(){
  return new Promise((resolve)=>{
    let tries = 0;
    const tick = ()=>{
      if (window.__SVR_SCENE__) return resolve(window.__SVR_SCENE__);
      if (++tries > 360) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}
function disposeObject(obj){
  obj.traverse?.((node)=>{
    if (node.geometry) node.geometry.dispose?.();
    const mat = node.material;
    if (Array.isArray(mat)) mat.forEach(m=>m?.dispose?.());
    else mat?.dispose?.();
  });
}
function removeByName(scene, name){
  const found = [];
  scene.traverse((obj)=>{ if (obj.name === name) found.push(obj); });
  found.forEach((obj)=>{
    obj.parent?.remove(obj);
    disposeObject(obj);
  });
  return found.length;
}
function cleanupDuplicatePhaseLayers(scene){
  const removed = {};
  DUPLICATE_ROOTS.forEach((name)=>{ removed[name] = removeByName(scene, name); });

  const phase240Roots = [];
  scene.traverse((obj)=>{ if (obj.name === "PHASE240_GRAND_PALACE_REFERENCE_ROOT") phase240Roots.push(obj); });
  if (phase240Roots.length > 1){
    phase240Roots.slice(1).forEach((obj)=>{ obj.parent?.remove(obj); disposeObject(obj); });
    removed.PHASE240_DUPLICATE_ROOTS = phase240Roots.length - 1;
  } else {
    removed.PHASE240_DUPLICATE_ROOTS = 0;
  }
  return removed;
}
function updateUi(){
  const label = document.getElementById("svr-phase-label");
  if (label) label.textContent = "PHASE 241 ACTIVE • SINGLE LOBBY LAYER";
  const status = document.getElementById("status");
  if (status) status.textContent = "Phase 241 single lobby layer cleanup active";
  try { document.title = `SVR Poker • ${BUILD}`; } catch {}
}
async function install(){
  const scene = await waitForScene();
  if (!scene) return;
  const removed = cleanupDuplicatePhaseLayers(scene);
  updateUi();
  window.SVR_LOCKED_FINAL_BUILD = BUILD;
  window.SVR_PHASE241_SINGLE_LAYER_CLEANUP = {
    build: BUILD,
    active: true,
    siteTouched: false,
    duplicateRootsRemoved: removed,
    rule: "Only one active lobby architecture overlay may remain. Phase 238 and 239 canopy overlays are removed to stop double columns/canopies/tables.",
    checkedAt: new Date().toISOString()
  };
}
install();
