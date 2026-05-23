import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist, aimPoint } from "./gestures.js";

const PHASE = "PHASE-96-TELEPORT-RELEASE-HAND-FIRE-LOCK";

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;

  const head = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  const rightDir = new THREE.Vector3();
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);

  let mode = false;
  let active = null;
  let activeMode = "hand";
  let cooldownUntil = 0;
  let lastTP = 0;
  let pinchHoldStart = 0;
  let triggerHoldStart = 0;
  let lastAimValid = false;
  let snapCooldownUntil = 0;
  let lastLeftFist = false;
  let lastRightFist = false;
  let leftHandRef = null;
  let rightHandRef = null;
  let leftControllerRef = null;
  let rightControllerRef = null;

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
  function setPlayerYaw(nextYaw){ playerYaw = nextYaw; return applyReferenceSpace(); }
  function getPlayerPose(){ return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw }; }

  const pointer = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.POINTER_SIZE, CONFIG.POINTER_SIZE),
    new THREE.MeshBasicMaterial({ transparent:true, alphaTest:.25, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, side:THREE.DoubleSide, opacity:.96, color:0xffffff })
  );
  pointer.rotation.x = -Math.PI / 2;
  pointer.position.y = .018;
  pointer.visible = false;
  scene.add(pointer);

  const ringMat = new THREE.MeshStandardMaterial({ color:0xb48cff, roughness:.22, metalness:.28, emissive:0x5e12ff, emissiveIntensity:0, side:THREE.DoubleSide, transparent:true, opacity:.92 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 72), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .015;
  ring.visible = false;
  scene.add(ring);

  const markerGlow = new THREE.PointLight(0xb48cff, 0, 5, 2.0);
  markerGlow.position.y = .4;
  scene.add(markerGlow);

  function makeFireGroup(){
    const g = new THREE.Group();
    g.visible = false;
    const colors = [0x8b35ff, 0xc45cff, 0x6f1fff, 0xff5be9];
    for (let i = 0; i < 12; i++){
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(.018 + (i % 3) * .006, 12, 8),
        new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent:true, opacity:.58, depthWrite:false, blending:THREE.AdditiveBlending })
      );
      s.userData.phase = Math.random() * Math.PI * 2;
      s.userData.radius = .045 + Math.random() * .055;
      s.userData.speed = 1.7 + Math.random() * 1.7;
      g.add(s);
    }
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(.075, 24, 16),
      new THREE.MeshBasicMaterial({ color:0x9b4dff, transparent:true, opacity:.22, depthWrite:false, blending:THREE.AdditiveBlending })
    );
    core.name = "purple_fire_core";
    g.add(core);
    const light = new THREE.PointLight(0x9b4dff, 0, 2.6, 2);
    light.name = "purple_fire_light";
    g.add(light);
    scene.add(g);
    return g;
  }

  const leftFire = makeFireGroup();
  const rightFire = makeFireGroup();

  function updateFireGroup(group, hand, on, t){
    const wrist = hand?.joints?.wrist;
    if (!wrist || !on){ group.visible = false; return; }
    wrist.updateWorldMatrix?.(true, false);
    wrist.getWorldPosition(group.position);
    group.position.y += .015;
    group.visible = true;
    for (const child of group.children){
      if (child.name === "purple_fire_light"){
        child.intensity = 1.7 + Math.sin(t * 4.0) * .45;
        continue;
      }
      if (child.name === "purple_fire_core"){
        child.scale.setScalar(1 + Math.sin(t * 5.0) * .16);
        continue;
      }
      const p = child.userData.phase || 0;
      const r = child.userData.radius || .06;
      const s = child.userData.speed || 2;
      child.position.set(Math.cos(t * s + p) * r, Math.sin(t * 3.2 + p) * .055, Math.sin(t * s + p) * r);
      child.scale.setScalar(.75 + Math.sin(t * 5 + p) * .25);
    }
  }

  function setTeleportVisual(on){
    ringMat.emissiveIntensity = on ? 1.45 : 0;
    markerGlow.intensity = on ? 2.4 : 0;
    window.SVR_TELEPORT_FIRE_STATE = { phase: PHASE, teleportOn: Boolean(on), activeMode };
  }

  function clampTarget(p){
    return new THREE.Vector3(THREE.MathUtils.clamp(p.x, -roomClamp, roomClamp), 0, THREE.MathUtils.clamp(p.z, -roomClamp, roomClamp));
  }

  function resetTeleportVisuals(){
    pointer.visible = false;
    ring.visible = false;
    setTeleportVisual(false);
    lastAimValid = false;
    pinchHoldStart = 0;
    triggerHoldStart = 0;
  }

  function finishTeleport(target){
    if (!renderer?.xr?.isPresenting || !baseRefSpace || !target) return false;
    try{
      const xrCam = renderer.xr.getCamera(camera);
      if (!xrCam) return false;
      xrCam.getWorldPosition(head);
      const prev = { x: playerX, y: playerY, z: playerZ, yaw: playerYaw };
      playerX += target.x - head.x;
      playerZ += target.z - head.z;
      if (!applyReferenceSpace()){
        playerX = prev.x; playerY = prev.y; playerZ = prev.z; playerYaw = prev.yaw;
        applyReferenceSpace();
        return false;
      }
      lastTP = performance.now();
      cooldownUntil = performance.now() + 180;
      mode = false;
      active = null;
      resetTeleportVisuals();
      return true;
    }catch(err){
      log("[teleport] finish failed", err?.message || err);
      return false;
    }
  }

  function controllerGamepad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
  function getButtonValue(gp, idx){ return gp?.buttons?.[idx]?.value || 0; }
  function controllerTriggerValue(proxy){ const gp = controllerGamepad(proxy); return gp ? Math.max(getButtonValue(gp,0), getButtonValue(gp,1), getButtonValue(gp,4), getButtonValue(gp,5)) : 0; }
  function dead(v, zone=.14){ return Math.abs(v || 0) < zone ? 0 : (v || 0); }

  function getStick(gp, pair="left"){
    if (!gp?.axes?.length) return { x:0, y:0 };
    const axes = gp.axes;
    const a = pair === "right" && axes.length >= 4 ? { x:axes[2]||0, y:axes[3]||0 } : { x:axes[0]||0, y:axes[1]||0 };
    return { x:dead(a.x), y:dead(a.y) };
  }

  function bestMoveStick(){
    const gps = [controllerGamepad(leftControllerRef), controllerGamepad(rightControllerRef)].filter(Boolean);
    let best = { x:0, y:0 };
    for (const gp of gps){
      for (const pair of ["left", "right"]){
        const s = getStick(gp, pair);
        if (Math.hypot(s.x, s.y) > Math.hypot(best.x, best.y)) best = s;
      }
    }
    return best;
  }

  function bestTurnStick(){
    const right = controllerGamepad(rightControllerRef);
    const left = controllerGamepad(leftControllerRef);
    const r = right ? getStick(right, "right") : { x:0, y:0 };
    if (Math.abs(r.x) > .15) return r;
    return left ? getStick(left, "right") : r;
  }

  function movePlayerFromControllers(dt){
    if (!renderer?.xr?.isPresenting) return;
    const moveStick = bestMoveStick();
    const turnStick = bestTurnStick();
    if (Math.abs(turnStick.x) > .72 && performance.now() > snapCooldownUntil){
      playerYaw += Math.sign(turnStick.x) * (Math.PI / 4);
      applyReferenceSpace();
      snapCooldownUntil = performance.now() + 220;
    }
    if (Math.hypot(moveStick.x, moveStick.y) < .12) return;
    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldDirection(headDir);
    headDir.y = 0;
    if (headDir.lengthSq() < 1e-5) headDir.set(0, 0, -1);
    headDir.normalize();
    rightDir.set(headDir.z, 0, -headDir.x).normalize();
    const speed = 3.05;
    const stepX = (rightDir.x * moveStick.x + headDir.x * (-moveStick.y)) * speed * dt;
    const stepZ = (rightDir.z * moveStick.x + headDir.z * (-moveStick.y)) * speed * dt;
    setPlayerXZ(THREE.MathUtils.clamp(playerX + stepX, -roomClamp, roomClamp), THREE.MathUtils.clamp(playerZ + stepZ, -roomClamp, roomClamp));
  }

  function controllerAimPoint(proxy){
    const controller = proxy?.userData?.controller;
    if (!controller) return null;
    controller.updateWorldMatrix?.(true, false);
    controller.getWorldPosition(controllerOrigin);
    controller.getWorldDirection(controllerDir);
    if (controllerDir.y > -.08) controllerDir.y = -.08;
    controllerDir.normalize();
    const t = (controllerOrigin.y - 0) / (-controllerDir.y);
    if (!isFinite(t) || t < .08) return null;
    return new THREE.Vector3(controllerOrigin.x + controllerDir.x * Math.min(t, 160), 0, controllerOrigin.z + controllerDir.z * Math.min(t, 160));
  }

  function chooseController(){ return rightControllerRef?.joints ? rightControllerRef : leftControllerRef?.joints ? leftControllerRef : null; }
  function chooseHand(){ return rightHandRef?.joints ? rightHandRef : leftHandRef?.joints ? leftHandRef : null; }

  function turnOnTeleport(nextActive, nextMode){
    mode = true;
    active = nextActive;
    activeMode = nextMode;
    cooldownUntil = performance.now() + 80;
    pinchHoldStart = 0;
    triggerHoldStart = 0;
  }

  function toggleMode(preferred="right"){
    if (mode){ mode = false; active = null; resetTeleportVisuals(); return false; }
    const ctrl = preferred === "left" ? (leftControllerRef?.joints ? leftControllerRef : chooseController()) : (rightControllerRef?.joints ? rightControllerRef : chooseController());
    const hand = preferred === "left" ? (leftHandRef?.joints ? leftHandRef : chooseHand()) : (rightHandRef?.joints ? rightHandRef : chooseHand());
    if (ctrl) turnOnTeleport(ctrl, "controller");
    else if (hand) turnOnTeleport(hand, "hand");
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
    resetTeleportVisuals();
  }

  function setLogoTexture(tex){ if (tex){ tex.anisotropy = 8; pointer.material.map = tex; pointer.material.needsUpdate = true; } }

  function update({ dt=.016, leftHand, rightHand, leftController, rightController, statusCb=()=>{}, modeCb=()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand; rightHandRef = rightHand; leftControllerRef = leftController; rightControllerRef = rightController;
    movePlayerFromControllers(dt);

    const leftFist = !!leftHandRef?.joints && isFist(leftHandRef);
    const rightFist = !!rightHandRef?.joints && isFist(rightHandRef);
    if (leftFist && !lastLeftFist && now > cooldownUntil){ mode && active === leftHandRef ? (mode=false, active=null, resetTeleportVisuals()) : turnOnTeleport(leftHandRef, "hand"); }
    if (rightFist && !lastRightFist && now > cooldownUntil){ mode && active === rightHandRef ? (mode=false, active=null, resetTeleportVisuals()) : turnOnTeleport(rightHandRef, "hand"); }
    lastLeftFist = leftFist; lastRightFist = rightFist;

    const leftTrigger = controllerTriggerValue(leftControllerRef);
    const rightTrigger = controllerTriggerValue(rightControllerRef);
    if (!mode && now > cooldownUntil){
      if (rightTrigger > .30 && rightControllerRef?.joints) turnOnTeleport(rightControllerRef, "controller");
      else if (leftTrigger > .30 && leftControllerRef?.joints) turnOnTeleport(leftControllerRef, "controller");
    }

    if (mode && activeMode === "controller" && !active?.joints) active = chooseController() || chooseHand();
    if (mode && activeMode === "hand" && !active?.joints) active = chooseHand() || chooseController();
    if (active === leftControllerRef || active === rightControllerRef) activeMode = "controller";
    if (active === leftHandRef || active === rightHandRef) activeMode = "hand";

    const t = now * .001;
    const activeLeft = mode && activeMode === "hand" && active === leftHandRef;
    const activeRight = mode && activeMode === "hand" && active === rightHandRef;
    updateFireGroup(leftFire, leftHandRef, activeLeft, t);
    updateFireGroup(rightFire, rightHandRef, activeRight, t);

    if (!leftHandRef?.joints && !rightHandRef?.joints && !leftControllerRef?.joints && !rightControllerRef?.joints){
      resetTeleportVisuals();
      statusCb("Waiting for hands or controllers…");
      modeCb("Input: not tracked");
      return;
    }

    if (!mode || !active){
      resetTeleportVisuals();
      statusCb((leftControllerRef || rightControllerRef) ? "Controllers active • stick move • right stick snap • hold trigger/A then release TP" : "TELEPORT OFF • make fist to turn on purple hand fire");
      modeCb((leftControllerRef || rightControllerRef) ? "Controllers ready" : "Hands ready • fist toggles TP");
      return;
    }

    setTeleportVisual(true);
    const aim = activeMode === "controller" ? controllerAimPoint(active) : aimPoint(active);
    if (!aim){
      pointer.visible = false;
      ring.visible = false;
      statusCb(activeMode === "controller" ? "CONTROLLER TP ON • aim down, release trigger/A to move" : "HAND TP ON • purple fire active • aim, release pinch to move");
      modeCb(activeMode === "controller" ? "Controllers: TELEPORT ON" : "Hands: TELEPORT ON");
      return;
    }

    const target = clampTarget(aim);
    if (!lastAimValid) smoothedTarget.copy(target);
    else smoothedTarget.lerp(target, .35);
    lastAimValid = true;
    pointer.visible = true;
    ring.visible = true;
    pointer.position.copy(smoothedTarget).setY(.018);
    ring.position.copy(smoothedTarget).setY(.015);
    markerGlow.position.copy(smoothedTarget).setY(.34);

    if (activeMode === "controller"){
      const trigger = controllerTriggerValue(active);
      const was = !!active.userData._wasTrigger;
      if (trigger > .22 && !was) triggerHoldStart = now;
      const held = triggerHoldStart ? now - triggerHoldStart : 0;
      if (was && trigger <= .16 && held > 70 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
        if (!finishTeleport(smoothedTarget)) statusCb("TELEPORT RESET • aim again");
      }
      if (trigger <= .16) triggerHoldStart = 0;
      active.userData._wasTrigger = trigger > .22;
      statusCb("CONTROLLER TP ON • release trigger/A to move");
      modeCb("Controllers: TELEPORT ON");
      return;
    }

    const pinch = isPinching(active);
    const wasPinching = !!active.userData._wasPinching;
    if (pinch && !wasPinching) pinchHoldStart = now;
    const held = pinchHoldStart ? now - pinchHoldStart : 0;
    if (wasPinching && !pinch && held > 70 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      if (!finishTeleport(smoothedTarget)) statusCb("TELEPORT RESET • aim again");
    }
    if (!pinch) pinchHoldStart = 0;
    active.userData._wasPinching = pinch;
    statusCb("HAND TP ON • purple fire active • release pinch to move");
    modeCb("Hands: TELEPORT ON");
  }

  return { onSessionStart, setLogoTexture, update, setPlayerPose, setPlayerXZ, getPlayerPose, setPlayerYaw, toggleMode, getState:()=>({ mode, activeHand: active===rightHandRef || active===rightControllerRef ? "right" : active===leftHandRef || active===leftControllerRef ? "left" : "none", activeMode }) };
}
