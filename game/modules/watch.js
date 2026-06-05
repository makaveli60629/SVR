import * as THREE from "three";
import { isPinching } from "./gestures.js";

const BUILD = "LOBBY-ORG-1-2-WATCH-ORIENTATION-LOCK";
const V0 = new THREE.Vector3();
const V1 = new THREE.Vector3();
const V2 = new THREE.Vector3();
const V3 = new THREE.Vector3();
const M0 = new THREE.Matrix4();
const DISPLAY_MIRRORED = false;

function rr(c, x, y, w, h, r){
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

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

function getCamUp(activeCamera){
  const up = new THREE.Vector3(0, 1, 0);
  if (!activeCamera) return up;
  return up.applyQuaternion(activeCamera.quaternion).normalize();
}

function computeForearmPose(hand, camera, renderer, side = "left"){
  const wrist = getJointWorld(hand, ["wrist"]);
  const index = getJointWorld(hand, ["index-finger-metacarpal", "index-finger-phalanx-proximal", "index-finger-tip"]);
  const pinky = getJointWorld(hand, ["pinky-finger-metacarpal", "pinky-finger-phalanx-proximal", "pinky-finger-tip"]);
  if (!wrist || !index || !pinky) return null;

  const activeCamera = getActiveCamera(camera, renderer);
  const camPos = new THREE.Vector3();
  if (activeCamera) activeCamera.getWorldPosition(camPos);
  else camPos.copy(wrist).add(new THREE.Vector3(0, 0.25, 1.0));

  const midpoint = V3.copy(index).add(pinky).multiplyScalar(0.5);
  const towardElbow = V0.copy(wrist).sub(midpoint).normalize();
  const normalToCamera = V1.copy(camPos).sub(wrist).normalize();

  let xAxis = towardElbow.clone();
  // Keep the watch long axis along forearm but remove camera-facing normal component.
  xAxis.addScaledVector(normalToCamera, -xAxis.dot(normalToCamera));
  if (xAxis.lengthSq() < 1e-5) xAxis.set(side === "left" ? 1 : -1, 0, 0);
  xAxis.normalize();

  let yAxis = V2.crossVectors(normalToCamera, xAxis).normalize();
  const camUp = getCamUp(activeCamera);
  if (yAxis.dot(camUp) < 0){
    xAxis.multiplyScalar(-1);
    yAxis.crossVectors(normalToCamera, xAxis).normalize();
  }

  M0.makeBasis(xAxis, yAxis, normalToCamera);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(M0);
  const position = wrist.clone()
    .add(towardElbow.clone().multiplyScalar(0.105))
    .add(normalToCamera.clone().multiplyScalar(0.028));

  return { position, quaternion };
}

function makeWatchTexture(){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { canvas, ctx, tex };
}

export function createWristWatch({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const { canvas, ctx, tex } = makeWatchTexture();
  const group = new THREE.Group();
  group.name = "SVR_WATCH_ORIENTATION_LOCK";
  group.visible = false;
  scene.add(group);

  const plateW = 0.255;
  const plateH = 0.132;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(plateW * 1.03, plateH * 1.06, 0.006),
    new THREE.MeshStandardMaterial({ color: 0x0b1020, roughness: 0.30, metalness: 0.42, emissive: 0x05060d, emissiveIntensity: 0.05, transparent: true, opacity: 0.92 })
  );
  frame.name = "SVR_WATCH_FRAME";
  frame.position.z = -0.016;
  group.add(frame);

  const trim = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 1.03, plateH * 1.06),
    new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false, depthTest: false })
  );
  trim.name = "SVR_WATCH_PURPLE_TRIM";
  trim.position.z = -0.006;
  trim.renderOrder = 38;
  group.add(trim);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.925),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  screen.name = "SVR_WATCH_SCREEN_READABLE";
  screen.renderOrder = 44;
  screen.position.z = 0.014;
  group.add(screen);

  function buildButtons(state){
    const buttons = [
      { id: "lobby", label: "LOBBY", x: 24, y: 142, w: 140, h: 54, font: 24, hold: 0.14, margin: 10 },
      { id: "seatScene", label: "SEAT", x: 178, y: 142, w: 140, h: 54, font: 24, hold: 0.14, margin: 10 },
      { id: "reikiScene", label: "REIKI", x: 332, y: 142, w: 140, h: 54, font: 24, hold: 0.14, margin: 10 },
      { id: "pgaScene", label: "PGA", x: 486, y: 142, w: 140, h: 54, font: 24, hold: 0.14, margin: 10 },
      { id: "scorpionScene", label: "SCORPION", x: 640, y: 142, w: 172, h: 54, font: 20, hold: 0.14, margin: 10 },
      { id: "vrStore", label: "VR STORE", x: 826, y: 142, w: 172, h: 54, font: 21, hold: 0.14, margin: 10 },

      { id: "reikiRoomScene", label: "REIKI ROOM", x: 24, y: 214, w: 206, h: 58, font: 23, hold: 0.14, margin: 10 },
      { id: "audio", label: state.audioEnabled ? "MUSIC ON" : "MUSIC OFF", x: 246, y: 214, w: 196, h: 58, font: 23, hold: 0.16, margin: 10 },
      { id: "next", label: "NEXT TRACK", x: 458, y: 214, w: 208, h: 58, font: 22, hold: 0.16, margin: 10 },
      { id: "teleport", label: state.teleportEnabled ? "TP ON" : "TP OFF", x: 682, y: 214, w: 316, h: 128, font: 46, hold: 0.14, margin: 16 },

      { id: state.seated ? "leave" : "join", label: state.seated ? "LEAVE TABLE" : (state.inTableZone ? "QUICK SIT" : "WALK TO TABLE"), x: 24, y: 292, w: 418, h: 70, font: 31, hold: 0.16, margin: 12 },
      { id: "sponsorScene", label: "SPONSOR", x: 458, y: 292, w: 208, h: 70, font: 24, hold: 0.14, margin: 10 },
    ];
    return buttons;
  }

  let hoveredId = null;
  let pressed = false;
  let pinchTime = 0;
  let pressLockId = null;
  let lastHovered = null;
  let lastSig = "";

  function drawButton(btn, hovered){
    ctx.save();
    ctx.fillStyle = hovered ? "rgba(180,140,255,0.34)" : "rgba(255,255,255,0.085)";
    ctx.strokeStyle = hovered ? "rgba(180,140,255,1.0)" : "rgba(180,140,255,0.38)";
    ctx.lineWidth = hovered ? 6 : 3;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hovered ? "#ffffff" : "#e9e9ff";
    ctx.font = `900 ${btn.font || 26}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1, btn.w - 12);
    ctx.restore();
  }

  function draw(force = false){
    const state = getState();
    const sig = JSON.stringify({ h: hoveredId, t: state.trackTitle, ae: state.audioEnabled, c: state.cash, s: state.seated, z: state.inTableZone, seat: state.seatLabel, sec: new Date().getSeconds() });
    if (!force && sig === lastSig) return;
    lastSig = sig;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (DISPLAY_MIRRORED){ ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "rgba(5,8,16,0.94)");
    grad.addColorStop(0.52, "rgba(20,11,40,0.96)");
    grad.addColorStop(1, "rgba(4,22,28,0.94)");
    ctx.fillStyle = grad;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.fill();
    ctx.strokeStyle = "rgba(180,140,255,0.72)";
    ctx.lineWidth = 6;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.stroke();

    const now = new Date();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px system-ui, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), 42, 60);

    ctx.textAlign = "right";
    ctx.fillStyle = "#7ff5c7";
    ctx.font = "900 38px system-ui, Arial";
    ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 972, 60);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(233,233,255,0.95)";
    ctx.font = "900 30px system-ui, Arial";
    ctx.fillText("SVR WRIST CONSOLE", 42, 106);
    ctx.fillStyle = "rgba(233,233,255,0.78)";
    ctx.font = "700 21px system-ui, Arial";
    ctx.fillText(`Seat: ${state.seated ? state.seatLabel : "Standing"}`, 430, 96);
    ctx.fillText(`Track: ${state.audioEnabled ? state.trackTitle : "Paused"}`, 430, 124);
    ctx.textAlign = "right";
    ctx.fillStyle = state.seated ? "#7ff5c7" : state.inTableZone ? "#f6e27f" : "rgba(233,233,255,0.72)";
    ctx.font = "900 26px system-ui, Arial";
    ctx.fillText(state.seated ? "AT TABLE" : (state.inTableZone ? "JOIN READY" : "LOBBY"), 970, 106);

    for (const btn of buildButtons(state)) drawButton(btn, hoveredId === btn.id);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(180,140,255,0.92)";
    ctx.font = "900 20px system-ui, Arial";
    ctx.fillText("Readable lock: screen faces you • pinch with other hand • fist by face toggles teleport", 34, 468);
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
    if (id === "audio") actions.toggleAudio?.();
    if (id === "next") actions.nextTrack?.();
    if (id === "join") actions.joinTable?.();
    if (id === "leave") actions.leaveTable?.();
    if (id === "teleport") actions.toggleTeleport?.();
    if (id === "lobby") actions.goLobby?.();
    if (id === "tableScene") actions.goTable?.();
    if (id === "seatScene") actions.goSeat?.();
    if (id === "reikiScene") actions.goReiki?.();
    if (id === "pgaScene") actions.goPga?.();
    if (id === "legendScene") actions.goLegend?.();
    if (id === "sponsorScene") actions.goSponsor?.();
    if (id === "scorpionScene") actions.goScorpion?.();
    if (id === "reikiRoomScene") actions.goReikiRoom?.();
    if (id === "vrStore") actions.goVrStore?.();
  }

  function update(dt = 0.016, leftHand, rightHand){
    const anchor = leftHand?.joints?.wrist ? leftHand : rightHand?.joints?.wrist ? rightHand : null;
    if (!anchor?.joints?.wrist){
      group.visible = false;
      hoveredId = null;
      draw(true);
      return;
    }

    const watchOnLeft = anchor === leftHand;
    const pose = computeForearmPose(anchor, camera, renderer, watchOnLeft ? "left" : "right");
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
      const tip = candidate?.joints?.["index-finger-tip"];
      if (!tip) continue;
      const tipPos = new THREE.Vector3();
      tip.getWorldPosition(tipPos);
      const local = group.worldToLocal(tipPos.clone());
      if (local.z > -0.026 && local.z < 0.105 && Math.abs(local.x) < plateW * 0.78 && Math.abs(local.y) < plateH * 0.80){
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

    if (hoveredId === lastHovered && hoveredId) pinchTime += pinching ? dt : 0;
    else {
      lastHovered = hoveredId;
      pinchTime = 0;
      if (pressed) pressed = false;
      if (!hoveredId) pressLockId = null;
    }

    const buttons = buildButtons(getState());
    const activeBtn = buttons.find(btn => btn.id === hoveredId) || null;
    const directHold = activeBtn?.hold ?? 0.14;
    if (hoveredId && pinching && !pressed && pinchTime > directHold){
      pressed = true;
      activate(hoveredId);
      pinchTime = 0;
    }
    if (!pinching) pressed = false;

    draw();
  }

  draw(true);
  window.SVR_WATCH_ORIENTATION_LOCK = { build: BUILD, readableFacing: true, largerButtons: true };
  return { update, draw: () => draw(true), group };
}
