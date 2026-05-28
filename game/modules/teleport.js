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

  function setPlayerPose(x, y, z){ playerX = x; playerY = y; playerZ = z; return applyReferenceSpace(); }
  function setPlayerXZ(x, z){ playerX = x; playerZ = z; return applyReferenceSpace(); }
  function getPlayerPose(){ return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw }; }
  function setPlayerYaw(nextYaw){ playerYaw = nextYaw; return applyReferenceSpace(); }

  const pointer = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.POINTER_SIZE, CONFIG.POINTER_SIZE),
    new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: THREE.DoubleSide, opacity: 0.98, color: 0xffffff })
  );
  pointer.rotation.x = -Math.PI / 2;
  pointer.position.y = 0.022;
  pointer.visible = false;
  scene.add(pointer);

  const ringMat = new THREE.MeshStandardMaterial({ color: 0xb48cff, roughness: 0.22, metalness: 0.28, emissive: 0x4b17ff, emissiveIntensity: 0.0, side: THREE.DoubleSide, transparent: true, opacity: 0.94, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 72), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.020;
  ring.visible = false;
  scene.add(ring);

  const markerGlow = new THREE.PointLight(0xb48cff, 0, 7.0, 2.0);
  markerGlow.position.y = 0.45;
  scene.add(markerGlow);

  const head = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);

  let mode = false;
  let active = null;
  let activeMode = "hand";
  let leftHandRef = null;
  let rightHandRef = null;
  let leftControllerRef = null;
  let rightControllerRef = null;
  let lastAimValid = false;
  let stableTargetMs = 0;
  let snapCooldownUntil = 0;
  let lastTP = 0;
  let lastHoldSource = null;
  let lastHoldActive = false;

  function hideTarget(){
    pointer.visible = false;
    ring.visible = false;
    markerGlow.intensity = 0;
    ringMat.emissiveIntensity = 0;
    stableTargetMs = 0;
    lastAimValid = false;
  }

  function setGlow(on){
    ringMat.emissiveIntensity = on ? 1.65 : 0.0;
    markerGlow.intensity = on ? 3.2 : 0.0;
  }

  function clampTarget(p){
    const clampValue = typeof roomClamp === "number" ? roomClamp : 18;
    return new THREE.Vector3(
      THREE.MathUtils.clamp(p.x, -clampValue, clampValue),
      0,
      THREE.MathUtils.clamp(p.z, -clampValue, clampValue)
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
        playerX = prev.x; playerY = prev.y; playerZ = prev.z; playerYaw = prev.yaw;
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
    let x = axes[0] || 0;
    let y = axes[1] || 0;
    if (side === "right" && axes.length >= 4){
      const rx = axes[2] || 0;
      const ry = axes[3] || 0;
      if (Math.abs(rx) + Math.abs(ry) > Math.abs(x) + Math.abs(y) || Math.abs(rx) + Math.abs(ry) > 0.05){ x = rx; y = ry; }
    }
    if (Math.abs(x) < 0.13) x = 0;
    if (Math.abs(y) < 0.13) y = 0;
    return { x, y };
  }

  function getButtonValue(gp, idx){ return gp?.buttons?.[idx]?.value || 0; }

  function controllerHoldValue(proxy){
    const gp = controllerGamepad(proxy);
    if (!gp) return 0;
    return Math.max(
      getButtonValue(gp, 0), // trigger
      getButtonValue(gp, 1), // grip/squeeze
      getButtonValue(gp, 3), // thumbstick / auxiliary
      getButtonValue(gp, 4), // A/X on common WebXR mappings
      getButtonValue(gp, 5),
      getButtonValue(gp, 6)
    );
  }

  function handHoldValue(hand){
    if (!hand?.joints) return 0;
    return (isFist(hand) || isPinching(hand)) ? 1 : 0;
  }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(controllerOrigin);
    controller.getWorldDirection(controllerDir);
    if (controllerDir.y > -0.05) controllerDir.y = -0.18;
    controllerDir.normalize();
    const t = controllerOrigin.y / (-controllerDir.y);
    if (!Number.isFinite(t) || t < 0.08) return null;
    return new THREE.Vector3(controllerOrigin.x + controllerDir.x * Math.min(t, 140), 0, controllerOrigin.z + controllerDir.z * Math.min(t, 140));
  }

  function getActiveHoldSource(){
    const rightControllerHold = controllerHoldValue(rightControllerRef);
    const leftControllerHold = controllerHoldValue(leftControllerRef);
    const rightHandHold = handHoldValue(rightHandRef);
    const leftHandHold = handHoldValue(leftHandRef);
    if (rightControllerHold > 0.18) return { source: rightControllerRef, mode: "controller", label: "right controller" };
    if (leftControllerHold > 0.18) return { source: leftControllerRef, mode: "controller", label: "left controller" };
    if (rightHandHold > 0.5) return { source: rightHandRef, mode: "hand", label: "right fist/pinch" };
    if (leftHandHold > 0.5) return { source: leftHandRef, mode: "hand", label: "left fist/pinch" };
    return null;
  }

  function movePlayerFromControllers(dt){
    const leftGp = controllerGamepad(leftControllerRef);
    const rightGp = controllerGamepad(rightControllerRef);
    if (!leftGp && !rightGp) return;
    const leftStick = leftGp ? getStick(leftGp, "left") : { x: 0, y: 0 };
    const rightStick = rightGp ? getStick(rightGp, "right") : { x: 0, y: 0 };
    const turnX = Math.abs(rightStick.x) > 0.14 ? rightStick.x : leftStick.x;
    const moveY = Math.abs(rightStick.y) > 0.13 ? rightStick.y : leftStick.y;
    if (Math.abs(turnX) > 0.72 && performance.now() > snapCooldownUntil){
      playerYaw += Math.sign(turnX) * (Math.PI / 4);
      applyReferenceSpace();
      snapCooldownUntil = performance.now() + 240;
    }
    if (Math.abs(moveY) < 0.13) return;
    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldDirection(headDir);
    headDir.y = 0;
    if (headDir.lengthSq() < 1e-5) headDir.set(0, 0, -1);
    headDir.normalize();
    const speed = 3.05;
    const direction = -moveY; // Quest right-stick up is usually negative, so this moves forward along the headset view.
    const nextX = playerX + headDir.x * direction * speed * dt;
    const nextZ = playerZ + headDir.z * direction * speed * dt;
    const clampValue = typeof roomClamp === "number" ? roomClamp : 18;
    setPlayerXZ(THREE.MathUtils.clamp(nextX, -clampValue, clampValue), THREE.MathUtils.clamp(nextZ, -clampValue, clampValue));
  }

  function toggleMode(preferred = "right"){
    mode = !mode;
    if (!mode){ active = null; activeMode = "hand"; hideTarget(); return mode; }
    if (preferred === "left") active = leftControllerRef || leftHandRef || rightControllerRef || rightHandRef;
    else active = rightControllerRef || rightHandRef || leftControllerRef || leftHandRef;
    activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand";
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
    lastHoldSource = null;
    lastHoldActive = false;
    hideTarget();
  }

  function setLogoTexture(tex){
    if (!tex) return;
    tex.anisotropy = 8;
    pointer.material.map = tex;
    pointer.material.needsUpdate = true;
  }

  function update({ dt = 0.016, leftHand, rightHand, leftController, rightController, statusCb = ()=>{}, modeCb = ()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand;
    rightHandRef = rightHand;
    leftControllerRef = leftController;
    rightControllerRef = rightController;

    if (renderer?.xr?.isPresenting && (leftControllerRef || rightControllerRef)) movePlayerFromControllers(dt);

    const hold = getActiveHoldSource();
    const holdActive = !!hold?.source;

    if (holdActive){
      mode = true;
      active = hold.source;
      activeMode = hold.mode;
      lastHoldSource = hold.source;
    }

    if (!leftHandRef?.joints && !rightHandRef?.joints && !leftControllerRef?.joints && !rightControllerRef?.joints){
      hideTarget();
      statusCb("Waiting for hands or controllers…");
      modeCb("Input: not tracked");
      return;
    }

    if (!mode || !active){
      hideTarget();
      statusCb((leftControllerRef || rightControllerRef) ? "Controllers ready • right stick move/snap • hold A/grip/trigger to teleport" : "Hands ready • hold fist/pinch to aim teleport");
      modeCb((leftControllerRef || rightControllerRef) ? "Controllers ready" : "Hands ready");
      lastHoldActive = holdActive;
      return;
    }

    const aim = activeMode === "controller" ? controllerAimPoint(active) : aimPoint(active);
    if (aim){
      const target = clampTarget(aim);
      if (!lastAimValid){ smoothedTarget.copy(target); stableTargetMs = 0; }
      else {
        const jitter = smoothedTarget.distanceTo(target);
        stableTargetMs = jitter < 0.18 ? stableTargetMs + dt * 1000 : 0;
        smoothedTarget.lerp(target, jitter < 0.32 ? 0.38 : 0.22);
      }
      lastAimValid = true;
      pointer.visible = true;
      ring.visible = true;
      pointer.position.copy(smoothedTarget).setY(0.024);
      ring.position.copy(smoothedTarget).setY(0.020);
      markerGlow.position.copy(smoothedTarget).setY(0.40);
      setGlow(true);
    } else {
      pointer.visible = false;
      ring.visible = false;
      markerGlow.intensity = 0;
      lastAimValid = false;
      stableTargetMs = 0;
    }

    const released = lastHoldActive && !holdActive && lastHoldSource === active;
    if (released && lastAimValid && stableTargetMs > 80 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      const ok = teleportByDelta(smoothedTarget);
      if (ok) lastTP = now + 240;
      mode = false;
      active = null;
      lastHoldSource = null;
      lastHoldActive = false;
      hideTarget();
      statusCb(ok ? "Teleport complete" : "Teleport reset • aim again");
      modeCb("Teleport off");
      return;
    }

    if (!holdActive && mode && active === lastHoldSource){
      mode = false;
      active = null;
      lastHoldSource = null;
      hideTarget();
    }

    lastHoldActive = holdActive;
    statusCb(activeMode === "controller" ? "CONTROLLER TP • hold A/grip/trigger, aim, release" : "HAND TP • hold fist/pinch, aim, release");
    modeCb(activeMode === "controller" ? "Controllers: TELEPORT AIM" : "Hands: TELEPORT AIM");
  }

  return { onSessionStart, setLogoTexture, update, setPlayerPose, setPlayerXZ, getPlayerPose, setPlayerYaw, toggleMode, isEnabled: ()=>mode, getState: ()=>({ mode, activeHand: active === rightHandRef || active === rightControllerRef ? "right" : active === leftHandRef || active === leftControllerRef ? "left" : "none", activeMode }) };
}
