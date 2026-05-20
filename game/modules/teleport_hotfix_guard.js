/*
 * SVR Poker — Phase 116 Emergency Teleport Freeze Hardfix
 * Game-side only. Stops fist/clench teleport freeze by using edge-only input,
 * throttled polling, single marker reuse, short cooldowns, and safe cancel paths.
 */
(function () {
  'use strict';

  const BUILD = 'PHASE-116-EMERGENCY-TELEPORT-WATCH-HARDFIX-LOCK';
  const COOLDOWN_MS = 450;
  const DEBOUNCE_MS = 180;
  const MAX_AIM_MS = 8000;
  const POLL_MS = 125;

  const state = {
    build: BUILD,
    phase: 116,
    status: 'idle',
    active: false,
    source: null,
    startedAt: 0,
    lastReleaseAt: 0,
    lastEdgeAt: 0,
    lastTarget: null,
    lastError: null,
    markerVisible: false,
    ready: false,
    events: []
  };

  window.SVR_TELEPORT_HOTFIX = state;
  window.SVR_TELEPORT_STATE = state;
  window.SVR_PHASE116_TELEPORT_FREEZE_HARDFIX = state;

  const SOURCE_MAP = {
    gripdown: 'grip', gripstart: 'grip', gripup: 'grip', gripend: 'grip',
    triggerdown: 'trigger', triggerup: 'trigger', selectstart: 'trigger', selectend: 'trigger',
    abuttondown: 'a-button', abuttonup: 'a-button',
    pinchstarted: 'pinch', pinchstart: 'pinch', pinchended: 'pinch', pinchend: 'pinch',
    fiststart: 'fist', fistend: 'fist', clenchstart: 'fist', clenchdown: 'fist', clenchend: 'fist', clenchup: 'fist'
  };

  const START_EVENTS = ['gripdown','gripstart','triggerdown','selectstart','abuttondown','pinchstarted','pinchstart','fiststart','clenchstart','clenchdown'];
  const END_EVENTS = ['gripup','gripend','triggerup','selectend','abuttonup','pinchended','pinchend','fistend','clenchend','clenchup'];

  function log(type, detail) {
    const entry = { type, detail: detail || {}, t: Date.now() };
    state.events.push(entry);
    if (state.events.length > 60) state.events.shift();
    try { window.dispatchEvent(new CustomEvent('svr:teleport:phase116-log', { detail: entry })); } catch (_) {}
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
    document.querySelectorAll('[data-svr-teleport-status], .svr-teleport-status, #svr-teleport-status').forEach((el) => {
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
      'position:fixed','left:50%','bottom:92px','transform:translateX(-50%)','z-index:999999',
      'pointer-events:none','display:none','padding:10px 16px','border-radius:999px',
      'font:700 13px system-ui,Segoe UI,Arial,sans-serif','letter-spacing:.08em','color:#f0dcff',
      'background:rgba(88,20,148,.72)','border:1px solid rgba(220,160,255,.82)',
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
    try {
      window.dispatchEvent(new CustomEvent(show ? 'svr:teleport:show-marker' : 'svr:teleport:hide-marker', {
        detail: { build: BUILD, source: state.source, active: state.active }
      }));
    } catch (_) {}
  }

  function dispatchTeleport(action, detail) {
    const payload = Object.assign({ build: BUILD, phase: 116, source: state.source }, detail || {});
    const names = action === 'start'
      ? ['svr:teleport:start-aim', 'svr:teleport:arm']
      : action === 'release'
        ? ['svr:teleport:release', 'svr:teleport:commit']
        : ['svr:teleport:cancel'];

    names.forEach((name) => {
      try { window.dispatchEvent(new CustomEvent(name, { detail: payload })); } catch (_) {}
    });

    const scene = rootScene();
    names.forEach((name) => {
      try { scene.dispatchEvent(new CustomEvent(name, { detail: payload })); } catch (_) {}
    });

    const candidates = [window.SVRTeleport, window.SVR_TELEPORT, window.SVR && window.SVR.teleport, window.SVR && window.SVR.teleportRouter, window.teleportRouter].filter(Boolean);
    for (const api of candidates) {
      try {
        if (action === 'start') {
          if (typeof api.startAim === 'function') { api.startAim(payload); break; }
          if (typeof api.arm === 'function') { api.arm(payload); break; }
          if (typeof api.setArmed === 'function') { api.setArmed(true, payload); break; }
        } else if (action === 'release') {
          if (typeof api.release === 'function') { api.release(payload); break; }
          if (typeof api.commit === 'function') { api.commit(payload); break; }
          if (typeof api.teleport === 'function') { api.teleport(payload); break; }
          if (typeof api.setArmed === 'function') { api.setArmed(false, payload); break; }
        } else {
          if (typeof api.cancel === 'function') { api.cancel(payload); break; }
          if (typeof api.setArmed === 'function') { api.setArmed(false, payload); break; }
        }
      } catch (err) {
        state.lastError = String(err && err.message || err);
        log('api-error', { action, error: state.lastError });
      }
    }
  }

  function canEdge() {
    const now = Date.now();
    if (now - state.lastEdgeAt < DEBOUNCE_MS) return false;
    state.lastEdgeAt = now;
    return true;
  }

  function beginAim(source, detail) {
    const now = Date.now();
    if (state.status === 'cooldown' && now - state.lastReleaseAt < COOLDOWN_MS) return;
    if (state.active) return;
    if (!canEdge()) return;

    state.status = 'aiming';
    state.active = true;
    state.source = source || 'unknown';
    state.startedAt = now;
    state.lastError = null;

    document.documentElement.dataset.svrTeleport = 'aiming';
    showMarker(true);
    setWatchStatus('TP AIM — RELEASE');
    dispatchTeleport('start', detail);
    log('begin', { source: state.source });
  }

  function releaseAim(source, detail) {
    if (!state.active) return;
    const activeSource = state.source;
    if (source && activeSource && source !== activeSource && source !== 'safety' && source !== 'lost-tracking' && source !== 'visibility') return;
    if (!canEdge()) return;

    state.status = 'released';
    state.active = false;
    state.lastReleaseAt = Date.now();
    showMarker(false);
    setWatchStatus('TP READY');
    dispatchTeleport('release', detail);
    log('release', { source: source || activeSource });

    window.setTimeout(() => {
      if (!state.active) {
        state.status = 'idle';
        state.source = null;
        document.documentElement.dataset.svrTeleport = 'idle';
      }
    }, COOLDOWN_MS);
  }

  function cancelAim(reason) {
    if (!state.active) return;
    const oldSource = state.source;
    state.status = 'cancelled';
    state.active = false;
    state.lastReleaseAt = Date.now();
    showMarker(false);
    setWatchStatus('TP READY');
    dispatchTeleport('cancel', { reason });
    log('cancel', { source: oldSource, reason });

    window.setTimeout(() => {
      if (!state.active) {
        state.status = 'idle';
        state.source = null;
        document.documentElement.dataset.svrTeleport = 'idle';
      }
    }, COOLDOWN_MS);
  }

  function bindTarget(target) {
    if (!target || target.__svrPhase116TeleportBound) return;
    target.__svrPhase116TeleportBound = true;
    START_EVENTS.forEach((name) => {
      target.addEventListener(name, (event) => beginAim(SOURCE_MAP[name] || name, { originalEvent: name, detail: event.detail || {} }), { passive: true });
    });
    END_EVENTS.forEach((name) => {
      target.addEventListener(name, (event) => releaseAim(SOURCE_MAP[name] || name, { originalEvent: name, detail: event.detail || {} }), { passive: true });
    });
  }

  function bindControllers() {
    bindTarget(window);
    bindTarget(document);
    bindTarget(rootScene());
    const selectors = [
      '[hand-tracking-controls]','[oculus-touch-controls]','[meta-touch-controls]','[laser-controls]','[tracked-controls]',
      '#leftHand','#rightHand','#left-hand','#right-hand','.hand','.controller','.xr-controller'
    ];
    selectors.forEach((sel) => document.querySelectorAll(sel).forEach(bindTarget));
  }

  let lastGamepadPressed = false;
  function readGamepadsEdge() {
    let pressed = false;
    try {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      for (const pad of pads) {
        const b = pad && pad.buttons ? pad.buttons : [];
        if (!!(b[0]?.pressed || b[1]?.pressed || b[4]?.pressed || b[5]?.pressed)) { pressed = true; break; }
      }
    } catch (_) {}
    if (pressed && !lastGamepadPressed) beginAim('gamepad', { gamepad: true });
    if (!pressed && lastGamepadPressed && state.active && state.source === 'gamepad') releaseAim('gamepad', { gamepad: true });
    lastGamepadPressed = pressed;
  }

  let lastFist = false;
  function readFistEdge() {
    const handState = window.SVR_HAND_STATE || window.SVRHands || (window.SVR && window.SVR.hands) || null;
    if (!handState) return;
    const left = handState.left || handState.Left || handState.leftHand || {};
    const right = handState.right || handState.Right || handState.rightHand || {};
    const fist = !!(left.fist || left.clench || left.clenched || left.isFist || right.fist || right.clench || right.clenched || right.isFist);
    if (fist && !lastFist) beginAim('fist', { handState: true });
    if (!fist && lastFist && state.active && state.source === 'fist') releaseAim('fist', { handState: true });
    lastFist = fist;
  }

  function pollSafety() {
    readGamepadsEdge();
    readFistEdge();
    if (state.active && Date.now() - state.startedAt > MAX_AIM_MS) cancelAim('max-aim-timeout');
  }

  function bindKeyboardFallback() {
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      if (event.code === 'KeyT') beginAim('keyboard', { key: 'T' });
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === 'KeyT') releaseAim('keyboard', { key: 'T' });
    });
  }

  function init() {
    ensureMarker();
    bindControllers();
    bindKeyboardFallback();
    window.setInterval(bindControllers, 1200);
    window.setInterval(pollSafety, POLL_MS);

    window.addEventListener('blur', () => cancelAim('window-blur'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAim('visibility-hidden'); });
    window.addEventListener('beforeunload', () => cancelAim('unload'));

    state.ready = true;
    document.documentElement.dataset.svrTeleportHotfix = BUILD;
    setWatchStatus('TP READY');
    log('ready', { build: BUILD });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
