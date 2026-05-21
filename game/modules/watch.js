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

export function createWristWatch({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  // Phase 101: real Three.js wrist hologram panel. Do not use the old A-Frame replacement.
  const holoCanvas = document.createElement('canvas');
  holoCanvas.width = 1024;
  holoCanvas.height = 512;
  const holoCtx = holoCanvas.getContext('2d');
  const holoTex = new THREE.CanvasTexture(holoCanvas);
  holoTex.colorSpace = THREE.SRGBColorSpace;
  holoTex.anisotropy = 8;

  function redrawHoloPanel(state = {}){
    holoCtx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);
    const g = holoCtx.createLinearGradient(0, 0, holoCanvas.width, holoCanvas.height);
    g.addColorStop(0, 'rgba(8, 10, 24, 0.76)');
    g.addColorStop(0.55, 'rgba(38, 12, 64, 0.70)');
    g.addColorStop(1, 'rgba(0, 30, 38, 0.62)');
    holoCtx.fillStyle = g;
    rr(holoCtx, 24, 24, 976, 464, 42);
    holoCtx.fill();
    holoCtx.strokeStyle = 'rgba(124,255,226,0.95)';
    holoCtx.lineWidth = 8;
    rr(holoCtx, 24, 24, 976, 464, 42);
    holoCtx.stroke();
    holoCtx.textAlign = 'center';
    holoCtx.textBaseline = 'middle';
    holoCtx.fillStyle = '#ffffff';
    holoCtx.font = '900 64px system-ui, Arial';
    holoCtx.fillText('SVR HOLO MENU', 512, 94);
    holoCtx.fillStyle = '#7ff5c7';
    holoCtx.font = '800 34px system-ui, Arial';
    holoCtx.fillText('WATCH ROUTING • STORE • PROFILE • PRIVATE ROOMS', 512, 154);
    const items = [
      ['SCORPION', 'private poker gameplay'],
      ['REIKI', 'approval placeholder room'],
      ['PGA', 'private range training'],
      ['STORE', 'VR store portal'],
      ['LOUNGE', 'social private room'],
      ['SPACE', 'Moon / Mars deck']
    ];
    holoCtx.font = '800 30px system-ui, Arial';
    items.forEach((item, idx)=>{
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = col ? 728 : 296;
      const y = 232 + row * 72;
      holoCtx.fillStyle = 'rgba(180,140,255,0.18)';
      rr(holoCtx, x - 180, y - 27, 360, 52, 18);
      holoCtx.fill();
      holoCtx.strokeStyle = 'rgba(180,140,255,0.44)';
      holoCtx.lineWidth = 3;
      rr(holoCtx, x - 180, y - 27, 360, 52, 18);
      holoCtx.stroke();
      holoCtx.fillStyle = '#ffffff';
      holoCtx.fillText(item[0], x, y - 7);
      holoCtx.fillStyle = 'rgba(233,255,246,0.78)';
      holoCtx.font = '600 20px system-ui, Arial';
      holoCtx.fillText(item[1], x, y + 18);
      holoCtx.font = '800 30px system-ui, Arial';
    });
    holoCtx.fillStyle = '#ffd86b';
    holoCtx.font = '800 24px system-ui, Arial';
    holoCtx.fillText(state.teleportEnabled ? 'TP ARMED: aim + release' : 'TP OFF: use watch TP / fist chinch', 512, 462);
    holoTex.needsUpdate = true;
  }

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
  screenFront.rotation.z = 0;
  group.add(screenFront);

  const holoPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.275, 0.138),
    new THREE.MeshBasicMaterial({ map: holoTex, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  holoPanel.name = 'PHASE_101_WRIST_HOLOGRAM_PANEL';
  holoPanel.position.set(0, 0.150, 0.052);
  holoPanel.rotation.x = -0.18;
  holoPanel.renderOrder = 70;
  group.add(holoPanel);

  const holoBeam = new THREE.Mesh(
    new THREE.ConeGeometry(0.070, 0.145, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x7ff5c7, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
  );
  holoBeam.name = 'PHASE_101_WRIST_HOLOGRAM_BEAM';
  holoBeam.position.set(0, 0.074, 0.028);
  holoBeam.rotation.x = Math.PI;
  holoBeam.renderOrder = 69;
  group.add(holoBeam);

  const screenBack = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.965),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, depthWrite: false, depthTest: false, opacity: 0.0, toneMapped: false })
  );
  screenBack.visible = false;


  function drawButton(btn, hovered){
    ctx.save();
    ctx.fillStyle = hovered ? 'rgba(180,140,255,0.28)' : 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = hovered ? 'rgba(180,140,255,0.95)' : 'rgba(180,140,255,0.35)';
    ctx.lineWidth = hovered ? 5 : 3;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 18);
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
  const buttons = [
    { id: 'lobby', label: 'LOBBY', x: 24, y: 146, w: 118, h: 42, font: 22, pinchOnly: true, hold: 0.16, margin: 6 },
    { id: 'tableScene', label: 'TABLE', x: 154, y: 146, w: 118, h: 42, font: 22, pinchOnly: true, hold: 0.16, margin: 6 },
    { id: 'seatScene', label: 'SEAT', x: 284, y: 146, w: 118, h: 42, font: 22, pinchOnly: true, hold: 0.16, margin: 6 },

    { id: 'reikiScene', label: 'REIKI', x: 24, y: 198, w: 118, h: 42, font: 22, pinchOnly: true, hold: 0.16, margin: 6 },
    { id: 'pgaScene', label: 'PGA', x: 154, y: 198, w: 118, h: 42, font: 22, pinchOnly: true, hold: 0.16, margin: 6 },
    { id: 'pgaRangeScene', label: 'RANGE', x: 284, y: 198, w: 118, h: 42, font: 19, pinchOnly: true, hold: 0.16, margin: 6 },

    { id: 'scorpionScene', label: 'SCORPION', x: 24, y: 250, w: 118, h: 42, font: 16, pinchOnly: true, hold: 0.16, margin: 6 },
    { id: 'reikiRoomScene', label: 'REIKI RM', x: 154, y: 250, w: 118, h: 42, font: 16, pinchOnly: true, hold: 0.16, margin: 6 },
    { id: 'storeScene', label: 'STORE', x: 284, y: 250, w: 118, h: 42, font: 18, pinchOnly: true, hold: 0.16, margin: 6 },

    { id: 'loungeScene', label: 'LOUNGE', x: 24, y: 302, w: 118, h: 42, font: 17, pinchOnly: true, hold: 0.16, margin: 6 },
    { id: 'spaceScene', label: 'SPACE', x: 154, y: 302, w: 118, h: 42, font: 18, pinchOnly: true, hold: 0.16, margin: 6 },
    { id: 'sponsorScene', label: 'SPONSOR', x: 284, y: 302, w: 118, h: 42, font: 16, pinchOnly: true, hold: 0.16, margin: 6 },

    { id: 'audio', label: state.audioEnabled ? 'MUSIC ON' : 'MUSIC OFF', x: 24, y: 360, w: 156, h: 58, font: 24, pinchOnly: true, hold: 0.20, margin: 6 },
    { id: 'next', label: 'NEXT TRACK', x: 194, y: 360, w: 172, h: 58, font: 22, pinchOnly: true, hold: 0.20, margin: 6 },
    { id: 'holo', label: state.holoMenuVisible === false ? 'HOLO OFF' : 'HOLO ON', x: 380, y: 120, w: 172, h: 48, font: 22, pinchOnly: true, hold: 0.16, margin: 6 },
    { id: 'teleport', label: state.teleportEnabled ? 'TP ON' : 'TP OFF', x: 428, y: 178, w: 548, h: 240, font: 64, pinchOnly: true, hold: 0.18, margin: 8 },
  ];
  if (state.seated) buttons.push({ id: 'leave', label: 'LEAVE TABLE', x: 428, y: 120, w: 548, h: 48, font: 26, pinchOnly: true, hold: 0.18, margin: 8 });
  else if (state.inTableZone) buttons.push({ id: 'join', label: 'QUICK SIT', x: 428, y: 120, w: 548, h: 48, font: 28, pinchOnly: true, hold: 0.18, margin: 8 });
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
    const holoVisible = state.holoMenuVisible !== false;
    if (holoPanel) holoPanel.visible = holoVisible;
    if (holoBeam) holoBeam.visible = holoVisible;
    const sig = JSON.stringify({ h: hoveredId, t: state.trackTitle, ae: state.audioEnabled, c: state.cash, s: state.seated, z: state.inTableZone, seat: state.seatLabel, holo: state.holoMenuVisible, tp: state.teleportEnabled, sec: new Date().getSeconds() });
    if (!force && sig === lastSig) return;
    lastSig = sig;
    redrawHoloPanel(state);

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
    ctx.font = 'bold 58px system-ui, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 42, 66);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#7ff5c7';
    ctx.font = 'bold 40px system-ui, Arial';
    ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 972, 66);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(233,233,255,0.95)';
    ctx.font = 'bold 30px system-ui, Arial';
    ctx.fillText('SVR WATCH HOLO CONSOLE', 34, 112);
    ctx.fillStyle = 'rgba(233,233,255,0.78)';
    ctx.font = '25px system-ui, Arial';
    ctx.fillText(`Seat: ${state.seated ? state.seatLabel : 'Standing'}`, 430, 152);
    ctx.fillText(`Track: ${state.audioEnabled ? state.trackTitle : 'Paused'}`, 430, 190);
    ctx.fillText(`Zone: ${state.inTableZone ? 'Ready' : 'Walk closer'}`, 430, 228);
    ctx.textAlign = 'right';
    ctx.fillStyle = state.seated ? '#7ff5c7' : state.inTableZone ? '#f6e27f' : 'rgba(233,233,255,0.72)';
    ctx.font = 'bold 28px system-ui, Arial';
    ctx.fillText(state.seated ? 'AT TABLE' : (state.inTableZone ? 'JOIN READY' : 'LOBBY'), 970, 148);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(180,140,255,0.92)';
    ctx.font = 'bold 22px system-ui, Arial';
    ctx.fillText('Watch lock • HOLO button • fist/pinch teleport • single storefront portal routing', 36, 332);

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

  function activate(id){
    if (!id) return;
    if (id === 'audio') actions.toggleAudio?.();
    if (id === 'next') actions.nextTrack?.();
    if (id === 'join') actions.joinTable?.();
    if (id === 'leave') actions.leaveTable?.();
    if (id === 'teleport') actions.toggleTeleport?.();
    if (id === 'holo') actions.toggleHoloMenu?.();
    if (id === 'lobby') actions.goLobby?.();
    if (id === 'tableScene') actions.goTable?.();
    if (id === 'seatScene') actions.goSeat?.();
    if (id === 'reikiScene') actions.goReiki?.();
    if (id === 'pgaScene') actions.goPga?.();
    if (id === 'pgaRangeScene') actions.goPgaRange?.();
    if (id === 'legendScene') actions.goLegend?.();
    if (id === 'storeScene') actions.goVrStore?.();
    if (id === 'loungeScene') actions.goSmokerLounge?.();
    if (id === 'spaceScene') actions.goSpaceRoom?.();
    if (id === 'sponsorScene') actions.goSponsor?.();
    if (id === 'scorpionScene') actions.goScorpion?.();
    if (id === 'reikiRoomScene') actions.goReikiRoom?.();
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
  return { update, object: group };
}
