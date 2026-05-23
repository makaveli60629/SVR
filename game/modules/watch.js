import * as THREE from "three";
import { isPinching } from "./gestures.js";

const WATCH_PHASE = "PHASE-138-WATCH-UI-INPUT-BRIDGE-LOCK";

function rr(c, x, y, w, h, r){
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

const V0 = new THREE.Vector3();
const V1 = new THREE.Vector3();
const V2 = new THREE.Vector3();
const V3 = new THREE.Vector3();
const V4 = new THREE.Vector3();
const V5 = new THREE.Vector3();
const V6 = new THREE.Vector3();
const V7 = new THREE.Vector3();
const M0 = new THREE.Matrix4();
const Q0 = new THREE.Quaternion();
const FLIP_Q = new THREE.Quaternion();
const SCREEN_TILT_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.22);
const DISPLAY_MIRRORED = false;
const DISPLAY_ROTATE_180 = false;
const POSE_RESULT = { position: V6, quaternion: Q0 };

function getJointWorld(hand, names, out){
  if (!hand?.joints) return null;
  for (const name of names){
    const joint = hand.joints[name];
    if (!joint) continue;
    joint.updateWorldMatrix?.(true, false);
    joint.getWorldPosition(out);
    return out;
  }
  return null;
}

function getActiveCamera(camera, renderer){
  if (renderer?.xr?.isPresenting) return renderer.xr.getCamera(camera);
  return camera || null;
}

function computeForearmPose(hand, camera, renderer, side = 'left'){
  const wrist = getJointWorld(hand, ['wrist'], V4);
  const index = getJointWorld(hand, ['index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-tip'], V5);
  const pinky = getJointWorld(hand, ['pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-tip'], V6);
  if (!wrist || !index || !pinky) return null;

  const midpoint = V3.copy(index).add(pinky).multiplyScalar(0.5);
  const forearmDir = V0.copy(wrist).sub(midpoint).normalize();
  let acrossPalm = V1.copy(index).sub(pinky).normalize();
  const faceNormal = V2.crossVectors(acrossPalm, forearmDir).normalize();

  const activeCamera = getActiveCamera(camera, renderer);
  if (activeCamera){
    activeCamera.getWorldPosition(V7);
    if (faceNormal.dot(V7.sub(wrist)) < 0) faceNormal.multiplyScalar(-1);
  }

  acrossPalm = V1.crossVectors(faceNormal, forearmDir).normalize();
  if (side === 'right') acrossPalm.multiplyScalar(-1);

  M0.makeBasis(forearmDir, acrossPalm, faceNormal);
  POSE_RESULT.quaternion.setFromRotationMatrix(M0);
  POSE_RESULT.quaternion.multiply(FLIP_Q);
  POSE_RESULT.quaternion.multiply(SCREEN_TILT_Q);

  POSE_RESULT.position.copy(wrist)
    .addScaledVector(forearmDir, 0.088)
    .addScaledVector(faceNormal, 0.024)
    .addScaledVector(acrossPalm, side === 'left' ? -0.004 : 0.004);

  return POSE_RESULT;
}

export function createWristWatch({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 3;

  const group = new THREE.Group();
  group.name = 'SVR_PHASE138_WATCH_INPUT_BRIDGE';
  group.visible = false;
  scene.add(group);

  const plateW = 0.238;
  const plateH = 0.124;

  const frame = new THREE.Mesh(new THREE.BoxGeometry(plateW * 0.98, plateH * 0.98, 0.003), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.46, metalness: 0.12, emissive: 0x090b12, emissiveIntensity: 0.02, transparent: true, opacity: 0.86 }));
  frame.position.z = -0.014;
  group.add(frame);

  const strapL = new THREE.Mesh(new THREE.BoxGeometry(plateW * 0.16, plateH * 0.34, 0.002), new THREE.MeshStandardMaterial({ color: 0x181d2a, roughness: 0.70, metalness: 0.04, emissive: 0x06080c, emissiveIntensity: 0.02 }));
  strapL.position.set(-plateW * 0.43, 0, -0.018);
  group.add(strapL);
  const strapR = strapL.clone();
  strapR.position.x = plateW * 0.43;
  group.add(strapR);

  const screenFront = new THREE.Mesh(new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.965), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false, depthTest: false, toneMapped: false }));
  screenFront.renderOrder = 40;
  screenFront.position.z = 0.012;
  group.add(screenFront);

  const buttonsCache = [];
  function buildButtons(state){
    buttonsCache.length = 0;
    buttonsCache.push(
      { id:'teleport', label: state.teleportEnabled ? 'TP ON' : 'TELEPORT', x:28, y:122, w:230, h:82, font:28, hold:.14, margin:8, tone:'cyan' },
      { id:'lobby', label:'LOBBY', x:272, y:122, w:230, h:82, font:30, hold:.14, margin:8, tone:'green' },
      { id:'scorpion', label:'SCORPION', x:516, y:122, w:230, h:82, font:25, hold:.14, margin:8, tone:'red' },
      { id:'join', label: state.seated ? 'LEAVE' : 'SIT', x:760, y:122, w:236, h:82, font:30, hold:.14, margin:8, tone:'gold' },
      { id:'reiki', label:'REIKI', x:28, y:222, w:230, h:78, font:28, hold:.14, margin:8, tone:'gold' },
      { id:'pgaDrive', label:'PGA DRIVE', x:272, y:222, w:230, h:78, font:25, hold:.14, margin:8, tone:'green' },
      { id:'store', label:'STORE', x:516, y:222, w:230, h:78, font:28, hold:.14, margin:8, tone:'cyan' },
      { id:'lounge', label:'LOUNGE', x:760, y:222, w:236, h:78, font:27, hold:.14, margin:8, tone:'purple' },
      { id:'sponsor', label:'SPONSOR', x:28, y:318, w:230, h:70, font:25, hold:.14, margin:8, tone:'cyan' },
      { id:'audio', label: state.audioEnabled ? 'MUSIC ON' : 'MUSIC', x:272, y:318, w:230, h:70, font:25, hold:.16, margin:8, tone:'purple' },
      { id:'next', label:'NEXT TRACK', x:516, y:318, w:230, h:70, font:23, hold:.16, margin:8, tone:'purple' },
      { id:'chipPutt', label:'CHIP/PUTT', x:760, y:318, w:236, h:70, font:23, hold:.14, margin:8, tone:'green' }
    );
    return buttonsCache;
  }

  function toneStroke(tone, hovered){
    if (tone === 'red') return hovered ? 'rgba(255,85,114,.98)' : 'rgba(255,85,114,.50)';
    if (tone === 'gold') return hovered ? 'rgba(246,226,127,.98)' : 'rgba(246,226,127,.52)';
    if (tone === 'green') return hovered ? 'rgba(127,245,199,.98)' : 'rgba(127,245,199,.50)';
    if (tone === 'purple') return hovered ? 'rgba(180,140,255,.98)' : 'rgba(180,140,255,.50)';
    return hovered ? 'rgba(105,232,255,.98)' : 'rgba(105,232,255,.52)';
  }

  function drawButton(btn, hovered){
    ctx.save();
    ctx.fillStyle = hovered ? 'rgba(105,232,255,0.28)' : 'rgba(255,255,255,0.075)';
    ctx.strokeStyle = toneStroke(btn.tone, hovered);
    ctx.lineWidth = hovered ? 6 : 3;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hovered ? '#ffffff' : '#e8e8ff';
    ctx.font = `900 ${btn.font || 25}px system-ui, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    ctx.restore();
  }

  let hoveredId = null;
  let pressed = false;
  let pinchTime = 0;
  let pressLockId = null;
  let lastHovered = null;
  let lastSig = '';

  function draw(force = false){
    const state = getState();
    const sig = JSON.stringify({ h:hoveredId, ae:state.audioEnabled, c:state.cash, s:state.seated, seat:state.seatLabel, tp:state.teleportEnabled, phase:WATCH_PHASE });
    if (!force && sig === lastSig) return;
    lastSig = sig;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (DISPLAY_ROTATE_180){ ctx.translate(canvas.width, canvas.height); ctx.rotate(Math.PI); }
    if (DISPLAY_MIRRORED){ ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, 'rgba(4,9,18,0.96)');
    grad.addColorStop(1, 'rgba(18,10,34,0.98)');
    ctx.fillStyle = grad;
    rr(ctx, 12, 12, 1000, 488, 34); ctx.fill();
    ctx.strokeStyle = 'rgba(105,232,255,0.68)'; ctx.lineWidth = 6; rr(ctx, 12, 12, 1000, 488, 34); ctx.stroke();

    ctx.fillStyle = '#ffffff'; ctx.font = '900 44px system-ui, Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('SVR WATCH', 34, 50);
    ctx.fillStyle = 'rgba(127,245,199,.95)'; ctx.font = '800 22px system-ui, Arial'; ctx.fillText('INPUT BRIDGE • PHASE 138', 36, 86);
    ctx.textAlign = 'right'; ctx.fillStyle = '#7ff5c7'; ctx.font = '900 32px system-ui, Arial'; ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 972, 50);
    ctx.fillStyle = 'rgba(233,233,255,0.86)'; ctx.font = '700 22px system-ui, Arial'; ctx.fillText(`${state.seated ? state.seatLabel : 'Standing'} • ${state.teleportEnabled ? 'TP ARMED' : 'TP READY'}`, 972, 86);

    for (const btn of buildButtons(state)) drawButton(btn, hoveredId === btn.id);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(246,226,127,.90)'; ctx.font = '900 21px system-ui, Arial'; ctx.fillText('ACCOUNT READY • ADMIN LOCKED • SPONSOR READY • AWS API PATH RESERVED', 512, 422);
    ctx.fillStyle = 'rgba(180,220,255,0.82)'; ctx.font = '800 21px system-ui, Arial'; ctx.fillText('Pinch button to press • fist toggles teleport • trigger release teleports', 512, 458);
    ctx.restore();
    tex.needsUpdate = true;
  }

  function localHit(local){
    const state = getState();
    let x = ((local.x / plateW) + 0.5) * canvas.width;
    let y = ((-local.y / plateH) + 0.5) * canvas.height;
    if (DISPLAY_ROTATE_180){ x = canvas.width - x; y = canvas.height - y; }
    if (DISPLAY_MIRRORED) x = canvas.width - x;
    let best = null, bestScore = Infinity;
    for (const btn of buildButtons(state)){
      const margin = btn.margin ?? 10;
      if (x < btn.x - margin || x > btn.x + btn.w + margin || y < btn.y - margin || y > btn.y + btn.h + margin) continue;
      const nx = (x - (btn.x + btn.w / 2)) / Math.max(btn.w / 2, 1);
      const ny = (y - (btn.y + btn.h / 2)) / Math.max(btn.h / 2, 1);
      const score = nx * nx + ny * ny;
      if (score < bestScore){ best = btn.id; bestScore = score; }
    }
    return best;
  }

  function activate(id){
    if (!id) return;
    if (id === 'audio') actions.toggleAudio?.();
    if (id === 'next') actions.nextTrack?.();
    if (id === 'join') getState().seated ? actions.leaveTable?.() : actions.joinTable?.();
    if (id === 'teleport') actions.toggleTeleport?.();
    if (id === 'lobby') actions.goLobby?.();
    if (id === 'scorpion') actions.goScorpion?.();
    if (id === 'reiki') actions.goReiki?.();
    if (id === 'pgaDrive') actions.goPgaDrive?.();
    if (id === 'chipPutt') actions.goChipPutt?.();
    if (id === 'store') actions.goStoreRoom?.();
    if (id === 'lounge') actions.goSmokerLounge?.();
    if (id === 'sponsor') actions.goSponsor?.();
  }

  function update(dt, leftHand, rightHand){
    const anchor = leftHand?.joints?.wrist ? leftHand : rightHand?.joints?.wrist ? rightHand : null;
    if (!anchor?.joints?.wrist){ group.visible = false; hoveredId = null; draw(true); return; }
    const watchOnLeft = anchor === leftHand;
    const pose = computeForearmPose(anchor, camera, renderer, watchOnLeft ? 'left' : 'right');
    if (!pose){ group.visible = false; hoveredId = null; draw(true); return; }
    group.visible = true;
    group.position.copy(pose.position);
    group.quaternion.copy(pose.quaternion);
    group.updateMatrixWorld(true);

    let nextHovered = null, activeInput = null, bestDepth = Infinity;
    const candidates = watchOnLeft ? [rightHand, leftHand] : [leftHand, rightHand];
    for (const candidate of candidates){
      const tip = candidate?.joints?.['index-finger-tip'];
      if (!tip) continue;
      tip.getWorldPosition(V7);
      group.worldToLocal(V7);
      if (V7.z > -0.018 && V7.z < 0.085 && Math.abs(V7.x) < plateW * 0.74 && Math.abs(V7.y) < plateH * 0.74){
        const hit = localHit(V7);
        if (hit){ const depth = Math.abs(V7.z); if (depth < bestDepth){ bestDepth = depth; nextHovered = hit; activeInput = candidate; } }
      }
    }
    hoveredId = nextHovered;
    const pinching = !!activeInput && isPinching(activeInput);
    if (pinching && hoveredId && !pressLockId) pressLockId = hoveredId;
    if (pinching && pressLockId) hoveredId = pressLockId;
    if (!pinching) pressLockId = null;
    if (hoveredId !== lastHovered){ lastHovered = hoveredId; pinchTime = 0; if (pressed) pressed = false; if (!hoveredId) pressLockId = null; }
    const activeBtn = buildButtons(getState()).find(btn => btn.id === hoveredId) || null;
    if (hoveredId && pinching) pinchTime += dt; else if (!pinching) pinchTime = 0;
    if (hoveredId && !pressed && pinching && pinchTime > (activeBtn?.hold ?? .12)){
      pressed = true;
      activate(hoveredId);
      pinchTime = 0;
    }
    if (!pinching) pressed = false;
    draw();
  }

  draw(true);
  window.SVR_WATCH_ALIGNMENT_LOCK = { phase:WATCH_PHASE, rotate180:false, mirrored:false, screenTilt:0.22, watchVisible:"hand tracking required", inputBridge:true };
  return { update, object: group };
}