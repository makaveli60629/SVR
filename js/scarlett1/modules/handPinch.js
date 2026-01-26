import * as THREE from 'three';

/**
 * Minimal hands-only pinch detector.
 * Emits a "pinch ray" from index-tip forward when thumb/index are close.
 * This is intentionally simple + safe: if WebXR hands aren't available, it does nothing.
 */
export function createHandPinchInput(renderer) {
  const state = {
    available: false,
    pinching: false,
    rayOrigin: new THREE.Vector3(),
    rayDir: new THREE.Vector3(0, 0, -1),
    _tmp: new THREE.Vector3(),
    _lastSession: null,
  };

  function updateFromFrame(frame) {
    const session = renderer.xr.getSession();
    if (!session || !frame) { state.available = false; state.pinching = false; return; }
    state.available = true;

    const refSpace = renderer.xr.getReferenceSpace();
    const sources = session.inputSources || [];
    let anyPinch = false;

    for (const src of sources) {
      if (!src.hand) continue;

      const thumbTip = src.hand.get('thumb-tip');
      const indexTip = src.hand.get('index-finger-tip');
      const wrist = src.hand.get('wrist');

      if (!thumbTip || !indexTip || !wrist) continue;

      const thumbPose = frame.getJointPose(thumbTip, refSpace);
      const indexPose = frame.getJointPose(indexTip, refSpace);
      const wristPose = frame.getJointPose(wrist, refSpace);
      if (!thumbPose || !indexPose || !wristPose) continue;

      const dx = thumbPose.transform.position.x - indexPose.transform.position.x;
      const dy = thumbPose.transform.position.y - indexPose.transform.position.y;
      const dz = thumbPose.transform.position.z - indexPose.transform.position.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      const isPinch = dist < 0.025; // ~2.5cm
      if (isPinch) {
        anyPinch = true;

        // Ray origin: index tip
        state.rayOrigin.set(
          indexPose.transform.position.x,
          indexPose.transform.position.y,
          indexPose.transform.position.z
        );

        // Ray dir: from wrist to index tip (forward-ish)
        state._tmp.set(
          indexPose.transform.position.x - wristPose.transform.position.x,
          indexPose.transform.position.y - wristPose.transform.position.y,
          indexPose.transform.position.z - wristPose.transform.position.z
        ).normalize();

        state.rayDir.copy(state._tmp);
        break;
      }
    }

    state.pinching = anyPinch;
  }

  // Hook renderer XR frame loop without touching Spine:
  // three.js calls animation loop; we piggyback via setAnimationLoop in Spine already.
  // We'll rely on renderer.xr.getFrame() availability (not public), so instead we expose a handler.
  return {
    state,
    onXRFrame(frame) { updateFromFrame(frame); }
  };
}
