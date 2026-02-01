// SVR/js/runtime/spine.js
// PERMANENT: GitHub Pages safe (CDN Three.js + correct world path)

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// IMPORTANT: world lives inside /js/scarlett1/
const WORLD_URL = "./js/scarlett1/world.js";

export const Spine = {
  BUILD: "SCARLETT_PERMANENT_SPINE_CDN_FIX_V1",

  ctx: null,

  async start() {
    const log = (...a) => console.log(...a);

    try {
      // Make sure we always have a valid DOM target
      let mount = document.getElementById("app");
      if (!mount) mount = document.body;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x05060a);

      // Camera + Rig
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.05,
        500
      );

      const rig = new THREE.Group();
      rig.name = "rig";
      rig.add(camera);
      scene.add(rig);

      // Renderer (DO NOT pass null canvas)
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;

      // Ensure renderer is mounted
      mount.appendChild(renderer.domElement);

      // Controllers (Quest: controller1/2 exist even with hand tracking sometimes)
      const controller1 = renderer.xr.getController(0);
      const controller2 = renderer.xr.getController(1);
      controller1.name = "controller1";
      controller2.name = "controller2";
      scene.add(controller1);
      scene.add(controller2);

      // Context shared to modules
      const ctx = {
        THREE,
        GLTFLoader,
        scene,
        camera,
        rig,
        renderer,
        controller1,
        controller2,

        // surfaces for input
        walkSurfaces: [],
        teleportSurfaces: [],

        // minimal Bus (so your modules can log safely)
        Bus: {
          log: (...a) => console.log(...a),
        },
      };

      this.ctx = ctx;

      // Resize
      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Import Input (your file already exists and is 200)
      const { Input } = await import("./js/runtime/input.js");
      Input.init(ctx);
      ctx.Input = Input;

      // Load world (FIXED PATH)
      log("🌍 loading world:", WORLD_URL);
      const worldMod = await import(WORLD_URL);

      // Support either init(ctx) or default(ctx)
      if (typeof worldMod.init === "function") {
        await worldMod.init(ctx);
      } else if (typeof worldMod.default === "function") {
        await worldMod.default(ctx);
      } else {
        console.warn("World module has no init/default export:", worldMod);
      }

      // Make sure we always have at least one walk/teleport surface
      if (!ctx.walkSurfaces.length || !ctx.teleportSurfaces.length) {
        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(40, 64),
          new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 1 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = false;
        scene.add(floor);
        ctx.walkSurfaces.push(floor);
        ctx.teleportSurfaces.push(floor);
      }

      // Simple lighting baseline (so avatars + world always visible)
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 0.75);
      key.position.set(8, 14, 10);
      scene.add(key);

      // Spawn rig (facing “toward center” by default)
      rig.position.set(0, 1.7, 10);
      rig.rotation.y = Math.PI;

      // Animation loop
      let last = performance.now();
      renderer.setAnimationLoop(() => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        // input update
        ctx.Input?.update?.(dt);

        renderer.render(scene, camera);
      });

      log("✅ Spine started:", this.BUILD);
    } catch (e) {
      console.error("❌ Spine boot failed:", e);
      throw e;
    }
  },
};
