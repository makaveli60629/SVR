import * as THREE from "three";
import { isPinching } from "./gestures.js";

const PHASE = "PHASE-165-WATCH-HOLOGRAM-BUTTON";
const V0 = new THREE.Vector3();
const V1 = new THREE.Vector3();
const V2 = new THREE.Vector3();
const V3 = new THREE.Vector3();
const M0 = new THREE.Matrix4();
const SCREEN_TILT_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.34);

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
  quaternion.multiply(SCREEN_TILT_Q);

  const position = wrist.clone()
    .add(forearmDir.clone().multiplyScalar(0.092))
    .add(faceNormal.clone().multiplyScalar(0.020))
    .add(acrossPalm.clone().multiplyScalar(side === "left" ? -0.004 : 0.004));

  return { position, quaternion };
}

function button(id, label, x, y, w, h, font = 18, hold = 0.11, disabled = false, reason = ""){
  return { id, label, x, y, w, h, font, hold, margin: 12, disabled, reason };
}

function pokerEnded(poker){ return poker?.street === "showdown" || !!poker?.winnerText || poker?.street === "idle"; }
function pokerLegal(poker, key){
  const legal = poker?.legal || {};
  const turn = !!poker?.awaitingPlayer;
  if (key === "next") return pokerEnded(poker);
  if (!turn) return false;
  if (key === "fold") return !!legal.canFold;
  if (key === "call") return !!(legal.canCheck || legal.canCall);
  if (key === "raise" || key === "halfpot" || key === "pot") return !!legal.canRaise;
  if (key === "allin") return !!legal.canAllIn;
  return true;
}
function disabledReason(poker, key){
  if (key === "next" && !pokerEnded(poker)) return "Finish hand first";
  if (!poker?.awaitingPlayer) return "Not your turn";
  if (key === "halfpot" || key === "pot" || key === "raise") return "Raise locked";
  return "Illegal now";
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

  const screenFront = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.965),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  screenFront.renderOrder = 40;
  screenFront.position.z = 0.012;
  group.add(screenFront);

  let hoveredId = null;
  let pressed = false;
  let pinchTime = 0;
  let pressLockId = null;
  let lastHovered = null;
  let lastSig = "";
  let watchNotice = "";
  let watchNoticeUntil = 0;

  function buildButtons(state){
    const poker = state.poker || {};
    const callLabel = poker.toCall > 0 ? `CALL ${poker.toCall}` : "CHECK";
    const minLabel = poker?.legal?.minRaiseTo ? `MIN ${poker.legal.minRaiseTo}` : "MIN";
    return [
      button("holo", "HOLO", 24, 132, 110, 40, 20, 0.10),
      button("lobby", "LOBBY", 144, 132, 110, 40, 18),
      button("seatScene", "SEAT", 264, 132, 110, 40, 18),
      button("reikiScene", "REIKI", 24, 180, 110, 40, 18),
      button("pgaScene", "PGA", 144, 180, 110, 40, 18),
      button("scorpionScene", "SCORP", 264, 180, 110, 40, 16),
      button("pgaDriveScene", "DRIVE", 24, 228, 110, 40, 18),
      button("chipPuttScene", "CHIP", 144, 228, 110, 40, 18),
      button("storeRoomScene", "STORE", 264, 228, 110, 40, 18),
      button("smokerLoungeScene", "LOUNGE", 24, 276, 110, 40, 16),
      button("teleport", state.teleportEnabled ? "TP ON" : "TP OFF", 144, 276, 110, 40, 17),
      button("audio", state.audioEnabled ? "MUSIC" : "MUTE", 264, 276, 110, 40, 17),
      button("pokerFold", "FOLD", 424, 184, 120, 48, 21, 0.12, !pokerLegal(poker, "fold"), disabledReason(poker, "fold")),
      button("pokerCall", callLabel, 554, 184, 134, 48, poker.toCall > 999 ? 16 : 21, 0.12, !pokerLegal(poker, "call"), disabledReason(poker, "call")),
      button("pokerRaise", minLabel, 698, 184, 124, 48, poker?.legal?.minRaiseTo > 999 ? 15 : 20, 0.12, !pokerLegal(poker, "raise"), disabledReason(poker, "raise")),
      button("pokerRaiseHalfPot", "HALF POT", 832, 184, 130, 48, 16, 0.12, !pokerLegal(poker, "halfpot"), disabledReason(poker, "halfpot")),
      button("pokerRaisePot", "POT", 424, 244, 166, 48, 21, 0.12, !pokerLegal(poker, "pot"), disabledReason(poker, "pot")),
      button("pokerAllIn", "ALL-IN", 604, 244, 178, 48, 22, 0.14, !pokerLegal(poker, "allin"), disabledReason(poker, "allin")),
      button("pokerNext", "NEXT HAND", 796, 244, 166, 48, 20, 0.14, !pokerLegal(poker, "next"), disabledReason(poker, "next")),
      button("next", "TRACK", 604, 394, 178, 46, 20, 0.16),
      state.seated ? button("leave", "LEAVE TABLE", 796, 394, 166, 46, 18, 0.14) : button("join", state.inTableZone ? "QUICK SIT" : "WALK CLOSER", 796, 394, 166, 46, 17, 0.14, !state.inTableZone, "Walk closer")
    ];
  }

  function drawButton(btn, hovered){
    ctx.save();
    const disabled = !!btn.disabled;
    ctx.fillStyle = disabled ? "rgba(255,255,255,0.035)" : hovered ? "rgba(180,140,255,0.36)" : "rgba(255,255,255,0.08)";
    ctx.strokeStyle = disabled ? "rgba(255,255,255,0.18)" : hovered ? "rgba(246,226,127,0.98)" : "rgba(180,140,255,0.42)";
    ctx.lineWidth = hovered && !disabled ? 5 : 3;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = disabled ? "rgba(255,255,255,0.42)" : hovered ? "#ffffff" : "#e8e8ff";
    ctx.font = `bold ${btn.font || 20}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    ctx.restore();
  }

  function draw(force = false){
    const state = getState();
    const poker = state.poker || {};
    const sig = JSON.stringify({ h: hoveredId, notice: watchNotice, noticeLive: performance.now() < watchNoticeUntil, t: state.trackTitle, ae: state.audioEnabled, c: state.cash, s: state.seated, z: state.inTableZone, seat: state.seatLabel, pot: poker.pot, street: poker.street, active: poker.activeName, turn: poker.awaitingPlayer, legal: poker.legal, holo: state.hologramVisible, sec: new Date().getSeconds() });
    if (!force && sig === lastSig) return;
    lastSig = sig;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "rgba(5,8,16,0.92)");
    grad.addColorStop(1, "rgba(18,10,32,0.96)");
    ctx.fillStyle = grad;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.fill();
    ctx.strokeStyle = poker.awaitingPlayer ? "rgba(246,226,127,0.88)" : "rgba(180,140,255,0.64)";
    ctx.lineWidth = 6;
    rr(ctx, 12, 12, 1000, 488, 34);
    ctx.stroke();

    const now = new Date();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px system-ui, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), 34, 58);
    ctx.fillStyle = "rgba(233,233,255,0.95)";
    ctx.font = "bold 27px system-ui, Arial";
    ctx.fillText("SVR WRIST CONSOLE", 34, 104);
    ctx.fillStyle = state.hologramVisible ? "#f6e27f" : "rgba(233,233,255,0.72)";
    ctx.font = "18px system-ui, Arial";
    ctx.fillText(state.hologramVisible ? "Hologram menu open" : "Tap HOLO for large menu", 208, 104);

    ctx.textAlign = "right";
    ctx.fillStyle = "#7ff5c7";
    ctx.font = "bold 34px system-ui, Arial";
    ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 972, 58);

    ctx.textAlign = "left";
    ctx.fillStyle = poker.awaitingPlayer ? "#f6e27f" : "rgba(233,233,255,0.82)";
    ctx.font = "bold 24px system-ui, Arial";
    ctx.fillText(`Poker: ${String(poker.street || "ready").toUpperCase()} • Pot $${poker.pot || 0} • Active: ${poker.activeName || "--"}`, 424, 104);
    ctx.fillStyle = "rgba(233,233,255,0.78)";
    ctx.font = "21px system-ui, Arial";
    ctx.fillText(`Board: ${(poker.board || []).join(" ") || "--"}   Hand: ${(poker.playerCards || []).join(" ") || "--"}`, 424, 138);
    const noticeLive = performance.now() < watchNoticeUntil;
    ctx.fillStyle = noticeLive ? "#f6e27f" : "rgba(233,233,255,0.78)";
    ctx.fillText(noticeLive ? watchNotice : poker.awaitingPlayer ? "YOUR TURN: watch or HOLO menu ready" : (poker.lastAction || "Bots acting..."), 424, 166);

    ctx.fillStyle = "rgba(180,140,255,0.92)";
    ctx.font = "bold 19px system-ui, Arial";
    ctx.fillText("Scenes + HOLO", 34, 122);
    ctx.fillText("Poker Actions", 424, 122);

    ctx.fillStyle = "rgba(233,233,255,0.72)";
    ctx.font = "19px system-ui, Arial";
    ctx.fillText(`Seat: ${state.seated ? state.seatLabel : "Standing"} • Zone: ${state.inTableZone ? "Ready" : "Walk closer"}`, 34, 342);
    ctx.fillText("HOLO opens the large floating menu", 34, 372);
    ctx.fillText(`Track: ${state.audioEnabled ? state.trackTitle : "Paused"}`, 34, 430);

    for (const btn of buildButtons(state)) drawButton(btn, hoveredId === btn.id);
    tex.needsUpdate = true;
  }

  function localHit(local){
    const state = getState();
    const x = ((local.x / plateW) + 0.5) * canvas.width;
    const y = ((-local.y / plateH) + 0.5) * canvas.height;
    let best = null;
    let bestScore = Infinity;
    for (const btn of buildButtons(state)){
      const margin = btn.margin ?? 12;
      if (x < btn.x - margin || x > btn.x + btn.w + margin || y < btn.y - margin || y > btn.y + btn.h + margin) continue;
      const cx = btn.x + btn.w / 2;
      const cy = btn.y + btn.h / 2;
      const nx = (x - cx) / Math.max(btn.w / 2, 1);
      const ny = (y - cy) / Math.max(btn.h / 2, 1);
      const score = nx * nx + ny * ny;
      if (score < bestScore){ best = btn.id; bestScore = score; }
    }
    return best;
  }

  function showDisabled(btn){
    watchNotice = btn?.reason || "Action locked";
    watchNoticeUntil = performance.now() + 1600;
    try { window.SVR_PHASE95_POKER_FEEDBACK_FX?.showToast?.({ title: "Watch Action Locked", body: watchNotice, sub: "SVR wrist console", kind: "warn", ms: 1600 }); } catch {}
    draw(true);
  }

  function activate(id){
    if (!id) return;
    const btn = buildButtons(getState()).find(b => b.id === id);
    if (btn?.disabled){ showDisabled(btn); return; }
    if (id === "holo") actions.toggleHologram?.();
    if (id === "audio") actions.toggleAudio?.();
    if (id === "next") actions.nextTrack?.();
    if (id === "join") actions.joinTable?.();
    if (id === "leave") actions.leaveTable?.();
    if (id === "teleport") actions.toggleTeleport?.();
    if (id === "pokerFold") actions.pokerFold?.();
    if (id === "pokerCall") actions.pokerCall?.();
    if (id === "pokerRaise") actions.pokerRaise?.();
    if (id === "pokerRaiseHalfPot") actions.pokerRaiseHalfPot?.() || window.SVR_PLAYABLE_POKER?.raiseHalfPot?.();
    if (id === "pokerRaisePot") actions.pokerRaisePot?.() || window.SVR_PLAYABLE_POKER?.raisePot?.();
    if (id === "pokerAllIn") actions.pokerAllIn?.();
    if (id === "pokerNext") actions.pokerNext?.();
    if (id === "lobby") actions.goLobby?.();
    if (id === "seatScene") actions.goSeat?.();
    if (id === "reikiScene") actions.goReiki?.();
    if (id === "pgaScene") actions.goPga?.();
    if (id === "legendScene") actions.goLegend?.();
    if (id === "sponsorScene") actions.goSponsor?.();
    if (id === "scorpionScene") actions.goScorpion?.();
    if (id === "pgaDriveScene") actions.goPgaDrive?.();
    if (id === "chipPuttScene") actions.goChipPutt?.();
    if (id === "storeRoomScene") actions.goStoreRoom?.();
    if (id === "smokerLoungeScene") actions.goSmokerLounge?.();
    draw(true);
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
      if (local.z > -0.020 && local.z < 0.090 && Math.abs(local.x) < plateW * 0.78 && Math.abs(local.y) < plateH * 0.78){
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
    if (hoveredId !== lastHovered){
      lastHovered = hoveredId;
      pinchTime = 0;
      if (!pinching) pressed = false;
      if (!hoveredId) pressLockId = null;
    }

    const buttons = buildButtons(getState());
    const activeBtn = buttons.find(btn => btn.id === hoveredId) || null;
    if (hoveredId && pinching) pinchTime += dt;
    else if (!pinching) pinchTime = 0;

    const directHold = activeBtn?.hold ?? 0.11;
    if (hoveredId && !pressed && pinching && pinchTime > directHold){
      pressed = true;
      activate(hoveredId);
      pinchTime = 0;
    }
    if (!pinching) pressed = false;

    draw();
  }

  draw(true);
  window.SVR_PHASE165_WATCH_HOLOGRAM_BUTTON = { phase: PHASE };
  window.SVR_PHASE123_WATCH_RAISE_CONTROLS = window.SVR_PHASE165_WATCH_HOLOGRAM_BUTTON;
  window.SVR_PHASE108_WATCH_POKER_DISABLED_STATES = window.SVR_PHASE165_WATCH_HOLOGRAM_BUTTON;
  return { update, object: group };
}
