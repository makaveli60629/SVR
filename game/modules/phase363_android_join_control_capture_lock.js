export const BUILD = 'PHASE-363-ANDROID-JOIN-CONTROL-CAPTURE-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  capturedPresses: 0,
  pointerActivations: 0,
  clickFallbackActivations: 0,
  duplicateActivationsBlocked: 0,
  duplicateControlsHidden: 0,
  labelRepairs: 0,
  lastAction: null,
  lastActivationAt: 0,
  installedAt: null
};

function desiredLabel() {
  return window.SVR_PHASE363_STATE?.joined ? 'LEAVE TABLE' : 'JOIN TABLE';
}

function hideDuplicates() {
  const authority = document.querySelector('#svr347Actions [data-ui="seat"]');
  let hidden = 0;
  for (const button of document.querySelectorAll('button')) {
    if (button === authority || button.closest('#runtimeRecovery') || button.id === 'startRuntimeBtn') continue;
    const text = String(button.textContent || '').trim().toUpperCase();
    if (!['SIT', 'SEAT', 'SIT DOWN', 'SIT AT TABLE', 'PLAY GAME', 'JOIN TABLE', 'LEAVE', 'LEAVE TABLE'].includes(text)) continue;
    button.hidden = true;
    button.setAttribute('aria-hidden', 'true');
    try { button.inert = true; } catch {}
    hidden += 1;
  }
  state.duplicateControlsHidden = Math.max(state.duplicateControlsHidden, hidden);
  if (authority) {
    const label = desiredLabel();
    if (String(authority.textContent || '').trim() !== label) {
      authority.textContent = label;
      state.labelRepairs += 1;
    }
    authority.hidden = false;
    authority.removeAttribute('aria-hidden');
    authority.setAttribute('aria-label', label === 'JOIN TABLE' ? 'Join poker table' : 'Leave poker table');
    try { authority.inert = false; } catch {}
  }
}

function activate(event, source) {
  const button = event.target?.closest?.('#svr347Actions [data-ui="seat"]');
  if (!button) return false;
  event.preventDefault();
  event.stopImmediatePropagation();

  const now = performance.now();
  if (now - state.lastActivationAt < 650) {
    state.duplicateActivationsBlocked += 1;
    return true;
  }
  state.lastActivationAt = now;
  state.capturedPresses += 1;
  if (source === 'pointerdown') state.pointerActivations += 1;
  else state.clickFallbackActivations += 1;

  const joined = Boolean(window.SVR_PHASE363_STATE?.joined);
  state.lastAction = joined ? 'leave' : 'join';
  const handler = joined ? window.SVR_PHASE363_LEAVE_TABLE : window.SVR_PHASE363_JOIN_TABLE;
  if (typeof handler === 'function') handler(`join-control-${source}`);
  else window.SVR_PHASE363_TOGGLE_JOIN?.();
  queueMicrotask(hideDuplicates);
  setTimeout(hideDuplicates, 0);
  setTimeout(hideDuplicates, 100);
  return true;
}

function install() {
  if (!ACTIVE || state.installed) return;
  if (typeof window.SVR_PHASE363_TOGGLE_JOIN !== 'function') {
    setTimeout(install, 80);
    return;
  }
  state.installed = true;
  state.installedAt = new Date().toISOString();
  window.addEventListener('pointerdown', (event) => activate(event, 'pointerdown'), true);
  window.addEventListener('click', (event) => activate(event, 'click'), true);
  const observer = new MutationObserver(hideDuplicates);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(hideDuplicates, 120);
  hideDuplicates();
  window.SVR_PHASE363_JOIN_CONTROL_STATE = state;
  window.SVR_PHASE363_JOIN_CONTROL_QA = () => {
    hideDuplicates();
    const authority = document.querySelector('#svr347Actions [data-ui="seat"]');
    const visible = [...document.querySelectorAll('button')].filter((button) => {
      if (button.hidden) return false;
      const text = String(button.textContent || '').trim().toUpperCase();
      return ['JOIN TABLE', 'LEAVE TABLE', 'SIT', 'SEAT', 'PLAY GAME', 'LEAVE'].includes(text);
    });
    const label = String(authority?.textContent || '').trim();
    return {
      ...state,
      authorityPresent: Boolean(authority),
      visibleJoinControls: visible.length,
      labels: visible.map((button) => String(button.textContent || '').trim()),
      expectedLabel: desiredLabel(),
      labelCorrect: label === desiredLabel(),
      pass: Boolean(authority && visible.length === 1 && label === desiredLabel()),
      checkedAt: new Date().toISOString()
    };
  };
}

[40, 120, 260, 600].forEach((delay) => setTimeout(install, delay));
