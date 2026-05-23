import * as THREE from "three";

export const LOCOMOTION_PHASE = "PHASE-99-LOCOMOTION-MODULE-LOCK";

export function controllerGamepad(proxy){
  return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null;
}

export function buttonValue(gp, idx){
  return gp?.buttons?.[idx]?.value || 0;
}

export function deadZone(v, zone = 0.16){
  return Math.abs(v || 0) < zone ? 0 : (v || 0);
}

export function stickPair(gp, pair = "left"){
  if (!gp?.axes?.length) return { x: 0, y: 0 };
  const axes = gp.axes;
  const raw = pair === "right" && axes.length >= 4
    ? { x: axes[2] || 0, y: axes[3] || 0 }
    : { x: axes[0] || 0, y: axes[1] || 0 };
  return { x: deadZone(raw.x), y: deadZone(raw.y) };
}

export function triggerValue(proxy){
  const gp = controllerGamepad(proxy);
  if (!gp) return 0;
  return Math.max(buttonValue(gp, 0), buttonValue(gp, 1), buttonValue(gp, 4), buttonValue(gp, 5));
}

export function movementStick(leftControllerRef, rightControllerRef){
  const leftGp = controllerGamepad(leftControllerRef);
  const rightGp = controllerGamepad(rightControllerRef);
  const leftMove = stickPair(leftGp, "left");
  if (Math.hypot(leftMove.x, leftMove.y) > 0.12) return leftMove;
  const rightMoveFallback = stickPair(rightGp, "left");
  if (Math.hypot(rightMoveFallback.x, rightMoveFallback.y) > 0.12) return rightMoveFallback;
  return { x: 0, y: 0 };
}

export function snapTurnStick(leftControllerRef, rightControllerRef){
  const rightGp = controllerGamepad(rightControllerRef);
  const rightTurn = stickPair(rightGp, "right");
  if (Math.abs(rightTurn.x) > 0.15) return rightTurn;
  const leftGp = controllerGamepad(leftControllerRef);
  return stickPair(leftGp, "right");
}

export function cameraForwardVectors(renderer, camera){
  const xrCam = renderer?.xr?.getCamera?.(camera) || camera;
  const forward = new THREE.Vector3(0, 0, -1);
  if (xrCam?.getWorldDirection) xrCam.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() < 1e-5) forward.set(0, 0, -1);
  forward.normalize();
  const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
  return { forward, right };
}

export function nextCameraForwardPosition({ renderer, camera, leftControllerRef, rightControllerRef, playerX, playerZ, roomClamp, dt, speed = 2.2 }){
  const move = movementStick(leftControllerRef, rightControllerRef);
  if (Math.hypot(move.x, move.y) < 0.12) return { x: playerX, z: playerZ, moved: false };
  const { forward, right } = cameraForwardVectors(renderer, camera);
  const forwardAmount = -move.y;
  const strafeAmount = move.x * 0.65;
  const stepX = (forward.x * forwardAmount + right.x * strafeAmount) * speed * dt;
  const stepZ = (forward.z * forwardAmount + right.z * strafeAmount) * speed * dt;
  return {
    x: THREE.MathUtils.clamp(playerX + stepX, -roomClamp, roomClamp),
    z: THREE.MathUtils.clamp(playerZ + stepZ, -roomClamp, roomClamp),
    moved: true
  };
}

export function shouldSnapTurn(leftControllerRef, rightControllerRef, cooldownReady){
  const turn = snapTurnStick(leftControllerRef, rightControllerRef);
  if (!cooldownReady || Math.abs(turn.x) <= 0.72) return 0;
  return Math.sign(turn.x) * (Math.PI / 4);
}

window.SVR_LOCOMOTION_LOCK = {
  phase: LOCOMOTION_PHASE,
  movement: "left stick camera-forward",
  snapTurn: "right stick 45 degrees",
  fallback: "right controller left-stick pair if needed",
  teleport: "hold aim and release commit"
};
