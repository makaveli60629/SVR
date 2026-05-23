import * as THREE from "three";

export const LOCOMOTION_PHASE = "PHASE-137-MOVEMENT-LOCOMOTION-TELEPORT-MODULE-LOCK";

const ZERO_STICK = { x: 0, y: 0 };
const MOVE_STICK = { x: 0, y: 0 };
const TURN_STICK = { x: 0, y: 0 };
const FORWARD = new THREE.Vector3(0, 0, -1);
const RIGHT = new THREE.Vector3(1, 0, 0);
const NEXT_POS = { x: 0, z: 0, moved: false };

export function controllerGamepad(proxy){
  return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null;
}

export function buttonValue(gp, idx){
  return gp?.buttons?.[idx]?.value || 0;
}

export function deadZone(v, zone = 0.16){
  return Math.abs(v || 0) < zone ? 0 : (v || 0);
}

export function stickPair(gp, pair = "left", out = MOVE_STICK){
  out.x = 0;
  out.y = 0;
  if (!gp?.axes?.length) return out;
  const axes = gp.axes;
  if (pair === "right" && axes.length >= 4){
    out.x = deadZone(axes[2] || 0);
    out.y = deadZone(axes[3] || 0);
  } else {
    out.x = deadZone(axes[0] || 0);
    out.y = deadZone(axes[1] || 0);
  }
  return out;
}

export function triggerValue(proxy){
  const gp = controllerGamepad(proxy);
  if (!gp) return 0;
  return Math.max(buttonValue(gp, 0), buttonValue(gp, 1), buttonValue(gp, 4), buttonValue(gp, 5));
}

export function movementStick(leftControllerRef, rightControllerRef){
  const leftGp = controllerGamepad(leftControllerRef);
  stickPair(leftGp, "left", MOVE_STICK);
  if (Math.hypot(MOVE_STICK.x, MOVE_STICK.y) > 0.12) return MOVE_STICK;
  const rightGp = controllerGamepad(rightControllerRef);
  stickPair(rightGp, "left", MOVE_STICK);
  if (Math.hypot(MOVE_STICK.x, MOVE_STICK.y) > 0.12) return MOVE_STICK;
  return ZERO_STICK;
}

export function snapTurnStick(leftControllerRef, rightControllerRef){
  const rightGp = controllerGamepad(rightControllerRef);
  stickPair(rightGp, "right", TURN_STICK);
  if (Math.abs(TURN_STICK.x) > 0.15) return TURN_STICK;
  const leftGp = controllerGamepad(leftControllerRef);
  stickPair(leftGp, "right", TURN_STICK);
  return TURN_STICK;
}

export function cameraForwardVectors(renderer, camera){
  const xrCam = renderer?.xr?.getCamera?.(camera) || camera;
  FORWARD.set(0, 0, -1);
  if (xrCam?.getWorldDirection) xrCam.getWorldDirection(FORWARD);
  FORWARD.y = 0;
  if (FORWARD.lengthSq() < 1e-5) FORWARD.set(0, 0, -1);
  FORWARD.normalize();
  RIGHT.set(FORWARD.z, 0, -FORWARD.x).normalize();
  return { forward: FORWARD, right: RIGHT };
}

export function nextCameraForwardPosition({ renderer, camera, leftControllerRef, rightControllerRef, playerX, playerZ, roomClamp, dt, speed = 2.2 }){
  const move = movementStick(leftControllerRef, rightControllerRef);
  if (Math.hypot(move.x, move.y) < 0.12){
    NEXT_POS.x = playerX;
    NEXT_POS.z = playerZ;
    NEXT_POS.moved = false;
    return NEXT_POS;
  }
  const vectors = cameraForwardVectors(renderer, camera);
  const forward = vectors.forward;
  const right = vectors.right;
  const forwardAmount = -move.y;
  const strafeAmount = move.x * 0.65;
  const stepX = (forward.x * forwardAmount + right.x * strafeAmount) * speed * dt;
  const stepZ = (forward.z * forwardAmount + right.z * strafeAmount) * speed * dt;
  NEXT_POS.x = THREE.MathUtils.clamp(playerX + stepX, -roomClamp, roomClamp);
  NEXT_POS.z = THREE.MathUtils.clamp(playerZ + stepZ, -roomClamp, roomClamp);
  NEXT_POS.moved = true;
  return NEXT_POS;
}

export function shouldSnapTurn(leftControllerRef, rightControllerRef, cooldownReady){
  const turn = snapTurnStick(leftControllerRef, rightControllerRef);
  if (!cooldownReady || Math.abs(turn.x) <= 0.72) return 0;
  return Math.sign(turn.x) * (Math.PI / 4);
}

window.SVR_LOCOMOTION_LOCK = {
  phase: LOCOMOTION_PHASE,
  movement: "left stick camera-forward with right-controller fallback",
  snapTurn: "right stick 45 degrees",
  fallback: "right controller left-stick pair if needed",
  teleport: "hold trigger/A/grip or hand fist/pinch and release commit",
  allocationPolicy: "reused vectors/objects in hot path"
};
