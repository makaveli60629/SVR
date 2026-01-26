// SVR/js/scarlett1/index.js
// SCARLETT ONE • SVR — Permanent Engine Module (Hands-only VR; Android debug ready)
// RULE: Do not edit HTML. We attach what we need from here.

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { ModuleHub } from './modules/moduleHub.js';
import { createWorld } from './world.js';

let scene, camera, renderer, clock, playerRig;

function el(id) { return document.getElementById(id); }
function setText(id, txt) { const e = el(id); if (e) e.textContent = txt; }

// On-screen log (uses #log if present, otherwise creates one)
function ensureLogPanel() {
  let log = el('log');
  if (!log) {
    log = document.createElement('div');
    log.id = 'log';
    Object.assign(log.style, {
      position: 'absolute',
      left: '10px',
      right: '10px',
      bottom: '90px',
      maxHeight: '28vh',
      overflow: 'auto',
      whiteSpace: 'pre-wrap',
      border: '1px solid #0f0',
      padding: '10px',
      color: '#0f0',
      background: 'rgba(0,20,0,0.65)',
      zIndex: 10,
      pointerEvents: 'none',
      fontFamily: 'monospace'
    });
    document.body.appendChild(log);
  }
  return log;
}

const logEl = ensureLogPanel();
function appendLog(line) {
  const next = (logEl.textContent + "\n" + line).split("\n").slice(-200).join("\n");
  logEl.textContent = next;
  logEl.scrollTop = logEl.scrollHeight;
}

(function hookConsole() {
  const L = console.log.bind(console);
  const W = console.warn.bind(console);
  const E = console.error.bind(console);

  console.log = (...a) => { appendLog("[log] " + a.map(String).join(" ")); L(...a); };
  console.warn = (...a) => { appendLog("[warn] " + a.map(String).join(" ")); W(...a); };
  console.error = (...a) => { appendLog("[err] " + a.map(String).join(" ")); E(...a); };

  window.addEventListener('error', (ev) => appendLog("[window.error] " + (ev.message || "unknown")));
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason?.message || ev.reason || "unhandled";
    appendLog("[promise] " + r);
  });
})();

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Expose for debugging if needed
window.__SCARLETT__ = window.__SCARLETT__ || {};

export function initEngine() {
  setText('status', 'ENGINE INIT…');
  console.log('[boot] engine init… location=', location.href);

  scene = new THREE.Scene();
  clock = new THREE.Clock();

  // PlayerRig = moving group (camera + hands + pads movement)
  playerRig = new THREE.Group();
  scene.add(playerRig);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 2000);
  playerRig.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Build world + register modules
  const ctx = {
    THREE, scene, camera, renderer,
    rig: playerRig,
    setText, log: appendLog
  };

  // Initialize Module Hub
  ModuleHub.init(ctx);

  // Create the base world (also registers modules)
  createWorld(ctx);

  // Wire ENTER VR if button exists in HTML
  const btn = el('entervr');
  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        if (!navigator.xr) {
          console.warn('WebXR not available in this browser.');
          return;
        }
        const current = renderer.xr.getSession();
        if (current) {
          await current.end();
          return;
        }
        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['hand-tracking', 'local-floor', 'bounded-floor', 'layers']
        });
        renderer.xr.setSession(session);
        console.log('[xr] session started');
      } catch (err) {
        console.error('[xr] failed:', err);
      }
    });
  }

  window.addEventListener('resize', onResize);

  renderer.setAnimationLoop(() => {
    const dt = Math.max(1e-6, clock.getDelta());
    const fps = Math.round(1 / dt);

    setText('fps-val', String(fps));
    const p = playerRig.position;
    setText('pos-val', `${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);

    // Tick all modules
    ModuleHub.update(dt);

    renderer.render(scene, camera);
  });

  // Expose internals
  window.__SCARLETT__.scene = scene;
  window.__SCARLETT__.renderer = renderer;
  window.__SCARLETT__.camera = camera;
  window.__SCARLETT__.rig = playerRig;

  setText('status', 'LINKED');
  console.log('[boot] engine init complete ✅');
}

// Auto-start if HTML doesn’t call initEngine()
// (Safe: if HTML already calls it, nothing breaks)
if (!window.__SCARLETT_ENGINE_STARTED__) {
  window.__SCARLETT_ENGINE_STARTED__ = true;
  // slight defer to ensure DOM exists
  window.addEventListener('load', () => {
    try { initEngine(); } catch (e) { console.error('initEngine crash:', e); }
  });
}
