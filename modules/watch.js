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
const FLIP_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
const SCREEN_TILT_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.34);

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
    .add(forearmDir.clone().multiplyScalar(0.112))
    .add(faceNormal.clone().multiplyScalar(0.030))
    .add(acrossPalm.clone().multiplyScalar(side === 'left' ? -0.006 : 0.006));

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

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(plateW * 1.02, plateH * 1.04, 0.004),
    new THREE.MeshStandardMaterial({ color: 0x0b0f16, roughness: 0.52, metalness: 0.18, emissive: 0x06060a, emissiveIntensity: 0.04 })
  );
  back.position.z = -0.010;
  group.add(back);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW, plateH),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false, depthTest: false })
  );
  screen.renderOrder = 30;
  screen.position.z = 0.002;
  screen.rotation.z = Math.PI;
  group.add(screen);

  const bezel = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 1.01, plateH * 1.01),
    new THREE.MeshStandardMaterial({ color: 0x151a26, roughness: 0.48, metalness: 0.20, emissive: 0x08080c, emissiveIntensity: 0.03, side: THREE.DoubleSide })
  );
  bezel.position.z = -0.003;
  group.add(bezel);

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
      { id: 'audio', label: state.audioEnabled ? 'MUSIC ON' : 'MUSIC OFF', x: 24, y: 348, w: 200, h: 64 },
      { id: 'next', label: 'NEXT TRACK', x: 236, y: 348, w: 190, h: 64 },
      { id: 'teleport', label: state.teleportEnabled ? 'TP ON' : 'TP OFF', x: 438, y: 348, w: 156, h: 64 },
    ];
    if (state.seated) buttons.push({ id: 'leave', label: 'LEAVE TABLE', x: 606, y: 348, w: 250, h: 64, font: 26 });
    else if (state.inTableZone) buttons.push({ id: 'join', label: 'QUICK SIT', x: 606, y: 348, w: 250, h: 64, font: 28 });
    return buttons;
  }

  let hoveredId = null;
  let pressed = false;
  let hoverTime = 0;
  let lastHovered = null;
  let lastSig = '';

  function draw(force = false){
    const state = getState();
    const sig = JSON.stringify({ h: hoveredId, t: state.trackTitle, ae: state.audioEnabled, c: state.cash, s: state.seated, z: state.inTableZone, seat: state.seatLabel, sec: new Date().getSeconds() });
    if (!force && sig === lastSig) return;
    lastSig = sig;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    ctx.fillText('SVR WRIST CONSOLE', 34, 150);
    ctx.fillStyle = 'rgba(233,233,255,0.78)';
    ctx.font = '25px system-ui, Arial';
    ctx.fillText(`Seat: ${state.seated ? state.seatLabel : 'Standing'}`, 36, 205);
    ctx.fillText(`Track: ${state.audioEnabled ? state.trackTitle : 'Paused'}`, 36, 243);
    ctx.fillText(`Zone: ${state.inTableZone ? 'Ready' : 'Walk closer'}`, 36, 281);
    ctx.textAlign = 'right';
    ctx.fillStyle = state.seated ? '#7ff5c7' : state.inTableZone ? '#f6e27f' : 'rgba(233,233,255,0.72)';
    ctx.font = 'bold 28px system-ui, Arial';
    ctx.fillText(state.seated ? 'AT TABLE' : (state.inTableZone ? 'JOIN READY' : 'LOBBY'), 970, 148);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(180,140,255,0.92)';
    ctx.font = 'bold 22px system-ui, Arial';
    ctx.fillText('touch with other hand to press • TP button controls teleport', 36, 315);

    for (const btn of buildButtons(state)) drawButton(btn, hoveredId === btn.id);
    tex.needsUpdate = true;
  }

  function localHit(local){
    const state = getState();
    let x = ((local.x / plateW) + 0.5) * canvas.width;
    let y = ((-local.y / plateH) + 0.5) * canvas.height;
    x = canvas.width - x;
    y = canvas.height - y;
    const slop = 120;
    for (const btn of buildButtons(state)){
      if (x >= btn.x - slop && x <= btn.x + btn.w + slop && y >= btn.y - slop && y <= btn.y + btn.h + slop) return btn.id;
    }
    return null;
  }

  function activate(id){
    if (!id) return;
    if (id === 'audio') actions.toggleAudio?.();
    if (id === 'next') actions.nextTrack?.();
    if (id === 'join') actions.joinTable?.();
    if (id === 'leave') actions.leaveTable?.();
    if (id === 'teleport') actions.toggleTeleport?.();
  }

  function update(_dt, leftHand, rightHand){
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
    const tip = inputHand?.joints?.['index-finger-tip'];
    if (tip){
      const tipPos = new THREE.Vector3();
      tip.getWorldPosition(tipPos);
      const local = group.worldToLocal(tipPos.clone());
      if (Math.abs(local.z) < 0.08 && Math.abs(local.x) < plateW * 0.64 && Math.abs(local.y) < plateH * 0.64){
        nextHovered = localHit(local);
      }
    }
    hoveredId = nextHovered;

    const pinching = !!inputHand && isPinching(inputHand);
    if (hoveredId === lastHovered && hoveredId) hoverTime += _dt;
    else { lastHovered = hoveredId; hoverTime = hoveredId ? 0.03 : 0; }

    if (hoveredId && (pinching || hoverTime > 0.14) && !pressed){
      pressed = true;
      activate(hoveredId);
      hoverTime = 0;
    }
    if (!pinching) pressed = false;

    draw();
  }

  draw(true);
  return { update, object: group };
}
