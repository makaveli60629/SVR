// SVR/js/scarlett1/modules/locomotionPads.js
// Movement that works NOW:
// - Android: on-screen touch pads (left move, right turn)
// - Desktop: WASD + QE turn
// - VR (hands-only): push hand forward/back to move (fallback)

export function LocomotionPads() {
  let keys = {};
  let pads = null;

  return {
    id: 'locomotionPads',

    init(ctx) {
      const { log } = ctx;
      pads = makePadsUI();
      hookKeys();
      log?.('[move] pads + keys ready');
    },

    update(dt, ctx) {
      const { rig, renderer } = ctx;

      // --- Desktop keys ---
      const moveSpeed = 3.2;      // m/s
      const turnSpeed = 1.6;      // rad/s

      // Move in rig-local space
      const fwd = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
      const str = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
      const trn = (keys['KeyE'] ? 1 : 0) - (keys['KeyQ'] ? 1 : 0);

      if (fwd || str) {
        rig.translateZ(-fwd * moveSpeed * dt);
        rig.translateX(str * moveSpeed * dt);
      }
      if (trn) rig.rotation.y -= trn * turnSpeed * dt;

      // --- Android pads ---
      if (pads) {
        const mv = pads.left;   // x strafe, y forward
        const rt = pads.right;  // x turn
        if (mv.active) {
          rig.translateZ(-mv.y * moveSpeed * dt);
          rig.translateX(mv.x * moveSpeed * dt);
        }
        if (rt.active) {
          rig.rotation.y -= rt.x * turnSpeed * dt;
        }
      }

      // --- VR hands-only fallback movement ---
      // Only if XR is presenting (hand pose movement)
      const session = renderer.xr.getSession?.();
      if (session) {
        const hand0 = renderer.xr.getHand(0);
        if (hand0 && hand0.visible) {
          // If hand is pushed forward (negative z), move forward
          const hz = hand0.position.z;
          if (hz < -0.18) rig.translateZ(-moveSpeed * dt);
          if (hz >  0.18) rig.translateZ( moveSpeed * dt);

          // Small snap-turn if hand is far left/right
          const hx = hand0.position.x;
          if (hx > 0.18) rig.rotation.y -= 1.2 * dt;
          if (hx < -0.18) rig.rotation.y += 1.2 * dt;
        }
      }
    }
  };
}

// ---------- helpers ----------

function hookKeys() {
  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
}

function makePadsUI() {
  // Create lightweight touch pads without touching HTML files
  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    position: 'absolute',
    left: '0', right: '0', bottom: '0',
    height: '180px',
    zIndex: 9,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 18px 18px 18px',
    pointerEvents: 'none'
  });

  const left = makePad('MOVE');
  const right = makePad('TURN');

  wrap.appendChild(left.el);
  wrap.appendChild(right.el);
  document.body.appendChild(wrap);

  // If no touch support, hide pads (desktop)
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
  if (!isTouch) {
    wrap.style.display = 'none';
    return null;
  }

  return { left: left.state, right: right.state };
}

function makePad(label) {
  const el = document.createElement('div');
  Object.assign(el.style, {
    width: '150px',
    height: '150px',
    borderRadius: '18px',
    border: '1px solid rgba(0,255,0,0.6)',
    background: 'rgba(0,20,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(0,255,0,0.85)',
    fontFamily: 'monospace',
    userSelect: 'none',
    pointerEvents: 'auto',
    touchAction: 'none'
  });

  const txt = document.createElement('div');
  txt.textContent = label;
  txt.style.opacity = '0.9';
  el.appendChild(txt);

  const state = { active: false, x: 0, y: 0, _id: null, _cx: 0, _cy: 0 };

  function norm(v) { return Math.max(-1, Math.min(1, v)); }

  el.addEventListener('pointerdown', (e) => {
    state.active = true;
    state._id = e.pointerId;
    const r = el.getBoundingClientRect();
    state._cx = r.left + r.width / 2;
    state._cy = r.top + r.height / 2;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!state.active || e.pointerId !== state._id) return;
    const dx = (e.clientX - state._cx) / 55; // pad sensitivity
    const dy = (e.clientY - state._cy) / 55;
    state.x = norm(dx);
    state.y = norm(dy);
  });

  function end(e) {
    if (e.pointerId !== state._id) return;
    state.active = false;
    state._id = null;
    state.x = 0;
    state.y = 0;
  }

  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', () => {
    state.active = false; state._id = null; state.x = 0; state.y = 0;
  });

  return { el, state };
}
