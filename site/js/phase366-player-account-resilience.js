import { account } from './phase345-player-account-client.js?v=phase366';

const BUILD = 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK';
const DEMO_KEY = 'svr_phase345_demo_player_v1';
const FALLBACK_CONFIG = Object.freeze({
  apiBase: '',
  allowDemoFallback: true,
  dailyRewardChips: 5000,
  minimumActivitySeconds: 300
});
const originalBootstrap = account.bootstrap.bind(account);
let bootstrapPromise = null;
let fallbackCount = 0;

function safeJson(value, fallback = null) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function snapshot() {
  return account.snapshot();
}

function publish(type = 'change') {
  account.state.checkedAt = new Date().toISOString();
  window.SVR_PLAYER_ACCOUNT_STATE = snapshot();
  window.dispatchEvent(new CustomEvent(`svr:account-${type}`, { detail: snapshot() }));
}

function timeout(milliseconds) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('ACCOUNT_BOOTSTRAP_TIMEOUT')), milliseconds);
  });
}

function forceLocalResolution(error) {
  fallbackCount += 1;
  const profile = safeJson(localStorage.getItem(DEMO_KEY), null);
  account.state.config = account.state.config || { ...FALLBACK_CONFIG };
  account.state.profile = profile;
  account.state.mode = profile ? 'demo' : 'unconfigured';
  account.state.ready = true;
  account.state.apiHealthy = false;
  account.state.lastError = String(error?.message || error || 'ACCOUNT_BOOTSTRAP_TIMEOUT');
  publish(profile ? 'change' : 'ready');
  return snapshot();
}

account.bootstrap = async function resilientBootstrap() {
  if (account.state.ready && account.state.mode !== 'loading') return snapshot();
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = Promise.race([originalBootstrap(), timeout(4500)])
    .catch(forceLocalResolution)
    .finally(() => { bootstrapPromise = null; });
  return bootstrapPromise;
};

window.SVR_PHASE366_ACCOUNT_QA = () => ({
  build: BUILD,
  ready: Boolean(account.state.ready),
  mode: account.state.mode,
  profile: Boolean(account.state.profile),
  fallbackCount,
  lastError: account.state.lastError,
  pass: Boolean(account.state.ready && account.state.mode !== 'loading'),
  checkedAt: new Date().toISOString()
});

export { account, BUILD };
