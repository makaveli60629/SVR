/* PHASE-438-CAMERA3-LOBBY-DIRECTOR */
import * as THREE from 'three';

export const BUILD = 'PHASE-438-CAMERA3-LOBBY-DIRECTOR';

const state = {
  build: BUILD,
  installed: false,
  moduleReady: false,
  cameraReady: false,
  lightingReady: false,
  shotIndex: 0,
  frames: 0,
  lastError: null,
  checkedAt: null
};

let camera = null;
let scene = null;
let renderer = null;
let moduleRuntime = null;
let lightRig = null;
let raf = 0;
let shotStart = performance.now();
const from = new THREE.Vector3();
const to = new THREE.Vector3();
const lookFrom = new THREE.Vector3();
const lookTo = new THREE.Vector3();
const lookNow = new THREE.Vector3();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function anchor() {
  const a = moduleRuntime?.anchor || { x: 0, z: 0.75 };
  return new THREE.Vector3(Number(a.x || 0), 0, Number(a.z || 0.75));
}

function tableTarget() {
  const a = anchor();
  return new THREE.Vector3(a.x, 0.70, a.z + 0.10);
}

function shots() {
  const a = anchor();
  return [
    {
      pos: new THREE.Vector3(a.x, 1.80, a.z - 4.25),
      look: new THREE.Vector3(a.x, 0.72, a.z + 0.12)
    },
    {
      pos: new THREE.Vector3(a.x - 3.45, 1.95, a.z - 2.35),
      look: new THREE.Vector3(a.x + 0.05, 0.75, a.z + 0.18)
    },
    {
      pos: new THREE.Vector3(a.x + 3.65, 2.20, a.z - 2.10),
      look: new THREE.Vector3(a.x - 0.05, 0.72, a.z + 0.15)
    },
    {
      pos: new THREE.Vector3(a.x + 2.55, 1.72, a.z + 3.20),
      look: new THREE.Vector3(a.x - 0.12, 0.78, a.z + 0.10)
    }
  ];
}

function selectShot(index, immediate = false) {
  const list = shots();
  state.shotIndex = ((index % list.length) + list.length) % list.length;
  from.copy(camera.position);
  lookFrom.copy(lookNow.lengthSq() ? lookNow : tableTarget());
  to.copy(list[state.shotIndex].pos);
  lookTo.copy(list[state.shotIndex].look);
  shotStart = performance.now();
  if (immediate) {
    camera.position.copy(to);
    lookNow.copy(lookTo);
    camera.lookAt(lookNow);
  }
}

function installDirectorLights() {
  lightRig?.removeFromParent?.();
  const a = anchor();
  lightRig = new THREE.Group();
  lightRig.name = 'PHASE438_CAMERA3_DIRECTOR_LIGHTS';
  const front = new THREE.DirectionalLight(0xfff4e6, 1.05);
  const side = new THREE.DirectionalLight(0xa9e7ff, 0.75);
  const accent = new THREE.PointLight(0xa85dff, 1.45, 8.0, 1.8);
  front.position.set(a.x + 2.8, 3.2, a.z - 2.7);
  front.target.position.set(a.x, 0.75, a.z);
  side.position.set(a.x - 3.0, 2.4, a.z - 0.6);
  side.target.position.set(a.x, 0.8, a.z + 0.4);
  accent.position.set(a.x, 1.55, a.z + 2.4);
  lightRig.add(front, front.target, side, side.target, accent);
  scene.add(lightRig);
  state.lightingReady = true;
}

function tuneRenderer() {
  if (!renderer) return;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(Math.min(1.35, window.devicePixelRatio || 1));
}

function frame(now) {
  if (!state.installed) return;
  try {
    if (now - shotStart > 9000) selectShot(state.shotIndex + 1);
    const t = Math.min(1, (now - shotStart) / 1750);
    const smooth = t * t * (3 - 2 * t);
    camera.position.lerpVectors(from, to, smooth);
    lookNow.lerpVectors(lookFrom, lookTo, smooth);
    camera.lookAt(lookNow);
    camera.updateProjectionMatrix();
    state.frames += 1;
  } catch (error) {
    state.lastError = String(error?.message || error);
  }
  raf = requestAnimationFrame(frame);
}

async function install() {
  const started = performance.now();
  while (performance.now() - started < 30000) {
    scene = window.__SVR_SCENE__ || scene;
    camera = window.__SVR_CAMERA__ || camera;
    renderer = window.__SVR_RENDERER__ || renderer;
    moduleRuntime = window.SVR_LOBBY_DEALER_MODULE || moduleRuntime;
    if (scene && camera && renderer && moduleRuntime?.table && moduleRuntime?.dealer) break;
    await wait(100);
  }
  if (!scene || !camera || !renderer || !moduleRuntime) throw new Error('PHASE438_CAMERA3_RUNTIME_NOT_READY');

  state.moduleReady = true;
  tuneRenderer();
  installDirectorLights();
  camera.fov = 48;
  camera.near = Math.min(camera.near || 0.1, 0.05);
  camera.far = Math.max(camera.far || 100, 140);
  lookNow.copy(tableTarget());
  selectShot(0, true);
  state.cameraReady = true;
  state.installed = true;
  state.checkedAt = new Date().toISOString();
  document.body.classList.add('phase438-camera3-ready');

  // Camera 3 is a presentation feed: Eric should demonstrate the dealer motion.
  moduleRuntime.dealLoop?.();
  raf = requestAnimationFrame(frame);
  window.dispatchEvent(new CustomEvent('svr:phase438-camera3-ready', { detail: qa() }));
  return true;
}

function qa() {
  return {
    ...state,
    dealerModule: window.SVR_PHASE438_QA?.() || null,
    cameraPosition: camera?.position?.toArray?.() || null,
    pass: Boolean(state.installed && state.moduleReady && state.cameraReady && state.lightingReady && !state.lastError),
    checkedAt: new Date().toISOString()
  };
}

window.SVR_PHASE438_CAMERA3_QA = qa;
window.SVR_PHASE438_CAMERA3_SELECT_SHOT = (index) => selectShot(Number(index || 0), false);

install().catch((error) => {
  state.lastError = String(error?.stack || error?.message || error);
  state.checkedAt = new Date().toISOString();
});

addEventListener('beforeunload', () => {
  if (raf) cancelAnimationFrame(raf);
}, { once: true });
