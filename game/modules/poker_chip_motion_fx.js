import * as THREE from "three";

// PHASE-102-CHIP-THROW-SWEEP-ANIMATION-LOCK
// Game-side only. Adds lightweight chip throw/sweep motion synced from the
// playable poker state. Poker logic source of truth remains playable_poker.js.

const PHASE = "PHASE-102-CHIP-THROW-SWEEP-ANIMATION-LOCK";
const UPDATE_MS = 80;
const MAX_TOKENS = 18;
const NAMES = ["NOVA", "CARLA", "MILO", "YOU", "RIVER", "ONYX"];

function seatIndexForName(name){
  const up = String(name || "").toUpperCase();
  const idx = NAMES.findIndex(n => up.includes(n));
  return idx >= 0 ? idx : 3;
}
function seatPosition(index){
  const radius = 1.92;
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / NAMES.length);
  return new THREE.Vector3(Math.cos(angle) * radius, 0.90, Math.sin(angle) * radius);
}
function parseActor(text){
  const raw = String(text || "");
  const colon = raw.indexOf(":");
  if (colon > 0) return raw.slice(0, colon).trim();
  const wins = raw.match(/^([A-Z]+)\s+(wins|takes)/i);
  if (wins) return wins[1];
  const first = raw.split(/\s+/)[0];
  return first || "YOU";
}
function isBetAction(text){
  const lower = String(text || "").toLowerCase();
  return lower.includes("call") || lower.includes("raise") || lower.includes("all-in") || lower.includes("sb") || lower.includes("bb");
}
function isWinnerAction(state){
  return !!state?.winnerText;
}
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
function lerpVec(a, b, t){ return new THREE.Vector3().lerpVectors(a, b, t); }

function makeChipMaterial(color, emissive){
  return new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.10, emissive, emissiveIntensity: 0.10 });
}
function createTokenPool(scene){
  const root = new THREE.Group();
  root.name = "SVR_Phase102_ChipMotionFX";
  scene.add(root);
  const geom = new THREE.CylinderGeometry(0.062, 0.062, 0.014, 18);
  const mats = [
    makeChipMaterial(0x7ff5c7, 0x061812),
    makeChipMaterial(0xb48cff, 0x0d0716),
    makeChipMaterial(0xf6e27f, 0x141004),
    makeChipMaterial(0xff6b7f, 0x18060a)
  ];
  const tokens = [];
  for (let i = 0; i < MAX_TOKENS; i++){
    const chip = new THREE.Mesh(geom, mats[i % mats.length]);
    chip.name = "SVR_Phase102_FlyingChip";
    chip.rotation.x = Math.PI / 2;
    chip.visible = false;
    chip.userData.fx = null;
    root.add(chip);
    tokens.push(chip);
  }
  const potGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.42, 48),
    new THREE.MeshBasicMaterial({ color: 0x7ff5c7, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  potGlow.name = "SVR_Phase102_PotPulse";
  potGlow.position.set(0.42, 0.845, 0.02);
  potGlow.rotation.x = -Math.PI / 2;
  root.add(potGlow);
  return { root, tokens, potGlow, pulseTimer: 0 };
}
function getFreeToken(fx){
  return fx.tokens.find(token => !token.visible) || fx.tokens[0];
}
function launchChip(fx, from, to, delay = 0, sweep = false){
  const chip = getFreeToken(fx);
  chip.visible = true;
  chip.position.copy(from);
  chip.userData.fx = {
    from: from.clone(),
    to: to.clone(),
    start: performance.now() + delay,
    duration: sweep ? 780 : 620,
    arc: sweep ? 0.34 : 0.23,
    sweep
  };
}
function launchThrow(fx, actorName){
  const from = seatPosition(seatIndexForName(actorName));
  const to = new THREE.Vector3(0.42, 0.90, 0.02);
  for (let i = 0; i < 3; i++){
    const jitter = new THREE.Vector3((Math.random() - 0.5) * 0.10, i * 0.012, (Math.random() - 0.5) * 0.10);
    launchChip(fx, from.clone().add(jitter), to.clone().add(jitter.multiplyScalar(0.35)), i * 72, false);
  }
  fx.pulseTimer = 0.75;
}
function launchSweep(fx, winnerName){
  const from = new THREE.Vector3(0.42, 0.90, 0.02);
  const to = seatPosition(seatIndexForName(winnerName));
  for (let i = 0; i < 7; i++){
    const jitterFrom = new THREE.Vector3((Math.random() - 0.5) * 0.24, i * 0.008, (Math.random() - 0.5) * 0.22);
    const jitterTo = new THREE.Vector3((Math.random() - 0.5) * 0.16, i * 0.012, (Math.random() - 0.5) * 0.16);
    launchChip(fx, from.clone().add(jitterFrom), to.clone().add(jitterTo), i * 58, true);
  }
  fx.pulseTimer = 1.1;
}
function updateTokens(fx){
  const now = performance.now();
  for (const chip of fx.tokens){
    const meta = chip.userData.fx;
    if (!meta) continue;
    const t = (now - meta.start) / meta.duration;
    if (t < 0) continue;
    if (t >= 1){
      chip.visible = false;
      chip.userData.fx = null;
      continue;
    }
    const e = easeOutCubic(Math.max(0, Math.min(1, t)));
    const pos = lerpVec(meta.from, meta.to, e);
    pos.y += Math.sin(Math.PI * e) * meta.arc;
    chip.position.copy(pos);
    chip.rotation.z += meta.sweep ? 0.22 : 0.15;
    chip.rotation.y += meta.sweep ? 0.08 : 0.04;
  }
  if (fx.pulseTimer > 0){
    fx.pulseTimer -= 0.08;
    const alpha = Math.max(0, fx.pulseTimer);
    fx.potGlow.visible = true;
    fx.potGlow.material.opacity = Math.min(0.44, alpha * 0.42);
    fx.potGlow.scale.setScalar(1 + (1 - alpha) * 0.30);
  } else {
    fx.potGlow.material.opacity = 0;
    fx.potGlow.visible = false;
  }
}

function boot(){
  let fx = null;
  let last = 0;
  let lastAction = "";
  let lastWinner = "";
  let lastPot = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (now - last < UPDATE_MS) return;
    last = now;
    const poker = window.SVR_PLAYABLE_POKER;
    const state = poker?.getState?.();
    const scene = poker?.object?.parent;
    if (!state || !scene) return;
    if (!fx) fx = createTokenPool(scene);

    const lowPerf = document.body.classList.contains("svr-low-perf");
    if (!lowPerf) updateTokens(fx);

    const action = String(state.lastAction || "");
    if (action && action !== lastAction){
      lastAction = action;
      if (isBetAction(action)) launchThrow(fx, parseActor(action));
    }

    if (isWinnerAction(state) && state.winnerText !== lastWinner){
      lastWinner = state.winnerText;
      launchSweep(fx, parseActor(state.winnerText));
    }

    if (state.pot !== lastPot){
      lastPot = state.pot;
      fx.pulseTimer = Math.max(fx.pulseTimer, 0.45);
    }
  };
  requestAnimationFrame(loop);
  window.SVR_PHASE102_CHIP_MOTION_FX = { phase: PHASE };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
