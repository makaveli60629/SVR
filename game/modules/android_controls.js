export function createAndroidControls({ camera, renderer, gotoScene, joinTable, leaveTable, setStatus } = {}) {
  const isTouch = matchMedia?.('(pointer: coarse)')?.matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || new URLSearchParams(location.search).has('android');
  if (!isTouch || !camera || !renderer) return { update(){}, dispose(){} };

  const root = document.createElement('div');
  root.id = 'svr-android-controls';
  root.innerHTML = `
    <div class="svr-pad svr-left"><div class="svr-knob"></div></div>
    <div class="svr-pad svr-right"><div class="svr-knob"></div></div>
    <div class="svr-actions">
      <button data-act="seat">Seat</button>
      <button data-act="leave">Leave</button>
      <button data-act="reiki">Reiki</button>
      <button data-act="holo">Holo</button>
      <button data-act="table">Table</button>
    </div>`;
  const style = document.createElement('style');
  style.textContent = `
    #svr-android-controls{position:fixed;inset:0;z-index:18;pointer-events:none;font-family:system-ui,Arial,sans-serif}
    #svr-android-controls .svr-pad{position:absolute;width:118px;height:118px;border:1px solid rgba(140,255,242,.55);border-radius:999px;background:rgba(0,12,16,.28);box-shadow:0 0 22px rgba(0,255,230,.12);pointer-events:auto;touch-action:none;display:grid;place-items:center}
    #svr-android-controls .svr-left{left:18px;bottom:72px}.svr-right{right:18px;bottom:72px}
    #svr-android-controls .svr-knob{width:42px;height:42px;border-radius:999px;background:rgba(140,255,242,.62);box-shadow:0 0 18px rgba(140,255,242,.45);transform:translate(0,0)}
    #svr-android-controls .svr-actions{position:absolute;left:50%;transform:translateX(-50%);bottom:14px;display:flex;gap:7px;pointer-events:auto}
    #svr-android-controls button{border:1px solid rgba(140,255,242,.55);background:rgba(0,12,16,.72);color:#eaffff;border-radius:999px;padding:8px 10px;font-weight:800;font-size:12px;min-width:54px}
    @media (min-width:900px){#svr-android-controls{display:none}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(root);

  const pads = { left: { x:0, y:0, active:false }, right: { x:0, y:0, active:false } };
  function setupPad(which) {
    const el = root.querySelector(which === 'left' ? '.svr-left' : '.svr-right');
    const knob = el.querySelector('.svr-knob');
    const state = pads[which];
    const reset = () => { state.x = 0; state.y = 0; state.active = false; knob.style.transform = 'translate(0,0)'; };
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); state.active = true; move(e); });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', reset);
    el.addEventListener('pointercancel', reset);
    function move(e) {
      if (!state.active) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const max = 42;
      const len = Math.hypot(dx, dy);
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      state.x = dx / max;
      state.y = dy / max;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
    }
  }
  setupPad('left'); setupPad('right');

  root.querySelector('[data-act="seat"]')?.addEventListener('click', () => { joinTable?.(); setStatus?.('Android: seat', { force:true }); });
  root.querySelector('[data-act="leave"]')?.addEventListener('click', () => { leaveTable?.(); setStatus?.('Android: leave', { force:true }); });
  root.querySelector('[data-act="reiki"]')?.addEventListener('click', () => gotoScene?.('reiki'));
  root.querySelector('[data-act="holo"]')?.addEventListener('click', () => gotoScene?.('reikiTalk'));
  root.querySelector('[data-act="table"]')?.addEventListener('click', () => gotoScene?.('table'));

  const yaw = { value: camera.rotation.y || 0 };
  return {
    update(dt = 0.016) {
      const l = pads.left, r = pads.right;
      yaw.value -= r.x * dt * 1.75;
      camera.rotation.y = yaw.value;
      const speed = 3.2;
      const forward = -l.y * speed * dt;
      const strafe = l.x * speed * dt;
      const sin = Math.sin(yaw.value), cos = Math.cos(yaw.value);
      camera.position.x += sin * forward + cos * strafe;
      camera.position.z += cos * forward - sin * strafe;
      camera.position.y = Math.max(camera.position.y, 1.35);
    },
    dispose() { root.remove(); style.remove(); }
  };
}
