import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isFist, isTwoFingerPoint, isThreeFingerPinch, twoFingerAimPoint } from "./gestures.js";

const PHASE = "PHASE-176-TELEPORT-QA-FLOOR-TABLE-BOUNDARY";
const RIGHT_STICK_DEADZONE = 0.20;
const HAND_PINCH_MIN_HOLD_MS = 120;
const HAND_TARGET_STABLE_MS = 65;
const COMMIT_GUARD_MS = 330;
const FIST_TOGGLE_COOLDOWN_MS = 520;
const FAST_AIM_LERP_STABLE = 0.82;
const FAST_AIM_LERP_MOVING = 0.58;
const SAFE_FLOOR_MIN_Y = -0.55;
const SAFE_FLOOR_MAX_Y = 0.05;
const MAIN_TABLE_CENTER_X = 0;
const MAIN_TABLE_CENTER_Z = 0;
const MAIN_TABLE_BLOCK_RADIUS = 1.48;
const MAIN_TABLE_ESCAPE_RADIUS = 1.74;

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;

  let mode = false;
  let active = null;
  let activeMode = "hand";
  let cooldownUntil = 0;
  let lastTP = 0;
  let pinchHoldStart = 0;
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
  let lastLeftFist = false;
  let lastRightFist = false;
  let lastInputSummary = "waiting";

  const head = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const controllerFlat = new THREE.Vector3();
  const camFlat = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);
  const yawQuat = new THREE.Quaternion();

  const calibration = {
    phase: PHASE,
    rightStick: { x: 0, y: 0 },
    source: "none",
    rayDirection: { x: 0, y: 0, z: -1 },
    target: null,
    valid: false,
    state: "OFF",
    activeTeleportHand: "none",
    glow: "off",
    lastTeleportResult: "none",
    note: "Phase 175 fist toggle preserved. Phase 176 adds floor/Y clamp and table-safe teleport targets."
  };

  const boundaryState = {
    phase: PHASE,
    floorClampActive: true,
    tableBlockActive: true,
    lastClampReason: "init",
    lastSafeTarget: null,
    lastRawTarget: null,
    tableCenter: { x: MAIN_TABLE_CENTER_X, z: MAIN_TABLE_CENTER_Z },
    tableBlockRadius: MAIN_TABLE_BLOCK_RADIUS,
    tableEscapeRadius: MAIN_TABLE_ESCAPE_RADIUS,
    floorYRange: { min: SAFE_FLOOR_MIN_Y, max: SAFE_FLOOR_MAX_Y },
    note: "Prevents aim/controller movement from landing inside the main poker table while preserving seating via direct setPlayerPose."
  };

  window.SVR_TELEPORT_CALIBRATION = calibration;
  window.SVR_MOVEMENT_BOUNDARY_STATE = boundaryState;
  window.SVR_ACTIVE_TELEPORT_HAND = {
    phase: PHASE,
    active: "none",
    source: "none",
    glow: "off",
    state: "OFF",
    lastCommit: "none"
  };

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
    color: 0xd05cff,
    roughness: 0.18,
    metalness: 0.34,
    emissive: 0xa020ff,
    emissiveIntensity: 0.0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.94
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 72), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.015;
  ring.visible = false;
  scene.add(ring);

  const markerGlow = new THREE.PointLight(0xd05cff, 0, 5.5, 2.0);
  markerGlow.position.y = 0.4;
  scene.add(markerGlow);

  const debug = document.createElement("div");
  debug.id = "svr-teleport-calibration-debug";
  debug.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:99999;max-width:360px;padding:8px 10px;border:1px solid rgba(208,92,255,.85);border-radius:10px;background:rgba(5,6,14,.72);color:#f4dcff;font:11px/1.35 monospace;pointer-events:none;display:none;white-space:pre-wrap";
  document.body?.appendChild(debug);

  function handLabel(obj){
    if (obj === leftHandRef) return "left";
    if (obj === rightHandRef) return "right";
    if (obj === leftControllerRef) return "left-controller";
    if (obj === rightControllerRef) return "right-controller";
    return "none";
  }

  function sourceLabelFor(obj){
    if (obj === leftControllerRef || obj === rightControllerRef) return "controller";
    if (obj === leftHandRef || obj === rightHandRef) return "look-at-fist";
    return "none";
  }

  function setActiveTeleportState(state = "OFF", activeLabel = "none", source = "none", glow = "off", lastCommit = null){
    calibration.state = state;
    calibration.activeTeleportHand = activeLabel;
    calibration.source = source;
    calibration.glow = glow;
    window.SVR_ACTIVE_TELEPORT_HAND = {
      phase: PHASE,
      active: activeLabel,
      source,
      glow,
      state,
      lastCommit: lastCommit || window.SVR_ACTIVE_TELEPORT_HAND?.lastCommit || "none"
    };
    window.SVR_TELEPORT_CALIBRATION = calibration;
  }

  function updateBoundary(reason, rawTarget, safeTarget){
    boundaryState.lastClampReason = reason;
    boundaryState.lastRawTarget = rawTarget ? { x: rawTarget.x, y: rawTarget.y || 0, z: rawTarget.z } : null;
    boundaryState.lastSafeTarget = safeTarget ? { x: safeTarget.x, y: safeTarget.y || 0, z: safeTarget.z } : null;
    window.SVR_MOVEMENT_BOUNDARY_STATE = boundaryState;
  }

  function isInsideMainTableXZ(x, z){
    const dx = x - MAIN_TABLE_CENTER_X;
    const dz = z - MAIN_TABLE_CENTER_Z;
    return Math.hypot(dx, dz) < MAIN_TABLE_BLOCK_RADIUS;
  }

  function pushOutsideMainTable(target, reason = "table-boundary"){
    const raw = target.clone ? target.clone() : new THREE.Vector3(target.x, target.y || 0, target.z);
    let x = THREE.MathUtils.clamp(raw.x, -roomClamp, roomClamp);
    let z = THREE.MathUtils.clamp(raw.z, -roomClamp, roomClamp);
    const dx = x - MAIN_TABLE_CENTER_X;
    const dz = z - MAIN_TABLE_CENTER_Z;
    const dist = Math.hypot(dx, dz);
    let safe = false;

    if (dist < MAIN_TABLE_BLOCK_RADIUS){
      const dirX = dist > 0.001 ? dx / dist : 0;
      const dirZ = dist > 0.001 ? dz / dist : 1;
      x = THREE.MathUtils.clamp(MAIN_TABLE_CENTER_X + dirX * MAIN_TABLE_ESCAPE_RADIUS, -roomClamp, roomClamp);
      z = THREE.MathUtils.clamp(MAIN_TABLE_CENTER_Z + dirZ * MAIN_TABLE_ESCAPE_RADIUS, -roomClamp, roomClamp);
      safe = true;
    }

    const out = new THREE.Vector3(x, 0, z);
    updateBoundary(safe ? reason : "clear", raw, out);
    return out;
  }

  function clampFloorY(y){
    const nextY = THREE.MathUtils.clamp(Number.isFinite(y) ? y : 0, SAFE_FLOOR_MIN_Y, SAFE_FLOOR_MAX_Y);
    if (nextY !== y){
      boundaryState.lastClampReason = "floor-y-clamp";
      window.SVR_MOVEMENT_BOUNDARY_STATE = boundaryState;
    }
    return nextY;
  }

  function menusOpen(){ return !!window.SVR_HOLOGRAM_MENU_STATE?.visible; }

  function applyReferenceSpace(){
    if (!baseRefSpace || !renderer?.xr?.isPresenting) return false;
    try{
      playerY = clampFloorY(playerY);
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

  function setPlayerPose(x, y, z){
    playerX = THREE.MathUtils.clamp(x, -roomClamp, roomClamp);
    playerY = clampFloorY(y);
    playerZ = THREE.MathUtils.clamp(z, -roomClamp, roomClamp);
    updateBoundary("direct-pose-preserved", new THREE.Vector3(x, y || 0, z), new THREE.Vector3(playerX, playerY, playerZ));
    return applyReferenceSpace();
  }

  function setPlayerXZ(x, z){
    const safe = pushOutsideMainTable(new THREE.Vector3(x, 0, z), "right-stick-table-boundary");
    playerX = safe.x;
    playerZ = safe.z;
    return applyReferenceSpace();
  }

  function getPlayerPose(){ return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw }; }
  function setPlayerYaw(nextYaw){ playerYaw = nextYaw; return applyReferenceSpace(); }

  function setMarkerGlow(on){ ringMat.emissiveIntensity = on ? 2.4 : 0.0; markerGlow.intensity = on ? 3.4 : 0.0; }

  function clearMarker(){
    pointer.visible = false;
    ring.visible = false;
    setMarkerGlow(false);
    stableTargetMs = 0;
    lastAimValid = false;
    calibration.valid = false;
    calibration.target = null;
  }

  function fullOff(reason = "off"){
    mode = false;
    active = null;
    activeMode = "hand";
    pinchHoldStart = 0;
    triggerHoldStart = 0;
    stableTargetMs = 0;
    lastAimValid = false;
    clearMarker();
    calibration.lastTeleportResult = reason;
    setActiveTeleportState("OFF", "none", "none", "off");
  }

  function armTeleport(nextActive, nextMode, reason){
    active = nextActive;
    activeMode = nextMode;
    mode = !!active;
    pinchHoldStart = 0;
    triggerHoldStart = 0;
    stableTargetMs = 0;
    lastAimValid = false;
    calibration.lastTeleportResult = reason;
    setActiveTeleportState(nextMode === "controller" ? "AIMING" : "FIST_ARMED", handLabel(active), sourceLabelFor(active), "purple");
  }

  function clampTarget(p){
    return pushOutsideMainTable(p, "teleport-target-table-boundary");
  }

  function updateDebug(){
    if (!debug) return;
    const show = new URLSearchParams(location.search).has("tpdebug") || (calibration.source !== "none" && calibration.valid === false);
    debug.style.display = show ? "block" : "none";
    if (!show) return;
    debug.textContent = [
      PHASE,
      `state=${calibration.state} glow=${calibration.glow} active=${calibration.activeTeleportHand}`,
      `src=${calibration.source} valid=${calibration.valid}`,
      `stick x=${calibration.rightStick.x.toFixed(2)} y=${calibration.rightStick.y.toFixed(2)}`,
      `target ${calibration.target ? `${calibration.target.x.toFixed(2)},${calibration.target.z.toFixed(2)}` : "none"}`,
      `boundary=${boundaryState.lastClampReason}`,
      `last=${calibration.lastTeleportResult}`
    ].join("\n");
  }

  function teleportByDelta(target){
    if (!renderer?.xr?.isPresenting || !baseRefSpace) return false;
    if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.z)) return false;
    try{
      const safeTarget = pushOutsideMainTable(target, "teleport-commit-table-boundary");
      const xrCam = renderer.xr.getCamera(camera);
      if (!xrCam) return false;
      xrCam.getWorldPosition(head);
      const dx = safeTarget.x - head.x;
      const dz = safeTarget.z - head.z;
      const prev = { x: playerX, y: playerY, z: playerZ, yaw: playerYaw };
      playerX += dx;
      playerZ += dz;
      playerY = clampFloorY(playerY);
      const postSafe = pushOutsideMainTable(new THREE.Vector3(playerX, 0, playerZ), "teleport-post-table-boundary");
      playerX = postSafe.x;
      playerZ = postSafe.z;
      if (!applyReferenceSpace()){
        playerX = prev.x; playerY = prev.y; playerZ = prev.z; playerYaw = prev.yaw;
        applyReferenceSpace();
        calibration.lastTeleportResult = "rollback";
        return false;
      }
      calibration.lastTeleportResult = isInsideMainTableXZ(target.x, target.z) ? "teleported-boundary-adjusted" : "teleported";
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

  function getRightStick(gp){
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
    return getButtonPressed(gp, 2) || getButtonPressed(gp, 3);
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
    return dist < 0.43 && relativeY > -0.36 && relativeY < 0.30 && Math.abs(relativeZ) < 0.42;
  }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(controllerOrigin);
    controller.getWorldQuaternion(yawQuat);
    controllerDir.set(0, 0, -1).applyQuaternion(yawQuat);

    const xrCam = renderer.xr.getCamera(camera);
    xrCam?.getWorldDirection(camFlat);
    camFlat.y = 0;
    controllerFlat.copy(controllerDir);
    controllerFlat.y = 0;
    if (camFlat.lengthSq() > 1e-5 && controllerFlat.lengthSq() > 1e-5){
      if (controllerFlat.normalize().dot(camFlat.normalize()) < -0.20){
        controllerDir.x *= -1;
        controllerDir.z *= -1;
      }
    }
    if (controllerDir.y > -0.08) controllerDir.y = -0.08;
    controllerDir.normalize();
    calibration.rayDirection = { x: controllerDir.x, y: controllerDir.y, z: controllerDir.z };
    const t = controllerOrigin.y / (-controllerDir.y);
    if (!isFinite(t) || t < 0.12){ calibration.valid = false; calibration.target = null; return null; }
    const rawTarget = new THREE.Vector3(
      controllerOrigin.x + controllerDir.x * Math.min(t, 160),
      0,
      controllerOrigin.z + controllerDir.z * Math.min(t, 160)
    );
    const target = clampTarget(rawTarget);
    calibration.valid = true;
    calibration.target = { x: target.x, y: 0, z: target.z };
    return target;
  }

  function toggleMode(preferred = "right"){
    if (mode){
      fullOff("manual-toggle-off");
      return false;
    }
    const preferredController = preferred === "left" ? leftControllerRef : rightControllerRef;
    const fallbackController = preferred === "left" ? rightControllerRef : leftControllerRef;
    const preferredHand = preferred === "left" ? leftHandRef : rightHandRef;
    const fallbackHand = preferred === "left" ? rightHandRef : leftHandRef;
    const next = preferredController?.joints ? preferredController : fallbackController?.joints ? fallbackController : preferredHand?.joints ? preferredHand : fallbackHand?.joints ? fallbackHand : null;
    const nextMode = next === leftControllerRef || next === rightControllerRef ? "controller" : "hand";
    armTeleport(next, nextMode, "manual-toggle-on");
    cooldownUntil = performance.now() + 160;
    return mode;
  }

  async function onSessionStart(){
    const session = renderer.xr.getSession();
    if (!session) return;
    baseRefSpace = await session.requestReferenceSpace("local-floor");
    playerYaw = 0;
    setPlayerPose(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
    fullOff("session-started");
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
    setPlayerXZ(playerX + stepX, playerZ + stepZ);
    lastInputSummary = `right stick ${moveY < 0 ? "forward" : "back"}`;
  }

  function updatePublicState(extra = {}){
    window.SVR_PHASE142_CONTROLLER_INPUT = {
      phase: PHASE,
      teleportMode: mode,
      activeMode,
      activeHand: handLabel(active),
      pose: getPlayerPose(),
      input: lastInputSummary,
      calibration,
      movementBoundary: boundaryState,
      ...extra
    };
    window.SVR_PHASE103_CONTROLLER_INPUT = window.SVR_PHASE142_CONTROLLER_INPUT;
    window.SVR_TELEPORT_CALIBRATION = calibration;
    window.SVR_MOVEMENT_BOUNDARY_STATE = boundaryState;
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
      lastInputSummary = commitReason;
      calibration.lastTeleportResult = commitReason;
      const commitLabel = calibration.lastTeleportResult || commitReason;
      fullOff(commitReason);
      window.SVR_ACTIVE_TELEPORT_HAND.lastCommit = commitLabel;
      setActiveTeleportState("OFF", "none", "none", "off", commitLabel);
      return true;
    }
    fullOff("teleport-failed-safe-reset");
    return false;
  }

  function processControllerButtons(now){
    const leftToggle = controllerTogglePressed(leftControllerRef);
    const rightToggle = controllerTogglePressed(rightControllerRef);

    if (leftToggle && !lastLeftToggle && now > cooldownUntil){
      if (mode && active === leftControllerRef) fullOff("left-controller-toggle-off");
      else armTeleport(leftControllerRef || rightControllerRef, "controller", "left-controller-toggle-on");
      cooldownUntil = now + 260;
    }
    if (rightToggle && !lastRightToggle && now > cooldownUntil){
      if (mode && active === rightControllerRef) fullOff("right-controller-toggle-off");
      else armTeleport(rightControllerRef || leftControllerRef, "controller", "right-controller-toggle-on");
      cooldownUntil = now + 260;
    }
    lastLeftToggle = leftToggle;
    lastRightToggle = rightToggle;
  }

  function processFistToggle(now){
    if (leftControllerRef?.joints || rightControllerRef?.joints || menusOpen()){
      lastLeftFist = false;
      lastRightFist = false;
      return;
    }

    const leftFist = !!leftHandRef?.joints && handNearFace(leftHandRef) && isFist(leftHandRef);
    const rightFist = !!rightHandRef?.joints && handNearFace(rightHandRef) && isFist(rightHandRef);

    if (leftFist && !lastLeftFist && now > cooldownUntil){
      if (mode && active === leftHandRef) fullOff("left-fist-toggle-off");
      else armTeleport(leftHandRef, "hand", "left-fist-toggle-on");
      cooldownUntil = now + FIST_TOGGLE_COOLDOWN_MS;
    }
    if (rightFist && !lastRightFist && now > cooldownUntil){
      if (mode && active === rightHandRef) fullOff("right-fist-toggle-off");
      else armTeleport(rightHandRef, "hand", "right-fist-toggle-on");
      cooldownUntil = now + FIST_TOGGLE_COOLDOWN_MS;
    }

    lastLeftFist = leftFist;
    lastRightFist = rightFist;
  }

  function update({ dt = 0.016, leftHand, rightHand, leftController, rightController, statusCb = ()=>{}, modeCb = ()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand;
    rightHandRef = rightHand;
    leftControllerRef = leftController;
    rightControllerRef = rightController;

    if (renderer?.xr?.isPresenting && rightControllerRef) movePlayerFromControllers(dt);
    processControllerButtons(now);
    processFistToggle(now);

    if (!mode && renderer?.xr?.isPresenting && (leftControllerRef || rightControllerRef)){
      const rightHeld = controllerTeleportHoldValue(rightControllerRef) > 0.22;
      const leftHeld = controllerTeleportHoldValue(leftControllerRef) > 0.22;
      if ((rightHeld || leftHeld) && now > cooldownUntil){
        const selected = rightHeld ? rightControllerRef : leftControllerRef;
        if (selected?.joints){
          armTeleport(selected, "controller", `${controllerInputName(selected)}-hold-aim-on`);
          triggerHoldStart = now;
        }
      }
    }

    if (!leftHandRef?.joints && !rightHandRef?.joints && !leftControllerRef?.joints && !rightControllerRef?.joints){
      fullOff("tracking-lost-safe-cancel");
      statusCb("Waiting for hands or controllers…");
      modeCb("Input: not tracked");
      updatePublicState({ tracked: false });
      return;
    }

    if (menusOpen() && activeMode === "hand" && mode) fullOff("menu-open-teleport-paused");
    if (mode && activeMode === "hand" && !active?.joints) fullOff("active-hand-lost-safe-cancel");
    if (mode && activeMode === "controller" && !active?.joints) fullOff("controller-lost-safe-cancel");

    if (!mode || !active){
      clearMarker();
      setActiveTeleportState("OFF", "none", "none", "off");
      const idleMsg = (leftControllerRef || rightControllerRef)
        ? "Controllers ready • right stick move/snap • hold A/grip/trigger to aim TP • B/Y toggles OFF"
        : "TELEPORT OFF • look at fist and clench to turn ON";
      statusCb(idleMsg);
      modeCb((leftControllerRef || rightControllerRef) ? "Quest controller fallback ready" : "Hands ready • look-at-fist toggle");
      updatePublicState({ tracked: true });
      return;
    }

    setMarkerGlow(true);
    let aim = null;
    if (activeMode === "controller"){
      aim = controllerAimPoint(active);
    } else {
      calibration.source = `${handLabel(active)}-two-finger`;
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
      setActiveTeleportState(activeMode === "controller" ? "AIMING" : "FIST_ARMED", handLabel(active), sourceLabelFor(active), "purple");
      statusCb(activeMode === "controller"
        ? "CONTROLLER TP ON • point down/forward • release hold to teleport • B/Y off"
        : "FIST TP ON • bright purple hand active • two-finger point to aim • clench again near face to turn OFF");
      modeCb(activeMode === "controller" ? "Controller teleport ON" : "Fist teleport ON");
      updatePublicState({ aimValid: false });
      return;
    }

    const target = clampTarget(aim);
    if (!lastAimValid){
      smoothedTarget.copy(target);
      stableTargetMs = 0;
    } else {
      const jitter = smoothedTarget.distanceTo(target);
      stableTargetMs = jitter < 0.24 ? (stableTargetMs + dt * 1000) : 0;
      smoothedTarget.lerp(target, jitter < 0.38 ? FAST_AIM_LERP_STABLE : FAST_AIM_LERP_MOVING);
    }
    lastAimValid = true;

    pointer.visible = true;
    ring.visible = true;
    pointer.position.copy(smoothedTarget).setY(0.018);
    ring.position.copy(smoothedTarget).setY(0.015);
    markerGlow.position.copy(smoothedTarget).setY(0.34);
    calibration.valid = true;
    calibration.target = { x: smoothedTarget.x, y: 0, z: smoothedTarget.z };
    setActiveTeleportState(stableTargetMs > HAND_TARGET_STABLE_MS ? "VALID_TARGET" : "AIMING", handLabel(active), sourceLabelFor(active), "purple");

    if (activeMode === "controller"){
      const hold = controllerTeleportHoldValue(active);
      if (hold > 0.22 && !active.userData._wasTeleportHeld) triggerHoldStart = now;
      const held = triggerHoldStart ? (now - triggerHoldStart) : 0;
      if (active.userData._wasTeleportHeld && hold <= 0.12 && held > 120 && stableTargetMs > HAND_TARGET_STABLE_MS && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
        if (commitTeleport(smoothedTarget, "controller-release-teleported")) return;
      }
      if (hold <= 0.12) triggerHoldStart = 0;
      active.userData._wasTeleportHeld = hold > 0.22;
      statusCb(`CONTROLLER TP ON • ${controllerInputName(active)} release teleports • B/Y off`);
      modeCb("Controller teleport ON");
      updatePublicState({ aimValid: true, holdValue: hold, stableTargetMs: Math.floor(stableTargetMs) });
      return;
    }

    const threePinch = isThreeFingerPinch(active);
    if (active.userData._wasThreeFingerPinch === undefined) active.userData._wasThreeFingerPinch = false;
    if (threePinch && !active.userData._wasThreeFingerPinch) pinchHoldStart = now;
    if (!threePinch) pinchHoldStart = 0;
    const held = pinchHoldStart ? (now - pinchHoldStart) : 0;

    if (threePinch && held > HAND_PINCH_MIN_HOLD_MS && stableTargetMs > HAND_TARGET_STABLE_MS && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      active.userData._wasThreeFingerPinch = true;
      if (commitTeleport(smoothedTarget, "three-finger-pinch-teleported")){
        updatePublicState({ aimValid: true, threeFingerPinch: true, stableTargetMs: Math.floor(stableTargetMs), freezeGuard: "committed-off" });
        return;
      }
    }

    active.userData._wasThreeFingerPinch = threePinch;
    statusCb(threePinch ? "Pinch detected • teleporting when stable" : "FIST TP ON • aim with two fingers • pinch to teleport • clench near face again for OFF");
    modeCb("Fist teleport ON");
    updatePublicState({ aimValid: true, threeFingerPinch: threePinch, stableTargetMs: Math.floor(stableTargetMs) });
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
    getState: ()=>({ mode, activeHand: handLabel(active), activeMode, phase: PHASE, input: lastInputSummary, calibration, movementBoundary: boundaryState })
  };
}
