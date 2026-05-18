import * as THREE from "three";

// PHASE-92-NPC-BOT-ANIMATION-POLISH-LOCK
// Game-side only. Lightweight procedural bot polish layered on top of the
// existing NPC avatar system. No website/site edits.

const PHASE = "PHASE-92-NPC-BOT-ANIMATION-POLISH-LOCK";
const BOT_NAMES = ["NOVA", "CARLA", "MILO", "ACE", "RIVER", "ONYX"];
const ACTION_WORDS = ["fold", "check", "call", "raise", "all-in", "wins"];

function makeBubbleTexture(text = "READY"){
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d", { alpha: true });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const draw = (value) => {
    const label = String(value || "READY").toUpperCase().slice(0, 18);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "rgba(5,8,16,0.90)");
    grad.addColorStop(1, "rgba(35,18,70,0.92)");
    ctx.fillStyle = grad;
    roundRect(ctx, 18, 28, 476, 118, 34);
    ctx.fill();
    ctx.strokeStyle = "rgba(127,245,199,0.86)";
    ctx.lineWidth = 6;
    roundRect(ctx, 18, 28, 476, 118, 34);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 54px system-ui, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 256, 88);
    texture.needsUpdate = true;
  };
  draw(text);
  return { canvas, ctx, texture, draw, lastText: text };
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

function actorName(actor){
  return String(actor?.spawn?.label || actor?.def?.displayName || actor?.def?.id || "BOT").toUpperCase();
}

function normalizeAction(lastAction = ""){
  const lower = String(lastAction).toLowerCase();
  for (const word of ACTION_WORDS){
    if (lower.includes(word)) return word === "all-in" ? "ALL-IN" : word.toUpperCase();
  }
  return "THINK";
}

function makeChipToken(){
  const group = new THREE.Group();
  group.name = "SVR_Phase92_AnimatedChipToken";
  const mat = new THREE.MeshStandardMaterial({ color: 0xf6e27f, roughness: 0.46, metalness: 0.10, emissive: 0x151004, emissiveIntensity: 0.08 });
  const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 18), mat);
  chip.rotation.x = Math.PI / 2;
  group.add(chip);
  group.visible = false;
  return group;
}

function ensurePolish(actor){
  if (!actor?.root || actor.userData?.phase92) return actor?.userData?.phase92;
  actor.userData = actor.userData || {};
  const bubbleTex = makeBubbleTexture("READY");
  const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex.texture, transparent: true, depthWrite: false }));
  bubble.name = "SVR_Phase92_NPC_ActionBubble";
  bubble.scale.set(0.62, 0.23, 1);
  bubble.position.set(0, 2.38, 0);
  bubble.visible = false;
  actor.root.add(bubble);

  const chipToken = makeChipToken();
  chipToken.position.set(0.16, 1.05, 0.16);
  actor.root.add(chipToken);

  const polish = {
    bubble,
    bubbleTex,
    chipToken,
    bubbleTimer: 0,
    action: "READY",
    lastActionText: "",
    seed: Math.random() * 100,
    originalRootY: actor.root.position.y,
    lastActive: false
  };
  actor.userData.phase92 = polish;
  return polish;
}

function parseActorAction(actor, state){
  const name = actorName(actor);
  const last = String(state?.lastAction || "");
  const winner = String(state?.winnerText || "");
  if (last.toUpperCase().startsWith(name + ":")) return normalizeAction(last);
  if (winner.toUpperCase().includes(name)) return "WIN";
  if (String(state?.activeName || "").toUpperCase() === name) return state?.awaitingPlayer ? "WAIT" : "THINK";
  return "";
}

function animateProceduralParts(actor, polish, state, dt, now){
  const parts = actor?.model?.userData?._proceduralParts;
  const active = String(state?.activeName || "").toUpperCase() === actorName(actor);
  const action = polish.action;
  const phase = now + polish.seed;

  if (actor.root){
    const breathe = Math.sin(phase * 1.8) * 0.012;
    actor.root.position.y = polish.originalRootY + breathe;
    actor.root.rotation.y += Math.sin(phase * 0.8) * dt * 0.025;
  }

  if (!parts) return;
  const thinking = active && (action === "THINK" || action === "WAIT");
  const reach = action === "CALL" || action === "RAISE" || action === "ALL-IN";
  const fold = action === "FOLD";
  const win = action === "WIN";
  const cardPeek = thinking || action === "CHECK";

  if (parts.head){
    parts.head.rotation.x = Math.sin(phase * 1.2) * 0.035 + (thinking ? -0.045 : 0);
    parts.head.rotation.y = Math.sin(phase * 0.9) * 0.045;
  }
  if (parts.armL){
    parts.armL.rotation.z = 0.28 + Math.sin(phase * 2.2) * 0.04;
    parts.armL.rotation.x = cardPeek ? -0.38 + Math.sin(phase * 4.0) * 0.04 : 0;
    if (fold) parts.armL.rotation.x = -0.72;
    if (win) parts.armL.rotation.x = -1.05;
  }
  if (parts.armR){
    parts.armR.rotation.z = -0.28 + Math.sin(phase * 2.0 + 1.2) * 0.04;
    parts.armR.rotation.x = reach ? -0.82 + Math.sin(phase * 4.2) * 0.08 : 0;
    if (fold) parts.armR.rotation.x = -0.72;
    if (win) parts.armR.rotation.x = -1.05;
  }
}

function updateActionBubble(polish, text, dt){
  if (text && text !== polish.lastActionText){
    polish.lastActionText = text;
    polish.action = text;
    polish.bubbleTex.draw(text);
    polish.bubbleTimer = text === "THINK" ? 1.2 : 2.8;
    polish.bubble.visible = true;
    polish.chipToken.visible = ["CALL", "RAISE", "ALL-IN"].includes(text);
  }
  if (polish.bubbleTimer > 0){
    polish.bubbleTimer -= dt;
    polish.bubble.visible = true;
    const s = 0.62 + Math.sin(performance.now() * 0.006) * 0.018;
    polish.bubble.scale.set(s, 0.23, 1);
  } else {
    polish.bubble.visible = false;
    polish.chipToken.visible = false;
  }
  if (polish.chipToken.visible){
    polish.chipToken.rotation.y += dt * 4.2;
    polish.chipToken.position.z = 0.16 + Math.sin(performance.now() * 0.004) * 0.045;
  }
}

function update(){
  const sys = window.SVR_NPC_AVATAR_SYSTEM;
  const poker = window.SVR_PLAYABLE_POKER;
  const state = poker?.getState?.();
  if (!sys?.actors?.length || !state) return;
  const now = performance.now() * 0.001;
  const lowPerf = document.body.classList.contains("svr-low-perf");
  const dt = lowPerf ? 0.016 : 0.033;
  for (const actor of sys.actors){
    const name = actorName(actor);
    if (!BOT_NAMES.some(bot => name.includes(bot)) && !name.includes("BOT")) continue;
    const polish = ensurePolish(actor);
    if (!polish) continue;
    const action = parseActorAction(actor, state);
    updateActionBubble(polish, action, dt);
    if (!lowPerf) animateProceduralParts(actor, polish, state, dt, now);
  }
}

function boot(){
  let last = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (now - last < 66) return;
    last = now;
    update();
  };
  requestAnimationFrame(loop);
  window.SVR_PHASE92_NPC_BOT_ANIMATION_FX = { phase: PHASE };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
