import * as THREE from "three";
import { isPinching } from "./gestures.js";

const PHASE = "PHASE-177-3D-MODULAR-HOLOGRAM-CARDS";

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

function rr(c, x, y, w, h, r){
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function makeCardTexture(card, opts = {}){
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 6;

  function draw({ hovered = false, disabled = false, state = {} } = {}){
    const activeTp = window.SVR_ACTIVE_TELEPORT_HAND || {};
    const label = typeof card.label === "function" ? card.label(state, activeTp) : card.label;
    const sub = typeof card.sub === "function" ? card.sub(state, activeTp) : card.sub;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, disabled ? "rgba(28,28,34,0.92)" : hovered ? "rgba(92,20,155,0.98)" : "rgba(18,12,45,0.95)");
    grad.addColorStop(1, disabled ? "rgba(42,42,48,0.88)" : hovered ? "rgba(208,92,255,0.92)" : "rgba(55,20,96,0.90)");
    ctx.fillStyle = grad;
    rr(ctx, 14, 14, 484, 228, 32);
    ctx.fill();
    ctx.strokeStyle = disabled ? "rgba(255,255,255,0.20)" : hovered ? "rgba(246,226,127,0.98)" : "rgba(180,140,255,0.72)";
    ctx.lineWidth = hovered && !disabled ? 10 : 6;
    rr(ctx, 14, 14, 484, 228, 32);
    ctx.stroke();

    ctx.fillStyle = disabled ? "rgba(255,255,255,0.42)" : "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${label?.length > 10 ? 44 : 54}px system-ui, Arial`;
    ctx.fillText(label || card.id, 256, 92);
    ctx.fillStyle = disabled ? "rgba(255,255,255,0.32)" : hovered ? "#f6e27f" : "#7ff5c7";
    ctx.font = "bold 28px system-ui, Arial";
    ctx.fillText(sub || card.section || "SVR", 256, 150);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "20px system-ui, Arial";
    ctx.fillText(disabled ? (card.reason || "Locked") : "pinch / controller select", 256, 198);
    tex.needsUpdate = true;
  }

  draw(opts);
  return { canvas, texture: tex, draw };
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

function buildCards(state = {}){
  const poker = state.poker || {};
  const callLabel = poker.toCall > 0 ? `CALL ${poker.toCall}` : "CHECK";
  return [
    { id:"close", section:"System", label:"CLOSE", sub:"Return to game", x:0, y:1, action:"close" },
    { id:"lobby", section:"Navigation", label:"LOBBY", sub:"Main room", x:-1.1, y:0.35, action:"goLobby" },
    { id:"seat", section:"Navigation", label:"SEAT", sub:"Player spot", x:0, y:0.35, action:"goSeat" },
    { id:"scorpion", section:"Private", label:"SCORPION", sub:"Poker room", x:1.1, y:0.35, action:"goScorpion" },
    { id:"reiki", section:"Private", label:"REIKI", sub:"Meditation", x:-1.1, y:-0.32, action:"goReiki" },
    { id:"pga", section:"Private", label:"PGA", sub:"Golf hub", x:0, y:-0.32, action:"goPga" },
    { id:"drive", section:"Private", label:"DRIVE", sub:"Range", x:1.1, y:-0.32, action:"goPgaDrive" },
    { id:"chip", section:"Private", label:"CHIP", sub:"Putt area", x:-1.1, y:-0.99, action:"goChipPutt" },
    { id:"store", section:"Private", label:"STORE", sub:"SVR portal", x:0, y:-0.99, action:"goStoreRoom" },
    { id:"lounge", section:"Private", label:"LOUNGE", sub:"Social", x:1.1, y:-0.99, action:"goSmokerLounge" },
    { id:"teleport", section:"Teleport", label:(s,tp)=> tp?.glow === "purple" ? "TP ON" : "TP OFF", sub:"Fist toggle", x:-1.1, y:-1.66, action:"toggleTeleport" },
    { id:"audio", section:"Audio", label:"AUDIO", sub:state.audioEnabled ? "Playing" : "Paused", x:0, y:-1.66, action:"toggleAudio" },
    { id:"next", section:"Audio", label:"NEXT", sub:"Track", x:1.1, y:-1.66, action:"nextTrack" },
    { id:"fold", section:"Poker", label:"FOLD", sub:"Hand action", x:-1.1, y:-2.33, action:"pokerFold", disabled:!pokerLegal(poker,"fold"), reason:disabledReason(poker,"fold") },
    { id:"call", section:"Poker", label:callLabel, sub:"Hand action", x:0, y:-2.33, action:"pokerCall", disabled:!pokerLegal(poker,"call"), reason:disabledReason(poker,"call") },
    { id:"raise", section:"Poker", label:"RAISE", sub:"Increase bet", x:1.1, y:-2.33, action:"pokerRaise", disabled:!pokerLegal(poker,"raise"), reason:disabledReason(poker,"raise") },
    { id:"allin", section:"Poker", label:"ALL-IN", sub:"Max bet", x:-0.55, y:-3.0, action:"pokerAllIn", disabled:!pokerLegal(poker,"allin"), reason:disabledReason(poker,"allin") },
    { id:"nextHand", section:"Poker", label:"NEXT HAND", sub:"New deal", x:0.55, y:-3.0, action:"pokerNext", disabled:!pokerLegal(poker,"nextHand"), reason:disabledReason(poker,"nextHand") }
  ];
}

export function createHologramMenu({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const cardW = 0.58;
  const cardH = 0.30;
  const cardMeshes = [];

  const header = makeCardTexture({ id:"header", label:"SVR HOLOGRAM", sub:"Large 3D modular menu", section:"Header" });
  const headerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.95, 0.30),
    new THREE.MeshBasicMaterial({ map: header.texture, transparent:true, side:THREE.DoubleSide, depthWrite:false, depthTest:false, toneMapped:false })
  );
  headerMesh.position.set(0, 1.46, 0.02);
  headerMesh.renderOrder = 86;
  group.add(headerMesh);

  const cardDefinitions = buildCards({});
  for (const card of cardDefinitions){
    const textureLayer = makeCardTexture(card);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(cardW, cardH),
      new THREE.MeshBasicMaterial({ map:textureLayer.texture, transparent:true, side:THREE.DoubleSide, depthWrite:false, depthTest:false, toneMapped:false })
    );
    mesh.position.set(card.x * 0.64, card.y * 0.38, 0);
    mesh.userData.card = card;
    mesh.userData.textureLayer = textureLayer;
    mesh.renderOrder = 88;
    group.add(mesh);
    cardMeshes.push(mesh);
  }

  const glow = new THREE.PointLight(0xd05cff, 1.6, 3.5, 2.0);
  glow.position.set(0, -0.30, 0.35);
  group.add(glow);

  const state = { phase: PHASE, visible:false, reason:"init", hoveredButton:null, lastAction:"none", moduleMode:"3d-cards", pinchReleaseState:"PINCH_RELEASED" };
  window.SVR_HOLOGRAM_MENU_STATE = state;

  const raycaster = new THREE.Raycaster();
  const tmpRayOrigin = new THREE.Vector3();
  const tmpRayDir = new THREE.Vector3();
  let hoveredMesh = null;
  let pressed = false;
  let pinchTime = 0;
  let pressLockId = null;
  let lastDrawSig = "";

  function show(reason = "manual"){
    state.visible = true;
    state.reason = reason;
    group.visible = true;
    hoveredMesh = null;
    pressed = false;
    pinchTime = 0;
    pressLockId = null;
    placeInFront(true);
    redrawCards(true);
  }

  function hide(reason = "closed"){
    state.visible = false;
    state.reason = reason;
    state.hoveredButton = null;
    hoveredMesh = null;
    group.visible = false;
    pressed = false;
    pinchTime = 0;
    pressLockId = null;
    redrawCards(true);
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
    const targetPos = camPos.clone().add(camDir.multiplyScalar(1.28));
    targetPos.y = THREE.MathUtils.clamp(camPos.y + 0.10, 1.15, 1.92);
    group.position.lerp(targetPos, force ? 1 : 0.14);
    group.lookAt(camPos);
  }

  function redrawCards(force = false){
    const s = getState() || {};
    const poker = s.poker || {};
    const tp = window.SVR_ACTIVE_TELEPORT_HAND || {};
    const sig = JSON.stringify({ h: state.hoveredButton, cash:s.cash, seated:s.seated, tp:tp.state, tpa:tp.active, pot:poker.pot, turn:poker.awaitingPlayer, legal:poker.legal, action:state.lastAction, sec:Math.floor(performance.now()/700) });
    if (!force && sig === lastDrawSig) return;
    lastDrawSig = sig;
    const updated = buildCards(s);
    for (const mesh of cardMeshes){
      const next = updated.find(c=>c.id === mesh.userData.card.id) || mesh.userData.card;
      mesh.userData.card = next;
      const hovered = state.hoveredButton === next.id;
      mesh.userData.textureLayer?.draw?.({ hovered, disabled:!!next.disabled, state:s });
      mesh.scale.setScalar(hovered && !next.disabled ? 1.085 : 1);
      mesh.position.z = hovered ? 0.035 : 0;
    }
  }

  function activateCard(card){
    if (!card) return;
    if (card.disabled){
      state.lastAction = card.reason || "locked";
      redrawCards(true);
      return;
    }
    state.lastAction = card.id;
    if (card.action === "close") { hide("close-card"); return; }
    actions[card.action]?.();
    redrawCards(true);
  }

  function getPointHover(leftHand, rightHand){
    const candidates = [rightHand, leftHand];
    for (const candidate of candidates){
      const tipPos = getJointWorld(candidate, "index-finger-tip");
      if (!tipPos) continue;
      tmpRayOrigin.copy(tipPos);
      tmpRayDir.copy(group.position).sub(tipPos).normalize();
      raycaster.set(tmpRayOrigin, tmpRayDir);
      raycaster.near = 0.02;
      raycaster.far = 1.8;
      const hits = raycaster.intersectObjects(cardMeshes, false);
      if (hits.length) return { mesh:hits[0].object, input:candidate };
    }
    return { mesh:null, input:null };
  }

  function update(dt, leftHand, rightHand){
    if (!state.visible){
      window.SVR_HOLOGRAM_MENU_STATE = state;
      return;
    }
    placeInFront();
    const hover = getPointHover(leftHand, rightHand);
    hoveredMesh = hover.mesh;
    const card = hoveredMesh?.userData?.card || null;
    state.hoveredButton = card?.id || null;

    const pinching = !!hover.input && isPinching(hover.input);
    state.pinchReleaseState = pinching ? "PINCH_WAIT_RELEASE" : "PINCH_RELEASED";

    if (pinching && card?.id && !pressLockId) pressLockId = card.id;
    if (!pinching) pressLockId = null;

    if (pinching && card) pinchTime += dt;
    else if (!pinching) pinchTime = 0;

    if (card && pinching && !pressed && pinchTime > 0.11){
      pressed = true;
      activateCard(card);
      pinchTime = 0;
    }
    if (!pinching) pressed = false;

    redrawCards();
    window.SVR_HOLOGRAM_MENU_STATE = state;
  }

  redrawCards(true);
  window.SVR_PHASE177_HOLOGRAM_3D_MENU = state;
  return { object:group, show, hide, toggle, update, getState:()=>state };
}
