import * as THREE from "three";

// PHASE-101-VISUAL-CARD-MESH-SYNC-LOCK
// Game-side only. Adds lightweight visible card meshes synchronized from the
// playable poker state. Logic source of truth remains playable_poker.js.

const PHASE = "PHASE-101-VISUAL-CARD-MESH-SYNC-LOCK";
const CARD_W = 0.245;
const CARD_H = 0.345;
const UPDATE_MS = 140;

function makeCardTexture(label = "--", opts = {}){
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext("2d", { alpha: true });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const draw = (value, selected = false) => {
    const text = String(value || "--");
    const isBack = text === "??" || text === "BACK";
    const red = /[♥♦]/.test(text);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isBack ? "#10152a" : "#f8f7ff";
    roundRect(ctx, 10, 10, 236, 364, 22);
    ctx.fill();
    ctx.strokeStyle = selected ? "#7ff5c7" : isBack ? "#b48cff" : "#15192c";
    ctx.lineWidth = selected ? 10 : 6;
    roundRect(ctx, 10, 10, 236, 364, 22);
    ctx.stroke();

    if (isBack){
      ctx.fillStyle = "rgba(180,140,255,0.22)";
      for (let y = 58; y < 330; y += 34){
        for (let x = 38; x < 220; x += 34){
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = "#7ff5c7";
      ctx.font = "bold 42px system-ui, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SVR", 128, 192);
    } else {
      const rank = text.slice(0, -1) || text;
      const suit = text.slice(-1);
      ctx.fillStyle = red ? "#b01832" : "#111827";
      ctx.font = "bold 58px system-ui, Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(rank, 26, 24);
      ctx.font = "bold 54px system-ui, Arial";
      ctx.fillText(suit, 28, 82);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 108px system-ui, Arial";
      ctx.fillText(suit, 128, 210);
      ctx.save();
      ctx.translate(230, 360);
      ctx.rotate(Math.PI);
      ctx.font = "bold 44px system-ui, Arial";
      ctx.textAlign = "left";
      ctx.fillText(rank, 0, 0);
      ctx.restore();
    }
    ctx.fillStyle = opts.tag ? "rgba(5,8,16,0.82)" : "transparent";
    if (opts.tag){
      ctx.fillRect(0, 336, 256, 42);
      ctx.fillStyle = "#7ff5c7";
      ctx.font = "bold 20px system-ui, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(opts.tag, 128, 358);
    }
    texture.needsUpdate = true;
  };
  draw(label);
  return { canvas, ctx, texture, draw, last: "" };
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function makeCardMesh(label, tag){
  const tex = makeCardTexture(label, { tag });
  const mat = new THREE.MeshBasicMaterial({ map: tex.texture, transparent: true, toneMapped: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W, CARD_H), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 52;
  mesh.userData.cardTex = tex;
  return mesh;
}

function updateCard(mesh, label, selected = false){
  const next = `${label}|${selected}`;
  const tex = mesh.userData.cardTex;
  if (!tex || tex.last === next) return;
  tex.last = next;
  tex.draw(label, selected);
  mesh.visible = !!label && label !== "--";
}

function createCardSync(scene){
  const root = new THREE.Group();
  root.name = "SVR_Phase101_VisualCardMeshSync";
  scene.add(root);

  const boardCards = Array.from({ length: 5 }, (_, i) => {
    const mesh = makeCardMesh("--", i === 0 ? "BOARD" : "");
    mesh.position.set((i - 2) * (CARD_W + 0.035), 0.875, -0.20);
    mesh.rotation.z = (i - 2) * 0.015;
    root.add(mesh);
    return mesh;
  });

  const playerCards = Array.from({ length: 2 }, (_, i) => {
    const mesh = makeCardMesh("--", i === 0 ? "YOUR HAND" : "");
    mesh.position.set((i - 0.5) * (CARD_W + 0.045), 0.885, 0.83);
    mesh.rotation.z = (i === 0 ? -0.08 : 0.08);
    root.add(mesh);
    return mesh;
  });

  const muckCards = Array.from({ length: 3 }, (_, i) => {
    const mesh = makeCardMesh("BACK", i === 0 ? "MUCK" : "");
    mesh.position.set(-0.96 + i * 0.055, 0.865 + i * 0.004, 0.05 + i * 0.015);
    mesh.rotation.z = -0.24 + i * 0.04;
    mesh.visible = true;
    root.add(mesh);
    return mesh;
  });

  const deckCard = makeCardMesh("BACK", "DECK");
  deckCard.position.set(0.94, 0.872, -0.02);
  deckCard.rotation.z = 0.18;
  root.add(deckCard);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 1024;
  labelCanvas.height = 192;
  const labelCtx = labelCanvas.getContext("2d", { alpha: true });
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.96, 0.36),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false })
  );
  labelMesh.name = "SVR_Phase101_CardStateLabel";
  labelMesh.position.set(0, 1.08, 0.38);
  labelMesh.rotation.x = -0.34;
  labelMesh.renderOrder = 54;
  root.add(labelMesh);

  function drawLabel(state){
    const text = state?.winnerText || (state?.awaitingPlayer ? "YOUR TURN — cards synced" : `Cards synced • ${String(state?.street || "ready").toUpperCase()} • Pot $${state?.pot || 0}`);
    labelCtx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
    labelCtx.fillStyle = "rgba(4,7,16,0.82)";
    roundRect(labelCtx, 18, 30, 988, 116, 32);
    labelCtx.fill();
    labelCtx.strokeStyle = state?.winnerText ? "rgba(127,245,199,0.90)" : state?.awaitingPlayer ? "rgba(246,226,127,0.86)" : "rgba(180,140,255,0.65)";
    labelCtx.lineWidth = 6;
    roundRect(labelCtx, 18, 30, 988, 116, 32);
    labelCtx.stroke();
    labelCtx.fillStyle = state?.awaitingPlayer ? "#f6e27f" : "#ffffff";
    labelCtx.font = "bold 42px system-ui, Arial";
    labelCtx.textAlign = "center";
    labelCtx.textBaseline = "middle";
    labelCtx.fillText(String(text).slice(0, 62), 512, 88);
    labelTexture.needsUpdate = true;
  }

  return { root, boardCards, playerCards, muckCards, deckCard, drawLabel, labelMesh, lastSig: "" };
}

function signature(state){
  if (!state) return "none";
  return [state.handNumber, state.street, (state.board || []).join(""), (state.playerCards || []).join(""), state.awaitingPlayer, state.winnerText, state.pot].join("|");
}

function boot(){
  let sync = null;
  let last = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (now - last < UPDATE_MS) return;
    last = now;
    const poker = window.SVR_PLAYABLE_POKER;
    const state = poker?.getState?.();
    const scene = poker?.object?.parent;
    if (!state || !scene) return;
    if (!sync) sync = createCardSync(scene);
    const sig = signature(state);
    if (sync.lastSig === sig) return;
    sync.lastSig = sig;

    const board = state.board || [];
    const hand = state.playerCards || [];
    sync.boardCards.forEach((mesh, i) => updateCard(mesh, board[i] || "--", !!state.winnerText));
    sync.playerCards.forEach((mesh, i) => updateCard(mesh, hand[i] || "--", state.awaitingPlayer || !!state.winnerText));
    sync.deckCard.visible = state.street !== "showdown";
    sync.muckCards.forEach((mesh, i) => { mesh.visible = state.street !== "idle" && (i < Math.max(1, Math.min(3, Math.floor((state.pot || 0) / 120) + 1))); });
    sync.drawLabel(state);
  };
  requestAnimationFrame(loop);
  window.SVR_PHASE101_VISUAL_CARD_MESH_SYNC = { phase: PHASE };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
