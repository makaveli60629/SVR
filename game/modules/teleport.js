import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isFist, isTwoFingerPoint, isThreeFingerPinch, twoFingerAimPoint } from "./gestures.js";

const PHASE = "PHASE-161-PINCH-TELEPORT-FREEZE-GUARD";
const SVR_CONTROLLER_RAY_FORWARD_SIGN = 1;
const SVR_CONTROLLER_RAY_PITCH_OFFSET_DEG = 0;
const SVR_CONTROLLER_RAY_YAW_OFFSET_DEG = 0;
const RIGHT_STICK_DEADZONE = 0.20;
const HAND_PINCH_MIN_HOLD_MS = 165;
const HAND_TARGET_STABLE_MS = 120;
const PINCH_RELEASE_LOCK_MS = 420;
const COMMIT_GUARD_MS = 360;

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;

  const calibration = {
    phase: PHASE,
    controllerRayForwardSign: SVR_CONTROLLER_RAY_FORWARD_SIGN,
    pitchOffsetDeg: SVR_CONTROLLER_RAY_PITCH_OFFSET_DEG,
    yawOffsetDeg: SVR_CONTROLLER_RAY_YAW_OFFSET_DEG,
    rightStick: { x: 0, y: 0 },
    source: "none",
    rayDirection: { x: 0, y: 0, z: -1 },
    target: null,
    valid: false,
    state: "OFF",
    lastTeleportResult: "none",
    note: "Pinch teleport commit now exits immediately and requires release before re-arm."
  };
  window.SVR_TELEPORT_CALIBRATION = calibration;

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
      calibration.lastTeleportResult = "reference-space-failed";
      return false;
    }
  }

  function setPlayerPose(x, y, z){ playerX = x; playerY = y; playerZ = z; return applyReferenceSpace(); }
  function setPlayerXZ(x, z){ playerX = x; playerZ = z; return applyReferenceSpace(); }
  function getPlayerPose(){ return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw }; }
  function setPlayerYaw(nextYaw){ playerYaw = nextYaw; return applyReferenceSpace(); }

  const pointer = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.POINTER_SIZE, CONFIG.POINTER_SIZE),
    new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.35,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      side: THREE.DoubleSide,
      opacity: 0.96,
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
    opacity: 0.9
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 72), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.015;
  ring.visible = false;
  scene.add(ring);

  const markerGlow = new THREE.PointLight(0xb48cff, 0, 4.5, 2.0);
  markerGlow.position.y = 0.4;
  scene.add(markerGlow);

  const debug = document.createElement("div");
  debug.id = "svr-teleport-calibration-debug";
  debug.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:99999;max-width:320px;padding:8px 10px;border:1px solid rgba(180,140,255,.7);border-radius:10px;background:rgba(5,6,14,.72);color:#e9ddff;font:11px/1.35 monospace;pointer-events:none;display:none;white-space:pre-wrap";
  document.body?.appendChild(debug);

  let mode = false;
  let active = null;
  let activeMode = "hand";
  let cooldownUntil = 0;
  let lastTP = 0;
  let pinchHoldStart = 0;
  let pinchReleaseLockUntil = 0;
  let teleportCommitGuardUntil = 0;
  let triggerHoldStart = 0;
  let leftHandRef = null;
  let rightHandRef = null;
  let leftControllerRef = null;
  let rightControllerRef = null;
  let stableTargetMs = 0;
  let lastAimValid = false;
  let snapCooldownUntil = 0;
  let lastLeftToggle = false;
  let lastRightToggle = false;
  let lastLeftFistToggle = false;
  let lastRightFistToggle = false;
  let lastInputSummary = "waiting";

  const head = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const controllerFlat = new THREE.Vector3();
  const camFlat = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);
  const yawQuat = new THREE.Quaternion();
  const pitchQuat = new THREE.Quaternion();

  function hideArc(){}
  function setGlow(on){ ringMat.emissiveIntensity = on ? 1.3 : 0.0; markerGlow.intensity = on ? 2.2 : 0.0; }

  function clampTarget(p){
    return new THREE.Vector3(
      THREE.MathUtils.clamp(p.x, -roomClamp, roomClamp),
      0,
      THREE.MathUtils.clamp(p.z, -roomClamp, roomClamp)
    );
  }

  function clearMarker(){
    pointer.visible = false;
    ring.visible = false;
    hideArc();
    setGlow(false);
    stableTargetMs = 0;
    lastAimValid = false;
    calibration.valid = false;
    calibration.target = null;
  }

  function resetIntent(reason = "cancelled"){
    mode = false;
    active = null;
    activeMode = "hand";
    pinchHoldStart = 0;
    triggerHoldStart = 0;
    stableTargetMs = 0;
    lastAimValid = false;
    clearMarker();
    calibration.state = "CANCELLED";
    calibration.lastTeleportResult = reason;
  }

  function updateDebug(){
    if (!debug) return;
    const show = new URLSearchParams(location.search).has("tpdebug") || (calibration.source !== "none" && calibration.valid === false);
    debug.style.display = show ? "block" : "none";
    if (!show) return;
    debug.textContent = [
      PHASE,
      `state=${calibration.state} src=${calibration.source} valid=${calibration.valid}`,
      `stick x=${calibration.rightStick.x.toFixed(2)} y=${calibration.rightStick.y.toFixed(2)}`,
      `ray ${calibration.rayDirection.x.toFixed(2)},${calibration.rayDirection.y.toFixed(2)},${calibration.rayDirection.z.toFixed(2)}`,
      `target ${calibration.target ? `${calibration.target.x.toFixed(2)},${calibration.target.z.toFixed(2)}` : "none"}`,
      `last=${calibration.lastTeleportResult}`
    ].join("\n");
  }

  function teleportByDelta(target){
    if (!renderer?.xr?.isPresenting || !baseRefSpace) return false;
    if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.z)) return false;
    try{
      const xrCam = renderer.xr.getCamera(camera);
      if (!xrCam) return false;
      xrCam.getWorldPosition(head);
      const dx = target.x - head.x;
      const dz = target.z - head.z;
      if (!Number.isFinite(dx) || !Number.isFinite(dz)) return false;
      const prev = { x: playerX, y: playerY, z: playerZ, yaw: playerYaw };
      playerX += dx;
      playerZ += dz;
      if (!applyReferenceSpace()){
        playerX = prev.x; playerY = prev.y; playerZ = prev.z; playerYaw = prev.yaw;
        applyReferenceSpace();
        calibration.lastTeleportResult = "rollback";
        return false;
      }
      calibration.lastTeleportResult = "teleported";
      return true;
    }catch(err){
      log("[teleport] jump failed", err?.message || err);
      calibration.lastTeleportResult = "jump-failed";
      return false;
    }
  }

  function controllerGamepad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
  function getButtonValue(gp, idx){ return gp?.buttons?.[idx]?.value || 0; }
  function getButtonPressed(gp, idx){ return !!gp?.buttons?.[idx]?.pressed || getButtonValue(gp, idx) > 0.55; }

  function getRightStick(gp) {
    if (!gp?.axes?.length) return { x: 0, y: 0 };
    const axes = gp.axes;
    let x = axes.length >= 4 ? (axes[2] || 0) : (axes[0] || 0);
    let y = axes.length >= 4 ? (axes[3] || 0) : (axes[1] || 0);
    if (Math.abs(x) < RIGHT_STICK_DEADZONE) x = 0;
    if (Math.abs(y) < RIGHT_STICK_DEADZONE) y = 0;
    calibration.rightStick = { x, y };
    return { x, y };
  }

  function controllerTogglePressed(proxy){
    const gp = controllerGamepad(proxy);
    if (!gp) return false;
    return getButtonPressed(gp, 3) || getButtonPressed(gp, 2);
  }

  function controllerTeleportHoldValue(proxy){
    const gp = controllerGamepad(proxy);
    if (!gp) return 0;
    return Math.max(getButtonValue(gp, 0), getButtonValue(gp, 1), getButtonPressed(gp, 4) ? 1 : 0, getButtonPressed(gp, 5) ? 1 : 0);
  }

  function controllerInputName(proxy){
    const gp = controllerGamepad(proxy);
    if (!gp) return "controller";
    if (getButtonValue(gp, 0) > 0.22) return "trigger";
    if (getButtonValue(gp, 1) > 0.22) return "grip";
    if (getButtonPressed(gp, 4)) return "A/X";
    if (getButtonPressed(gp, 5)) return "B/Y";
    return "controller";
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

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(controllerOrigin);
    controller.getWorldQuaternion(yawQuat);
    controllerDir.set(0, 0, -1 * SVR_CONTROLLER_RAY_FORWARD_SIGN).applyQuaternion(yawQuat);

    if (SVR_CONTROLLER_RAY_YAW_OFFSET_DEG) {
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(SVR_CONTROLLER_RAY_YAW_OFFSET_DEG));
      controllerDir.applyQuaternion(q);
    }
    if (SVR_CONTROLLER_RAY_PITCH_OFFSET_DEG) {
      pitchQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(SVR_CONTROLLER_RAY_PITCH_OFFSET_DEG));
      controllerDir.applyQuaternion(pitchQuat);
    }

    const xrCam = renderer.xr.getCamera(camera);
    xrCam?.getWorldDirection(camFlat);
    camFlat.y = 0;
    controllerFlat.copy(controllerDir);
    controllerFlat.y = 0;
    if (camFlat.lengthSq() > 1e-5 && controllerFlat.lengthSq() > 1e-5) {
      if (controllerFlat.normalize().dot(camFlat.normalize()) < -0.20) {
        controllerDir.x *= -1;
        controllerDir.z *= -1;
        calibration.controllerRayForwardSign = -SVR_CONTROLLER_RAY_FORWARD_SIGN;
      } else {
        calibration.controllerRayForwardSign = SVR_CONTROLLER_RAY_FORWARD_SIGN;
      }
    }

    if (controllerDir.y > -0.08) controllerDir.y = -0.08;
    controllerDir.normalize();
    calibration.rayDirection = { x: controllerDir.x, y: controllerDir.y, z: controllerDir.z };
    calibration.source = "right-controller";

    const t = (controllerOrigin.y - 0.0) / (-controllerDir.y);
    if (!isFinite(t) || t < 0.12) { calibration.valid = false; calibration.target = null; return null; }
    const target = new THREE.Vector3(
      controllerOrigin.x + controllerDir.x * Math.min(t, 160),
      0,
      controllerOrigin.z + controllerDir.z * Math.min(t, 160)
    );
    calibration.valid = true;
    calibration.target = { x: target.x, y: 0, z: target.z };
    return target;
  }

  function toggleMode(preferred = "right"){
    mode = !mode;
    if (!mode){
      resetIntent("manual-off");
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
    calibration.state = "ARMED";
    return mode;
  }

  async function onSessionStart(){
    const session = renderer.xr.getSession();
    if (!session) return;
    baseRefSpace = await session.requestReferenceSpace("local-floor");
    playerYaw = 0;
    setPlayerPose(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
    resetIntent("session-started");
    calibration.lastTeleportResult = "session-started";
    window.SVR_PHASE142_CONTROLLER_INPUT = { phase: PHASE, status: "session-started" };
  }

  function setLogoTexture(tex){
    if (!tex) return;
    tex.anisotropy = 8;
    pointer.material.map = tex;
    pointer.material.needsUpdate = true;
  }

  function movePlayerFromControllers(dt){
    const rightGp = controllerGamepad(rightControllerRef);
    if (!rightGp) return;
    const rightStick = getRightStick(rightGp);

    if (Math.abs(rightStick.x) > 0.72 && performance.now() > snapCooldownUntil){
      playerYaw += Math.sign(rightStick.x) * (Math.PI / 4);
      applyReferenceSpace();
      snapCooldownUntil = performance.now() + 260;
      lastInputSummary = `right stick snap ${Math.sign(rightStick.x) > 0 ? "right" : "left"}`;
    }

    const moveY = rightStick.y;
    if (Math.abs(moveY) < RIGHT_STICK_DEADZONE) return;

    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldDirection(headDir);
    headDir.y = 0;
    if (headDir.lengthSq() < 1e-5) headDir.set(0, 0, -1);
    headDir.normalize();
    const speed = 2.65;
    const stepX = headDir.x * (-moveY) * speed * dt;
    const stepZ = headDir.z * (-moveY) * speed * dt;
    setPlayerXZ(
      THREE.MathUtils.clamp(playerX + stepX, -roomClamp, roomClamp),
      THREE.MathUtils.clamp(playerZ + stepZ, -roomClamp, roomClamp)
    );
    lastInputSummary = `right stick ${moveY < 0 ? "forward" : "back"}`;
  }

  function startDirectControllerAim(now){
    const rightHeld = controllerTeleportHoldValue(rightControllerRef) > 0.22;
    const leftHeld = controllerTeleportHoldValue(leftControllerRef) > 0.22;
    if (!rightHeld && !leftHeld) return false;
    const selected = rightHeld ? rightControllerRef : leftControllerRef;
    if (!selected?.joints || now <= cooldownUntil) return false;
    mode = true;
    active = selected;
    activeMode = "controller";
    triggerHoldStart = triggerHoldStart || now;
    stableTargetMs = 0;
    lastAimValid = false;
    calibration.state = "AIMING";
    lastInputSummary = `${controllerInputName(selected)} hold to aim`;
    return true;
  }

  function updatePublicState(extra = {}){
    window.SVR_PHASE142_CONTROLLER_INPUT = {
      phase: PHASE,
      teleportMode: mode,
      activeMode,
      activeHand: active === rightHandRef || active === rightControllerRef ? "right" : active === leftHandRef || active === leftControllerRef ? "left" : "none",
      pose: getPlayerPose(),
      input: lastInputSummary,
      calibration,
      ...extra
    };
    window.SVR_PHASE103_CONTROLLER_INPUT = window.SVR_PHASE142_CONTROLLER_INPUT;
    window.SVR_TELEPORT_CALIBRATION = calibration;
    updateDebug();
  }

  function commitTeleport(target, commitReason){
    const now = performance.now();
    if (now < teleportCommitGuardUntil) return false;
    teleportCommitGuardUntil = now + COMMIT_GUARD_MS;
    const safeTarget = target?.clone ? target.clone() : new THREE.Vector3(target.x, 0, target.z);
    const ok = teleportByDelta(safeTarget);
    if (ok){
      lastTP = now;
      cooldownUntil = now + 340;
      pinchReleaseLockUntil = now + PINCH_RELEASE_LOCK_MS;
      lastInputSummary = commitReason;
      calibration.state = "COMMITTED";
      calibration.lastTeleportResult = commitReason;
      resetIntent(commitReason);
      return true;
    }
    cooldownUntil = now + 200;
    pinchHoldStart = 0;
    stableTargetMs = 0;
    calibration.state = "CANCELLED";
    calibration.lastTeleportResult = "teleport-failed-safe-reset";
    return false;
  }

  function update({ dt = 0.016, leftHand, rightHand, leftController, rightController, statusCb = ()=>{}, modeCb = ()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand; rightHandRef = rightHand; leftControllerRef = leftController; rightControllerRef = rightController;

    if (renderer?.xr?.isPresenting && rightControllerRef) movePlayerFromControllers(dt);
    if (!mode && renderer?.xr?.isPresenting && (leftControllerRef || rightControllerRef)) startDirectControllerAim(now);

    const leftToggle = controllerTogglePressed(leftControllerRef);
    const rightToggle = controllerTogglePressed(rightControllerRef);
    if (leftToggle && !lastLeftToggle && now > cooldownUntil){
      mode = !(mode && active === leftControllerRef);
      active = mode ? (leftControllerRef || rightControllerRef || leftHandRef || rightHandRef) : null;
      activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand";
      cooldownUntil = now + 220;
      triggerHoldStart = 0;
      calibration.state = mode ? "ARMED" : "OFF";
    }
    if (rightToggle && !lastRightToggle && now > cooldownUntil){
      mode = !(mode && active === rightControllerRef);
      active = mode ? (rightControllerRef || leftControllerRef || rightHandRef || leftHandRef) : null;
      activeMode = active === rightControllerRef || active === leftControllerRef ? "controller" : "hand";
      cooldownUntil = now + 220;
      triggerHoldStart = 0;
      calibration.state = mode ? "ARMED" : "OFF";
    }
    lastLeftToggle = leftToggle; lastRightToggle = rightToggle;

    if (!leftControllerRef?.joints && !rightControllerRef?.joints){
      const leftFist = !!leftHandRef?.joints && handNearFace(leftHandRef) && isFist(leftHandRef);
      const rightFist = !!rightHandRef?.joints && handNearFace(rightHandRef) && isFist(rightHandRef);
      if (leftFist && !lastLeftFistToggle && now > cooldownUntil){
        mode = true; active = leftHandRef; activeMode = "hand"; cooldownUntil = now + 320; pinchHoldStart = 0; triggerHoldStart = 0; calibration.state = "ARMED"; calibration.lastTeleportResult = "left-fist-armed";
      }
      if (rightFist && !lastRightFistToggle && now > cooldownUntil){
        mode = true; active = rightHandRef; activeMode = "hand"; cooldownUntil = now + 320; pinchHoldStart = 0; triggerHoldStart = 0; calibration.state = "ARMED"; calibration.lastTeleportResult = "right-fist-armed";
      }
      lastLeftFistToggle = leftFist;
      lastRightFistToggle = rightFist;
    } else {
      lastLeftFistToggle = false;
      lastRightFistToggle = false;
    }

    if (!leftHandRef?.joints && !rightHandRef?.joints && !leftControllerRef?.joints && !rightControllerRef?.joints){
      resetIntent("tracking-lost-safe-cancel");
      statusCb("Waiting for hands or controllers…");
      modeCb("Input: not tracked");
      updatePublicState({ tracked: false });
      return;
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
      calibration.state = "OFF";
      const idleMsg = (leftControllerRef || rightControllerRef)
        ? "Controllers ready • RIGHT stick move/snap • hold A/grip/trigger to aim TP"
        : "TELEPORT OFF • clench fist to arm, two-finger aim, three-finger pinch to teleport";
      statusCb(idleMsg);
      modeCb((leftControllerRef || rightControllerRef) ? "Quest right-controller calibration active" : "Hands ready • fist arms TP");
      updatePublicState({ tracked: true });
      return;
    }

    setGlow(true);
    let aim = null;
    if (activeMode === "controller") {
      aim = controllerAimPoint(active);
    } else {
      calibration.source = "hand-two-finger";
      aim = isTwoFingerPoint(active) ? twoFingerAimPoint(active, renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera) : null;
      calibration.valid = !!aim;
      calibration.target = aim ? { x: aim.x, y: 0, z: aim.z } : null;
    }

    if (!aim){
      pointer.visible = false;
      ring.visible = false;
      markerGlow.intensity = 0;
      stableTargetMs = 0;
      lastAimValid = false;
      pinchHoldStart = 0;
      calibration.state = "ARMED";
      statusCb(activeMode === "controller" ? "CONTROLLER TP • point forward/down, hold A/grip/trigger, release" : "HAND TP ARMED • two-finger point to aim, three-finger pinch to teleport");
      modeCb(activeMode === "controller" ? "Controllers: TELEPORT AIM" : "Hands: TELEPORT ARMED");
      updatePublicState({ aimValid: false });
      return;
    }

    const target = clampTarget(aim);
    if (!lastAimValid){
      smoothedTarget.copy(target);
      stableTargetMs = 0;
    } else {
      const jitter = smoothedTarget.distanceTo(target);
      stableTargetMs = jitter < 0.16 ? (stableTargetMs + dt * 1000) : 0;
      smoothedTarget.lerp(target, jitter < 0.28 ? 0.34 : 0.18);
    }
    lastAimValid = true;
    pointer.visible = true;
    ring.visible = true;
    pointer.position.copy(smoothedTarget).setY(0.018);
    ring.position.copy(smoothedTarget).setY(0.015);
    markerGlow.position.copy(smoothedTarget).setY(0.34);
    calibration.valid = true;
    calibration.state = stableTargetMs > HAND_TARGET_STABLE_MS ? "VALID_TARGET" : "AIMING";
    calibration.target = { x: smoothedTarget.x, y: 0, z: smoothedTarget.z };

    if (activeMode === "controller"){
      const hold = controllerTeleportHoldValue(active);
      if (hold > 0.22 && !active.userData._wasTeleportHeld) triggerHoldStart = now;
      const held = triggerHoldStart ? (now - triggerHoldStart) : 0;
      if (active.userData._wasTeleportHeld && hold <= 0.12 && held > 130 && stableTargetMs > 115 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
        if (commitTeleport(smoothedTarget, "controller-release-teleported")) return;
        statusCb("TELEPORT RESET • aim again");
      }
      if (hold <= 0.12) triggerHoldStart = 0;
      active.userData._wasTeleportHeld = hold > 0.22;
      modeCb("Controllers: TELEPORT AIM");
      statusCb(`CONTROLLER TP • ${controllerInputName(active)} hold/release • stable ${Math.floor(stableTargetMs)}ms`);
      updatePublicState({ aimValid: true, holdValue: hold, stableTargetMs: Math.floor(stableTargetMs) });
      return;
    }

    const handForThisFrame = active;
    const threePinch = now >= pinchReleaseLockUntil && isThreeFingerPinch(handForThisFrame);
    if (handForThisFrame.userData._wasThreeFingerPinch === undefined) handForThisFrame.userData._wasThreeFingerPinch = false;

    if (threePinch && !handForThisFrame.userData._wasThreeFingerPinch) pinchHoldStart = now;
    if (!threePinch) pinchHoldStart = 0;

    const held = pinchHoldStart ? (now - pinchHoldStart) : 0;
    if (threePinch && held > HAND_PINCH_MIN_HOLD_MS && stableTargetMs > HAND_TARGET_STABLE_MS && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      handForThisFrame.userData._wasThreeFingerPinch = true;
      if (commitTeleport(smoothedTarget, "three-finger-pinch-teleported")) {
        updatePublicState({ aimValid: true, threeFingerPinch: true, stableTargetMs: Math.floor(stableTargetMs), freezeGuard: "committed-returned" });
        return;
      }
      statusCb("TELEPORT RESET • aim again");
      updatePublicState({ aimValid: true, threeFingerPinch: true, stableTargetMs: Math.floor(stableTargetMs), freezeGuard: "failed-safe-reset" });
      return;
    }

    handForThisFrame.userData._wasThreeFingerPinch = threePinch;
    modeCb("Hands: TELEPORT ARMED");
    statusCb(now < pinchReleaseLockUntil ? "HAND TP • release pinch before next teleport" : "HAND TP • two-finger aim • three-finger pinch to teleport");
    updatePublicState({ aimValid: true, threeFingerPinch: threePinch, stableTargetMs: Math.floor(stableTargetMs), pinchReleaseLockMs: Math.max(0, Math.floor(pinchReleaseLockUntil - now)) });
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
      activeHand: active === rightHandRef || active === rightControllerRef ? "right" : active === leftHandRef || active === leftControllerRef ? "left" : "none",
      activeMode,
      phase: PHASE,
      input: lastInputSummary,
      calibration
    })
  };
}
