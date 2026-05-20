import * as THREE from "three";

// SVR Poker — Phase 116 Emergency Watch Flip Hardfix
// Game-side only. Applies a direct in-plane 180 degree correction after the
// regular wrist-watch pose is calculated, without changing lobby/site/backend.

const PHASE = "PHASE-116-EMERGENCY-TELEPORT-WATCH-HARDFIX-LOCK";
const ROLL_180 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
const TMP_CAM_POS = new THREE.Vector3();
const TMP_WATCH_POS = new THREE.Vector3();
const TMP_FACE = new THREE.Vector3();

const state = {
  phase: PHASE,
  enabled: true,
  applied: 0,
  lastFacingDot: 0,
  correction: "local-z-180",
  note: "Direct hardfix for upside-down wrist watch screen."
};

function cameraLooksUsable(camera, renderer){
  try {
    const activeCamera = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
    if (!activeCamera) return null;
    activeCamera.getWorldPosition(TMP_CAM_POS);
    return activeCamera;
  } catch (_) {
    return null;
  }
}

function faceTowardCameraIfNeeded(watchObject, camera, renderer){
  const activeCamera = cameraLooksUsable(camera, renderer);
  if (!activeCamera) return;

  watchObject.getWorldPosition(TMP_WATCH_POS);
  TMP_FACE.set(0, 0, 1).applyQuaternion(watchObject.quaternion).normalize();
  const toCam = TMP_CAM_POS.clone().sub(TMP_WATCH_POS).normalize();
  const dot = TMP_FACE.dot(toCam);
  state.lastFacingDot = dot;

  // If the screen normal is pointing away from the player, flip it around local Y.
  // This is guarded so it does not oscillate when the normal already faces the player.
  if (dot < -0.15) {
    const flipFace = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    watchObject.quaternion.multiply(flipFace);
  }
}

export function applyWatchHardfix(watchObject, camera, renderer){
  if (!state.enabled || !watchObject || !watchObject.visible) return;

  // Apply once per pose update. main.js calls this immediately after watch.update().
  // The regular watch pose is recomputed each frame, so this correction is safe to
  // reapply each frame and does not accumulate beyond the current frame pose.
  watchObject.quaternion.multiply(ROLL_180);
  faceTowardCameraIfNeeded(watchObject, camera, renderer);
  watchObject.updateMatrixWorld(true);
  state.applied++;
}

window.SVR_PHASE116_WATCH_HARDFIX = state;
window.SVR_WATCH_FLIP_FIX = { state, apply: applyWatchHardfix };
