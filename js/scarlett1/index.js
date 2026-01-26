// SCARLETT ONE — Permanent Engine Module
// Location: SVR/js/scarlett1/index.js
// RULES: Hands-only. Do NOT touch HTML. World building lives in world.js.
// NOTE: Uses CDN imports so HTML importmaps are NOT required.

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { createWorld, updateWorld } from './world.js';

let scene, camera, renderer, clock, playerGroup;

function el(id) { return document.getElementById(id); }
function setText(id, txt) { const e = el(id); if (e) e.innerText = txt; }

// On-screen log helper (works if your HTML has #log or #logpanel)
function appendLog(line) {
  const logEl = el('log') || el('logpanel');
  if (!logEl) return;
  const lines = (logEl.textContent + "\n" + line).split("\n").slice(-180);
  logEl.textContent = lines.join("\n");
  logEl.scrollTop = logEl.scrollHeight;
}

(function hookConsole() {
  const L = console.log.bind(console);
  const W = console.warn.bind(console);
  const E = console.error.bind(console);

  console.log = (...a) => { appendLog("[log] " + a.map(String).join(" ")); L(...a); };
  console.warn = (...a) => { appendLog("[warn] " + a.map(String).join(" ")); W(...a); };
  console.error = (...a) => { appendLog("[err] " + a.map(String).join(" ")); E(...a); };

  window.addEventListener("error", (ev) => {
    appendLog("[window.error] " + (ev.message || ev.error || "unknown"));
  });

  window.addEventListener("unhandledrejection", (ev) => {
    appendLog("[promise] " + (ev.reason?.message || ev.reason || "unhandled"));
  });
})();

export function initEngine() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  // Player rig (camera + hands move together)
  playerGroup = new THREE.Group();
  scene.add(playerGroup);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.05,
    2000
  );
  playerGroup.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // XR OFF until user presses ENTER VR (keeps Android debug visible)
  renderer.xr.enabled = false;

  document.body.appendChild(renderer.domElement);

  // World init (all visuals live in world.js)
  createWorld(scene, camera, renderer, playerGroup);

  // ENTER VR (hands-only)
  const btn = el('entervr');
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

  window.addEventListener('resize', onResize);
  renderer.setAnimationLoop(tick);

  setText('status', 'LINKED');
  console.log("[engine] init complete");
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function tick() {
  const delta = Math.max(1e-6, clock.getDelta());

  // HUD updates (if your spine HTML has these IDs)
  const fps = Math.round(1 / delta);
  setText('fps-val', String(fps));

  const p = playerGroup.position;
  setText('pos-val', `${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);

  updateWorld(delta, playerGroup);
  renderer.render(scene, camera);
}
