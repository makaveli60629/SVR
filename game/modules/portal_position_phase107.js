import * as THREE from "three";

const TARGETS = Object.freeze({
  reikiRoom: { x: 13.62, y: 0.0, z: 1.40, tag: "PHASE106_REIKI_CURRENT" },
  scorpion: { x: 12.37, y: 0.0, z: 15.19, tag: "PHASE107_SCORPION_CURRENT" }
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
  obj.userData.phase107Placement = target.tag;
  obj.userData.phase107Locked = true;
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
console.log("PHASE-107 portal placement lock", TARGETS);
