import * as THREE from "three";
import { isPinching } from "./gestures.js";

const PHASE87_LABEL = "PHASE-87-WATCH-POKER-CONTROLS-LOCK";
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
const DISPLAY_ROTATED_180 = true;

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
  screenFront.rotation.z = DISPLAY_ROTATED_180 ? Math.PI : 0;
  group.add(screenFront);

  const screenBack = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.965),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, depthWrite: false, depthTest: false, opacity: 0.0, toneMapped: false })
  );
  screenBack.visible = false;

  function drawButton(btn, hovered){
    ctx.save();
    ctx.fillStyle = hovered ? 'rgba(180,140,255,0.28)' : 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = hovered ? 'rgba(180,140,255,0.95)' : btn.stroke || 'rgba(180,140,255,0.35)';
    ctx.lineWidth = hovered ? 5 : 3;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hovered ? '#ffffff' : (btn.text || '#e8e8ff');
    ctx.font = `bold ${btn.font || 28}px system-ui, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    ctx.restore();
  }

 function pokerState(){ return window.SVR_PHASE86_POKER_STATE || {}; }
 function pokerActionLabel(id){ return ({ pokerFold:'FOLD', pokerCheck:'CHECK', pokerCall:'CALL', pokerRaise:'RAISE', pokerAllIn:'ALL-IN', pokerNext:'NEXT' })[id] || id; }
 function buildButtons(state){
   const buttons = [
     { id: 'lobby', label: 'LOBBY', x: 24, y: 142, w: 110, h: 38, font: 20, pinchOnly: true, hold: 0.16, margin: 6 },
     { id: 'storeScene', label: 'STORE', x: 144, y: 142, w: 110, h: 38, font: 20, pinchOnly: true, hold: 0.16, margin: 6 },
     { id: 'seatScene', label: 'SEAT', x: 264, y: 142, w: 110, h: 38, font: 20, pinchOnly: true, hold: 0.16, margin: 6 },

     { id: 'reikiScene', label: 'REIKI', x: 24, y: 188, w: 110, h: 38, font: 20, pinchOnly: true, hold: 0.16, margin: 6 },
     { id: 'pgaScene', label: 'PGA', x: 144, y: 188, w: 110, h: 38, font: 20, pinchOnly: true, hold: 0.16, margin: 6 },
     { id: 'legendScene', label: 'LEGEND', x: 264, y: 188, w: 110, h: 38, font: 17, pinchOnly: true, hold: 0.16, margin: 6 },

     { id: 'sponsorScene', label: 'SPONSOR', x: 24, y: 234, w: 110, h: 38, font: 16, pinchOnly: true, hold: 0.16, margin: 6 },
     { id: 'scorpionScene', label: 'SCORPION', x: 144, y: 234, w: 110, h: 38, font: 15, pinchOnly: true, hold: 0.16, margin: 6 },
     { id: 'reikiRoomScene', label: 'R-ROOM', x: 264, y: 234, w: 110, h: 38, font: 16, pinchOnly: true, hold: 0.16, margin: 6 },

     { id: 'pokerFold', label: 'FOLD', x: 408, y: 116, w: 132, h: 42, font: 21, pinchOnly: true, hold: 0.14, margin: 7, stroke:'rgba(255,91,140,.75)', text:'#ffd6e1' },
     { id: 'pokerCheck', label: 'CHECK', x: 552, y: 116, w: 132, h: 42, font: 20, pinchOnly: true, hold: 0.14, margin: 7, stroke:'rgba(127,252,255,.75)', text:'#d8ffff' },
     { id: 'pokerCall', label: 'CALL', x: 696, y: 116, w: 132, h: 42, font: 21, pinchOnly: true, hold: 0.14, margin: 7, stroke:'rgba(134,255,183,.75)', text:'#dfffea' },
     { id: 'pokerRaise', label: 'RAISE', x: 840, y: 116, w: 132, h: 42, font: 20, pinchOnly: true, hold: 0.14, margin: 7, stroke:'rgba(255,217,138,.75)', text:'#fff0c6' },
     { id: 'pokerAllIn', label: 'ALL-IN', x: 408, y: 168, w: 274, h: 42, font: 23, pinchOnly: true, hold: 0.18, margin: 7, stroke:'rgba(255,255,255,.82)', text:'#ffffff' },
     { id: 'pokerNext', label: 'NEXT HAND', x: 696, y: 168, w: 276, h: 42, font: 22, pinchOnly: true, hold: 0.18, margin: 7, stroke:'rgba(189,124,255,.80)', text:'#f0dcff' },

     { id: 'audio', label: state.audioEnabled ? 'MUSIC ON' : 'MUSIC OFF', x: 24, y: 348, w: 156, h: 56, font: 22, pinchOnly: true, hold: 0.20, margin: 6 },
     { id: 'storeOpen', label: 'OPEN STORE', x: 194, y: 348, w: 172, h: 56, font: 21, pinchOnly: true, hold: 0.20, margin: 6 },
     { id: 'teleport', label: state.teleportEnabled ? 'TP ON' : 'TP OFF', x: 408, y: 224, w: 564, h: 180, font: 58, pinchOnly: true, hold: 0.18, margin: 8 },
   ];
   if (state.seated) buttons.push({ id: 'leave', label: 'LEAVE TABLE', x: 408, y: 58, w: 564, h: 44, font: 24, pinchOnly: true, hold: 0.18, margin: 8 });
   else if (state.inTableZone) buttons.push({ id: 'join', label: 'QUICK SIT', x: 408, y: 58, w: 564, h: 44, font: 26, pinchOnly: true, hold: 0.18, margin: 8 });
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
    const ps = pokerState();
    const sig = JSON.stringify({ h: hoveredId, t: state.trackTitle, ae: state.audioEnabled, c: state.cash, s: state.seated, z: state.inTableZone, seat: state.seatLabel, tp:state.teleportEnabled, pokerPhase:ps.phase, pokerPot:ps.pot, pokerWinner:ps.winner?.name, sec: new Date().getSeconds() });
    if (!force && sig === lastSig) return;
    lastSig = sig;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (DISPLAY_MIRRORED){
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, 'rgba(5,8,16,0.90)');
    grad.addColorStop(1, 'rgba(18,10,32,0.94)');
    ctx.fillStyle = grad;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,255,0.6)';
    ctx.lineWidth = 6;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.stroke();

    const now = new Date();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 42, 60);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#7ff5c7';
    ctx.font = 'bold 34px system-ui, Arial';
    ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 972, 60);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(233,233,255,0.95)';
    ctx.font = 'bold 27px system-ui, Arial';
    ctx.fillText('SVR WRIST CONSOLE', 34, 105);
    ctx.fillStyle = 'rgba(233,233,255,0.78)';
    ctx.font = '21px system-ui, Arial';
    ctx.fillText(`Seat: ${state.seated ? state.seatLabel : 'Standing'}`, 430, 238);
    ctx.fillText(`Poker: ${(ps.phase || 'ready').toUpperCase()} • Pot ${ps.pot ?? 0}`, 430, 270);
    ctx.fillText(`Winner: ${ps.winner?.name || '—'} • TP ${state.teleportEnabled ? 'ON' : 'OFF'}`, 430, 302);
    ctx.textAlign = 'right';
    ctx.fillStyle = state.seated ? '#7ff5c7' : state.inTableZone ? '#f6e27f' : 'rgba(233,233,255,0.72)';
    ctx.font = 'bold 24px system-ui, Arial';
    ctx.fillText(state.seated ? 'AT TABLE' : (state.inTableZone ? 'JOIN READY' : 'LOBBY'), 970, 92);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(180,140,255,0.92)';
    ctx.font = 'bold 19px system-ui, Arial';
    ctx.fillText('Poker row active • Fold / Check / Call / Raise / All-In / Next', 36, 326);

    for (const btn of buildButtons(state)) drawButton(btn, hoveredId === btn.id);
    ctx.restore();
    tex.needsUpdate = true;
  }

  function localHit(local){
    const state = getState();
    let x = ((local.x / plateW) + 0.5) * canvas.width;
    let y = ((-local.y / plateH) + 0.5) * canvas.height;
    if (DISPLAY_ROTATED_180){ x = canvas.width - x; y = canvas.height - y; }
    if (DISPLAY_MIRRORED) x = canvas.width - x;
    let best = null;
    let bestScore = Infinity;
    for (const btn of buildButtons(state)){
      const margin = btn.margin ?? (btn.id === 'teleport' ? 14 : 10);
      const inside = x >= btn.x - margin && x <= btn.x + btn.w + margin && y >= btn.y - margin && y <= btn.y + btn.h + margin;
      if (!inside) continue;
      const cx = btn.x + btn.w / 2;
      const cy = btn.y + btn.h / 2;
      const nx = (x - cx) / Math.max(btn.w / 2, 1);
      const ny = (y - cy) / Math.max(btn.h / 2, 1);
      const score = nx * nx + ny * ny;
      if (score < bestScore){
        best = btn.id;
        bestScore = score;
      }
    }
    return best;
  }

  function emitPoker(action){
    const payload={ build:PHASE87_LABEL, action, source:'watch', tableKey:'lobby-main', seatId:'SOUTH_PLAYER', playMoneyOnly:true, createdAt:new Date().toISOString() };
    window.SVR_PHASE87_LAST_WATCH_POKER_ACTION=payload;
    try { window.dispatchEvent(new CustomEvent('svr-poker-player-action', { detail: payload })); } catch {}
    try { window.dispatchEvent(new CustomEvent('svr-watch-poker-action', { detail: payload })); } catch {}
    window.SVR_PHASE87_WATCH_POKER_CONTROLS_LOCK={ build:PHASE87_LABEL, active:true, lastAction:payload, siteTouched:false, checkedAt:new Date().toISOString() };
    return payload;
  }
  function activate(id){
    if (!id) return;
    if (id === 'audio') actions.toggleAudio?.();
    if (id === 'next') actions.nextTrack?.();
    if (id === 'storeOpen') actions.openStore?.();
    if (id === 'join') actions.joinTable?.();
    if (id === 'leave') actions.leaveTable?.();
    if (id === 'teleport') actions.toggleTeleport?.();
    if (id === 'lobby') actions.goLobby?.();
    if (id === 'tableScene') actions.goTable?.();
    if (id === 'storeScene') actions.goStore?.();
    if (id === 'seatScene') actions.goSeat?.();
    if (id === 'reikiScene') actions.goReiki?.();
    if (id === 'pgaScene') actions.goPga?.();
    if (id === 'legendScene') actions.goLegend?.();
    if (id === 'sponsorScene') actions.goSponsor?.();
    if (id === 'scorpionScene') actions.goScorpion?.();
    if (id === 'reikiRoomScene') actions.goReikiRoom?.();
    if (id === 'pokerFold') emitPoker('fold');
    if (id === 'pokerCheck') emitPoker('check');
    if (id === 'pokerCall') emitPoker('call');
    if (id === 'pokerRaise') emitPoker('raise');
    if (id === 'pokerAllIn') emitPoker('all_in');
    if (id === 'pokerNext') emitPoker('next');
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
    const inputHand = watchOnLeft ? rightHand : leftHand;
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
          if (depth < bestDepth){
            bestDepth = depth;
            nextHovered = hit;
            activeInput = candidate;
          }
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

    const directHold = activeBtn?.hold ?? (activeBtn?.pinchOnly ? 0.12 : 0.10);
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
  window.SVR_PHASE87_WATCH_POKER_CONTROLS_LOCK={ build:PHASE87_LABEL, active:true, actions:['fold','check','call','raise','all_in','next'], siteTouched:false, checkedAt:new Date().toISOString() };
  return { update, object: group };
}
