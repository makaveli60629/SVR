const LABEL = "PHASE-101-RENDER-MARKER-CLEANUP";
const MARKERS = [
  "PHASE101_PARTIAL_RUNTIME_MARKER",
  "PHASE101_PARTIAL_RUNTIME_FLOOR_MARKER",
  "PHASE101_PARTIAL_RUNTIME_HEMI_LIGHT"
];

window.SVR_PHASE101_RENDER_MARKER_CLEANUP = {
  build: LABEL,
  active: true,
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function removeMarkerObjects(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  let removed = 0;
  for(const name of MARKERS){
    const obj = scene.getObjectByName(name);
    if(obj){
      obj.parent?.remove(obj);
      removed++;
    }
  }
  if(removed){
    window.SVR_PHASE101_RENDER_MARKER_CLEANUP.removed = removed;
    window.SVR_PHASE101_RENDER_MARKER_CLEANUP.checkedAt = new Date().toISOString();
  }
  return removed > 0;
}

const timer = setInterval(() => {
  if(window.__SVR_GAME_READY__){
    removeMarkerObjects();
    clearInterval(timer);
  }
}, 300);

setTimeout(removeMarkerObjects, 9000);
