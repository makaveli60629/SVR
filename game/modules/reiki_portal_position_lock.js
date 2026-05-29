import * as THREE from "three";

const PHASE105 = "PHASE-105-REIKI-PORTAL-CURRENT-POSITION-LOCK";

// User-directed placement from Hub Position Table screenshot:
// Current position: X 19.55 / Y 1.60 / Z -0.13.
// Portal is floor-placed at Y 0.00 while preserving X/Z from the current position.
// Fist teleport is locked and intentionally not touched by this module.
export const REIKI_PORTAL_CURRENT_POSITION = Object.freeze({
  x: 19.55,
  y: 0.0,
  z: -0.13,
  label: "USER_CURRENT_POSITION_FROM_HUB_TABLE"
});

let lastScene = null;

function faceCenter(group){
  group.rotation.y = Math.atan2(-group.position.x, -group.position.z);
}

export function applyReikiPortalPlacement(root){
  if (!root?.traverse) return false;
  let moved = false;
  root.traverse((obj)=>{
    if (!(obj?.name === "PORTAL_reikiRoom" || obj?.userData?.portalKey === "reikiRoom")) return;
    obj.position.set(REIKI_PORTAL_CURRENT_POSITION.x, REIKI_PORTAL_CURRENT_POSITION.y, REIKI_PORTAL_CURRENT_POSITION.z);
    faceCenter(obj);
    obj.userData.phase105Placement = REIKI_PORTAL_CURRENT_POSITION.label;
    obj.userData.phase105Locked = true;
    moved = true;
  });
  return moved;
}

const originalSceneAdd = THREE.Scene.prototype.add;
if (!THREE.Scene.prototype.__svrReikiPortalPlacementLock){
  THREE.Scene.prototype.__svrReikiPortalPlacementLock = true;
  THREE.Scene.prototype.add = function(...objects){
    lastScene = this;
    const result = originalSceneAdd.apply(this, objects);
    applyReikiPortalPlacement(this);
    return result;
  };
}

setInterval(()=>{
  if (lastScene) applyReikiPortalPlacement(lastScene);
}, 1000);

console.log(`[${PHASE105}] Reiki Room portal locked to user current position`, REIKI_PORTAL_CURRENT_POSITION);
