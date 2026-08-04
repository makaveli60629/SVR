export const BUILD = 'PHASE-369-ANDROID-JOIN-INTENT-BRIDGE-LOCK';

const ACTIVE = (window.SVR_PLATFORM || document.body?.dataset?.platform || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname);

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  pendingAtInstall: false,
  replayAttempts: 0,
  replaySuccesses: 0,
  legacyJoinRedirects: 0,
  legacyLeavePassThroughs: 0,
  lastReplayAt: null,
  lastError: null,
  checkedAt: null
};

let replayPromise = null;
let legacyListener = null;

const isJoined = () => Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE ?? window.SVR_PHASE363_STATE?.joined);

async function replayPendingJoin(reason = 'pending-intent') {
  if (!ACTIVE || !window.SVR_PHASE369_PENDING_JOIN) return false;
  if (replayPromise) return replayPromise;
  replayPromise = (async () => {
    state.replayAttempts += 1;
    try {
      window.SVR_PHASE369_PENDING_JOIN = false;
      const joined = await window.SVR_PHASE369_JOIN_TABLE?.();
      if (joined === false) {
        window.SVR_PHASE369_PENDING_JOIN = true;
        return false;
      }
      state.replaySuccesses += 1;
      state.lastReplayAt = new Date().toISOString();
      state.lastError = null;
      return true;
    } catch (error) {
      window.SVR_PHASE369_PENDING_JOIN = true;
      state.lastError = String(error?.message || error);
      return false;
    } finally {
      state.checkedAt = new Date().toISOString();
      window.SVR_PHASE369_JOIN_INTENT_STATE = { ...state, reason };
      replayPromise = null;
    }
  })();
  return replayPromise;
}

function installLegacyJoinRedirect() {
  if (legacyListener) return;
  legacyListener = (event) => {
    const button = event.target?.closest?.('#svr347Actions [data-ui="seat"]');
    if (!button) return;
    if (isJoined()) {
      state.legacyLeavePassThroughs += 1;
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    state.legacyJoinRedirects += 1;
    window.SVR_PHASE369_PENDING_JOIN = true;
    replayPendingJoin('legacy-phase347-join-redirect');
  };
  document.addEventListener('click', legacyListener, true);
}

function install() {
  if (!ACTIVE || state.installed) return;
  state.installed = true;
  state.pendingAtInstall = Boolean(window.SVR_PHASE369_PENDING_JOIN);
  installLegacyJoinRedirect();
  window.SVR_PHASE369_REPLAY_PENDING_JOIN = replayPendingJoin;
  window.SVR_PHASE369_JOIN_INTENT_QA = () => ({
    ...state,
    pending: Boolean(window.SVR_PHASE369_PENDING_JOIN),
    readinessBound: document.querySelectorAll('#svr369Join[data-svr369-readiness-bound]').length === 1,
    authoritativeSeatButtons: document.querySelectorAll('#svr347Actions [data-ui="seat"]').length,
    legacyJoinRedirectReady: Boolean(legacyListener),
    pass: Boolean(
      ACTIVE
      && typeof window.SVR_PHASE369_JOIN_TABLE === 'function'
      && document.querySelectorAll('#svr369Join[data-svr369-readiness-bound]').length === 1
      && document.querySelectorAll('#svr347Actions [data-ui="seat"]').length === 1
      && legacyListener
      && !state.lastError
    ),
    checkedAt: new Date().toISOString()
  });
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE369_JOIN_INTENT_STATE = { ...state };
  if (window.SVR_PHASE369_PENDING_JOIN) queueMicrotask(() => replayPendingJoin('install-replay'));
  window.dispatchEvent(new CustomEvent('svr:phase369-join-intent-ready', { detail: window.SVR_PHASE369_JOIN_INTENT_QA() }));
}

install();
window.addEventListener('beforeunload', () => {
  if (legacyListener) document.removeEventListener('click', legacyListener, true);
}, { once: true });
