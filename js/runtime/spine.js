import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { Input } from "./input.js";

export const Spine = {
  ctx: null,

  async start() {
    // ---------- core ----------
    const canvas = document.querySelector("canvas#xr") || null;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      canvas,
    });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    if (!renderer.domElement.parentElement) {
      document.body.appendChild(renderer.domElement);
    }
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070010);

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.05,
      300
    );

    // ---------- rig ----------
    const rig = new THREE.Group();
    rig.name = "rig";
    rig.position.set(0, 1.7, 10); // spawn a little back from center
    scene.add(rig);

    camera.position.set(0, 0, 0);
    rig.add(camera);

    // ---------- lights ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const hemi = new THREE.HemisphereLight(0xffffff, 0x220033, 1.1);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 18, 8);
    scene.add(dir);

    // ---------- controllers ----------
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);

    controller1.name = "controller1";
    controller2.name = "controller2";

    rig.add(controller1);
    rig.add(controller2);

    // ---------- shared arrays for raycast / walk ----------
    const walkSurfaces = [];
    const teleportSurfaces = [];

    // ---------- ctx ----------
    this.ctx = {
      THREE,
      scene,
      camera,
      renderer,
      rig,
      controller1,
      controller2,
      walkSurfaces,
      teleportSurfaces,
      log: (...a) => console.log(...a),
    };

    // ---------- load world (YOUR PATH) ----------
    // IMPORTANT: This matches your forever-folder layout.
    const WORLD_PATH = "./js/scarlett1/world.js";

    try {
      console.log("… loading", WORLD_PATH);
      const mod = await import(WORLD_PATH);
      if (typeof mod.init === "function") {
        await mod.init(this.ctx);
      }
      console.log("✅ world loaded");
    } catch (e) {
      console.error("❌ world import failed:", e);
      // show something so you aren't black-screened
      const fail = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0xff0055 })
      );
      fail.position.set(0, 1.7, -4);
      scene.add(fail);
    }

    // ---------- input ----------
    Input.init(this.ctx);

    // ---------- resize ----------
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ---------- render loop ----------
    let last = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      Input.update(dt);

      renderer.render(scene, camera);
    });

    // Optional: hook your UI Enter VR button if it exists
    const btn = document.querySelector("#enterVR");
    if (btn) {
      btn.onclick = async () => {
        try {
          const session = await navigator.xr.requestSession("immersive-vr", {
            optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
          });
          await renderer.xr.setSession(session);
        } catch (e) {
          console.error("Enter VR failed:", e);
        }
      };
    }
  },
};
