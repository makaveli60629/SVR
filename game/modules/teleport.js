import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist, aimPoint } from "./gestures.js";
import { triggerValue, nextCameraForwardPosition, shouldSnapTurn } from "./locomotion_lock.js";

const PHASE = "PHASE-143-QUEST-CONTROLLER-AXIS-A-BUTTON-FREEZE-FIX-LOCK";

export function createTeleportRig({ scene, renderer, camera, roomClamp, worldRoot = null, log = console.log }){
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;
  let mode = false;
  let active = null;
  let activeMode = "controller";
  let cooldownUntil = 0;
  let lastTP = 0;
  let pinchHoldStart = 0;
  let triggerHoldStart = 0;
  let snapCooldownUntil = 0;
  let lastLeftFist = false;
  let lastRightFist = false;
  let leftHandRef = null, rightHandRef = null, leftControllerRef = null, rightControllerRef = null;
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
  const clampedTarget = new THREE.Vector3(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
  const commitTarget = new THREE.Vector3(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
  let lastAimValid = false;
  let pendingCommit = false;

  function syncWorldRoot(){
    if (renderer?.xr?.isPresenting && worldRoot){
      worldRoot.position.x = -playerX;
      worldRoot.position.y = -playerY;
      worldRoot.position.z = -playerZ;
      worldRoot.rotation.y = playerYaw;
    }
  }
  function resetWorldRoot(){
    if (worldRoot){
      worldRoot.position.set(0,0,0);
      worldRoot.rotation.set(0,0,0);
    }
  }
  function writePose(){ window.SVR_TELEPORT_POSE = { phase: PHASE, x: playerX, y: playerY, z: playerZ, yaw: playerYaw }; }
  function setPlayerPose(x, y, z){
    playerX = THREE.MathUtils.clamp(x, -roomClamp * 1.05, roomClamp * 1.05);
    playerY = y;
    playerZ = THREE.MathUtils.clamp(z, -roomClamp * 1.05, roomClamp * 1.05);
    if (renderer?.xr?.isPresenting) syncWorldRoot(); else camera.position.set(playerX, 1.6 + playerY, playerZ);
    writePose(); return true;
  }
  function setPlayerXZ(x, z){
    playerX = THREE.MathUtils.clamp(x, -roomClamp * 1.05, roomClamp * 1.05);
    playerZ = THREE.MathUtils.clamp(z, -roomClamp * 1.05, roomClamp * 1.05);
    if (renderer?.xr?.isPresenting) syncWorldRoot(); else { camera.position.x = playerX; camera.position.z = playerZ; }
    writePose(); return true;
  }
  function setPlayerYaw(nextYaw){ playerYaw = nextYaw; syncWorldRoot(); writePose(); return true; }
  function getPlayerPose(){ return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw }; }
  function isEnabled(){ return mode; }

  const pointer = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 48),
    new THREE.MeshBasicMaterial({ color:0x00ff66, transparent:true, opacity:.92, depthWrite:false, depthTest:false, side:THREE.DoubleSide, toneMapped:false })
  );
  pointer.name = "SVR_PHASE143_HIGH_CONTRAST_TELEPORT_POINTER";
  pointer.rotation.x = -Math.PI / 2;
  pointer.position.y = .052;
  pointer.visible = false;
  pointer.renderOrder = 900;
  pointer.userData.svrNoWorldShift = true;
  scene.add(pointer);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.03, 64),
    new THREE.MeshBasicMaterial({ color:0xffff00, side:THREE.DoubleSide, transparent:true, opacity:.96, depthWrite:false, depthTest:false, toneMapped:false })
  );
  ring.name = "SVR_PHASE143_HIGH_CONTRAST_TELEPORT_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .058;
  ring.visible = false;
  ring.renderOrder = 901;
  ring.userData.svrNoWorldShift = true;
  scene.add(ring);

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1)]),
    new THREE.LineBasicMaterial({ color:0x00ffff, transparent:true, opacity:.88, depthTest:false, depthWrite:false, toneMapped:false })
  );
  line.name = "SVR_PHASE143_TELEPORT_AIM_LINE";
  line.visible = false;
  line.renderOrder = 902;
  line.userData.svrNoWorldShift = true;
  scene.add(line);

  const leftFire = new THREE.Mesh(new THREE.SphereGeometry(.052, 10, 8), new THREE.MeshBasicMaterial({ color:0xff00ff, transparent:true, opacity:.95, depthTest:false, depthWrite:false, toneMapped:false }));
  const rightFire = leftFire.clone();
  leftFire.name = "SVR_PHASE143_LEFT_PURPLE_FIRE_HIGH_CONTRAST";
  rightFire.name = "SVR_PHASE143_RIGHT_PURPLE_FIRE_HIGH_CONTRAST";
  leftFire.visible = false; rightFire.visible = false;
  leftFire.userData.svrNoWorldShift = true; rightFire.userData.svrNoWorldShift = true;
  scene.add(leftFire, rightFire);

  function updateFire(mesh, hand, on){
    const wrist = hand?.joints?.wrist;
    if (!wrist || !on){ mesh.visible = false; return; }
    wrist.updateWorldMatrix?.(true, false);
    wrist.getWorldPosition(mesh.position);
    mesh.position.y += .016;
    mesh.visible = true;
  }

  function setTeleportVisual(on){ window.SVR_TELEPORT_FIRE_STATE = { phase: PHASE, teleportOn:Boolean(on), activeMode }; }
  function clampTarget(p){
    clampedTarget.set(THREE.MathUtils.clamp(p.x, -roomClamp, roomClamp), 0, THREE.MathUtils.clamp(p.z, -roomClamp, roomClamp));
    return clampedTarget;
  }
  function resetTeleportVisuals(){
    pointer.visible = false; ring.visible = false; line.visible = false; leftFire.visible = false; rightFire.visible = false;
    setTeleportVisual(false); lastAimValid = false; pinchHoldStart = 0; triggerHoldStart = 0; pendingCommit = false;
  }

  function safeReleaseTeleport(target){
    const now = performance.now();
    if (!target || now - lastTP < 650 || pendingCommit) return false;
    lastTP = now;
    cooldownUntil = now + 650;
    pendingCommit = true;
    commitTarget.copy(target);
    mode = false;
    active = null;
    resetTeleportVisuals();
    setTimeout(()=>{
      setPlayerXZ(commitTarget.x, commitTarget.z);
      pendingCommit = false;
      window.SVR_TELEPORT_COMMIT = {
        phase: PHASE, ok: true, moved: true,
        method: renderer?.xr?.isPresenting ? "deferred-timeout-world-root-shift-no-A-button" : "desktop-camera-jump",
        target: { x: commitTarget.x, z: commitTarget.z }, at: new Date().toISOString()
      };
    }, 34);
    return true;
  }

  function movePlayerFromControllers(dt){
    if (!renderer?.xr?.isPresenting || mode || pendingCommit) return;
    const snap = shouldSnapTurn(leftControllerRef, rightControllerRef, performance.now() > snapCooldownUntil);
    if (snap){ setPlayerYaw(playerYaw + snap); snapCooldownUntil = performance.now() + 460; }
    const next = nextCameraForwardPosition({ renderer, camera, leftControllerRef, rightControllerRef, playerX, playerZ, roomClamp, dt, speed:1.35 });
    if (next.moved) setPlayerXZ(next.x, next.z);
  }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(controllerOrigin);
    controller.getWorldDirection(controllerDir);
    if (controllerDir.y > -.10) controllerDir.y = -.10;
    controllerDir.normalize();
    const t = controllerOrigin.y / (-controllerDir.y);
    if (!isFinite(t) || t < .12) return null;
    const maxT = Math.min(t, 18);
    controllerOrigin.x += controllerDir.x * maxT;
    controllerOrigin.y = 0;
    controllerOrigin.z += controllerDir.z * maxT;
    return controllerOrigin;
  }

  function updateAimLine(target, source){
    if (!target || !source){ line.visible = false; return; }
    const pos = line.geometry.attributes.position;
    pos.setXYZ(0, source.x, source.y, source.z);
    pos.setXYZ(1, target.x, .08, target.z);
    pos.needsUpdate = true;
    line.visible = true;
  }

  function chooseController(){ return rightControllerRef?.joints ? rightControllerRef : leftControllerRef?.joints ? leftControllerRef : null; }
  function chooseHand(){ return rightHandRef?.joints ? rightHandRef : leftHandRef?.joints ? leftHandRef : null; }
  function turnOnTeleport(nextActive, nextMode){ mode = true; active = nextActive; activeMode = nextMode; cooldownUntil = performance.now() + 180; pinchHoldStart = 0; triggerHoldStart = 0; }
  function toggleMode(preferred="right"){
    if (mode){ mode = false; active = null; resetTeleportVisuals(); return false; }
    const ctrl = preferred === "left" ? (leftControllerRef?.joints ? leftControllerRef : chooseController()) : (rightControllerRef?.joints ? rightControllerRef : chooseController());
    const hand = preferred === "left" ? (leftHandRef?.joints ? leftHandRef : chooseHand()) : (rightHandRef?.joints ? rightHandRef : chooseHand());
    if (ctrl) turnOnTeleport(ctrl, "controller"); else if (hand) turnOnTeleport(hand, "hand");
    return mode;
  }
  async function onSessionStart(){
    playerYaw = 0; playerX = CONFIG.SPAWN_X; playerY = 0; playerZ = CONFIG.SPAWN_Z;
    mode = false; active = null; resetTeleportVisuals(); syncWorldRoot();
    window.SVR_TELEPORT_COMMIT = { phase:PHASE, method:"no-A-button-critical-teleport", session:"started", safeSpawn:{x:playerX,z:playerZ} };
  }
  function onSessionEnd(){ resetTeleportVisuals(); resetWorldRoot(); }
  function setLogoTexture(tex){ /* Disabled for Quest freeze isolation. */ }

  function update({ dt=.016, leftHand, rightHand, leftController, rightController, statusCb=()=>{}, modeCb=()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand; rightHandRef = rightHand; leftControllerRef = leftController; rightControllerRef = rightController;
    movePlayerFromControllers(Math.min(dt,.028));
    const leftFist = !!leftHandRef?.joints && isFist(leftHandRef);
    const rightFist = !!rightHandRef?.joints && isFist(rightHandRef);
    if (leftFist && !lastLeftFist && now > cooldownUntil){ mode && active === leftHandRef ? (mode=false, active=null, resetTeleportVisuals()) : turnOnTeleport(leftHandRef, "hand"); }
    if (rightFist && !lastRightFist && now > cooldownUntil){ mode && active === rightHandRef ? (mode=false, active=null, resetTeleportVisuals()) : turnOnTeleport(rightHandRef, "hand"); }
    lastLeftFist = leftFist; lastRightFist = rightFist;
    const leftTrigger = triggerValue(leftControllerRef);
    const rightTrigger = triggerValue(rightControllerRef);
    if (!mode && now > cooldownUntil){
      if (rightTrigger > .34 && rightControllerRef?.joints) turnOnTeleport(rightControllerRef, "controller");
      else if (leftTrigger > .34 && leftControllerRef?.joints) turnOnTeleport(leftControllerRef, "controller");
    }
    if (mode && activeMode === "controller" && !active?.joints) active = chooseController() || chooseHand();
    if (mode && activeMode === "hand" && !active?.joints) active = chooseHand() || chooseController();
    if (active === leftControllerRef || active === rightControllerRef) activeMode = "controller";
    if (active === leftHandRef || active === rightHandRef) activeMode = "hand";
    updateFire(leftFire, leftHandRef, mode && activeMode === "hand" && active === leftHandRef);
    updateFire(rightFire, rightHandRef, mode && activeMode === "hand" && active === rightHandRef);
    if (!leftHandRef?.joints && !rightHandRef?.joints && !leftControllerRef?.joints && !rightControllerRef?.joints){ resetTeleportVisuals(); statusCb("Waiting for hands/controllers…"); modeCb("Input not tracked"); return; }
    if (!mode || !active){ resetTeleportVisuals(); statusCb((leftControllerRef || rightControllerRef) ? "Right controller stick: move/turn • trigger/grip only for teleport" : "Fist toggles teleport"); modeCb("A button disabled"); return; }
    setTeleportVisual(true);
    const aim = activeMode === "controller" ? controllerAimPoint(active) : aimPoint(active);
    if (!aim){ pointer.visible=false; ring.visible=false; line.visible=false; statusCb(activeMode === "controller" ? "Aim down with controller" : "Purple fire on • aim down"); modeCb("Teleport armed"); return; }
    const target = clampTarget(aim);
    if (!lastAimValid) smoothedTarget.copy(target); else smoothedTarget.lerp(target, .18);
    lastAimValid = true;
    pointer.visible = true; ring.visible = true;
    pointer.position.set(smoothedTarget.x, .052, smoothedTarget.z);
    ring.position.set(smoothedTarget.x, .058, smoothedTarget.z);
    updateAimLine(smoothedTarget, activeMode === "controller" ? controllerOrigin : (active?.joints?.wrist?.position || null));
    if (activeMode === "controller"){
      const trigger = triggerValue(active), was = !!active.userData._wasTrigger;
      if (trigger > .26 && !was) triggerHoldStart = now;
      const held = triggerHoldStart ? now - triggerHoldStart : 0;
      if (was && trigger <= .18 && held > 130) safeReleaseTeleport(smoothedTarget);
      if (trigger <= .18) triggerHoldStart = 0;
      active.userData._wasTrigger = trigger > .26;
      statusCb("Release trigger/grip to teleport • A disabled"); modeCb("High contrast target"); return;
    }
    const pinch = isPinching(active), wasPinching = !!active.userData._wasPinching;
    if (pinch && !wasPinching) pinchHoldStart = now;
    const held = pinchHoldStart ? now - pinchHoldStart : 0;
    if (wasPinching && !pinch && held > 130) safeReleaseTeleport(smoothedTarget);
    if (!pinch) pinchHoldStart = 0;
    active.userData._wasPinching = pinch;
    statusCb("Release pinch to teleport"); modeCb("Hand teleport armed");
  }

  window.SVR_PHASE143_TELEPORT_LOCK = { phase: PHASE, aButtonDisabled:true, highContrast:true, method:"timeout-deferred-world-root-shift", controllerFallback:true };
  window.SVR_PHASE142_TELEPORT_CRITICAL_LOCK = window.SVR_PHASE143_TELEPORT_LOCK;
  window.SVR_PHASE137_TELEPORT_LOCK = window.SVR_PHASE143_TELEPORT_LOCK;
  window.SVR_PHASE129_TELEPORT_FIX = window.SVR_PHASE143_TELEPORT_LOCK;
  return { onSessionStart,onSessionEnd,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled,getState:()=>({ mode, activeHand:active===rightHandRef || active===rightControllerRef ? "right" : active===leftHandRef || active===leftControllerRef ? "left" : "none", activeMode }) };
}
