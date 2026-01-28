// /js/scarlett1/spine.js — FULL (PERMANENT)
// Restores your Diagnostics overlay + adds guaranteed Android movement joysticks.
// Eagle-view spawn (not downstairs).

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildWorld } from "./world.js";
import { Diagnostics } from "./diagnostics.js";

export class Spine {
  constructor(opts = {}) {
    this.opts = {
      mountId: opts.mountId || "app",
      debug: true,
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02030a);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.05,
      250
    );

    // ✅ Eagle-view spawn: standing near rim looking down
    this.camera.position.set(0, 2.0, 11.5);
    this.camera.lookAt(0, 0.8, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    // movement
    this._keys = Object.create(null);
    this._stick = {
      moveX: 0,
      moveY: 0,
      turnX: 0,
    };

    this._ui = {
      diagVisible: true,
      diagRoot: null,
    };
  }

  start() {
    this._mountRenderer();
    this._installFailsafeLights();

    // ✅ Bring your real diagnostics back
    this._mountDiagnostics();

    Diagnostics.log("[boot] entry");
    Diagnostics.log("[boot] renderer mounted");
    Diagnostics.log("[boot] building world…");

    buildWorld(this.scene);

    Diagnostics.log("[boot] world built ✅");
    Diagnostics.log("[boot] controls init…");

    // ✅ Guaranteed movement (touch sticks + WASD fallback)
    this._enableKeyboardFallback();
    this._enableTouchJoysticks();

    this._mountDiagButtons();

    Diagnostics.log("[boot] ready");

    this.renderer.setAnimationLoop(() => {
      this.tick();
      this.renderer.render(this.scene, this.camera);
    });
  }

  tick() {
    // movement each frame
    this._applyMovement();
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  async enterVR() {
    if (!navigator.xr) {
      Diagnostics.warn("[xr] navigator.xr not available");
      return;
    }
    try {
      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor"],
      });
      await this.renderer.xr.setSession(session);
      Diagnostics.log("[xr] session started ✅");
    } catch (e) {
      Diagnostics.error(`[xr] failed: ${e?.message || e}`);
    }
  }

  // ---------------- internals ----------------

  _mountRenderer() {
    const mount = document.getElementById(this.opts.mountId) || document.body;
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    mount.appendChild(this.renderer.domElement);
  }

  _installFailsafeLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1b2238, 1.0);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(10, 14, 8);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(-10, 8, -8);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0x2a7cff, 1.0, 70);
    rim.position.set(0, 2.5, 0);
    this.scene.add(rim);
  }

  _mountDiagnostics() {
    try {
      Diagnostics.mount();
      Diagnostics.log("Diagnostics mounted");
      Diagnostics.log(`Android touch=${("ontouchstart" in window) || (navigator.maxTouchPoints > 0)}`);
      Diagnostics.log(`XR=${!!navigator.xr}`);
    } catch (e) {
      // If diagnostics itself fails, at least console it
      console.warn("Diagnostics.mount failed", e);
    }

    // Pipe global errors into diagnostics
    window.addEventListener("error", (e) => {
      Diagnostics.error(e?.message || "Unknown window error");
    });
    window.addEventListener("unhandledrejection", (e) => {
      const msg = (e?.reason && (e.reason.stack || e.reason.message)) || String(e?.reason || "Unhandled rejection");
      Diagnostics.error(msg);
    });
  }

  _mountDiagButtons() {
    // Small overlay buttons: Copy Report + Hide/Show
    const wrap = document.createElement("div");
    wrap.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 999999;
      display: flex;
      gap: 10px;
      pointer-events: auto;
    `;

    const btn = (label) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = `
        padding: 10px 14px;
        border-radius: 14px;
        background: rgba(20,30,60,0.85);
        color: #cfe3ff;
        border: 1px solid rgba(80,120,255,0.4);
        font: 12px system-ui, -apple-system, sans-serif;
      `;
      return b;
    };

    const copy = btn("Copy Report");
    copy.onclick = async () => {
      const ok = await Diagnostics.copyReport();
      if (ok) Diagnostics.log("[copy] report copied ✅");
      else Diagnostics.warn("[copy] failed ❌");
    };

    const hide = btn("Hide");
    hide.onclick = () => {
      const el = document.getElementById("scarlett-diagnostics");
      if (!el) return;
      this._ui.diagVisible = !this._ui.diagVisible;
      el.style.display = this._ui.diagVisible ? "block" : "none";
      hide.textContent = this._ui.diagVisible ? "Hide" : "Show";
    };

    wrap.appendChild(copy);
    wrap.appendChild(hide);
    document.body.appendChild(wrap);
  }

  _enableKeyboardFallback() {
    window.addEventListener("keydown", (e) => (this._keys[e.key.toLowerCase()] = true));
    window.addEventListener("keyup", (e) => (this._keys[e.key.toLowerCase()] = false));
  }

  _enableTouchJoysticks() {
    // Two transparent touch pads (left=move, right=turn) so you can ALWAYS move on Android
    const makePad = (side) => {
      const pad = document.createElement("div");
      pad.style.cssText = `
        position: fixed;
        bottom: 90px;
        ${side}: 18px;
        width: 150px;
        height: 150px;
        border-radius: 999px;
        border: 2px solid rgba(80,120,255,0.35);
        background: rgba(10,14,24,0.20);
        z-index: 999998;
        touch-action: none;
        pointer-events: auto;
      `;

      const knob = document.createElement("div");
      knob.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        width: 70px;
        height: 70px;
        transform: translate(-50%, -50%);
        border-radius: 999px;
        border: 2px solid rgba(80,120,255,0.45);
        background: rgba(30,40,70,0.35);
      `;
      pad.appendChild(knob);

      let activeId = null;

      const setKnob = (dx, dy) => {
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
      };

      const reset = () => {
        activeId = null;
        if (side === "left") {
          this._stick.moveX = 0;
          this._stick.moveY = 0;
        } else {
          this._stick.turnX = 0;
        }
        knob.style.transform = "translate(-50%, -50%)";
      };

      pad.addEventListener("pointerdown", (e) => {
        activeId = e.pointerId;
        pad.setPointerCapture(activeId);
      });

      pad.addEventListener("pointermove", (e) => {
        if (e.pointerId !== activeId) return;
        const r = pad.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        let dx = e.clientX - cx;
        let dy = e.clientY - cy;

        const max = 50;
        const len = Math.hypot(dx, dy);
        if (len > max) {
          dx = (dx / len) * max;
          dy = (dy / len) * max;
        }

        // normalize -1..1
        const nx = dx / max;
        const ny = dy / max;

        if (side === "left") {
          this._stick.moveX = nx;
          this._stick.moveY = -ny;
        } else {
          this._stick.turnX = nx;
        }

        // knob visual (relative)
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      });

      pad.addEventListener("pointerup", (e) => {
        if (e.pointerId !== activeId) return;
        reset();
      });

      pad.addEventListener("pointercancel", reset);

      document.body.appendChild(pad);
    };

    // Only show pads on touch devices
    const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) return;

    makePad("left");
    makePad("right");

    Diagnostics.log("[input] touch joysticks visible ✅");
  }

  _applyMovement() {
    // WASD fallback + touch joystick movement
    const speed = 0.07;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // keyboard
    if (this._keys["w"]) this.camera.position.addScaledVector(forward, speed);
    if (this._keys["s"]) this.camera.position.addScaledVector(forward, -speed);
    if (this._keys["a"]) this.camera.position.addScaledVector(right, speed);
    if (this._keys["d"]) this.camera.position.addScaledVector(right, -speed);

    // touch move
    if (Math.abs(this._stick.moveY) > 0.02) this.camera.position.addScaledVector(forward, this._stick.moveY * speed);
    if (Math.abs(this._stick.moveX) > 0.02) this.camera.position.addScaledVector(right, this._stick.moveX * speed);

    // touch turn
    if (Math.abs(this._stick.turnX) > 0.02) {
      this.camera.rotation.y -= this._stick.turnX * 0.03;
    }
  }
      }
