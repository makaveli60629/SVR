// /js/scarlett1/spine.js — FULL SPINE (owns renderer, camera, loop)
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildWorld } from "./world.js";

export class Spine {
  constructor(opts = {}) {
    this.opts = {
      mountId: opts.mountId || "app",
      debug: !!opts.debug,
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02030a);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.05,
      200
    );
    // Good default spawn: above pedestal looking toward center
    this.camera.position.set(0, 1.7, 6.5);
    this.camera.lookAt(0, 1.2, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    this._diag = null;
    this._worldReady = false;
  }

  start() {
    this._mountRenderer();
    this._installFailsafeLights();

    // Build your world (pit + pedestal carpet + table + chairs + stairs)
    buildWorld(this.scene);
    this._worldReady = true;

    if (this.opts.debug) this._mountDiag();

    // Main loop
    this.renderer.setAnimationLoop(() => {
      this.tick();
      this.renderer.render(this.scene, this.camera);
      if (this._diag) this._diagUpdate();
    });

    console.log("[spine] started");
  }

  tick() {
    // future hooks (animations, etc.)
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

  _mountRenderer() {
    const mount = document.getElementById(this.opts.mountId) || document.body;
    // Clear mount so old canvases don’t pile up
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    mount.appendChild(this.renderer.domElement);
  }

  _installFailsafeLights() {
    // Bright, stable lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1b2238, 1.0);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(10, 14, 8);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(-10, 8, -8);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0x2a7cff, 1.0, 70);
    rim.position.set(0, 2.5, 0);
    this.scene.add(rim);
  }

  _mountDiag() {
    const hud = document.createElement("div");
    hud.id = "scarlett-diag";
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
      `world: ${this._worldReady ? "OK" : "…" }<br>` +
      `objects: ${objCount}<br>` +
      `cam: ${cam.x.toFixed(2)}, ${cam.y.toFixed(2)}, ${cam.z.toFixed(2)}`;
  }
}
