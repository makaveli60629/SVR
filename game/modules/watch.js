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

function computeForearmPose(hand, camera, renderer, side = "left"){
  const wrist = getJointWorld(hand, ["wrist"]);
  const index = getJointWorld(hand, ["index-finger-metacarpal", "index-finger-phalanx-proximal", "index-finger-tip"]);
  const pinky = getJointWorld(hand, ["pinky-finger-metacarpal", "pinky-finger-phalanx-proximal", "pinky-finger-tip"]);
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
  if (side === "right") acrossPalm.multiplyScalar(-1);

  M0.makeBasis(forearmDir, acrossPalm, faceNormal);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(M0);
  quaternion.multiply(FLIP_Q);
  quaternion.multiply(SCREEN_TILT_Q);

  const position = wrist.clone()
    .add(forearmDir.clone().multiplyScalar(0.092))
    .add(faceNormal.clone().multiplyScalar(0.020))
    .add(acrossPalm.clone().multiplyScalar(side === "left" ? -0.004 : 0.004));

  return { position, quaternion };
}

export function createWristWatch({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const group = new THREE.Group();
  group.name = "svr-premium-left-wrist-watch";
  group.visible = false;
  scene.add(group);

  const plateW = 0.224;
  const plateH = 0.116;

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x101725,
    roughness: 0.25,
    metalness: 0.62,
    emissive: 0x040714,
    emissiveIntensity: 0.06,
    transparent: true,
    opacity: 0.94
  });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x181d2a, roughness: 0.62, metalness: 0.08, emissive: 0x06080c, emissiveIntensity: 0.02 });
  const whiteButtonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18, metalness: 0.04, emissive: 0xffffff, emissiveIntensity: 0.25 });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(plateW * 1.02, plateH * 1.02, 0.010), metalMat);
  frame.position.z = -0.014;
  group.add(frame);

  const strapL = new THREE.Mesh(new THREE.BoxGeometry(plateW * 0.16, plateH * 0.34, 0.004), strapMat);
  strapL.position.set(-plateW * 0.43, 0, -0.020);
  group.add(strapL);
  const strapR = strapL.clone();
  strapR.position.x = plateW * 0.43;
  group.add(strapR);

  const sideButton = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.038, 0.018), whiteButtonMat);
  sideButton.name = "white-menu-toggle-button";
  sideButton.position.set(plateW * 0.575, 0, 0.004);
  sideButton.renderOrder = 55;
  group.add(sideButton);

  const buttonHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 16, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false })
  );
  buttonHalo.position.copy(sideButton.position);
  group.add(buttonHalo);

  const screenFront = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 0.935, plateH * 0.925),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  screenFront.renderOrder = 50;
  screenFront.position.z = 0.013;
  group.add(screenFront);

  let hoveredId = null;
  let pressed = false;
  let hoverTime = 0;
  let pinchTime = 0;
  let pressLockId = null;
  let lastHovered = null;
  let lastSig = "";
  let menuOpen = false;
  let sideButtonHover = false;

  function drawButton(btn, hovered){
    ctx.save();
    ctx.fillStyle = hovered ? "rgba(180,140,255,0.30)" : "rgba(255,255,255,0.08)";
    ctx.strokeStyle = hovered ? "rgba(255,255,255,0.95)" : "rgba(180,140,255,0.35)";
    ctx.lineWidth = hovered ? 5 : 3;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hovered ? "#ffffff" : "#e8e8ff";
    ctx.font = `bold ${btn.font || 28}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    ctx.restore();
  }

  function buildButtons(state){
    if (!menuOpen) return [];
    const buttons = [
      { id: "lobby", label: "LOBBY", x: 24, y: 164, w: 118, h: 42, font: 22, hold: 0.16, margin: 6 },
      { id: "tableScene", label: "TABLE", x: 154, y: 164, w: 118, h: 42, font: 22, hold: 0.16, margin: 6 },
      { id: "seatScene", label: "SEAT", x: 284, y: 164, w: 118, h: 42, font: 22, hold: 0.16, margin: 6 },
      { id: "reikiScene", label: "REIKI", x: 24, y: 216, w: 118, h: 42, font: 22, hold: 0.16, margin: 6 },
      { id: "pgaScene", label: "PGA", x: 154, y: 216, w: 118, h: 42, font: 22, hold: 0.16, margin: 6 },
      { id: "legendScene", label: "LEGEND", x: 284, y: 216, w: 118, h: 42, font: 19, hold: 0.16, margin: 6 },
      { id: "sponsorScene", label: "SPONSOR", x: 24, y: 268, w: 118, h: 42, font: 18, hold: 0.16, margin: 6 },
      { id: "scorpionScene", label: "SCORPION", x: 154, y: 268, w: 118, h: 42, font: 17, hold: 0.16, margin: 6 },
      { id: "reikiRoomScene", label: "ZEN DEN", x: 284, y: 268, w: 118, h: 42, font: 18, hold: 0.16, margin: 6 },
      { id: "audio", label: state.audioEnabled ? "MUSIC ON" : "MUSIC OFF", x: 24, y: 372, w: 156, h: 58, font: 24, hold: 0.20, margin: 6 },
      { id: "next", label: "NEXT TRACK", x: 194, y: 372, w: 172, h: 58, font: 22, hold: 0.20, margin: 6 },
      { id: "teleport", label: state.teleportEnabled ? "TP ON" : "TP OFF", x: 428, y: 190, w: 548, h: 240, font: 64, hold: 0.18, margin: 8 },
    ];
    if (state.seated) buttons.push({ id: "leave", label: "LEAVE TABLE", x: 428, y: 132, w: 548, h: 48, font: 26, hold: 0.18, margin: 8 });
    else if (state.inTableZone) buttons.push({ id: "join", label: "QUICK SIT", x: 428, y: 132, w: 548, h: 48, font: 28, hold: 0.18, margin: 8 });
    return buttons;
  }

  function draw(force = false){
    const state = getState();
    const sig = JSON.stringify({ h: hoveredId, sb: sideButtonHover, open: menuOpen, t: state.trackTitle, ae: state.audioEnabled, c: state.cash, u: state.username, r: state.rank, s: state.seated, z: state.inTableZone, seat: state.seatLabel, sec: new Date().getSeconds() });
    if (!force && sig === lastSig) return;
    lastSig = sig;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (DISPLAY_MIRRORED){ ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "rgba(5,8,16,0.95)");
    grad.addColorStop(0.58, "rgba(15,13,34,0.94)");
    grad.addColorStop(1, "rgba(4,22,24,0.94)");
    ctx.fillStyle = grad;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.fill();
    ctx.strokeStyle = sideButtonHover ? "rgba(255,255,255,0.90)" : "rgba(180,140,255,0.65)";
    ctx.lineWidth = 6;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.stroke();

    const now = new Date();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px system-ui, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), 42, 62);

    ctx.textAlign = "right";
    ctx.fillStyle = "#7ff5c7";
    ctx.font = "bold 40px system-ui, Arial";
    ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 972, 62);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(233,233,255,0.96)";
    ctx.font = "bold 30px system-ui, Arial";
    ctx.fillText(state.username || "Player", 42, 112);
    ctx.fillStyle = "rgba(180,140,255,0.94)";
    ctx.font = "bold 24px system-ui, Arial";
    ctx.fillText(`Rank: ${state.rank || "Guest"}`, 42, 148);

    ctx.textAlign = "right";
    ctx.fillStyle = sideButtonHover ? "#ffffff" : "rgba(255,255,255,0.84)";
    ctx.font = "bold 22px system-ui, Arial";
    ctx.fillText(menuOpen ? "MENU OPEN" : "QUICK VIEW", 970, 112);
    ctx.font = "20px system-ui, Arial";
    ctx.fillText("White side button toggles menu", 970, 148);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(233,233,255,0.78)";
    ctx.font = "23px system-ui, Arial";
    ctx.fillText(`Seat: ${state.seated ? state.seatLabel : "Standing"}`, 430, 156);
    ctx.fillText(`Zone: ${state.inTableZone ? "Ready" : "Walk closer"}`, 430, 188);
    ctx.fillText(`Audio: ${state.audioEnabled ? state.trackTitle : "Paused"}`, 430, 220);

    ctx.textAlign = "right";
    ctx.fillStyle = state.seated ? "#7ff5c7" : state.inTableZone ? "#f6e27f" : "rgba(233,233,255,0.72)";
    ctx.font = "bold 28px system-ui, Arial";
    ctx.fillText(state.seated ? "AT TABLE" : (state.inTableZone ? "JOIN READY" : "LOBBY"), 970, 220);

    if (!menuOpen){
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(127,245,199,0.92)";
      ctx.font = "bold 38px system-ui, Arial";
      ctx.fillText("SVR WRIST WATCH", 512, 306);
      ctx.fillStyle = "rgba(233,233,255,0.80)";
      ctx.font = "24px system-ui, Arial";
      ctx.fillText("Time • Balance • Username • Rank", 512, 346);
      ctx.fillText("Pinch/touch the white side button to open controls", 512, 386);
    } else {
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(180,140,255,0.92)";
      ctx.font = "bold 20px system-ui, Arial";
      ctx.fillText("Quick scenes • pinch the button with your other hand", 36, 348);
      for (const btn of buildButtons(state)) drawButton(btn, hoveredId === btn.id);
    }

    ctx.restore();
    tex.needsUpdate = true;
  }

  function localHit(local){
    if (!menuOpen) return null;
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

  function sideButtonHit(local){
    return local.x > plateW * 0.47 && local.x < plateW * 0.72 && Math.abs(local.y) < plateH * 0.36 && local.z > -0.035 && local.z < 0.08;
  }

  function activate(id){
    if (!id) return;
    if (id === "whiteButton") { menuOpen = !menuOpen; draw(true); return; }
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
  }

  function update(dt, leftSource, rightSource){
    const anchor = leftSource?.joints?.wrist ? leftSource : rightSource?.joints?.wrist ? rightSource : null;
    if (!anchor?.joints?.wrist){
      group.visible = false;
      hoveredId = null;
      sideButtonHover = false;
      draw(true);
      return;
    }

    const watchOnLeft = anchor === leftSource;
    const pose = computeForearmPose(anchor, camera, renderer, watchOnLeft ? "left" : "right");
    if (!pose){
      group.visible = false;
      hoveredId = null;
      sideButtonHover = false;
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
    let nextSideHover = false;
    const candidates = watchOnLeft ? [rightSource, leftSource] : [leftSource, rightSource];
    for (const candidate of candidates){
      const tip = candidate?.joints?.["index-finger-tip"] || candidate?.joints?.["thumb-tip"];
      if (!tip) continue;
      const tipPos = new THREE.Vector3();
      tip.getWorldPosition(tipPos);
      const local = group.worldToLocal(tipPos.clone());
      if (sideButtonHit(local)){
        nextHovered = "whiteButton";
        activeInput = candidate;
        nextSideHover = true;
        bestDepth = 0;
        break;
      }
      if (local.z > -0.018 && local.z < 0.085 && Math.abs(local.x) < plateW * 0.74 && Math.abs(local.y) < plateH * 0.74){
        const hit = localHit(local);
        if (hit){
          const depth = Math.abs(local.z);
          if (depth < bestDepth){ bestDepth = depth; nextHovered = hit; activeInput = candidate; }
        }
      }
    }
    hoveredId = nextHovered;
    sideButtonHover = nextSideHover;
    sideButton.scale.setScalar(sideButtonHover ? 1.18 : 1.0);
    buttonHalo.material.opacity = sideButtonHover ? 0.34 : 0.16;

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

    const buttons = hoveredId === "whiteButton" ? [{ id: "whiteButton", hold: 0.12 }] : buildButtons(getState());
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
  return { update, object: group, isMenuOpen: ()=>menuOpen };
}
