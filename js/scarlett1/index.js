// SCARLETT ONE v4.0.5 — Engine (VR/js/scarlett1/index.js)
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { createWorld, updateWorld } from './world.js?v=1769389851';

const __logEl = () => document.getElementById('log');
function __append(line) {
  const el = __logEl();
  if (!el) return;
  el.textContent = (el.textContent + "\n" + line).split("\n").slice(-140).join("\n");
}
(function hookConsole() {
  const l = console.log.bind(console), w = console.warn.bind(console), e = console.error.bind(console);
  console.log = (...a) => { __append('[log] ' + a.map(String).join(' ')); l(...a); };
  console.warn = (...a) => { __append('[warn] ' + a.map(String).join(' ')); w(...a); };
  console.error = (...a) => { __append('[err] ' + a.map(String).join(' ')); e(...a); };
  window.addEventListener('error', (ev) => __append('[window.error] ' + (ev.message || ev.error || 'unknown')));
  window.addEventListener('unhandledrejection', (ev) => __append('[promise] ' + (ev.reason?.message || ev.reason || 'unhandled')));
})();

let scene, camera, renderer, clock, playerGroup;

export function initEngine() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  playerGroup = new THREE.Group();
  scene.add(playerGroup);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 2000);
  playerGroup.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  renderer.xr.enabled = false; // debug first, VR on button

  document.body.appendChild(renderer.domElement);

  createWorld(scene, camera, renderer, playerGroup);

  const btn = document.getElementById('entervr');
  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        const current = renderer.xr.getSession();
        if (current) {
          await current.end();
          renderer.xr.enabled = false;
          return;
        }
        if (!navigator.xr) {
          console.warn('WebXR not available in this browser.');
          return;
        }
        renderer.xr.enabled = true;

        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['hand-tracking', 'local-floor', 'bounded-floor', 'layers']
        });

        session.addEventListener('end', () => {
          renderer.xr.enabled = false;
        });

        renderer.xr.setSession(session);
      } catch (err) {
        console.error('XR Error:', err);
      }
    });
  }

  window.addEventListener('resize', onResize);
  renderer.setAnimationLoop(render);

  console.log('[engine] init complete');
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  const delta = Math.max(1e-6, clock.getDelta());
  const fps = Math.round(1 / delta);

  const fpsEl = document.getElementById('fps-val');
  if (fpsEl) fpsEl.innerText = fps;

  const p = playerGroup.position;
  const posEl = document.getElementById('pos-val');
  if (posEl) posEl.innerText = `${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`;

  updateWorld(delta, playerGroup);
  renderer.render(scene, camera);
}
