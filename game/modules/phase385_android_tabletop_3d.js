import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const BUILD = 'PHASE-385-ANDROID-ORIGINAL-TABLETOP-GYRO-UI-LOCK';
const TABLE_URL = './assets/models/table.glb';
const LOGO_URL = '/logo.png';
const state = {
  build: BUILD,
  installed: false,
  tableLoaded: false,
  gyroSupported: 'DeviceOrientationEvent' in window,
  gyroEnabled: false,
  touchLookEnabled: true,
  originalTableUrl: TABLE_URL,
  potAmount: 0,
  lastError: null,
  checkedAt: null
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const surface = document.querySelector('.table-surface');
if (!surface) {
  state.lastError = 'TABLE_SURFACE_NOT_FOUND';
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE385_ANDROID_TABLETOP_STATE = state;
  throw new Error(state.lastError);
}

const stage = document.createElement('div');
stage.id = 'phase385TableStage';
stage.setAttribute('aria-hidden', 'true');
surface.prepend(stage);

const badge = document.createElement('div');
badge.id = 'phase385GyroBadge';
badge.textContent = state.gyroSupported ? '3D TABLE • GYRO READY' : '3D TABLE • TOUCH LOOK';
surface.appendChild(badge);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.45));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
stage.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xa8e8ff, 0x07110d, 1.45));
const key = new THREE.DirectionalLight(0xffe3a8, 2.05);
key.position.set(2.6, 6.5, 3.8);
scene.add(key);
const fill = new THREE.DirectionalLight(0x7ffcff, 1.15);
fill.position.set(-3.8, 3.6, -2.2);
scene.add(fill);

const tableRoot = new THREE.Group();
tableRoot.name = 'PHASE385_ANDROID_ORIGINAL_TABLE_ROOT';
scene.add(tableRoot);

const potGroup = new THREE.Group();
potGroup.name = 'PHASE385_ANDROID_VISIBLE_POT_CHIPS';
scene.add(potGroup);

let tableTopY = 0.05;
let tableObject = null;
let gyroBaseline = null;
let targetYaw = 0;
let targetPitch = 0;
let yaw = 0;
let pitch = 0;
let touchStart = null;
let touchYaw = 0;
let touchPitch = 0;

function normalizeTable(object) {
  object.position.set(0, 0, 0);
  object.rotation.set(0, 0, 0);
  object.scale.setScalar(1);
  object.updateWorldMatrix(true, true);
  let box = new THREE.Box3().setFromObject(object, true);
  let size = box.getSize(new THREE.Vector3());
  if (size.z > size.x) {
    object.rotation.y = Math.PI / 2;
    object.updateWorldMatrix(true, true);
    box = new THREE.Box3().setFromObject(object, true);
    size = box.getSize(new THREE.Vector3());
  }
  const targetWidth = 5.2;
  const targetDepth = 2.78;
  const scale = Math.min(targetWidth / Math.max(size.x, 0.001), targetDepth / Math.max(size.z, 0.001));
  object.scale.setScalar(scale);
  object.updateWorldMatrix(true, true);
  box = new THREE.Box3().setFromObject(object, true);
  const center = box.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;
  object.updateWorldMatrix(true, true);
  box = new THREE.Box3().setFromObject(object, true);
  tableTopY = box.max.y + 0.008;
  object.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = false;
    node.receiveShadow = false;
    node.frustumCulled = false;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material) continue;
      material.side = THREE.DoubleSide;
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
      }
      if ('roughness' in material) material.roughness = Math.max(0.48, Number(material.roughness ?? 0.68));
      if ('metalness' in material) material.metalness = Math.min(0.28, Number(material.metalness ?? 0.08));
      material.needsUpdate = true;
    }
  });
}

function addLogo() {
  const loader = new THREE.TextureLoader();
  loader.load(LOGO_URL, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0.92, side: THREE.DoubleSide });
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.78), material);
    logo.name = 'PHASE385_SVR_FELT_LOGO';
    logo.rotation.x = -Math.PI / 2;
    logo.position.set(0, tableTopY + 0.012, 0.08);
    scene.add(logo);
  }, undefined, () => {});
}

function chipMaterial(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.08 });
}
const chipMaterials = [chipMaterial(0xf6f3e8), chipMaterial(0xd8294f), chipMaterial(0x214fca), chipMaterial(0x111820), chipMaterial(0x39a766)];
const chipGeometry = new THREE.CylinderGeometry(0.075, 0.075, 0.022, 24);

function rebuildPot(amount) {
  state.potAmount = amount;
  while (potGroup.children.length) potGroup.remove(potGroup.children[0]);
  if (amount <= 0) return;
  const stackCount = clamp(Math.ceil(Math.log10(amount + 1) * 1.55), 1, 6);
  const chipsPerStack = clamp(Math.ceil(amount / 350), 3, 11);
  const spacing = 0.19;
  for (let stack = 0; stack < stackCount; stack += 1) {
    const x = (stack - (stackCount - 1) / 2) * spacing;
    const z = -0.38 + ((stack % 2) * 0.09);
    for (let i = 0; i < chipsPerStack; i += 1) {
      const chip = new THREE.Mesh(chipGeometry, chipMaterials[(stack + i) % chipMaterials.length]);
      chip.position.set(x, tableTopY + 0.018 + i * 0.024, z);
      chip.rotation.y = (stack * 0.45 + i * 0.17) % Math.PI;
      potGroup.add(chip);
    }
  }
}

function readPot() {
  const text = document.querySelector('#pot')?.textContent || '';
  const amount = Number(text.replace(/[^0-9.]/g, '')) || 0;
  if (amount !== state.potAmount) rebuildPot(amount);
}

function resize() {
  const rect = stage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height, false);
}

function updateCamera() {
  yaw += (targetYaw + touchYaw - yaw) * 0.07;
  pitch += (targetPitch + touchPitch - pitch) * 0.07;
  const radius = 6.25;
  const baseElevation = 1.02;
  const azimuth = yaw;
  const elevation = baseElevation + pitch;
  camera.position.set(
    Math.sin(azimuth) * radius,
    Math.sin(elevation) * radius,
    Math.cos(azimuth) * radius
  );
  camera.lookAt(0, tableTopY * 0.38, 0.18);
}

function onOrientation(event) {
  const beta = Number(event.beta);
  const gamma = Number(event.gamma);
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return;
  if (!gyroBaseline) gyroBaseline = { beta, gamma };
  targetYaw = clamp((gamma - gyroBaseline.gamma) * 0.0065, -0.22, 0.22);
  targetPitch = clamp((beta - gyroBaseline.beta) * -0.0026, -0.075, 0.075);
  state.gyroEnabled = true;
  badge.textContent = '3D TABLE • GYRO ON';
}

async function enableGyro() {
  try {
    const OrientationEvent = window.DeviceOrientationEvent;
    if (typeof OrientationEvent?.requestPermission === 'function') {
      const result = await OrientationEvent.requestPermission();
      if (result !== 'granted') throw new Error('GYRO_PERMISSION_DENIED');
    }
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    window.addEventListener('svr:deviceorientation', (event) => onOrientation(event.detail || {}));
    state.gyroEnabled = true;
    badge.textContent = '3D TABLE • GYRO ON';
    return true;
  } catch (error) {
    state.lastError = String(error?.message || error);
    badge.textContent = '3D TABLE • TOUCH LOOK';
    return false;
  }
}

function bindTouchLook() {
  surface.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.bot,.board-row,.dealer,.actions,button,a')) return;
    touchStart = { x: event.clientX, y: event.clientY, yaw: touchYaw, pitch: touchPitch };
  }, { passive: true });
  surface.addEventListener('pointermove', (event) => {
    if (!touchStart) return;
    touchYaw = clamp(touchStart.yaw + (event.clientX - touchStart.x) * 0.0016, -0.2, 0.2);
    touchPitch = clamp(touchStart.pitch + (event.clientY - touchStart.y) * 0.001, -0.06, 0.06);
  }, { passive: true });
  const clear = () => { touchStart = null; };
  surface.addEventListener('pointerup', clear, { passive: true });
  surface.addEventListener('pointercancel', clear, { passive: true });
  surface.addEventListener('pointerleave', clear, { passive: true });
}

function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  potGroup.rotation.y += 0.0007;
  renderer.render(scene, camera);
}

new ResizeObserver(resize).observe(surface);
window.addEventListener('resize', resize, { passive: true });
const potNode = document.querySelector('#pot');
if (potNode) new MutationObserver(readPot).observe(potNode, { childList: true, characterData: true, subtree: true });
document.querySelector('#join')?.addEventListener('click', () => {
  enableGyro();
  setTimeout(() => { resize(); readPot(); }, 80);
}, { passive: true });

bindTouchLook();
resize();
updateCamera();
animate();

try {
  const gltf = await new GLTFLoader().loadAsync(TABLE_URL);
  tableObject = gltf.scene || gltf.scenes?.[0];
  if (!tableObject) throw new Error('ORIGINAL_TABLE_GLB_SCENE_MISSING');
  normalizeTable(tableObject);
  tableRoot.add(tableObject);
  addLogo();
  rebuildPot(state.potAmount);
  surface.classList.add('phase385-3d-ready');
  state.tableLoaded = true;
  state.installed = true;
  badge.textContent = state.gyroEnabled ? '3D TABLE • GYRO ON' : '3D TABLE • GYRO READY';
} catch (error) {
  state.lastError = String(error?.stack || error?.message || error);
  badge.textContent = 'TABLE FALLBACK ACTIVE';
}

state.checkedAt = new Date().toISOString();
window.SVR_PHASE385_ANDROID_TABLETOP_STATE = state;
window.SVR_PHASE385_ANDROID_TABLETOP_QA = () => ({
  ...state,
  installed: Boolean(stage.isConnected),
  tableLoaded: Boolean(tableObject),
  originalTableAsset: TABLE_URL,
  logoOnFelt: Boolean(scene.getObjectByName('PHASE385_SVR_FELT_LOGO')),
  potChipMeshes: potGroup.children.length,
  compactSeatCount: document.querySelectorAll('.bot').length,
  communityCardCount: document.querySelectorAll('#community .card').length,
  holeCardCount: document.querySelectorAll('#hole .card').length,
  checkedAt: new Date().toISOString()
});
