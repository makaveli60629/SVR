// /js/runtime/spine.js
// Single, hardened engine entry. CDN imports only (NO bare 'three' imports).
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { Input } from './input.js';

const AVATAR_FILES = {
  male: './assets/avatars/male.glb',
  female: './assets/avatars/female.glb',
  ninja: './assets/avatars/ninja.glb',
  combat: './assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb',
  apocalypse_female: './assets/avatars/futuristic_apocalypse_female_cargo_pants.glb',
};

function safeDispose(root){
  if (!root) return;
  root.traverse(o=>{
    if (o.geometry?.dispose) o.geometry.dispose();
    const m = o.material;
    if (Array.isArray(m)) m.forEach(x=>x?.dispose?.());
    else m?.dispose?.();
  });
}

function setHudAvatar(name){
  const el = document.getElementById('av');
  if (el) el.textContent = 'Avatar: ' + (name ? String(name).toUpperCase() : 'NONE');
}

async function initAvatars({ scene, log }) {
  const loader = new GLTFLoader();
  let current = null;

  function normalizeAndPlace(root) {
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

    root.position.set(1.6, 0.0, 1.6);
    root.rotation.y = Math.PI;
  }

  async function loadAvatar(key){
    const url = AVATAR_FILES[key];
    if (!url){ log?.(`AVATAR ERROR: Unknown key "${key}"`); return; }

    if (current){
      scene.remove(current);
      safeDispose(current);
      current = null;
    }

    log?.(`AVATAR: LOADING ${key}…`);
    setHudAvatar(key);

    try{
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root) throw new Error('No scene in GLB');

      root.traverse(o=>{
        if (!o.isMesh) return;
        o.castShadow = false;
        o.receiveShadow = false;
        const m = o.material;
        const apply = (mat)=>{
          if (!mat) return;
          if ('emissive' in mat){
            mat.emissive = mat.emissive || new THREE.Color(0x000000);
            mat.emissive.add(new THREE.Color(0x001000));
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.4);
          }
          mat.needsUpdate = true;
        };
        if (Array.isArray(m)) m.forEach(apply); else apply(m);
      });

      normalizeAndPlace(root);
      current = root;
      scene.add(root);
      log?.(`AVATAR: ${key} SPAWNED`);
    }catch(e){
      setHudAvatar(null);
      log?.(`AVATAR LOAD FAIL: ${e?.message||e}`);
    }
  }

  window.spawnAvatar = (key)=>loadAvatar(key);
  window.clearAvatar = ()=>{
    if (current){
      scene.remove(current);
      safeDispose(current);
    }
    current = null;
    setHudAvatar(null);
    log?.('AVATAR: CLEARED');
  };

  log?.('AVATAR MANAGER ONLINE');
}

function makeLights(scene){
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const d = new THREE.DirectionalLight(0xffffff, 0.75);
  d.position.set(8,14,10);
  scene.add(d);

  const p = new THREE.PointLight(0x8a2be2, 1.2, 120);
  p.position.set(0,10.5,0);
  scene.add(p);
}

async function loadWorld(ctx){
  // World is kept in /js/scarlett1/world.js (DO NOT move folders).
  try{
    const mod = await import('../scarlett1/world.js');
    if (mod?.init) await mod.init(ctx);
    else ctx.log?.('WORLD: module missing init(ctx), using fallback');
  }catch(e){
    ctx.log?.('WORLD IMPORT FAIL: ' + (e?.message||e));
    // fallback: simple floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(18, 64),
      new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.9, metalness: 0.0 })
    );
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = false;
    ctx.scene.add(floor);
    ctx.walkSurfaces.push(floor);
    ctx.teleportSurfaces.push(floor);
  }
}

export const Spine = {
  async start(api={}){
    const log = api.log || ((m)=>console.log(m));
    const setStatus = api.setStatus || (()=>{});

    // Ensure body exists (fixes "Cannot read properties of null (reading 'width')" in WebGLRenderer)
    if (!document.body) throw new Error('document.body missing');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060b);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);
    camera.position.set(0, 1.7, 3.0);

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
    renderer.setPixelRatio(Math.min(devicePixelRatio||1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Rig: everything (hands/lasers/feetRing) must be relative to THIS rig
    const rig = new THREE.Group();
    rig.position.set(0, 1.7, 6);
    rig.add(camera);
    scene.add(rig);

    // Controllers
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);
    rig.add(controller1);
    rig.add(controller2);

    // Cache WebXR gamepads onto controller objects.
    // (On Quest/Android inside XR, navigator.getGamepads() can be unreliable.)
    const bindGamepad = (ctrl) => {
      ctrl.addEventListener('connected', (e) => {
        // three.js passes WebXRInputSource data in e.data
        if (e?.data?.gamepad) ctrl.gamepad = e.data.gamepad;
        if (e?.data?.handedness) ctrl.userData.handedness = e.data.handedness;
      });
      ctrl.addEventListener('disconnected', () => {
        ctrl.gamepad = null;
      });
    };
    bindGamepad(controller1);
    bindGamepad(controller2);

    // Surfaces used by Input
    const walkSurfaces = [];
    const teleportSurfaces = [];

    // Basic lights first so even fallback is visible
    makeLights(scene);

    const ctx = { THREE, scene, camera, renderer, rig, controller1, controller2, walkSurfaces, teleportSurfaces, log };

    // load world + avatar manager
    await loadWorld(ctx);
    await initAvatars({ scene, log });

    // Input after world so teleport surfaces exist
    Input.init({ ...ctx, walkSurfaces, teleportSurfaces });

    // Public actions
    window.resetSpawn = ()=>{
      rig.position.set(0, 1.7, 6);
      rig.rotation.set(0, 0, 0);
      log('✅ spawn reset');
      Input.snapGround?.();
    };

    window.enterVR = async ()=>{
      try{
        const s = renderer.xr.getSession();
        if (s) return;
        // WebXR button is normally external; we just call requestSession if possible.
        if (!navigator.xr) { log('XR not available'); return; }
        const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures:['local-floor','bounded-floor','hand-tracking'] });
        renderer.xr.setSession(session);
        log('✅ entered VR');
      }catch(e){
        log('ENTER VR FAIL: ' + (e?.message||e));
      }
    };

    // Resize
    window.addEventListener('resize', ()=>{
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let last = performance.now();
    function loop(){
      const now = performance.now();
      const dt = Math.min(0.05, (now-last)/1000);
      last = now;

      try{
        Input.update(dt);
      }catch(e){
        // Don't hard-crash; just log once per second max
        if (!Spine._lastInputErr || (now-Spine._lastInputErr)>1000){
          Spine._lastInputErr = now;
          log('INPUT ERROR: ' + (e?.message||e));
        }
      }

      renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(loop);

    setStatus(true, 'ready ✅ (VR available)');
    log('✅ Spine started');
  }
};
