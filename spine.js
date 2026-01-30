// /spine.js — PERMANENT ROOT SPINE (LOUD + SAFE)
// Goal: Always show something + always log why world fails.

export const Spine = (() => {
  let logs = [];
  let diagEl = null;

  const log = (m) => {
    logs.push(String(m));
    if (logs.length > 500) logs.shift();
    console.log(m);
    if (diagEl) diagEl.textContent = logs.join('\n');
  };

  function getReport() {
    return logs.join('\n');
  }

  async function loadThree() {
    // Stable ESM build
    const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
    return THREE;
  }

  function ensureCanvasLayer(renderer) {
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '0';
    document.body.appendChild(renderer.domElement);
  }

  function bindPublicAPI({ renderer, rig, camera }) {
    window.SCARLETT = window.SCARLETT || {};
    window.SCARLETT.getReport = getReport;

    window.SCARLETT.resetSpawn = () => {
      try {
        rig.position.set(0, 0, 0);
        rig.rotation.set(0, 0, 0);
        camera.position.set(0, 1.7, 16);
        camera.lookAt(0, 1.35, 0);
        log('[api] resetSpawn ✅');
      } catch (e) {
        log(`[api] resetSpawn ❌ ${e?.message || e}`);
      }
    };

    window.SCARLETT.enterVR = async () => {
      try {
        const ok = !!(navigator.xr);
        log(`[xr] navigator.xr = ${ok ? '✅' : '❌'}`);
        if (!ok) return;
        // On mobile/Quest, user gesture is required; this button supplies it.
        await renderer.xr.setSession(
          await navigator.xr.requestSession('immersive-vr', {
            optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'],
          })
        );
        log('[xr] session started ✅');
      } catch (e) {
        log(`[xr] enterVR ❌ ${e?.message || e}`);
      }
    };
  }

  async function start({ say } = {}) {
    diagEl = document.getElementById('diag') || null;

    const sayLog = say || log;
    sayLog('[spine] start() ✅');

    // Hard guards
    window.addEventListener('error', (e) => sayLog(`[spine.window.error] ${e.message}`));
    window.addEventListener('unhandledrejection', (e) => sayLog(`[spine.unhandled] ${String(e.reason || e)}`));

    let THREE;
    try {
      sayLog('[spine] loading THREE…');
      THREE = await loadThree();
      sayLog('[spine] THREE loaded ✅');
    } catch (e) {
      sayLog(`[spine] THREE failed ❌ ${e?.message || e}`);
      return;
    }

    // Scene core
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050b);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 800);
    camera.position.set(0, 1.7, 16);

    const rig = new THREE.Group();
    rig.add(camera);
    scene.add(rig);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.xr.enabled = true;
    ensureCanvasLayer(renderer);

    bindPublicAPI({ renderer, rig, camera });

    // Always-bright fallback lights (so you NEVER get black screen)
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const hemi = new THREE.HemisphereLight(0xffffff, 0x202040, 1.0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(10, 18, 8);
    scene.add(dir);

    // Fallback object so you KNOW rendering works
    const fallback = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x8a2be2, metalness: 0.2, roughness: 0.4 })
    );
    fallback.position.set(0, 1.6, 0);
    scene.add(fallback);

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // World load (optional, must not kill rendering)
    let updates = [];
    const ctx = {
      THREE,
      scene,
      camera,
      rig,
      renderer,
      log: sayLog,
      setXRSpawn: (posVec3, yaw = 0) => {
        try {
          rig.position.copy(posVec3);
          rig.rotation.set(0, yaw, 0);
          sayLog(`[xr] spawn set ✅ (${posVec3.x.toFixed(2)},${posVec3.y.toFixed(2)},${posVec3.z.toFixed(2)})`);
        } catch (e) {
          sayLog(`[xr] spawn set ❌ ${e?.message || e}`);
        }
      }
    };

    try {
      sayLog('[spine] importing world…');
      const worldMod = await import('./js/scarlett1/world.js');
      sayLog('[spine] world imported ✅');

      if (worldMod?.init) {
        const res = await worldMod.init(ctx);
        updates = (res && Array.isArray(res.updates)) ? res.updates : [];
        sayLog(`[spine] world init ✅ updates=${updates.length}`);
      } else {
        sayLog('[spine] world has no export init() ❌');
      }
    } catch (e) {
      sayLog(`[spine] world failed ❌ ${e?.message || e}`);
      sayLog('[spine] continuing with fallback scene ✅');
    }

    // Animation
    let last = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // animate fallback cube so you KNOW frames are running
      fallback.rotation.y += dt * 0.7;
      fallback.rotation.x += dt * 0.35;

      for (const fn of updates) {
        try { fn(dt); } catch (e) { sayLog(`[update] ❌ ${e?.message || e}`); }
      }

      renderer.render(scene, camera);
    });

    sayLog('[spine] render loop running ✅');
  }

  return { start, getReport };
})();
