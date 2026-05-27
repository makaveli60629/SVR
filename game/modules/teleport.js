import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist, aimPoint } from "./gestures.js";

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
    ringMat.emissiveIntensity = on ? 1.3 : 0.0;
    markerGlow.intensity = on ? 2.2 : 0.0;
  }

  let mode = false;
  let active = null;
  let activeMode = "hand";
  let cooldownUntil = 0;
  let lastTP = 0;
  let pinchHoldStart = 0;
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
  let leftFaceGestureArmed = true;
  let rightFaceGestureArmed = true;
  const inputState = {
    build: "PHASE-253-FORWARD-RESTORE-LOCOMOTION-KIOSK-POKER-LOCK",
    phase: 253,
    rightStickMove: true,
    rightStickTurn: true,
    fistTeleport: true,
    leftAxes: [],
    rightAxes: [],
    leftStick: { x: 0, y: 0, pair: [0, 1], source: "left" },
    rightStick: { x: 0, y: 0, pair: [2, 3], source: "right" },
    move: { x: 0, y: 0, source: "idle" },
    lastUpdatedAt: 0
  };

  const handTeleportState = {
    build: "PHASE-253-FORWARD-RESTORE-LOCOMOTION-KIOSK-POKER-LOCK",
    phase: 253,
    mode: "face-toggle-point-pinch",
    active: false,
    nearFace: false,
    aimValid: false,
    stableTargetMs: 0,
    target: null,
    lastAction: "ready",
    lastUpdatedAt: 0
  };

  const head = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const controllerQuat = new THREE.Quaternion();
  const controllerFlat = new THREE.Vector3();
  const tmpHead = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);

  function clampTarget(p){
    return new THREE.Vector3(
      THREE.MathUtils.clamp(p.x, -roomClamp, roomClamp),
      0,
      THREE.MathUtils.clamp(p.z, -roomClamp, roomClamp)
    );
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

  function deadzone(v, min = 0.14){
    return Math.abs(v || 0) < min ? 0 : (v || 0);
  }

  function axisPair(gp, pair, source = "unknown"){
    const axes = gp?.axes || [];
    const x = deadzone(axes[pair[0]] || 0);
    const y = deadzone(axes[pair[1]] || 0);
    return { x, y, pair, source, mag: Math.hypot(x, y) };
  }

  function bestStick(gp, side = "left"){
    if (!gp?.axes?.length) return { x: 0, y: 0, pair: [0, 1], source: side, mag: 0 };
    const pairs = gp.axes.length >= 4
      ? (side === "right" ? [[2,3], [0,1]] : [[0,1], [2,3]])
      : [[0,1]];
    const sticks = pairs.map(pair => axisPair(gp, pair, side));
    sticks.sort((a,b)=> b.mag - a.mag);
    const chosen = sticks[0] || { x: 0, y: 0, pair: [0,1], source: side, mag: 0 };
    return { x: chosen.x, y: chosen.y, pair: chosen.pair, source: side, mag: chosen.mag };
  }

  function getStick(gp, side = "left") {
    return bestStick(gp, side);
  }

  function getButtonValue(gp, idx){
    return gp?.buttons?.[idx]?.value || 0;
  }

  function controllerTogglePressed(_proxy){
    // Disabled by Phase 252. Controller teleport is hold-to-aim/release-to-jump only.
    // This prevents A/grip from toggling the teleport logo off before the teleport completes.
    return false;
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

  function controllerTriggerValue(proxy){
    const gp = controllerGamepad(proxy);
    if (!gp) return 0;
    // Quest lock: trigger, A/B, or grip can hold the controller teleport aim.
    // Release of the same hold finishes the teleport instead of toggling the logo off.
    return Math.max(
      getButtonValue(gp, 0), // trigger
      getButtonValue(gp, 1),
      getButtonValue(gp, 3), // A/B on common Quest mappings
      getButtonValue(gp, 4), // grip fallback
      getButtonValue(gp, 5)
    );
  }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller || proxy;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(controllerOrigin);
    controller.getWorldQuaternion(controllerQuat);

    // WebXR controller beams should use the controller -Z axis. If a browser flips it
    // behind the user, blend it back to headset-forward so the marker stays in front.
    controllerDir.set(0, 0, -1).applyQuaternion(controllerQuat).normalize();
    const xrCam = renderer.xr.getCamera(camera);
    if (xrCam){
      xrCam.getWorldPosition(tmpHead);
      xrCam.getWorldDirection(headDir);
      headDir.y = 0;
      if (headDir.lengthSq() < 1e-5) headDir.set(0, 0, -1);
      headDir.normalize();

      controllerFlat.copy(controllerDir);
      controllerFlat.y = 0;
      if (controllerFlat.lengthSq() > 1e-5) controllerFlat.normalize();
      const pointsBehindUser = controllerFlat.lengthSq() > 0 && controllerFlat.dot(headDir) < -0.18;
      const originBehindHead = controllerOrigin.clone().sub(tmpHead).dot(headDir) < -0.28;
      if (pointsBehindUser || originBehindHead){
        controllerOrigin.copy(tmpHead).addScaledVector(headDir, 0.34).setY(Math.max(0.9, tmpHead.y - 0.18));
        controllerDir.copy(headDir).multiplyScalar(0.86);
        controllerDir.y = -0.36;
        controllerDir.normalize();
      } else {
        controllerOrigin.addScaledVector(controllerDir, 0.18);
      }
    }

    if (controllerDir.y > -0.08) controllerDir.y = -0.08;
    controllerDir.normalize();
    const t = (controllerOrigin.y - 0.0) / (-controllerDir.y);
    if (!isFinite(t) || t < 0.12) return null;
    return new THREE.Vector3(
      controllerOrigin.x + controllerDir.x * Math.min(t, 160),
      0,
      controllerOrigin.z + controllerDir.z * Math.min(t, 160)
    );
  }


  function publishHandTeleportState(extra = {}){
    const target = lastAimValid ? smoothedTarget : null;
    handTeleportState.active = !!(mode && activeMode === "hand");
    handTeleportState.aimValid = !!lastAimValid;
    handTeleportState.stableTargetMs = stableTargetMs;
    handTeleportState.target = target ? { x: Number(target.x.toFixed(3)), y: 0, z: Number(target.z.toFixed(3)) } : null;
    handTeleportState.lastUpdatedAt = performance.now();
    Object.assign(handTeleportState, extra);
    window.SVR_HAND_TELEPORT_STATE = { ...handTeleportState };
    window.dispatchEvent(new CustomEvent("svr_hand_teleport_state_update", { detail: window.SVR_HAND_TELEPORT_STATE }));
    return window.SVR_HAND_TELEPORT_STATE;
  }

  function resetTeleportVisuals(){
    pinchHoldStart = 0;
    triggerHoldStart = 0;
    stableTargetMs = 0;
    lastAimValid = false;
    pointer.visible = false;
    ring.visible = false;
    hideArc();
    setGlow(false);
  }

  function clearTeleportMode(){
    mode = false;
    active = null;
    activeMode = "hand";
    resetTeleportVisuals();
    publishHandTeleportState({ active: false, nearFace: false, aimValid: false, target: null, lastAction: "off" });
  }


  function watchInteractionActive(now = performance.now()){
    const st = window.SVR_WATCH_INTERACTION_STATE;
    if (!st || !st.visible) return false;
    if (st.interacting || st.pinching || st.hoveredId || st.nearScreen) return true;
    return Number(st.lockUntil || 0) > now;
  }

  function suspendTeleportForWatch(statusCb = ()=>{}, modeCb = ()=>{}){
    pointer.visible = false;
    ring.visible = false;
    hideArc();
    setGlow(false);
    stableTargetMs = 0;
    lastAimValid = false;
    pinchHoldStart = 0;
    triggerHoldStart = 0;
    publishHandTeleportState?.({ lastAction: "watch-paused", aimValid: false, target: null });
    statusCb("WATCH ACTIVE • teleport paused");
    modeCb("Watch interaction guard");
  }

  function toggleMode(preferred = "right"){
    mode = !mode;
    if (!mode){
      clearTeleportMode();
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
    return mode;
  }

  async function onSessionStart(){
    const session = renderer.xr.getSession();
    if (!session) return;
    baseRefSpace = await session.requestReferenceSpace("local-floor");
    playerYaw = 0;
    setPlayerPose(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
    mode = false;
    active = null;
    activeMode = "hand";
    pointer.visible = false;
    ring.visible = false;
    hideArc();
    setGlow(false);
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
    const rightStick = getStick(rightGp || leftGp, "right");
    const rightFallback = getStick(rightGp, "left");

    // Quest lock: prefer the physical right controller vertical axis for forward/back.
    // Some browsers expose the right thumbstick on axes [2,3], others on [0,1].
    const calibratedRightY = Math.abs(rightStick.y) >= Math.abs(rightFallback.y) ? rightStick.y : rightFallback.y;
    const calibratedRightX = Math.abs(rightStick.x) >= Math.abs(rightFallback.x) ? rightStick.x : rightFallback.x;

    inputState.leftAxes = Array.from(leftGp?.axes || []);
    inputState.rightAxes = Array.from(rightGp?.axes || []);
    inputState.leftStick = leftStick;
    inputState.rightStick = { ...rightStick, fallbackPair: rightFallback.pair, calibratedX: calibratedRightX, calibratedY: calibratedRightY };
    inputState.lastUpdatedAt = performance.now();
    window.SVR_TELEPORT_INPUT_STATE = inputState;

    // Right stick X remains 45-degree snap turn.
    if (Math.abs(calibratedRightX) > 0.72 && performance.now() > snapCooldownUntil){
      playerYaw += Math.sign(calibratedRightX) * (Math.PI / 4);
      applyReferenceSpace();
      snapCooldownUntil = performance.now() + 220;
    }

    // Movement lock: left stick works, and right-stick Y always moves forward/back when used.
    const moveX = Math.abs(leftStick.x) > 0.12 ? leftStick.x : 0;
    const moveY = Math.abs(calibratedRightY) > 0.12 ? calibratedRightY : leftStick.y;
    const moveSource = Math.abs(calibratedRightY) > 0.12 ? "right-stick-y" : (Math.abs(leftStick.y) > 0.12 || Math.abs(leftStick.x) > 0.12 ? "left-stick" : "idle");
    inputState.move = { x: moveX, y: moveY, source: moveSource };

    const mag = Math.hypot(moveX, moveY);
    if (mag < 0.12) return;

    // Quest forward lock: after a 45-degree snap turn, stick-up must still move
    // along the player yaw, not sideways from stale headset/controller axes.
    const forwardDir = new THREE.Vector3(-Math.sin(playerYaw), 0, -Math.cos(playerYaw)).normalize();
    const rightDir = new THREE.Vector3(Math.cos(playerYaw), 0, -Math.sin(playerYaw)).normalize();
    const speed = 3.05;
    const stepX = (rightDir.x * moveX + forwardDir.x * (-moveY)) * speed * dt;
    const stepZ = (rightDir.z * moveX + forwardDir.z * (-moveY)) * speed * dt;
    const nextX = THREE.MathUtils.clamp(playerX + stepX, -roomClamp, roomClamp);
    const nextZ = THREE.MathUtils.clamp(playerZ + stepZ, -roomClamp, roomClamp);
    setPlayerXZ(nextX, nextZ);
  }

  function update({ dt = 0.016, leftHand, rightHand, leftController, rightController, statusCb = ()=>{}, modeCb = ()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand;
    rightHandRef = rightHand;
    leftControllerRef = leftController;
    rightControllerRef = rightController;

    if (renderer?.xr?.isPresenting && (leftControllerRef || rightControllerRef)) movePlayerFromControllers(dt);

    const leftControllerHold = controllerTriggerValue(leftControllerRef) > 0.22;
    const rightControllerHold = controllerTriggerValue(rightControllerRef) > 0.22;
    if (!watchInteractionActive(now) && (rightControllerHold || leftControllerHold) && now > cooldownUntil && !(mode && activeMode === "hand")){
      const nextActive = rightControllerHold ? rightControllerRef : leftControllerRef;
      if (nextActive){
        if (!mode || active !== nextActive || activeMode !== "controller"){
          mode = true;
          active = nextActive;
          activeMode = "controller";
          resetTeleportVisuals();
          triggerHoldStart = now;
        }
      }
    }

    const leftToggle = controllerTogglePressed(leftControllerRef);
    const rightToggle = controllerTogglePressed(rightControllerRef);
    if (leftToggle && !lastLeftToggle && now > cooldownUntil){
      mode = !(mode && active === leftControllerRef);
      active = mode ? (leftControllerRef || rightControllerRef || leftHandRef || rightHandRef) : null;
      activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand";
      cooldownUntil = now + 220;
    }
    if (rightToggle && !lastRightToggle && now > cooldownUntil){
      mode = !(mode && active === rightControllerRef);
      active = mode ? (rightControllerRef || leftControllerRef || rightHandRef || leftHandRef) : null;
      activeMode = active === rightControllerRef || active === leftControllerRef ? "controller" : "hand";
      cooldownUntil = now + 220;
    }
    lastLeftToggle = leftToggle;
    lastRightToggle = rightToggle;

    const watchGuardActive = watchInteractionActive(now);

    // Hand teleport toggle lock:
    // - ON/OFF only happens when the hand is near the face/chin.
    // - Pointing away from the face will never toggle off; it is reserved for destination selection.
    // - Watch interaction pauses teleport so the watch never freezes into a black square.
    const leftFace = !watchGuardActive && !!leftHandRef?.joints && handNearFace(leftHandRef);
    const rightFace = !watchGuardActive && !!rightHandRef?.joints && handNearFace(rightHandRef);
    const leftToggleGesture = leftFace && (isPinching(leftHandRef) || isFist(leftHandRef));
    const rightToggleGesture = rightFace && (isPinching(rightHandRef) || isFist(rightHandRef));

    if (!leftToggleGesture) leftFaceGestureArmed = true;
    if (!rightToggleGesture) rightFaceGestureArmed = true;

    if (leftToggleGesture && leftFaceGestureArmed && !lastLeftFistToggle && now > cooldownUntil){
      leftFaceGestureArmed = false;
      if (mode && activeMode === "hand" && active === leftHandRef){
        clearTeleportMode();
      } else {
        mode = true;
        active = leftHandRef;
        activeMode = "hand";
        resetTeleportVisuals();
      }
      cooldownUntil = now + 850;
    }
    if (rightToggleGesture && rightFaceGestureArmed && !lastRightFistToggle && now > cooldownUntil){
      rightFaceGestureArmed = false;
      if (mode && activeMode === "hand" && active === rightHandRef){
        clearTeleportMode();
      } else {
        mode = true;
        active = rightHandRef;
        activeMode = "hand";
        resetTeleportVisuals();
      }
      cooldownUntil = now + 850;
    }
    lastLeftFistToggle = leftToggleGesture;
    lastRightFistToggle = rightToggleGesture;

    if (!leftHandRef?.joints && !rightHandRef?.joints && !leftControllerRef?.joints && !rightControllerRef?.joints){
      pointer.visible = false;
      ring.visible = false;
      hideArc();
      setGlow(false);
      stableTargetMs = 0;
      lastAimValid = false;
      statusCb("Waiting for hands or controllers…");
      modeCb("Input: not tracked");
      return;
    }

    if (mode && activeMode === "controller" && !(active?.joints)){
      active = leftControllerRef?.joints ? leftControllerRef : rightControllerRef?.joints ? rightControllerRef : leftHandRef?.joints ? leftHandRef : rightHandRef?.joints ? rightHandRef : null;
      activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand";
    } else if (mode && activeMode === "hand" && !(active?.joints)){
      active = leftHandRef?.joints ? leftHandRef : rightHandRef?.joints ? rightHandRef : leftControllerRef?.joints ? leftControllerRef : rightControllerRef?.joints ? rightControllerRef : null;
      activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand";
    }

    if (!mode || !active){
      pointer.visible = false;
      ring.visible = false;
      hideArc();
      setGlow(false);
      stableTargetMs = 0;
      lastAimValid = false;
      const idleMsg = (leftControllerRef || rightControllerRef)
        ? "Controllers active • right stick forward/back • right stick snap turn • fist TP"
        : "TELEPORT OFF • face pinch/fist toggles ON";
      statusCb(idleMsg);
      modeCb((leftControllerRef || rightControllerRef) ? "Controllers ready • right stick moves" : "Hands ready • face pinch/fist toggles TP");
      return;
    }

    if (activeMode === "hand" && watchGuardActive){
      suspendTeleportForWatch(statusCb, modeCb);
      return;
    }

    setGlow(true);

    const aim = activeMode === "controller" ? controllerAimPoint(active) : aimPoint(active);
    if (!aim){
      pointer.visible = false;
      ring.visible = false;
      markerGlow.intensity = 0;
      stableTargetMs = 0;
      lastAimValid = false;
      if (activeMode === "controller" && controllerTriggerValue(active) <= 0.12){
        clearTeleportMode();
        statusCb("CONTROLLER TP OFF • hold A/grip/trigger to aim");
        modeCb("Controllers ready");
        return;
      }
      statusCb(activeMode === "controller" ? "CONTROLLER TP ON • hold A/grip/trigger, release to teleport" : "HAND TP ON • point and pinch");
      modeCb(activeMode === "controller" ? "Controllers: TELEPORT ON" : `Hands: TELEPORT ON`);
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

    if (activeMode === "controller"){
      const trigger = controllerTriggerValue(active);
      if (trigger > 0.22 && !active.userData._wasTrigger) triggerHoldStart = now;
      const held = triggerHoldStart ? (now - triggerHoldStart) : 0;
      if (active.userData._wasTrigger && trigger <= 0.12 && held > 140 && stableTargetMs > 120 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
        const ok = teleportByDelta(smoothedTarget);
        if (ok){
          lastTP = now + 220;
          cooldownUntil = now + 240;
          mode = false;
          active = null;
          activeMode = "controller";
          triggerHoldStart = 0;
          stableTargetMs = 0;
          lastAimValid = false;
          pointer.visible = false;
          ring.visible = false;
          hideArc();
          setGlow(false);
        }else{
          cooldownUntil = now + 180;
          triggerHoldStart = 0;
          stableTargetMs = 0;
          statusCb("TELEPORT RESET • aim again");
        }
      }
      if (trigger <= 0.12) triggerHoldStart = 0;
      active.userData._wasTrigger = trigger > 0.22;
      modeCb("Controllers: TELEPORT ON");
      statusCb("CONTROLLER TP ON • hold A/grip/trigger, release to teleport");
      return;
    }

    const pinch = isPinching(active);
    const fistHeld = isFist(active);
    const nearFace = handNearFace(active);
    const destinationPinch = pinch && !nearFace && !watchGuardActive;
    const destinationFist = false; // Phase 252: fist is face-toggle only; destination requires pointed pinch.

    if (active.userData._wasDestinationPinch === undefined) active.userData._wasDestinationPinch = false;
    if (destinationPinch && !active.userData._wasDestinationPinch) pinchHoldStart = now;
    const held = pinchHoldStart ? (now - pinchHoldStart) : 0;

    // Point-and-pinch lock:
    // A face/chin pinch toggles teleport ON/OFF.
    // A pointed pinch away from face selects the destination and teleports.
    // Release alone no longer turns teleport off.
    if (destinationPinch && held > 90 && stableTargetMs > 100 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      const ok = teleportByDelta(smoothedTarget);
      if (ok){
        lastTP = now + 220;
        cooldownUntil = now + 300;
        clearTeleportMode();
        publishHandTeleportState({ lastAction: "teleported", active: false });
        statusCb("TELEPORTED • destination accepted");
      } else {
        cooldownUntil = now + 180;
        pinchHoldStart = 0;
        stableTargetMs = 0;
        statusCb("TELEPORT RESET • point again");
      }
    }

    if (!destinationPinch) pinchHoldStart = 0;
    active.userData._wasDestinationPinch = destinationPinch;
    active.userData._wasPinching = pinch;
    active.userData._wasHandTeleportAction = destinationPinch;
    publishHandTeleportState({
      nearFace,
      destinationPinch,
      destinationFist,
      lastAction: nearFace ? "face-toggle-zone" : (lastAimValid ? "aiming-destination" : "aiming-no-target")
    });
    modeCb("Hands: TELEPORT ON");
    statusCb(nearFace ? "HAND TP ON • face pinch/fist toggles OFF" : (lastAimValid ? "DESTINATION LOCKED • pinch to teleport" : "HAND TP ON • point at floor then pinch"));
  }

  return { onSessionStart, setLogoTexture, update, setPlayerPose, setPlayerXZ, getPlayerPose, setPlayerYaw, toggleMode, getState: ()=>({ mode, activeHand: active === rightHandRef || active === rightControllerRef ? "right" : active === leftHandRef || active === leftControllerRef ? "left" : "none", activeMode, inputState: { ...inputState } }) };
}
