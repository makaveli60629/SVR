import * as THREE from "three";

const PHASE104 = "PHASE-104-REIKI-PORTAL-OLD-SPOT-LOCK";

// User correction from screenshots:
// Move the actual red/black REIKI ROOM private portal from the hologram area
// back onto the old ENTER REIKI floor-marker spot shown in picture 2.
// Fist teleport is locked and intentionally not touched by this module.
export const REIKI_PORTAL_OLD_ENTER_SPOT = Object.freeze({
  x: -6.20,
  y: 0.0,
  z: -4.80,
  label: "OLD_ENTER_REIKI_FLOOR_MARKER"
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
    obj.position.set(REIKI_PORTAL_OLD_ENTER_SPOT.x, REIKI_PORTAL_OLD_ENTER_SPOT.y, REIKI_PORTAL_OLD_ENTER_SPOT.z);
    faceCenter(obj);
    obj.userData.phase104Placement = REIKI_PORTAL_OLD_ENTER_SPOT.label;
    obj.userData.phase104Locked = true;
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

console.log(`[${PHASE104}] Reiki Room portal locked to old ENTER REIKI floor marker`, REIKI_PORTAL_OLD_ENTER_SPOT);
