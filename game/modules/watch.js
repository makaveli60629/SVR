import * as THREE from "three";
import { isPinching } from "./gestures.js";

const BUILD = "PHASE-462-QUEST-WATCH-FIT-LOCK";
const PHASE87_LABEL = "PHASE-87-WATCH-POKER-CONTROLS-LOCK";
const DISPLAY_MIRRORED = false;
const DISPLAY_ROTATED_180 = true;

const TMP = {
  p0: new THREE.Vector3(),
  p1: new THREE.Vector3(),
  p2: new THREE.Vector3(),
  p3: new THREE.Vector3(),
  q0: new THREE.Quaternion(),
  m0: new THREE.Matrix4(),
  x: new THREE.Vector3(),
  y: new THREE.Vector3(),
  z: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0)
};

function rr(c, x, y, w, h, r){
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function getActiveCamera(camera, renderer){
  if (renderer?.xr?.isPresenting) return renderer.xr.getCamera(camera);
  return camera || null;
}

function getJointWorld(source, names){
  if (!source?.joints) return null;
  for (const name of names){
    const joint = source.joints[name];
    if (!joint) continue;
    joint.updateWorldMatrix?.(true, false);
    return joint.getWorldPosition(new THREE.Vector3());
  }
  return null;
}

function isControllerProxy(source){
  return Boolean(source?.userData?.controller || source?.userData?.inputSource?.gamepad);
}

function sourceReady(source){
  if (!source) return false;
  if (isControllerProxy(source)) return Boolean(source.userData?.controller || source.joints?.wrist);
  return Boolean(source.joints?.wrist && source.joints.wrist.visible !== false);
}

function faceCameraQuaternion(position, camera, renderer){
  const activeCamera = getActiveCamera(camera, renderer);
  if (!activeCamera) return new THREE.Quaternion();
  activeCamera.getWorldPosition(TMP.p3);
  TMP.z.copy(TMP.p3).sub(position);
  if (TMP.z.lengthSq() < 1e-6) TMP.z.set(0, 0, 1);
  TMP.z.normalize();
  TMP.x.crossVectors(TMP.up, TMP.z);
  if (TMP.x.lengthSq() < 1e-6) TMP.x.set(1, 0, 0);
  TMP.x.normalize();
  TMP.y.crossVectors(TMP.z, TMP.x).normalize();
  TMP.m0.makeBasis(TMP.x, TMP.y, TMP.z);
  return new THREE.Quaternion().setFromRotationMatrix(TMP.m0);
}

function computeHandWatchPose(hand, camera, renderer, side = 'left'){
  const wrist = getJointWorld(hand, ['wrist']);
  const index = getJointWorld(hand, ['index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-tip']);
  const pinky = getJointWorld(hand, ['pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-tip']);
  if (!wrist || !index || !pinky) return null;

  const midpoint = TMP.p0.copy(index).add(pinky).multiplyScalar(0.5);
  const forearmDir = TMP.p1.copy(wrist).sub(midpoint);
  if (forearmDir.lengthSq() < 1e-6) forearmDir.set(0, 0, -1);
  forearmDir.normalize();

  const activeCamera = getActiveCamera(camera, renderer);
  const cameraDir = TMP.p2.set(0, 1, 0);
  if (activeCamera){
    activeCamera.getWorldPosition(TMP.p3);
    cameraDir.copy(TMP.p3).sub(wrist).normalize();
  }

  const position = wrist.clone()
    .addScaledVector(forearmDir, 0.058)
    .addScaledVector(cameraDir, 0.012);
  position.x += side === 'left' ? -0.004 : 0.004;

  return { position, quaternion: faceCameraQuaternion(position, camera, renderer), mode: 'hand' };
}

function computeControllerWatchPose(proxy, camera, renderer, side = 'left'){
  const controller = proxy?.userData?.controller || proxy;
  if (!controller?.getWorldPosition || !controller?.getWorldQuaternion) return null;
  controller.updateWorldMatrix?.(true, false);
  const position = controller.getWorldPosition(new THREE.Vector3());
  const q = controller.getWorldQuaternion(new THREE.Quaternion());
  const localOffset = new THREE.Vector3(side === 'left' ? -0.035 : 0.035, 0.030, -0.105).applyQuaternion(q);
  position.add(localOffset);
  return { position, quaternion: faceCameraQuaternion(position, camera, renderer), mode: 'controller' };
}

function computeWatchPose(source, camera, renderer, side){
  return isControllerProxy(source)
    ? computeControllerWatchPose(source, camera, renderer, side)
    : computeHandWatchPose(source, camera, renderer, side);
}

function sourcePressing(source){
  if (!source) return false;
  if (isControllerProxy(source)){
    const gamepad = source.userData?.gamepad || source.userData?.inputSource?.gamepad || source.userData?.controller?.inputSource?.gamepad;
    const trigger = Math.max(Number(source.userData?.trigger || 0), Number(gamepad?.buttons?.[0]?.value || 0));
    return trigger > 0.52 || isPinching(source);
  }
  return isPinching(source);
}

export function createWristWatch({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {}, tableOnly = false }){
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const group = new THREE.Group();
  group.name = 'SVR_WRIST_WATCH';
  group.userData.svrUserInterface = true;
  group.userData.svrPhase460Watch = true;
  group.visible = false;
  scene.add(group);

  const plateW = 0.184;
  const plateH = 0.102;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(plateW * 0.98, plateH * 0.98, 0.006),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.36, metalness: 0.20, emissive: 0x090b12, emissiveIntensity: 0.03, transparent: true, opacity: 0.92 })
  );
  frame.position.z = -0.010;
  group.add(frame);

  const strapMaterial = new THREE.MeshStandardMaterial({ color: 0x181d2a, roughness: 0.62, metalness: 0.08 });
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(plateW * 0.16, plateH * 0.38, 0.004), strapMaterial);
  strapL.position.set(-plateW * 0.43, 0, -0.015);
  group.add(strapL);
  const strapR = strapL.clone();
  strapR.position.x = plateW * 0.43;
  group.add(strapR);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.965),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  screen.renderOrder = 1000;
  screen.position.z = 0.010;
  screen.rotation.z = DISPLAY_ROTATED_180 ? Math.PI : 0;
  group.add(screen);

  let hoveredId = null;
  let pressed = false;
  let pinchTime = 0;
  let pressLockId = null;
  let lastHovered = null;
  let lastSig = '';
  let lastAnchorMode = 'none';

  function pokerState(){ return window.SVR_PHASE85_POKER_STATE || window.SVR_PHASE86_POKER_STATE || window.SVR_PHASE336_POKER_STATE || {}; }
  function pokerActionLabel(id){ return ({ pokerFold:'FOLD', pokerCheck:'CHECK', pokerCall:'CALL', pokerRaise:'RAISE', pokerAllIn:'ALL-IN', pokerNext:'NEXT' })[id] || id; }

  function buildButtons(state){
    if (tableOnly) return ['pokerFold', 'pokerCheck', 'pokerCall', 'pokerRaise', 'pokerAllIn', 'pokerNext'].map((id, i) => ({
      id,
      label: id === 'pokerNext' ? 'NEXT HAND' : pokerActionLabel(id),
      x: 32 + (i % 3) * 328,
      y: 190 + Math.floor(i / 3) * 126,
      w: 304,
      h: 104,
      font: 38,
      hold: .16,
      margin: 5
    }));
    const buttons = [
      { id:'lobby', label:'LOBBY', x:24, y:142, w:110, h:38, font:20, hold:.16, margin:6 },
      { id:'storeScene', label:'STORE', x:144, y:142, w:110, h:38, font:20, hold:.16, margin:6 },
      { id:'seatScene', label:'SEAT', x:264, y:142, w:110, h:38, font:20, hold:.16, margin:6 },
      { id:'reikiScene', label:'REIKI', x:24, y:188, w:110, h:38, font:20, hold:.16, margin:6 },
      { id:'pgaScene', label:'PGA', x:144, y:188, w:110, h:38, font:20, hold:.16, margin:6 },
      { id:'legendScene', label:'LEGEND', x:264, y:188, w:110, h:38, font:17, hold:.16, margin:6 },
      { id:'sponsorScene', label:'SPONSOR', x:24, y:234, w:110, h:38, font:16, hold:.16, margin:6 },
      { id:'scorpionScene', label:'SCORPION', x:144, y:234, w:110, h:38, font:15, hold:.16, margin:6 },
      { id:'reikiRoomScene', label:'R-ROOM', x:264, y:234, w:110, h:38, font:16, hold:.16, margin:6 },
      { id:'pokerFold', label:'FOLD', x:408, y:116, w:132, h:42, font:21, hold:.14, margin:7, stroke:'rgba(255,91,140,.75)', text:'#ffd6e1' },
      { id:'pokerCheck', label:'CHECK', x:552, y:116, w:132, h:42, font:20, hold:.14, margin:7, stroke:'rgba(127,252,255,.75)', text:'#d8ffff' },
      { id:'pokerCall', label:'CALL', x:696, y:116, w:132, h:42, font:21, hold:.14, margin:7, stroke:'rgba(134,255,183,.75)', text:'#dfffea' },
      { id:'pokerRaise', label:'RAISE', x:840, y:116, w:132, h:42, font:20, hold:.14, margin:7, stroke:'rgba(255,217,138,.75)', text:'#fff0c6' },
      { id:'pokerAllIn', label:'ALL-IN', x:408, y:168, w:274, h:42, font:23, hold:.18, margin:7, stroke:'rgba(255,255,255,.82)', text:'#ffffff' },
      { id:'pokerNext', label:'NEXT HAND', x:696, y:168, w:276, h:42, font:22, hold:.18, margin:7, stroke:'rgba(189,124,255,.80)', text:'#f0dcff' },
      { id:'audio', label:state.audioEnabled ? 'MUSIC ON' : 'MUSIC OFF', x:24, y:348, w:156, h:56, font:22, hold:.20, margin:6 },
      { id:'storeOpen', label:'OPEN STORE', x:194, y:348, w:172, h:56, font:21, hold:.20, margin:6 },
      { id:'teleport', label:state.teleportEnabled ? 'TP ON' : 'TP OFF', x:408, y:224, w:564, h:180, font:58, hold:.18, margin:8 }
    ];
    if (state.seated) buttons.push({ id:'leave', label:'LEAVE TABLE', x:408, y:58, w:564, h:44, font:24, hold:.18, margin:8 });
    else if (state.inTableZone) buttons.push({ id:'join', label:'QUICK SIT', x:408, y:58, w:564, h:44, font:26, hold:.18, margin:8 });
    return buttons;
  }

  function drawButton(btn, hovered){
    ctx.save();
    ctx.fillStyle = hovered ? 'rgba(180,140,255,0.30)' : 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = hovered ? 'rgba(180,140,255,0.98)' : btn.stroke || 'rgba(180,140,255,0.38)';
    ctx.lineWidth = hovered ? 5 : 3;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 18);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = hovered ? '#ffffff' : (btn.text || '#e8e8ff');
    ctx.font = `bold ${btn.font || 28}px system-ui, Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    ctx.restore();
  }

  function draw(force = false){
    const state = getState();
    const ps = pokerState();
    const sig = JSON.stringify({ h:hoveredId, c:state.cash, s:state.seated, tp:state.teleportEnabled, phase:ps.phase, pot:ps.pot, winner:ps.winner?.name, anchor:lastAnchorMode, sec:new Date().getSeconds() });
    if (!force && sig === lastSig) return;
    lastSig = sig;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (DISPLAY_MIRRORED){ ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, 'rgba(5,8,16,0.96)');
    grad.addColorStop(1, 'rgba(18,10,32,0.98)');
    ctx.fillStyle = grad; rr(ctx, 12, 12, 1000, 488, 34); ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,255,0.72)'; ctx.lineWidth = 6; rr(ctx, 12, 12, 1000, 488, 34); ctx.stroke();

    const now = new Date();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 48px system-ui, Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), 42, 60);
    ctx.textAlign = 'right'; ctx.fillStyle = '#7ff5c7'; ctx.font = 'bold 34px system-ui, Arial';
    ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 972, 60);
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(233,233,255,.96)'; ctx.font = 'bold 27px system-ui, Arial';
    ctx.fillText('SVR WRIST CONSOLE', 34, 105);

    if (tableOnly){
      ctx.font = '26px system-ui, Arial'; ctx.fillStyle = '#dffcff';
      ctx.fillText(`${String(ps.phase || 'ready').toUpperCase()}  •  POT ${ps.pot ?? 0}  •  ${lastAnchorMode.toUpperCase()}`, 34, 150);
    } else {
      ctx.fillStyle = 'rgba(233,233,255,.78)'; ctx.font = '21px system-ui, Arial';
      ctx.fillText(`Seat: ${state.seated ? state.seatLabel : 'Standing'}`, 430, 238);
      ctx.fillText(`Poker: ${String(ps.phase || 'ready').toUpperCase()} • Pot ${ps.pot ?? 0}`, 430, 270);
      ctx.fillText(`Winner: ${ps.winner?.name || '—'} • TP ${state.teleportEnabled ? 'ON' : 'OFF'}`, 430, 302);
      ctx.textAlign = 'right'; ctx.font = 'bold 24px system-ui, Arial';
      ctx.fillStyle = state.seated ? '#7ff5c7' : state.inTableZone ? '#f6e27f' : 'rgba(233,233,255,.72)';
      ctx.fillText(state.seated ? 'AT TABLE' : (state.inTableZone ? 'JOIN READY' : 'LOBBY'), 970, 92);
    }
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
    let best = null, scoreBest = Infinity;
    for (const btn of buildButtons(state)){
      const margin = btn.margin ?? 8;
      if (x < btn.x - margin || x > btn.x + btn.w + margin || y < btn.y - margin || y > btn.y + btn.h + margin) continue;
      const nx = (x - (btn.x + btn.w / 2)) / Math.max(btn.w / 2, 1);
      const ny = (y - (btn.y + btn.h / 2)) / Math.max(btn.h / 2, 1);
      const score = nx * nx + ny * ny;
      if (score < scoreBest){ best = btn.id; scoreBest = score; }
    }
    return best;
  }

  function emitPoker(action){
    if (typeof window.SVR_POKER_ACTION === 'function'){
      const accepted = window.SVR_POKER_ACTION(action === 'all_in' ? 'allin' : action);
      window.SVR_PHASE87_LAST_WATCH_POKER_ACTION = { action, source:'watch', accepted:accepted !== false };
      return accepted;
    }
    const payload = { build:PHASE87_LABEL, action, source:'watch', tableKey:'lobby-main', seatId:'SOUTH_PLAYER', playMoneyOnly:true, createdAt:new Date().toISOString() };
    window.SVR_PHASE87_LAST_WATCH_POKER_ACTION = payload;
    window.dispatchEvent(new CustomEvent('svr-poker-player-action', { detail:payload }));
    window.dispatchEvent(new CustomEvent('svr-watch-poker-action', { detail:payload }));
    return payload;
  }

  function activate(id){
    if (!id) return;
    if (id === 'audio') actions.toggleAudio?.();
    else if (id === 'next') actions.nextTrack?.();
    else if (id === 'storeOpen') actions.openStore?.();
    else if (id === 'join') actions.joinTable?.();
    else if (id === 'leave') actions.leaveTable?.();
    else if (id === 'teleport') actions.toggleTeleport?.();
    else if (id === 'lobby') actions.goLobby?.();
    else if (id === 'tableScene') actions.goTable?.();
    else if (id === 'storeScene') actions.goStore?.();
    else if (id === 'seatScene') actions.goSeat?.();
    else if (id === 'reikiScene') actions.goReiki?.();
    else if (id === 'pgaScene') actions.goPga?.();
    else if (id === 'legendScene') actions.goLegend?.();
    else if (id === 'sponsorScene') actions.goSponsor?.();
    else if (id === 'scorpionScene') actions.goScorpion?.();
    else if (id === 'reikiRoomScene') actions.goReikiRoom?.();
    else if (id === 'pokerFold') emitPoker('fold');
    else if (id === 'pokerCheck') emitPoker('check');
    else if (id === 'pokerCall') emitPoker('call');
    else if (id === 'pokerRaise') emitPoker('raise');
    else if (id === 'pokerAllIn') emitPoker('all_in');
    else if (id === 'pokerNext') emitPoker('next');
  }

  function resetInteraction(){
    hoveredId = null; pressed = false; pinchTime = 0; pressLockId = null; lastHovered = null;
  }

  function update(dt, input, legacyRightHand){
    const bundled = input && ('leftHand' in input || 'rightHand' in input || 'leftController' in input || 'rightController' in input);
    const leftHand = bundled ? input.leftHand : input;
    const rightHand = bundled ? input.rightHand : legacyRightHand;
    const leftController = bundled ? input.leftController : null;
    const rightController = bundled ? input.rightController : null;

    const anchor = sourceReady(leftHand) ? leftHand
      : sourceReady(leftController) ? leftController
      : sourceReady(rightHand) ? rightHand
      : sourceReady(rightController) ? rightController
      : null;

    if (!anchor){
      group.visible = false;
      lastAnchorMode = 'none';
      resetInteraction();
      return;
    }

    const anchorLeft = anchor === leftHand || anchor === leftController;
    const pose = computeWatchPose(anchor, camera, renderer, anchorLeft ? 'left' : 'right');
    if (!pose){
      group.visible = false;
      lastAnchorMode = 'none';
      resetInteraction();
      return;
    }

    lastAnchorMode = pose.mode;
    group.visible = true;
    group.position.copy(pose.position);
    group.quaternion.copy(pose.quaternion);
    group.updateMatrixWorld(true);

    const candidates = anchorLeft ? [rightHand, rightController] : [leftHand, leftController];
    let nextHovered = null;
    let activeInput = null;
    let bestDepth = Infinity;
    for (const candidate of candidates.filter(sourceReady)){
      const tip = candidate?.joints?.['index-finger-tip'];
      if (!tip) continue;
      tip.updateWorldMatrix?.(true, false);
      const tipPos = tip.getWorldPosition(new THREE.Vector3());
      const local = group.worldToLocal(tipPos.clone());
      if (local.z < -0.06 || local.z > 0.12 || Math.abs(local.x) > plateW * 0.74 || Math.abs(local.y) > plateH * 0.74) continue;
      const hit = localHit(local);
      if (!hit) continue;
      const depth = Math.abs(local.z);
      if (depth < bestDepth){ bestDepth = depth; nextHovered = hit; activeInput = candidate; }
    }
    hoveredId = nextHovered;

    const pressing = Boolean(activeInput && sourcePressing(activeInput));
    if (pressing && hoveredId && !pressLockId) pressLockId = hoveredId;
    if (pressing && pressLockId) hoveredId = pressLockId;
    if (!pressing) pressLockId = null;

    if (hoveredId === lastHovered && hoveredId) {
      if (pressing) pinchTime += dt;
    } else {
      lastHovered = hoveredId;
      pinchTime = 0;
      pressed = false;
    }

    const activeBtn = buildButtons(getState()).find(btn => btn.id === hoveredId) || null;
    const hold = activeBtn?.hold ?? 0.14;
    if (activeBtn && pressing && !pressed && pinchTime >= hold){
      pressed = true;
      activate(activeBtn.id);
      pinchTime = 0;
    }
    if (!pressing) pressed = false;

    draw();
    window.SVR_PHASE460_WATCH_STATE = {
      build:BUILD,
      visible:group.visible,
      anchor:lastAnchorMode,
      hovered:hoveredId,
      tableOnly,
      checkedAt:new Date().toISOString()
    };
  }

  draw(true);
  window.SVR_PHASE87_WATCH_POKER_CONTROLS_LOCK = { build:PHASE87_LABEL, active:true, actions:['fold','check','call','raise','all_in','next'], siteTouched:false, checkedAt:new Date().toISOString() };
  window.SVR_PHASE460_WATCH_STATE = { build:BUILD, visible:false, anchor:'none', tableOnly, checkedAt:new Date().toISOString() };
  return { update, object:group };
}
