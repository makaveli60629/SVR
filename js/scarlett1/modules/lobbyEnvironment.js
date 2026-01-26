// ============================================================================
// ✅ SCARLETT ONE • SVR — PERMANENT SPINE MODULE (DO NOT DELETE / DO NOT RENAME)
// File: SVR/js/scarlett1/index.js
// Purpose: Engine bootstrap + module hub + Android debug logging
// Rules: Hands-only VR. Do NOT edit HTML. World building lives in world.js.
// ============================================================================

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { ModuleHub } from './modules/moduleHub.js';
import { createWorld } from './world.js';

let scene, camera, renderer, clock, playerRig;

function el(id) { return document.getElementById(id); }
function setText(id, txt) { const e = el(id); if (e) e.textContent = txt; }

// ---------- On-screen log panel ----------
let logEl = null;
let logVisible = false;

function ensureLogPanel() {
  if (logEl) return logEl;
  logEl = el('log');

  // If HTML doesn't have one, create it (but default hidden)
  if (!logEl) {
    logEl = document.createElement('div');
    logEl.id = 'log';
    Object.assign(logEl.style, {
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
      fontFamily: 'monospace',
      display: 'none'
    });
    document.body.appendChild(logEl);
  }

  return logEl;
}

function setLogVisible(v) {
  logVisible = !!v;
  const p = ensureLogPanel();
  p.style.display = logVisible ? 'block' : 'none';
}

function appendLog(line) {
  const p = ensureLogPanel();
  const next = (p.textContent + "\n" + line).split("\n").slice(-220).join("\n");
  p.textContent = next;
  p.scrollTop = p.scrollHeight;
}

// Console hook (still captures logs even if panel is hidden)
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

  // Default: log panel hidden so it never blocks UI
  setLogVisible(false);

  // Toggle log: 3-finger tap (mobile) OR press "L" (desktop)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyL') setLogVisible(!logVisible);
  });

  let touchCount = 0;
  let touchTimer = null;
  window.addEventListener('touchstart', (e) => {
    if ((e.touches?.length || 0) >= 3) {
      touchCount++;
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => { touchCount = 0; }, 600);
      if (touchCount >= 1) {
        setLogVisible(!logVisible);
        touchCount = 0;
      }
    }
  }, { passive: true });

  const ctx = {
    THREE, scene, camera, renderer,
    rig: playerRig,
    setText, log: appendLog,
    ui: { setLogVisible }
  };

  // Initialize Module Hub
  ModuleHub.init(ctx);

  // Create world + register modules
  createWorld(ctx);

  // Wire VR button
  const btn = el('entervr') || el('initializevr');
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

    ModuleHub.update(dt);
    renderer.render(scene, camera);
  });

  window.__SCARLETT__.scene = scene;
  window.__SCARLETT__.renderer = renderer;
  window.__SCARLETT__.camera = camera;
  window.__SCARLETT__.rig = playerRig;

  setText('status', 'ACTIVE');
  console.log('[boot] engine init complete ✅');
}

// Auto-start safeguard
if (!window.__SCARLETT_ENGINE_STARTED__) {
  window.__SCARLETT_ENGINE_STARTED__ = true;
  window.addEventListener('load', () => {
    try { initEngine(); } catch (e) { console.error('initEngine crash:', e); }
  });
                                                       }
