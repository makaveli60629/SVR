import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { XRHandModelFactory } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRHandModelFactory.js";
import { Input } from "./input.js";
import { init as initWorld } from "../scarlett1/world.js";

export const Spine = {
  async start() {
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.xr.enabled = true;

    // BRIGHTER overall
    renderer.toneMappingExposure = 1.5;

    document.body.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060d);

    // Camera
    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 800);

    // Player rig (move this)
    const rig = new THREE.Group();
    rig.position.set(0, 1.8, 22); // ✅ moved back (prevents starting in pit)
    rig.add(camera);
    scene.add(rig);

    // Resize
    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    // XR Controllers + Hands
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);
    scene.add(controller1, controller2);

    // Hand models (Oculus-style)
    const handFactory = new XRHandModelFactory();
    const hand1 = renderer.xr.getHand(0);
    const hand2 = renderer.xr.getHand(1);
    hand1.add(handFactory.createHandModel(hand1, "mesh"));
    hand2.add(handFactory.createHandModel(hand2, "mesh"));
    scene.add(hand1, hand2);

    // Context for modules
    const ctx = {
      THREE, scene, camera, renderer, rig,
      controller1, controller2, hand1, hand2,
      log: (...a) => console.log(...a),
      // demo mode: no collision clamp (prevents “stuck”)
      flags: { noClip: true },
      // raycast targets for teleport (world fills this)
      teleportSurfaces: []
    };

    // Input
    Input.init(ctx);

    // World
    await initWorld(ctx);

    // VR button
    document.getElementById("btnVR")?.addEventListener("click", async () => {
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

    // Reset spawn
    document.getElementById("btnReset")?.addEventListener("click", () => {
      rig.position.set(0, 1.8, 22);
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
