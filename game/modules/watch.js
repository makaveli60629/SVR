import * as THREE from "three";
import { isPinching } from "./gestures.js";

// PHASE-86-WATCH-POKER-CONTROL-LOCK
// Game-side only. Adds poker action buttons to the VR wrist console while
// preserving scene routing, teleport, and audio controls.

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
const SCREEN_TILT_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.34);
const DISPLAY_MIRRORED = false;

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
    .add(forearmDir.clone().multiplyScalar(0.092))
    .add(faceNormal.clone().multiplyScalar(0.020))
    .add(acrossPalm.clone().multiplyScalar(side === 'left' ? -0.004 : 0.004));

  return { position, quaternion };
}

function button(id, label, x, y, w, h, font = 20, hold = 0.16){
  return { id, label, x, y, w, h, font, pinchOnly: true, hold, margin: 7 };
}

export function createWristWatch({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const plateW = 0.224;
  const plateH = 0.116;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(plateW * 0.98, plateH * 0.98, 0.003),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.36, metalness: 0.20, emissive: 0x090b12, emissiveIntensity: 0.02, transparent: true, opacity: 0.84 })
  );
  frame.position.z = -0.014;
  group.add(frame);

  const strapL = new THREE.Mesh(
    new THREE.BoxGeometry(plateW * 0.16, plateH * 0.34, 0.002),
    new THREE.MeshStandardMaterial({ color: 0x181d2a, roughness: 0.62, metalness: 0.08, emissive: 0x06080c, emissiveIntensity: 0.02 })
  );
  strapL.position.set(-plateW * 0.43, 0, -0.018);
  group.add(strapL);
  const strapR = strapL.clone();
  strapR.position.x = plateW * 0.43;
  group.add(strapR);

  const bezel = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 1.00, plateH * 1.00),
    new THREE.MeshBasicMaterial({ color: 0x243048, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, depthTest: false })
  );
  bezel.position.z = -0.006;
  group.add(bezel);

  const screenFront = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.965),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  screenFront.renderOrder = 40;
  screenFront.position.z = 0.012;
  group.add(screenFront);

  const screenBack = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.965),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, depthWrite: false, depthTest: false, opacity: 0.0, toneMapped: false })
  );
  screenBack.visible = false;

  function drawButton(btn, hovered){
    ctx.save();
    ctx.fillStyle = hovered ? 'rgba(180,140,255,0.30)' : 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = hovered ? 'rgba(180,140,255,0.98)' : 'rgba(180,140,255,0.38)';
    ctx.lineWidth = hovered ? 5 : 3;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hovered ? '#ffffff' : '#e8e8ff';
    ctx.font = `bold ${btn.font || 22}px system-ui, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    ctx.restore();
  }

  function buildButtons(state){
    const poker = state.poker || {};
    const callLabel = poker.toCall > 0 ? `CALL ${poker.toCall}` : 'CHECK';
    const buttons = [
      button('lobby', 'LOBBY', 24, 138, 110, 38, 19),
      button('seatScene', 'SEAT', 144, 138, 110, 38, 19),
      button('reikiScene', 'REIKI', 264, 138, 110, 38, 19),
      button('pgaScene', 'PGA', 24, 184, 110, 38, 19),
      button('legendScene', 'LEGEND', 144, 184, 110, 38, 17),
      button('sponsorScene', 'SPONSOR', 264, 184, 110, 38, 16),
      button('scorpionScene', 'SCORPION', 24, 230, 110, 38, 15),
      button('pgaDriveScene', 'DRIVE', 144, 230, 110, 38, 18),
      button('chipPuttScene', 'CHIP', 264, 230, 110, 38, 18),
      button('storeRoomScene', 'STORE', 24, 276, 110, 38, 18),
      button('smokerLoungeScene', 'LOUNGE', 144, 276, 110, 38, 17),
      button('teleport', state.teleportEnabled ? 'TP ON' : 'TP OFF', 264, 276, 110, 38, 18),
      button('pokerFold', 'FOLD', 424, 184, 166, 54, 24, 0.15),
      button('pokerCall', callLabel, 604, 184, 178, 54, poker.toCall > 999 ? 18 : 24, 0.15),
      button('pokerRaise', 'RAISE', 796, 184, 166, 54, 24, 0.15),
      button('pokerAllIn', 'ALL-IN', 424, 252, 166, 54, 23, 0.18),
      button('pokerNext', 'NEXT HAND', 604, 252, 178, 54, 22, 0.18),
      button('audio', state.audioEnabled ? 'MUSIC' : 'MUTE', 796, 252, 166, 54, 23, 0.18),
      button('next', 'TRACK', 424, 394, 166, 46, 20, 0.20)
    ];
    if (state.seated) buttons.push(button('leave', 'LEAVE TABLE', 604, 394, 178, 46, 20, 0.18));
    else if (state.inTableZone) buttons.push(button('join', 'QUICK SIT', 604, 394, 178, 46, 20, 0.18));
    return buttons;
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
    const poker = state.poker || {};
    const sig = JSON.stringify({
      h: hoveredId,
      t: state.trackTitle,
      ae: state.audioEnabled,
      c: state.cash,
      s: state.seated,
      z: state.inTableZone,
      seat: state.seatLabel,
      pot: poker.pot,
      street: poker.street,
      active: poker.activeName,
      turn: poker.awaitingPlayer,
      hand: poker.handNumber,
      sec: new Date().getSeconds()
    });
    if (!force && sig === lastSig) return;
    lastSig = sig;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (DISPLAY_MIRRORED){ ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, 'rgba(5,8,16,0.92)');
    grad.addColorStop(1, 'rgba(18,10,32,0.96)');
    ctx.fillStyle = grad;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.fill();
    ctx.strokeStyle = poker.awaitingPlayer ? 'rgba(246,226,127,0.88)' : 'rgba(180,140,255,0.64)';
    ctx.lineWidth = 6;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.stroke();

    const now = new Date();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px system-ui, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 34, 58);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#7ff5c7';
    ctx.font = 'bold 34px system-ui, Arial';
    ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 972, 58);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(233,233,255,0.95)';
    ctx.font = 'bold 28px system-ui, Arial';
    ctx.fillText('SVR WRIST CONSOLE', 34, 104);

    ctx.fillStyle = poker.awaitingPlayer ? '#f6e27f' : 'rgba(233,233,255,0.82)';
    ctx.font = 'bold 25px system-ui, Arial';
    ctx.fillText(`Poker: ${String(poker.street || 'ready').toUpperCase()} • Pot $${poker.pot || 0} • Active: ${poker.activeName || '--'}`, 424, 104);
    ctx.fillStyle = 'rgba(233,233,255,0.78)';
    ctx.font = '22px system-ui, Arial';
    ctx.fillText(`Board: ${(poker.board || []).join(' ') || '--'}   Hand: ${(poker.playerCards || []).join(' ') || '--'}`, 424, 138);
    ctx.fillText(poker.awaitingPlayer ? 'YOUR TURN: use poker buttons' : (poker.lastAction || 'Bots acting...'), 424, 166);

    ctx.fillStyle = 'rgba(180,140,255,0.92)';
    ctx.font = 'bold 20px system-ui, Arial';
    ctx.fillText('Scenes', 34, 122);
    ctx.fillText('Poker Actions', 424, 122);

    ctx.fillStyle = 'rgba(233,233,255,0.72)';
    ctx.font = '20px system-ui, Arial';
    ctx.fillText(`Seat: ${state.seated ? state.seatLabel : 'Standing'} • Zone: ${state.inTableZone ? 'Ready' : 'Walk closer'}`, 34, 342);
    ctx.fillText('Desktop: F Fold • C Check/Call • R Raise • A All-In • H Next', 34, 372);
    ctx.fillText(`Track: ${state.audioEnabled ? state.trackTitle : 'Paused'}`, 34, 430);

    for (const btn of buildButtons(state)) drawButton(btn, hoveredId === btn.id);
    ctx.restore();
    tex.needsUpdate = true;
  }

  function localHit(local){
    const state = getState();
    let x = ((local.x / plateW) + 0.5) * canvas.width;
    const y = ((-local.y / plateH) + 0.5) * canvas.height;
    if (DISPLAY_MIRRORED) x = canvas.width - x;
    let best = null;
    let bestScore = Infinity;
    for (const btn of buildButtons(state)){
      const margin = btn.margin ?? 10;
      const inside = x >= btn.x - margin && x <= btn.x + btn.w + margin && y >= btn.y - margin && y <= btn.y + btn.h + margin;
      if (!inside) continue;
      const cx = btn.x + btn.w / 2;
      const cy = btn.y + btn.h / 2;
      const nx = (x - cx) / Math.max(btn.w / 2, 1);
      const ny = (y - cy) / Math.max(btn.h / 2, 1);
      const score = nx * nx + ny * ny;
      if (score < bestScore){ best = btn.id; bestScore = score; }
    }
    return best;
  }

  function activate(id){
    if (!id) return;
    if (id === 'audio') actions.toggleAudio?.();
    if (id === 'next') actions.nextTrack?.();
    if (id === 'join') actions.joinTable?.();
    if (id === 'leave') actions.leaveTable?.();
    if (id === 'teleport') actions.toggleTeleport?.();
    if (id === 'pokerFold') actions.pokerFold?.();
    if (id === 'pokerCall') actions.pokerCall?.();
    if (id === 'pokerRaise') actions.pokerRaise?.();
    if (id === 'pokerAllIn') actions.pokerAllIn?.();
    if (id === 'pokerNext') actions.pokerNext?.();
    if (id === 'lobby') actions.goLobby?.();
    if (id === 'tableScene') actions.goTable?.();
    if (id === 'seatScene') actions.goSeat?.();
    if (id === 'reikiScene') actions.goReiki?.();
    if (id === 'pgaScene') actions.goPga?.();
    if (id === 'legendScene') actions.goLegend?.();
    if (id === 'sponsorScene') actions.goSponsor?.();
    if (id === 'scorpionScene') actions.goScorpion?.();
    if (id === 'reikiRoomScene') actions.goReikiRoom?.();
    if (id === 'pgaDriveScene') actions.goPgaDrive?.();
    if (id === 'chipPuttScene') actions.goChipPutt?.();
    if (id === 'storeRoomScene') actions.goStoreRoom?.();
    if (id === 'smokerLoungeScene') actions.goSmokerLounge?.();
  }

  function update(dt, leftHand, rightHand){
    const anchor = leftHand?.joints?.wrist ? leftHand : rightHand?.joints?.wrist ? rightHand : null;
    if (!anchor?.joints?.wrist){
      group.visible = false;
      hoveredId = null;
      draw(true);
      return;
    }

    const watchOnLeft = anchor === leftHand;
    const pose = computeForearmPose(anchor, camera, renderer, watchOnLeft ? 'left' : 'right');
    if (!pose){
      group.visible = false;
      hoveredId = null;
      draw(true);
      return;
    }

    group.visible = true;
    group.position.copy(pose.position);
    group.quaternion.copy(pose.quaternion);
    group.updateMatrixWorld(true);

    let nextHovered = null;
    let activeInput = null;
    let bestDepth = Infinity;
    const candidates = watchOnLeft ? [rightHand, leftHand] : [leftHand, rightHand];
    for (const candidate of candidates){
      const tip = candidate?.joints?.['index-finger-tip'];
      if (!tip) continue;
      const tipPos = new THREE.Vector3();
      tip.getWorldPosition(tipPos);
      const local = group.worldToLocal(tipPos.clone());
      if (local.z > -0.018 && local.z < 0.085 && Math.abs(local.x) < plateW * 0.74 && Math.abs(local.y) < plateH * 0.74){
        const hit = localHit(local);
        if (hit){
          const depth = Math.abs(local.z);
          if (depth < bestDepth){ bestDepth = depth; nextHovered = hit; activeInput = candidate; }
        }
      }
    }
    hoveredId = nextHovered;

    const pinching = !!activeInput && isPinching(activeInput);
    if (pinching && hoveredId && !pressLockId) pressLockId = hoveredId;
    if (pinching && pressLockId) hoveredId = pressLockId;
    if (!pinching) pressLockId = null;
    if (hoveredId === lastHovered && hoveredId) hoverTime += dt;
    else {
      lastHovered = hoveredId;
      hoverTime = hoveredId ? 0 : 0;
      pinchTime = 0;
      if (pressed) pressed = false;
      if (!hoveredId) pressLockId = null;
    }

    const buttons = buildButtons(getState());
    const activeBtn = buttons.find(btn => btn.id === hoveredId) || null;
    if (hoveredId && pinching) pinchTime += dt;
    else if (!pinching) pinchTime = 0;

    const directHold = activeBtn?.hold ?? 0.12;
    const directPressReady = !!activeBtn && pinching && pinchTime > directHold;
    if (hoveredId && !pressed && directPressReady){
      pressed = true;
      activate(hoveredId);
      hoverTime = 0;
      pinchTime = 0;
    }
    if (!pinching) pressed = false;

    draw();
  }

  draw(true);
  return { update, object: group };
}
