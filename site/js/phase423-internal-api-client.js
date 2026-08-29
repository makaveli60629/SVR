/* PHASE-423-INTERNAL-API-CLIENT-LOCK */
(() => {
  'use strict';

  const BUILD = 'PHASE-423-INTERNAL-API-CLIENT-LOCK';
  const BASE_KEY = 'svr_internal_api_base';
  const TOKEN_KEY = 'svr_admin_api_token';
  const DEFAULT_BASE = 'https://api.svrpoker.com';

  function normalizeBase(value) {
    const raw = String(value || '').trim().replace(/\/+$/, '');
    if (!raw) return '';
    try {
      const url = new URL(raw, location.origin);
      const local = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(url.hostname);
      if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return '';
      return url.origin + url.pathname.replace(/\/$/, '');
    } catch {
      return '';
    }
  }

  function getBase() {
    const runtime = normalizeBase(window.SVR_AWS_API_BASE || window.SVR_API_BASE);
    const saved = normalizeBase(localStorage.getItem(BASE_KEY));
    return runtime || saved || DEFAULT_BASE;
  }

  function setBase(value) {
    const base = normalizeBase(value);
    if (!base) throw new Error('Enter a valid HTTPS API base URL. Localhost HTTP is allowed for development only.');
    localStorage.setItem(BASE_KEY, base);
    return base;
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    const value = String(token || '').trim();
    if (value) sessionStorage.setItem(TOKEN_KEY, value);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function logout() {
    setToken('');
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
    if (!('AbortController' in window)) return fetch(url, options);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function request(path, options = {}) {
    const base = getBase();
    const target = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(options.headers || {});
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (options.admin) {
      const token = getToken();
      if (!token) throw new Error('ADMIN_AUTH_REQUIRED');
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetchWithTimeout(target, {
      method: options.method || 'GET',
      cache: options.cache || 'no-store',
      credentials: 'omit',
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    }, options.timeoutMs || 7000);
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
    }
    if (!response.ok) {
      const error = new Error(data?.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data ?? { ok: true, status: response.status };
  }

  async function login({ email, password }) {
    const data = await request('/api/admin/login', {
      method: 'POST',
      body: { email: String(email || '').trim(), password: String(password || '') }
    });
    if (!data?.token) throw new Error('Admin API did not return a session token.');
    setToken(data.token);
    return data;
  }

  const api = Object.freeze({
    build: BUILD,
    getBase,
    setBase,
    getToken,
    isAuthenticated: () => Boolean(getToken()),
    login,
    logout,
    request,
    health: () => request('/api/health'),
    adminStatus: () => request('/api/admin/status'),
    storeItems: () => request('/api/store/items'),
    analyticsSummary: () => request('/api/admin/analytics/summary', { admin: true }),
    analyticsEvents: () => request('/api/admin/analytics/events', { admin: true }),
    messages: () => request('/api/messages/admin', { admin: true }),
    leads: () => request('/api/admin/leads', { admin: true }),
    gameEvents: () => request('/api/admin/game/events', { admin: true }),
    adminStoreItems: () => request('/api/admin/store/items', { admin: true }),
    adminLogs: () => request('/api/admin/logs', { admin: true })
  });

  window.SVR_INTERNAL_API = api;
  window.dispatchEvent(new CustomEvent('svr:internal-api-ready', { detail: { build: BUILD, base: getBase() } }));
})();
