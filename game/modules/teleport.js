import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist, aimPoint } from "./gestures.js";

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;
  let snapCooldownUntil = 0;
  let lastTP = 0;
  let manualMode = false;
  let activeSource = null;
  let activeMode = "none";
  let holdStart = 0;
  let stableTargetMs = 0;
  let lastAimValid = false;
  let wasHolding = false;
  let leftHandRef = null, rightHandRef = null, leftControllerRef = null, rightControllerRef = null;

  const head = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(0,0,CONFIG.SPAWN_Z);

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
    }catch(err){ log("[teleport] reference-space apply failed", err?.message || err); return false; }
  }
  function setPlayerPose(x,y,z){ playerX=x; playerY=y; playerZ=z; return applyReferenceSpace(); }
  function setPlayerXZ(x,z){ playerX=x; playerZ=z; return applyReferenceSpace(); }
  function getPlayerPose(){ return { x:playerX, y:playerY, z:playerZ, yaw:playerYaw }; }
  function setPlayerYaw(yaw){ playerYaw=yaw; return applyReferenceSpace(); }

  const pointer = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.POINTER_SIZE, CONFIG.POINTER_SIZE),
    new THREE.MeshBasicMaterial({ transparent:true, alphaTest:.35, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, side:THREE.DoubleSide, opacity:.96, color:0xffffff })
  );
  pointer.rotation.x = -Math.PI/2; pointer.position.y = .018; pointer.visible = false; scene.add(pointer);
  const ringMat = new THREE.MeshStandardMaterial({ color:0xb48cff, roughness:.22, metalness:.28, emissive:0x2a0d3a, emissiveIntensity:0, side:THREE.DoubleSide, transparent:true, opacity:.95 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 96), ringMat);
  ring.rotation.x = -Math.PI/2; ring.position.y = .015; ring.visible = false; scene.add(ring);
  const markerGlow = new THREE.PointLight(0xb48cff,0,4.5,2.0); markerGlow.position.y = .4; scene.add(markerGlow);

  function hideTeleportVisuals(){ pointer.visible=false; ring.visible=false; markerGlow.intensity=0; ringMat.emissiveIntensity=0; }
  function showTeleportVisuals(){ pointer.visible=true; ring.visible=true; markerGlow.intensity=2.1; ringMat.emissiveIntensity=1.15; }
  function clampTarget(p){ return new THREE.Vector3(THREE.MathUtils.clamp(p.x,-roomClamp,roomClamp),0,THREE.MathUtils.clamp(p.z,-roomClamp,roomClamp)); }

  function teleportByDelta(target){
    if (!renderer?.xr?.isPresenting || !baseRefSpace) return false;
    try{
      const xrCam = renderer.xr.getCamera(camera); if (!xrCam) return false;
      xrCam.getWorldPosition(head);
      const prev = { x:playerX, y:playerY, z:playerZ, yaw:playerYaw };
      playerX += target.x - head.x; playerZ += target.z - head.z;
      if (!applyReferenceSpace()){ playerX=prev.x; playerY=prev.y; playerZ=prev.z; playerYaw=prev.yaw; applyReferenceSpace(); return false; }
      return true;
    }catch(err){ log("[teleport] jump failed", err?.message || err); return false; }
  }

  function controllerGamepad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
  function buttonValue(gp, idx){ return gp?.buttons?.[idx]?.value || 0; }
  function controllerHoldValue(proxy){
    const gp = controllerGamepad(proxy); if (!gp) return 0;
    return Math.max(buttonValue(gp,0), buttonValue(gp,1), buttonValue(gp,3), buttonValue(gp,4), buttonValue(gp,5));
  }
  function axis(v){ return Math.abs(v) < .16 ? 0 : v; }
  function getRightStick(gp){
    if (!gp?.axes?.length) return {x:0,y:0};
    let x = gp.axes.length >= 4 ? gp.axes[2] || 0 : gp.axes[0] || 0;
    let y = gp.axes.length >= 4 ? gp.axes[3] || 0 : gp.axes[1] || 0;
    if (Math.abs(x) < .001 && Math.abs(y) < .001){ x = gp.axes[0] || 0; y = gp.axes[1] || 0; }
    return { x:axis(x), y:axis(y) };
  }
  function getLeftStick(gp){
    if (!gp?.axes?.length) return {x:0,y:0};
    return { x:axis(gp.axes[0] || 0), y:axis(gp.axes[1] || 0) };
  }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller; if (!controller) return null;
    controller.updateWorldMatrix?.(true,false);
    controller.getWorldPosition(controllerOrigin);
    controller.getWorldDirection(controllerDir);
    if (controllerDir.y > -.08) controllerDir.y = -.08;
    controllerDir.normalize();
    const t = controllerOrigin.y / -controllerDir.y;
    if (!isFinite(t) || t < .12) return null;
    const d = Math.min(t,160);
    return new THREE.Vector3(controllerOrigin.x + controllerDir.x*d, 0, controllerOrigin.z + controllerDir.z*d);
  }

  function handHolding(hand){ return !!hand?.joints && (isFist(hand) || isPinching(hand)); }
  function handAim(hand){ return aimPoint(hand); }

  function movePlayerFromControllers(dt){
    const rightGp = controllerGamepad(rightControllerRef);
    const leftGp = controllerGamepad(leftControllerRef);
    const right = getRightStick(rightGp);
    const left = getLeftStick(leftGp);

    if (Math.abs(right.x) > .72 && performance.now() > snapCooldownUntil){
      playerYaw += Math.sign(right.x) * (Math.PI/4);
      applyReferenceSpace();
      snapCooldownUntil = performance.now() + 220;
    }

    const moveX = Math.abs(right.y) > .12 ? 0 : left.x;
    const moveY = Math.abs(right.y) > .12 ? right.y : left.y;
    if (Math.hypot(moveX,moveY) < .12) return;

    const xrCam = renderer.xr.getCamera(camera); if (!xrCam) return;
    xrCam.getWorldDirection(headDir); headDir.y = 0;
    if (headDir.lengthSq() < 1e-5) headDir.set(0,0,-1);
    headDir.normalize();
    const rightDir = new THREE.Vector3(headDir.z,0,-headDir.x).normalize();
    const speed = 3.2;
    const stepX = (rightDir.x*moveX + headDir.x*(-moveY)) * speed * dt;
    const stepZ = (rightDir.z*moveX + headDir.z*(-moveY)) * speed * dt;
    setPlayerXZ(THREE.MathUtils.clamp(playerX + stepX,-roomClamp,roomClamp), THREE.MathUtils.clamp(playerZ + stepZ,-roomClamp,roomClamp));
  }

  function chooseHeldSource(){
    const rightHold = controllerHoldValue(rightControllerRef);
    const leftHold = controllerHoldValue(leftControllerRef);
    if (rightHold > .22) return { source:rightControllerRef, mode:"controller", holding:true, label:"Right controller" };
    if (leftHold > .22) return { source:leftControllerRef, mode:"controller", holding:true, label:"Left controller" };
    if (handHolding(rightHandRef)) return { source:rightHandRef, mode:"hand", holding:true, label:"Right hand" };
    if (handHolding(leftHandRef)) return { source:leftHandRef, mode:"hand", holding:true, label:"Left hand" };
    if (manualMode){
      const src = rightControllerRef || leftControllerRef || rightHandRef || leftHandRef;
      const mode = (src === rightControllerRef || src === leftControllerRef) ? "controller" : "hand";
      return { source:src, mode, holding:false, label:"Manual TP" };
    }
    return { source:null, mode:"none", holding:false, label:"" };
  }

  async function onSessionStart(){
    const session = renderer.xr.getSession(); if (!session) return;
    baseRefSpace = await session.requestReferenceSpace("local-floor");
    playerYaw = 0; setPlayerPose(CONFIG.SPAWN_X,0,CONFIG.SPAWN_Z);
    manualMode=false; activeSource=null; activeMode="none"; holdStart=0; wasHolding=false; stableTargetMs=0; lastAimValid=false; hideTeleportVisuals();
  }
  function setLogoTexture(tex){ if (!tex) return; tex.anisotropy = 8; pointer.material.map = tex; pointer.material.needsUpdate = true; }
  function toggleMode(){ manualMode = !manualMode; if (!manualMode){ activeSource=null; activeMode="none"; holdStart=0; stableTargetMs=0; lastAimValid=false; hideTeleportVisuals(); } return manualMode; }
  function isEnabled(){ return manualMode; }

  function update({ dt=.016, leftHand, rightHand, leftController, rightController, statusCb=()=>{}, modeCb=()=>{} }){
    const now = performance.now();
    leftHandRef=leftHand; rightHandRef=rightHand; leftControllerRef=leftController; rightControllerRef=rightController;
    if (renderer?.xr?.isPresenting && (leftControllerRef || rightControllerRef)) movePlayerFromControllers(dt);

    const held = chooseHeldSource();
    const wasActive = !!activeSource;
    if (held.source){ activeSource = held.source; activeMode = held.mode; }

    if (!activeSource){
      hideTeleportVisuals(); stableTargetMs=0; lastAimValid=false; holdStart=0; wasHolding=false;
      statusCb((leftControllerRef || rightControllerRef) ? "Controllers ready • right stick move/snap • hold A/grip/trigger to teleport" : "Hands ready • hold fist/pinch to aim teleport");
      modeCb((leftControllerRef || rightControllerRef) ? "Right stick locomotion ready" : "Hands ready");
      return;
    }

    const currentlyHolding = held.holding || manualMode;
    if (currentlyHolding && !wasHolding) holdStart = now;
    const aim = activeMode === "controller" ? controllerAimPoint(activeSource) : handAim(activeSource);
    if (currentlyHolding && aim){
      const target = clampTarget(aim);
      if (!lastAimValid){ smoothedTarget.copy(target); stableTargetMs = 0; }
      else {
        const jitter = smoothedTarget.distanceTo(target);
        stableTargetMs = jitter < .18 ? stableTargetMs + dt*1000 : 0;
        smoothedTarget.lerp(target, jitter < .32 ? .36 : .20);
      }
      lastAimValid = true;
      showTeleportVisuals();
      pointer.position.copy(smoothedTarget).setY(.018); ring.position.copy(smoothedTarget).setY(.015); markerGlow.position.copy(smoothedTarget).setY(.34);
      statusCb(activeMode === "controller" ? "CONTROLLER TP • hold A/grip/trigger, release to teleport" : "HAND TP • hold fist/pinch, release to teleport");
      modeCb(activeMode === "controller" ? "Controller teleport aiming" : "Hand teleport aiming");
    } else if (wasHolding && wasActive){
      const heldMs = holdStart ? now - holdStart : 0;
      if (lastAimValid && heldMs > 130 && stableTargetMs > 80 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
        if (teleportByDelta(smoothedTarget)){ lastTP = now; statusCb("Teleported"); }
        else statusCb("Teleport failed • aim again");
      }
      if (!manualMode){ activeSource=null; activeMode="none"; }
      holdStart=0; stableTargetMs=0; lastAimValid=false; hideTeleportVisuals();
    } else if (!currentlyHolding && !manualMode){
      activeSource=null; activeMode="none"; holdStart=0; stableTargetMs=0; lastAimValid=false; hideTeleportVisuals();
    }
    wasHolding = currentlyHolding;
  }

  return { onSessionStart, setLogoTexture, update, setPlayerPose, setPlayerXZ, getPlayerPose, setPlayerYaw, toggleMode, isEnabled, getState:()=>({ mode:manualMode, activeHand: activeSource === rightHandRef || activeSource === rightControllerRef ? "right" : activeSource === leftHandRef || activeSource === leftControllerRef ? "left" : "none", activeMode }) };
}
