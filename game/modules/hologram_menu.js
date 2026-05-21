import * as THREE from "three";
import { isPinching } from "./gestures.js";

const PHASE = "PHASE-88-VR-WORLDSPACE-HEADSET-FOLLOW-HOLOGRAM";
const V_HEAD = new THREE.Vector3();
const V_DIR = new THREE.Vector3();
const V_TARGET = new THREE.Vector3();

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

function pokerEnded(poker){ return poker?.street === "showdown" || !!poker?.winnerText || poker?.street === "idle"; }
function pokerLegal(poker, key){
  const legal = poker?.legal || {};
  const turn = !!poker?.awaitingPlayer;
  if (key === "nextHand") return pokerEnded(poker);
  if (!turn) return false;
  if (key === "fold") return !!legal.canFold;
  if (key === "call") return !!(legal.canCheck || legal.canCall);
  if (key === "raise") return !!legal.canRaise;
  if (key === "allin") return !!legal.canAllIn;
  return true;
}
function disabledReason(poker, key){
  if (key === "nextHand" && !pokerEnded(poker)) return "Finish hand first";
  if (!poker?.awaitingPlayer) return "Not your turn";
  if (key === "raise") return "Raise locked";
  return "Illegal now";
}
function zone(id, label, x, y, w, h, action, section = "", disabled = false, reason = ""){
  return { id, label, x, y, w, h, action, section, disabled, reason, margin: 32, hold: 0.07 };
}
function buildZones(state = {}){
  const poker = state.poker || {};
  const callLabel = poker.toCall > 0 ? `CALL ${poker.toCall}` : "CHECK";
  const tp = window.SVR_ACTIVE_TELEPORT_HAND || {};
  return [
    zone("close", "CLOSE", 44, 76, 188, 76, "close", "System"),
    zone("lobby", "LOBBY", 260, 76, 188, 76, "goLobby", "Nav"),
    zone("seat", "SEAT", 476, 76, 188, 76, "goSeat", "Nav"),
    zone("scorpion", "SCORPION", 692, 76, 252, 76, "goScorpion", "Private"),
    zone("reiki", "REIKI", 44, 184, 188, 78, "goReiki", "Private"),
    zone("pga", "PGA", 260, 184, 188, 78, "goPga", "Private"),
    zone("drive", "DRIVE", 476, 184, 188, 78, "goPgaDrive", "Private"),
    zone("chip", "CHIP", 692, 184, 252, 78, "goChipPutt", "Private"),
    zone("store", "STORE", 44, 292, 188, 78, "goStoreRoom", "Private"),
    zone("lounge", "LOUNGE", 260, 292, 188, 78, "goSmokerLounge", "Private"),
    zone("teleport", tp.glow === "purple" ? "TP ON" : "TP OFF", 476, 292, 188, 78, "toggleTeleport", "Teleport"),
    zone("audio", state.audioEnabled ? "MUSIC" : "MUTE", 692, 292, 252, 78, "toggleAudio", "Audio"),
    zone("fold", "FOLD", 44, 432, 188, 88, "pokerFold", "Poker", !pokerLegal(poker,"fold"), disabledReason(poker,"fold")),
    zone("call", callLabel, 260, 432, 188, 88, "pokerCall", "Poker", !pokerLegal(poker,"call"), disabledReason(poker,"call")),
    zone("raise", "RAISE", 476, 432, 188, 88, "pokerRaise", "Poker", !pokerLegal(poker,"raise"), disabledReason(poker,"raise")),
    zone("allin", "ALL-IN", 692, 432, 252, 88, "pokerAllIn", "Poker", !pokerLegal(poker,"allin"), disabledReason(poker,"allin")),
    zone("next", "NEXT TRACK", 44, 564, 260, 84, "nextTrack", "Audio"),
    zone("nextHand", "NEXT HAND", 334, 564, 280, 84, "pokerNext", "Poker", !pokerLegal(poker,"nextHand"), disabledReason(poker,"nextHand")),
    zone("help", "HELP", 644, 564, 300, 84, "help", "Controls")
  ];
}

export function createHologramMenu({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 704;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const group = new THREE.Group();
  group.visible = false;
  group.frustumCulled = false;
  scene.add(group);

  const panelW = 1.82;
  const panelH = 1.26;

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(panelW * 1.10, panelH * 1.10),
    new THREE.MeshBasicMaterial({ color: 0x120020, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  back.position.z = -0.026;
  back.renderOrder = 9990;
  back.frustumCulled = false;
  group.add(back);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(panelW, panelH),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  panel.renderOrder = 9991;
  panel.frustumCulled = false;
  group.add(panel);

  const glow = new THREE.PointLight(0xd05cff, 3.2, 5.0, 2.0);
  glow.position.set(0, 0, 0.45);
  group.add(glow);

  const state = { phase: PHASE, visible: false, reason: "init", hoveredButton: null, lastAction: "none", moduleMode: "world-space-headset-follow", pinchReleaseState: "PINCH_RELEASED", attachedToCamera: false, worldSpaceFollow: true };
  window.SVR_HOLOGRAM_MENU_STATE = state;

  let hoveredId = null;
  let pressed = false;
  let pinchTime = 0;
  let pressLockId = null;
  let lastHovered = null;
  let lastSig = "";

  function drawButton(z, hovered){
    const disabled = !!z.disabled;
    ctx.save();
    const grad = ctx.createLinearGradient(z.x, z.y, z.x + z.w, z.y + z.h);
    grad.addColorStop(0, disabled ? "rgba(50,50,56,0.78)" : hovered ? "rgba(208,92,255,0.96)" : "rgba(42,18,88,0.86)");
    grad.addColorStop(1, disabled ? "rgba(30,30,36,0.78)" : hovered ? "rgba(246,226,127,0.70)" : "rgba(92,32,152,0.76)");
    ctx.fillStyle = grad;
    ctx.strokeStyle = disabled ? "rgba(255,255,255,0.18)" : hovered ? "rgba(255,255,255,0.98)" : "rgba(180,140,255,0.74)";
    ctx.lineWidth = hovered && !disabled ? 8 : 4;
    ctx.shadowColor = hovered ? "rgba(208,92,255,0.9)" : "transparent";
    ctx.shadowBlur = hovered ? 18 : 0;
    rr(ctx, z.x, z.y, z.w, z.h, 18);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = disabled ? "rgba(255,255,255,0.42)" : "#ffffff";
    ctx.font = `bold ${z.label.length > 9 ? 25 : 32}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(z.label, z.x + z.w / 2, z.y + z.h / 2 - 7);
    ctx.fillStyle = disabled ? "rgba(255,255,255,0.32)" : hovered ? "#f6e27f" : "#7ff5c7";
    ctx.font = "bold 15px system-ui, Arial";
    ctx.fillText(disabled ? (z.reason || "LOCKED") : z.section, z.x + z.w / 2, z.y + z.h - 17);
    ctx.restore();
  }

  function draw(force = false){
    const s = getState() || {};
    const poker = s.poker || {};
    const tp = window.SVR_ACTIVE_TELEPORT_HAND || {};
    const sig = JSON.stringify({ visible: state.visible, h: hoveredId, cash: s.cash, seated: s.seated, tp: tp.state, tpa: tp.active, pot: poker.pot, turn: poker.awaitingPlayer, legal: poker.legal, last: state.lastAction, xr: renderer?.xr?.isPresenting, sec: Math.floor(performance.now() / 500) });
    if (!force && sig === lastSig) return;
    lastSig = sig;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "rgba(5,8,16,0.98)");
    bg.addColorStop(0.52, "rgba(38,11,68,0.98)");
    bg.addColorStop(1, "rgba(5,8,16,0.98)");
    ctx.fillStyle = bg;
    rr(ctx, 12, 12, 1000, 680, 34);
    ctx.fill();
    ctx.strokeStyle = tp.glow === "purple" ? "rgba(208,92,255,0.98)" : "rgba(180,140,255,0.86)";
    ctx.lineWidth = 8;
    rr(ctx, 12, 12, 1000, 680, 34);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px system-ui, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("SVR VR HOLOGRAM", 44, 38);
    ctx.fillStyle = "rgba(233,233,255,0.78)";
    ctx.font = "22px system-ui, Arial";
    ctx.fillText("World-space headset-follow panel • touch card + pinch", 430, 38);
    ctx.textAlign = "right";
    ctx.fillStyle = "#7ff5c7";
    ctx.font = "bold 30px system-ui, Arial";
    ctx.fillText(`$${Number(s.cash || 0).toLocaleString()}`, 968, 38);
    for (const z of buildZones(s)) drawButton(z, hoveredId === z.id);
    tex.needsUpdate = true;
  }

  function placeInFront(force = false){
    if (!state.visible && !force) return;
    if (group.parent !== scene){
      group.parent?.remove(group);
      scene.add(group);
    }
    state.attachedToCamera = false;
    const activeCamera = getActiveCamera(camera, renderer);
    if (!activeCamera) return;
    activeCamera.updateWorldMatrix?.(true, false);
    activeCamera.getWorldPosition(V_HEAD);
    activeCamera.getWorldDirection(V_DIR);
    if (!Number.isFinite(V_DIR.x) || V_DIR.lengthSq() < 0.0001) V_DIR.set(0, 0, -1);
    V_DIR.normalize();
    V_TARGET.copy(V_HEAD).addScaledVector(V_DIR, renderer?.xr?.isPresenting ? 0.96 : 1.06);
    V_TARGET.y = renderer?.xr?.isPresenting ? V_HEAD.y - 0.04 : THREE.MathUtils.clamp(V_HEAD.y + 0.03, 1.08, 1.78);
    group.position.copy(V_TARGET);
    group.lookAt(V_HEAD);
    group.visible = true;
    group.scale.setScalar(renderer?.xr?.isPresenting ? 1.06 : 1.0);
  }

  function show(reason = "manual"){
    state.visible = true;
    state.reason = reason;
    group.visible = true;
    hoveredId = null;
    pressed = false;
    pinchTime = 0;
    pressLockId = null;
    placeInFront(true);
    draw(true);
    window.SVR_HOLOGRAM_MENU_STATE = state;
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
    window.SVR_HOLOGRAM_MENU_STATE = state;
  }

  function toggle(reason = "toggle"){
    if (state.visible) hide(reason);
    else show(reason);
    return state.visible;
  }

  function localHit(local){
    const x = ((local.x / panelW) + 0.5) * canvas.width;
    const y = ((-local.y / panelH) + 0.5) * canvas.height;
    let best = null;
    let bestScore = Infinity;
    for (const z of buildZones(getState() || {})){
      const m = z.margin || 20;
      if (x < z.x - m || x > z.x + z.w + m || y < z.y - m || y > z.y + z.h + m) continue;
      const cx = z.x + z.w / 2;
      const cy = z.y + z.h / 2;
      const score = Math.pow((x - cx) / z.w, 2) + Math.pow((y - cy) / z.h, 2);
      if (score < bestScore){ best = z; bestScore = score; }
    }
    return best;
  }

  function activate(z){
    if (!z) return;
    if (z.disabled){
      state.lastAction = z.reason || "locked";
      draw(true);
      return;
    }
    state.lastAction = z.id;
    if (z.action === "close") { hide("close-card"); return; }
    if (z.action === "help") { state.lastAction = "Look at fist + clench toggles TP. Controller: hold trigger/grip/A, release to teleport."; draw(true); return; }
    actions[z.action]?.();
    draw(true);
  }

  function update(dt, leftHand, rightHand){
    if (!state.visible){
      window.SVR_HOLOGRAM_MENU_STATE = state;
      return;
    }
    placeInFront();
    let nextHover = null;
    let activeInput = null;
    let bestDepth = Infinity;
    for (const candidate of [rightHand, leftHand]){
      const tipPos = getJointWorld(candidate, "index-finger-tip");
      if (!tipPos) continue;
      const local = group.worldToLocal(tipPos.clone());
      if (local.z < -0.38 || local.z > 0.46 || Math.abs(local.x) > panelW * 0.76 || Math.abs(local.y) > panelH * 0.78) continue;
      const hit = localHit(local);
      if (!hit) continue;
      const depth = Math.abs(local.z);
      if (depth < bestDepth){ bestDepth = depth; nextHover = hit; activeInput = candidate; }
    }
    hoveredId = nextHover?.id || null;
    state.hoveredButton = hoveredId;
    const pinching = !!activeInput && isPinching(activeInput);
    state.pinchReleaseState = pinching ? "PINCH_WAIT_RELEASE" : "PINCH_RELEASED";
    if (pinching && hoveredId && !pressLockId) pressLockId = hoveredId;
    if (pinching && pressLockId && nextHover?.id !== pressLockId) nextHover = buildZones(getState() || {}).find(z=>z.id === pressLockId) || nextHover;
    if (!pinching) pressLockId = null;
    if (nextHover && pinching) pinchTime += dt;
    else if (!pinching) pinchTime = 0;
    if (nextHover && pinching && !pressed && pinchTime > (nextHover.hold || 0.08)){
      pressed = true;
      activate(nextHover);
      pinchTime = 0;
    }
    if (!pinching) pressed = false;
    if (hoveredId !== lastHovered){ lastHovered = hoveredId; draw(true); }
    else draw();
    window.SVR_HOLOGRAM_MENU_STATE = state;
  }

  draw(true);
  window.SVR_PHASE88_VR_WORLDSPACE_HEADSET_HOLOGRAM = state;
  window.SVR_PHASE87_XR_HEADSET_HOLOGRAM_HUD = state;
  window.SVR_PHASE179_HOLOGRAM_VISIBLE_PANEL = state;
  return { object: group, show, hide, toggle, update, getState: ()=>state };
}
