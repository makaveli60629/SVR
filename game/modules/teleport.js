import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist, aimPoint } from "./gestures.js";

const TELEPORT_BUILD_LABEL = "PHASE-84-TELEPORT-LOCOMOTION-LOCK";

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;

  function applyReferenceSpace(){
    if (!baseRefSpace || !renderer?.xr?.isPresenting) return false;
    try{
      const halfYaw = -playerYaw * 0.5;
      const xform = new XRRigidTransform(
        { x: -playerX, y: -playerY, z: -playerZ },
        { x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw) }
      );
      renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(xform));
      return true;
    }catch(err){
      log("[teleport] reference-space apply failed", err?.message || err);
      return false;
    }
  }

  function setPlayerPose(x, y, z){
    playerX = x;
    playerY = y;
    playerZ = z;
    return applyReferenceSpace();
  }

  function setPlayerXZ(x, z){
    playerX = x;
    playerZ = z;
    return applyReferenceSpace();
  }

  function getPlayerPose(){
    return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw };
  }

  function setPlayerYaw(nextYaw){
    playerYaw = nextYaw;
    return applyReferenceSpace();
  }

  const pointer = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.POINTER_SIZE, CONFIG.POINTER_SIZE),
    new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.35,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      side: THREE.DoubleSide,
      opacity: 0.98,
      color: 0xffffff
    })
  );
  pointer.rotation.x = -Math.PI / 2;
  pointer.position.y = 0.018;
  pointer.visible = false;
  scene.add(pointer);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xb48cff,
    roughness: 0.22,
    metalness: 0.28,
    emissive: 0x2a0d3a,
    emissiveIntensity: 0.0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88
  });
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 72),
    ringMat
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.015;
  ring.visible = false;
  scene.add(ring);

  const markerGlow = new THREE.PointLight(0xb48cff, 0, 4.5, 2.0);
  markerGlow.position.y = 0.4;
  scene.add(markerGlow);

  function hideArc(){}

  function setGlow(on){
    ringMat.emissiveIntensity = on ? 1.0 : 0.0;
    markerGlow.intensity = on ? 1.8 : 0.0;
  }

  let mode = false;
  let active = null;
  let activeMode = "hand";
  let directHoldMode = false;
  let cooldownUntil = 0;
  let lastTP = 0;
  let holdStart = 0;
  let leftHandRef = null;
  let rightHandRef = null;
  let leftControllerRef = null;
  let rightControllerRef = null;
  let stableTargetMs = 0;
  let lastAimValid = false;
  let snapCooldownUntil = 0;
  let lastLeftFist = false;
  let lastRightFist = false;
  let lastGoodAimAt = 0;

  const head = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  const headForward = new THREE.Vector3();
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const aimOrigin = new THREE.Vector3();
  const aimDir = new THREE.Vector3();
  const aimVec = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);

  function clampTarget(p){
    return new THREE.Vector3(
      THREE.MathUtils.clamp(p.x, -roomClamp, roomClamp),
      0,
      THREE.MathUtils.clamp(p.z, -roomClamp, roomClamp)
    );
  }

  function getXRHead(){
    const xrCam = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
    if (!xrCam) return null;
    xrCam.getWorldPosition(head);
    xrCam.getWorldDirection(headForward);
    headForward.y = 0;
    if (headForward.lengthSq() < 1e-5) headForward.set(0, 0, -1);
    headForward.normalize();
    return xrCam;
  }

  function floorHitFromRay(origin, dir, maxDistance = 22){
    if (!origin || !dir || dir.lengthSq() < 1e-5) return null;
    const d = aimDir.copy(dir).normalize();
    // If the controller/hand ray is reversed by the runtime, flip it back toward the user's view.
    getXRHead();
    const flat = new THREE.Vector3(d.x, 0, d.z);
    if (flat.lengthSq() > 1e-5){
      flat.normalize();
      if (flat.dot(headForward) < -0.20){
        d.x *= -1;
        d.z *= -1;
      }
    }
    if (d.y > -0.065) d.y = -0.065;
    d.normalize();
    const t = (origin.y - 0.0) / (-d.y);
    if (!isFinite(t) || t < 0.12) return null;
    const tClamped = Math.min(t, maxDistance);
    return new THREE.Vector3(
      origin.x + d.x * tClamped,
      0,
      origin.z + d.z * tClamped
    );
  }

  function isInFrontOfHead(target, minDot = -0.10){
    getXRHead();
    aimVec.set(target.x - head.x, 0, target.z - head.z);
    if (aimVec.lengthSq() < 0.09) return false;
    aimVec.normalize();
    return aimVec.dot(headForward) >= minDot;
  }

  function headForwardFallback(distance = 4.8){
    getXRHead();
    return new THREE.Vector3(
      head.x + headForward.x * distance,
      0,
      head.z + headForward.z * distance
    );
  }

  function safeHandAimPoint(hand){
    const base = aimPoint(hand);
    if (base && isInFrontOfHead(base, -0.18)) return base;

    const wrist = hand?.joints?.wrist;
    const index = hand?.joints?.["index-finger-tip"];
    if (wrist && index){
      const wristPos = new THREE.Vector3();
      const tipPos = new THREE.Vector3();
      wrist.updateWorldMatrix?.(true, false);
      index.updateWorldMatrix?.(true, false);
      wrist.getWorldPosition(wristPos);
      index.getWorldPosition(tipPos);
      const corrected = floorHitFromRay(tipPos, tipPos.clone().sub(wristPos), 18);
      if (corrected && isInFrontOfHead(corrected, -0.12)) return corrected;
    }

    // Last-resort safe fallback prevents the pointer from locking behind the player.
    return headForwardFallback(4.2);
  }

  function teleportByDelta(target){
    if (!renderer?.xr?.isPresenting || !baseRefSpace) return false;
    try{
      const xrCam = renderer.xr.getCamera(camera);
      if (!xrCam) return false;
      xrCam.getWorldPosition(head);
      const dx = target.x - head.x;
      const dz = target.z - head.z;
      const prev = { x: playerX, y: playerY, z: playerZ, yaw: playerYaw };
      playerX += dx;
      playerZ += dz;
      if (!applyReferenceSpace()){
        playerX = prev.x;
        playerY = prev.y;
        playerZ = prev.z;
        playerYaw = prev.yaw;
        applyReferenceSpace();
        return false;
      }
      return true;
    }catch(err){
      log("[teleport] jump failed", err?.message || err);
      return false;
    }
  }

  function controllerGamepad(proxy){
    return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null;
  }

  function getStick(gp, side = "left"){
    if (!gp?.axes?.length) return { x: 0, y: 0 };
    const axes = gp.axes;
    let x = 0;
    let y = 0;
    if (axes.length >= 4){
      if (side === "right"){
        x = axes[2] || 0;
        y = axes[3] || 0;
        if (Math.abs(x) < 0.001 && Math.abs(y) < 0.001){
          x = axes[0] || 0;
          y = axes[1] || 0;
        }
      } else {
        x = axes[0] || 0;
        y = axes[1] || 0;
      }
    } else {
      x = axes[0] || 0;
      y = axes[1] || 0;
    }
    if (Math.abs(x) < 0.14) x = 0;
    if (Math.abs(y) < 0.14) y = 0;
    return { x, y };
  }

  function getButtonValue(gp, idx){
    return gp?.buttons?.[idx]?.value || 0;
  }

  function controllerHoldValue(proxy){
    const gp = controllerGamepad(proxy);
    if (!gp) return 0;
    // WebXR common mapping: 0 trigger, 1 squeeze/grip, 3 stick press, 4 A/X, 5 B/Y.
    return Math.max(
      getButtonValue(gp, 0),
      getButtonValue(gp, 1),
      getButtonValue(gp, 3),
      getButtonValue(gp, 4),
      getButtonValue(gp, 5)
    );
  }

  function handHoldPressed(hand){
    return !!hand?.joints && (isPinching(hand) || isFist(hand));
  }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(controllerOrigin);
    controller.getWorldDirection(controllerDir);
    const hit = floorHitFromRay(controllerOrigin, controllerDir, 22);
    if (hit && isInFrontOfHead(hit, -0.18)) return hit;
    return headForwardFallback(4.6);
  }

  function chooseDirectHoldTarget(){
    const rightVal = controllerHoldValue(rightControllerRef);
    const leftVal = controllerHoldValue(leftControllerRef);
    if (rightVal > 0.18 || leftVal > 0.18){
      return {
        active: rightVal >= leftVal ? rightControllerRef : leftControllerRef,
        mode: "controller",
        value: Math.max(rightVal, leftVal)
      };
    }

    const rightHandHold = handHoldPressed(rightHandRef);
    const leftHandHold = handHoldPressed(leftHandRef);
    if (rightHandHold || leftHandHold){
      // Prefer the non-watch/right hand when both are making a gesture.
      return { active: rightHandHold ? rightHandRef : leftHandRef, mode: "hand", value: 1 };
    }
    return { active: null, mode: "none", value: 0 };
  }

  function handNearFace(hand){
    if (!renderer?.xr?.isPresenting || !hand?.joints?.wrist) return false;
    const xrCam = renderer.xr.getCamera(camera);
    if (!xrCam) return false;
    const headPos = new THREE.Vector3();
    const wristPos = new THREE.Vector3();
    xrCam.getWorldPosition(headPos);
    hand.joints.wrist.getWorldPosition(wristPos);
    const dist = wristPos.distanceTo(headPos);
    const relativeY = wristPos.y - headPos.y;
    const relativeZ = wristPos.z - headPos.z;
    return dist < 0.34 && relativeY > -0.28 && relativeY < 0.22 && Math.abs(relativeZ) < 0.28;
  }

  function toggleMode(preferred = "right"){
    mode = !mode;
    directHoldMode = false;
    if (!mode){
      active = null;
      activeMode = "hand";
      holdStart = 0;
      return mode;
    }
    const preferredController = preferred === "left" ? leftControllerRef : rightControllerRef;
    const fallbackController = preferred === "left" ? rightControllerRef : leftControllerRef;
    const preferredHand = preferred === "left" ? leftHandRef : rightHandRef;
    const fallbackHand = preferred === "left" ? rightHandRef : leftHandRef;
    if (preferredController?.joints || fallbackController?.joints){
      active = preferredController?.joints ? preferredController : fallbackController;
      activeMode = "controller";
    } else {
      active = preferredHand?.joints ? preferredHand : fallbackHand?.joints ? fallbackHand : null;
      activeMode = "hand";
    }
    cooldownUntil = performance.now() + 120;
    holdStart = 0;
    return mode;
  }

  async function onSessionStart(){
    const session = renderer.xr.getSession();
    if (!session) return;
    baseRefSpace = await session.requestReferenceSpace("local-floor");
    playerYaw = 0;
    setPlayerPose(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
    mode = false;
    directHoldMode = false;
    active = null;
    activeMode = "hand";
    pointer.visible = false;
    ring.visible = false;
    hideArc();
    setGlow(false);
    log(`[teleport] ${TELEPORT_BUILD_LABEL} ready`);
  }

  function setLogoTexture(tex){
    if (!tex) return;
    tex.anisotropy = 8;
    pointer.material.map = tex;
    pointer.material.needsUpdate = true;
  }

  function movePlayerFromControllers(dt){
    const leftGp = controllerGamepad(leftControllerRef);
    const rightGp = controllerGamepad(rightControllerRef);
    const leftStick = getStick(leftGp, "left");
    const rightStick = getStick(rightGp, "right");

    if (Math.abs(rightStick.x) > 0.72 && performance.now() > snapCooldownUntil){
      playerYaw += Math.sign(rightStick.x) * (Math.PI / 4);
      applyReferenceSpace();
      snapCooldownUntil = performance.now() + 220;
    }

    // Locked control: right-stick Y moves forward/back. Left stick still works as fallback/strafe.
    const moveX = Math.abs(leftStick.x) > 0.12 ? leftStick.x : 0;
    const moveY = Math.abs(rightStick.y) > 0.12 ? rightStick.y : leftStick.y;
    const mag = Math.hypot(moveX, moveY);
    if (mag < 0.12) return;

    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldDirection(headDir);
    headDir.y = 0;
    if (headDir.lengthSq() < 1e-5) headDir.set(0, 0, -1);
    headDir.normalize();
    const rightDir = new THREE.Vector3(headDir.z, 0, -headDir.x).normalize();
    const speed = CONFIG.XR_MOVE_SPEED || 3.35;
    const stepX = (rightDir.x * moveX + headDir.x * (-moveY)) * speed * dt;
    const stepZ = (rightDir.z * moveX + headDir.z * (-moveY)) * speed * dt;
    const nextX = THREE.MathUtils.clamp(playerX + stepX, -roomClamp, roomClamp);
    const nextZ = THREE.MathUtils.clamp(playerZ + stepZ, -roomClamp, roomClamp);
    setPlayerXZ(nextX, nextZ);
  }

  function clearMarker(){
    pointer.visible = false;
    ring.visible = false;
    hideArc();
    setGlow(false);
    stableTargetMs = 0;
    lastAimValid = false;
  }

  function finishTeleportReset(){
    mode = false;
    directHoldMode = false;
    active = null;
    holdStart = 0;
    stableTargetMs = 0;
    lastAimValid = false;
    clearMarker();
  }

  function update({ dt = 0.016, leftHand, rightHand, leftController, rightController, statusCb = ()=>{}, modeCb = ()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand;
    rightHandRef = rightHand;
    leftControllerRef = leftController;
    rightControllerRef = rightController;

    if (renderer?.xr?.isPresenting && (leftControllerRef || rightControllerRef)) movePlayerFromControllers(dt);

    const hasInput = !!(leftHandRef?.joints || rightHandRef?.joints || leftControllerRef?.joints || rightControllerRef?.joints);
    if (!hasInput){
      clearMarker();
      statusCb("Waiting for hands or controllers…");
      modeCb("Input: not tracked");
      return;
    }

    const direct = chooseDirectHoldTarget();
    if (direct.active && now > cooldownUntil){
      if (!mode || active !== direct.active || activeMode !== direct.mode){
        mode = true;
        directHoldMode = true;
        active = direct.active;
        activeMode = direct.mode;
        holdStart = now;
        stableTargetMs = 0;
        lastAimValid = false;
      }
    } else if (directHoldMode && activeMode === "controller" && controllerHoldValue(active) <= 0.12){
      // Release is handled below if the aim was valid. If not valid, just reset cleanly.
      if (!lastAimValid) finishTeleportReset();
    } else if (directHoldMode && activeMode === "hand" && !handHoldPressed(active)){
      if (!lastAimValid) finishTeleportReset();
    }

    // Optional fist-by-face toggle preserved for users who prefer watch/toggle mode, but direct hold is now primary.
    if (!direct.active && !leftControllerRef?.joints && !rightControllerRef?.joints){
      const leftFist = !!leftHandRef?.joints && handNearFace(leftHandRef) && isFist(leftHandRef);
      const rightFist = !!rightHandRef?.joints && handNearFace(rightHandRef) && isFist(rightHandRef);
      if (leftFist && !lastLeftFist && now > cooldownUntil){
        mode = !(mode && active === leftHandRef);
        directHoldMode = false;
        active = mode ? leftHandRef : null;
        activeMode = "hand";
        cooldownUntil = now + 320;
        holdStart = 0;
      }
      if (rightFist && !lastRightFist && now > cooldownUntil){
        mode = !(mode && active === rightHandRef);
        directHoldMode = false;
        active = mode ? rightHandRef : null;
        activeMode = "hand";
        cooldownUntil = now + 320;
        holdStart = 0;
      }
      lastLeftFist = leftFist;
      lastRightFist = rightFist;
    } else {
      lastLeftFist = false;
      lastRightFist = false;
    }

    if (mode && activeMode === "controller" && !(active?.joints)){
      active = rightControllerRef?.joints ? rightControllerRef : leftControllerRef?.joints ? leftControllerRef : rightHandRef?.joints ? rightHandRef : leftHandRef?.joints ? leftHandRef : null;
      activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand";
    } else if (mode && activeMode === "hand" && !(active?.joints)){
      active = rightHandRef?.joints ? rightHandRef : leftHandRef?.joints ? leftHandRef : rightControllerRef?.joints ? rightControllerRef : leftControllerRef?.joints ? leftControllerRef : null;
      activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand";
    }

    if (!mode || !active){
      clearMarker();
      const idleMsg = (leftControllerRef || rightControllerRef)
        ? "Controllers active • right stick move/snap • hold A/grip/trigger to teleport"
        : "Hands active • hold fist or pinch to aim teleport";
      statusCb(idleMsg);
      modeCb((leftControllerRef || rightControllerRef) ? "Controllers ready" : "Hands ready");
      return;
    }

    setGlow(true);

    const aim = activeMode === "controller" ? controllerAimPoint(active) : safeHandAimPoint(active);
    if (!aim){
      const recentlyValid = now - lastGoodAimAt < 140;
      if (!recentlyValid){
        pointer.visible = false;
        ring.visible = false;
        markerGlow.intensity = 0;
        stableTargetMs = 0;
        lastAimValid = false;
      }
      statusCb(activeMode === "controller" ? "AIM TP • point at floor" : "HAND TP • point toward floor");
      modeCb(activeMode === "controller" ? "Controllers: TELEPORT AIM" : "Hands: TELEPORT AIM");
      return;
    }

    const target = clampTarget(aim);
    lastGoodAimAt = now;
    if (!lastAimValid){
      smoothedTarget.copy(target);
      stableTargetMs = 0;
    } else {
      const jitter = smoothedTarget.distanceTo(target);
      stableTargetMs = jitter < 0.20 ? (stableTargetMs + dt * 1000) : 0;
      smoothedTarget.lerp(target, jitter < 0.32 ? 0.30 : 0.16);
    }
    lastAimValid = true;

    pointer.visible = true;
    ring.visible = true;
    pointer.position.copy(smoothedTarget).setY(0.018);
    ring.position.copy(smoothedTarget).setY(0.015);
    markerGlow.position.copy(smoothedTarget).setY(0.34);

    const holdValue = activeMode === "controller" ? controllerHoldValue(active) : (handHoldPressed(active) ? 1 : 0);
    if (holdValue > 0.18 && !active.userData._wasTeleportHold) holdStart = now;
    const held = holdStart ? (now - holdStart) : 0;
    const released = active.userData._wasTeleportHold && holdValue <= 0.12;

    if (released && held > 180 && stableTargetMs > 100 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      const ok = teleportByDelta(smoothedTarget);
      if (ok){
        lastTP = now + 220;
        cooldownUntil = now + 220;
        active.userData._wasTeleportHold = false;
        finishTeleportReset();
        statusCb("Teleport complete", { force: true });
        return;
      }
      cooldownUntil = now + 180;
      holdStart = 0;
      stableTargetMs = 0;
      statusCb("TELEPORT RESET • aim again");
    }

    if (holdValue <= 0.12){
      holdStart = 0;
      if (directHoldMode){
        active.userData._wasTeleportHold = false;
        finishTeleportReset();
        return;
      }
    }
    active.userData._wasTeleportHold = holdValue > 0.18;

    if (activeMode === "controller"){
      modeCb("Controllers: TELEPORT AIM");
      statusCb("Hold A/grip/trigger • aim at marker • release to teleport");
    } else {
      modeCb("Hands: TELEPORT AIM");
      statusCb("Hold fist/pinch • aim at marker • release to teleport");
    }
  }

  return {
    onSessionStart,
    setLogoTexture,
    update,
    setPlayerPose,
    setPlayerXZ,
    getPlayerPose,
    setPlayerYaw,
    toggleMode,
    isEnabled: ()=>mode,
    getState: ()=>({
      mode,
      directHoldMode,
      activeHand: active === rightHandRef || active === rightControllerRef ? "right" : active === leftHandRef || active === leftControllerRef ? "left" : "none",
      activeMode
    })
  };
}
