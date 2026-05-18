import * as THREE from "three";

// PHASE-91-QUEST-PERFORMANCE-PASS-LOCK
// Game-side only. Keeps Phase 90 table FX but adds adaptive throttling,
// low-FPS fallback, and fewer canvas texture redraws for Quest/mobile stability.

const PHASE = "PHASE-91-QUEST-PERFORMANCE-PASS-LOCK";
const BOT_ORDER = ["NOVA", "CARLA", "MILO", "YOU", "RIVER", "ONYX"];
const FX_ROOT_NAME = "SVR_Phase91_PokerTableFX";
const TARGET_FRAME_MS = 33.4;
const LOW_FRAME_MS = 45;

function activeSeatIndex(name){
  const idx = BOT_ORDER.indexOf(String(name || "").toUpperCase());
  return idx >= 0 ? idx : 3;
}
function seatPosition(index){
  const radius = 1.92;
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / BOT_ORDER.length);
  return new THREE.Vector3(Math.cos(angle) * radius, 0.82, Math.sin(angle) * radius);
}
function makeTextTexture(width = 768, height = 160){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, ctx, texture, lastSig: "" };
}
function drawWinnerBanner(target, text, detail){
  const sig = `${text}|${detail}`;
  if (target.lastSig === sig) return;
  target.lastSig = sig;
  const { canvas, ctx, texture } = target;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "rgba(7,10,20,0.92)");
  grad.addColorStop(1, "rgba(38,18,72,0.94)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(127,245,199,0.88)";
  ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = "#7ff5c7";
  ctx.font = "bold 48px system-ui, Arial";
  ctx.textAlign = "center";
  ctx.fillText("WINNER", canvas.width / 2, 64);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px system-ui, Arial";
  ctx.fillText(String(text || "Showdown complete").slice(0, 48), canvas.width / 2, 114);
  ctx.fillStyle = "rgba(233,233,255,0.84)";
  ctx.font = "22px system-ui, Arial";
  ctx.fillText(String(detail || "").slice(0, 72), canvas.width / 2, 148);
  texture.needsUpdate = true;
}
function drawActiveLabel(target, state){
  const sig = `${state.awaitingPlayer}|${state.activeName}|${state.street}|${state.pot}`;
  if (target.lastSig === sig) return;
  target.lastSig = sig;
  const { canvas, ctx, texture } = target;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(4,7,16,0.86)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = state.awaitingPlayer ? "rgba(246,226,127,0.95)" : "rgba(180,140,255,0.75)";
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = state.awaitingPlayer ? "#f6e27f" : "#ffffff";
  ctx.font = "bold 38px system-ui, Arial";
  ctx.textAlign = "center";
  ctx.fillText(state.awaitingPlayer ? "YOUR TURN" : `ACTIVE: ${state.activeName || "--"}`, canvas.width / 2, 62);
  ctx.fillStyle = "rgba(233,233,255,0.86)";
  ctx.font = "24px system-ui, Arial";
  ctx.fillText(`${String(state.street || "READY").toUpperCase()} • POT $${state.pot || 0}`, canvas.width / 2, 108);
  texture.needsUpdate = true;
}
function createChipStack(){
  const group = new THREE.Group();
  group.name = "SVR_Phase91_PotChipStack";
  const chipGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.018, 18);
  const chipMats = [
    new THREE.MeshStandardMaterial({ color: 0x7ff5c7, roughness: 0.5, metalness: 0.05, emissive: 0x061812, emissiveIntensity: 0.08 }),
    new THREE.MeshStandardMaterial({ color: 0xb48cff, roughness: 0.5, metalness: 0.05, emissive: 0x0d0716, emissiveIntensity: 0.08 }),
    new THREE.MeshStandardMaterial({ color: 0xf6e27f, roughness: 0.55, metalness: 0.04, emissive: 0x141004, emissiveIntensity: 0.06 })
  ];
  for (let i = 0; i < 12; i++){
    const chip = new THREE.Mesh(chipGeo, chipMats[i % chipMats.length]);
    const col = i % 3;
    const row = Math.floor(i / 3);
    chip.position.set((col - 1) * 0.14, row * 0.019, 0);
    chip.rotation.x = Math.PI / 2;
    chip.visible = i < 3;
    group.add(chip);
  }
  group.position.set(0.42, 0.82, 0.02);
  return group;
}
function createFx(scene){
  const root = new THREE.Group();
  root.name = FX_ROOT_NAME;
  scene.add(root);
  const ringGeo = new THREE.TorusGeometry(0.36, 0.016, 8, 48);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf6e27f, transparent: true, opacity: 0.70, depthWrite: false });
  const activeRing = new THREE.Mesh(ringGeo, ringMat);
  activeRing.name = "SVR_Phase91_ActiveSeatRing";
  activeRing.rotation.x = Math.PI / 2;
  root.add(activeRing);
  const pulseGeo = new THREE.RingGeometry(0.34, 0.50, 48);
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0x7ff5c7, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
  pulseRing.name = "SVR_Phase91_ActiveSeatPulse";
  pulseRing.rotation.x = -Math.PI / 2;
  root.add(pulseRing);
  const activeTexture = makeTextTexture(768, 160);
  const activeLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 0.32),
    new THREE.MeshBasicMaterial({ map: activeTexture.texture, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })
  );
  activeLabel.name = "SVR_Phase91_ActiveSeatLabel";
  activeLabel.position.set(0, 1.72, 0.96);
  activeLabel.rotation.x = -0.18;
  activeLabel.renderOrder = 48;
  root.add(activeLabel);
  const winnerTexture = makeTextTexture(1024, 192);
  const winnerBanner = new THREE.Mesh(
    new THREE.PlaneGeometry(2.55, 0.48),
    new THREE.MeshBasicMaterial({ map: winnerTexture.texture, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })
  );
  winnerBanner.name = "SVR_Phase91_WinnerBanner";
  winnerBanner.position.set(0, 1.92, -0.56);
  winnerBanner.rotation.x = -0.10;
  winnerBanner.renderOrder = 60;
  winnerBanner.visible = false;
  root.add(winnerBanner);
  const chipStack = createChipStack();
  root.add(chipStack);
  return { root, activeRing, pulseRing, activeTexture, activeLabel, winnerTexture, winnerBanner, chipStack, lastWinner: "", winnerTimer: 0, lastPot: -1, lowPerf: false, avgFrameMs: TARGET_FRAME_MS, fxStep: 0 };
}
function updateChips(fx, pot){
  const visibleCount = Math.max(1, Math.min(12, Math.ceil(Number(pot || 0) / 80)));
  fx.chipStack.children.forEach((chip, i) => { chip.visible = i < visibleCount; });
  const scale = 0.9 + Math.min(0.34, Number(pot || 0) / 2600);
  fx.chipStack.scale.setScalar(scale);
}
function setLowPerf(fx, enabled){
  if (fx.lowPerf === enabled) return;
  fx.lowPerf = enabled;
  document.body.classList.toggle("svr-low-perf", enabled);
  fx.pulseRing.visible = !enabled;
  fx.activeLabel.visible = !enabled;
  fx.chipStack.children.forEach((chip, i) => { if (enabled && i > 5) chip.visible = false; });
}
function boot(){
  let fx = null;
  let lastNow = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    const poker = window.SVR_PLAYABLE_POKER;
    const state = poker?.getState?.();
    const scene = poker?.object?.parent;
    if (!state || !scene) return;
    if (!fx) fx = createFx(scene);
    const frameMs = Math.min(120, Math.max(0, now - lastNow));
    lastNow = now;
    fx.avgFrameMs = fx.avgFrameMs * 0.94 + frameMs * 0.06;
    setLowPerf(fx, fx.avgFrameMs > LOW_FRAME_MS);
    fx.fxStep += 1;
    const skip = fx.lowPerf && fx.fxStep % 2 !== 0;
    const t = now * 0.001;
    const idx = activeSeatIndex(state.activeName);
    const pos = seatPosition(idx);
    fx.activeRing.position.copy(pos);
    fx.activeRing.position.y += 0.018 + (fx.lowPerf ? 0 : Math.sin(t * 5.0) * 0.006);
    fx.activeRing.material.opacity = state.awaitingPlayer ? 0.88 : 0.54;
    fx.activeRing.scale.setScalar(state.awaitingPlayer ? 1.12 : 1.0);
    if (!skip && !fx.lowPerf){
      fx.pulseRing.position.copy(pos);
      fx.pulseRing.position.y += 0.012;
      const pulse = 1.0 + (Math.sin(t * 3.2) + 1) * 0.14;
      fx.pulseRing.scale.setScalar(pulse);
      fx.pulseRing.material.opacity = state.awaitingPlayer ? 0.30 : 0.18;
    }
    if (!fx.lowPerf) fx.chipStack.rotation.y += 0.012;
    if (state.pot !== fx.lastPot){
      fx.lastPot = state.pot;
      updateChips(fx, state.pot);
      drawActiveLabel(fx.activeTexture, state);
    }
    if ((state.winnerText || "") !== fx.lastWinner){
      fx.lastWinner = state.winnerText || "";
      if (fx.lastWinner){
        drawWinnerBanner(fx.winnerTexture, state.winnerText, state.winnerDetails || state.lastAction);
        fx.winnerBanner.visible = true;
        fx.winnerTimer = 7.5;
      }
    }
    if (fx.winnerTimer > 0){
      fx.winnerTimer -= frameMs / 1000;
      fx.winnerBanner.visible = true;
      if (!fx.lowPerf) fx.winnerBanner.position.y = 1.92 + Math.sin(t * 4.0) * 0.014;
    } else {
      fx.winnerBanner.visible = false;
    }
  };
  requestAnimationFrame(loop);
  window.SVR_PHASE91_TABLE_FX = { phase: PHASE };
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
