// /js/scarlett1/spine.js — FULL SPINE (render + diagnostics + controls + eagle view)
// Spine owns renderer/camera/loop. Restores your existing diagnostic + control modules safely.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildWorld } from "./world.js";

// Import entire modules so we don’t depend on exact exported names
import * as DiagnosticsMod from "./diagnostics.js";
import * as DevHudMod from "./devhud.js";
import * as AndroidControlsMod from "./androidControls.js";

export class Spine {
  constructor(opts = {}) {
    this.opts = {
      mountId: opts.mountId || "app",
      debug: opts.debug !== false, // default true
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02030a);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.05,
      250
    );

    // ✅ NATURAL FLOOR / EAGLE VIEW
    // You start on the rim level, looking slightly down into the center.
    this.camera.position.set(0, 2.0, 11.5);
    this.camera.lookAt(0, 0.8, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    this._diag = null;
    this._worldReady = false;

    // fallback mover
    this._keys = Object.create(null);
    this._moveTick = null;
  }

  start() {
    this._mountRenderer();
    this._installFailsafeLights();

    // Build world (small sink pit + pedestal floor + table/chairs)
    buildWorld(this.scene);
    this._worldReady = true;

    // ✅ Restore your existing Scarlett diagnostic/dev systems safely
    this._tryMountDiagnostics();
    this._tryMountDevHUD();
    this._tryInitAndroidControls();

    // ✅ Guaranteed movement fallback (WASD on desktop, and gives us a safety net)
    this._enableBasicMovementFallback();

    if (this.opts.debug) this._mountMinimalDiag(); // extra: always visible status

    this.renderer.setAnimationLoop(() => {
      this.tick();
      this.renderer.render(this.scene, this.camera);
      if (this._diag) this._diagUpdate();
    });

    console.log("[spine] started");
  }

  tick() {
    // fallback movement
    this._moveTick?.();

    // if your own modules hook into tick via global/state, they will run independently
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
      console.warn("[xr] navigator.xr not available");
      return;
    }
    try {
      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor"],
      });
      await this.renderer.xr.setSession(session);
      console.log("[xr] session started");
    } catch (e) {
      console.warn("[xr] failed:", e);
    }
  }

  // ---------------- internals ----------------

  _mountRenderer() {
    const mount = document.getElementById(this.opts.mountId) || document.body;

    // Clear mount so old canvases don’t pile up
    while (mount.firstChild) mount.removeChild(mount.firstChild);

    mount.appendChild(this.renderer.domElement);
  }

  _installFailsafeLights() {
    // Stable bright lighting (won’t fight your lighting module, but prevents darkness)
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

  _tryMountDiagnostics() {
    // Try common function names without breaking if they don’t exist
    const candidates = [
      "mountDiagnostics",
      "initDiagnostics",
      "Diagnostics",
      "startDiagnostics",
      "bootDiagnostics",
    ];

    for (const name of candidates) {
      const fn = DiagnosticsMod?.[name];
      if (typeof fn === "function") {
        try {
          fn({ scene: this.scene, camera: this.camera, renderer: this.renderer });
          console.log(`[spine] diagnostics mounted via ${name}()`);
          return;
        } catch (e) {
          console.warn(`[spine] diagnostics ${name}() error:`, e);
        }
      }
    }

    // Also support default export as function
    if (typeof DiagnosticsMod?.default === "function") {
      try {
        DiagnosticsMod.default({ scene: this.scene, camera: this.camera, renderer: this.renderer });
        console.log("[spine] diagnostics mounted via default()");
        return;
      } catch (e) {
        console.warn("[spine] diagnostics default() error:", e);
      }
    }

    console.warn("[spine] diagnostics module present but no known mount function found");
  }

  _tryMountDevHUD() {
    const candidates = [
      "mountDevHUD",
      "initDevHUD",
      "DevHUD",
      "startDevHUD",
      "bootDevHUD",
    ];

    for (const name of candidates) {
      const fn = DevHudMod?.[name];
      if (typeof fn === "function") {
        try {
          fn({ scene: this.scene, camera: this.camera, renderer: this.renderer });
          console.log(`[spine] devhud mounted via ${name}()`);
          return;
        } catch (e) {
          console.warn(`[spine] devhud ${name}() error:`, e);
        }
      }
    }

    if (typeof DevHudMod?.default === "function") {
      try {
        DevHudMod.default({ scene: this.scene, camera: this.camera, renderer: this.renderer });
        console.log("[spine] devhud mounted via default()");
        return;
      } catch (e) {
        console.warn("[spine] devhud default() error:", e);
      }
    }

    // Not fatal
  }

  _tryInitAndroidControls() {
    const candidates = [
      "initAndroidControls",
      "AndroidControls",
      "startAndroidControls",
      "mountAndroidControls",
      "init",
      "start",
    ];

    for (const name of candidates) {
      const fn = AndroidControlsMod?.[name];
      if (typeof fn === "function") {
        try {
          fn({ camera: this.camera, renderer: this.renderer, scene: this.scene });
          console.log(`[spine] android controls via ${name}()`);
          return;
        } catch (e) {
          console.warn(`[spine] androidControls ${name}() error:`, e);
        }
      }
    }

    if (typeof AndroidControlsMod?.default === "function") {
      try {
        AndroidControlsMod.default({ camera: this.camera, renderer: this.renderer, scene: this.scene });
        console.log("[spine] android controls via default()");
        return;
      } catch (e) {
        console.warn("[spine] androidControls default() error:", e);
      }
    }

    console.warn("[spine] android controls not attached (fallback mover still active)");
  }

  _enableBasicMovementFallback() {
    // Desktop keys (and a “safety net” if touch module doesn’t attach)
    window.addEventListener("keydown", (e) => (this._keys[e.key.toLowerCase()] = true));
    window.addEventListener("keyup", (e) => (this._keys[e.key.toLowerCase()] = false));

    this._moveTick = () => {
      const speed = 0.06;

      // forward/back relative to camera facing
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      if (this._keys["w"]) this.camera.position.addScaledVector(forward, speed);
      if (this._keys["s"]) this.camera.position.addScaledVector(forward, -speed);
      if (this._keys["a"]) this.camera.position.addScaledVector(right, speed);
      if (this._keys["d"]) this.camera.position.addScaledVector(right, -speed);
    };
  }

  _mountMinimalDiag() {
    // This does NOT replace your diagnostics — it’s a guaranteed “is it alive” badge.
    const hud = document.createElement("div");
    hud.id = "scarlett-diag-mini";
    hud.style.position = "fixed";
    hud.style.top = "10px";
    hud.style.left = "10px";
    hud.style.zIndex = "99999";
    hud.style.background = "rgba(10,14,24,0.72)";
    hud.style.border = "1px solid rgba(80,120,255,0.35)";
    hud.style.borderRadius = "12px";
    hud.style.padding = "10px 12px";
    hud.style.color = "#cfe3ff";
    hud.style.fontFamily = "monospace";
    hud.style.fontSize = "12px";
    hud.style.maxWidth = "88vw";
    hud.style.pointerEvents = "none";
    document.body.appendChild(hud);

    this._diag = hud;
    this._diagUpdate();
  }

  _diagUpdate() {
    const objCount = this.scene?.children?.length ?? 0;
    const cam = this.camera.position;
    this._diag.innerHTML =
      `SCARLETT DIAG<br>` +
      `world: ${this._worldReady ? "OK" : "…"}<br>` +
      `objects: ${objCount}<br>` +
      `cam: ${cam.x.toFixed(2)}, ${cam.y.toFixed(2)}, ${cam.z.toFixed(2)}`;
  }
              }
