import * as THREE from "three";
import { CONFIG } from "./config.js";
import { controllerGamepad, buttonValue, nextCameraForwardPosition, shouldSnapTurn } from "./locomotion_lock.js";

const PHASE = "PHASE-145-GRAPHICS-CONTRAST-NO-MUSIC-TELEPORT-ALIGNMENT-LOCK";

export function createTeleportRig({ scene, renderer, camera, roomClamp, worldRoot = null, log = console.log }){
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;
  let mode = false;
  let active = null;
  let armedBy = "none";
  let cooldownUntil = 0;
  let lastTP = 0;
  let triggerHoldStart = 0;
  let gripHoldStart = 0;
  let snapCooldownUntil = 0;
  let rightControllerRef = null;
  let pendingCommit = false;
  let lastAimValid = false;

  const controllerOrigin = new THREE.Vector3();
  const controllerDirRaw = new THREE.Vector3();
  const controllerDirAlt = new THREE.Vector3();
  const selectedDir = new THREE.Vector3();
  const camForward = new THREE.Vector3();
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
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,512,512);
    const g = ctx.createRadialGradient(256,256,20,256,256,224);
    g.addColorStop(0,"rgba(255,255,255,1)");
    g.addColorStop(.25,"rgba(0,255,102,.98)");
    g.addColorStop(.62,"rgba(255,236,0,.90)");
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0,0,512,512);
    ctx.strokeStyle = "rgba(0,0,0,.95)"; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.arc(256,256,150,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = "#030303"; ctx.font = "900 112px system-ui,Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("SVR",256,242);
    ctx.font = "900 45px system-ui,Arial"; ctx.fillText("TELEPORT",256,326);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.generateMipmaps = true;
    return tex;
  }

  const pointer = new THREE.Mesh(
    new THREE.CircleGeometry(0.76, 64),
    new THREE.MeshBasicMaterial({ map:makeLogoTexture(), color:0xffffff, transparent:true, opacity:1, depthWrite:false, depthTest:false, side:THREE.DoubleSide, toneMapped:false })
  );
  pointer.name = "SVR_PHASE145_ALIGNED_RIGHT_CONTROLLER_TELEPORT_LOGO";
  pointer.rotation.x = -Math.PI / 2;
  pointer.position.y = .06;
  pointer.visible = false;
  pointer.renderOrder = 950;
  pointer.userData.svrNoWorldShift = true;
  scene.add(pointer);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.90, 1.28, 80),
    new THREE.MeshBasicMaterial({ color:0xffff00, side:THREE.DoubleSide, transparent:true, opacity:1, depthWrite:false, depthTest:false, toneMapped:false })
  );
  ring.name = "SVR_PHASE145_TELEPORT_CONTRAST_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .064;
  ring.visible = false;
  ring.renderOrder = 951;
  ring.userData.svrNoWorldShift = true;
  scene.add(ring);

  const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1)]);
  const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color:0x00ffff, transparent:true, opacity:1, depthTest:false, depthWrite:false, toneMapped:false }));
  line.name = "SVR_PHASE145_RIGHT_CONTROLLER_AIM_LINE_ALIGNED";
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
    gripHoldStart = 0;
  }
  function setModeOff(){
    mode = false;
    active = null;
    armedBy = "none";
    resetTeleportVisuals();
  }

  function safeReleaseTeleport(target){
    const now = performance.now();
    if (!target || now - lastTP < 900 || pendingCommit) return false;
    lastTP = now;
    cooldownUntil = now + 900;
    pendingCommit = true;
    commitTarget.copy(target);
    setModeOff();
    setTimeout(()=>{
      requestAnimationFrame(()=>{
        setPlayerXZ(commitTarget.x, commitTarget.z);
        pendingCommit = false;
        window.SVR_TELEPORT_COMMIT = { phase: PHASE, ok: true, moved: true, method: "right-trigger-only-aligned-deferred-world-shift", target: { x: commitTarget.x, z: commitTarget.z }, at: new Date().toISOString() };
      });
    }, 120);
    return true;
  }

  function movePlayerFromRightController(dt){
    if (!renderer?.xr?.isPresenting || mode || pendingCommit) return;
    const snap = shouldSnapTurn(null, rightControllerRef, performance.now() > snapCooldownUntil);
    if (snap){ setPlayerYaw(playerYaw + snap); snapCooldownUntil = performance.now() + 500; }
    const next = nextCameraForwardPosition({ renderer, camera, leftControllerRef:null, rightControllerRef, playerX, playerZ, roomClamp, dt, speed:1.35 });
    if (next.moved) setPlayerXZ(next.x, next.z);
  }

  function chooseAimDirection(controller){
    controller.getWorldDirection(controllerDirRaw);
    controllerDirRaw.normalize();
    controllerDirAlt.copy(controllerDirRaw).multiplyScalar(-1);

    camForward.set(0,0,-1);
    const xrCam = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
    xrCam?.getWorldDirection?.(camForward);
    camForward.y = 0;
    if (camForward.lengthSq() < 0.0001) camForward.set(0,0,-1);
    camForward.normalize();

    const rawScore = controllerDirRaw.x * camForward.x + controllerDirRaw.z * camForward.z;
    const altScore = controllerDirAlt.x * camForward.x + controllerDirAlt.z * camForward.z;
    selectedDir.copy(altScore > rawScore ? controllerDirAlt : controllerDirRaw);
    if (selectedDir.y > -0.12) selectedDir.y = -0.12;
    selectedDir.normalize();
    return selectedDir;
  }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(controllerOrigin);
    const dir = chooseAimDirection(controller);
    const t = controllerOrigin.y / (-dir.y);
    if (!isFinite(t) || t < .12) return null;
    const maxT = Math.min(t, 18);
    controllerOrigin.x += dir.x * maxT;
    controllerOrigin.y = 0;
    controllerOrigin.z += dir.z * maxT;
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
  function readRightButtons(){
    const gp = controllerGamepad(rightControllerRef);
    return {
      trigger: buttonValue(gp, 0),
      grip: buttonValue(gp, 1)
    };
  }
  function turnOnTeleport(kind = "trigger"){
    if (!rightControllerRef?.joints) return false;
    mode = true;
    active = rightControllerRef;
    armedBy = kind;
    cooldownUntil = performance.now() + 160;
    triggerHoldStart = 0;
    gripHoldStart = 0;
    return true;
  }
  function toggleMode(){
    if (mode){ setModeOff(); return false; }
    return turnOnTeleport("watch");
  }
  async function onSessionStart(){
    playerYaw = 0;
    playerX = CONFIG.SPAWN_X;
    playerY = 0;
    playerZ = CONFIG.SPAWN_Z;
    pendingCommit = false;
    setModeOff();
    syncWorldRoot();
    window.SVR_TELEPORT_COMMIT = { phase:PHASE, method:"right-controller-aligned-trigger-only", session:"started", safeSpawn:{x:playerX,z:playerZ} };
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

    const buttons = readRightButtons();
    if (!mode && !pendingCommit && now > cooldownUntil){
      if (buttons.trigger > .20) turnOnTeleport("trigger");
      else if (buttons.grip > .24) turnOnTeleport("grip-preview");
    }

    if (!mode || !active){
      resetTeleportVisuals();
      statusCb("Right trigger teleports • grip previews only");
      modeCb("Right controller aligned");
      return;
    }

    const aim = controllerAimPoint(active);
    if (!aim){
      pointer.visible = false; ring.visible = false; line.visible = false;
      statusCb("Aim right controller down/in front at floor");
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

    if (buttons.trigger > .20 && !rightControllerRef.userData._wasTrigger) triggerHoldStart = now;
    if (buttons.grip > .24 && !rightControllerRef.userData._wasGrip) gripHoldStart = now;
    const triggerHeld = triggerHoldStart ? now - triggerHoldStart : 0;

    if (rightControllerRef.userData._wasTrigger && buttons.trigger <= .12 && triggerHeld > 110){
      safeReleaseTeleport(smoothedTarget);
    }
    // Phase 145: grip release no longer commits teleport because grip release was freezing.
    if (rightControllerRef.userData._wasGrip && buttons.grip <= .12 && armedBy === "grip-preview"){
      setModeOff();
      cooldownUntil = now + 260;
    }
    if (buttons.trigger <= .12) triggerHoldStart = 0;
    if (buttons.grip <= .12) gripHoldStart = 0;
    rightControllerRef.userData._wasTrigger = buttons.trigger > .20;
    rightControllerRef.userData._wasGrip = buttons.grip > .24;

    statusCb(armedBy === "grip-preview" ? "Grip preview only • use trigger to teleport" : "SVR logo aligned • release trigger to teleport");
    modeCb("Right controller aligned");
  }

  window.SVR_PHASE145_TELEPORT_LOCK = { phase: PHASE, rightControllerOnly:true, handTrackingDisabled:true, triggerOnlyCommit:true, gripPreviewOnly:true, alignmentFix:"auto-flips controller aim so target stays in front", generatedLogo:true, commitDelayMs:120, method:"right-trigger-only-deferred-world-root-shift" };
  window.SVR_PHASE144_TELEPORT_LOCK = window.SVR_PHASE145_TELEPORT_LOCK;
  window.SVR_PHASE143_TELEPORT_LOCK = window.SVR_PHASE145_TELEPORT_LOCK;
  window.SVR_PHASE142_TELEPORT_CRITICAL_LOCK = window.SVR_PHASE145_TELEPORT_LOCK;
  window.SVR_PHASE137_TELEPORT_LOCK = window.SVR_PHASE145_TELEPORT_LOCK;
  window.SVR_PHASE129_TELEPORT_FIX = window.SVR_PHASE145_TELEPORT_LOCK;
  return { onSessionStart,onSessionEnd,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled,getState:()=>({ mode, activeHand:rightControllerRef ? "right" : "none", activeMode:"right-controller-aligned", armedBy }) };
}
