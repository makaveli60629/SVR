import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist } from "./gestures.js";
import { constrainLobbyBounds } from "./phase178_bounds.js";

const PHASE184_LABEL = "UPDATE-3.0-PHASE-184-QUEST-CONTROLLER-FORWARD-TELEPORT-LOCK";

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;
  let mode = false;
  let active = null;
  let activeMode = "hand";
  let lastTP = 0;
  let cooldownUntil = 0;
  let pinchHoldStart = 0;
  let triggerHoldStart = 0;
  let snapCooldownUntil = 0;
  let lastLeftFist = false;
  let lastRightFist = false;
  let lastLeftToggle = false;
  let lastRightToggle = false;
  let leftHandRef = null;
  let rightHandRef = null;
  let leftControllerRef = null;
  let rightControllerRef = null;
  let wallBlocks = 0;
  let controllerRayFlips = 0;

  const vHead = new THREE.Vector3();
  const vHeadDir = new THREE.Vector3();
  const vOrigin = new THREE.Vector3();
  const vDir = new THREE.Vector3();
  const vAltDir = new THREE.Vector3();
  const vControllerRight = new THREE.Vector3();
  const vWrist = new THREE.Vector3();
  const vIndex = new THREE.Vector3();
  const vThumb = new THREE.Vector3();
  const vTarget = new THREE.Vector3(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
  const vSmooth = new THREE.Vector3(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
  const qWorld = new THREE.Quaternion();

  function solidXZ(x,z){
    const p = constrainLobbyBounds(x,z);
    if(p.blocked) wallBlocks++;
    window.SVR_PHASE178_TELEPORT_BOUNDS = { locked:true, wallBlocks, last:{ x:p.x, z:p.z, blocked:p.blocked }, checkedAt:new Date().toISOString() };
    return p;
  }

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
      log("[Phase184 teleport] reference-space apply failed", err?.message || err);
      return false;
    }
  }

  function setPlayerPose(x, y, z){ const p = solidXZ(x,z); playerX = p.x; playerY = y; playerZ = p.z; return applyReferenceSpace(); }
  function setPlayerXZ(x, z){ const p = solidXZ(x,z); playerX = p.x; playerZ = p.z; return applyReferenceSpace(); }
  function setPlayerYaw(nextYaw){ playerYaw = nextYaw; return applyReferenceSpace(); }
  function getPlayerPose(){ return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw, wallBlocks, controllerRayFlips }; }

  const pointer = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.POINTER_SIZE, CONFIG.POINTER_SIZE),
    new THREE.MeshBasicMaterial({ transparent:true, alphaTest:0.28, depthWrite:false, depthTest:false, side:THREE.DoubleSide, opacity:0.98, color:0xffffff })
  );
  pointer.rotation.x = -Math.PI / 2;
  pointer.position.y = 0.018;
  pointer.visible = false;
  pointer.renderOrder = 1000;
  scene.add(pointer);

  const ringMat = new THREE.MeshBasicMaterial({ color:0xb55cff, transparent:true, opacity:0.92, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 80), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.015;
  ring.visible = false;
  ring.renderOrder = 1000;
  scene.add(ring);

  const arcGeom = new THREE.BufferGeometry();
  const arcMat = new THREE.LineBasicMaterial({ color:0xb55cff, transparent:true, opacity:0.98, depthWrite:false, depthTest:false });
  const arcLine = new THREE.Line(arcGeom, arcMat);
  arcLine.frustumCulled = false;
  arcLine.renderOrder = 1000;
  arcLine.visible = false;
  scene.add(arcLine);

  const glow = new THREE.PointLight(0xb55cff, 0, 5.0, 2.0);
  glow.position.y = 0.4;
  scene.add(glow);

  const handGlowMat = new THREE.MeshBasicMaterial({ color:0xb55cff, transparent:true, opacity:0.0, blending:THREE.AdditiveBlending, depthWrite:false });
  const handGlow = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 12), handGlowMat);
  handGlow.name = "Phase184_Purple_Fist_Hand_Glow";
  handGlow.visible = false;
  handGlow.renderOrder = 1001;
  scene.add(handGlow);

  function setLogoTexture(tex){
    if (!tex) return;
    tex.anisotropy = 1;
    pointer.material.map = tex;
    pointer.material.needsUpdate = true;
  }

  function hideVisuals(){
    pointer.visible = false;
    ring.visible = false;
    arcLine.visible = false;
    glow.intensity = 0;
    handGlow.visible = false;
    handGlowMat.opacity = 0;
  }

  function setPurpleVisuals(on){
    ringMat.opacity = on ? 0.94 : 0.0;
    arcMat.opacity = on ? 0.98 : 0.0;
    glow.intensity = on ? 2.6 : 0;
    handGlow.visible = !!on;
    handGlowMat.opacity = on ? 0.78 : 0;
  }

  function clampTarget(p){
    const q = solidXZ(p.x,p.z);
    return vTarget.set(q.x,0,q.z);
  }

  function updateArc(origin, target){
    if (!origin || !target){ arcLine.visible = false; return; }
    const pts = [];
    const start = origin.clone();
    const end = target.clone().setY(0.05);
    const dist = start.distanceTo(end);
    const lift = Math.max(0.65, Math.min(2.15, CONFIG.ARC_HEIGHT_BASE + dist * CONFIG.ARC_HEIGHT_PER_M));
    const mid = start.clone().lerp(end, 0.5);
    mid.y += lift;
    for (let i = 0; i <= CONFIG.ARC_SEGMENTS; i++){
      const u = i / CONFIG.ARC_SEGMENTS;
      const a = start.clone().lerp(mid, u);
      const b = mid.clone().lerp(end, u);
      pts.push(a.lerp(b, u));
    }
    arcGeom.setFromPoints(pts);
    arcLine.visible = true;
  }

  function teleportByDelta(target){
    if (!renderer?.xr?.isPresenting || !baseRefSpace) return false;
    try{
      const xrCam = renderer.xr.getCamera(camera);
      if (!xrCam) return false;
      xrCam.getWorldPosition(vHead);
      const dx = target.x - vHead.x;
      const dz = target.z - vHead.z;
      const p = solidXZ(playerX + dx, playerZ + dz);
      playerX = p.x;
      playerZ = p.z;
      return applyReferenceSpace();
    }catch(err){
      log("[Phase184 teleport] jump failed", err?.message || err);
      return false;
    }
  }

  function controllerGamepad(proxy){
    return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null;
  }
  function getButtonValue(gp, idx){ return gp?.buttons?.[idx]?.value || 0; }
  function getStick(gp, side = "left"){
    if (!gp?.axes?.length) return { x:0, y:0 };
    const axes = gp.axes;
    let x = 0, y = 0;
    if (axes.length >= 4 && side === "right"){
      x = axes[2] || 0; y = axes[3] || 0;
      if (Math.abs(x) < 0.001 && Math.abs(y) < 0.001){ x = axes[0] || 0; y = axes[1] || 0; }
    } else { x = axes[0] || 0; y = axes[1] || 0; }
    if (Math.abs(x) < 0.14) x = 0;
    if (Math.abs(y) < 0.14) y = 0;
    return { x, y };
  }
  function controllerTogglePressed(proxy){
    const gp = controllerGamepad(proxy);
    return getButtonValue(gp, 4) > 0.55 || getButtonValue(gp, 5) > 0.55 || getButtonValue(gp, 3) > 0.75;
  }
  function controllerTriggerValue(proxy){
    const gp = controllerGamepad(proxy);
    return Math.max(getButtonValue(gp, 0), getButtonValue(gp, 1), getButtonValue(gp, 4), getButtonValue(gp, 5));
  }

  function getXRHeadForward(){
    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldDirection(vHeadDir);
    vHeadDir.y = 0;
    if (vHeadDir.lengthSq() < 1e-5) vHeadDir.set(0,0,-1);
    return vHeadDir.normalize();
  }

  function movePlayerFromControllers(dt){
    const leftGp = controllerGamepad(leftControllerRef);
    const rightGp = controllerGamepad(rightControllerRef);
    const leftStick = getStick(leftGp, "left");
    const rightStick = getStick(rightGp, "right");
    const now = performance.now();
    if (Math.abs(rightStick.x) > 0.72 && now > snapCooldownUntil){
      playerYaw += Math.sign(rightStick.x) * (Math.PI / 4);
      applyReferenceSpace();
      snapCooldownUntil = now + 220;
    }
    const moveY = Math.abs(rightStick.y) > 0.12 ? rightStick.y : leftStick.y;
    const strafeX = Math.abs(leftStick.x) > 0.12 ? leftStick.x : 0;
    if (Math.hypot(strafeX, moveY) < 0.12) return;
    const forward = getXRHeadForward();
    const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
    const speed = 3.25;
    const stepX = (right.x * strafeX + forward.x * (-moveY)) * speed * dt;
    const stepZ = (right.z * strafeX + forward.z * (-moveY)) * speed * dt;
    setPlayerXZ(playerX + stepX, playerZ + stepZ);
  }

  function rayScore(dir, headForward){
    const flat = vAltDir.set(dir.x, 0, dir.z);
    if (flat.lengthSq() < 1e-5) return -999;
    flat.normalize();
    return flat.dot(headForward);
  }

  function chooseControllerForward(controller){
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldQuaternion(qWorld);

    // WebXR controller target rays normally point down local -Z.
    const minusZ = new THREE.Vector3(0, 0, -1).applyQuaternion(qWorld).normalize();
    const plusZ = new THREE.Vector3(0, 0, 1).applyQuaternion(qWorld).normalize();
    const headForward = getXRHeadForward().clone();

    const minusScore = rayScore(minusZ, headForward);
    const plusScore = rayScore(plusZ, headForward);
    const chosen = plusScore > minusScore + 0.28 ? plusZ : minusZ;
    if (chosen === plusZ) controllerRayFlips++;

    vControllerRight.set(1,0,0).applyQuaternion(qWorld).normalize();
    window.SVR_PHASE184_CONTROLLER_RAY = {
      label: PHASE184_LABEL,
      locked: true,
      source: chosen === plusZ ? "local +Z fallback" : "local -Z target-ray",
      minusScore: Number(minusScore.toFixed(3)),
      plusScore: Number(plusScore.toFixed(3)),
      flips: controllerRayFlips,
      checkedAt: new Date().toISOString()
    };
    return chosen;
  }

  function controllerAim(proxy){
    const controller = proxy?.userData?.controller || proxy;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(vOrigin);
    vDir.copy(chooseControllerForward(controller));

    // If the controller is level or slightly up, force a safe floor intersection in the same horizontal direction.
    if (vDir.y > -0.08) vDir.y = -0.44;
    vDir.normalize();

    const t = vOrigin.y / (-vDir.y);
    if (!isFinite(t) || t < 0.12) return null;
    const dist = Math.min(t, 120);
    return clampTarget(new THREE.Vector3(vOrigin.x + vDir.x * dist, 0, vOrigin.z + vDir.z * dist)).clone();
  }

  function handPalmPosition(hand){
    const wrist = hand?.joints?.wrist;
    if (!wrist) return null;
    wrist.updateWorldMatrix?.(true, false);
    wrist.getWorldPosition(vWrist);
    return vWrist.clone();
  }

  function handAim(hand){
    const wrist = hand?.joints?.wrist;
    const index = hand?.joints?.["index-finger-tip"];
    const thumb = hand?.joints?.["thumb-tip"];
    if (!wrist || !index) return null;
    wrist.updateWorldMatrix?.(true, false);
    index.updateWorldMatrix?.(true, false);
    wrist.getWorldPosition(vWrist);
    index.getWorldPosition(vIndex);
    if (thumb) thumb.getWorldPosition(vThumb); else vThumb.copy(vIndex);
    vDir.copy(vIndex).sub(vWrist);
    const forward = getXRHeadForward();
    const shortRay = vDir.lengthSq() < 0.006;
    if (shortRay) vDir.copy(forward).multiplyScalar(0.65).setY(-0.32);
    else {
      vDir.normalize();
      const flat = new THREE.Vector3(vDir.x, 0, vDir.z);
      if (flat.lengthSq() > 1e-5 && flat.normalize().dot(forward) < -0.20){ vDir.x *= -1; vDir.z *= -1; }
    }
    if (vDir.y > -0.07) vDir.y = -0.38;
    vDir.normalize();
    vOrigin.copy(vIndex).lerp(vWrist, 0.35);
    const t = vOrigin.y / (-vDir.y);
    if (!isFinite(t) || t < 0.12) return null;
    return clampTarget(new THREE.Vector3(vOrigin.x + vDir.x * Math.min(t, 120), 0, vOrigin.z + vDir.z * Math.min(t, 120))).clone();
  }

  function toggleMode(preferred = "right"){
    mode = !mode;
    if (!mode){ active = null; activeMode = "hand"; hideVisuals(); return mode; }
    const hand = preferred === "left" ? leftHandRef : rightHandRef;
    const fallbackHand = preferred === "left" ? rightHandRef : leftHandRef;
    const controller = preferred === "left" ? leftControllerRef : rightControllerRef;
    active = hand?.joints ? hand : fallbackHand?.joints ? fallbackHand : controller?.joints ? controller : null;
    activeMode = active === leftControllerRef || active === rightControllerRef ? "controller" : "hand";
    cooldownUntil = performance.now() + 180;
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
    pinchHoldStart = 0;
    triggerHoldStart = 0;
    controllerRayFlips = 0;
    hideVisuals();
  }

  function update({ dt = 0.016, leftHand, rightHand, leftController, rightController, statusCb = ()=>{}, modeCb = ()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand; rightHandRef = rightHand; leftControllerRef = leftController; rightControllerRef = rightController;
    if (renderer?.xr?.isPresenting && (leftControllerRef || rightControllerRef)) movePlayerFromControllers(dt);
    const leftFist = !!leftHandRef?.joints && isFist(leftHandRef);
    const rightFist = !!rightHandRef?.joints && isFist(rightHandRef);
    const leftToggle = controllerTogglePressed(leftControllerRef);
    const rightToggle = controllerTogglePressed(rightControllerRef);
    if (leftFist && !lastLeftFist && now > cooldownUntil){ mode = !(mode && active === leftHandRef); active = mode ? leftHandRef : null; activeMode = "hand"; cooldownUntil = now + 360; pinchHoldStart = 0; }
    if (rightFist && !lastRightFist && now > cooldownUntil){ mode = !(mode && active === rightHandRef); active = mode ? rightHandRef : null; activeMode = "hand"; cooldownUntil = now + 360; pinchHoldStart = 0; }
    if (leftToggle && !lastLeftToggle && now > cooldownUntil){ mode = !(mode && active === leftControllerRef); active = mode ? (leftControllerRef || rightControllerRef) : null; activeMode = "controller"; cooldownUntil = now + 260; triggerHoldStart = 0; }
    if (rightToggle && !lastRightToggle && now > cooldownUntil){ mode = !(mode && active === rightControllerRef); active = mode ? (rightControllerRef || leftControllerRef) : null; activeMode = "controller"; cooldownUntil = now + 260; triggerHoldStart = 0; }
    lastLeftFist = leftFist; lastRightFist = rightFist; lastLeftToggle = leftToggle; lastRightToggle = rightToggle;
    if (!leftHandRef?.joints && !rightHandRef?.joints && !leftControllerRef?.joints && !rightControllerRef?.joints){ hideVisuals(); statusCb("Waiting for Quest hands or controllers…"); modeCb("Input: not tracked"); return; }
    if (!mode || !active){ hideVisuals(); statusCb((leftControllerRef || rightControllerRef) ? "Controllers ready • right stick move/snap • hold A/grip/trigger for forward TP" : "Hands ready • fist arms TP • walls locked"); modeCb((leftControllerRef || rightControllerRef) ? "Controllers ready • Phase184 ray lock" : "Hands ready • walls locked"); return; }
    if (activeMode === "hand" && !active?.joints) active = rightHandRef?.joints ? rightHandRef : leftHandRef?.joints ? leftHandRef : null;
    if (activeMode === "controller" && !active?.joints) active = rightControllerRef?.joints ? rightControllerRef : leftControllerRef?.joints ? leftControllerRef : null;
    if (!active){ mode = false; hideVisuals(); return; }
    const target = activeMode === "controller" ? controllerAim(active) : handAim(active);
    if (!target){ hideVisuals(); setPurpleVisuals(true); statusCb(activeMode === "hand" ? "PURPLE TP ARMED • lower/aim hand, then pinch" : "CONTROLLER TP ARMED • aim right controller at floor"); modeCb(activeMode === "hand" ? "Hands: PURPLE TP ARMED" : "Controllers: TP ARMED"); return; }
    vSmooth.lerp(target, vSmooth.distanceTo(target) > 1.2 ? 0.72 : 0.36);
    pointer.visible = true; ring.visible = true;
    pointer.position.copy(vSmooth).setY(0.018); ring.position.copy(vSmooth).setY(0.015); glow.position.copy(vSmooth).setY(0.38); setPurpleVisuals(true);
    const origin = activeMode === "controller" ? vOrigin.clone() : handPalmPosition(active);
    updateArc(origin, vSmooth);
    if (activeMode === "hand" && origin) handGlow.position.copy(origin);
    if (activeMode === "controller"){
      const trigger = controllerTriggerValue(active);
      if (trigger > 0.20 && !active.userData._wasTrigger) triggerHoldStart = now;
      const held = triggerHoldStart ? now - triggerHoldStart : 0;
      if (active.userData._wasTrigger && trigger <= 0.12 && held > 90 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
        if (teleportByDelta(vSmooth)){ lastTP = now; mode = false; active = null; triggerHoldStart = 0; hideVisuals(); }
      }
      if (trigger <= 0.12) triggerHoldStart = 0;
      active.userData._wasTrigger = trigger > 0.20;
      statusCb("CONTROLLER TP ARMED • release A/grip/trigger • forward ray locked"); modeCb("Controllers: PHASE184 FORWARD TP"); return;
    }
    const pinch = isPinching(active);
    if (active.userData._wasPinching === undefined) active.userData._wasPinching = false;
    if (pinch && !active.userData._wasPinching) pinchHoldStart = now;
    const held = pinchHoldStart ? now - pinchHoldStart : 0;
    if ((pinch && held > 110 || (active.userData._wasPinching && !pinch && held > 45)) && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      if (teleportByDelta(vSmooth)){ lastTP = now; mode = false; active = null; pinchHoldStart = 0; active.userData._wasPinching = false; hideVisuals(); statusCb("HAND TELEPORT COMPLETE • wall boundary locked"); return; }
    }
    if (!pinch) pinchHoldStart = 0;
    active.userData._wasPinching = pinch;
    statusCb("PURPLE HAND TP ARMED • pinch to teleport • walls locked");
    modeCb("Hands: PURPLE TELEPORT ON");
  }
  return { onSessionStart, setLogoTexture, update, setPlayerPose, setPlayerXZ, getPlayerPose, setPlayerYaw, toggleMode, isEnabled:()=>mode, getState:()=>({ mode, activeHand: active === rightHandRef || active === rightControllerRef ? "right" : active === leftHandRef || active === leftControllerRef ? "left" : "none", activeMode, wallBlocks, controllerRayFlips }) };
}
