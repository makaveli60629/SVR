import * as THREE from "three";
import { isPinching } from "./gestures.js";

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
const M0 = new THREE.Matrix4();
const FLIP_Q = new THREE.Quaternion();
const SCREEN_TILT_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.22);
const DISPLAY_MIRRORED = false;
const DISPLAY_ROTATE_180 = false;

function getJointWorld(hand, names){
  if (!hand?.joints) return null;
  for (const name of names){
    const joint = hand.joints[name];
    if (!joint) continue;
    joint.updateWorldMatrix?.(true, false);
    return joint.getWorldPosition(new THREE.Vector3());
  }
  return null;
}

function getActiveCamera(camera, renderer){
  if (renderer?.xr?.isPresenting) return renderer.xr.getCamera(camera);
  return camera || null;
}

function computeForearmPose(hand, camera, renderer, side = 'left'){
  const wrist = getJointWorld(hand, ['wrist']);
  const index = getJointWorld(hand, ['index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-tip']);
  const pinky = getJointWorld(hand, ['pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-tip']);
  if (!wrist || !index || !pinky) return null;

  const midpoint = V3.copy(index).add(pinky).multiplyScalar(0.5);
  const forearmDir = V0.copy(wrist).sub(midpoint).normalize();
  let acrossPalm = V1.copy(index).sub(pinky).normalize();
  let faceNormal = V2.crossVectors(acrossPalm, forearmDir).normalize();

  const activeCamera = getActiveCamera(camera, renderer);
  if (activeCamera){
    const camPos = new THREE.Vector3();
    activeCamera.getWorldPosition(camPos);
    if (faceNormal.dot(camPos.sub(wrist)) < 0) faceNormal.multiplyScalar(-1);
  }

  acrossPalm = new THREE.Vector3().crossVectors(faceNormal, forearmDir).normalize();
  if (side === 'right') acrossPalm.multiplyScalar(-1);

  M0.makeBasis(forearmDir, acrossPalm, faceNormal);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(M0);
  quaternion.multiply(FLIP_Q);
  quaternion.multiply(SCREEN_TILT_Q);

  const position = wrist.clone()
    .add(forearmDir.clone().multiplyScalar(0.088))
    .add(faceNormal.clone().multiplyScalar(0.024))
    .add(acrossPalm.clone().multiplyScalar(side === 'left' ? -0.004 : 0.004));

  return { position, quaternion };
}

export function createWristWatch({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const plateW = 0.224;
  const plateH = 0.116;

  const frame = new THREE.Mesh(new THREE.BoxGeometry(plateW * 0.98, plateH * 0.98, 0.003), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.42, metalness: 0.14, emissive: 0x090b12, emissiveIntensity: 0.02, transparent: true, opacity: 0.84 }));
  frame.position.z = -0.014;
  group.add(frame);

  const strapL = new THREE.Mesh(new THREE.BoxGeometry(plateW * 0.16, plateH * 0.34, 0.002), new THREE.MeshStandardMaterial({ color: 0x181d2a, roughness: 0.68, metalness: 0.05, emissive: 0x06080c, emissiveIntensity: 0.02 }));
  strapL.position.set(-plateW * 0.43, 0, -0.018);
  group.add(strapL);
  const strapR = strapL.clone();
  strapR.position.x = plateW * 0.43;
  group.add(strapR);

  const screenFront = new THREE.Mesh(new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.965), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false, depthTest: false, toneMapped: false }));
  screenFront.renderOrder = 40;
  screenFront.position.z = 0.012;
  group.add(screenFront);

  function drawButton(btn, hovered){
    ctx.save();
    ctx.fillStyle = hovered ? 'rgba(105,232,255,0.26)' : 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = hovered ? 'rgba(105,232,255,0.95)' : 'rgba(180,140,255,0.38)';
    ctx.lineWidth = hovered ? 6 : 3;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hovered ? '#ffffff' : '#e8e8ff';
    ctx.font = `bold ${btn.font || 28}px system-ui, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    ctx.restore();
  }

  function buildButtons(state){
    return [
      { id: 'siteHub', label: 'SITE HUB', x: 30, y: 128, w: 310, h: 116, font: 42, hold: 0.16, margin: 8 },
      { id: 'rooms', label: 'ROOMS', x: 358, y: 128, w: 300, h: 116, font: 42, hold: 0.16, margin: 8 },
      { id: 'teleport', label: state.teleportEnabled ? 'TELEPORT ON' : 'TELEPORT', x: 676, y: 128, w: 318, h: 116, font: 38, hold: 0.16, margin: 8 },
      { id: 'join', label: state.seated ? 'LEAVE TABLE' : 'JOIN TABLE', x: 30, y: 270, w: 310, h: 92, font: 32, hold: 0.16, margin: 8 },
      { id: 'audio', label: state.audioEnabled ? 'MUSIC ON' : 'MUSIC', x: 358, y: 270, w: 300, h: 92, font: 32, hold: 0.18, margin: 8 },
      { id: 'next', label: 'NEXT', x: 676, y: 270, w: 318, h: 92, font: 32, hold: 0.18, margin: 8 }
    ];
  }

  let hoveredId = null;
  let pressed = false;
  let hoverTime = 0;
  let pinchTime = 0;
  let pressLockId = null;
  let lastHovered = null;
  let lastSig = '';

  function draw(force = false){
    const state = getState();
    const sig = JSON.stringify({ h: hoveredId, ae: state.audioEnabled, c: state.cash, s: state.seated, seat: state.seatLabel, tp: state.teleportEnabled, phase:'99' });
    if (!force && sig === lastSig) return;
    lastSig = sig;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (DISPLAY_ROTATE_180){ ctx.translate(canvas.width, canvas.height); ctx.rotate(Math.PI); }
    if (DISPLAY_MIRRORED){ ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, 'rgba(5,8,16,0.94)');
    grad.addColorStop(1, 'rgba(18,10,32,0.97)');
    ctx.fillStyle = grad;
    rr(ctx, 12, 12, 1000, 488, 34); ctx.fill();
    ctx.strokeStyle = 'rgba(105,232,255,0.62)'; ctx.lineWidth = 6; rr(ctx, 12, 12, 1000, 488, 34); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 52px system-ui, Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('SVR WATCH', 34, 58);
    ctx.textAlign = 'right'; ctx.fillStyle = '#7ff5c7'; ctx.font = 'bold 36px system-ui, Arial'; ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 972, 58);
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(233,233,255,0.86)'; ctx.font = '26px system-ui, Arial'; ctx.fillText(`Seat: ${state.seated ? state.seatLabel : 'Standing'}`, 38, 96);
    for (const btn of buildButtons(state)) drawButton(btn, hoveredId === btn.id);
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(180,220,255,0.82)'; ctx.font = 'bold 24px system-ui, Arial'; ctx.fillText('Pinch to press • fist toggles teleport • release commits movement', 512, 430);
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
    if (id === 'siteHub') actions.goSiteHub?.();
    if (id === 'rooms') actions.goRooms?.();
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
      const tipPos = new THREE.Vector3(); tip.getWorldPosition(tipPos);
      const local = group.worldToLocal(tipPos.clone());
      if (local.z > -0.018 && local.z < 0.085 && Math.abs(local.x) < plateW * 0.74 && Math.abs(local.y) < plateH * 0.74){
        const hit = localHit(local);
        if (hit){ const depth = Math.abs(local.z); if (depth < bestDepth){ bestDepth = depth; nextHovered = hit; activeInput = candidate; } }
      }
    }
    hoveredId = nextHovered;
    const pinching = !!activeInput && isPinching(activeInput);
    if (pinching && hoveredId && !pressLockId) pressLockId = hoveredId;
    if (pinching && pressLockId) hoveredId = pressLockId;
    if (!pinching) pressLockId = null;
    if (hoveredId === lastHovered && hoveredId) hoverTime += dt;
    else { lastHovered = hoveredId; hoverTime = hoveredId ? 0 : 0; pinchTime = 0; if (pressed) pressed = false; if (!hoveredId) pressLockId = null; }
    const activeBtn = buildButtons(getState()).find(btn => btn.id === hoveredId) || null;
    if (hoveredId && pinching) pinchTime += dt; else if (!pinching) pinchTime = 0;
    if (hoveredId && !pressed && pinching && pinchTime > (activeBtn?.hold ?? .12)){
      pressed = true; activate(hoveredId); hoverTime = 0; pinchTime = 0;
    }
    if (!pinching) pressed = false;
    draw();
  }

  draw(true);
  window.SVR_WATCH_ALIGNMENT_LOCK = { phase:'PHASE-99-WATCH-ALIGNMENT-LOCK', rotate180:false, mirrored:false, screenTilt:0.22 };
  return { update, object: group };
}
