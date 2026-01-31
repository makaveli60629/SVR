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
    document.body.appendChild(renderer.domElement);

    // Scene + Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04040a);

    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 400);
    camera.position.set(0, 1.7, 10);

    // Player rig (move THIS, not camera directly)
    const rig = new THREE.Group();
    rig.position.set(0, 1.7, 12); // ✅ safe spawn
    rig.add(camera);
    scene.add(rig);

    // Resize
    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    // Context handed to modules
    const ctx = {
      THREE,
      scene,
      camera,
      renderer,
      rig,
      log: (...a) => console.log(...a),
      flags: { noClip: false }
    };

    // Input
    Input.init(ctx);

    // World
    await initWorld(ctx);

    // XR buttons (basic)
    document.getElementById("btnVR")?.addEventListener("click", async () => {
      if (navigator.xr) {
        const session = await navigator.xr.requestSession("immersive-vr", {
          optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]
        });
        renderer.xr.setSession(session);
      }
    });

    // Render loop
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.033);
      Input.update(dt);
      renderer.render(scene, camera);
    });

    console.log("✅ SCARLETT: ready");
  }
};
