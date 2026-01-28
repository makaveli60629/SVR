// /js/scarlett1/spine.js
// SCARLETT1 • SPINE (PERMANENT)
// - Owns renderer/camera/loop
// - Mounts your Diagnostics overlay (Diagnostics.mount())
// - Adds Copy Report + Hide/Show buttons (top-right)
// - Adds guaranteed Android touch joysticks (move + turn) so you can ALWAYS move
// - Eagle-view spawn (rim level looking down into pit)
// - Hooks Enter VR from index.html via "scarlett-enter-vr" event
// - Optional full male avatar spawn (if you add modules/maleAvatar.js)

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildWorld } from "./world.js";
import { Diagnostics } from "./diagnostics.js";

// OPTIONAL: if you created /js/scarlett1/modules/maleAvatar.js
// import { spawnMaleFull } from "./modules/maleAvatar.js";

export class Spine {
  constructor(opts = {}) {
    this.opts = {
      mountId: opts.mountId || "app",
      debug: opts.debug !== false, // default true
    };

    // Core 3D
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02030a);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.05,
      300
    );

    // ✅ Eagle-view spawn: "walkway" level looking down at center
    this.camera.position.set(0, 2.0, 11.5);
    this.camera.lookAt(0, 0.8, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    // Input state
    this._keys = Object.create(null);
    this._stick = { moveX: 0, moveY: 0, turnX: 0 };

    // UI refs
    this._ui = {
      diagVisible: true,
      buttonsMounted: false,
      padsMounted: false,
    };

    // Movement tuning
    this._moveSpeed = 0.085;
    this._turnSpeed = 0.032;

    // For clean init
    this._started = false;
  }

  start() {
    if (this._started) return;
    this._started = true;

    this._mountRenderer();
    this._installFailsafeLights();

    // ✅ Diagnostics
    try {
      Diagnostics.mount();
      Diagnostics.log("Diagnostics mounted");
      Diagnostics.log(`[boot] href=${location.href}`);
      Diagnostics.log(`[boot] touch=${("ontouchstart" in window) || (navigator.maxTouchPoints > 0)} maxTouchPoints=${navigator.maxTouchPoints || 0}`);
      Diagnostics.log(`[boot] xr=${!!navigator.xr}`);
    } catch (e) {
      console.warn("Diagnostics.mount failed", e);
    }

    // Global error capture -> Diagnostics (you already do this in Diagnostics.mount(),
    // but we keep it safe if mount is changed later)
    window.addEventListener("error", (e) => {
      try { Diagnostics.error(e?.message || "Unknown window error"); } catch {}
    });
    window.addEventListener("unhandledrejection", (e) => {
      const msg = (e?.reason && (e.reason.stack || e.reason.message)) || String(e?.reason || "Unhandled rejection");
      try { Diagnostics.error(msg); } catch {}
    });

    Diagnostics.log("[boot] building world…");
    buildWorld(this.scene);
    Diagnostics.log("[boot] world built ✅");

    // OPTIONAL: Spawn full male avatar if you installed the module
    // try {
    //   spawnMaleFull(this.scene, { position: new THREE.Vector3(2.2, 0.0, 0.2), rotationY: Math.PI, scale: 1.0 });
    //   Diagnostics.log("[avatar] male full spawned ✅");
    // } catch (e) {
    //   Diagnostics.warn("[avatar] male full spawn failed (module missing?)");
    // }

    // ✅ Controls
    this._enableKeyboardFallback();
    this._enableTouchJoysticks(); // guaranteed Android movement
    this._mountTopButtons();      // Copy Report + Hide/Show diagnostics

    // Hook "Enter VR" event from index.html
    document.addEventListener("scarlett-enter-vr", () => this.enterVR());

    Diagnostics.log("[boot] ready");

    // Main loop
    this.renderer.setAnimationLoop(() => {
      this.tick();
      this.renderer.render(this.scene, this.camera);
    });
  }

  tick() {
    this._applyMovement();
  }

  onResize() {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
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
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
      });
      await this.renderer.xr.setSession(session);
      Diagnostics.log("[xr] session started ✅");
    } catch (e) {
      Diagnostics.error(`[xr] failed: ${e?.message || e}`);
    }
  }

  // ---------------- Internals ----------------

  _mountRenderer() {
    const mount = document.getElementById(this.opts.mountId) || document.body;
    // clear mount to avoid stacked canvases
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    mount.appendChild(this.renderer.domElement);
  }

  _installFailsafeLights() {
    // Prevent dark scene even if other lighting modules fail
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

  _mountTopButtons() {
    if (this._ui.buttonsMounted) return;
    this._ui.buttonsMounted = true;

    const wrap = document.createElement("div");
    wrap.style.cssText = `
      position:fixed;
      top:10px; right:10px;
      z-index:999999;
      display:flex;
      gap:10px;
      pointer-events:auto;
    `;

    const mkBtn = (label) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = `
        padding:10px 14px;
        border-radius:14px;
        background:rgba(20,30,60,0.85);
        color:#cfe3ff;
        border:1px solid rgba(80,120,255,0.4);
        font:12px system-ui,-apple-system,sans-serif;
      `;
      return b;
    };

    const copy = mkBtn("Copy Report");
    copy.onclick = async () => {
      try {
        const ok = await Diagnostics.copyReport();
        ok ? Diagnostics.log("[copy] report copied ✅") : Diagnostics.warn("[copy] failed ❌");
      } catch (e) {
        Diagnostics.warn("[copy] exception");
      }
    };

    const toggle = mkBtn("Hide");
    toggle.onclick = () => {
      const diag = document.getElementById("scarlett-diagnostics");
      if (!diag) return;
      this._ui.diagVisible = !this._ui.diagVisible;
      diag.style.display = this._ui.diagVisible ? "block" : "none";
      toggle.textContent = this._ui.diagVisible ? "Hide" : "Show";
      Diagnostics.log(this._ui.diagVisible ? "[ui] diagnostics shown" : "[ui] diagnostics hidden");
    };

    wrap.appendChild(copy);
    wrap.appendChild(toggle);
    document.body.appendChild(wrap);
  }

  _enableKeyboardFallback() {
    window.addEventListener("keydown", (e) => (this._keys[e.key.toLowerCase()] = true));
    window.addEventListener("keyup", (e) => (this._keys[e.key.toLowerCase()] = false));
  }

  _enableTouchJoysticks() {
    if (this._ui.padsMounted) return;

    const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) return;

    this._ui.padsMounted = true;

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
        position:absolute;
        left:50%; top:50%;
        width:70px; height:70px;
        transform: translate(-50%, -50%);
        border-radius:999px;
        border: 2px solid rgba(80,120,255,0.45);
        background: rgba(30,40,70,0.35);
      `;
      pad.appendChild(knob);

      let activeId = null;

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

        const nx = dx / max;
        const ny = dy / max;

        if (side === "left") {
          this._stick.moveX = nx;
          this._stick.moveY = -ny;
        } else {
          this._stick.turnX = nx;
        }

        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      });

      pad.addEventListener("pointerup", (e) => {
        if (e.pointerId !== activeId) return;
        reset();
      });
      pad.addEventListener("pointercancel", reset);

      document.body.appendChild(pad);
    };

    makePad("left");  // move
    makePad("right"); // turn

    Diagnostics.log("[input] Android touch joysticks visible ✅");
  }

  _applyMovement() {
    const speed = this._moveSpeed;
    const turn = this._turnSpeed;

    // Forward/right vectors from camera
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0.0001) forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    if (right.lengthSq() > 0.0001) right.normalize();

    // Keyboard WASD
    if (this._keys["w"]) this.camera.position.addScaledVector(forward, speed);
    if (this._keys["s"]) this.camera.position.addScaledVector(forward, -speed);
    if (this._keys["a"]) this.camera.position.addScaledVector(right, speed);
    if (this._keys["d"]) this.camera.position.addScaledVector(right, -speed);

    // Touch sticks
    if (Math.abs(this._stick.moveY) > 0.02) this.camera.position.addScaledVector(forward, this._stick.moveY * speed);
    if (Math.abs(this._stick.moveX) > 0.02) this.camera.position.addScaledVector(right, this._stick.moveX * speed);

    if (Math.abs(this._stick.turnX) > 0.02) {
      this.camera.rotation.y -= this._stick.turnX * turn;
    }
  }
  }
