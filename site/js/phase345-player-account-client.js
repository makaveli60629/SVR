const BUILD = 'PHASE-345-PLAYER-LOGIN-PROFILE-DAILY-REWARD-API-LOCK';
const CONFIG_URL = '/site/config/player-api.json';
const DEMO_KEY = 'svr_phase345_demo_player_v1';
const SESSION_KEY = 'svr_phase345_demo_session_v1';

const state = {
  build: BUILD,
  ready: false,
  mode: 'loading',
  config: null,
  profile: null,
  apiHealthy: false,
  session: null,
  lastError: null,
  checkedAt: null
};

function emit(type = 'change') {
  state.checkedAt = new Date().toISOString();
  window.SVR_PLAYER_ACCOUNT_STATE = snapshot();
  window.dispatchEvent(new CustomEvent(`svr:account-${type}`, { detail: snapshot() }));
}
function snapshot() {
  return {
    build: BUILD,
    ready: state.ready,
    mode: state.mode,
    apiConfigured: Boolean(state.config?.apiBase),
    apiHealthy: state.apiHealthy,
    profile: state.profile ? { ...state.profile } : null,
    session: state.session ? { ...state.session } : null,
    lastError: state.lastError,
    checkedAt: state.checkedAt
  };
}
function safeJson(value, fallback = null) {
  try { return JSON.parse(value); } catch { return fallback; }
}
function readDemoProfile() {
  return safeJson(localStorage.getItem(DEMO_KEY), null);
}
function writeDemoProfile(profile) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(profile));
  return profile;
}
function defaultDemoProfile(name = 'Demo Player') {
  const now = new Date().toISOString();
  return {
    playerId: `demo-${crypto.randomUUID?.() || Date.now()}`,
    displayName: String(name || 'Demo Player').slice(0, 40),
    email: '',
    role: 'player',
    playMoney: 50000,
    dailyStreak: 0,
    lastRewardClaim: null,
    avatarUrl: null,
    equippedOutfit: {},
    inventory: [],
    createdAt: now,
    lastLoginAt: now,
    demoMode: true
  };
}
async function loadConfig() {
  if (state.config) return state.config;
  try {
    const response = await fetch(`${CONFIG_URL}?v=phase345`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Config ${response.status}`);
    state.config = await response.json();
  } catch (error) {
    state.config = { apiBase: '', allowDemoFallback: true, dailyRewardChips: 5000, minimumActivitySeconds: 300 };
    state.lastError = String(error?.message || error);
  }
  state.config.apiBase = String(state.config.apiBase || '').replace(/\/$/, '');
  return state.config;
}
async function request(path, options = {}) {
  const config = await loadConfig();
  if (!config.apiBase) throw new Error('PLAYER_API_NOT_CONFIGURED');
  const response = await fetch(`${config.apiBase}${path}`, {
    method: options.method || 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-SVR-Client': BUILD,
      ...(options.headers || {})
    },
    body: options.body == null ? undefined : JSON.stringify(options.body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || payload.message || `API ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}
function setProfile(profile, mode) {
  state.profile = profile || null;
  state.mode = mode;
  state.ready = true;
  emit('change');
  updateAccountPill();
  return snapshot();
}

async function health() {
  try {
    const result = await request('/health');
    state.apiHealthy = result?.status === 'ok';
    return result;
  } catch (error) {
    state.apiHealthy = false;
    state.lastError = String(error?.message || error);
    return null;
  }
}
async function bootstrap() {
  await loadConfig();
  if (state.config.apiBase) {
    await health();
    if (state.apiHealthy) {
      try {
        const result = await request('/player/profile');
        return setProfile(result.profile || result, 'api');
      } catch (error) {
        if (error.status !== 401) state.lastError = String(error?.message || error);
      }
    }
  }
  const demo = readDemoProfile();
  if (demo) return setProfile(demo, 'demo');
  state.ready = true;
  state.mode = state.config.apiBase ? 'signed-out' : 'unconfigured';
  emit('ready');
  updateAccountPill();
  return snapshot();
}
async function login({ email, password }) {
  const result = await request('/auth/login', { method: 'POST', body: { email, password } });
  state.apiHealthy = true;
  return setProfile(result.profile, 'api');
}
async function register({ displayName, email, password }) {
  const result = await request('/auth/register', { method: 'POST', body: { displayName, email, password } });
  state.apiHealthy = true;
  return setProfile(result.profile, 'api');
}
async function logout() {
  if (state.mode === 'api') {
    try { await request('/auth/logout', { method: 'POST' }); } catch {}
  }
  if (state.mode === 'demo') localStorage.removeItem(DEMO_KEY);
  state.profile = null;
  state.session = null;
  state.mode = state.config?.apiBase ? 'signed-out' : 'unconfigured';
  emit('change');
  updateAccountPill();
  return snapshot();
}
function continueDemo(displayName = 'Demo Player') {
  const existing = readDemoProfile();
  const profile = existing || defaultDemoProfile(displayName);
  profile.displayName = String(displayName || profile.displayName || 'Demo Player').slice(0, 40);
  profile.lastLoginAt = new Date().toISOString();
  writeDemoProfile(profile);
  return setProfile(profile, 'demo');
}
async function refreshProfile() {
  if (state.mode === 'api') {
    const result = await request('/player/profile');
    return setProfile(result.profile || result, 'api');
  }
  if (state.mode === 'demo') return setProfile(readDemoProfile(), 'demo');
  return snapshot();
}
async function updateProfile(patch = {}) {
  const allowed = {
    displayName: patch.displayName,
    avatarUrl: patch.avatarUrl,
    equippedOutfit: patch.equippedOutfit
  };
  if (state.mode === 'api') {
    const result = await request('/player/profile', { method: 'PUT', body: allowed });
    return setProfile(result.profile, 'api');
  }
  if (state.mode === 'demo') {
    const profile = { ...state.profile, ...allowed, updatedAt: new Date().toISOString() };
    writeDemoProfile(profile);
    return setProfile(profile, 'demo');
  }
  throw new Error('NOT_SIGNED_IN');
}
async function rewardStatus() {
  if (state.mode === 'api') return request('/rewards/daily/status');
  const today = new Date().toISOString().slice(0, 10);
  const claimed = String(state.profile?.lastRewardClaim || '').slice(0, 10) === today;
  const session = safeJson(sessionStorage.getItem(SESSION_KEY), null);
  return {
    eligible: !claimed && Number(session?.activeSeconds || 0) >= Number(state.config?.minimumActivitySeconds || 300),
    claimed,
    activeSeconds: Number(session?.activeSeconds || 0),
    requiredSeconds: Number(state.config?.minimumActivitySeconds || 300),
    rewardChips: Number(state.config?.dailyRewardChips || 5000),
    demoMode: true
  };
}
async function claimDailyReward() {
  if (state.mode === 'api') {
    const result = await request('/rewards/daily/claim', { method: 'POST' });
    if (result.profile) setProfile(result.profile, 'api');
    return result;
  }
  if (state.mode === 'demo') {
    const status = await rewardStatus();
    if (!status.eligible) throw new Error(status.claimed ? 'REWARD_ALREADY_CLAIMED' : 'MORE_ACTIVITY_REQUIRED');
    const profile = {
      ...state.profile,
      playMoney: Number(state.profile.playMoney || 0) + status.rewardChips,
      dailyStreak: Number(state.profile.dailyStreak || 0) + 1,
      lastRewardClaim: new Date().toISOString(),
      demoMode: true
    };
    writeDemoProfile(profile);
    setProfile(profile, 'demo');
    return { claimed: true, rewardChips: status.rewardChips, profile, demoMode: true };
  }
  throw new Error('NOT_SIGNED_IN');
}
async function startActivitySession(platform = 'web', metadata = {}) {
  if (!state.profile) return null;
  if (state.mode === 'api') {
    const result = await request('/game/session/start', { method: 'POST', body: { platform, metadata } });
    state.session = result.session;
  } else {
    state.session = {
      sessionId: `demo-session-${crypto.randomUUID?.() || Date.now()}`,
      platform,
      startedAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      activeSeconds: 0,
      heartbeatCount: 0,
      demoMode: true
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
  }
  emit('session');
  return state.session;
}
async function heartbeat(metadata = {}) {
  if (!state.session) return null;
  if (state.mode === 'api') {
    const result = await request('/game/session/heartbeat', { method: 'POST', body: { sessionId: state.session.sessionId, metadata } });
    state.session = result.session;
  } else {
    const now = Date.now();
    const last = Date.parse(state.session.lastHeartbeatAt || state.session.startedAt || new Date().toISOString());
    const delta = Math.max(0, Math.min(75, Math.round((now - last) / 1000)));
    state.session.activeSeconds = Number(state.session.activeSeconds || 0) + delta;
    state.session.heartbeatCount = Number(state.session.heartbeatCount || 0) + 1;
    state.session.lastHeartbeatAt = new Date(now).toISOString();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
  }
  emit('session');
  return state.session;
}
async function endActivitySession(metadata = {}) {
  if (!state.session) return null;
  let result = null;
  if (state.mode === 'api') {
    result = await request('/game/session/end', { method: 'POST', body: { sessionId: state.session.sessionId, metadata } });
  } else {
    await heartbeat(metadata);
    result = { session: { ...state.session, endedAt: new Date().toISOString() }, demoMode: true };
  }
  state.session = null;
  sessionStorage.removeItem(SESSION_KEY);
  emit('session');
  return result;
}
function ensureAccountPill() {
  if (document.getElementById('svr345AccountPill')) return;
  const style = document.createElement('style');
  style.id = 'svr345-account-style';
  style.textContent = `#svr345AccountPill{position:fixed;top:max(10px,env(safe-area-inset-top));right:12px;z-index:2147483500;display:flex;align-items:center;gap:8px;border:1px solid rgba(127,252,255,.58);border-radius:999px;background:rgba(0,0,0,.78);backdrop-filter:blur(10px);padding:7px 10px;color:#fff;text-decoration:none;font:900 11px system-ui,Arial;letter-spacing:.04em;box-shadow:0 8px 24px rgba(0,0,0,.32)}#svr345AccountPill[data-mode="api"]{border-color:rgba(141,255,180,.7)}#svr345AccountPill[data-mode="demo"]{border-color:rgba(255,217,138,.72)}#svr345AccountDot{width:8px;height:8px;border-radius:50%;background:#ff5b8c;box-shadow:0 0 12px currentColor}#svr345AccountPill[data-mode="api"] #svr345AccountDot{background:#8dffb4}#svr345AccountPill[data-mode="demo"] #svr345AccountDot{background:#ffd98a}`;
  document.head.appendChild(style);
  const pill = document.createElement('a');
  pill.id = 'svr345AccountPill';
  pill.href = '/site/login.html';
  pill.innerHTML = '<span id="svr345AccountDot"></span><span id="svr345AccountText">LOGIN</span>';
  document.body.appendChild(pill);
}
function updateAccountPill() {
  ensureAccountPill();
  const pill = document.getElementById('svr345AccountPill');
  const text = document.getElementById('svr345AccountText');
  if (!pill || !text) return;
  pill.dataset.mode = state.mode;
  if (state.profile) {
    text.textContent = `${state.profile.displayName}${state.mode === 'demo' ? ' • DEMO' : ''}`;
    pill.href = '/site/profile.html';
  } else {
    text.textContent = state.config?.apiBase ? 'LOGIN' : 'LOGIN • API SETUP';
    pill.href = '/site/login.html';
  }
}

export const account = {
  BUILD,
  state,
  snapshot,
  bootstrap,
  health,
  login,
  register,
  logout,
  continueDemo,
  refreshProfile,
  updateProfile,
  rewardStatus,
  claimDailyReward,
  startActivitySession,
  heartbeat,
  endActivitySession
};

window.SVR_PLAYER_ACCOUNT = account;
bootstrap().catch((error) => {
  state.ready = true;
  state.mode = 'error';
  state.lastError = String(error?.message || error);
  emit('error');
});
