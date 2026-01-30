import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const Spine = (() => {
  let renderer, scene, camera;
  let updates = [];
  let worldApi = null;

  const logLines = [];
  const logBox = () => document.getElementById('logBox');

  function log(msg) {
    console.log(msg);
    logLines.push(msg);
    const el = logBox();
    if (el) el.textContent = logLines.join('\n');
  }

  function hardReload() {
    location.reload(true);
  }

  function copyReport() {
    const text = logLines.join('\n');
    navigator.clipboard?.writeText(text).then(
      () => log('[ui] report copied ✅'),
      () => log('[ui] copy failed ❌')
    );
  }

  function setHudVisible(v) {
    const hud = document.getElementById('hud');
    if (!hud) return;
    hud.style.display = v ? 'grid' : 'none';
    log(v ? '[ui] HUD shown ✅' : '[ui] HUD hidden ✅');
  }

  function resetSpawn() {
    if (!camera) return;
    camera.position.set(0, 1.6, 6);
    camera.lookAt(0, 1.4, 0);
    log('[ui] spawn reset ✅');
  }

  // --- Touch joystick (moves camera) ---
  const joystick = {
    active: false,
    dx: 0,
    dy: 0,
    base: null,
    stick: null,
    centerX: 0,
    centerY: 0,
    radius: 70,
  };

  function initJoystick() {
    joystick.base = document.getElementById('joyBase');
    joystick.stick = document.getElementById('joyStick');
    if (!joystick.base || !joystick.stick) return;

    const onDown = (e) => {
      joystick.active = true;
      const rect = joystick.base.getBoundingClientRect();
      joystick.centerX = rect.left + rect.width / 2;
      joystick.centerY = rect.top + rect.height / 2;
      onMove(e);
    };

    const onMove = (e) => {
      if (!joystick.active) return;
      const t = e.touches ? e.touches[0] : e;
      const x = t.clientX - joystick.centerX;
      const y = t.clientY - joystick.centerY;

      const dist = Math.hypot(x, y);
      const max = joystick.radius;
      const nx = dist > max ? (x / dist) * max : x;
      const ny = dist > max ? (y / dist) * max : y;

      joystick.dx = nx / max;        // -1..1
      joystick.dy = ny / max;        // -1..1

      joystick.stick.style.transform =
        `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    };

    const onUp = () => {
      joystick.active = false;
      joystick.dx = 0;
      joystick.dy = 0;
      joystick.stick.style.transform = `translate(-50%, -50%)`;
    };

    joystick.base.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp, { passive: true });

    log('[input] joystick ready ✅');
  }

  function applyJoystickMove(dt) {
    if (!camera) return;
    const speed = 2.0; // m/s

    // forward is -Z in three; use camera yaw
    const yaw = camera.rotation.y;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const f = -joystick.dy;  // push up = move forward
    const r = joystick.dx;

    const move = new THREE.Vector3()
      .addScaledVector(forward, f)
      .addScaledVector(right, r);

    if (move.lengthSq() > 0.0001) {
      move.normalize().multiplyScalar(speed * dt);
      camera.position.add(move);
    }
  }

  async function enterVR() {
    if (!renderer) return;

    if (!navigator.xr) {
      log('[xr] WebXR not available (use Quest/Oculus Browser) ❌');
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported('immersive-vr');
      if (!supported) {
        log('[xr] immersive-vr not supported on this device ❌');
        return;
      }

      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
      });

      renderer.xr.enabled = true;
      await renderer.xr.setSession(session);
      log('[xr] session started ✅');
    } catch (e) {
      log('[xr] session failed ❌ ' + (e?.message || e));
    }
  }

  function hookUI() {
    const byId = (id) => document.getElementById(id);

    byId('btnEnterVR')?.addEventListener('click', enterVR);
    byId('btnReset')?.addEventListener('click', resetSpawn);
    byId('btnCopy')?.addEventListener('click', copyReport);
    byId('btnReload')?.addEventListener('click', hardReload);
    byId('btnHideHud')?.addEventListener('click', () => setHudVisible(false));
    byId('btnShowHud')?.addEventListener('click', () => setHudVisible(true));

    log('[ui] buttons wired ✅');
  }

  function onResize() {
    if (!renderer || !camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  async function loadWorld() {
    // always load scarlett1 world
    const mod = await import('./js/scarlett1/world.js');
    const init = mod?.init;
    if (typeof init !== 'function') {
      log('[spine] world init export missing ❌');
      return;
    }

    worldApi = await init({
      THREE,
      scene,
      camera,
      log
    });

    updates = Array.isArray(worldApi?.updates) ? worldApi.updates : [];
    log('[world] ready ✅');
  }

  function animate() {
    const clock = new THREE.Clock();

    function loop() {
      const dt = clock.getDelta();

      // input
      applyJoystickMove(dt);

      // world updates
      for (const fn of updates) {
        try { fn(dt); } catch (e) { /* ignore */ }
      }

      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(loop);
    log('[spine] animation loop ✅');
  }

  async function start() {
    log('[boot] JS LOADED ✅ (module tag ran)');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // IMPORTANT: ensure visible canvas layering
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.pointerEvents = 'auto';

    document.body.appendChild(renderer.domElement);
    log('[spine] renderer created ✅');

    hookUI();
    initJoystick();

    window.addEventListener('resize', onResize);

    log('[world] init');
    await loadWorld();

    animate();
    log('[boot] spine started ✅');
  }

  return { start };
})();
