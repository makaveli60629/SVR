// Phase 98S-I — Android Two-Stick Mobile Controls Lock
// Mobile-only test controls. Desktop and WebXR are intentionally left unchanged.

const LOCK_NAME = "SVR_Phase98SI_Android_Two_Stick_Controls_Lock";

function isMobileLike() {
  const ua = navigator.userAgent || "";
  const touch = navigator.maxTouchPoints > 1 || "ontouchstart" in window;
  return touch && /Android|Mobile|Tablet|iPhone|iPad/i.test(ua);
}

function createStick(label, side) {
  const wrap = document.createElement("div");
  wrap.className = `svr-mobile-stick svr-mobile-stick-${side}`;
  wrap.innerHTML = `<div class="svr-stick-label">${label}</div><div class="svr-stick-base"><div class="svr-stick-knob"></div></div>`;
  return wrap;
}

function injectCss() {
  if (document.getElementById("svr-android-controls-css")) return;
  const style = document.createElement("style");
  style.id = "svr-android-controls-css";
  style.textContent = `
    #svrAndroidControls {
      position: fixed;
      inset: 0;
      z-index: 45;
      pointer-events: none;
      display: none;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    }
    body.svr-mobile-controls-on #svrAndroidControls { display: block; }
    body.preview-mode #svrAndroidControls { display: none !important; }
    .svr-mobile-stick {
      position: absolute;
      bottom: max(18px, env(safe-area-inset-bottom));
      width: 142px;
      height: 168px;
      pointer-events: auto;
      touch-action: none;
      user-select: none;
    }
    .svr-mobile-stick-left { left: max(16px, env(safe-area-inset-left)); }
    .svr-mobile-stick-right { right: max(16px, env(safe-area-inset-right)); }
    .svr-stick-label {
      text-align: center;
      color: #e9e9ff;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .08em;
      text-shadow: 0 0 12px rgba(127,255,212,.75);
      margin-bottom: 8px;
    }
    .svr-stick-base {
      position: relative;
      width: 132px;
      height: 132px;
      margin: 0 auto;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(127,255,212,.22), rgba(0,0,0,.56));
      border: 2px solid rgba(127,255,212,.62);
      box-shadow: 0 0 22px rgba(127,255,212,.22), inset 0 0 26px rgba(0,0,0,.66);
    }
    .svr-stick-knob {
      position: absolute;
      left: 42px;
      top: 42px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #ffffff, #7fffd4 42%, #3c5bff 100%);
      border: 1px solid rgba(255,255,255,.78);
      box-shadow: 0 0 18px rgba(127,255,212,.55);
      transform: translate3d(0,0,0);
    }
    #svrMobileHint {
      position: absolute;
      left: 50%;
      bottom: max(18px, env(safe-area-inset-bottom));
      transform: translateX(-50%);
      color: #eafff4;
      background: rgba(0,0,0,.54);
      border: 1px solid rgba(127,255,212,.38);
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 800;
      pointer-events: none;
      white-space: nowrap;
    }
    @media (min-width: 900px) {
      .svr-mobile-stick { bottom: 26px; }
    }
  `;
  document.head.appendChild(style);
}

function setupStick(el, stateKey, state) {
  const base = el.querySelector(".svr-stick-base");
  const knob = el.querySelector(".svr-stick-knob");
  let activeId = null;
  const max = 42;

  function setFromEvent(e) {
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const len = Math.max(1, Math.hypot(dx, dy));
    const clamped = Math.min(max, len);
    const nx = (dx / len) * clamped;
    const ny = (dy / len) * clamped;
    knob.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    state[stateKey].x = nx / max;
    state[stateKey].y = ny / max;
  }

  function reset() {
    activeId = null;
    state[stateKey].x = 0;
    state[stateKey].y = 0;
    knob.style.transform = "translate3d(0,0,0)";
  }

  base.addEventListener("pointerdown", (e) => {
    activeId = e.pointerId;
    base.setPointerCapture?.(activeId);
    setFromEvent(e);
    e.preventDefault();
  });
  base.addEventListener("pointermove", (e) => {
    if (activeId !== e.pointerId) return;
    setFromEvent(e);
    e.preventDefault();
  });
  base.addEventListener("pointerup", reset);
  base.addEventListener("pointercancel", reset);
  base.addEventListener("lostpointercapture", reset);
}

function getCamera() {
  return window.SVR_CAMERA || null;
}

function applyMobileInput(state) {
  const camera = getCamera();
  if (!camera) return;
  const dt = Math.min(0.05, state.clock());
  const move = state.left;
  const look = state.right;

  const speed = 3.0;
  const turnSpeed = 1.75;

  camera.rotation.y -= look.x * turnSpeed * dt;

  const yaw = camera.rotation.y;
  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  const forwardAmount = -move.y;
  const strafeAmount = move.x;
  camera.position.x += (forwardX * forwardAmount + rightX * strafeAmount) * speed * dt;
  camera.position.z += (forwardZ * forwardAmount + rightZ * strafeAmount) * speed * dt;

  // Keep mobile tester roughly inside the lobby bounds without needing main.js roomClamp access.
  camera.position.x = Math.max(-28, Math.min(28, camera.position.x));
  camera.position.z = Math.max(-28, Math.min(28, camera.position.z));
}

export function installAndroidControlsLock() {
  if (window[LOCK_NAME]) return window[LOCK_NAME];
  if (!isMobileLike()) {
    window[LOCK_NAME] = { phase: "98S-I", installed: false, reason: "not-mobile" };
    return window[LOCK_NAME];
  }

  injectCss();

  const root = document.createElement("div");
  root.id = "svrAndroidControls";
  root.appendChild(createStick("MOVE", "left"));
  root.appendChild(createStick("TURN", "right"));
  const hint = document.createElement("div");
  hint.id = "svrMobileHint";
  hint.textContent = "Android test controls locked: left move • right turn";
  root.appendChild(hint);
  document.body.appendChild(root);
  document.body.classList.add("svr-mobile-controls-on");

  const state = {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    _last: performance.now(),
    clock() {
      const now = performance.now();
      const dt = (now - this._last) / 1000;
      this._last = now;
      return dt;
    }
  };

  setupStick(root.querySelector(".svr-mobile-stick-left"), "left", state);
  setupStick(root.querySelector(".svr-mobile-stick-right"), "right", state);

  function tick() {
    applyMobileInput(state);
    requestAnimationFrame(tick);
  }
  tick();

  window[LOCK_NAME] = {
    phase: "98S-I",
    installed: true,
    controls: "two-stick",
    leftStick: "move/strafe",
    rightStick: "turn",
    permanentLock: true
  };
  window.SVR_ANDROID_CONTROLS_LOCK = window[LOCK_NAME];
  return window[LOCK_NAME];
}

installAndroidControlsLock();
