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
  let fistHoldStart = 0;
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

  const head = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
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

  function getStick(gp, side = "left") {
    if (!gp?.axes?.length) return { x: 0, y: 0 };
    const axes = gp.axes;
    let x = 0, y = 0;
    if (axes.length >= 4) {
      if (side === "right") {
        x = axes[2] || 0;
        y = axes[3] || 0;
        if (Math.abs(x) < 0.001 && Math.abs(y) < 0.001) {
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

  function controllerTogglePressed(proxy){
    const gp = controllerGamepad(proxy);
    if (!gp) return false;
    return getButtonValue(gp, 4) > 0.55 || getButtonValue(gp, 5) > 0.55 || getButtonValue(gp, 3) > 0.75;
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
    return dist < 0.48 && relativeY > -0.34 && relativeY < 0.28 && Math.abs(relativeZ) < 0.42;
  }

  function controllerTriggerValue(proxy){
    const gp = controllerGamepad(proxy);
    return getButtonValue(gp, 0);
  }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(controllerOrigin);
    controller.getWorldDirection(controllerDir);
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

  function toggleMode(preferred = "right"){
    mode = !mode;
    if (!mode){
      active = null;
      activeMode = "hand";
      pinchHoldStart = 0;
      triggerHoldStart = 0;
      fistHoldStart = 0;
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

  function bestStick(...sticks){
    let best = { x: 0, y: 0 };
    let bestMag = 0;
    for (const stick of sticks){
      const mag = Math.hypot(stick?.x || 0, stick?.y || 0);
      if (mag > bestMag){
        best = stick;
        bestMag = mag;
      }
    }
    return { ...best, mag: bestMag };
  }

  function movePlayerFromControllers(dt){
    const leftGp = controllerGamepad(leftControllerRef);
    const rightGp = controllerGamepad(rightControllerRef);

    // Phase 101: accept either controller and either common WebXR axis layout.
    // This prevents Quest/browser variations from killing forward/back movement.
    const moveStick = bestStick(
      getStick(leftGp, "left"),
      getStick(leftGp, "right"),
      getStick(rightGp, "left"),
      getStick(rightGp, "right")
    );
    const turnStick = bestStick(
      getStick(rightGp, "right"),
      getStick(rightGp, "left"),
      getStick(leftGp, "right"),
      getStick(leftGp, "left")
    );

    if (Math.abs(turnStick.x) > 0.72 && performance.now() > snapCooldownUntil){
      playerYaw += Math.sign(turnStick.x) * (Math.PI / 4);
      applyReferenceSpace();
      snapCooldownUntil = performance.now() + 220;
    }

    if (moveStick.mag < 0.12) return;

    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldDirection(headDir);
    headDir.y = 0;
    if (headDir.lengthSq() < 1e-5) headDir.set(0, 0, -1);
    headDir.normalize();
    const rightDir = new THREE.Vector3(headDir.z, 0, -headDir.x).normalize();
    const speed = 2.8;
    const stepX = (rightDir.x * moveStick.x + headDir.x * (-moveStick.y)) * speed * dt;
    const stepZ = (rightDir.z * moveStick.x + headDir.z * (-moveStick.y)) * speed * dt;
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

    // Phase 100: preserve hand fist/pinch teleport even when Quest controllers are present as fallback.
    // Earlier builds disabled fist activation whenever controller proxies existed, which broke hand-tracking teleport.
    const leftFist = !!leftHandRef?.joints && handNearFace(leftHandRef) && isFist(leftHandRef);
    const rightFist = !!rightHandRef?.joints && handNearFace(rightHandRef) && isFist(rightHandRef);
    if (leftFist && !lastLeftFistToggle && now > cooldownUntil){
      mode = !(mode && active === leftHandRef);
      active = mode ? leftHandRef : null;
      activeMode = 'hand';
      cooldownUntil = now + 260;
      pinchHoldStart = 0;
      triggerHoldStart = 0;
      fistHoldStart = now;
      if (leftHandRef) leftHandRef.userData._wasFist = true;
    }
    if (rightFist && !lastRightFistToggle && now > cooldownUntil){
      mode = !(mode && active === rightHandRef);
      active = mode ? rightHandRef : null;
      activeMode = 'hand';
      cooldownUntil = now + 260;
      pinchHoldStart = 0;
      triggerHoldStart = 0;
      fistHoldStart = now;
      if (rightHandRef) rightHandRef.userData._wasFist = true;
    }
    lastLeftFistToggle = leftFist;
    lastRightFistToggle = rightFist;

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
        ? "Controllers active • left stick move • right stick snap turn • A/X teleport"
        : "TELEPORT OFF • close fist by face to arm; release fist to jump";
      statusCb(idleMsg);
      modeCb((leftControllerRef || rightControllerRef) ? "Controllers ready" : "Hands ready • close fist by face arms TP");
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
      statusCb(activeMode === "controller" ? "CONTROLLER TP ON • hold trigger then release" : "HAND TP ON • close fist glows / release fist to teleport");
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
      statusCb("CONTROLLER TP ON • hold trigger then release");
      return;
    }

    // Phase 102: closed-fist teleport now works as hold-to-aim / release-to-jump.
    // Close fist near the face once to arm TP, keep fist closed to keep the target glowing, release fist to teleport.
    const fist = isFist(active);
    if (active.userData._wasFist === undefined) active.userData._wasFist = false;
    if (fist && !active.userData._wasFist) fistHoldStart = now;
    const fistHeld = fistHoldStart ? (now - fistHoldStart) : 0;
    if (fist){
      ringMat.color.setHex(0x00ffd8);
      ringMat.emissive.setHex(0x00ffd8);
      markerGlow.color.setHex(0x00ffd8);
      markerGlow.intensity = 3.1;
      statusCb("FIST TP GLOW • keep fist closed to aim • release fist to teleport");
      modeCb("Hands: FIST TELEPORT GLOW");
    }
    if (active.userData._wasFist && !fist && fistHeld > 260 && stableTargetMs > 90 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      const ok = teleportByDelta(smoothedTarget);
      if (ok){
        lastTP = now + 220;
        cooldownUntil = now + 260;
        mode = false;
        active = null;
        fistHoldStart = 0;
        pinchHoldStart = 0;
        stableTargetMs = 0;
        lastAimValid = false;
        pointer.visible = false;
        ring.visible = false;
        hideArc();
        setGlow(false);
        statusCb("FIST TELEPORT RELEASED");
      } else {
        cooldownUntil = now + 180;
        fistHoldStart = 0;
        stableTargetMs = 0;
        statusCb("FIST TELEPORT RESET • aim again");
      }
    }
    if (!fist && !active.userData._wasFist) fistHoldStart = 0;
    active.userData._wasFist = fist;

    const pinch = isPinching(active);
    if (!fist){
      ringMat.color.setHex(0xb48cff);
      ringMat.emissive.setHex(0x2a0d3a);
      markerGlow.color.setHex(0xb48cff);
    }
    if (active.userData._wasPinching === undefined) active.userData._wasPinching = false;
    if (pinch && !active.userData._wasPinching) pinchHoldStart = now;
    const held = pinchHoldStart ? (now - pinchHoldStart) : 0;
    if (active.userData._wasPinching && !pinch && held > 240 && stableTargetMs > 140 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      const ok = teleportByDelta(smoothedTarget);
      if (ok){
        lastTP = now + 220;
        cooldownUntil = now + 260;
        mode = false;
        active = null;
        pinchHoldStart = 0;
        stableTargetMs = 0;
        lastAimValid = false;
        pointer.visible = false;
        ring.visible = false;
        hideArc();
        setGlow(false);
      } else {
        cooldownUntil = now + 180;
        pinchHoldStart = 0;
        stableTargetMs = 0;
        statusCb("TELEPORT RESET • aim again");
      }
    }
    if (!pinch) pinchHoldStart = 0;
    active.userData._wasPinching = pinch;
    modeCb("Hands: TELEPORT ON");
    statusCb("HAND TP ON • fist/chinch toggles • pinch-hold/release teleports");
  }

  return { onSessionStart, setLogoTexture, update, setPlayerPose, setPlayerXZ, getPlayerPose, setPlayerYaw, toggleMode, getState: ()=>({ mode, activeHand: active === rightHandRef || active === rightControllerRef ? "right" : active === leftHandRef || active === leftControllerRef ? "left" : "none", activeMode }) };
}
