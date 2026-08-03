export const BUILD = 'PHASE-364-QUEST-ERIC-QUARANTINE-WATCH';

const params = new URLSearchParams(location.search);
const platform = String(window.SVR_PLATFORM || params.get('platform') || '').toLowerCase();
const ACTIVE = platform === 'quest' || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const state = {
  build: BUILD,
  active: ACTIVE,
  sweeps: 0,
  quarantinedRoots: 0,
  lastSweepAt: null,
  lastError: null
};

let timer = 0;

function sweep() {
  if (!ACTIVE) return state;
  try {
    const result = window.SVR_PHASE364_SANITIZE_NPCS?.() || {};
    state.sweeps += 1;
    state.quarantinedRoots = Math.max(state.quarantinedRoots, Number(result.quarantined || 0));
    state.lastSweepAt = new Date().toISOString();
    state.lastError = null;
  } catch (error) {
    state.lastError = String(error?.message || error);
  }
  window.SVR_PHASE364_ERIC_QUARANTINE_STATE = { ...state };
  return state;
}

if (ACTIVE) {
  sweep();
  timer = window.setInterval(sweep, 260);
  for (const event of ['svr:phase361-ready', 'svr:phase361-table-joined', 'svr:phase348-avatar-ready', 'svr:platform-deferred-ready']) {
    window.addEventListener(event, sweep);
  }
  window.addEventListener('beforeunload', () => window.clearInterval(timer), { once: true });
}

window.SVR_PHASE364_ERIC_QUARANTINE_SWEEP = sweep;
window.SVR_PHASE364_ERIC_QUARANTINE_STATE = { ...state };
