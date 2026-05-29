import * as THREE from "three";

const PHASE103 = "PHASE-103-REIKI-PORTAL-ENTER-MARKER-LOCK";

// User-directed placement: Reiki Room portal belongs on the ENTER REIKI hub marker.
// Fist teleport is locked and intentionally not touched by this module.
export const REIKI_PORTAL_ENTER_MARKER = Object.freeze({
  x: -7.25,
  y: 0.0,
  z: -2.55,
  label: "ENTER_REIKI_HUB_MARKER"
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
    obj.position.set(REIKI_PORTAL_ENTER_MARKER.x, REIKI_PORTAL_ENTER_MARKER.y, REIKI_PORTAL_ENTER_MARKER.z);
    faceCenter(obj);
    obj.userData.phase103Placement = REIKI_PORTAL_ENTER_MARKER.label;
    obj.userData.phase103Locked = true;
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

console.log(`[${PHASE103}] Reiki Room portal locked to ENTER REIKI marker`, REIKI_PORTAL_ENTER_MARKER);
