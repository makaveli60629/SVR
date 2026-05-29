import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist, aimPoint } from "./gestures.js";
import { openPrivateScene } from "./scene_portal_router.js";

const PHASE124 = "PHASE-124-MAGNETIC-FIST-PORTAL-QUICK-SELECT";
const PORTAL_MAGNET_RADIUS = 1.55;
const PORTAL_ACTIVATE_RADIUS = 0.92;

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;
  let teleportEnabled = true;

  let leftHandRef = null;
  let rightHandRef = null;
  let leftControllerRef = null;
  let rightControllerRef = null;
  let active = null;
  let activeMode = "none";
  let lastHoldActive = false;
  let lastHoldSource = null;
  let holdStart = 0;
  let lastTP = 0;
  let snapCooldownUntil = 0;
  let lastReleaseTargetValid = false;
  let lastReleaseTargetAt = 0;
  let lastReleaseMode = "none";
  let stableTargetMs = 0;
  let lastAimValid = false;
  let lastReleasePortalKey = null;
  let lastReleasePortalAt = 0;
  let lastReleasePortalDist = Infinity;

  const head = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  const sourcePos = new THREE.Vector3();
  const sourceDir = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);
  const lastReleaseTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);
  const tmpQuat = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const tmpPortalPos = new THREE.Vector3();

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
    new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -12, polygonOffsetUnits: -12, side: THREE.DoubleSide, opacity: 0.98, color: 0xffffff })
  );
  pointer.rotation.x = -Math.PI / 2;
  pointer.position.y = 0.040;
  pointer.renderOrder = 200;
  pointer.visible = false;
  scene.add(pointer);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xb48cff, side: THREE.DoubleSide, transparent: true, opacity: 0.88, depthWrite: false, blending: THREE.AdditiveBlending });
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.036;
  ring.renderOrder = 199;
  ring.visible = false;
  scene.add(ring);

  const markerGlow = new THREE.PointLight(0xb48cff, 0, 5.0, 2.0);
  markerGlow.position.y = 0.45;
  scene.add(markerGlow);

  const arcLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 10 }, ()=>new THREE.Vector3())),
    new THREE.LineBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.82, depthWrite: false })
  );
  arcLine.visible = false;
  arcLine.renderOrder = 198;
  scene.add(arcLine);

  function hideVisualTarget(){ pointer.visible = false; ring.visible = false; arcLine.visible = false; markerGlow.intensity = 0; }
  function resetAimState(){ stableTargetMs = 0; lastAimValid = false; lastReleaseTargetValid = false; lastReleaseTargetAt = 0; lastReleaseMode = "none"; lastReleasePortalKey = null; lastReleasePortalAt = 0; lastReleasePortalDist = Infinity; }
  function clearTeleportState(resetTarget = false){ active = null; activeMode = "none"; lastHoldActive = false; lastHoldSource = null; holdStart = 0; hideVisualTarget(); if (resetTarget) resetAimState(); }
  function showTarget(target, portalHit = null){
    const activePortal = !!portalHit?.active;
    pointer.visible = true;
    ring.visible = true;
    pointer.position.copy(target).setY(0.040);
    ring.position.copy(target).setY(0.036);
    markerGlow.position.copy(target).setY(0.45);
    markerGlow.intensity = activePortal ? 3.8 : 2.2;
    ring.material.color.setHex(activePortal ? 0x78ff9f : 0xb48cff);
    markerGlow.color.setHex(activePortal ? 0x78ff9f : 0xb48cff);
  }
  function clampTarget(p){ const c = typeof roomClamp === "number" ? roomClamp : 18; return new THREE.Vector3(THREE.MathUtils.clamp(p.x, -c, c), 0, THREE.MathUtils.clamp(p.z, -c, c)); }

  function findNearestPortal(target){
    let best = null;
    scene.traverse((obj)=>{
      const key = obj?.userData?.portalKey;
      if (!key || !obj.visible) return;
      obj.getWorldPosition(tmpPortalPos);
      const dx = tmpPortalPos.x - target.x;
      const dz = tmpPortalPos.z - target.z;
      const dist = Math.hypot(dx, dz);
      if (dist > PORTAL_MAGNET_RADIUS) return;
      if (!best || dist < best.dist){
        best = { key, dist, point: new THREE.Vector3(tmpPortalPos.x, 0, tmpPortalPos.z), active: dist <= PORTAL_ACTIVATE_RADIUS };
      }
    });
    return best;
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

  function controllerGamepad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
  function getButtonValue(gp, idx){ return gp?.buttons?.[idx]?.value || 0; }
  function getStick(gp, side = "left"){
    if (!gp?.axes?.length) return { x: 0, y: 0 };
    const axes = gp.axes;
    const candidates = side === "right" ? [[2,3],[0,1]] : [[0,1],[2,3]];
    let best = { x: 0, y: 0, score: 0 };
    for (const [ix, iy] of candidates){
      const x = axes[ix] || 0;
      const y = axes[iy] || 0;
      const score = Math.abs(x) + Math.abs(y);
      if (score > best.score) best = { x, y, score };
    }
    return { x: Math.abs(best.x) < 0.13 ? 0 : best.x, y: Math.abs(best.y) < 0.13 ? 0 : best.y };
  }

  function controllerHoldValue(proxy){
    const gp = controllerGamepad(proxy);
    if (!gp) return 0;
    return Math.max(getButtonValue(gp,0), getButtonValue(gp,1), getButtonValue(gp,3), getButtonValue(gp,4), getButtonValue(gp,5), getButtonValue(gp,6));
  }
  function handHoldValue(hand){ return hand?.joints && (isFist(hand) || isPinching(hand)) ? 1 : 0; }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(sourcePos);
    controller.getWorldDirection(sourceDir);
    if (sourceDir.y > -0.06) sourceDir.y = -0.28;
    sourceDir.normalize();
    const t = sourcePos.y / (-sourceDir.y);
    if (!Number.isFinite(t) || t < 0.08) return null;
    return new THREE.Vector3(sourcePos.x + sourceDir.x * Math.min(t, 140), 0, sourcePos.z + sourceDir.z * Math.min(t, 140));
  }

  function headsetDownForwardAim(origin){
    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldDirection(sourceDir);
    sourceDir.y = Math.min(sourceDir.y, -0.38);
    sourceDir.normalize();
    const t = origin.y / (-sourceDir.y);
    if (!Number.isFinite(t) || t < 0.08) return null;
    return new THREE.Vector3(origin.x + sourceDir.x * Math.min(t, 120), 0, origin.z + sourceDir.z * Math.min(t, 120));
  }

  function handAimPoint(hand){
    const wrist = hand?.joints?.wrist;
    const index = hand?.joints?.["index-finger-tip"];
    if (!wrist) return null;
    wrist.getWorldPosition(sourcePos);
    if (index){
      const direct = aimPoint(hand);
      const indexPos = new THREE.Vector3();
      index.getWorldPosition(indexPos);
      if (direct && indexPos.distanceTo(sourcePos) > 0.035) return direct;
    }
    try{
      wrist.getWorldQuaternion(tmpQuat);
      sourceDir.set(0, -0.32, -1).applyQuaternion(tmpQuat).normalize();
      if (sourceDir.y > -0.08) return headsetDownForwardAim(sourcePos);
      const t = sourcePos.y / (-sourceDir.y);
      if (Number.isFinite(t) && t > 0.08) return new THREE.Vector3(sourcePos.x + sourceDir.x * Math.min(t, 120), 0, sourcePos.z + sourceDir.z * Math.min(t, 120));
    }catch(_err){ }
    return headsetDownForwardAim(sourcePos);
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

  function correctedHeadForward(){
    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldDirection(headDir);
    headDir.y = 0;
    if (headDir.lengthSq() < 1e-5) headDir.set(0, 0, -1);
    headDir.normalize();
    if (Math.abs(playerYaw) > 0.0001) headDir.applyAxisAngle(yAxis, playerYaw).normalize();
    return headDir;
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
      snapCooldownUntil = performance.now() + 260;
    }
    if (Math.abs(moveY) < 0.13) return;

    const forward = correctedHeadForward();
    const speed = 2.65;
    const direction = -moveY;
    const clamp = typeof roomClamp === "number" ? roomClamp : 18;
    setPlayerXZ(
      THREE.MathUtils.clamp(playerX + forward.x * direction * speed * dt, -clamp, clamp),
      THREE.MathUtils.clamp(playerZ + forward.z * direction * speed * dt, -clamp, clamp)
    );
  }

  function drawArc(origin, target){
    if (!origin || !target){ arcLine.visible = false; return; }
    const pts = [];
    for (let i=0;i<10;i++){
      const f = i / 9;
      pts.push(new THREE.Vector3(
        THREE.MathUtils.lerp(origin.x, target.x, f),
        THREE.MathUtils.lerp(origin.y, 0.12, f) + Math.sin(f * Math.PI) * 0.55,
        THREE.MathUtils.lerp(origin.z, target.z, f)
      ));
    }
    arcLine.geometry.setFromPoints(pts);
    arcLine.visible = true;
  }

  function updateSmoothedTarget(aim, dt, mode){
    const target = clampTarget(aim);
    const portalHit = mode === "hand" ? findNearestPortal(target) : null;
    if (portalHit){
      const strength = portalHit.active ? 0.72 : THREE.MathUtils.clamp(1 - (portalHit.dist / PORTAL_MAGNET_RADIUS), 0.18, 0.42);
      target.lerp(portalHit.point, strength);
    }
    if (!lastAimValid){ smoothedTarget.copy(target); stableTargetMs = 100; }
    else {
      const jitter = smoothedTarget.distanceTo(target);
      stableTargetMs = jitter < 0.30 ? stableTargetMs + dt * 1000 : Math.max(0, stableTargetMs - dt * 500);
      smoothedTarget.lerp(target, jitter < 0.42 ? 0.52 : 0.28);
    }

    const activePortalHit = mode === "hand" ? findNearestPortal(smoothedTarget) : null;
    lastAimValid = true;
    lastReleaseTarget.copy(smoothedTarget);
    lastReleaseTargetValid = true;
    lastReleaseTargetAt = performance.now();
    lastReleaseMode = mode || activeMode;
    if (activePortalHit?.active){
      lastReleasePortalKey = activePortalHit.key;
      lastReleasePortalDist = activePortalHit.dist;
      lastReleasePortalAt = lastReleaseTargetAt;
    } else {
      lastReleasePortalKey = null;
      lastReleasePortalDist = Infinity;
      lastReleasePortalAt = 0;
    }
    showTarget(smoothedTarget, activePortalHit);
  }

  function finishReleaseTeleport(now, statusCb, modeCb){
    const heldMs = holdStart ? (now - holdStart) : 999;
    const targetFresh = lastReleaseTargetValid && (now - lastReleaseTargetAt) < 1400;
    const portalFresh = lastReleaseMode === "hand" && lastReleasePortalKey && (now - lastReleasePortalAt) < 900 && lastReleasePortalDist <= PORTAL_ACTIVATE_RADIUS;

    if (targetFresh && portalFresh && heldMs > 90){
      const key = lastReleasePortalKey;
      clearTeleportState(false);
      resetAimState();
      statusCb(`Portal selected: ${key}`);
      modeCb("Portal quick-select");
      setTimeout(()=>openPrivateScene(key), 80);
      return true;
    }

    const allowed = targetFresh && heldMs > 60 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS;
    const ok = allowed && teleportByDelta(lastReleaseTarget);
    if (ok) lastTP = now + 220;
    clearTeleportState(false);
    resetAimState();
    statusCb(ok ? "Teleport complete" : "Teleport reset • aim again");
    modeCb("Teleport off");
    return ok;
  }

  async function onSessionStart(){
    const session = renderer.xr.getSession();
    if (!session) return;
    baseRefSpace = await session.requestReferenceSpace("local-floor");
    playerYaw = 0;
    setPlayerPose(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
    clearTeleportState(true);
    console.log(`[${PHASE124}] fist teleport locked; magnetic portal quick-select active`);
  }

  function setLogoTexture(tex){ if (tex){ tex.anisotropy = 4; pointer.material.map = tex; pointer.material.needsUpdate = true; } }
  function toggleMode(){ teleportEnabled = !teleportEnabled; if (!teleportEnabled) clearTeleportState(true); return teleportEnabled; }
  function isEnabled(){ return teleportEnabled; }

  function update({ dt = 0.016, leftHand, rightHand, leftController, rightController, statusCb = ()=>{}, modeCb = ()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand;
    rightHandRef = rightHand;
    leftControllerRef = leftController;
    rightControllerRef = rightController;

    if (renderer?.xr?.isPresenting && (leftControllerRef || rightControllerRef)) movePlayerFromControllers(dt);

    const hasInput = !!(leftHandRef?.joints || rightHandRef?.joints || leftControllerRef?.joints || rightControllerRef?.joints);
    const hold = hasInput ? getActiveHoldSource() : null;
    const holdActive = !!hold?.source;

    if (lastHoldActive && !holdActive){ finishReleaseTeleport(now, statusCb, modeCb); return; }
    if (!hasInput){ hideVisualTarget(); statusCb("Waiting for hands or controllers…"); modeCb("Input: not tracked"); return; }
    if (!teleportEnabled){ clearTeleportState(true); statusCb("Teleport disabled"); modeCb("Teleport OFF"); return; }

    if (!holdActive){
      hideVisualTarget();
      active = null;
      activeMode = "none";
      lastHoldSource = null;
      holdStart = 0;
      statusCb((leftControllerRef || rightControllerRef) ? "Controllers ready • stick forward follows headset view • hold A/grip/trigger to teleport" : "Hands ready • fist/pinch teleport • portal marker quick-select active");
      modeCb((leftControllerRef || rightControllerRef) ? "Controllers ready" : "Hands ready");
      return;
    }

    if (!lastHoldActive || lastHoldSource !== hold.source){ holdStart = now; stableTargetMs = 0; lastAimValid = false; }
    active = hold.source;
    activeMode = hold.mode;
    lastHoldSource = hold.source;
    lastHoldActive = true;

    const aim = activeMode === "controller" ? controllerAimPoint(active) : handAimPoint(active);
    if (!aim){
      hideVisualTarget();
      statusCb(activeMode === "controller" ? "CONTROLLER TP • point at the floor" : "HAND TP • keep fist/pinch held, aim lower, release to teleport");
      modeCb(activeMode === "controller" ? "Controller teleport armed" : "Hand teleport armed");
      return;
    }

    updateSmoothedTarget(aim, dt, activeMode);
    if (activeMode === "controller") active.userData?.controller?.getWorldPosition?.(sourcePos);
    else active.joints?.wrist?.getWorldPosition?.(sourcePos);
    drawArc(sourcePos, smoothedTarget);

    if (activeMode === "hand" && lastReleasePortalKey){
      statusCb(`PORTAL READY • release fist to enter ${lastReleasePortalKey}`);
      modeCb("Hands: PORTAL QUICK-SELECT");
    } else {
      statusCb(activeMode === "controller" ? "CONTROLLER TP • release to teleport" : "HAND TP • unclench/release to teleport");
      modeCb(activeMode === "controller" ? "Controllers: TELEPORT AIM" : "Hands: TELEPORT AIM");
    }
  }

  return { onSessionStart, setLogoTexture, update, setPlayerPose, setPlayerXZ, getPlayerPose, setPlayerYaw, toggleMode, isEnabled, getState: ()=>({ mode: !!lastHoldActive, activeHand: active === rightHandRef || active === rightControllerRef ? "right" : active === leftHandRef || active === leftControllerRef ? "left" : "none", activeMode: lastHoldActive ? activeMode : lastReleaseMode, portalKey: lastReleasePortalKey }) };
}
