import { account } from './phase345-player-account-client.js?v=phase366';

const BUILD = 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK';
const DEMO_KEY = 'svr_phase345_demo_player_v1';
const DEFAULT_AVATAR_URL = new URL('/game/assets/models/eric/eric.fbx', location.origin).href;
const DEFAULT_OUTFIT = Object.freeze({
  schemaVersion: 1,
  modelId: 'eric',
  palette: 'midnight',
  headwear: 'none',
  eyewear: 'none',
  top: 'none',
  shoes: 'none',
  accessory: 'none'
});
const FALLBACK_CONFIG = Object.freeze({
  apiBase: '',
  allowDemoFallback: true,
  dailyRewardChips: 5000,
  minimumActivitySeconds: 300
});
const originalBootstrap = account.bootstrap.bind(account);
const originalContinueDemo = account.continueDemo.bind(account);
let bootstrapPromise = null;
let fallbackCount = 0;
let profileMigrations = 0;

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

function normalizeProfile(profile) {
  if (!profile) return null;
  const outfit = profile.equippedOutfit && Object.keys(profile.equippedOutfit).length
    ? { ...DEFAULT_OUTFIT, ...profile.equippedOutfit, modelId: 'eric', top: 'none', headwear: 'none', eyewear: 'none', shoes: 'none', accessory: 'none' }
    : { ...DEFAULT_OUTFIT };
  const avatarUrl = !profile.avatarUrl || /avatar-default|mannequin|placeholder/i.test(String(profile.avatarUrl))
    ? DEFAULT_AVATAR_URL
    : profile.avatarUrl;
  const changed = avatarUrl !== profile.avatarUrl || JSON.stringify(outfit) !== JSON.stringify(profile.equippedOutfit || {});
  const next = { ...profile, avatarUrl, equippedOutfit: outfit };
  if (changed) {
    profileMigrations += 1;
    account.state.profile = next;
    if (account.state.mode === 'demo' || profile.demoMode) localStorage.setItem(DEMO_KEY, JSON.stringify(next));
  }
  return next;
}

function timeout(milliseconds) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('ACCOUNT_BOOTSTRAP_TIMEOUT')), milliseconds);
  });
}

function forceLocalResolution(error) {
  fallbackCount += 1;
  const profile = normalizeProfile(safeJson(localStorage.getItem(DEMO_KEY), null));
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
  if (account.state.ready && account.state.mode !== 'loading') {
    normalizeProfile(account.state.profile);
    return snapshot();
  }
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = Promise.race([originalBootstrap(), timeout(4500)])
    .then((result) => {
      normalizeProfile(account.state.profile);
      publish(account.state.profile ? 'change' : 'ready');
      return result;
    })
    .catch(forceLocalResolution)
    .finally(() => { bootstrapPromise = null; });
  return bootstrapPromise;
};

account.continueDemo = function phase384ContinueDemo(displayName = 'Demo Player') {
  const result = originalContinueDemo(displayName);
  normalizeProfile(account.state.profile);
  publish('change');
  return snapshot() || result;
};

window.SVR_PHASE366_ACCOUNT_QA = () => ({
  build: BUILD,
  successor: 'PHASE-384-ERIC-DEFAULT-AVATAR-SITE-LOCK',
  ready: Boolean(account.state.ready),
  mode: account.state.mode,
  profile: Boolean(account.state.profile),
  defaultEric: account.state.profile?.avatarUrl === DEFAULT_AVATAR_URL,
  generatedBoxClothingDisabled: account.state.profile?.equippedOutfit?.top === 'none',
  profileMigrations,
  fallbackCount,
  lastError: account.state.lastError,
  pass: Boolean(account.state.ready && account.state.mode !== 'loading'),
  checkedAt: new Date().toISOString()
});

export { account, BUILD };
