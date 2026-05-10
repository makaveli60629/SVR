import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist, aimPoint } from "./gestures.js";

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;

  function applyReferenceSpace(){
    if (!baseRefSpace) return;
    const xform = new XRRigidTransform({ x: -playerX, y: -playerY, z: -playerZ });
    renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(xform));
  }

  function setPlayerPose(x, y, z){
    playerX = x;
    playerY = y;
    playerZ = z;
    applyReferenceSpace();
  }

  function setPlayerXZ(x, z){
    setPlayerPose(x, playerY, z);
  }

  function getPlayerPose(){
    return { x: playerX, y: playerY, z: playerZ };
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

  let arcInner = null;
  let arcOuter = null;
  const arcInnerMat = new THREE.MeshBasicMaterial({
    color: 0xb48cff,
    transparent: true,
    opacity: CONFIG.ARC_INNER_OPACITY,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const arcOuterMat = new THREE.MeshBasicMaterial({
    color: 0xb48cff,
    transparent: true,
    opacity: CONFIG.ARC_OUTER_OPACITY,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  function showArc(_from, _to, _dist){
    hideArc();
  }

  function hideArc(){
    if (arcInner) arcInner.visible = false;
    if (arcOuter) arcOuter.visible = false;
  }

  function setGlow(on){
    ringMat.emissiveIntensity = on ? 1.3 : 0.0;
    markerGlow.intensity = on ? 2.2 : 0.0;
    arcInnerMat.opacity = on ? CONFIG.ARC_INNER_OPACITY : 0.0;
    arcOuterMat.opacity = on ? CONFIG.ARC_OUTER_OPACITY : 0.0;
  }

  let mode = false;
  let active = null;
  let cooldownUntil = 0;
  let lastTP = 0;
  let pinchHoldStart = 0;
  let leftHandRef = null;
  let rightHandRef = null;

  const camPos = new THREE.Vector3();
  const wristPos = new THREE.Vector3();
  const head = new THREE.Vector3();
  const FACE_DIST = 0.30;
  const smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);

  function fistNearFace(hand){
    const wrist = hand?.joints?.["wrist"];
    if (!wrist) return false;
    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldPosition(camPos);
    wrist.getWorldPosition(wristPos);
    return wristPos.distanceTo(camPos) < FACE_DIST;
  }

  function clampTarget(p){
    return new THREE.Vector3(
      THREE.MathUtils.clamp(p.x, -roomClamp, roomClamp),
      0,
      THREE.MathUtils.clamp(p.z, -roomClamp, roomClamp)
    );
  }

  function teleportByDelta(target){
    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldPosition(head);
    const dx = target.x - head.x;
    const dz = target.z - head.z;
    setPlayerXZ(playerX + dx, playerZ + dz);
  }

  async function onSessionStart(){
    const session = renderer.xr.getSession();
    baseRefSpace = await session.requestReferenceSpace("local-floor");
    setPlayerPose(CONFIG.SPAWN_X, 0, CONFIG.SPAWN_Z);
    mode = false;
    active = null;
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

  function handState(hand){
    if (!hand?.joints) return { rising: false };
    return { rising: false };
  }

  function toggleMode(preferred = 'right'){
    mode = !mode;
    if (!mode){ active = null; pinchHoldStart = 0; return mode; }
    active = preferred === 'left' ? (leftHandRef?.joints ? leftHandRef : rightHandRef) : (rightHandRef?.joints ? rightHandRef : leftHandRef);
    cooldownUntil = performance.now() + 80;
    return mode;
  }

  function getState(){
    return { mode, activeHand: active === rightHandRef ? 'right' : active === leftHandRef ? 'left' : 'none' };
  }

  function update({ leftHand, rightHand, statusCb = ()=>{}, modeCb = ()=>{} }){
    const now = performance.now();
    leftHandRef = leftHand;
    rightHandRef = rightHand;
    const leftState = handState(leftHand);
    const rightState = handState(rightHand);

    if ((leftState.rising || rightState.rising) && now > cooldownUntil){
      active = rightState.rising ? rightHand : leftHand;
      mode = !mode;
      if (!mode) active = null;
      cooldownUntil = now + CONFIG.TOGGLE_COOLDOWN_MS;
      log("Teleport mode:", mode, "active:", active === rightHand ? "right" : active === leftHand ? "left" : "none");
    }

    if (mode && active && !active?.joints){
      active = leftHand?.joints ? leftHand : rightHand?.joints ? rightHand : null;
    }

    if (!leftHand?.joints && !rightHand?.joints){
      pointer.visible = false;
      ring.visible = false;
      hideArc();
      setGlow(false);
      statusCb("Waiting for hands…");
      modeCb("Hands: not tracked");
      return;
    }

    if (!mode || !active){
      pointer.visible = false;
      ring.visible = false;
      hideArc();
      setGlow(false);
      statusCb("TELEPORT OFF • press TP on watch");
      modeCb("Hands: TELEPORT OFF");
      return;
    }

    setGlow(true);

    const aim = aimPoint(active);
    if (!aim){
      pointer.visible = false;
      ring.visible = false;
      hideArc();
      markerGlow.intensity = 0;
      statusCb("TELEPORT ON • hold pinch briefly then release to jump");
      modeCb(`Hands: TELEPORT ON (${active === rightHand ? "RIGHT" : "LEFT"})`);
      return;
    }

    const target = clampTarget(aim);
    smoothedTarget.copy(target);
    pointer.visible = true;
    ring.visible = true;
    pointer.position.set(smoothedTarget.x, 0.018, smoothedTarget.z);
    ring.position.set(smoothedTarget.x, 0.015, smoothedTarget.z);
    markerGlow.position.set(smoothedTarget.x, 0.45, smoothedTarget.z);

    const xrCam = renderer.xr.getCamera(camera);
    xrCam.getWorldPosition(head);
    const dist = Math.hypot(target.x - head.x, target.z - head.z);

    hideArc();

    statusCb(`TELEPORT ON • Target ${dist.toFixed(1)}m • hold pinch then release to jump`);
    modeCb(`Hands: TELEPORT ON (${active === rightHand ? "RIGHT" : "LEFT"})`);

    const pinch = isPinching(active);
    if (active.userData._wasPinching === undefined) active.userData._wasPinching = false;
    if (pinch && !active.userData._wasPinching) pinchHoldStart = now;
    const held = pinchHoldStart ? (now - pinchHoldStart) : 0;
    if (active.userData._wasPinching && !pinch && held > 140 && now - lastTP > CONFIG.TELEPORT_COOLDOWN_MS){
      teleportByDelta(smoothedTarget);
      lastTP = now + 180;
      cooldownUntil = now + 260;
      mode = false;
      active = null;
      pinchHoldStart = 0;
      pointer.visible = false;
      ring.visible = false;
      hideArc();
      setGlow(false);
    }
    if (!pinch) pinchHoldStart = 0;
    active.userData._wasPinching = pinch;
  }

  return { onSessionStart, setLogoTexture, update, setPlayerPose, setPlayerXZ, getPlayerPose, toggleMode, getState };
}
