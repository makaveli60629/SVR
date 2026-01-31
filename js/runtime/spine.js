import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { Input } from "./input.js";
import { init as initWorld } from "../scarlett1/world.js";

function setStatus(txt){
  const el = document.getElementById("status");
  if (el) el.textContent = txt;
}
function showErr(err){
  const box = document.getElementById("err");
  if (!box) return;
  box.style.display = "block";
  box.textContent = String(err?.stack || err?.message || err);
}

export const Spine = {
  async start() {
    // Global crash visibility (so no more “black screen mystery”)
    window.addEventListener("error", (e) => {
      showErr(e.error || e.message || e);
    });
    window.addEventListener("unhandledrejection", (e) => {
      showErr(e.reason || e);
    });

    setStatus("init renderer…");

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.xr.enabled = true;
    renderer.toneMappingExposure = 1.55;
    document.body.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070812);

    // Camera
    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 800);

    // Player rig
    const rig = new THREE.Group();
    rig.position.set(0, 1.8, 24); // safe spawn far from pit
    rig.add(camera);
    scene.add(rig);

    // Add controllers (no fragile hand model imports)
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);
    scene.add(controller1, controller2);

    // Resize
    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    // Context
    const ctx = {
      THREE, scene, camera, renderer, rig,
      controller1, controller2,
      log: (...a) => console.log(...a),
      flags: { noClip: true },
      teleportSurfaces: []
    };

    setStatus("init input…");
    Input.init(ctx);

    setStatus("build world…");
    await initWorld(ctx);

    // Buttons
    document.getElementById("btnReset")?.addEventListener("click", () => {
      rig.position.set(0, 1.8, 24);
      rig.rotation.set(0, 0, 0);
    });

    document.getElementById("btnHard")?.addEventListener("click", () => {
      // bypass caches by forcing reload with a new query param
      const u = new URL(location.href);
      u.searchParams.set("v", "HARD_" + Date.now());
      location.href = u.toString();
    });

    document.getElementById("btnVR")?.addEventListener("click", async () => {
      try {
        if (!navigator.xr) throw new Error("WebXR not available on this browser.");
        const session = await navigator.xr.requestSession("immersive-vr", {
          optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]
        });
        renderer.xr.setSession(session);
      } catch (e) {
        showErr(e);
      }
    });

    // Render loop
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.033);
      Input.update(dt);

      setStatus(
        `ok • xr=${renderer.xr.isPresenting ? "YES" : "no"}\n` +
        `pos ${rig.position.x.toFixed(2)}, ${rig.position.y.toFixed(2)}, ${rig.position.z.toFixed(2)}`
      );

      renderer.render(scene, camera);
    });

    console.log("✅ Scarlett SAFE Demo: ready");
  }
};
