const LABEL = "PHASE-101H-SCENE-GEOMETRY-CLEANUP-LOCK";

const REMOVE_ROOTS = [
  "PHASE257_ROMAN_CANOPY_ROOT",
  "PHASE258_ROMAN_CANOPY_SMOOTH_ROOT",
  "PHASE259_ROMAN_CANOPY_COLONNADE_POLISH_ROOT"
];

const REMOVE_EXACT = [
  "PHASE257_CANOPY_SIGN",
  "PHASE258_CANOPY_SIGN",
  "PHASE200_LEFT_JUMBOTRON_SLOT",
  "PHASE200_LEFT_JUMBOTRON_SLOT_FRAME",
  "PHASE200_RIGHT_JUMBOTRON_SLOT",
  "PHASE200_RIGHT_JUMBOTRON_SLOT_FRAME"
];

const REMOVE_PATTERNS = [
  /^PHASE257_/,
  /^PHASE258_/,
  /^PHASE259_.*CANOPY/i,
  /^PHASE259_.*ROMAN/i,
  /^PHASE259_.*COLONNADE/i,
  /^PHASE200_.*JUMBOTRON_SLOT/i
];

window.SVR_PHASE101H_SCENE_CLEANUP = {
  build: LABEL,
  active: true,
  purpose: "Remove stale canopy overlays, mirrored signs, and blocky black side panels while keeping Phase 260 active.",
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function disposeObject(obj){
  if(!obj) return;
  obj.traverse?.((child) => {
    child.geometry?.dispose?.();
    if(Array.isArray(child.material)){
      child.material.forEach((m) => {
        m?.map?.dispose?.();
        m?.dispose?.();
      });
    }else{
      child.material?.map?.dispose?.();
      child.material?.dispose?.();
    }
  });
}

function removeObject(scene, obj){
  if(!scene || !obj) return false;
  obj.parent?.remove(obj);
  disposeObject(obj);
  return true;
}

function shouldRemoveByName(name){
  if(!name) return false;
  if(REMOVE_EXACT.includes(name)) return true;
  return REMOVE_PATTERNS.some((pattern) => pattern.test(name));
}

function cleanupScene(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;

  let removed = 0;

  for(const rootName of REMOVE_ROOTS){
    const root = scene.getObjectByName(rootName);
    if(root && removeObject(scene, root)) removed++;
  }

  const stale = [];
  scene.traverse((obj) => {
    if(obj && obj !== scene && shouldRemoveByName(String(obj.name || ""))){
      stale.push(obj);
    }
  });

  for(const obj of stale){
    if(obj.parent && removeObject(scene, obj)) removed++;
  }

  window.SVR_PHASE101H_SCENE_CLEANUP.removedTotal = (window.SVR_PHASE101H_SCENE_CLEANUP.removedTotal || 0) + removed;
  window.SVR_PHASE101H_SCENE_CLEANUP.lastRemoved = removed;
  window.SVR_PHASE101H_SCENE_CLEANUP.phase260Preserved = !!scene.getObjectByName("PHASE260_ROMAN_CANOPY_ARCHWAY_FINAL_ROOT");
  window.SVR_PHASE101H_SCENE_CLEANUP.checkedAt = new Date().toISOString();
  return removed > 0;
}

function protectPhase260(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return;
  const root = scene.getObjectByName("PHASE260_ROMAN_CANOPY_ARCHWAY_FINAL_ROOT");
  if(root){
    root.visible = true;
    root.traverse((obj) => { obj.visible = true; });
  }
}

function runCleanup(){
  cleanupScene();
  protectPhase260();
}

runCleanup();
setTimeout(runCleanup, 500);
setTimeout(runCleanup, 1500);
setTimeout(runCleanup, 3200);
setTimeout(runCleanup, 6200);
setTimeout(runCleanup, 10400);
setTimeout(runCleanup, 14000);

const timer = setInterval(runCleanup, 700);
setTimeout(() => clearInterval(timer), 18000);
