// PHASE-85-ESPRESSO-BANNER-RESTORE-LOCK
// Browser-side API client for SVR Poker.
// IMPORTANT: this module never stores SQL passwords, Stripe secrets, or admin secrets.
// It only calls a secure backend API such as Azure App Service, Azure Functions, or AWS API.

const DEFAULT_TIMEOUT_MS = 4500;
const SAFE_STORAGE_KEY = 'SVR_API_BASE_URL';

function cleanBaseUrl(value){
  return String(value || '').trim().replace(/\/+$/, '');
}

function getConfiguredBaseUrl(){
  const params = new URLSearchParams(window.location.search || '');
  const fromQuery = cleanBaseUrl(params.get('api'));
  const fromGlobal = cleanBaseUrl(window.SVR_API_BASE_URL);
  const fromStorage = cleanBaseUrl(localStorage.getItem(SAFE_STORAGE_KEY));
  return fromQuery || fromGlobal || fromStorage || '';
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
    localStorage.setItem(key, JSON.stringify(old.slice(-80)));
  } catch (_) {}
}

export function createDatabaseClient({ log = console.log, statusCb = () => {} } = {}){
  let apiBase = getConfiguredBaseUrl();
  const state = {
    phase: 'PHASE-85-ESPRESSO-BANNER-RESTORE-LOCK',
    configured: Boolean(apiBase),
    apiBasePublic: apiBase ? apiBase.replace(/^https?:\/\//, '') : '',
    status: apiBase ? 'checking' : 'safe-local-mode',
    database: 'unknown',
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
    apiBase = cleanBaseUrl(url);
    if (apiBase) localStorage.setItem(SAFE_STORAGE_KEY, apiBase);
    else localStorage.removeItem(SAFE_STORAGE_KEY);
    return publish({ configured: Boolean(apiBase), apiBasePublic: apiBase.replace(/^https?:\/\//, ''), status: apiBase ? 'configured' : 'safe-local-mode' });
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
        database: data.database || (ok ? 'unknown' : 'failed'),
        lastHealthAt: new Date().toISOString(),
        lastError: ok ? null : (data.error || data.message || `HTTP ${res.status}`),
      });
    } catch (error){
      log('[SVR DB] health check failed', error?.message || error);
      return publish({ configured: true, status: 'offline', database: 'unknown', lastHealthAt: new Date().toISOString(), lastError: error?.message || String(error) });
    }
  }

  async function postGameEvent(type, payload = {}){
    const event = {
      type,
      payload,
      phase: 'PHASE-85-ESPRESSO-BANNER-RESTORE-LOCK',
      at: new Date().toISOString(),
      path: location.pathname,
      ua: navigator.userAgent,
    };
    if (!apiBase){
      queueOfflineEvent(event);
      return { ok: false, queued: true, reason: 'api-not-configured' };
    }
    try {
      const res = await fetchWithTimeout(`${apiBase}/api/game/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json().catch(() => ({ ok: true }));
    } catch (error){
      queueOfflineEvent(event);
      return { ok: false, queued: true, error: error?.message || String(error) };
    }
  }

  const client = { getState: () => ({ ...state }), setApiBase, health, postGameEvent };
  window.SVR_DATABASE_CLIENT = client;
  publish();
  return client;
}
