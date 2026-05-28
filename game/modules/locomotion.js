import * as THREE from "three";

const DEAD_ZONE = 0.14;
const SNAP_THRESHOLD = 0.72;
const SNAP_RADIANS = Math.PI / 4;
const SNAP_COOLDOWN_MS = 220;
const MOVE_SPEED = 2.65;

function dz(v){
  return Math.abs(v) < DEAD_ZONE ? 0 : v;
}

function controllerGamepad(proxy){
  return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null;
}

function stickFromAxes(gp, side){
  if (!gp?.axes?.length) return { x: 0, y: 0 };
  const axes = gp.axes;
  let x = 0;
  let y = 0;

  if (side === "right"){
    if (axes.length >= 4){
      x = axes[2] || 0;
      y = axes[3] || 0;
    }
    if (Math.abs(x) < 0.001 && Math.abs(y) < 0.001){
      x = axes[0] || 0;
      y = axes[1] || 0;
    }
  } else {
    x = axes[0] || 0;
    y = axes[1] || 0;
  }

  return { x: dz(x), y: dz(y) };
}

function clampByRoom(value, axis, roomClamp){
  if (typeof roomClamp === "number") return THREE.MathUtils.clamp(value, -roomClamp, roomClamp);
  if (axis === "x") return THREE.MathUtils.clamp(value, roomClamp?.minX ?? -24, roomClamp?.maxX ?? 24);
  return THREE.MathUtils.clamp(value, roomClamp?.minZ ?? -24, roomClamp?.maxZ ?? 24);
}

export function createLocomotion({ renderer, camera, teleportRig, roomClamp, log = console.log }){
  let snapCooldownUntil = 0;
  const headDir = new THREE.Vector3();
  const rightDir = new THREE.Vector3();
  let active = true;

  // Tells teleport.js not to run its older embedded stick locomotion.
  window.SVR_EXTERNAL_LOCOMOTION_ACTIVE = true;

  function update({ dt = 0.016, leftController = null, rightController = null } = {}){
    if (!active || !renderer?.xr?.isPresenting) return;
    if (!teleportRig?.getPlayerPose || !teleportRig?.setPlayerXZ || !teleportRig?.setPlayerYaw) return;

    const leftGp = controllerGamepad(leftController);
    const rightGp = controllerGamepad(rightController);
    if (!leftGp && !rightGp) return;

    const leftStick = stickFromAxes(leftGp, "left");
    const rightStick = stickFromAxes(rightGp || leftGp, "right");
    const pose = teleportRig.getPlayerPose();
    const now = performance.now();

    // Quest/Oculus lock: right stick X = 45-degree snap turn.
    if (Math.abs(rightStick.x) > SNAP_THRESHOLD && now > snapCooldownUntil){
      teleportRig.setPlayerYaw((pose.yaw || 0) + Math.sign(rightStick.x) * SNAP_RADIANS);
      snapCooldownUntil = now + SNAP_COOLDOWN_MS;
    }

    // Quest/Oculus lock: right stick Y = forward/back.
    // Left stick remains optional strafe + backup forward/back.
    const moveX = leftStick.x;
    const moveY = Math.abs(rightStick.y) > DEAD_ZONE ? rightStick.y : leftStick.y;
    if (Math.hypot(moveX, moveY) < DEAD_ZONE) return;

    const xrCam = renderer.xr.getCamera(camera);
    if (!xrCam) return;
    xrCam.getWorldDirection(headDir);
    headDir.y = 0;
    if (headDir.lengthSq() < 1e-5) headDir.set(0, 0, -1);
    headDir.normalize();
    rightDir.set(headDir.z, 0, -headDir.x).normalize();

    const stepX = (rightDir.x * moveX + headDir.x * (-moveY)) * MOVE_SPEED * dt;
    const stepZ = (rightDir.z * moveX + headDir.z * (-moveY)) * MOVE_SPEED * dt;
    const nextX = clampByRoom((pose.x || 0) + stepX, "x", roomClamp);
    const nextZ = clampByRoom((pose.z || 0) + stepZ, "z", roomClamp);
    teleportRig.setPlayerXZ(nextX, nextZ);
  }

  return {
    update,
    setActive(value){ active = !!value; },
    isActive(){ return active; },
    getState(){ return { active, snapCooldownUntil }; }
  };
}
