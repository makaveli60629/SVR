// SCARLETT ONE — Permanent Spine Module (SVR/js/scarlett1/index.js)
// RULES: Hands-only. Do not touch HTML. World building lives in world.js.

import * as THREE from 'three';
import { createWorld, updateWorld } from './world.js';

let scene, camera, renderer, clock, playerGroup;

function getEl(id) { return document.getElementById(id); }
function setText(id, txt) { const el = getEl(id); if (el) el.innerText = txt; }

// Optional on-screen log panel (if your HTML provides it)
function appendLog(line) {
  const el = getEl('log');
  if (!el) return;
  const next = (el.textContent + "\n" + line).split("\n").slice(-160).join("\n");
  el.textContent = next;
  el.scrollTop = el.scrollHeight;
}

(function hookConsole() {
  const L = console.log.bind(console);
  const W = console.warn.bind(console);
  const E = console.error.bind(console);

  console.log = (...a) => { appendLog("[log] " + a.map(String).join(" ")); L(...a); };
  console.warn = (...a) => { appendLog("[warn] " + a.map(String).join(" ")); W(...a); };
  console.error = (...a) => { appendLog("[err] " + a.map(String).join(" ")); E(...a); };

  window.addEventListener('error', (ev) => {
    appendLog("[window.error] " + (ev.message || ev.error || "unknown"));
  });
  window.addEventListener('unhandledrejection', (ev) => {
    appendLog("[promise] " + (ev.reason?.message || ev.reason || "unhandled"));
  });
})();

export function initEngine() {
  // --- Scene ---
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  // --- Player Rig (camera + hands move together) ---
  playerGroup = new THREE.Group();
  scene.add(playerGroup);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.05,
    2000
  );
  playerGroup.add(camera);

  // --- Renderer ---
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // IMPORTANT: keep XR disabled until the user presses ENTER VR
  // (Android/desktop should still render world for debugging)
  renderer.xr.enabled = false;

  document.body.appendChild(renderer.domElement);

  // --- World (ALL environment building lives here) ---
  createWorld(scene, camera, renderer, playerGroup);

  // --- VR Button (hands-only) ---
  const btn = getEl('entervr');
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
          console.warn("WebXR not available in this browser.");
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
        console.error("XR Error:", err);
      }
    });
  }

  // --- Resize ---
  window.addEventListener('resize', onResize);

  // --- Animate ---
  renderer.setAnimationLoop(render);

  // HUD status (if present)
  setText('status', 'LINKED');
  console.log("[engine] init complete");
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  const delta = Math.max(1e-6, clock.getDelta());

  // HUD updates (if present)
  const fps = Math.round(1 / delta);
  setText('fps-val', String(fps));

  const p = playerGroup.position;
  setText('pos-val', `${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);

  updateWorld(delta, playerGroup);
  renderer.render(scene, camera);
}
