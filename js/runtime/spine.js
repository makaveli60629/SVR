/**
 * SVR /js/runtime/spine.js
 * PERMANENT SPINE (CDN THREE + safe mount + correct world path)
 * - Fixes "Failed to resolve module specifier 'three'"
 * - Fixes WebGLRenderer null width errors by guaranteeing a mount element
 * - Loads ./js/scarlett1/world.js (NOT /scarlett1/world.js)
 * - Provides Bus logger + Avatar manager (window.spawnAvatar)
 */

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// ===== Avatar Files (relative to SVR root) =====
const AVATAR_FILES = {
  male: "./assets/avatars/male.glb",
  female: "./assets/avatars/female.glb",
  ninja: "./assets/avatars/ninja.glb",
  combat: "./assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb",
  apocalypse_female: "./assets/avatars/futuristic_apocalypse_female_cargo_pants.glb",
};

// ===== Simple bus/logger =====
function makeBus() {
  const listeners = new Map();
  const bus = {
    on(evt, fn) {
      if (!listeners.has(evt)) listeners.set(evt, new Set());
      listeners.get(evt).add(fn);
      return () => listeners.get(evt)?.delete(fn);
    },
    emit(evt, data) {
      listeners.get(evt)?.forEach((fn) => {
        try { fn(data); } catch (e) { console.warn("bus listener error", e); }
      });
    },
    log(msg) {
      console.log(msg);
      const pre = document.getElementById("log");
      if (pre) {
        pre.textContent += (pre.textContent ? "\n" : "") + msg;
        pre.scrollTop = pre.scrollHeight;
      }
    },
  };
  return bus;
}

// ===== HUD helpers =====
function setStatus(txt, ok = true) {
  const el = document.getElementById("status");
  if (el) el.textContent = txt;
  const badge = document.getElementById("ready");
  if (badge) {
    badge.textContent = ok ? "ready ✅" : "boot failed ❌";
  }
}

function setHud(key, value) {
  const el = document.getElementById(key);
  if (el) el.textContent = value;
}

// ===== Ensure a real mount element (fixes null width) =====
function ensureMount() {
  let mount = document.getElementById("app");
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "app";
    mount.style.position = "fixed";
    mount.style.left = "0";
    mount.style.top = "0";
    mount.style.width = "100%";
    mount.style.height = "100%";
    mount.style.overflow = "hidden";
    mount.style.background = "#05040a";
    document.body.appendChild(mount);
  }
  return mount;
}

// ===== Resize =====
function fitRenderer(renderer, camera, mount) {
  const w = mount.clientWidth || window.innerWidth || 1;
  const h = mount.clientHeight || window.innerHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// =====================================================
// AVATAR MANAGER (your code, converted to CDN imports)
// =====================================================
export function initAvatars({ scene, Bus }) {
  const loader = new GLTFLoader();
  let current = null;

  function setAvHud(name) {
    const el = document.getElementById("av");
    if (el) el.textContent = name ? String(name).toUpperCase() : "NONE";
  }

  function normalizeAndPlace(root) {
    // Compute bounds
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Move to origin (center)
    root.position.sub(center);

    // Scale to human size (~1.7m tall). Use Y as height proxy; fallback to max axis.
    const height = Math.max(size.y, Math.max(size.x, size.z), 0.001);
    const scale = 1.7 / height;
    root.scale.setScalar(scale);

    // After scaling, recompute and move feet to y=0
    const box2 = new THREE.Box3().setFromObject(root);
    const min = box2.min.clone();
    root.position.y -= min.y;

    // Place avatar standing near table, not inside camera
    root.position.set(1.6, 0.0, 1.6);
    root.rotation.y = Math.PI; // face toward center
  }

  async function loadAvatar(key) {
    const url = AVATAR_FILES[key];
    if (!url) {
      Bus?.log?.(`AVATAR ERROR: Unknown key "${key}"`);
      return;
    }

    // clear existing
    if (current) {
      scene.remove(current);
      current.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
          else o.material.dispose?.();
        }
      });
      current = null;
    }

    Bus?.log?.(`AVATAR: LOADING ${key}…`);
    setAvHud(key);

    try {
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root) throw new Error("No scene in GLB");

      // Safe materials: ensure visible even in low light (tiny emissive)
      root.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = false;
        o.receiveShadow = false;
        const m = o.material;
        const apply = (mat) => {
          if (!mat) return;
          if ("emissive" in mat) {
            mat.emissive = mat.emissive || new THREE.Color(0x000000);
            mat.emissive.add(new THREE.Color(0x001000));
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.4);
          }
          mat.needsUpdate = true;
        };
        if (Array.isArray(m)) m.forEach(apply);
        else apply(m);
      });

      normalizeAndPlace(root);
      current = root;
      scene.add(root);

      Bus?.log?.(`AVATAR: ${key} SPAWNED`);
    } catch (e) {
      setAvHud("NONE");
      Bus?.log?.(`AVATAR LOAD FAIL: ${e?.message || e}`);
    }
  }

  window.spawnAvatar = (key) => loadAvatar(key);
  window.clearAvatar = () => {
    if (current) scene.remove(current);
    current = null;
    setAvHud(null);
    Bus?.log?.("AVATAR: CLEARED");
  };

  Bus?.log?.("AVATAR MANAGER ONLINE");
}

// =====================================================
// SPINE (engine start)
// =====================================================
export const Spine = {
  started: false,
  ctx: null,

  async start() {
    if (this.started) return;
    this.started = true;

    const Bus = makeBus();
    setStatus("boot…", true);
    Bus.log("booting…");

    try {
      const mount = ensureMount();

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x06040a);

      // Camera
      const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 500);
      camera.position.set(0, 1.7, 6);

      // Renderer (fixes null width by using mount)
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.xr.enabled = true;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      mount.appendChild(renderer.domElement);

      fitRenderer(renderer, camera, mount);
      window.addEventListener("resize", () => fitRenderer(renderer, camera, mount));

      // Light
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 0.75);
      key.position.set(6, 10, 8);
      scene.add(key);

      // Rig (movement root)
      const rig = new THREE.Group();
      rig.name = "rig";
      rig.position.set(0, 1.7, 7);
      rig.add(camera);
      scene.add(rig);

      // Controllers (optional)
      let controller1 = null;
      let controller2 = null;
      try {
        controller1 = renderer.xr.getController(0);
        controller2 = renderer.xr.getController(1);
        rig.add(controller1);
        rig.add(controller2);
      } catch (e) {
        // safe ignore
      }

      // Context for world + input
      const ctx = {
        THREE,
        scene,
        camera,
        renderer,
        rig,
        Bus,
        log: (m) => Bus.log(m),
        controller1,
        controller2,

        // these will be filled by world/input
        walkSurfaces: [],
        teleportSurfaces: [],
      };

      this.ctx = ctx;

      // HUD init
      setHud("av", "NONE");
      Bus.log("✅ Spine module loaded");
      setStatus("ready ✅", true);

      // Load world (IMPORTANT: correct relative path)
      Bus.log("… importing ./js/scarlett1/world.js");
      let worldMod = null;
      try {
        worldMod = await import("../scarlett1/world.js");
      } catch (e) {
        // If your root importer is different, this path is still the correct one for SVR/js/runtime/
        // ../scarlett1/world.js -> SVR/js/scarlett1/world.js
        Bus.log(`❌ world import failed: ${e?.message || e}`);
        throw e;
      }

      // World init
      if (worldMod?.init) {
        await worldMod.init(ctx);
      } else if (worldMod?.default?.init) {
        await worldMod.default.init(ctx);
      } else {
        Bus.log("⚠️ world.js has no init(ctx). Using fallback floor.");
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(50, 50),
          new THREE.MeshStandardMaterial({ color: 0x2a2140, roughness: 0.95 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        scene.add(floor);
        ctx.walkSurfaces.push(floor);
        ctx.teleportSurfaces.push(floor);
      }

      // Bring avatar system online immediately
      initAvatars({ scene, Bus });

      // Auto-spawn requested default
      // (You can change this to "male" or "ninja")
      try {
        await window.spawnAvatar?.("male");
      } catch {}

      // Animation loop
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const dt = Math.min(clock.getDelta(), 0.033);

        // If your world adds ctx.Input, call it
        try {
          if (ctx.Input?.update) ctx.Input.update(dt);
        } catch (e) {
          // don’t hard-crash in VR
          Bus.log(`update error: ${e?.message || e}`);
        }

        renderer.render(scene, camera);
      });

      Bus.log("✅ boot complete");
      setStatus("ready ✅", true);
    } catch (e) {
      console.error(e);
      setStatus("boot failed ❌", false);

      const Bus = makeBus();
      Bus.log(`❌ boot failed: ${e?.message || e}`);

      // Also write to diagnostics log if present
      const pre = document.getElementById("log");
      if (pre) pre.textContent += `\n❌ boot failed: ${e?.message || e}`;
    }
  },
};

export default Spine;
