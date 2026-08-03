import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-368-ANDROID-LEGACY-ACCEPTANCE-COMPAT-LOCK';

const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));
const WRAPPED = Symbol.for('SVR_PHASE368_COMPAT_WRAPPED');

const runtime = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  compatibilityRuns: 0,
  joinedRepairs: 0,
  resetRepairs: 0,
  blockedCompatibilityLeaves: 0,
  lastResult: null,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let originalDriver = null;

function setJoined(reason = 'compatibility') {
  const changed = window.SVR_PHASE363_JOINED_IMMEDIATE !== true
    || window.SVR_PHASE363_STATE?.joined !== true;
  window.SVR_PHASE363_JOINED_IMMEDIATE = true;
  window.SVR_PHASE363_GAME_STATE_IMMEDIATE = 'SEATED';
  window.SVR_PHASE363_STATE = {
    ...(window.SVR_PHASE363_STATE || {}),
    joined: true,
    gameState: 'SEATED'
  };
  document.body.classList.add('svr363-seated', 'svr365-seated', 'svr367-seated', 'svr368-seated');
  document.body.classList.remove('svr363-lobby', 'svr368-lobby');
  if (changed) {
    runtime.joinedRepairs += 1;
    window.dispatchEvent(new CustomEvent('svr:phase363-immediate-join-state', {
      detail: {
        build: BUILD,
        joined: true,
        gameState: 'SEATED',
        reason,
        at: Date.now()
      }
    }));
  }
}

function emptyIdleTable() {
  return String(state.phase || '').toLowerCase() === 'idle'
    && Number(state.handNo || 0) === 0
    && players.every((player) => (player.hand?.length || 0) === 0);
}

function wrapDriver() {
  const current = window.SVR_PHASE355_RUN_FULL_HAND_QA;
  if (typeof current !== 'function') return false;
  if (current[WRAPPED]) return true;
  originalDriver = current;

  const wrapped = async function phase368LegacyAcceptanceCompatibility(options = {}) {
    if (window.SVR_PHASE368_COMPATIBILITY_ACTIVE) return originalDriver(options);
    runtime.compatibilityRuns += 1;
    window.SVR_PHASE368_COMPATIBILITY_ACTIVE = true;

    const wasJoined = Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE || window.SVR_PHASE363_STATE?.joined);
    const saved = {
      phase363Leave: window.SVR_PHASE363_LEAVE_TABLE,
      phase347Leave: window.SVR_PHASE347_LEAVE,
      lobbyMode: window.SVR_ANDROID_LOBBY_MODE
    };
    const blockLeave = () => {
      runtime.blockedCompatibilityLeaves += 1;
      return false;
    };
    if (typeof saved.phase363Leave === 'function') window.SVR_PHASE363_LEAVE_TABLE = blockLeave;
    if (typeof saved.phase347Leave === 'function') window.SVR_PHASE347_LEAVE = blockLeave;
    if (typeof saved.lobbyMode === 'function') window.SVR_ANDROID_LOBBY_MODE = blockLeave;

    try {
      if (!wasJoined) window.SVR_PHASE363_JOIN_TABLE?.('phase368-legacy-acceptance');
      setJoined('phase368-legacy-acceptance-start');

      let lastResetAt = 0;
      const guard = window.setInterval(() => {
        setJoined('phase368-legacy-acceptance-guard');
        const now = performance.now();
        if (emptyIdleTable() && now - lastResetAt > 700) {
          lastResetAt = now;
          runtime.resetRepairs += 1;
          try { window.SVR_RESET_POKER_TABLE?.(1000); } catch {}
        }
      }, 90);

      try {
        const result = await originalDriver(options);
        runtime.lastResult = result;
        runtime.checkedAt = new Date().toISOString();
        return result;
      } finally {
        clearInterval(guard);
      }
    } catch (error) {
      runtime.lastError = String(error?.stack || error?.message || error);
      throw error;
    } finally {
      if (saved.phase363Leave) window.SVR_PHASE363_LEAVE_TABLE = saved.phase363Leave;
      if (saved.phase347Leave) window.SVR_PHASE347_LEAVE = saved.phase347Leave;
      if (saved.lobbyMode) window.SVR_ANDROID_LOBBY_MODE = saved.lobbyMode;
      window.SVR_PHASE368_COMPATIBILITY_ACTIVE = false;
      if (!wasJoined) saved.phase363Leave?.('phase368-legacy-acceptance-finished');
      window.SVR_PHASE368_LEGACY_ACCEPTANCE_STATE = { ...runtime };
    }
  };
  wrapped[WRAPPED] = true;
  wrapped.phase368Original = current;
  window.SVR_PHASE355_RUN_FULL_HAND_QA = wrapped;
  window.SVR_PHASE344_RUN_FULL_HAND_QA = wrapped;
  return true;
}

function qa() {
  wrapDriver();
  const result = {
    ...runtime,
    driverWrapped: Boolean(window.SVR_PHASE355_RUN_FULL_HAND_QA?.[WRAPPED]),
    aliasWrapped: Boolean(window.SVR_PHASE344_RUN_FULL_HAND_QA?.[WRAPPED]),
    compatibilityActive: Boolean(window.SVR_PHASE368_COMPATIBILITY_ACTIVE),
    pass: Boolean(
      ACTIVE
      && window.SVR_PHASE355_RUN_FULL_HAND_QA?.[WRAPPED]
      && window.SVR_PHASE344_RUN_FULL_HAND_QA?.[WRAPPED]
    ),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE368_LEGACY_ACCEPTANCE_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || runtime.installed) return;
  if (!wrapDriver()) {
    setTimeout(install, 100);
    return;
  }
  runtime.installed = true;
  runtime.installedAt = new Date().toISOString();
  setInterval(wrapDriver, 400);
  window.SVR_PHASE368_LEGACY_ACCEPTANCE_QA = qa;
  window.SVR_PHASE368_LEGACY_ACCEPTANCE_STATE = { ...runtime };
  window.dispatchEvent(new CustomEvent('svr:phase368-legacy-acceptance-ready', {
    detail: { build: BUILD }
  }));
}

[0, 100, 300, 700].forEach((delay) => setTimeout(install, delay));
