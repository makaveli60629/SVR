import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { EricDealerModule } from '../../modules/dealer/eric_dealer_module.js';
import { TableCalibrationModule } from '../../modules/dealer/table_calibration_module.js';
import { WristLabModule } from '../../modules/dealer/wrist_lab_module.js';

const BUILD = 'DEALER-LAB-V1-ERIC-TABLE-WRIST-LOCK';
const app = document.getElementById('app');
const statusEl = document.getElementById('status');
const presetOut = document.getElementById('presetOut');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05030a);
scene.fog = new THREE.FogExp2(0x05030a, 0.035);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.01, 80);
camera.position.set(0, 1.55, 3.65);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.xr.enabled = true;
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, -0.15);
controls.enableDamping = true;
controls.minDistance = 1.2;
controls.maxDistance = 8;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xb995ff, 0x13091d, 2.1));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
keyLight.position.set(2.5, 5, 3.8);
scene.add(keyLight);
const rim = new THREE.PointLight(0x9f55ff, 18, 8, 2);
rim.position.set(-2.2, 2.5, -2.2);
scene.add(rim);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(6, 64),
  new THREE.MeshStandardMaterial({ color: 0x0b0710, roughness: 0.92, metalness: 0.03 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.002;
scene.add(floor);
const grid = new THREE.GridHelper(8, 32, 0x6c3ca2, 0x21142e);
grid.material.transparent = true;
grid.material.opacity = 0.32;
grid.position.y = 0.002;
scene.add(grid);

const dealer = new EricDealerModule(scene);
const table = new TableCalibrationModule(scene);
const wrist = new WristLabModule(renderer, scene);

const cardGroup = new THREE.Group();
cardGroup.name = 'SVR_Lab_DealtCards';
scene.add(cardGroup);
const activeCards = [];
let cardSerial = 0;

function makeCard() {
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(0.063, 0.0025, 0.089),
    [
      new THREE.MeshStandardMaterial({ color: 0xf5f2ed, roughness: 0.52 }),
      new THREE.MeshStandardMaterial({ color: 0xf5f2ed, roughness: 0.52 }),
      new THREE.MeshStandardMaterial({ color: 0xf5f2ed, roughness: 0.52 }),
      new THREE.MeshStandardMaterial({ color: 0xf5f2ed, roughness: 0.52 }),
      new THREE.MeshStandardMaterial({ color: 0xf5f2ed, roughness: 0.52 }),
      new THREE.MeshStandardMaterial({ color: 0x331451, roughness: 0.48 }),
    ]
  );
  card.name = `LabCard_${++cardSerial}`;
  return card;
}

function seatTarget(index, y) {
  const points = [
    [-0.80, 0.42], [-0.98, -0.03], [-0.66, -0.52],
    [0.66, -0.52], [0.98, -0.03], [0.80, 0.42],
  ];
  const [x, z] = points[index % points.length];
  return new THREE.Vector3(x, y, z);
}

function spawnDealCard(seatIndex) {
  const y = table.getSurfaceY();
  const card = makeCard();
  const start = new THREE.Vector3(0.02, y + 0.20, -0.78);
  const end = seatTarget(seatIndex, y + 0.004);
  card.position.copy(start);
  card.rotation.set(0, (seatIndex - 2.5) * 0.09, 0);
  cardGroup.add(card);
  activeCards.push({ card, start, end, born: performance.now() * 0.001, duration: 0.43 });
  while (cardGroup.children.length > 24) cardGroup.remove(cardGroup.children[0]);
}

function updateCards(now) {
  for (let i = activeCards.length - 1; i >= 0; i--) {
    const item = activeCards[i];
    const p = Math.min(1, (now - item.born) / item.duration);
    const s = p * p * (3 - 2 * p);
    item.card.position.lerpVectors(item.start, item.end, s);
    item.card.position.y += Math.sin(Math.PI * s) * 0.11;
    item.card.rotation.z = (1 - s) * 0.16;
    if (p >= 1) activeCards.splice(i, 1);
  }
}

dealer.addEventListener('deal', (event) => spawnDealCard(event.detail.seatIndex));
dealer.addEventListener('modechange', () => refreshStatus());
wrist.addEventListener('action', (event) => {
  if (event.detail.action === 'deal-toggle') {
    if (dealer.mode === 'deal-loop' && !dealer.paused) dealer.togglePause();
    else dealer.setMode('deal-loop');
  }
  if (event.detail.action === 'toggle-guides') table.toggleGuides();
  syncWatch();
  refreshStatus();
});

function syncWatch() {
  wrist.updateStatus(dealer.paused ? 'paused' : dealer.mode, table.guidesVisible);
}

const nativeXRButton = VRButton.createButton(renderer, { optionalFeatures: ['hand-tracking', 'local-floor', 'bounded-floor'] });
nativeXRButton.style.left = '-10000px';
nativeXRButton.style.bottom = '-10000px';
document.body.appendChild(nativeXRButton);
document.getElementById('xrBtn').addEventListener('click', () => nativeXRButton.click());
renderer.xr.addEventListener('sessionstart', () => { controls.enabled = false; refreshStatus(); });
renderer.xr.addEventListener('sessionend', () => { controls.enabled = true; refreshStatus(); });

function setCameraPreset(name) {
  if (renderer.xr.isPresenting) return;
  const presets = {
    front: { p: [0, 1.55, 3.65], t: [0, 1.03, -0.10] },
    hands: { p: [1.38, 1.36, 1.30], t: [0.10, 0.92, -0.55] },
    table: { p: [0, 2.55, 2.40], t: [0, 0.75, -0.10] },
  };
  const preset = presets[name] || presets.front;
  camera.position.fromArray(preset.p);
  controls.target.fromArray(preset.t);
  controls.update();
}

document.getElementById('frontCamBtn').onclick = () => setCameraPreset('front');
document.getElementById('handsCamBtn').onclick = () => setCameraPreset('hands');
document.getElementById('tableCamBtn').onclick = () => setCameraPreset('table');
document.getElementById('idleBtn').onclick = () => { dealer.setMode('idle'); syncWatch(); refreshStatus(); };
document.getElementById('dealOnceBtn').onclick = () => { dealer.setMode('deal-once'); syncWatch(); refreshStatus(); };
document.getElementById('dealLoopBtn').onclick = () => { dealer.setMode('deal-loop'); syncWatch(); refreshStatus(); };
document.getElementById('pauseBtn').onclick = () => { dealer.togglePause(); syncWatch(); refreshStatus(); };
document.getElementById('diagBtn').onclick = () => { table.toggleGuides(); syncWatch(); refreshStatus(); };

const dealerInputs = ['dealerScale','dealerY','dealerZ','shoulderX','shoulderZ','elbowX','wristZ','dealSpeed'];
const tableInputs = ['tableY','feltDrop','innerMargin','collisionDrop','cardLift'];
function number(id) { return Number(document.getElementById(id).value); }
function updateValueLabel(input) {
  const label = document.querySelector(`.val[data-for="${input.id}"]`);
  if (!label) return;
  const n = Number(input.value);
  if (['feltDrop','innerMargin','collisionDrop','cardLift'].includes(input.id)) label.textContent = `${n.toFixed(3)}m / ${(n / 0.0254).toFixed(2)}in`;
  else label.textContent = n.toFixed(input.step?.includes('0001') ? 4 : 2);
}

function applyDealerInputs() {
  dealer.setParams({
    scale: number('dealerScale'), y: number('dealerY'), z: number('dealerZ'),
    shoulderX: number('shoulderX'), shoulderZ: number('shoulderZ'), elbowX: number('elbowX'),
    wristZ: number('wristZ'), speed: number('dealSpeed'),
  });
  refreshPreset();
}
function applyTableInputs() {
  table.setParams({
    tableY: number('tableY'), feltDrop: number('feltDrop'), innerMargin: number('innerMargin'),
    collisionDrop: number('collisionDrop'), cardLift: number('cardLift'),
  });
  refreshPreset();
}

for (const id of dealerInputs) {
  const input = document.getElementById(id);
  updateValueLabel(input);
  input.addEventListener('input', () => { updateValueLabel(input); applyDealerInputs(); });
}
for (const id of tableInputs) {
  const input = document.getElementById(id);
  updateValueLabel(input);
  input.addEventListener('input', () => { updateValueLabel(input); applyTableInputs(); });
}

function getFullPreset() {
  return {
    build: BUILD,
    dealer: { ...dealer.params },
    calibration: table.getPreset(),
    note: 'Lab-only preset. Promote values to production only after visual approval.'
  };
}
function refreshPreset() { presetOut.value = JSON.stringify(getFullPreset(), null, 2); }

document.getElementById('savePresetBtn').onclick = () => {
  table.saveLocal();
  localStorage.setItem('svrDealerLabDealerPresetV1', JSON.stringify(dealer.params));
  refreshPreset();
};
document.getElementById('resetPresetBtn').onclick = () => {
  table.reset();
  localStorage.removeItem('svrDealerLabDealerPresetV1');
  const defaults = { scale:0.0145,y:1.34,z:-1.67,shoulderX:-0.34,shoulderZ:-0.48,elbowX:-0.48,wristZ:-0.26,speed:1.05 };
  dealer.setParams(defaults);
  for (const [id, value] of Object.entries({
    dealerScale:defaults.scale,dealerY:defaults.y,dealerZ:defaults.z,shoulderX:defaults.shoulderX,shoulderZ:defaults.shoulderZ,
    elbowX:defaults.elbowX,wristZ:defaults.wristZ,dealSpeed:defaults.speed,
    tableY:table.params.tableY,feltDrop:table.params.feltDrop,innerMargin:table.params.innerMargin,collisionDrop:table.params.collisionDrop,cardLift:table.params.cardLift
  })) {
    const input = document.getElementById(id); input.value = value; updateValueLabel(input);
  }
  refreshPreset();
};
document.getElementById('copyPresetBtn').onclick = async () => {
  refreshPreset();
  await navigator.clipboard.writeText(presetOut.value).catch(() => {});
};

function restoreDealerPreset() {
  try {
    const saved = JSON.parse(localStorage.getItem('svrDealerLabDealerPresetV1') || 'null');
    if (!saved) return;
    dealer.setParams(saved);
    const map = { dealerScale:'scale',dealerY:'y',dealerZ:'z',shoulderX:'shoulderX',shoulderZ:'shoulderZ',elbowX:'elbowX',wristZ:'wristZ',dealSpeed:'speed' };
    for (const [id, key] of Object.entries(map)) {
      if (saved[key] == null) continue;
      const input = document.getElementById(id); input.value = saved[key]; updateValueLabel(input);
    }
  } catch {}
}
function restoreTableInputs() {
  const map = { tableY:'tableY',feltDrop:'feltDrop',innerMargin:'innerMargin',collisionDrop:'collisionDrop',cardLift:'cardLift' };
  for (const [id, key] of Object.entries(map)) {
    const input = document.getElementById(id); input.value = table.params[key]; updateValueLabel(input);
  }
}

function refreshStatus() {
  const rig = dealer.loaded ? dealer.getRigReport() : null;
  statusEl.textContent = [
    `BUILD ${BUILD}`,
    `Eric: ${dealer.loaded ? 'LOADED + TEXTURED' : 'loading…'}`,
    `Idle clip: ${rig?.mixer ? 'ACTIVE' : dealer.loaded ? 'procedural fallback' : 'waiting'}`,
    `Rig bones: ${rig?.boneCount ?? '…'}`,
    `Mode: ${dealer.paused ? 'PAUSED' : dealer.mode}`,
    `Table: ${table.table ? 'GLB LOADED' : 'loading…'}`,
    `Guides: ${table.guidesVisible ? 'ON' : 'OFF'}`,
    `Card plane Y: ${table.getSurfaceY().toFixed(3)}m`,
    `XR: ${renderer.xr.isPresenting ? 'ACTIVE' : 'desktop'}`,
    `Watch mount: ${wrist.mountedTo ? 'LEFT XR INPUT' : 'waiting for XR left hand/controller'}`,
  ].join('\n');
}

Promise.allSettled([dealer.load(), table.load()]).then((results) => {
  if (results[0].status === 'rejected') console.error('[SVR Dealer Lab] Eric load failed', results[0].reason);
  if (results[1].status === 'rejected') console.error('[SVR Dealer Lab] Table load failed', results[1].reason);
  table.loadLocal();
  restoreTableInputs();
  restoreDealerPreset();
  refreshPreset();
  syncWatch();
  refreshStatus();
});

window.SVR_DEALER_LAB = { BUILD, scene, camera, renderer, dealer, table, wrist, getPreset: getFullPreset };
let previous = performance.now() * 0.001;
let lastStatus = 0;
renderer.setAnimationLoop(() => {
  const now = performance.now() * 0.001;
  const dt = Math.min(0.05, Math.max(0, now - previous));
  previous = now;
  dealer.update(dt, now);
  updateCards(now);
  controls.update();
  renderer.render(scene, camera);
  if (now - lastStatus > 0.6) { lastStatus = now; refreshStatus(); }
});

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
});

refreshPreset();
refreshStatus();
