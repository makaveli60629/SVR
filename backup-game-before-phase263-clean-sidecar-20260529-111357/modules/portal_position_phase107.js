import * as THREE from "three";

const PHASE123 = "PHASE-123-LOUNGE-PORTAL-POSITION-LOCK";

const TARGETS = Object.freeze({
  reikiRoom: { x: 13.62, y: 0.0, z: 1.40, tag: "PHASE106_REIKI_CURRENT" },
  scorpion: { x: 12.37, y: 0.0, z: 15.19, tag: "PHASE107_SCORPION_CURRENT" },

  // User screenshot current position: X -13.87 / Y 1.60 / Z 11.36.
  pgaDrive: { x: -14.85, y: 0.0, z: 11.36, tag: "PHASE121_PGA_DRIVE_USER_POSITION" },
  pgaChipPutt: { x: -12.89, y: 0.0, z: 11.36, tag: "PHASE121_PGA_CHIP_PUTT_USER_POSITION" },
  chipPutt: { x: -12.89, y: 0.0, z: 11.36, tag: "PHASE121_PGA_CHIP_PUTT_USER_POSITION" },

  // User screenshot current position for Store portal: X 9.44 / Y 1.60 / Z -15.05.
  storeRoom: { x: 9.44, y: 0.0, z: -15.05, tag: "PHASE122_STORE_USER_POSITION" },
  store: { x: 9.44, y: 0.0, z: -15.05, tag: "PHASE122_STORE_USER_POSITION" },

  // User screenshot current position for Lounge portal: X -20.74 / Y 1.60 / Z 5.00.
  // Portal is floor placed at Y 0.00 while preserving requested X/Z.
  smokerLounge: { x: -20.74, y: 0.0, z: 5.00, tag: "PHASE123_LOUNGE_USER_POSITION" },
  lounge: { x: -20.74, y: 0.0, z: 5.00, tag: "PHASE123_LOUNGE_USER_POSITION" }
});

let lastScene = null;

function faceCenter(group){
  group.rotation.y = Math.atan2(-group.position.x, -group.position.z);
}

function applyOne(obj){
  const key = obj?.userData?.portalKey;
  const target = TARGETS[key];
  if (!target) return false;
  obj.position.set(target.x, target.y, target.z);
  faceCenter(obj);
  obj.userData.phase123Placement = target.tag;
  obj.userData.phase123Locked = true;
  return true;
}

export function applyPortalPlacements(root){
  if (!root?.traverse) return false;
  let moved = false;
  root.traverse((obj)=>{ if (applyOne(obj)) moved = true; });
  return moved;
}

const originalSceneAdd = THREE.Scene.prototype.add;
if (!THREE.Scene.prototype.__svrPortalPhase107SceneAdd){
  THREE.Scene.prototype.__svrPortalPhase107SceneAdd = true;
  THREE.Scene.prototype.add = function(...objects){
    lastScene = this;
    const result = originalSceneAdd.apply(this, objects);
    applyPortalPlacements(this);
    return result;
  };
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrPortalPhase107Render){
  THREE.WebGLRenderer.prototype.__svrPortalPhase107Render = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    if (lastScene) applyPortalPlacements(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ if (lastScene) applyPortalPlacements(lastScene); }, 500);
console.log(PHASE123, TARGETS);
