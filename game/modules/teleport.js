import * as THREE from "three";
import { CONFIG } from "./config.js";
import { triggerValue, nextCameraForwardPosition, shouldSnapTurn } from "./locomotion_lock.js";

const PHASE = "PHASE-144-RIGHT-CONTROLLER-ONLY-TELEPORT-FREEZE-ISOLATION-LOCK";

export function createTeleportRig({ scene, renderer, camera, roomClamp, worldRoot = null, log = console.log }){
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;
  let mode = false;
  let active = null;
  let cooldownUntil = 0;
  let lastTP = 0;
  let triggerHoldStart = 0;
  let snapCooldownUntil = 0;
  let rightControllerRef = null;
  let pendingCommit = false;
  let lastAimValid = false;

  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
  const clampedTarget = new THREE.Vector3(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
  const commitTarget = new THREE.Vector3(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);

  function syncWorldRoot(){
    if (renderer?.xr?.isPresenting && worldRoot){
      worldRoot.position.set(-playerX, -playerY, -playerZ);
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
    writePose();
    return true;
  }
  function setPlayerXZ(x, z){
    playerX = THREE.MathUtils.clamp(x, -roomClamp * 1.05, roomClamp * 1.05);
    playerZ = THREE.MathUtils.clamp(z, -roomClamp * 1.05, roomClamp * 1.05);
    if (renderer?.xr?.isPresenting) syncWorldRoot(); else { camera.position.x = playerX; camera.position.z = playerZ; }
    writePose();
    return true;
  }
  function setPlayerYaw(nextYaw){ playerYaw = nextYaw; syncWorldRoot(); writePose(); return true; }
  function getPlayerPose(){ return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw }; }
  function isEnabled(){ return mode; }

  function makeLogoTexture(){
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(128,128,14,128,128,122);
    g.addColorStop(0,"rgba(255,255,255,1)");
    g.addColorStop(.25,"rgba(0,255,102,.96)");
    g.addColorStop(.62,"rgba(255,255,0,.80)");
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0,0,256,256);
    ctx.strokeStyle = "rgba(0,0,0,.82)"; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(128,128,75,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = "#050505"; ctx.font = "900 58px system-ui,Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("SVR",128,122);
    ctx.font = "900 23px system-ui,Arial"; ctx.fillText("TELEPORT",128,166);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 1;
    tex.generateMipmaps = false;
    return tex;
  }

  const pointer = new THREE.Mesh(
    new THREE.CircleGeometry(0.70, 48),
    new THREE.MeshBasicMaterial({ map:makeLogoTexture(), color:0xffffff, transparent:true, opacity:.98, depthWrite:false, depthTest:false, side:THREE.DoubleSide, toneMapped:false })
  );
  pointer.name = "SVR_PHASE144_RIGHT_CONTROLLER_TELEPORT_LOGO";
  pointer.rotation.x = -Math.PI / 2;
  pointer.position.y = .06;
  pointer.visible = false;
  pointer.renderOrder = 950;
  pointer.userData.svrNoWorldShift = true;
  scene.add(pointer);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.86, 1.22, 64),
    new THREE.MeshBasicMaterial({ color:0xffff00, side:THREE.DoubleSide, transparent:true, opacity:.98, depthWrite:false, depthTest:false, toneMapped:false })
  );
  ring.name = "SVR_PHASE144_TELEPORT_CONTRAST_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .064;
  ring.visible = false;
  ring.renderOrder = 951;
  ring.userData.svrNoWorldShift = true;
  scene.add(ring);

  const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1)]);
  const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color:0x00ffff, transparent:true, opacity:.95, depthTest:false, depthWrite:false, toneMapped:false }));
  line.name = "SVR_PHASE144_RIGHT_CONTROLLER_AIM_LINE";
  line.visible = false;
  line.renderOrder = 952;
  line.userData.svrNoWorldShift = true;
  scene.add(line);

  function clampTarget(p){
    clampedTarget.set(THREE.MathUtils.clamp(p.x, -roomClamp, roomClamp), 0, THREE.MathUtils.clamp(p.z, -roomClamp, roomClamp));
    return clampedTarget;
  }
  function resetTeleportVisuals(){
    pointer.visible = false;
    ring.visible = false;
    line.visible = false;
    lastAimValid = false;
    triggerHoldStart = 0;
  }
  function setModeOff(){
    mode = false;
    active = null;
    resetTeleportVisuals();
  }

  function safeReleaseTeleport(target){
    const now = performance.now();
    if (!target || now - lastTP < 800 || pendingCommit) return false;
    lastTP = now;
    cooldownUntil = now + 800;
    pendingCommit = true;
    commitTarget.copy(target);
    setModeOff();
    setTimeout(()=>{
      requestAnimationFrame(()=>{
        setPlayerXZ(commitTarget.x, commitTarget.z);
        pendingCommit = false;
        window.SVR_TELEPORT_COMMIT = { phase: PHASE, ok: true, moved: true, method: "right-controller-only-trigger-grip-deferred-two-step-world-shift", target: { x: commitTarget.x, z: commitTarget.z }, at: new Date().toISOString() };
      });
    }, 80);
    return true;
  }

  function movePlayerFromRightController(dt){
    if (!renderer?.xr?.isPresenting || mode || pendingCommit) return;
    const snap = shouldSnapTurn(null, rightControllerRef, performance.now() > snapCooldownUntil);
    if (snap){ setPlayerYaw(playerYaw + snap); snapCooldownUntil = performance.now() + 500; }
    const next = nextCameraForwardPosition({ renderer, camera, leftControllerRef:null, rightControllerRef, playerX, playerZ, roomClamp, dt, speed:1.35 });
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
  function updateAimLine(target){
    if (!target){ line.visible = false; return; }
    const pos = line.geometry.attributes.position;
    pos.setXYZ(0, controllerOrigin.x, controllerOrigin.y, controllerOrigin.z);
    pos.setXYZ(1, target.x, .09, target.z);
    pos.needsUpdate = true;
    line.visible = true;
  }
  function turnOnTeleport(){
    if (!rightControllerRef?.joints) return false;
    mode = true;
    active = rightControllerRef;
    cooldownUntil = performance.now() + 160;
    triggerHoldStart = 0;
    return true;
  }
  function toggleMode(){
    if (mode){ setModeOff(); return false; }
    return turnOnTeleport();
  }
  async function onSessionStart(){
    playerYaw = 0;
    playerX = CONFIG.SPAWN_X;
    playerY = 0;
    playerZ = CONFIG.SPAWN_Z;
    pendingCommit = false;
    setModeOff();
    syncWorldRoot();
    window.SVR_TELEPORT_COMMIT = { phase:PHASE, method:"right-controller-only", session:"started", safeSpawn:{x:playerX,z:playerZ} };
  }
  function onSessionEnd(){ setModeOff(); resetWorldRoot(); }
  function setLogoTexture(tex){ }

  function update({ dt=.016, leftHand, rightHand, leftController, rightController, statusCb=()=>{}, modeCb=()=>{} }){
    const now = performance.now();
    rightControllerRef = rightController || null;
    movePlayerFromRightController(Math.min(dt,.028));

    if (!rightControllerRef?.joints){
      setModeOff();
      statusCb("Waiting for RIGHT Quest controller only…");
      modeCb("Right controller only");
      return;
    }

    const rightTrigger = triggerValue(rightControllerRef);
    if (!mode && !pendingCommit && now > cooldownUntil && rightTrigger > .20){ turnOnTeleport(); }

    if (!mode || !active){
      resetTeleportVisuals();
      statusCb("Right controller: stick move/turn • hold trigger or grip to aim teleport");
      modeCb("Right controller only");
      return;
    }

    const aim = controllerAimPoint(active);
    if (!aim){
      pointer.visible = false; ring.visible = false; line.visible = false;
      statusCb("Aim right controller down at floor");
      modeCb("Teleport armed");
      return;
    }

    const target = clampTarget(aim);
    if (!lastAimValid) smoothedTarget.copy(target); else smoothedTarget.lerp(target, .22);
    lastAimValid = true;
    pointer.visible = true;
    ring.visible = true;
    pointer.position.set(smoothedTarget.x, .06, smoothedTarget.z);
    ring.position.set(smoothedTarget.x, .064, smoothedTarget.z);
    updateAimLine(smoothedTarget);

    const was = !!active.userData._wasTrigger;
    if (rightTrigger > .20 && !was) triggerHoldStart = now;
    const held = triggerHoldStart ? now - triggerHoldStart : 0;
    if (was && rightTrigger <= .12 && held > 110) safeReleaseTeleport(smoothedTarget);
    if (rightTrigger <= .12) triggerHoldStart = 0;
    active.userData._wasTrigger = rightTrigger > .20;

    statusCb("SVR teleport logo visible • release trigger/grip to teleport");
    modeCb("Right controller teleport");
  }

  window.SVR_PHASE144_TELEPORT_LOCK = { phase: PHASE, rightControllerOnly:true, handTrackingDisabled:true, triggerGripOnly:true, aButtonDisabled:true, generatedLogo:true, commitDelayMs:80, method:"deferred-two-step-world-root-shift" };
  window.SVR_PHASE143_TELEPORT_LOCK = window.SVR_PHASE144_TELEPORT_LOCK;
  window.SVR_PHASE142_TELEPORT_CRITICAL_LOCK = window.SVR_PHASE144_TELEPORT_LOCK;
  window.SVR_PHASE137_TELEPORT_LOCK = window.SVR_PHASE144_TELEPORT_LOCK;
  window.SVR_PHASE129_TELEPORT_FIX = window.SVR_PHASE144_TELEPORT_LOCK;
  return { onSessionStart,onSessionEnd,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled,getState:()=>({ mode, activeHand:rightControllerRef ? "right" : "none", activeMode:"right-controller-only" }) };
}
