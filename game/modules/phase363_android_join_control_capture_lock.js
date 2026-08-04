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
  synchronousStateTransitions: 0,
  phase372LobbyAuthority: true,
  lastAction: null,
  lastActivationAt: 0,
  installedAt: null
};

let originalJoin = null;
let originalLeave = null;
let originalToggle = null;

function joinedNow() {
  if (typeof window.SVR_PHASE363_JOINED_IMMEDIATE === 'boolean') {
    return window.SVR_PHASE363_JOINED_IMMEDIATE;
  }
  return Boolean(window.SVR_PHASE363_STATE?.joined);
}

function setJoinedImmediate(joined, reason = 'state') {
  window.SVR_PHASE363_JOINED_IMMEDIATE = Boolean(joined);
  window.SVR_PHASE363_GAME_STATE_IMMEDIATE = joined ? 'SEATED' : 'LOBBY';
  state.synchronousStateTransitions += 1;
  window.dispatchEvent(new CustomEvent('svr:phase363-immediate-join-state', {
    detail: {
      build: BUILD,
      joined: Boolean(joined),
      gameState: joined ? 'SEATED' : 'LOBBY',
      reason,
      at: Date.now()
    }
  }));
}

function desiredLabel() {
  return joinedNow() ? 'LEAVE TABLE' : 'JOIN TABLE';
}

function phase372Button() {
  return document.getElementById('svr372Primary');
}

function restoreButton(button, label) {
  if (!button) return;
  button.hidden = false;
  button.disabled = false;
  button.removeAttribute('aria-hidden');
  button.setAttribute('aria-label', label === 'JOIN TABLE' ? 'Join poker table' : 'Leave poker table');
  try { button.inert = false; } catch {}
  if (String(button.textContent || '').trim() !== label) {
    button.textContent = label;
    state.labelRepairs += 1;
  }
}

function quarantineButton(button) {
  if (!button) return;
  button.hidden = true;
  button.setAttribute('aria-hidden', 'true');
  try { button.inert = true; } catch {}
}

function hideDuplicates() {
  const legacyAuthority = document.querySelector('#svr347Actions [data-ui="seat"]');
  const modernAuthority = phase372Button();
  const joined = joinedNow();
  const activeAuthority = !joined && modernAuthority ? modernAuthority : legacyAuthority;
  let hidden = 0;

  for (const button of document.querySelectorAll('button')) {
    if (button === activeAuthority || button.closest('#runtimeRecovery') || button.id === 'startRuntimeBtn') continue;
    const text = String(button.textContent || '').trim().toUpperCase();
    if (!['SIT', 'SEAT', 'SIT DOWN', 'SIT AT TABLE', 'PLAY GAME', 'JOIN TABLE', 'LEAVE', 'LEAVE TABLE'].includes(text)) continue;
    quarantineButton(button);
    hidden += 1;
  }

  if (!joined && modernAuthority) {
    restoreButton(modernAuthority, 'JOIN TABLE');
    quarantineButton(legacyAuthority);
  } else if (joined && legacyAuthority) {
    restoreButton(legacyAuthority, 'LEAVE TABLE');
    quarantineButton(modernAuthority);
  } else if (legacyAuthority) {
    restoreButton(legacyAuthority, desiredLabel());
  }

  state.duplicateControlsHidden = Math.max(state.duplicateControlsHidden, hidden);
}

function wrapStateApis() {
  if (originalJoin || typeof window.SVR_PHASE363_JOIN_TABLE !== 'function') return false;
  originalJoin = window.SVR_PHASE363_JOIN_TABLE;
  originalLeave = window.SVR_PHASE363_LEAVE_TABLE;
  originalToggle = window.SVR_PHASE363_TOGGLE_JOIN;

  window.SVR_PHASE363_JOIN_TABLE = (...args) => {
    if (joinedNow()) return true;
    setJoinedImmediate(true, String(args[0] || 'join-api'));
    let result = false;
    try {
      result = originalJoin(...args);
    } catch (error) {
      setJoinedImmediate(false, 'join-error');
      throw error;
    }
    if (result === false) setJoinedImmediate(false, 'join-rejected');
    queueMicrotask(hideDuplicates);
    return result;
  };

  window.SVR_PHASE363_LEAVE_TABLE = (...args) => {
    setJoinedImmediate(false, String(args[0] || 'leave-api'));
    const result = originalLeave?.(...args);
    queueMicrotask(hideDuplicates);
    window.setTimeout(() => window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.('phase363-leave'), 0);
    return result;
  };

  window.SVR_PHASE363_TOGGLE_JOIN = (...args) => (
    joinedNow()
      ? window.SVR_PHASE363_LEAVE_TABLE(...args)
      : window.SVR_PHASE363_JOIN_TABLE(...args)
  );
  return true;
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

  const joined = joinedNow();
  state.lastAction = joined ? 'leave' : 'join';
  const handler = joined ? window.SVR_PHASE363_LEAVE_TABLE : window.SVR_PHASE363_JOIN_TABLE;
  handler?.(`join-control-${source}`);
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
  setJoinedImmediate(Boolean(window.SVR_PHASE363_STATE?.joined), 'capture-install');
  wrapStateApis();
  window.addEventListener('pointerdown', (event) => activate(event, 'pointerdown'), true);
  window.addEventListener('click', (event) => activate(event, 'click'), true);
  const observer = new MutationObserver(hideDuplicates);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(() => {
    wrapStateApis();
    hideDuplicates();
  }, 120);
  hideDuplicates();
  window.SVR_PHASE363_JOIN_CONTROL_STATE = state;
  window.SVR_PHASE363_JOIN_CONTROL_QA = () => {
    hideDuplicates();
    const legacyAuthority = document.querySelector('#svr347Actions [data-ui="seat"]');
    const modernAuthority = phase372Button();
    const activeAuthority = !joinedNow() && modernAuthority ? modernAuthority : legacyAuthority;
    const visible = [...document.querySelectorAll('button')].filter((button) => {
      if (button.hidden || !button.offsetParent) return false;
      const text = String(button.textContent || '').trim().toUpperCase();
      return ['JOIN TABLE', 'LEAVE TABLE', 'SIT', 'SEAT', 'PLAY GAME', 'LEAVE'].includes(text);
    });
    const label = String(activeAuthority?.textContent || '').trim();
    return {
      ...state,
      joinedImmediate: joinedNow(),
      authorityPresent: Boolean(activeAuthority),
      authorityId: activeAuthority?.id || null,
      visibleJoinControls: visible.length,
      labels: visible.map((button) => String(button.textContent || '').trim()),
      expectedLabel: desiredLabel(),
      labelCorrect: label === desiredLabel(),
      pass: Boolean(activeAuthority && visible.length === 1 && label === desiredLabel()),
      checkedAt: new Date().toISOString()
    };
  };
}

[40, 120, 260, 600].forEach((delay) => setTimeout(install, delay));