import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { account } from '/site/js/phase345-demo-activity-persistence.js?v=phase353';

const BUILD = 'PHASE-353-VR-AVATAR-DRESSING-ROOM-LIVE-PEDESTAL-LOCK';
const canvas = document.getElementById('avatarVrCanvas');
const statusLabel = document.getElementById('roomStatus');
const fallback = document.getElementById('fallback');
const fallbackText = document.getElementById('fallbackText');
const avatarName = document.getElementById('avatarName');
const avatarMode = document.getElementById('avatarMode');
const presetButtons = [...document.querySelectorAll('[data-preset]')];

let catalog = null;
let presetIndex = 0;
let profile = null;
let currentOutfit = null;
let avatarRoot = null;
let modelRoot = null;
let equipmentRoot = null;
let pedestalRoot = null;
let pedestalRing = null;
let rotating = true;
let loadError = null;
let frames = 0;
let lastFrame = performance.now();
let fps = 0;
let controllers = [];
let selectorMeshes = [];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050d);
scene.fog = new THREE.FogExp2(0x03050d, 0.035);
const camera = new THREE.PerspectiveCamera(52, 1, 0.05, 60);
camera.position.set(0, 1.65, 4.2);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.xr.enabled = true;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
renderer.shadowMap.enabled = false;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2.2;
controls.maxDistance = 6.2;
controls.target.set(0, 1.0, 0);

function setStatus(text, error = false) {
  if (statusLabel) statusLabel.textContent = text;
  if (fallbackText) fallbackText.textContent = text;
  if (error) loadError = text;
}
function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: options.roughness ?? .45, metalness: options.metalness ?? .18, emissive: options.emissive || 0x000000, emissiveIntensity: options.emissiveIntensity ?? 0, transparent: options.transparent ?? false, opacity: options.opacity ?? 1, side: THREE.DoubleSide });
}
function mesh(geometry, mat, name) {
  const item = new THREE.Mesh(geometry, mat); item.name = name; item.castShadow = false; item.receiveShadow = false; return item;
}
function dispose(root) {
  root?.traverse?.((object) => {
    object.geometry?.dispose?.();
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.filter(Boolean).forEach((item) => item.dispose?.());
  });
}
function canvasTexture(title, subtitle, accent = '#7ffcff') {
  const source = document.createElement('canvas'); source.width = 1024; source.height = 420;
  const context = source.getContext('2d');
  context.fillStyle = '#071020'; context.fillRect(0, 0, source.width, source.height);
  context.strokeStyle = accent; context.lineWidth = 14; context.strokeRect(18, 18, source.width - 36, source.height - 36);
  context.textAlign = 'center'; context.fillStyle = '#fff'; context.font = '900 86px system-ui'; context.fillText(title, source.width / 2, 190);
  context.fillStyle = accent; context.font = '900 42px system-ui'; context.fillText(subtitle, source.width / 2, 280);
  const texture = new THREE.CanvasTexture(source); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function buildRoom() {
  scene.add(new THREE.HemisphereLight(0xcffbff, 0x16051f, 1.65));
  const ambient = new THREE.AmbientLight(0x677da6, .62); scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 4); scene.add(key);
  const fill = new THREE.PointLight(0x7ffcff, 4.3, 10); fill.position.set(-3.2, 2.2, 1.5); scene.add(fill);
  const rim = new THREE.PointLight(0x9a5cff, 4.4, 10); rim.position.set(3.1, 2.4, -2.2); scene.add(rim);
  const gold = new THREE.PointLight(0xffd98a, 2.8, 8); gold.position.set(0, 1.1, 2.6); scene.add(gold);

  const floor = mesh(new THREE.PlaneGeometry(18, 18), material(0x05070e, { roughness: .34, metalness: .55 }), 'PHASE353_DRESSING_ROOM_FLOOR');
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.16; scene.add(floor);
  const back = mesh(new THREE.BoxGeometry(10, 5.5, .18), material(0x0a0e1b, { roughness: .72 }), 'PHASE353_BACK_WALL'); back.position.set(0, 2.5, -4.2); scene.add(back);
  for (const side of [-1, 1]) {
    const wall = mesh(new THREE.BoxGeometry(.16, 5.5, 8.4), material(0x080c17, { roughness: .68 }), `PHASE353_SIDE_WALL_${side}`); wall.position.set(side * 5, 2.5, -.1); scene.add(wall);
    const strip = mesh(new THREE.BoxGeometry(.035, 4.4, .035), new THREE.MeshBasicMaterial({ color: side < 0 ? 0x7ffcff : 0x9a5cff, toneMapped: false }), `PHASE353_WALL_STRIP_${side}`); strip.position.set(side * 4.88, 2.4, 0); scene.add(strip);
  }
  for (let z = -3; z <= 3; z += .75) {
    const line = mesh(new THREE.BoxGeometry(9, .008, .012), new THREE.MeshBasicMaterial({ color: 0x19364b, toneMapped: false }), 'PHASE353_FLOOR_GRID'); line.position.set(0, -.145, z); scene.add(line);
  }
  for (let x = -4.5; x <= 4.5; x += .75) {
    const line = mesh(new THREE.BoxGeometry(.012, .008, 7.4), new THREE.MeshBasicMaterial({ color: 0x19364b, toneMapped: false }), 'PHASE353_FLOOR_GRID'); line.position.set(x, -.145, .1); scene.add(line);
  }

  const logo = mesh(new THREE.PlaneGeometry(4.2, 1.7), new THREE.MeshBasicMaterial({ map: canvasTexture('SVR POKER', 'VR AVATAR DRESSING ROOM', '#ffd98a'), transparent: true, toneMapped: false }), 'PHASE353_WALL_LOGO');
  logo.position.set(0, 3.05, -4.08); scene.add(logo);

  pedestalRoot = new THREE.Group(); pedestalRoot.name = 'PHASE353_MOVING_PEDESTAL_ROOT'; scene.add(pedestalRoot);
  const base = mesh(new THREE.CylinderGeometry(1.35, 1.55, .24, 64), material(0x090d18, { roughness: .26, metalness: .72 }), 'PHASE353_PEDESTAL_BASE'); base.position.y = -.03; pedestalRoot.add(base);
  const top = mesh(new THREE.CylinderGeometry(1.22, 1.30, .10, 64), material(0x11182a, { roughness: .22, metalness: .55 }), 'PHASE353_PEDESTAL_TOP'); top.position.y = .13; pedestalRoot.add(top);
  pedestalRing = mesh(new THREE.TorusGeometry(1.18, .025, 12, 120), new THREE.MeshBasicMaterial({ color: 0x7ffcff, toneMapped: false }), 'PHASE353_PEDESTAL_RING'); pedestalRing.rotation.x = Math.PI / 2; pedestalRing.position.y = .195; pedestalRoot.add(pedestalRing);
  const ring2 = mesh(new THREE.TorusGeometry(1.42, .012, 8, 120), new THREE.MeshBasicMaterial({ color: 0xffd98a, toneMapped: false }), 'PHASE353_PEDESTAL_OUTER_RING'); ring2.rotation.x = Math.PI / 2; ring2.position.y = .01; pedestalRoot.add(ring2);

  avatarRoot = new THREE.Group(); avatarRoot.name = 'PHASE353_AVATAR_ROOT'; avatarRoot.position.y = .20; pedestalRoot.add(avatarRoot);
  equipmentRoot = new THREE.Group(); equipmentRoot.name = 'PHASE353_EQUIPMENT_ROOT'; avatarRoot.add(equipmentRoot);

  buildSelectorPanels();
  setupControllers();
}
function buildSelectorPanels() {
  const labels = ['TABLE READY', 'SCORPION VIP', 'FOUNDER', 'SOCIAL LOUNGE'];
  const accents = ['#7ffcff', '#ff5d86', '#ffd98a', '#ad78ff'];
  selectorMeshes = labels.map((label, index) => {
    const panel = mesh(new THREE.PlaneGeometry(1.45, .52), new THREE.MeshBasicMaterial({ map: canvasTexture(label, `PRESET ${index + 1}`, accents[index]), toneMapped: false }), `PHASE353_PRESET_PANEL_${index}`);
    panel.position.set(index % 2 === 0 ? -2.55 : 2.55, index < 2 ? 1.8 : .95, -3.95);
    panel.userData.presetIndex = index;
    scene.add(panel);
    return panel;
  });
}
function setupControllers() {
  const rayGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -4)]);
  for (let index = 0; index < 2; index++) {
    const controller = renderer.xr.getController(index);
    const line = new THREE.Line(rayGeometry, new THREE.LineBasicMaterial({ color: 0x7ffcff }));
    controller.add(line);
    controller.addEventListener('select', () => selectFromController(controller));
    scene.add(controller);
    controllers.push(controller);
  }
}
function selectFromController(controller) {
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3(); const direction = new THREE.Vector3(0, 0, -1);
  controller.getWorldPosition(origin); direction.applyQuaternion(controller.getWorldQuaternion(new THREE.Quaternion())).normalize();
  raycaster.set(origin, direction);
  const hit = raycaster.intersectObjects(selectorMeshes, false)[0];
  if (hit) applyPreset(hit.object.userData.presetIndex);
  else applyPreset((presetIndex + 1) % 4);
}
function createFallbackAvatar() {
  const root = new THREE.Group(); root.name = 'PHASE353_FALLBACK_AVATAR';
  const skin = material(0xc8b19f, { roughness: .68 });
  const body = material(0x11172a, { roughness: .45, metalness: .08 });
  const torso = mesh(new THREE.CapsuleGeometry(.28, .66, 8, 18), body, 'fallback-torso'); torso.position.y = 1.03; torso.scale.z = .72; root.add(torso);
  const head = mesh(new THREE.SphereGeometry(.21, 24, 18), skin, 'fallback-head'); head.position.y = 1.72; head.scale.z = .86; root.add(head);
  for (const side of [-1, 1]) {
    const arm = mesh(new THREE.CapsuleGeometry(.08, .55, 6, 14), body, `fallback-arm-${side}`); arm.position.set(side * .37, 1.08, 0); arm.rotation.z = side * .10; root.add(arm);
    const leg = mesh(new THREE.CapsuleGeometry(.10, .67, 6, 14), body, `fallback-leg-${side}`); leg.position.set(side * .14, .36, 0); root.add(leg);
  }
  return root;
}
async function loadBody(model) {
  if (modelRoot) { avatarRoot.remove(modelRoot); dispose(modelRoot); modelRoot = null; }
  try {
    const loaded = model.format === 'fbx' ? await new FBXLoader().loadAsync(model.assetUrl) : await new GLTFLoader().loadAsync(model.assetUrl);
    const root = model.format === 'fbx' ? loaded : loaded.scene || loaded.scenes?.[0];
    if (!root) throw new Error('AVATAR_SCENE_MISSING');
    root.updateWorldMatrix(true, true);
    let box = new THREE.Box3().setFromObject(root); const height = Math.max(.001, box.max.y - box.min.y);
    root.scale.setScalar(Number(model.targetHeightMeters || 1.72) / height);
    root.updateWorldMatrix(true, true); box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3()); root.position.x -= center.x; root.position.z -= center.z; root.position.y -= box.min.y;
    root.traverse((object) => { if (!object.isMesh || !object.material) return; const source = Array.isArray(object.material) ? object.material : [object.material]; const cloned = source.map((mat) => { const copy = mat.clone(); copy.side = THREE.DoubleSide; copy.roughness = Math.max(.42, copy.roughness ?? .6); copy.needsUpdate = true; return copy; }); object.material = Array.isArray(object.material) ? cloned : cloned[0]; object.frustumCulled = false; });
    modelRoot = root;
  } catch (error) {
    loadError = String(error?.message || error); modelRoot = createFallbackAvatar();
  }
  avatarRoot.add(modelRoot);
}
function clearEquipment() {
  while (equipmentRoot.children.length) { const item = equipmentRoot.children.pop(); dispose(item); }
}
function buildEquipment(outfit, palette) {
  clearEquipment();
  const primary = material(palette.primary || 0x11172a, { roughness: .42 });
  const accent = new THREE.MeshBasicMaterial({ color: palette.secondary || 0x7ffcff, toneMapped: false });
  const metal = material(palette.metal || 0xb9c7d8, { roughness: .18, metalness: .82 });
  if (outfit.top && outfit.top !== 'none') {
    const jacket = mesh(new THREE.BoxGeometry(.55, .64, .28), primary, 'PHASE353_TOP'); jacket.position.set(0, 1.05, -.02); equipmentRoot.add(jacket);
  }
  if (outfit.headwear === 'cap') {
    const cap = mesh(new THREE.SphereGeometry(.22, 28, 14, 0, Math.PI * 2, 0, Math.PI * .58), primary, 'PHASE353_CAP'); cap.position.y = 1.92; equipmentRoot.add(cap);
  } else if (outfit.headwear === 'crown') {
    const crown = mesh(new THREE.CylinderGeometry(.22, .22, .12, 20, 1, true), metal, 'PHASE353_CROWN'); crown.position.y = 1.95; equipmentRoot.add(crown);
  }
  if (outfit.eyewear && outfit.eyewear !== 'none') {
    const visor = mesh(new THREE.BoxGeometry(.38, .11, .04), accent, 'PHASE353_EYEWEAR'); visor.position.set(0, 1.72, .19); equipmentRoot.add(visor);
  }
  if (outfit.accessory === 'badge') {
    const badge = mesh(new THREE.CylinderGeometry(.065, .065, .018, 24), metal, 'PHASE353_BADGE'); badge.rotation.x = Math.PI / 2; badge.position.set(.16, 1.2, .19); equipmentRoot.add(badge);
  }
}
async function applyPreset(index) {
  if (!catalog) return;
  presetIndex = Math.max(0, Math.min(3, Number(index) || 0));
  const preset = catalog.presets[presetIndex] || catalog.presets[0];
  currentOutfit = { schemaVersion: 1, ...preset.outfit };
  const model = catalog.avatarModels.find((item) => item.id === currentOutfit.modelId) || catalog.avatarModels[0];
  const palette = catalog.palettes.find((item) => item.id === currentOutfit.palette) || catalog.palettes[0];
  setStatus(`Loading ${preset.label}…`);
  await loadBody(model);
  modelRoot?.traverse?.((object) => { if (!object.isMesh || !object.material) return; const list = Array.isArray(object.material) ? object.material : [object.material]; list.forEach((mat) => { if (mat.color) mat.color.set(palette.bodyTint || '#d8dbe4'); }); });
  buildEquipment(currentOutfit, palette);
  presetButtons.forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === presetIndex));
  selectorMeshes.forEach((panel, panelIndex) => panel.scale.setScalar(panelIndex === presetIndex ? 1.08 : 1));
  if (avatarName) avatarName.textContent = preset.label.toUpperCase();
  setStatus(`${preset.label} ready • pedestal moving • select Save Avatar to keep it.`);
  fallback?.classList.add('hidden');
  window.SVR_PHASE353_STATE = snapshot();
}
async function saveCurrent() {
  if (!currentOutfit || !catalog) return;
  const model = catalog.avatarModels.find((item) => item.id === currentOutfit.modelId) || catalog.avatarModels[0];
  const avatarUrl = new URL(model.assetUrl, location.origin).href;
  try {
    await account.updateProfile({ avatarUrl, equippedOutfit: currentOutfit });
    setStatus('Avatar saved to the same profile used by the website and game.');
  } catch (error) {
    setStatus(`Could not save avatar: ${error.message}`, true);
  }
}
function snapshot() {
  return { build: BUILD, ready: Boolean(modelRoot), presetIndex, preset: catalog?.presets?.[presetIndex]?.id || null, rotating, xrPresenting: renderer.xr.isPresenting, modelFallback: modelRoot?.name === 'PHASE353_FALLBACK_AVATAR', frames, fps, loadError, checkedAt: new Date().toISOString() };
}
function resize() {
  const width = Math.max(1, canvas.clientWidth || innerWidth); const height = Math.max(1, canvas.clientHeight || innerHeight);
  renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
}
function animate(time) {
  controls.enabled = !renderer.xr.isPresenting; controls.update();
  const seconds = time * .001;
  if (pedestalRoot && rotating) pedestalRoot.rotation.y += renderer.xr.isPresenting ? .0025 : .0035;
  if (pedestalRoot) pedestalRoot.position.y = Math.sin(seconds * 1.35) * .018;
  if (pedestalRing) pedestalRing.rotation.z = -seconds * .35;
  if (modelRoot) modelRoot.rotation.y = Math.sin(seconds * .55) * .035;
  renderer.render(scene, camera);
  frames += 1;
  if (time - lastFrame > 1000) { fps = Math.round(frames * 1000 / (time - lastFrame)); frames = 0; lastFrame = time; window.SVR_PHASE353_STATE = snapshot(); }
}
async function boot() {
  buildRoom();
  resize();
  addEventListener('resize', resize, { passive: true });
  document.body.appendChild(VRButton.createButton(renderer));
  renderer.setAnimationLoop(animate);
  await account.bootstrap();
  profile = account.snapshot().profile;
  if (avatarMode) avatarMode.textContent = account.snapshot().mode === 'api' ? 'DATABASE PROFILE' : 'LOCAL DEMO PROFILE';
  const response = await fetch('/site/data/avatar-catalog.json?v=phase353', { cache: 'no-store' });
  if (!response.ok) throw new Error(`AVATAR_CATALOG_${response.status}`);
  catalog = await response.json();
  const saved = profile?.equippedOutfit || {};
  const savedIndex = Math.max(0, catalog.presets.findIndex((item) => JSON.stringify(item.outfit) === JSON.stringify({ ...saved, schemaVersion: undefined })));
  await applyPreset(savedIndex >= 0 ? savedIndex : 0);
}
presetButtons.forEach((button) => button.addEventListener('click', () => applyPreset(Number(button.dataset.preset))));
document.getElementById('togglePedestal')?.addEventListener('click', (event) => { rotating = !rotating; event.currentTarget.textContent = rotating ? 'Pause Pedestal' : 'Move Pedestal'; });
document.getElementById('resetView')?.addEventListener('click', () => { camera.position.set(0, 1.65, 4.2); controls.target.set(0, 1, 0); controls.update(); if (pedestalRoot) pedestalRoot.rotation.set(0, 0, 0); });
document.getElementById('saveAvatar')?.addEventListener('click', saveCurrent);
window.SVR_PHASE353_QA = () => ({ ...snapshot(), pass: Boolean(modelRoot && pedestalRoot && selectorMeshes.length === 4 && controllers.length === 2) });
window.SVR_PHASE353_APPLY_PRESET = applyPreset;
window.SVR_PHASE353_SAVE = saveCurrent;
window.SVR_PHASE353_TOGGLE_PEDESTAL = () => (rotating = !rotating);
boot().catch((error) => { setStatus(`3D room fallback active: ${error.message}`, true); renderer.setAnimationLoop(animate); });
