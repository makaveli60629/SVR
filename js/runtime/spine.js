// /js/runtime/spine.js
// CDN-only Three.js imports (GitHub Pages safe; NO "from 'three'")
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { VRButton } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

import { Input } from "./input.js";
import { initWorld } from "../scarlett1/world.js";

const AVATAR_FILES = {
  male: "./assets/avatars/male.glb",
  female: "./assets/avatars/female.glb",
  ninja: "./assets/avatars/ninja.glb",
  combat: "./assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb",
  apocalypse_female: "./assets/avatars/futuristic_apocalypse_female_cargo_pants.glb",
};

function $(id){ return document.getElementById(id); }

export const Bus = {
  lines: [],
  log(msg){
    const t = new Date().toISOString().slice(11,19);
    const line = `[${t}] ${msg}`;
    this.lines.push(line);
    if (this.lines.length > 140) this.lines.shift();
    const el = $("diag");
    if (el) el.textContent = this.lines.join("\n");
    // also console
    console.log(msg);
  },
  status(text){
    const el = $("status");
    if (el) el.textContent = text;
  }
};

export const Spine = {
  THREE,
  scene: null,
  camera: null,
  renderer: null,
  rig: null,

  controller1: null,
  controller2: null,

  walkSurfaces: [],
  teleportSurfaces: [],

  clock: new THREE.Clock(),
  loader: new GLTFLoader(),
  currentAvatar: null,

  async start(){
    try{
      Bus.status("boot…");
      Bus.log("=== SCARLETT DIAGNOSTICS (INLINE BOOT) ===");
      Bus.log(`href=${location.href}`);
      Bus.log(`origin=${location.origin}`);
      Bus.log(`path=${location.pathname}`);
      Bus.log(`ua=${navigator.userAgent}`);
      Bus.log(`secureContext=${window.isSecureContext}`);
      Bus.log(`navigator.xr=${!!navigator.xr}`);

      // Ensure app container exists
      const app = document.getElementById("app");
      if (!app) throw new Error("#app missing in DOM");

      // Scene / Camera / Renderer (no canvas arg -> avoids 'width' null errors)
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x05060a);

      this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.04, 500);
      this.camera.position.set(0, 1.7, 4);

      this.renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:"high-performance" });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.xr.enabled = true;

      app.innerHTML = "";
      app.appendChild(this.renderer.domElement);

      // VR button (in DOM, but you also have your HUD button)
      document.body.appendChild(VRButton.createButton(this.renderer));

      // Rig (moves the user)
      this.rig = new THREE.Group();
      this.rig.position.set(0, 0, 0);
      this.rig.add(this.camera);
      this.scene.add(this.rig);

      // Lights
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const dir = new THREE.DirectionalLight(0xffffff, 0.75);
      dir.position.set(10, 18, 10);
      this.scene.add(dir);

      // Controllers (for laser parenting)
      this.controller1 = this.renderer.xr.getController(0);
      this.controller2 = this.renderer.xr.getController(1);
      this.scene.add(this.controller1);
      this.scene.add(this.controller2);

      // Load world
      Bus.log("loading ./js/scarlett1/world.js …");
      const worldOut = await initWorld({
        THREE,
        scene: this.scene,
        rig: this.rig,
        camera: this.camera,
        renderer: this.renderer,
        Bus
      });

      // register surfaces for locomotion
      this.walkSurfaces = worldOut?.walkSurfaces || [];
      this.teleportSurfaces = worldOut?.teleportSurfaces || this.walkSurfaces;

      // Input
      Input.init({
        THREE,
        scene: this.scene,
        rig: this.rig,
        camera: this.camera,
        renderer: this.renderer,
        controller1: this.controller1,
        controller2: this.controller2,
        walkSurfaces: this.walkSurfaces,
        teleportSurfaces: this.teleportSurfaces
      });

      // UI wiring
      this.wireUI();

      // Resize
      window.addEventListener("resize", () => this.onResize());

      // Spawn (facing table)
      this.resetSpawn(true);

      // Render loop
      this.renderer.setAnimationLoop(() => {
        const dt = Math.min(0.05, this.clock.getDelta());
        Input.update(dt);
        this.renderer.render(this.scene, this.camera);
      });

      Bus.status("ready ✅");
      Bus.log("world loaded ✅");

    } catch (e){
      Bus.status("boot failed ❌");
      Bus.log(`boot failed: ${e?.message || e}`);
      console.error(e);
    }
  },

  onResize(){
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth/window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  resetSpawn(faceCenter=false){
    // Spawn on top ring (not in pit), facing toward center
    const y = 1.7;
    const r = 10.0;
    this.rig.position.set(0, 0, r);
    this.rig.position.y = 0;
    // snap to ground
    Input.snapGround?.();
    // face center
    this.rig.rotation.y = 0;
    if (faceCenter){
      this.rig.rotation.y = Math.PI; // looking toward -Z
    }
    Bus.log("spawn reset ✅");
  },

  wireUI(){
    const enter = $("enterVr");
    const reset = $("resetSpawn");
    const hard = $("hardReload");
    const nuke = $("nukeCache");
    const probe = $("probe");

    enter?.addEventListener("click", async () => {
      try{
        // VRButton already exists; this helps mobile browsers that require gesture
        if (navigator.xr){
          const supported = await navigator.xr.isSessionSupported?.("immersive-vr");
          Bus.log(`immersive-vr supported=${!!supported}`);
        }
        // If VRButton exists, user can also tap it.
        Bus.log("Tap 'Enter VR' (system prompt) or the VRButton if visible.");
      }catch(e){ Bus.log(`EnterVR err: ${e?.message||e}`); }
    });

    reset?.addEventListener("click", () => this.resetSpawn(true));
    hard?.addEventListener("click", () => location.reload());

    nuke?.addEventListener("click", async () => {
      try{
        if ("caches" in window){
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
          Bus.log(`NUKE CACHE: deleted ${keys.length} cache(s)`);
        } else {
          Bus.log("NUKE CACHE: Cache API not available");
        }
      }catch(e){ Bus.log(`NUKE CACHE err: ${e?.message||e}`); }
    });

    probe?.addEventListener("click", async () => {
      const paths = [
        "./index.js",
        "./js/runtime/spine.js",
        "./js/runtime/input.js",
        "./js/scarlett1/world.js",
        "./assets/avatars/male.glb"
      ];
      Bus.log("— PROBE PATHS —");
      for (const p of paths){
        try{
          const r = await fetch(p, { cache:"no-store" });
          Bus.log(`${p} status=${r.status}`);
        }catch(e){
          Bus.log(`${p} status=ERR`);
        }
      }
      Bus.log("— END PROBE —");
    });

    // Avatar buttons
    $("avMale")?.addEventListener("click", () => this.spawnAvatar("male"));
    $("avFemale")?.addEventListener("click", () => this.spawnAvatar("female"));
    $("avNinja")?.addEventListener("click", () => this.spawnAvatar("ninja"));
    $("avCombat")?.addEventListener("click", () => this.spawnAvatar("combat"));
    $("avClear")?.addEventListener("click", () => this.clearAvatar());
  },

  setHud(name){
    const el = document.getElementById("av");
    if (el) el.textContent = name ? name.toUpperCase() : "NONE";
  },

  normalizeAndPlace(root){
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    root.position.sub(center);

    const height = Math.max(size.y, size.x, size.z, 0.001);
    const scale = 1.7 / height;
    root.scale.setScalar(scale);

    const box2 = new THREE.Box3().setFromObject(root);
    const min = box2.min.clone();
    root.position.y -= min.y;

    // place on outer ring near store area
    root.position.set(2.0, 0.0, 8.0);
    root.rotation.y = Math.PI;
  },

  async spawnAvatar(key){
    const url = AVATAR_FILES[key];
    if (!url){
      Bus.log(`AVATAR ERROR: unknown key "${key}"`);
      return;
    }

    // remove current
    this.clearAvatar();

    Bus.log(`AVATAR: LOADING ${key}…`);
    this.setHud(key);

    try{
      const gltf = await this.loader.loadAsync(url);
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root) throw new Error("No scene in GLB");

      // make visible in low light
      root.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = false;
        o.receiveShadow = false;
        const m = o.material;
        const apply = (mat) => {
          if (!mat) return;
          if ("emissive" in mat){
            mat.emissive = mat.emissive || new THREE.Color(0x000000);
            mat.emissive.add(new THREE.Color(0x001000));
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.35);
          }
          mat.needsUpdate = true;
        };
        if (Array.isArray(m)) m.forEach(apply); else apply(m);
      });

      this.normalizeAndPlace(root);
      this.currentAvatar = root;
      this.scene.add(root);
      Bus.log(`AVATAR: ${key} SPAWNED ✅`);
    }catch(e){
      this.setHud(null);
      Bus.log(`AVATAR LOAD FAIL: ${e?.message || e}`);
    }
  },

  clearAvatar(){
    if (!this.currentAvatar) return;
    const root = this.currentAvatar;
    this.scene.remove(root);
    root.traverse(o => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material){
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
        else o.material.dispose?.();
      }
    });
    this.currentAvatar = null;
    this.setHud(null);
    Bus.log("AVATAR: CLEARED");
  }
};
