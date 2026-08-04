import * as THREE from 'three';
import { state, players, BUILD as RULES_BUILD } from './phase336_authoritative_engine.js';
import {
  bankrollPlan,
  formatDenomination,
  runBankrollModelSelfTest,
} from './phase338_bankroll_chip_model.js';

const BUILD = 'PHASE-338-BANKROLL-CHIP-INVENTORY-SYNC-LOCK';
const ROOT_NAME = 'PHASE338_BANKROLL_CHIP_INVENTORY_ROOT';
const CHIP_RADIUS = 0.036;
const CHIP_HEIGHT = 0.0085;
const MAX_STACK_HEIGHT = 8;
const RECLAIM_DELAY = 2200;
const COLORS = new Map([
  [1, ['#eaf7ff', '#25bdf2']],
  [5, ['#b51632', '#ffffff']],
  [25, ['#127646', '#ffffff']],
  [100, ['#171923', '#b86cff']],
  [500, ['#4d1784', '#ffd98a']],
  [1000, ['#d9a514', '#171923']],
  [5000, ['#d45a18', '#fff4d6']],
]);

let scene;
let camera;
let renderer;
let tableInfo;
let root;
let trayRoot;
let bankrollLabel;
let bankrollCanvas;
let bankrollTexture;
let installed = false;
let lastStack = null;
let lastHand = -1;
let lastPhase = '';
let lastSyncAt = 0;
let syncTimer = null;
let reclaimTimer = null;
let modelPlan = bankrollPlan(0);
let materialCache = new Map();
let transitGeometry = null;
let animations = [];
let exact = false;
let pendingReclaim = false;
let playerBasis = null;
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();

function sceneRoot() {
  return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
}

function authoritativeTable() {
  const base = sceneRoot();
  return base?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')
    || base?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT')
    || base?.getObjectByName?.('PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED')
    || null;
}

function detectTable() {
  const table = authoritativeTable();
  if (!table) return null;
  table.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(table);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return {
    table,
    box,
    size,
    center,
    surfaceY: box.max.y + 0.006,
    width: Math.max(2.2, Math.min(size.x * 0.72, 4.0)),
    depth: Math.max(1.15, Math.min(size.z * 0.68, 2.15)),
  };
}

function activeCamera() {
  return renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
}

function cameraWorld(target = new THREE.Vector3()) {
  activeCamera()?.getWorldPosition?.(target);
  return target;
}

function determineBasis() {
  const cameraPosition = cameraWorld(tmpA);
  const outward = cameraPosition.clone().sub(tableInfo.center).setY(0);
  if (outward.lengthSq() < 0.04) outward.set(0, 0, 1);
  outward.normalize();
  const right = new THREE.Vector3(outward.z, 0, -outward.x).normalize();
  playerBasis = {
    outward,
    right,
    bankCenter: tableInfo.center.clone()
      .addScaledVector(outward, tableInfo.depth * 0.39)
      .addScaledVector(right, -tableInfo.width * 0.17),
    betCenter: tableInfo.center.clone()
      .addScaledVector(outward, tableInfo.depth * 0.24)
      .addScaledVector(right, tableInfo.width * 0.14),
    potCenter: tableInfo.center.clone().addScaledVector(outward, -tableInfo.depth * 0.02),
  };
  return playerBasis;
}

function phase332Chips() {
  const chips = [];
  sceneRoot()?.traverse?.((object) => {
    if (
      object?.isMesh
      && object.userData?.svr332
      && /PHASE332_YOU_/i.test(object.name || '')
    ) chips.push(object);
  });
  return chips;
}

function setWorldPosition(object, position) {
  if (!object?.parent) return;
  const local = position.clone();
  object.parent.worldToLocal(local);
  object.position.copy(local);
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), canvas);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function denominationPalette(value) {
  if (COLORS.has(value)) return COLORS.get(value);
  const hue = Math.abs(Number(value) || 0) % 360;
  return [`hsl(${hue},58%,27%)`, '#ffffff'];
}

function chipFace(value) {
  const [base, accent] = denominationPalette(value);
  return canvasTexture(512, 512, (context) => {
    context.translate(256, 256);
    context.fillStyle = base;
    context.beginPath();
    context.arc(0, 0, 244, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = accent;
    context.lineWidth = 18;
    context.beginPath();
    context.arc(0, 0, 214, 0, Math.PI * 2);
    context.stroke();
    for (let index = 0; index < 12; index += 1) {
      const angle = index * Math.PI / 6;
      context.beginPath();
      context.arc(0, 0, 232, angle - 0.08, angle + 0.08);
      context.stroke();
    }
    context.fillStyle = 'rgba(4,6,14,.86)';
    context.beginPath();
    context.arc(0, 0, 145, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#ffffff';
    context.lineWidth = 9;
    context.stroke();
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '900 104px system-ui';
    context.fillText(formatDenomination(value), 0, -18, 260);
    context.fillStyle = accent;
    context.font = '900 36px system-ui';
    context.fillText('SVR POKER', 0, 82, 260);
  });
}

function chipEdge(value) {
  const [base, accent] = denominationPalette(value);
  const texture = canvasTexture(1024, 128, (context, canvas) => {
    context.fillStyle = base;
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < 16; index += 2) {
      context.fillStyle = accent;
      context.fillRect(index * canvas.width / 16 + 10, 0, canvas.width / 32, canvas.height);
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function materialsFor(value) {
  const denomination = Math.max(1, Math.floor(Number(value) || 1));
  if (materialCache.has(denomination)) return materialCache.get(denomination);
  const face = chipFace(denomination);
  const edge = chipEdge(denomination);
  const materials = [
    new THREE.MeshStandardMaterial({ map: edge, roughness: 0.42, metalness: 0.12 }),
    new THREE.MeshStandardMaterial({ map: face, roughness: 0.36, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: face, roughness: 0.36, metalness: 0.08 }),
  ];
  materialCache.set(denomination, materials);
  return materials;
}

function makeLineLoop(width, depth) {
  const points = [
    new THREE.Vector3(-width / 2, 0, -depth / 2),
    new THREE.Vector3(width / 2, 0, -depth / 2),
    new THREE.Vector3(width / 2, 0, depth / 2),
    new THREE.Vector3(-width / 2, 0, depth / 2),
  ];
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x7ffcff, transparent: true, opacity: 0.58, depthWrite: false, toneMapped: false }),
  );
}

function ensureTray() {
  if (trayRoot?.parent) return;
  determineBasis();
  root = new THREE.Group();
  root.name = ROOT_NAME;
  scene.add(root);
  trayRoot = new THREE.Group();
  trayRoot.name = 'PHASE338_AUTHORITATIVE_BANKROLL_TRAY';
  root.add(trayRoot);

  const trayWidth = Math.min(0.94, tableInfo.width * 0.29);
  const trayDepth = Math.min(0.48, tableInfo.depth * 0.27);
  const outline = makeLineLoop(trayWidth, trayDepth);
  outline.name = 'PHASE338_BANKROLL_TRAY_OUTLINE';
  outline.position.copy(playerBasis.bankCenter).setY(tableInfo.surfaceY + 0.014);
  trayRoot.add(outline);

  bankrollCanvas = document.createElement('canvas');
  bankrollCanvas.width = 768;
  bankrollCanvas.height = 256;
  bankrollTexture = new THREE.CanvasTexture(bankrollCanvas);
  bankrollTexture.colorSpace = THREE.SRGBColorSpace;
  bankrollTexture.minFilter = THREE.LinearFilter;
  bankrollTexture.magFilter = THREE.LinearFilter;
  bankrollLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.26),
    new THREE.MeshBasicMaterial({ map: bankrollTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
  );
  bankrollLabel.name = 'PHASE338_AUTHORITATIVE_BANKROLL_LABEL';
  bankrollLabel.position.copy(playerBasis.bankCenter)
    .addScaledVector(playerBasis.outward, 0.04)
    .setY(tableInfo.surfaceY + 0.30);
  bankrollLabel.renderOrder = 3385;
  trayRoot.add(bankrollLabel);
}

function hideLegacyBankLabels() {
  for (const name of [
    'PHASE334_STACK_ZONE_OUTLINE',
    'PHASE334_STACK_TOTAL_LABEL',
    'PHASE332_PASS_LABEL',
  ]) {
    scene?.getObjectByName?.(name)?.traverse?.((object) => { object.visible = false; });
  }
  const bank = scene?.getObjectByName?.('PHASE332_PLAYER_BANK');
  bank?.traverse?.((object) => {
    if (object === bank || object.userData?.svr332) return;
    object.visible = false;
  });
}

function clearVelocity(chip) {
  chip.userData?.vel?.set?.(0, 0, 0);
  chip.userData?.ang?.set?.(0, 0, 0);
  chip.userData.settled = 0;
}

function reclaimChip(chip) {
  if (!chip || chip.userData?.held || chip.userData?.dynamic) return false;
  chip.userData.locked = false;
  chip.userData.interactive = true;
  chip.userData.dynamic = false;
  chip.userData.phase334AutoBet = false;
  chip.userData.phase334BetPlaced = false;
  chip.userData.phase334Home = false;
  chip.userData.phase338Managed = true;
  clearVelocity(chip);
  chip.visible = true;
  return true;
}

function reclaimAllCommitted() {
  let reclaimed = 0;
  for (const chip of phase332Chips()) {
    if (chip.userData?.locked && reclaimChip(chip)) reclaimed += 1;
  }
  pendingReclaim = false;
  return reclaimed;
}

function splitIntoStackSlots(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  const slots = [];
  for (const [value, count] of [...counts.entries()].sort((a, b) => b[0] - a[0])) {
    let remaining = count;
    while (remaining > 0) {
      const size = Math.min(MAX_STACK_HEIGHT, remaining);
      slots.push({ value, size });
      remaining -= size;
    }
  }
  return slots;
}

function slotPositions(slots) {
  const trayWidth = Math.min(0.94, tableInfo.width * 0.29);
  const trayDepth = Math.min(0.48, tableInfo.depth * 0.27);
  const columns = Math.min(4, Math.max(1, slots.length));
  const rows = Math.max(1, Math.ceil(slots.length / columns));
  const spacingX = Math.min(0.18, trayWidth / Math.max(4, columns));
  const spacingZ = Math.min(0.16, trayDepth / Math.max(3, rows));
  return slots.map((slot, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return playerBasis.bankCenter.clone()
      .addScaledVector(playerBasis.right, (column - (columns - 1) / 2) * spacingX)
      .addScaledVector(playerBasis.outward, (row - (rows - 1) / 2) * spacingZ);
  });
}

function configureInventory(stack, options = {}) {
  const chips = phase332Chips();
  if (!chips.length) return false;
  if (options.reclaim) reclaimAllCommitted();

  const reserved = chips.filter((chip) => (
    !chip.userData?.locked
    && (chip.userData?.held || chip.userData?.dynamic)
    && chip.visible
  ));
  reserved.forEach((chip) => { chip.userData.phase338Managed = true; });
  const reservedValue = reserved.reduce((total, chip) => total + Math.max(0, Number(chip.userData?.value) || 0), 0);
  const target = Math.max(0, Math.floor(stack - reservedValue));
  const candidates = chips.filter((chip) => !chip.userData?.locked && !reserved.includes(chip));
  modelPlan = bankrollPlan(target, { maxChips: candidates.length || 1 });
  const slots = splitIntoStackSlots(modelPlan.values);
  const positions = slotPositions(slots);
  let chipIndex = 0;

  for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
    const slot = slots[slotIndex];
    const base = positions[slotIndex];
    for (let level = 0; level < slot.size; level += 1) {
      const chip = candidates[chipIndex];
      chipIndex += 1;
      if (!chip) break;
      chip.material = materialsFor(slot.value);
      chip.name = `PHASE332_YOU_PHASE338_${slot.value}_${chipIndex}`;
      chip.userData.value = slot.value;
      chip.userData.interactive = true;
      chip.userData.locked = false;
      chip.userData.dynamic = false;
      chip.userData.phase334AutoBet = false;
      chip.userData.phase334BetPlaced = false;
      chip.userData.phase334Home = false;
      chip.userData.phase338Managed = true;
      chip.userData.phase338Denomination = slot.value;
      chip.userData.phase338Slot = slotIndex;
      clearVelocity(chip);
      chip.visible = true;
      const world = base.clone().setY(tableInfo.surfaceY + CHIP_HEIGHT * 0.55 + level * CHIP_HEIGHT * 1.04);
      setWorldPosition(chip, world);
      chip.userData.phase338WorldHome = world.toArray();
      chip.rotation.set(0, 0, 0);
    }
  }

  for (let index = chipIndex; index < candidates.length; index += 1) {
    const chip = candidates[index];
    chip.userData.interactive = false;
    chip.userData.phase334Home = false;
    chip.userData.phase338Managed = true;
    chip.visible = false;
  }

  const availableValue = visibleInventoryValue();
  exact = availableValue === Math.max(0, Math.floor(stack));
  pendingReclaim = !exact && state.phase === 'showdown';
  paintLabel(stack, availableValue, reservedValue);
  lastSyncAt = performance.now();
  return exact;
}

function visibleInventoryValue() {
  return phase332Chips()
    .filter((chip) => chip.visible && !chip.userData?.locked && chip.userData?.phase338Managed)
    .reduce((total, chip) => total + Math.max(0, Number(chip.userData?.value) || 0), 0);
}

function denominationCounts() {
  const counts = {};
  for (const chip of phase332Chips()) {
    if (!chip.visible || chip.userData?.locked || !chip.userData?.phase338Managed) continue;
    const value = Math.max(0, Number(chip.userData?.value) || 0);
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function paintLabel(stack, visibleValue, reservedValue = 0) {
  if (!bankrollCanvas || !bankrollTexture) return;
  const context = bankrollCanvas.getContext('2d');
  const delta = lastStack == null ? 0 : stack - lastStack;
  const accent = stack <= 0 ? '#ff647c' : delta > 0 ? '#ffd98a' : delta < 0 ? '#ff9b6a' : '#7ffcff';
  context.clearRect(0, 0, bankrollCanvas.width, bankrollCanvas.height);
  context.fillStyle = 'rgba(2,7,15,.90)';
  roundedRect(context, 10, 10, 748, 236, 32);
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 8;
  context.stroke();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff';
  context.font = '900 42px system-ui';
  context.fillText(stack > 0 ? 'YOUR AUTHORITATIVE BANKROLL' : 'PLAYER OUT', 384, 58, 700);
  context.fillStyle = accent;
  context.font = '900 78px system-ui';
  context.fillText(`$${Math.max(0, Number(stack) || 0).toLocaleString()}`, 384, 132, 690);
  context.fillStyle = 'rgba(255,255,255,.84)';
  context.font = '800 30px system-ui';
  const status = pendingReclaim
    ? 'WINNER SETTLEMENT IN PROGRESS'
    : exact
      ? `VISIBLE CHIPS $${visibleValue.toLocaleString()} • LEDGER MATCHED`
      : `VISIBLE $${visibleValue.toLocaleString()} • RESYNCING${reservedValue ? ` • HELD $${reservedValue}` : ''}`;
  context.fillText(status, 384, 204, 710);
  bankrollTexture.needsUpdate = true;
}

function makeTransitChip(value) {
  transitGeometry ||= new THREE.CylinderGeometry(CHIP_RADIUS, CHIP_RADIUS, CHIP_HEIGHT, 32);
  const mesh = new THREE.Mesh(transitGeometry, materialsFor(value));
  mesh.name = `PHASE338_BANKROLL_TRANSIT_${value}`;
  mesh.userData.phase338Transit = true;
  mesh.renderOrder = 3388;
  scene.add(mesh);
  return mesh;
}

function transitValues(amount) {
  return bankrollPlan(Math.abs(amount), { maxChips: 12, workingReserve: false }).values;
}

function animateDelta(delta) {
  if (!delta || !playerBasis) return;
  const values = transitValues(delta);
  const positive = delta > 0;
  const startBase = positive ? playerBasis.potCenter : playerBasis.bankCenter;
  const endBase = positive ? playerBasis.bankCenter : playerBasis.betCenter;
  const now = performance.now();
  values.forEach((value, index) => {
    const object = makeTransitChip(value);
    const side = ((index % 4) - 1.5) * 0.055;
    const row = Math.floor(index / 4) * 0.035;
    const from = startBase.clone()
      .addScaledVector(playerBasis.right, side)
      .addScaledVector(playerBasis.outward, row)
      .setY(tableInfo.surfaceY + 0.05 + (index % 3) * CHIP_HEIGHT);
    const to = endBase.clone()
      .addScaledVector(playerBasis.right, side * 0.45)
      .addScaledVector(playerBasis.outward, row * 0.4)
      .setY(tableInfo.surfaceY + 0.04 + (index % 4) * CHIP_HEIGHT);
    object.position.copy(from);
    animations.push({ object, from, to, start: now + index * 35, duration: 620, arc: 0.20 + (index % 3) * 0.035 });
  });
}

function updateAnimations(now) {
  const remaining = [];
  for (const animation of animations) {
    const t = THREE.MathUtils.clamp((now - animation.start) / animation.duration, 0, 1);
    if (t <= 0) {
      remaining.push(animation);
      continue;
    }
    animation.object.position.lerpVectors(animation.from, animation.to, t);
    animation.object.position.y += Math.sin(t * Math.PI) * animation.arc;
    animation.object.rotation.y += 0.16;
    animation.object.rotation.x += 0.08;
    if (t >= 1) animation.object.removeFromParent();
    else remaining.push(animation);
  }
  animations = remaining;
}

function enforceLayout() {
  if (!installed || !tableInfo || !playerBasis) return;
  hideLegacyBankLabels();
  const chips = phase332Chips();
  const managed = chips.filter((chip) => chip.visible && !chip.userData?.locked && chip.userData?.phase338Managed && !chip.userData?.held && !chip.userData?.dynamic);
  for (const chip of managed) {
    const home = chip.userData?.phase338WorldHome;
    if (!Array.isArray(home) || home.length !== 3) continue;
    chip.getWorldPosition(tmpB);
    tmpC.fromArray(home);
    if (tmpB.distanceToSquared(tmpC) > 0.0016) setWorldPosition(chip, tmpC);
  }
  if (!managed.length && players[0]?.stack > 0) scheduleSync({ reclaim: state.phase === 'showdown' }, 0);
  const cameraPosition = cameraWorld(tmpA);
  bankrollLabel?.lookAt?.(cameraPosition.x, bankrollLabel.position.y, cameraPosition.z);
}

function scheduleSync(options = {}, delay = 0) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => sync(options), delay);
}

function scheduleReclaim() {
  clearTimeout(reclaimTimer);
  pendingReclaim = true;
  reclaimTimer = setTimeout(() => {
    reclaimAllCommitted();
    scheduleSync({ reclaim: true, animate: false }, 0);
  }, RECLAIM_DELAY);
}

function sync(options = {}) {
  if (!installed) return false;
  determineBasis();
  ensureTray();
  hideLegacyBankLabels();
  const stack = Math.max(0, Math.floor(Number(players[0]?.stack) || 0));
  const handChanged = state.handNo !== lastHand;
  const phaseChanged = state.phase !== lastPhase;
  const reclaim = !!options.reclaim || handChanged;

  if (lastStack != null && stack !== lastStack && options.animate !== false) animateDelta(stack - lastStack);
  if (state.phase === 'showdown' && (phaseChanged || stack !== lastStack)) scheduleReclaim();
  configureInventory(stack, { reclaim });

  lastStack = stack;
  lastHand = state.handNo;
  lastPhase = state.phase;
  window.SVR_PHASE338_STATE = {
    build: BUILD,
    rulesBuild: RULES_BUILD,
    stack,
    visibleValue: visibleInventoryValue(),
    exact,
    pendingReclaim,
    plan: modelPlan,
    syncedAt: new Date().toISOString(),
  };
  return exact;
}

function liveQA() {
  const stack = Math.max(0, Math.floor(Number(players[0]?.stack) || 0));
  const visibleValue = visibleInventoryValue();
  const chips = phase332Chips();
  const heldValue = chips
    .filter((chip) => !chip.userData?.locked && (chip.userData?.held || chip.userData?.dynamic) && chip.visible)
    .reduce((total, chip) => total + Math.max(0, Number(chip.userData?.value) || 0), 0);
  return {
    build: BUILD,
    active: installed,
    rulesBuild: RULES_BUILD,
    handNo: state.handNo,
    phase: state.phase,
    authoritativeStack: stack,
    visibleBankValue: visibleValue,
    heldOrThrownValue: heldValue,
    exact: visibleValue === stack,
    pendingReclaim,
    physicalChipCount: chips.length,
    visibleChipCount: chips.filter((chip) => chip.visible && !chip.userData?.locked && chip.userData?.phase338Managed).length,
    denominationCounts: denominationCounts(),
    plan: modelPlan,
    lastSyncAgeMs: Math.round(performance.now() - lastSyncAt),
    checkedAt: new Date().toISOString(),
  };
}

function automatedQA() {
  const model = runBankrollModelSelfTest();
  const live = liveQA();
  return {
    build: BUILD,
    passed: model.passed && (live.exact || live.pendingReclaim),
    model,
    live,
  };
}

function frame(now) {
  updateAnimations(now);
  enforceLayout();
  requestAnimationFrame(frame);
}

function install() {
  if (installed) return true;
  scene = window.__SVR_SCENE__ || null;
  camera = window.__SVR_CAMERA__ || null;
  renderer = window.__SVR_RENDERER__ || null;
  tableInfo = detectTable();
  if (!scene || !camera || !tableInfo || phase332Chips().length < 20 || !players?.[0]) return false;

  determineBasis();
  ensureTray();
  installed = true;
  hideLegacyBankLabels();
  configureInventory(Math.max(0, Number(players[0].stack) || 0), { reclaim: true });
  lastStack = Math.max(0, Number(players[0].stack) || 0);
  lastHand = state.handNo;
  lastPhase = state.phase;

  window.addEventListener('svr:poker-state', () => scheduleSync({}, 0));
  window.addEventListener('svr:physical-bet-committed', () => scheduleSync({}, 80));
  window.addEventListener('svr:phase337-settlement-complete', () => scheduleSync({ reclaim: true }, 0));
  window.SVR_PHASE338_QA = liveQA;
  window.SVR_PHASE338_AUTOMATED_QA = automatedQA;
  window.SVR_PHASE338_REBUILD = () => sync({ reclaim: true, animate: false });
  window.SVR_PHASE338_BANKROLL_MODEL = (amount) => bankrollPlan(amount);
  window.SVR_PHASE338_STATE = { build: BUILD, active: true, exact };
  document.body?.classList?.add('svr-phase338-bankroll-sync');
  setInterval(enforceLayout, 600);
  requestAnimationFrame(frame);
  return true;
}

let attempts = 0;
const installer = setInterval(() => {
  attempts += 1;
  if (install() || attempts > 80) clearInterval(installer);
}, 125);
setTimeout(install, 0);
setTimeout(install, 450);
setTimeout(install, 1200);

export { BUILD, install, liveQA, automatedQA, sync };
