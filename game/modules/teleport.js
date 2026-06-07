import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist, aimPoint } from "./gestures.js";

const BUILD = "LOBBY-ORG-1-4D-QUEST-HEADSET-FORWARD-LOCOMOTION-LOCK";

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
      const xform = new XRRigidTransform({ x: -playerX, y: -playerY, z: -playerZ }, { x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw) });
      renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(xform));
      return true;
    }catch(err){ log("[teleport] reference-space apply failed", err?.message || err); return false; }
  }
  function setPlayerPose(x, y, z){ playerX = x; playerY = y; playerZ = z; return applyReferenceSpace(); }
  function setPlayerXZ(x, z){ playerX = x; playerZ = z; return applyReferenceSpace(); }
  function getPlayerPose(){ return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw }; }
  function setPlayerYaw(nextYaw){ playerYaw = nextYaw; return applyReferenceSpace(); }

  const pointer = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.POINTER_SIZE, CONFIG.POINTER_SIZE), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide, opacity: 0.96, color: 0xffffff }));
  pointer.rotation.x = -Math.PI / 2; pointer.position.y = 0.018; pointer.visible = false; scene.add(pointer);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xb48cff, roughness: 0.22, metalness: 0.28, emissive: 0x2a0d3a, emissiveIntensity: 0.0, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 72), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.015; ring.visible = false; scene.add(ring);
  const markerGlow = new THREE.PointLight(0xb48cff, 0, 4.5, 2.0); markerGlow.position.y = 0.4; scene.add(markerGlow);
  function hideArc(){}
  function setGlow(on){ ringMat.emissiveIntensity = on ? 0.55 : 0.0; markerGlow.intensity = on ? 0.8 : 0.0; }

  let mode = false, active = null, activeMode = "hand", cooldownUntil = 0, lastTP = 0, pinchHoldStart = 0, triggerHoldStart = 0;
  let leftHandRef = null, rightHandRef = null, leftControllerRef = null, rightControllerRef = null;
  let stableTargetMs = 0, lastAimValid = false, snapCooldownUntil = 0, movementPauseUntil = 0;
  let lastLeftToggle = false, lastRightToggle = false, lastLeftFistToggle = false, lastRightFistToggle = false;
  let moveVelX = 0, moveVelZ = 0;
  const head = new THREE.Vector3(), headDir = new THREE.Vector3(), controllerOrigin = new THREE.Vector3(), controllerDir = new THREE.Vector3(), smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);
  const forwardDir = new THREE.Vector3(), rightDir = new THREE.Vector3();

  function clampTarget(p){ return new THREE.Vector3(THREE.MathUtils.clamp(p.x, -roomClamp, roomClamp), 0, THREE.MathUtils.clamp(p.z, -roomClamp, roomClamp)); }
  function teleportByDelta(target){
    if (!renderer?.xr?.isPresenting || !baseRefSpace) return false;
    try{
      const xrCam = renderer.xr.getCamera(camera); if (!xrCam) return false; xrCam.getWorldPosition(head);
      const dx = target.x - head.x, dz = target.z - head.z, prev = { x: playerX, y: playerY, z: playerZ, yaw: playerYaw };
      playerX += dx; playerZ += dz;
      if (!applyReferenceSpace()){ playerX = prev.x; playerY = prev.y; playerZ = prev.z; playerYaw = prev.yaw; applyReferenceSpace(); return false; }
      return true;
    }catch(err){ log("[teleport] jump failed", err?.message || err); return false; }
  }
  function controllerGamepad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
  function getStick(gp, side = "left") {
    if (!gp?.axes?.length) return { x: 0, y: 0 };
    const axes = gp.axes; let x = 0, y = 0;
    if (axes.length >= 4) { if (side === "right") { x = axes[2] || 0; y = axes[3] || 0; if (Math.abs(x) < 0.001 && Math.abs(y) < 0.001) { x = axes[0] || 0; y = axes[1] || 0; } } else { x = axes[0] || 0; y = axes[1] || 0; } }
    else { x = axes[0] || 0; y = axes[1] || 0; }
    if (Math.abs(x) < 0.20) x = 0; if (Math.abs(y) < 0.20) y = 0; return { x, y };
  }
  function getButtonValue(gp, idx){ return gp?.buttons?.[idx]?.value || 0; }
  function controllerTogglePressed(proxy){
    const gp = controllerGamepad(proxy);
    if (!gp) return false;
    // SVR_1_4G_GRIP_TELEPORT_LOCK: grip/squeeze arms teleport. A/B remain fallback.
    return getButtonValue(gp, 1) > 0.35 || getButtonValue(gp, 4) > 0.55 || getButtonValue(gp, 5) > 0.55;
  }
  function controllerTriggerValue(proxy){ return getButtonValue(controllerGamepad(proxy), 0); }
  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller; if (!controller) return null; controller.updateWorldMatrix?.(true, false); controller.getWorldPosition(controllerOrigin); controller.getWorldDirection(controllerDir);
    if (controllerDir.y > -0.08) controllerDir.y = -0.08; controllerDir.normalize(); const t = (controllerOrigin.y - 0.0) / (-controllerDir.y); if (!isFinite(t) || t < 0.12) return null;
    return new THREE.Vector3(controllerOrigin.x + controllerDir.x * Math.min(t, 160), 0, controllerOrigin.z + controllerDir.z * Math.min(t, 160));
  }
  function toggleMode(preferred = "right"){
    mode = !mode;
    if (!mode){ active = null; activeMode = "hand"; pinchHoldStart = 0; triggerHoldStart = 0; return mode; }
    const preferredController = preferred === "left" ? leftControllerRef : rightControllerRef, fallbackController = preferred === "left" ? rightControllerRef : leftControllerRef, preferredHand = preferred === "left" ? leftHandRef : rightHandRef, fallbackHand = preferred === "left" ? rightHandRef : leftHandRef;
    if (preferredController?.joints || fallbackController?.joints){ active = preferredController?.joints ? preferredController : fallbackController; activeMode = "controller"; } else { active = preferredHand?.joints ? preferredHand : fallbackHand?.joints ? fallbackHand : null; activeMode = "hand"; }
    cooldownUntil = performance.now() + 120; return mode;
  }
  async function onSessionStart(){
    const session = renderer.xr.getSession(); if (!session) return; baseRefSpace = await session.requestReferenceSpace("local-floor"); playerYaw = 0; moveVelX = 0; moveVelZ = 0; setPlayerPose(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z); mode = false; active = null; activeMode = "hand"; pointer.visible = false; ring.visible = false; hideArc(); setGlow(false);
  }
  function setLogoTexture(tex){ if (!tex) return; tex.anisotropy = 8; pointer.material.map = tex; pointer.material.needsUpdate = true; }

  function getHeadsetForwardVector(){
    const xrCam = renderer.xr.getCamera(camera);
    if (!xrCam) return forwardDir.set(Math.sin(playerYaw), 0, -Math.cos(playerYaw));
    xrCam.updateWorldMatrix?.(true, false);
    forwardDir.set(0, 0, -1).applyQuaternion(xrCam.quaternion);
    forwardDir.y = 0;
    if (forwardDir.lengthSq() < 1e-5) forwardDir.set(Math.sin(playerYaw), 0, -Math.cos(playerYaw));
    forwardDir.normalize();
    return forwardDir;
  }

  function movePlayerFromControllers(dt){
    const now = performance.now();
    const leftGp = controllerGamepad(leftControllerRef), rightGp = controllerGamepad(rightControllerRef);
    const leftStick = getStick(leftGp || rightGp, "left"), rightStick = getStick(rightGp || leftGp, "right");
    if (Math.abs(rightStick.x) > 0.72 && now > snapCooldownUntil){
      playerYaw += Math.sign(rightStick.x) * (Math.PI / 4);
      applyReferenceSpace();
      snapCooldownUntil = now + 280;
      movementPauseUntil = now + 220;
      moveVelX = 0; moveVelZ = 0;
      window.SVR_QUEST_LOCOMOTION_14D_LAST_SNAP = { yaw: playerYaw, at: Date.now() };
      return;
    }
    if (now < movementPauseUntil) return;

    const forwardInput = Math.abs(rightStick.y) > 0.20 ? -rightStick.y : -leftStick.y;
    const strafeInput = leftStick.x;
    const mag = Math.hypot(strafeInput, forwardInput);
    if (mag < 0.12){ moveVelX *= 0.50; moveVelZ *= 0.50; return; }

    const forward = getHeadsetForwardVector();
    rightDir.set(forward.z, 0, -forward.x).normalize();
    const speed = 2.35;
    const norm = Math.max(1, mag);
    const desiredX = ((rightDir.x * strafeInput) + (forward.x * forwardInput)) / norm * speed;
    const desiredZ = ((rightDir.z * strafeInput) + (forward.z * forwardInput)) / norm * speed;
    const smooth = 1 - Math.pow(0.0001, dt);
    moveVelX += (desiredX - moveVelX) * smooth;
    moveVelZ += (desiredZ - moveVelZ) * smooth;
    setPlayerXZ(THREE.MathUtils.clamp(playerX + moveVelX * dt, -roomClamp, roomClamp), THREE.MathUtils.clamp(playerZ + moveVelZ * dt, -roomClamp, roomClamp));
    window.SVR_QUEST_LOCOMOTION_14D = { build: BUILD, forwardMode: "xr-camera-quaternion", forward: { x: Number(forward.x.toFixed(3)), z: Number(forward.z.toFixed(3)) }, strafeInput: Number(strafeInput.toFixed(3)), forwardInput: Number(forwardInput.toFixed(3)), playerYaw: Number(playerYaw.toFixed(3)) };
  }

  function update({ dt = 0.016, leftHand, rightHand, leftController, rightController, statusCb = ()=>{}, modeCb = ()=>{} }){
    const now = performance.now(); leftHandRef = leftHand; rightHandRef = rightHand; leftControllerRef = leftController; rightControllerRef = rightController;
    if (renderer?.xr?.isPresenting && (leftControllerRef || rightControllerRef)) movePlayerFromControllers(dt);
    const leftToggle = controllerTogglePressed(leftControllerRef), rightToggle = controllerTogglePressed(rightControllerRef);
    if (leftToggle && !lastLeftToggle && now > cooldownUntil){ mode = !(mode && active === leftControllerRef); active = mode ? (leftControllerRef || rightControllerRef || leftHandRef || rightHandRef) : null; activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand"; cooldownUntil = now + 220; }
    if (rightToggle && !lastRightToggle && now > cooldownUntil){ mode = !(mode && active === rightControllerRef); active = mode ? (rightControllerRef || leftControllerRef || rightHandRef || leftHandRef) : null; activeMode = active === rightControllerRef || active === leftControllerRef ? "controller" : "hand"; cooldownUntil = now + 220; }
    lastLeftToggle = leftToggle; lastRightToggle = rightToggle;
    if (!leftControllerRef?.joints && !rightControllerRef?.joints){
      const leftFist = !!leftHandRef?.joints && handNearFace(leftHandRef) && isFist(leftHandRef), rightFist = !!rightHandRef?.joints && handNearFace(rightHandRef) && isFist(rightHandRef);
      if (leftFist && !lastLeftFistToggle && now > cooldownUntil){ mode = !(mode && active === leftHandRef); active = mode ? leftHandRef : null; activeMode = 'hand'; cooldownUntil = now + 320; pinchHoldStart = 0; triggerHoldStart = 0; }
      if (rightFist && !lastRightFistToggle && now > cooldownUntil){ mode = !(mode && active === rightHandRef); active = mode ? rightHandRef : null; activeMode = 'hand'; cooldownUntil = now + 320; pinchHoldStart = 0; triggerHoldStart = 0; }
      lastLeftFistToggle = leftFist; lastRightFistToggle = rightFist;
    } else { lastLeftFistToggle = false; lastRightFistToggle = false; }
    if (!leftHandRef?.joints && !rightHandRef?.joints && !leftControllerRef?.joints && !rightControllerRef?.joints){ pointer.visible = false; ring.visible = false; hideArc(); setGlow(false); stableTargetMs = 0; lastAimValid = false; statusCb("Waiting for hands or controllersâ€¦"); modeCb("Input: not tracked"); return; }
    if (mode && activeMode === "controller" && !(active?.joints)){ active = leftControllerRef?.joints ? leftControllerRef : rightControllerRef?.joints ? rightControllerRef : leftHandRef?.joints ? leftHandRef : rightHandRef?.joints ? rightHandRef : null; activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand"; }
    else if (mode && activeMode === "hand" && !(active?.joints)){ active = leftHandRef?.joints ? leftHandRef : rightHandRef?.joints ? rightHandRef : leftControllerRef?.joints ? leftControllerRef : rightControllerRef?.joints ? rightControllerRef : null; activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand"; }
    if (!mode || !active){ pointer.visible = false; ring.visible = false; hideArc(); setGlow(false); stableTargetMs = 0; lastAimValid = false; statusCb((leftControllerRef || rightControllerRef) ? "Controllers active â€¢ headset facing = forward â€¢ snap-turn locked" : "TELEPORT OFF â€¢ press watch or fist near face"); modeCb((leftControllerRef || rightControllerRef) ? "Input: controllers + head-forward locomotion" : "Teleport: off"); return; }
    let target = null;
    if (activeMode === "controller") target = controllerAimPoint(active);
    else if (active?.joints) target = aimPoint(active);
    if (!target){ pointer.visible = false; ring.visible = false; setGlow(false); stableTargetMs = 0; lastAimValid = false; statusCb("Aim at the floor"); return; }
    target = clampTarget(target);
    if (!lastAimValid){ smoothedTarget.copy(target); stableTargetMs = 0; }
    else smoothedTarget.lerp(target, Math.min(1, dt * 8));
    lastAimValid = true; stableTargetMs += dt * 1000;
    pointer.visible = true; ring.visible = true; pointer.position.copy(smoothedTarget); ring.position.copy(smoothedTarget); ring.rotation.z += dt * 1.8; markerGlow.position.copy(smoothedTarget).add(new THREE.Vector3(0, 0.4, 0)); setGlow(stableTargetMs > 120);
    const pinch = activeMode === "controller" ? controllerTriggerValue(active) > 0.55 : isPinching(active);
    if (pinch && stableTargetMs > 110 && now - lastTP > 650){
      const ok = teleportByDelta(smoothedTarget); lastTP = now; pointer.visible = false; ring.visible = false; setGlow(false); mode = false; active = null; activeMode = "hand"; pinchHoldStart = 0; triggerHoldStart = 0;
      statusCb(ok ? "Teleported" : "Teleport failed");
    } else statusCb(activeMode === "controller" ? "Controller teleport aim â€¢ trigger to jump" : "Hand teleport aim â€¢ pinch to jump");
  }

  return { update, onSessionStart, setLogoTexture, toggleMode, isEnabled: ()=>mode, setPlayerPose, getPlayerPose, setPlayerYaw };
}

