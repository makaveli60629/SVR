// PHASE-87-SITE-GAME-DATA-SYNC-LOCK
// Browser-side API client for SVR Poker.
// Public/game clients never store database passwords, payment secrets, admin secrets, or private service keys.
// This module only talks to the secure SVR backend API at https://api.svrpoker.com unless overridden for local testing.

const DEFAULT_TIMEOUT_MS = 4500;
const SAFE_STORAGE_KEY = 'SVR_API_BASE_URL';
const BUILD_PHASE = 'PHASE-87-SITE-GAME-DATA-SYNC-LOCK';
const DEFAULT_API_BASE = 'https://api.svrpoker.com';

function cleanBaseUrl(value){
  return String(value || '').trim().replace(/\/+$/, '');
}

function safeLocalStorageGet(key){
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function safeLocalStorageSet(key, value){
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch (_) {}
}

function getConfiguredBaseUrl(){
  const params = new URLSearchParams(window.location.search || '');
  const fromQuery = cleanBaseUrl(params.get('api'));
  const fromGlobal = cleanBaseUrl(window.SVR_API_BASE || window.SVR_API_BASE_URL);
  const fromStorage = cleanBaseUrl(safeLocalStorageGet(SAFE_STORAGE_KEY));
  return fromQuery || fromGlobal || fromStorage || DEFAULT_API_BASE;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

function queueOfflineEvent(event){
  try {
    const key = 'SVR_OFFLINE_EVENTS';
    const old = JSON.parse(localStorage.getItem(key) || '[]');
    old.push({ ...event, queuedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(old.slice(-120)));
  } catch (_) {}
}

export function createDatabaseClient({ log = console.log, statusCb = () => {} } = {}){
  let apiBase = getConfiguredBaseUrl();
  const state = {
    phase: BUILD_PHASE,
    configured: Boolean(apiBase),
    apiBasePublic: apiBase ? apiBase.replace(/^https?:\/\//, '') : '',
    status: apiBase ? 'checking' : 'safe-local-mode',
    database: 'unknown',
    siteBridge: 'ready',
    lastHealthAt: null,
    lastError: null,
  };

  function publish(next = {}){
    Object.assign(state, next);
    window.SVR_DATABASE_STATE = { ...state };
    statusCb({ ...state });
    return { ...state };
  }

  function setApiBase(url){
    apiBase = cleanBaseUrl(url) || DEFAULT_API_BASE;
    safeLocalStorageSet(SAFE_STORAGE_KEY, apiBase === DEFAULT_API_BASE ? '' : apiBase);
    return publish({
      configured: Boolean(apiBase),
      apiBasePublic: apiBase.replace(/^https?:\/\//, ''),
      status: apiBase ? 'configured' : 'safe-local-mode'
    });
  }

  async function health(){
    if (!apiBase){
      return publish({ configured: false, status: 'safe-local-mode', database: 'not-connected', lastHealthAt: new Date().toISOString(), lastError: null });
    }
    try {
      const res = await fetchWithTimeout(`${apiBase}/api/health`);
      const data = await res.json().catch(() => ({}));
      const ok = Boolean(data.ok === true || data.status === 'ok');
      return publish({
        configured: true,
        status: ok ? 'online' : 'api-error',
        database: data.database || (ok ? 'connected-or-ready' : 'failed'),
        lastHealthAt: new Date().toISOString(),
        lastError: ok ? null : (data.error || data.message || `HTTP ${res.status}`),
      });
    } catch (error){
      log('[SVR API] health check failed', error?.message || error);
      return publish({ configured: true, status: 'offline', database: 'unknown', lastHealthAt: new Date().toISOString(), lastError: error?.message || String(error) });
    }
  }

  async function postGameEvent(type, payload = {}){
    const event = {
      type,
      payload,
      phase: BUILD_PHASE,
      at: new Date().toISOString(),
      path: location.pathname,
      ua: navigator.userAgent,
      source: 'game'
    };
    if (!apiBase){
      queueOfflineEvent(event);
      return { ok: false, queued: true, reason: 'api-not-configured' };
    }
    try {
      const res = await fetchWithTimeout(`${apiBase}/api/game/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json().catch(() => ({ ok: true }));
    } catch (error){
      queueOfflineEvent(event);
      return { ok: false, queued: true, error: error?.message || String(error) };
    }
  }

  async function getPublicPayload(path, fallback = null){
    if (!apiBase) return fallback;
    try {
      const res = await fetchWithTimeout(`${apiBase}${path}`, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error){
      log('[SVR API] public payload failed', path, error?.message || error);
      return fallback;
    }
  }

  const client = {
    getState: () => ({ ...state }),
    setApiBase,
    health,
    postGameEvent,
    getProfile: () => getPublicPayload('/api/game/player/profile', null),
    getRooms: () => getPublicPayload('/api/game/rooms', []),
    getAds: () => getPublicPayload('/api/ads', []),
  };
  window.SVR_DATABASE_CLIENT = client;
  publish();
  return client;
}
