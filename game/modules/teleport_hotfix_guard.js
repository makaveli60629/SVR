/*
 * SVR Poker — Phase 105 Teleport Hotfix Guard
 * Goal: normalize fist/clench, grip, A-button, trigger/select into one hold-to-aim/release-to-teleport state.
 * Safe, additive module. It does not remove existing locomotion; it wraps/bridges inputs and dispatches SVR teleport events.
 */
(function () {
  'use strict';

  const BUILD = 'PHASE-105-TELEPORT-HOTFIX-ZIP-DEPLOY-LOCK';
  const COOLDOWN_MS = 280;
  const MAX_AIM_MS = 15000;

  const state = {
    build: BUILD,
    phase: 105,
    status: 'idle',
    active: false,
    source: null,
    startedAt: 0,
    lastReleaseAt: 0,
    lastTarget: null,
    lastError: null,
    markerVisible: false,
    events: [],
    ready: false
  };

  window.SVR_TELEPORT_HOTFIX = state;
  window.SVR_TELEPORT_STATE = state;

  function log(type, detail) {
    const entry = { type, detail: detail || {}, t: Date.now() };
    state.events.push(entry);
    if (state.events.length > 80) state.events.shift();
    try {
      window.dispatchEvent(new CustomEvent('svr:teleport:hotfix-log', { detail: entry }));
    } catch (_) {}
  }

  function rootScene() {
    return document.querySelector('a-scene') || document.body || document.documentElement;
  }

  function setWatchStatus(label) {
    try {
      window.dispatchEvent(new CustomEvent('svr:watch:teleport-state', {
        detail: { build: BUILD, status: state.status, active: state.active, source: state.source, label }
      }));
    } catch (_) {}

    const watchLabels = document.querySelectorAll('[data-svr-teleport-status], .svr-teleport-status, #svr-teleport-status');
    watchLabels.forEach((el) => {
      try { el.textContent = label; } catch (_) {}
    });
  }

  function ensureMarker() {
    let marker = document.getElementById('svr-teleport-hotfix-marker');
    if (marker) return marker;

    marker = document.createElement('div');
    marker.id = 'svr-teleport-hotfix-marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.style.cssText = [
      'position:fixed',
      'left:50%',
      'bottom:92px',
      'transform:translateX(-50%)',
      'z-index:999999',
      'pointer-events:none',
      'display:none',
      'padding:10px 16px',
      'border-radius:999px',
      'font:700 13px system-ui,Segoe UI,Arial,sans-serif',
      'letter-spacing:.08em',
      'color:#f0dcff',
      'background:rgba(88,20,148,.72)',
      'border:1px solid rgba(220,160,255,.82)',
      'box-shadow:0 0 22px rgba(184,78,255,.85), inset 0 0 14px rgba(255,255,255,.12)',
      'text-shadow:0 0 8px rgba(255,255,255,.6)'
    ].join(';');
    marker.textContent = 'TELEPORT AIMING — RELEASE TO MOVE';
    document.body.appendChild(marker);
    return marker;
  }

  function showMarker(show) {
    state.markerVisible = !!show;
    const marker = ensureMarker();
    marker.style.display = show ? 'block' : 'none';

    // Also emit for real in-world arc/marker systems that already exist.
    try {
      window.dispatchEvent(new CustomEvent(show ? 'svr:teleport:show-marker' : 'svr:teleport:hide-marker', {
        detail: { build: BUILD, source: state.source, active: state.active }
      }));
    } catch (_) {}
  }

  function callExistingTeleport(action, detail) {
    const payload = Object.assign({ build: BUILD, source: state.source }, detail || {});

    // Event bridge for existing router modules.
    const names = action === 'start'
      ? ['svr:teleport:start-aim', 'svr:teleport:arm', 'svr:teleport-aim-start']
      : action === 'release'
        ? ['svr:teleport:release', 'svr:teleport:commit', 'svr:teleport-aim-release']
        : ['svr:teleport:cancel', 'svr:teleport-aim-cancel'];

    names.forEach((name) => {
      try { window.dispatchEvent(new CustomEvent(name, { detail: payload })); } catch (_) {}
      try { rootScene().dispatchEvent(new CustomEvent(name, { detail: payload })); } catch (_) {}
    });

    // Optional direct API bridges without requiring any one implementation.
    const candidates = [
      window.SVRTeleport,
      window.SVR_TELEPORT,
      window.SVR && window.SVR.teleport,
      window.SVR && window.SVR.teleportRouter,
      window.teleportRouter
    ].filter(Boolean);

    candidates.forEach((api) => {
      try {
        if (action === 'start') {
          if (typeof api.startAim === 'function') api.startAim(payload);
          else if (typeof api.arm === 'function') api.arm(payload);
          else if (typeof api.setArmed === 'function') api.setArmed(true, payload);
        } else if (action === 'release') {
          if (typeof api.release === 'function') api.release(payload);
          else if (typeof api.commit === 'function') api.commit(payload);
          else if (typeof api.teleport === 'function') api.teleport(payload);
          else if (typeof api.setArmed === 'function') api.setArmed(false, payload);
        } else if (action === 'cancel') {
          if (typeof api.cancel === 'function') api.cancel(payload);
          else if (typeof api.setArmed === 'function') api.setArmed(false, payload);
        }
      } catch (err) {
        state.lastError = String(err && err.message || err);
        log('api-error', { action, error: state.lastError });
      }
    });
  }

  function beginAim(source, detail) {
    const now = Date.now();
    if (state.status === 'cooldown' && now - state.lastReleaseAt < COOLDOWN_MS) return;
    if (state.active && state.source === source) return;

    state.status = 'aiming';
    state.active = true;
    state.source = source || 'unknown';
    state.startedAt = now;
    state.lastError = null;

    document.documentElement.dataset.svrTeleport = 'aiming';
    showMarker(true);
    setWatchStatus('TP AIM — RELEASE');
    callExistingTeleport('start', detail);
    log('begin', { source: state.source });
  }

  function endAim(source, detail) {
    if (!state.active) return;
    if (source && state.source && source !== state.source) {
      // Prevent one input from releasing a different active input unless it is a generic safety release.
      if (source !== 'lost-tracking' && source !== 'visibility' && source !== 'keyboard') return;
    }

    state.status = 'released';
    state.active = false;
    state.lastReleaseAt = Date.now();

    showMarker(false);
    setWatchStatus('TP READY');
    callExistingTeleport('release', detail);
    log('release', { source: source || state.source });

    window.setTimeout(() => {
      if (!state.active) {
        state.status = 'idle';
        state.source = null;
        document.documentElement.dataset.svrTeleport = 'idle';
        setWatchStatus('TP READY');
      }
    }, COOLDOWN_MS);
  }

  function cancelAim(reason) {
    if (!state.active) return;
    const oldSource = state.source;
    state.status = 'cancelled';
    state.active = false;
    showMarker(false);
    setWatchStatus('TP READY');
    callExistingTeleport('cancel', { reason });
    log('cancel', { source: oldSource, reason });

    window.setTimeout(() => {
      if (!state.active) {
        state.status = 'idle';
        state.source = null;
        document.documentElement.dataset.svrTeleport = 'idle';
      }
    }, COOLDOWN_MS);
  }

  function isPressedValue(v) {
    return v === true || v === 1 || v === '1' || v === 'pressed' || v === 'down';
  }

  function bindControllerEvents(target) {
    if (!target || target.__svrTeleportHotfixBound) return;
    target.__svrTeleportHotfixBound = true;

    const starts = [
      'gripdown', 'gripstart',
      'abuttondown', 'buttondown',
      'triggerdown', 'selectstart',
      'pinchstarted', 'pinchstart',
      'fiststart', 'clenchstart', 'clenchdown'
    ];
    const ends = [
      'gripup', 'gripend',
      'abuttonup', 'buttonup',
      'triggerup', 'selectend',
      'pinchended', 'pinchend',
      'fistend', 'clenchend', 'clenchup'
    ];

    starts.forEach((name) => {
      target.addEventListener(name, (event) => beginAim(name, { originalEvent: name, detail: event.detail || {} }), { passive: true });
    });
    ends.forEach((name) => {
      target.addEventListener(name, (event) => endAim(name.replace(/(up|end|ended)$/,'down'), { originalEvent: name, detail: event.detail || {} }), { passive: true });
    });

    target.addEventListener('axismove', (event) => {
      // Do not interfere with stick locomotion. This listener exists only to keep binding alive on controllers.
      state.lastAxisEvent = Date.now();
    }, { passive: true });
  }

  function bindExistingHandsAndControllers() {
    const selectors = [
      '[hand-tracking-controls]',
      '[oculus-touch-controls]',
      '[meta-touch-controls]',
      '[laser-controls]',
      '[tracked-controls]',
      '#leftHand', '#rightHand', '#left-hand', '#right-hand',
      '.hand', '.controller', '.xr-controller'
    ];
    selectors.forEach((sel) => document.querySelectorAll(sel).forEach(bindControllerEvents));
    bindControllerEvents(document);
    bindControllerEvents(window);
    bindControllerEvents(rootScene());
  }

  function readGamepadButtons() {
    const pads = (navigator.getGamepads && Array.from(navigator.getGamepads()).filter(Boolean)) || [];
    let shouldAim = false;
    let source = null;

    pads.forEach((pad, padIndex) => {
      if (!pad || !pad.buttons) return;
      const pressed = pad.buttons.map((b) => !!(b && b.pressed));
      // Common XR mappings: trigger 0, grip 1, A/B 4/5 depending hand/profile.
      const hit = pressed[0] || pressed[1] || pressed[4] || pressed[5];
      if (hit) {
        shouldAim = true;
        source = `gamepad-${padIndex}`;
      }
    });

    if (shouldAim && !state.active) beginAim(source || 'gamepad', { gamepad: true });
    if (!shouldAim && state.active && state.source && String(state.source).startsWith('gamepad')) endAim(state.source, { gamepad: true });
  }

  let lastFistState = false;
  function readHandPoseSignals() {
    // Optional global bridges from existing hand modules. This avoids requiring one specific hand library.
    const handState = window.SVR_HAND_STATE || window.SVRHands || (window.SVR && window.SVR.hands) || null;
    if (!handState) return;

    const left = handState.left || handState.Left || handState.leftHand || {};
    const right = handState.right || handState.Right || handState.rightHand || {};
    const fist = !!(
      left.fist || left.clench || left.clenched || left.isFist || left.grip ||
      right.fist || right.clench || right.clenched || right.isFist || right.grip
    );

    if (fist && !lastFistState) beginAim('fist', { handState: true });
    if (!fist && lastFistState && state.active && state.source === 'fist') endAim('fist', { handState: true });
    lastFistState = fist;
  }

  function bindKeyboardFallback() {
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      if (event.code === 'KeyT') beginAim('keyboard', { key: 'T' });
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === 'KeyT') endAim('keyboard', { key: 'T' });
    });
  }

  function safetyTick() {
    readGamepadButtons();
    readHandPoseSignals();

    if (state.active && Date.now() - state.startedAt > MAX_AIM_MS) {
      cancelAim('max-aim-timeout');
    }

    window.requestAnimationFrame(safetyTick);
  }

  function init() {
    ensureMarker();
    bindExistingHandsAndControllers();
    bindKeyboardFallback();

    // Re-bind if A-Frame/controller entities load later.
    const observer = new MutationObserver(() => bindExistingHandsAndControllers());
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('blur', () => cancelAim('window-blur'));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAim('visibility-hidden');
    });
    window.addEventListener('beforeunload', () => cancelAim('unload'));

    state.ready = true;
    document.documentElement.dataset.svrTeleportHotfix = BUILD;
    setWatchStatus('TP READY');
    log('ready', { build: BUILD });
    window.requestAnimationFrame(safetyTick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
