import * as THREE from "three";

const PHASE106 = "PHASE-106-REIKI-PORTAL-CURRENT-POSITION-FORCE";

// User-directed placement from latest Hub Position Table screenshot:
// Current position: X 13.62 / Y 1.60 / Z 1.40.
// Portal is floor placed at Y 0.00 while preserving the requested X/Z.
// Locked fist teleport is intentionally not touched here.
export const REIKI_PORTAL_TARGET = Object.freeze({
  x: 13.62,
  y: 0.0,
  z: 1.40,
  label: "LATEST_USER_CURRENT_POSITION"
});

let lastScene = null;

function faceCenter(group){
  group.rotation.y = Math.atan2(-group.position.x, -group.position.z);
}

function placePortalObject(obj){
  obj.position.set(REIKI_PORTAL_TARGET.x, REIKI_PORTAL_TARGET.y, REIKI_PORTAL_TARGET.z);
  faceCenter(obj);
  obj.userData.phase106Placement = REIKI_PORTAL_TARGET.label;
  obj.userData.phase106Locked = true;
  return true;
}

export function applyReikiPortalCurrentPosition(root){
  if (!root?.traverse) return false;
  let moved = false;
  root.traverse((obj)=>{
    if (obj?.name === "PORTAL_reikiRoom" || obj?.userData?.portalKey === "reikiRoom"){
      placePortalObject(obj);
      moved = true;
    }
  });
  return moved;
}

const originalSceneAdd = THREE.Scene.prototype.add;
if (!THREE.Scene.prototype.__svrReikiPortalPhase106SceneAdd){
  THREE.Scene.prototype.__svrReikiPortalPhase106SceneAdd = true;
  THREE.Scene.prototype.add = function(...objects){
    lastScene = this;
    const result = originalSceneAdd.apply(this, objects);
    applyReikiPortalCurrentPosition(this);
    return result;
  };
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrReikiPortalPhase106Render){
  THREE.WebGLRenderer.prototype.__svrReikiPortalPhase106Render = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    if (lastScene) applyReikiPortalCurrentPosition(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{
  if (lastScene) applyReikiPortalCurrentPosition(lastScene);
}, 500);

console.log(`[${PHASE106}] Reiki Room portal forced to latest current position`, REIKI_PORTAL_TARGET);
