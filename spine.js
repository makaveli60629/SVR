// Uses CDN three so GitHub Pages / Android works.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const Spine = {
  async start({ uiLog } = {}) {
    const log = (s) => {
      try { uiLog?.(s); } catch {}
      console.log(s);
    };

    // global API always exists
    window.SCARLETT = window.SCARLETT || {};

    // mount renderer
    const stage = document.getElementById('stage');
    if (!stage) throw new Error('#stage missing');

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    stage.innerHTML = '';
    stage.appendChild(renderer.domElement);

    log('[spine] renderer created ✅');

    // scene + camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.05,
      1000
    );

    // SAFE DEFAULT camera
    camera.position.set(0, 1.6, 7);
    camera.lookAt(0, 1.3, 0);

    // expose controls
    window.SCARLETT.enterVR = async () => {
      try {
        document.body.appendChild(THREE.WEBGL.isWebGLAvailable ? renderer.domElement : renderer.domElement);
        await (navigator.xr?.isSessionSupported?.('immersive-vr'));
      } catch {}
      try { await renderer.xr.setSession(await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] })); }
      catch (e) { log(`[xr] enterVR failed ❌ ${e?.message || e}`); }
    };

    window.SCARLETT.resetSpawn = () => {
      camera.position.set(0, 1.6, 7);
      camera.lookAt(0, 1.3, 0);
      log('[spine] spawn reset ✅');
    };

    window.SCARLETT.hideHUD = () => {
      document.body.classList.add('hud-hidden');
      log('[ui] HUD hidden ✅');
    };

    window.SCARLETT.showHUD = () => {
      document.body.classList.remove('hud-hidden');
      log('[ui] HUD shown ✅');
    };

    window.SCARLETT.getReport = () => {
      return [
        'Scarlett Diagnostics Report',
        `ua=${navigator.userAgent}`,
        `href=${location.href}`,
        `secureContext=${window.isSecureContext}`,
        `xr=${!!navigator.xr}`,
        `webgl=${!!renderer}`,
        `size=${window.innerWidth}x${window.innerHeight}`,
      ].join('\n');
    };

    // Load world
    let world;
    try {
      const mod = await import('./js/scarlett1/world.js');
      log('[spine] world module loaded ✅ (/js/scarlett1/world.js)');
      world = await mod.init({ THREE, scene, camera, log });
      log('[world] loaded ✅');
    } catch (e) {
      log(`[spine] world import/init failed ❌ ${e?.message || e}`);
      // still render something obvious
      scene.background = new THREE.Color(0x220000);
      const a = new THREE.AmbientLight(0xffffff, 1);
      scene.add(a);
    }

    const updates = world?.updates || [];
    log(`[spine] world init ✅ updates=${updates.length}`);

    // resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });

    // loop
    let last = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;

      for (const fn of updates) {
        try { fn(dt); } catch {}
      }
      renderer.render(scene, camera);
    });

    log('[spine] animation loop ✅');
    log('[boot] spine started ✅');
  }
};
