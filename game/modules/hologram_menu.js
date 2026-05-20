import * as THREE from "three";
import { isPinching } from "./gestures.js";

const PHASE = "PHASE-165-HOLOGRAM-MENU-CODE-PATCH";

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

function getJointWorld(hand, name){
  const joint = hand?.joints?.[name];
  if (!joint) return null;
  joint.updateWorldMatrix?.(true, false);
  return joint.getWorldPosition(new THREE.Vector3());
}

function button(id, label, x, y, w, h, font = 34, disabled = false, reason = ""){
  return { id, label, x, y, w, h, font, disabled, reason, margin: 16, hold: 0.12 };
}

function pokerEnded(poker){ return poker?.street === "showdown" || !!poker?.winnerText || poker?.street === "idle"; }
function pokerLegal(poker, key){
  const legal = poker?.legal || {};
  const turn = !!poker?.awaitingPlayer;
  if (key === "next") return pokerEnded(poker);
  if (!turn) return false;
  if (key === "fold") return !!legal.canFold;
  if (key === "call") return !!(legal.canCheck || legal.canCall);
  if (key === "raise") return !!legal.canRaise;
  if (key === "allin") return !!legal.canAllIn;
  return true;
}
function disabledReason(poker, key){
  if (key === "next" && !pokerEnded(poker)) return "Finish hand first";
  if (!poker?.awaitingPlayer) return "Not your turn";
  if (key === "raise") return "Raise locked";
  return "Illegal now";
}

function buildButtons(state = {}){
  const poker = state.poker || {};
  const callLabel = poker.toCall > 0 ? `CALL ${poker.toCall}` : "CHECK";
  return [
    button("close", "CLOSE", 46, 72, 210, 78, 34),
    button("lobby", "LOBBY", 286, 72, 210, 78, 34),
    button("seat", "SEAT", 526, 72, 210, 78, 34),
    button("teleport", state.teleportEnabled ? "TP ON" : "TP OFF", 766, 72, 210, 78, 34),
    button("reiki", "REIKI", 46, 190, 210, 82, 34),
    button("pga", "PGA", 286, 190, 210, 82, 34),
    button("drive", "DRIVE", 526, 190, 210, 82, 34),
    button("chip", "CHIP", 766, 190, 210, 82, 34),
    button("store", "STORE", 46, 308, 210, 82, 34),
    button("lounge", "LOUNGE", 286, 308, 210, 82, 30),
    button("scorpion", "SCORPION", 526, 308, 210, 82, 25),
    button("next", "TRACK", 766, 308, 210, 82, 32),
    button("fold", "FOLD", 46, 458, 210, 92, 36, !pokerLegal(poker, "fold"), disabledReason(poker, "fold")),
    button("call", callLabel, 286, 458, 210, 92, poker.toCall > 999 ? 28 : 36, !pokerLegal(poker, "call"), disabledReason(poker, "call")),
    button("raise", "RAISE", 526, 458, 210, 92, 36, !pokerLegal(poker, "raise"), disabledReason(poker, "raise")),
    button("allin", "ALL-IN", 766, 458, 210, 92, 36, !pokerLegal(poker, "allin"), disabledReason(poker, "allin")),
    button("nextHand", "NEXT HAND", 286, 586, 450, 90, 38, !pokerLegal(poker, "next"), disabledReason(poker, "next"))
  ];
}

export function createHologramMenu({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const panelW = 1.18;
  const panelH = 0.86;

  const backing = new THREE.Mesh(
    new THREE.PlaneGeometry(panelW * 1.04, panelH * 1.04),
    new THREE.MeshBasicMaterial({ color: 0x18082d, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false, depthTest: false })
  );
  backing.position.z = -0.016;
  group.add(backing);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(panelW, panelH),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  panel.renderOrder = 80;
  group.add(panel);

  const glow = new THREE.PointLight(0xb48cff, 0.75, 2.7, 2.0);
  glow.position.set(0, 0.02, 0.18);
  group.add(glow);

  const state = { phase: PHASE, visible: false, reason: "init", hoveredButton: null, lastAction: "none", pinchReleaseState: "PINCH_RELEASED" };
  window.SVR_HOLOGRAM_MENU_STATE = state;

  let hoveredId = null;
  let pressed = false;
  let pressLockId = null;
  let pinchTime = 0;
  let lastHovered = null;
  let lastSig = "";

  function draw(force = false){
    const s = getState() || {};
    const poker = s.poker || {};
    const sig = JSON.stringify({ visible: state.visible, h: hoveredId, cash: s.cash, seated: s.seated, tp: s.teleportEnabled, pot: poker.pot, street: poker.street, turn: poker.awaitingPlayer, active: poker.activeName, legal: poker.legal, last: state.lastAction, sec: Math.floor(performance.now() / 500) });
    if (!force && sig === lastSig) return;
    lastSig = sig;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "rgba(7,10,22,0.92)");
    grad.addColorStop(0.55, "rgba(34,12,56,0.88)");
    grad.addColorStop(1, "rgba(5,8,16,0.94)");
    ctx.fillStyle = grad;
    rr(ctx, 16, 16, 992, 736, 34);
    ctx.fill();
    ctx.strokeStyle = "rgba(180,140,255,0.88)";
    ctx.lineWidth = 6;
    rr(ctx, 16, 16, 992, 736, 34);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 46px system-ui, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("SVR HOLOGRAM MENU", 46, 38);
    ctx.fillStyle = "rgba(233,233,255,0.82)";
    ctx.font = "24px system-ui, Arial";
    ctx.fillText(`Seat: ${s.seated ? s.seatLabel : "Standing"} • Pot $${poker.pot || 0} • ${poker.awaitingPlayer ? "YOUR TURN" : "Ready"}`, 46, 704);
    ctx.textAlign = "right";
    ctx.fillStyle = "#7ff5c7";
    ctx.font = "bold 30px system-ui, Arial";
    ctx.fillText(`$${Number(s.cash || 0).toLocaleString()}`, 976, 38);
    for (const btn of buildButtons(s)) drawButton(btn, hoveredId === btn.id);
    tex.needsUpdate = true;
  }

  function drawButton(btn, hovered){
    ctx.save();
    const disabled = !!btn.disabled;
    ctx.fillStyle = disabled ? "rgba(255,255,255,0.035)" : hovered ? "rgba(180,140,255,0.36)" : "rgba(255,255,255,0.09)";
    ctx.strokeStyle = disabled ? "rgba(255,255,255,0.18)" : hovered ? "rgba(246,226,127,0.92)" : "rgba(180,140,255,0.48)";
    ctx.lineWidth = hovered && !disabled ? 7 : 4;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = disabled ? "rgba(255,255,255,0.42)" : hovered ? "#ffffff" : "#e8e8ff";
    ctx.font = `bold ${btn.font || 32}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 2);
    if (disabled){
      ctx.fillStyle = "rgba(246,226,127,0.65)";
      ctx.font = "bold 15px system-ui, Arial";
      ctx.fillText(btn.reason || "LOCKED", btn.x + btn.w / 2, btn.y + btn.h - 14);
    }
    ctx.restore();
  }

  function show(reason = "manual"){
    state.visible = true;
    state.reason = reason;
    group.visible = true;
    pressed = false;
    pinchTime = 0;
    pressLockId = null;
    draw(true);
    placeInFront(true);
  }
  function hide(reason = "closed"){
    state.visible = false;
    state.reason = reason;
    state.hoveredButton = null;
    hoveredId = null;
    group.visible = false;
    pressed = false;
    pinchTime = 0;
    pressLockId = null;
    draw(true);
  }
  function toggle(reason = "toggle"){
    if (state.visible) hide(reason);
    else show(reason);
    return state.visible;
  }

  function placeInFront(force = false){
    if (!state.visible && !force) return;
    const activeCamera = getActiveCamera(camera, renderer);
    if (!activeCamera) return;
    const camPos = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    activeCamera.getWorldPosition(camPos);
    activeCamera.getWorldDirection(camDir);
    const targetPos = camPos.clone().add(camDir.multiplyScalar(1.15));
    targetPos.y = THREE.MathUtils.clamp(camPos.y - 0.05, 1.05, 1.82);
    group.position.lerp(targetPos, force ? 1 : 0.18);
    group.lookAt(camPos);
  }

  function localHit(local){
    const x = ((local.x / panelW) + 0.5) * canvas.width;
    const y = ((-local.y / panelH) + 0.5) * canvas.height;
    let best = null;
    let bestScore = Infinity;
    for (const btn of buildButtons(getState() || {})){
      const margin = btn.margin ?? 16;
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

  function activate(id){
    if (!id) return;
    const btn = buildButtons(getState() || {}).find(b => b.id === id);
    if (btn?.disabled){ state.lastAction = btn.reason || "locked"; draw(true); return; }
    state.lastAction = id;
    if (id === "close") { hide("close-button"); return; }
    if (id === "lobby") actions.goLobby?.();
    if (id === "seat") actions.goSeat?.();
    if (id === "reiki") actions.goReiki?.();
    if (id === "pga") actions.goPga?.();
    if (id === "drive") actions.goPgaDrive?.();
    if (id === "chip") actions.goChipPutt?.();
    if (id === "store") actions.goStoreRoom?.();
    if (id === "lounge") actions.goSmokerLounge?.();
    if (id === "scorpion") actions.goScorpion?.();
    if (id === "teleport") actions.toggleTeleport?.();
    if (id === "fold") actions.pokerFold?.();
    if (id === "call") actions.pokerCall?.();
    if (id === "raise") actions.pokerRaise?.();
    if (id === "allin") actions.pokerAllIn?.();
    if (id === "nextHand") actions.pokerNext?.();
    if (id === "next") actions.nextTrack?.();
    draw(true);
  }

  function update(dt, leftHand, rightHand){
    if (!state.visible){ window.SVR_HOLOGRAM_MENU_STATE = state; return; }
    placeInFront();
    const candidates = [rightHand, leftHand];
    let nextHovered = null;
    let activeInput = null;
    let bestDepth = Infinity;
    for (const candidate of candidates){
      const tipPos = getJointWorld(candidate, "index-finger-tip");
      if (!tipPos) continue;
      const local = group.worldToLocal(tipPos.clone());
      if (local.z > -0.08 && local.z < 0.13 && Math.abs(local.x) < panelW * 0.62 && Math.abs(local.y) < panelH * 0.62){
        const hit = localHit(local);
        if (hit){
          const depth = Math.abs(local.z);
          if (depth < bestDepth){ bestDepth = depth; nextHovered = hit; activeInput = candidate; }
        }
      }
    }
    hoveredId = nextHovered;
    state.hoveredButton = hoveredId;
    const pinching = !!activeInput && isPinching(activeInput);
    state.pinchReleaseState = pinching ? "PINCH_WAIT_RELEASE" : "PINCH_RELEASED";
    if (pinching && hoveredId && !pressLockId) pressLockId = hoveredId;
    if (pinching && pressLockId) hoveredId = pressLockId;
    if (!pinching) pressLockId = null;
    if (hoveredId !== lastHovered){ lastHovered = hoveredId; pinchTime = 0; if (!pinching) pressed = false; }
    if (hoveredId && pinching) pinchTime += dt;
    else if (!pinching) pinchTime = 0;
    const btn = buildButtons(getState() || {}).find(b => b.id === hoveredId) || null;
    if (btn && pinching && !pressed && pinchTime > (btn.hold ?? 0.12)){
      pressed = true;
      activate(hoveredId);
      pinchTime = 0;
    }
    if (!pinching) pressed = false;
    draw();
    window.SVR_HOLOGRAM_MENU_STATE = state;
  }

  draw(true);
  return { object: group, show, hide, toggle, update, getState: ()=>state };
}
