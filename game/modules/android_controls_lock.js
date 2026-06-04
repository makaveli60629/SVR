// Phase 98S-Y — Android/mobile controls emergency restore
// Shows two sticks and action buttons on mobile/Android without requiring WebXR.

const PHASE = '98S-Y';

function isMobileLike() {
  return /Android|iPhone|iPad|iPod|Mobile|Quest/i.test(navigator.userAgent || '') || window.innerWidth < 920;
}

function makeStyles() {
  if (document.getElementById('svr-android-controls-style')) return;
  const style = document.createElement('style');
  style.id = 'svr-android-controls-style';
  style.textContent = `
    #svrAndroidControls{position:fixed;inset:0;z-index:28;pointer-events:none;display:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;}
    body.svr-mobile-controls #svrAndroidControls{display:block;}
    .svr-stick-zone{position:absolute;bottom:72px;width:138px;height:138px;border-radius:50%;border:2px solid rgba(127,255,212,.42);background:rgba(0,0,0,.24);box-shadow:0 0 28px rgba(0,0,0,.42);pointer-events:auto;touch-action:none;}
    .svr-stick-zone.left{left:18px;}
    .svr-stick-zone.right{right:18px;}
    .svr-stick-dot{position:absolute;left:50%;top:50%;width:54px;height:54px;margin-left:-27px;margin-top:-27px;border-radius:50%;background:rgba(127,255,212,.75);box-shadow:0 0 20px rgba(127,255,212,.55);transform:translate(0,0);}
    .svr-mobile-actions{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;pointer-events:auto;max-width:calc(100vw - 22px);}
    .svr-mobile-actions button{border:1px solid rgba(105,232,255,.55);background:rgba(2,8,18,.78);color:#fff;border-radius:999px;padding:10px 13px;font-weight:900;font-size:12px;box-shadow:0 10px 28px rgba(0,0,0,.38);}
    .svr-mobile-actions button:active{background:rgba(127,255,212,.22);}
    .svr-mobile-badge{position:absolute;left:50%;top:12px;transform:translateX(-50%);border:1px solid rgba(127,255,212,.42);background:rgba(0,0,0,.58);color:#eafff4;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;pointer-events:none;}
  `;
  document.head.appendChild(style);
}

function dispatchControl(name, detail = {}) {
  window.dispatchEvent(new CustomEvent('svr-mobile-control', { detail: { name, ...detail, phase: PHASE } }));
}

function makeStick(container, side) {
  const dot = document.createElement('div');
  dot.className = 'svr-stick-dot';
  container.appendChild(dot);
  const state = { active: false, id: null, x: 0, y: 0 };

  function reset() {
    state.active = false;
    state.id = null;
    state.x = 0;
    state.y = 0;
    dot.style.transform = 'translate(0px,0px)';
    dispatchControl(side === 'left' ? 'move' : 'look', { x: 0, y: 0, side });
  }

  function update(clientX, clientY) {
    const r = container.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const max = 42;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    state.x = dx / max;
    state.y = -dy / max;
    dot.style.transform = `translate(${dx}px,${dy}px)`;
    dispatchControl(side === 'left' ? 'move' : 'look', { x: state.x, y: state.y, side });
  }

  container.addEventListener('pointerdown', (e) => {
    state.active = true;
    state.id = e.pointerId;
    container.setPointerCapture?.(e.pointerId);
    update(e.clientX, e.clientY);
  });
  container.addEventListener('pointermove', (e) => {
    if (!state.active || e.pointerId !== state.id) return;
    update(e.clientX, e.clientY);
  });
  container.addEventListener('pointerup', reset);
  container.addEventListener('pointercancel', reset);
}

function go(url) { window.location.href = url; }

function install() {
  makeStyles();
  if (document.getElementById('svrAndroidControls')) return;
  if (isMobileLike()) document.body.classList.add('svr-mobile-controls');

  const root = document.createElement('div');
  root.id = 'svrAndroidControls';
  root.innerHTML = `
    <div class="svr-mobile-badge">ANDROID / MOBILE CONTROLS ACTIVE</div>
    <div class="svr-stick-zone left" aria-label="Move stick"></div>
    <div class="svr-stick-zone right" aria-label="Look stick"></div>
    <div class="svr-mobile-actions">
      <button type="button" data-action="sit">SIT</button>
      <button type="button" data-action="teleport">TELEPORT</button>
      <button type="button" data-action="reiki">REIKI</button>
      <button type="button" data-action="pga">PGA</button>
      <button type="button" data-action="store">STORE</button>
      <button type="button" data-action="scorpion">SCORPION</button>
    </div>
  `;
  document.body.appendChild(root);
  makeStick(root.querySelector('.svr-stick-zone.left'), 'left');
  makeStick(root.querySelector('.svr-stick-zone.right'), 'right');

  root.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      dispatchControl(action);
      if (action === 'reiki') go('./reiki-room.html?v=phase98sy-android-controls');
      if (action === 'pga') go('./pga-drive.html?v=phase98sy-android-controls');
      if (action === 'store') go('./store-room.html?v=phase98sy-android-controls');
      if (action === 'scorpion') go('./scorpion.html?v=phase98sy-android-controls');
    });
  });

  window.SVR_ANDROID_CONTROLS_LOCK = {
    phase: PHASE,
    installed: true,
    mobileDetected: isMobileLike(),
    buttons: ['sit','teleport','reiki','pga','store','scorpion'],
    sticks: 2
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();

export { install };
