export const BUILD = 'PHASE-363-ANDROID-JOIN-CONTROL-CAPTURE-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  capturedPresses: 0,
  duplicateControlsHidden: 0,
  lastAction: null,
  installedAt: null
};

function hideDuplicates() {
  const authority = document.querySelector('#svr347Actions [data-ui="seat"]');
  let hidden = 0;
  for (const button of document.querySelectorAll('button')) {
    if (button === authority || button.closest('#runtimeRecovery') || button.id === 'startRuntimeBtn') continue;
    const text = String(button.textContent || '').trim().toUpperCase();
    if (!['SIT', 'SEAT', 'SIT DOWN', 'SIT AT TABLE', 'PLAY GAME', 'JOIN TABLE', 'LEAVE TABLE'].includes(text)) continue;
    button.hidden = true;
    button.setAttribute('aria-hidden', 'true');
    try { button.inert = true; } catch {}
    hidden += 1;
  }
  state.duplicateControlsHidden = Math.max(state.duplicateControlsHidden, hidden);
  if (authority) {
    authority.hidden = false;
    authority.removeAttribute('aria-hidden');
    try { authority.inert = false; } catch {}
  }
}

function install() {
  if (!ACTIVE || state.installed) return;
  if (typeof window.SVR_PHASE363_TOGGLE_JOIN !== 'function') {
    setTimeout(install, 80);
    return;
  }
  state.installed = true;
  state.installedAt = new Date().toISOString();
  window.addEventListener('pointerdown', (event) => {
    const button = event.target?.closest?.('#svr347Actions [data-ui="seat"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    state.capturedPresses += 1;
    const joined = Boolean(window.SVR_PHASE363_STATE?.joined);
    state.lastAction = joined ? 'leave' : 'join';
    window.SVR_PHASE363_TOGGLE_JOIN();
    hideDuplicates();
  }, true);
  const observer = new MutationObserver(hideDuplicates);
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(hideDuplicates, 400);
  hideDuplicates();
  window.SVR_PHASE363_JOIN_CONTROL_STATE = state;
  window.SVR_PHASE363_JOIN_CONTROL_QA = () => {
    const authority = document.querySelector('#svr347Actions [data-ui="seat"]');
    const visible = [...document.querySelectorAll('button')].filter((button) => {
      if (button.hidden) return false;
      const text = String(button.textContent || '').trim().toUpperCase();
      return ['JOIN TABLE', 'LEAVE TABLE', 'SIT', 'SEAT', 'PLAY GAME'].includes(text);
    });
    return {
      ...state,
      authorityPresent: Boolean(authority),
      visibleJoinControls: visible.length,
      labels: visible.map((button) => String(button.textContent || '').trim()),
      pass: Boolean(authority && visible.length === 1),
      checkedAt: new Date().toISOString()
    };
  };
}

[40, 120, 260, 600].forEach((delay) => setTimeout(install, delay));
