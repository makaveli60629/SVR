import * as THREE from "three";

const PHASE = "PHASE-142-TELEPORT-CRITICAL-QUEST-CONTROLLER-WATCH-MOON-MARS-LOCK";
const FIX_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI);

function patchWatch(){
  const scene = window.SVR_CORE_SCENE;
  if (!scene) return;
  const watch = scene.getObjectByName('SVR_PHASE138_WATCH_INPUT_BRIDGE');
  if (!watch) return;
  if (!watch.userData.phase142WatchFixed){
    watch.userData.phase142WatchFixed = true;
    watch.userData.phase142OriginalName = watch.name;
    watch.name = 'SVR_PHASE142_WATCH_ORIENTATION_FIXED';
  }
  // Rotate inner screen only so forearm placement remains locked.
  for (const child of watch.children || []){
    if (child?.isMesh && child.geometry?.type === 'PlaneGeometry'){
      child.rotation.z = Math.PI;
      child.userData.phase142ScreenFlip = true;
    }
  }
  window.SVR_PHASE142_WATCH_ORIENTATION = { phase: PHASE, applied:true, fix:'screen plane rotated 180 degrees; forearm anchor preserved' };
}

function loop(){
  patchWatch();
  requestAnimationFrame(loop);
}
loop();
