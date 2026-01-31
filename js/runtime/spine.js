import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { Input } from "./input.js";
import { init as initWorld } from "../scarlett1/world.js";

export const Spine = {
  async start() {
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.xr.enabled = true;

    // Make it BRIGHT and readable
    renderer.toneMappingExposure = 1.35;

    document.body.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060d);

    // Camera
    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 600);

    // Player Rig (move this)
    const rig = new THREE.Group();
    rig.position.set(0, 1.8, 18);   // safe spawn far from pit lip
    rig.add(camera);
    scene.add(rig);

    // Resize
    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    const ctx = {
      THREE, scene, camera, renderer, rig,
      log: (...a) => console.log(...a),
      flags: { noClip: true } // demo: no collision to prevent “stuck”
    };

    // Input
    Input.init(ctx);

    // World
    await initWorld(ctx);

    // VR button
    const btnVR = document.getElementById("btnVR");
    btnVR?.addEventListener("click", async () => {
      try {
        if (!navigator.xr) return;
        const session = await navigator.xr.requestSession("immersive-vr", {
          optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]
        });
        renderer.xr.setSession(session);
      } catch (e) {
        console.warn("XR session failed:", e);
      }
    });

    // Reset spawn button
    document.getElementById("btnReset")?.addEventListener("click", () => {
      rig.position.set(0, 1.8, 18);
      rig.rotation.set(0, 0, 0);
    });

    // Render loop
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.033);
      Input.update(dt);
      renderer.render(scene, camera);
    });

    console.log("✅ Scarlett Demo: ready");
  }
};
