(() => {
  'use strict';

  const PHASE = 'SITE-ADMIN-STATUS-BRIDGE-V1';
  const DEFAULT_API_BASE = '';
  const SESSION_KEY = 'SVR_ADMIN_SESSION';
  const API_KEY = 'SVR_API_BASE';
  const TIMEOUT_MS = 2800;

  function getApiBase(){
    const explicit = (window.SVR_API_BASE || localStorage.getItem(API_KEY) || DEFAULT_API_BASE || '').trim();
    return explicit.replace(/\/$/, '');
  }

  function now(){ return Date.now(); }

  function readSession(){
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.expiresAt || data.expiresAt < now()){
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return data;
    } catch (_) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function writeSession({ email, role }){
    const session = {
      email: email || 'admin@svrpoker.com',
      role: role || 'Owner',
      loggedIn: true,
      createdAt: now(),
      expiresAt: now() + 1000 * 60 * 60 * 8
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession(){
    localStorage.removeItem(SESSION_KEY);
  }

  function withTimeout(promise, ms){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return promise(controller.signal).finally(() => clearTimeout(timer));
  }

  async function getJson(path){
    const base = getApiBase();
    const url = base + path;
    const res = await withTimeout((signal) => fetch(url, { signal, cache: 'no-store', credentials: 'include' }), TIMEOUT_MS);
    if (!res.ok) throw new Error(path + ' returned ' + res.status);
    return res.json().catch(() => ({}));
  }

  function normalizeOnline(value){
    if (value === true) return true;
    if (typeof value === 'string') return /online|ok|connected|ready|true/i.test(value);
    return false;
  }

  function setChip(el, online, label){
    if (!el) return;
    const text = label || (online ? 'Online' : 'Offline');
    el.textContent = text;
    el.classList.toggle('online', !!online);
    el.classList.toggle('offline', !online);
    el.dataset.status = online ? 'online' : 'offline';
  }

  function setStack(status){
    document.querySelectorAll('.svr-status-stack').forEach((stack) => {
      const spans = Array.from(stack.querySelectorAll('span'));
      const admin = spans[0];
      const server = spans[1];
      const database = spans[2];
      setChip(admin, status.adminOnline, status.adminOnline ? 'ADMIN ONLINE' : 'ADMIN OFFLINE');
      setChip(server, status.serverOnline, status.serverOnline ? 'SERVER ONLINE' : 'SERVER OFFLINE');
      setChip(database, status.databaseOnline, status.databaseOnline ? 'DATABASE ONLINE' : 'DATABASE OFFLINE');
      stack.classList.toggle('online', !!(status.adminOnline && status.serverOnline && status.databaseOnline));
      stack.classList.toggle('offline', !(status.adminOnline && status.serverOnline && status.databaseOnline));
      stack.title = status.message || '';
    });

    document.querySelectorAll('.status-pill,.system-status-badge').forEach((pill) => {
      if (/admin/i.test(pill.textContent || '')) setChip(pill, status.adminOnline, status.adminOnline ? 'ADMIN ONLINE' : 'ADMIN OFFLINE');
    });

    document.querySelectorAll('.status-check,.tile,.card').forEach((card) => {
      const title = (card.querySelector('strong,h3,h2')?.textContent || '').trim().toLowerCase();
      const pill = card.querySelector('.pill,span');
      if (!title || !pill) return;
      if (title.includes('admin')) setChip(pill, status.adminOnline);
      if (title.includes('server')) setChip(pill, status.serverOnline);
      if (title.includes('database')) setChip(pill, status.databaseOnline);
    });

    const banner = document.querySelector('[data-admin-connection-note]');
    if (banner) banner.textContent = status.message || '';
  }

  async function checkStatus(){
    const session = readSession();
    const status = {
      adminOnline: !!session,
      serverOnline: false,
      databaseOnline: false,
      session,
      message: session ? 'Admin session active in this browser.' : 'Admin is offline until an owner/admin logs in.'
    };

    try {
      const health = await getJson('/api/health');
      status.serverOnline = normalizeOnline(health.status || health.server || health.ok || true);
      status.databaseOnline = normalizeOnline(health.database || health.db || health.sql || health.databaseStatus);
      status.message = status.serverOnline
        ? 'Backend health endpoint responded.'
        : status.message;
    } catch (error) {
      status.serverOnline = false;
      status.databaseOnline = false;
      status.message = 'Backend API not reachable from this page. Showing offline instead of fake online.';
    }

    try {
      const admin = await getJson('/api/admin/status');
      if ('isOnline' in admin || 'online' in admin || 'adminOnline' in admin){
        status.adminOnline = normalizeOnline(admin.isOnline ?? admin.online ?? admin.adminOnline);
        if (status.adminOnline) status.message = 'Admin status confirmed by backend.';
      }
    } catch (_) {
      // No backend admin endpoint yet. Local owner/admin session remains the only admin-online signal.
    }

    setStack(status);
    window.SVR_ADMIN_STATUS = { phase: PHASE, status, refresh: checkStatus, login: writeSession, logout: clearSession, apiBase: getApiBase() };
    return status;
  }

  function attachLogin(){
    const form = document.querySelector('[data-admin-login-form]') || document.querySelector('form.form');
    if (!form) return;
    const note = document.querySelector('[data-login-note]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = form.querySelector('input[type="email"]')?.value?.trim() || 'admin@svrpoker.com';
      const role = form.querySelector('select')?.value || 'Owner';
      const adminRole = /owner|admin|moderator/i.test(role);
      if (!adminRole){
        clearSession();
        if (note) note.textContent = 'Player login staged. Admin remains offline.';
        checkStatus();
        return;
      }
      writeSession({ email, role });
      if (note) note.textContent = 'Admin session connected in this browser. Redirecting to profile...';
      checkStatus().finally(() => setTimeout(() => { location.href = 'profile.html?v=admin-status-bridge'; }, 350));
    });
  }

  function boot(){
    attachLogin();
    checkStatus();
    setInterval(checkStatus, 30000);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
