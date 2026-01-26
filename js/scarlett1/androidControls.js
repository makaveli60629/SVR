/**
 * SCARLETT1 • ANDROID CONTROLS (PERMANENT)
 * Dual-stick overlay:
 *  - Left stick: move (forward/back/strafe)
 *  - Right stick: yaw turn
 *
 * Spine reads window.__scarlettInput each frame.
 */
export const AndroidControls = (() => {
  const input = {
    moveX: 0,   // strafe (-1..1)
    moveZ: 0,   // forward (-1..1) where + is forward
    yaw: 0,     // turn (-1..1)
    active: false
  };

  window.__scarlettInput = input;

  let root;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function makeStick(label) {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      width:160px; height:160px; border-radius:999px;
      border:1px solid rgba(120,160,255,0.25);
      background:rgba(10,12,18,0.35);
      position:relative; touch-action:none;
      backdrop-filter: blur(6px);
    `;

    const knob = document.createElement('div');
    knob.style.cssText = `
      width:64px; height:64px; border-radius:999px;
      border:1px solid rgba(120,160,255,0.45);
      background:rgba(20,25,40,0.65);
      position:absolute; left:50%; top:50%;
      transform:translate(-50%,-50%);
      box-shadow:0 8px 20px rgba(0,0,0,0.35);
    `;

    const cap = document.createElement('div');
    cap.textContent = label;
    cap.style.cssText = `
      position:absolute; left:50%; top:8px; transform:translateX(-50%);
      font:700 12px ui-sans-serif, system-ui; color:rgba(216,230,255,0.85);
      text-shadow:0 2px 8px rgba(0,0,0,0.6);
      pointer-events:none;
    `;

    wrap.appendChild(knob);
    wrap.appendChild(cap);

    return { wrap, knob };
  }

  function mount(Diagnostics) {
    if (root) return;

    root = document.createElement('div');
    root.id = 'scarlett-android-sticks';
    root.style.cssText = `
      position:fixed; left:0; top:0; right:0; bottom:0;
      z-index:999998;
      pointer-events:none;
    `;

    const left = makeStick('MOVE');
    const right = makeStick('TURN');

    const leftPos = document.createElement('div');
    leftPos.style.cssText = `position:absolute; left:14px; bottom:14px; pointer-events:auto;`;
    leftPos.appendChild(left.wrap);

    const rightPos = document.createElement('div');
    rightPos.style.cssText = `position:absolute; right:14px; bottom:14px; pointer-events:auto;`;
    rightPos.appendChild(right.wrap);

    root.appendChild(leftPos);
    root.appendChild(rightPos);
    document.body.appendChild(root);

    bindStick(left.wrap, left.knob, (nx, ny, down) => {
      input.active = input.active || down;
      input.moveX = down ? nx : 0;
      input.moveZ = down ? -ny : 0;
    });

    bindStick(right.wrap, right.knob, (nx, ny, down) => {
      input.active = input.active || down;
      input.yaw = down ? nx : 0;
    });

    Diagnostics?.log?.('[androidPads] armed ✅ (MOVE + TURN sticks)');
  }

  function bindStick(area, knob, onUpdate) {
    const rectOf = () => area.getBoundingClientRect();
    let pid = null;
    let down = false;

    function setKnob(nx, ny) {
      const r = 52;
      const x = nx * r;
      const y = ny * r;
      knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }

    function end() {
      down = false;
      pid = null;
      setKnob(0, 0);
      onUpdate(0, 0, false);
    }

    area.addEventListener('pointerdown', (e) => {
      pid = e.pointerId;
      down = true;
      area.setPointerCapture(pid);
      area.style.borderColor = 'rgba(180,210,255,0.55)';
    });

    area.addEventListener('pointermove', (e) => {
      if (!down || e.pointerId !== pid) return;
      const r = rectOf();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      const nx = clamp(dx, -1, 1);
      const ny = clamp(dy, -1, 1);
      setKnob(nx, ny);
      onUpdate(nx, ny, true);
    });

    area.addEventListener('pointerup', (e) => {
      if (e.pointerId !== pid) return;
      area.releasePointerCapture(pid);
      area.style.borderColor = 'rgba(120,160,255,0.25)';
      end();
    });

    area.addEventListener('pointercancel', () => {
      area.style.borderColor = 'rgba(120,160,255,0.25)';
      end();
    });
  }

  return { mount };
})();
